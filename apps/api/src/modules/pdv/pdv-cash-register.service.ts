import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/** Caixa do PDV (briefing: "Abertura, Fechamento, Sangria, Suprimento, Conferência"). */
@Injectable()
export class PdvCashRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async open(ctx: RequestContext, branchId: string, openingAmount: number) {
    const alreadyOpen = await this.prisma.cashRegister.findFirst({ where: { tenantId: ctx.tenantId, branchId, status: 'open', openedBy: ctx.userId! } });
    if (alreadyOpen) throw new BadRequestException('Você já possui um caixa aberto nesta filial');

    const register = await this.prisma.cashRegister.create({
      data: { tenantId: ctx.tenantId, branchId, openedBy: ctx.userId!, openingAmount },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'CashRegister', entityId: register.id, after: { openingAmount } });
    return register;
  }

  async addMovement(ctx: RequestContext, cashRegisterId: string, type: 'reinforcement' | 'withdrawal' | 'expense' | 'adjustment', amount: number, description?: string) {
    const register = await this.getOpenOrThrow(ctx.tenantId, cashRegisterId);
    const movement = await this.prisma.cashMovement.create({
      data: { tenantId: ctx.tenantId, cashRegisterId: register.id, type: type as never, amount, description, createdBy: ctx.userId },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'CashMovement', entityId: movement.id, after: { type, amount, description } });
    return movement;
  }

  /** Resumo para a tela de fechamento: esperado por forma de pagamento (vendas) + sangrias/suprimentos. */
  async getClosingSummary(tenantId: string, cashRegisterId: string) {
    const register = await this.getOpenOrThrow(tenantId, cashRegisterId);

    const payments = await this.prisma.salePayment.findMany({ where: { tenantId, sale: { cashRegisterId } }, include: { paymentMethod: true } });
    const byMethod = new Map<string, { paymentMethodId: string; name: string; kind: string; expected: number }>();
    for (const payment of payments) {
      const entry = byMethod.get(payment.paymentMethodId) ?? { paymentMethodId: payment.paymentMethodId, name: payment.paymentMethod.name, kind: payment.paymentMethod.kind, expected: 0 };
      entry.expected += Number(payment.amount);
      byMethod.set(payment.paymentMethodId, entry);
    }

    const movements = await this.prisma.cashMovement.findMany({ where: { tenantId, cashRegisterId } });
    const reinforcements = movements.filter((m) => m.type === 'reinforcement').reduce((s, m) => s + Number(m.amount), 0);
    const withdrawals = movements.filter((m) => m.type === 'withdrawal').reduce((s, m) => s + Number(m.amount), 0);
    const cashSales = [...byMethod.values()].filter((m) => m.kind === 'cash').reduce((s, m) => s + m.expected, 0);

    const cashExpected = Number(register.openingAmount) + reinforcements - withdrawals + cashSales;

    return { byPaymentMethod: [...byMethod.values()], reinforcements, withdrawals, openingAmount: Number(register.openingAmount), estimatedCashExpected: cashExpected };
  }

  /** Conferência (briefing) — uma linha por forma de pagamento, valor contado x esperado. */
  async reconcile(ctx: RequestContext, cashRegisterId: string, counts: { paymentMethodId: string; countedAmount: number }[]) {
    const register = await this.getOpenOrThrow(ctx.tenantId, cashRegisterId);
    const summary = await this.getClosingSummary(ctx.tenantId, cashRegisterId);

    const results = [];
    for (const count of counts) {
      const expected = summary.byPaymentMethod.find((m) => m.paymentMethodId === count.paymentMethodId)?.expected ?? 0;
      const reconciliation = await this.prisma.cashRegisterReconciliation.upsert({
        where: { cashRegisterId_paymentMethodId: { cashRegisterId: register.id, paymentMethodId: count.paymentMethodId } },
        create: { tenantId: ctx.tenantId, cashRegisterId: register.id, paymentMethodId: count.paymentMethodId, expectedAmount: expected, countedAmount: count.countedAmount, differenceAmount: count.countedAmount - expected },
        update: { countedAmount: count.countedAmount, differenceAmount: count.countedAmount - expected },
      });
      results.push(reconciliation);
    }
    return results;
  }

  async close(ctx: RequestContext, cashRegisterId: string, closingAmount: number) {
    await this.getOpenOrThrow(ctx.tenantId, cashRegisterId);
    const summary = await this.getClosingSummary(ctx.tenantId, cashRegisterId);

    const updated = await this.prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: { status: 'closed', closingAmount, expectedAmount: summary.estimatedCashExpected, closedAt: new Date(), closedBy: ctx.userId },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'CashRegister', entityId: cashRegisterId, after: { status: 'closed', closingAmount, expected: summary.estimatedCashExpected, difference: closingAmount - summary.estimatedCashExpected } });
    return updated;
  }

  listOpen(tenantId: string, branchId?: string) {
    return this.prisma.cashRegister.findMany({ where: { tenantId, status: 'open', ...(branchId ? { branchId } : {}) } });
  }

  private async getOpenOrThrow(tenantId: string, id: string) {
    const register = await this.prisma.cashRegister.findFirst({ where: { id, tenantId } });
    if (!register) throw new NotFoundException('Caixa não encontrado');
    if (register.status !== 'open') throw new BadRequestException('Este caixa já está fechado');
    return register;
  }
}
