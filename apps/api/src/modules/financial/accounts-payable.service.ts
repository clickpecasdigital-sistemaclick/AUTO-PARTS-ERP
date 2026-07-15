import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { CreatePayableDto, QueryFinancialDocumentDto, RenegotiateDto, SettleDto } from './dto/financial-document.dto';
import type { RequestContext } from '@/common/types/request-context';

const INCLUDE = {
  supplier: { select: { id: true, name: true, tradeName: true } },
  costCenter: true,
  chartOfAccount: true,
  bankAccount: { select: { id: true, bankName: true, accountNumber: true } },
} satisfies any;

/**
 * Contas a Pagar (briefing: "Títulos, Parcelas, Pagamento parcial/total,
 * Agendamento, Baixa, Estorno, Juros, Multa, Desconto, Histórico").
 * Parcelamento: a primeira parcela é o "título" — as demais (`installments`
 * 2..N) compartilham `parentId` apontando para ela, mesmo padrão já usado
 * por `GoodsReceiptsService` (Sprint 07) e `PdvCheckoutService` (Sprint
 * 09) ao gerar `AccountsPayable`/`AccountsReceivable` — esta sprint só
 * formaliza o ciclo de vida completo (baixa/renegociação/estorno) que
 * antes só existia a criação.
 */
@Injectable()
export class AccountsPayableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, companyId: string, dto: CreatePayableDto) {
    const installments = dto.installments ?? 1;
    const installmentAmount = Number((dto.amount / installments).toFixed(2));
    const baseDue = new Date(dto.dueDate);

    const parent = await this.prisma.accountsPayable.create({
      data: {
        tenantId: ctx.tenantId,
        companyId,
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId,
        costCenterId: dto.costCenterId,
        chartOfAccountId: dto.chartOfAccountId,
        bankAccountId: dto.bankAccountId,
        documentNumber: dto.documentNumber,
        installmentNumber: 1,
        totalInstallments: installments,
        amount: installmentAmount,
        dueDate: baseDue,
        notes: dto.notes,
        createdBy: ctx.userId,
      },
      include: INCLUDE,
    });

