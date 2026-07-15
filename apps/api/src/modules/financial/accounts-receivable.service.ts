import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { AuditService } from '@/common/audit/audit.service';
import type { CreateReceivableDto, QueryFinancialDocumentDto, RenegotiateDto, SettleDto } from './dto/financial-document.dto';
import type { RequestContext } from '@/common/types/request-context';

const INCLUDE = {
  customer: { select: { id: true, name: true, tradeName: true } },
  costCenter: true,
  chartOfAccount: true,
  bankAccount: { select: { id: true, bankName: true, accountNumber: true } },
} satisfies any;

/**
 * Contas a Receber — mesmo ciclo de vida de `AccountsPayableService`
 * (título/parcelas/baixa parcial-total/agendamento/renegociação/estorno/
 * juros/multa/desconto). `settleAutomatically()` é a "Baixa automática"
 * do briefing: chamada por `PixService`/`BankSlipService` quando uma
 * cobrança é confirmada, sem operador manual.
 */
@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, companyId: string, dto: CreateReceivableDto) {
    const installments = dto.installments ?? 1;
    const installmentAmount = Number((dto.amount / installments).toFixed(2));
    const baseDue = new Date(dto.dueDate);

    const parent = await this.prisma.accountsReceivable.create({
      data: {
        tenantId: ctx.tenantId,
        companyId,
        customerId: dto.customerId,
        saleId: dto.saleId,
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
      await this.prisma.accountsReceivable.create({
        data: {
          tenantId: ctx.tenantId,
          companyId,
          customerId: dto.customerId,
          saleId: dto.saleId,
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

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'AccountsReceivable', entityId: parent.id, after: { amount: dto.amount, installments } });
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
      this.prisma.accountsReceivable.findMany({ where, include: INCLUDE, orderBy: { dueDate: 'asc' }, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.accountsReceivable.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async findOne(tenantId: string, id: string) {
    const receivable = await this.prisma.accountsReceivable.findFirst({ where: { id, tenantId }, include: { ...INCLUDE, installments: true } });
    if (!receivable) throw new NotFoundException('Título não encontrado');
    return receivable;
  }

  async settle(ctx: RequestContext, id: string, dto: SettleDto) {
    const receivable = await this.findOne(ctx.tenantId, id);
    if (receivable.status === 'cancelled') throw new BadRequestException('Título cancelado não pode receber baixa');
    if (receivable.status === 'paid') throw new BadRequestException('Título já totalmente recebido');

    const updated = await this.applySettlement(ctx, receivable, dto);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'AccountsReceivable', entityId: id, before: { receivedAmount: receivable.receivedAmount, status: receivable.status }, after: { receivedAmount: updated.receivedAmount, status: updated.status } });
    return updated;
  }

  /** Baixa automática (briefing) — chamada por integrações (PIX/boleto confirmados), sem `userId` de operador humano. */
  async settleAutomatically(receivableId: string, amount: number, bankAccountId?: string) {
    const receivable = await this.prisma.accountsReceivable.findUnique({ where: { id: receivableId } });
    if (!receivable || receivable.status === 'paid' || receivable.status === 'cancelled') return null;

    return this.applySettlement({ tenantId: receivable.tenantId, userId: null }, receivable, { amount, bankAccountId });
  }

  private async applySettlement(ctx: RequestContext, receivable: { id: string; amount: number | Prisma.Decimal; receivedAmount: number | Prisma.Decimal; interestAmount: number | Prisma.Decimal; fineAmount: number | Prisma.Decimal; discountAmount: number | Prisma.Decimal; bankAccountId: string | null }, dto: SettleDto) {
    const newReceivedAmount = Number(receivable.receivedAmount) + dto.amount;
    const netDue = Number(receivable.amount) + (dto.interestAmount ?? 0) + (dto.fineAmount ?? 0) - (dto.discountAmount ?? 0);
    const status = newReceivedAmount >= netDue - 0.01 ? 'paid' : 'partially_paid';

    const updated = await this.prisma.accountsReceivable.update({
      where: { id: receivable.id },
      data: {
        receivedAmount: newReceivedAmount,
        interestAmount: dto.interestAmount ?? receivable.interestAmount,
        fineAmount: dto.fineAmount ?? receivable.fineAmount,
        discountAmount: dto.discountAmount ?? receivable.discountAmount,
        bankAccountId: dto.bankAccountId ?? receivable.bankAccountId,
        status,
        receivedAt: status === 'paid' ? new Date(dto.settledAt ?? Date.now()) : undefined,
      },
      include: INCLUDE,
    });

    const bankAccountId = dto.bankAccountId ?? receivable.bankAccountId;
    if (bankAccountId) {
      await this.prisma.bankAccount.update({ where: { id: bankAccountId }, data: { currentBalance: { increment: dto.amount }, balanceUpdatedAt: new Date() } });
    }

    return updated;
  }

  async reverse(ctx: RequestContext, id: string, reason: string) {
    const receivable = await this.findOne(ctx.tenantId, id);
    if (Number(receivable.receivedAmount) === 0) throw new BadRequestException('Título sem baixa para estornar');

    const updated = await this.prisma.accountsReceivable.update({
      where: { id },
      data: { receivedAmount: 0, status: 'open', receivedAt: null, reversedAt: new Date(), reversedBy: ctx.userId },
      include: INCLUDE,
    });

    if (receivable.bankAccountId) {
      await this.prisma.bankAccount.update({ where: { id: receivable.bankAccountId }, data: { currentBalance: { decrement: Number(receivable.receivedAmount) }, balanceUpdatedAt: new Date() } });
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'reject', entity: 'AccountsReceivable', entityId: id, before: { receivedAmount: receivable.receivedAmount }, after: { reason } });
    return updated;
  }

  async renegotiate(ctx: RequestContext, id: string, dto: RenegotiateDto) {
    const original = await this.findOne(ctx.tenantId, id);
    if (original.status === 'paid') throw new BadRequestException('Título já recebido não pode ser renegociado');

    const remainingAmount = dto.newAmount ?? Number(original.amount) - Number(original.receivedAmount);
    const installments = dto.installments ?? 1;
    const installmentAmount = Number((remainingAmount / installments).toFixed(2));
    const baseDue = new Date(dto.newDueDate);

    const renegotiated = await this.prisma.accountsReceivable.create({
      data: {
        tenantId: ctx.tenantId,
        companyId: original.companyId,
        customerId: original.customerId,
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
      await this.prisma.accountsReceivable.create({
        data: {
          tenantId: ctx.tenantId,
          companyId: original.companyId,
          customerId: original.customerId,
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

    await this.prisma.accountsReceivable.update({ where: { id: original.id }, data: { status: 'cancelled', notes: `Renegociado — ${dto.reason}` } });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'AccountsReceivable', entityId: original.id, after: { renegotiatedTo: renegotiated.id, reason: dto.reason } });
    return this.findOne(ctx.tenantId, renegotiated.id);
  }

  getHistory(tenantId: string, id: string) {
    return this.prisma.accountsReceivable.findFirst({ where: { id, tenantId }, include: { renegotiations: true, renegotiatedFrom: true, installments: true } });
  }
}