    for (let i = 2; i <= installments; i++) {
      const dueDate = new Date(baseDue);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      await this.prisma.accountsPayable.create({
        data: {
          tenantId: ctx.tenantId,
          companyId,
          supplierId: dto.supplierId,
          purchaseOrderId: dto.purchaseOrderId,
          costCenterId: dto.costCenterId,
          chartOfAccountId: dto.chartOfAccountId,
          bankAccountId: dto.bankAccountId,
          parentId: parent.id,
          documentNumber: dto.documentNumber,
          installmentNumber: i,
          totalInstallments: installments,
          amount: installmentAmount,
          dueDate,
          notes: dto.notes,
          createdBy: ctx.userId,
        },
      });
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'AccountsPayable', entityId: parent.id, after: { amount: dto.amount, installments } });
    return this.findOne(ctx.tenantId, parent.id);
  }

  async findAll(tenantId: string, query: QueryFinancialDocumentDto) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status as never;
    if (query.costCenterId) where.costCenterId = query.costCenterId;
    if (query.bankAccountId) where.bankAccountId = query.bankAccountId;
    if (query.dueDateFrom || query.dueDateTo) {
      where.dueDate = { ...(query.dueDateFrom ? { gte: new Date(query.dueDateFrom) } : {}), ...(query.dueDateTo ? { lte: new Date(query.dueDateTo) } : {}) };
    }

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.accountsPayable.findMany({ where, include: INCLUDE, orderBy: { dueDate: 'asc' }, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.accountsPayable.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async findOne(tenantId: string, id: string) {
    const payable = await this.prisma.accountsPayable.findFirst({ where: { id, tenantId }, include: { ...INCLUDE, installments: true } });
    if (!payable) throw new NotFoundException('Título não encontrado');
    return payable;
  }

  /** Baixa (parcial ou total) — soma `interest`/`fine`, subtrai `discount`, atualiza saldo bancário se informado. */
  async settle(ctx: RequestContext, id: string, dto: SettleDto) {
    const payable = await this.findOne(ctx.tenantId, id);
    if (payable.status === 'cancelled') throw new BadRequestException('Título cancelado não pode receber baixa');
    if (payable.status === 'paid') throw new BadRequestException('Título já totalmente pago');

    const newPaidAmount = Number(payable.paidAmount) + dto.amount;
    const netDue = Number(payable.amount) + (dto.interestAmount ?? 0) + (dto.fineAmount ?? 0) - (dto.discountAmount ?? 0);
    const status = newPaidAmount >= netDue - 0.01 ? 'paid' : 'partially_paid';

    const updated = await this.prisma.accountsPayable.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        interestAmount: dto.interestAmount ?? payable.interestAmount,
        fineAmount: dto.fineAmount ?? payable.fineAmount,
        discountAmount: dto.discountAmount ?? payable.discountAmount,
        bankAccountId: dto.bankAccountId ?? payable.bankAccountId,
        status,
        paidAt: status === 'paid' ? new Date(dto.settledAt ?? Date.now()) : payable.paidAt,
      },
      include: INCLUDE,
    });

    if (dto.bankAccountId) {
      await this.prisma.bankAccount.update({ where: { id: dto.bankAccountId }, data: { currentBalance: { decrement: dto.amount }, balanceUpdatedAt: new Date() } });
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'AccountsPayable', entityId: id, before: { paidAmount: payable.paidAmount, status: payable.status }, after: { paidAmount: newPaidAmount, status } });
    return updated;
  }

  /** Estorno de uma baixa já feita — reabre o título, devolve o saldo bancário. */
  async reverse(ctx: RequestContext, id: string, reason: string) {
    const payable = await this.findOne(ctx.tenantId, id);
    if (Number(payable.paidAmount) === 0) throw new BadRequestException('Título sem baixa para estornar');

    const updated = await this.prisma.accountsPayable.update({
      where: { id },
      data: { paidAmount: 0, status: 'open', paidAt: null, reversedAt: new Date(), reversedBy: ctx.userId },
      include: INCLUDE,
    });

    if (payable.bankAccountId) {
      await this.prisma.bankAccount.update({ where: { id: payable.bankAccountId }, data: { currentBalance: { increment: Number(payable.paidAmount) }, balanceUpdatedAt: new Date() } });
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'reject', entity: 'AccountsPayable', entityId: id, before: { paidAmount: payable.paidAmount }, after: { reason } });
    return updated;
  }

  /** Renegociação — encerra o título original (cancelled) e cria um novo, ligado por `renegotiatedFromId`. */
  async renegotiate(ctx: RequestContext, id: string, dto: RenegotiateDto) {
    const original = await this.findOne(ctx.tenantId, id);
    if (original.status === 'paid') throw new BadRequestException('Título já pago não pode ser renegociado');

    const remainingAmount = dto.newAmount ?? Number(original.amount) - Number(original.paidAmount);
    const installments = dto.installments ?? 1;
    const installmentAmount = Number((remainingAmount / installments).toFixed(2));
    const baseDue = new Date(dto.newDueDate);

    const renegotiated = await this.prisma.accountsPayable.create({
      data: {
        tenantId: ctx.tenantId,
        companyId: original.companyId,
        supplierId: original.supplierId,
        costCenterId: original.costCenterId,
        chartOfAccountId: original.chartOfAccountId,
        renegotiatedFromId: original.id,
        documentNumber: original.documentNumber ? `${original.documentNumber}-RENEG` : undefined,
        installmentNumber: 1,
        totalInstallments: installments,
        amount: installmentAmount,
        dueDate: baseDue,
        notes: dto.reason,
        createdBy: ctx.userId,
      },
      include: INCLUDE,
    });

    for (let i = 2; i <= installments; i++) {
      const dueDate = new Date(baseDue);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      await this.prisma.accountsPayable.create({
        data: {
          tenantId: ctx.tenantId,
          companyId: original.companyId,
          supplierId: original.supplierId,
          costCenterId: original.costCenterId,
          chartOfAccountId: original.chartOfAccountId,
          parentId: renegotiated.id,
          installmentNumber: i,
          totalInstallments: installments,
          amount: installmentAmount,
          dueDate,
          createdBy: ctx.userId,
        },
      });
    }

    await this.prisma.accountsPayable.update({ where: { id: original.id }, data: { status: 'cancelled', notes: `Renegociado — ${dto.reason}` } });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'AccountsPayable', entityId: original.id, after: { renegotiatedTo: renegotiated.id, reason: dto.reason } });
    return this.findOne(ctx.tenantId, renegotiated.id);
  }

  /** Agendamento de pagamento — não baixa, apenas marca a data planejada. */
  async schedule(ctx: RequestContext, id: string, scheduledAt: string) {
    await this.findOne(ctx.tenantId, id);
    return this.prisma.accountsPayable.update({ where: { id }, data: { scheduledAt: new Date(scheduledAt) } });
  }

  getHistory(tenantId: string, id: string) {
    return this.prisma.accountsPayable.findFirst({ where: { id, tenantId }, include: { renegotiations: true, renegotiatedFrom: true, installments: true } });
  }
}
