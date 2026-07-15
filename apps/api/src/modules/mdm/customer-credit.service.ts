import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

export interface CreditProfile {
  creditLimit: number;
  usedBalance: number;
  availableBalance: number;
  overdueDays: number;
  largestPurchaseValue: number;
  averageTicketValue: number;
  totalPurchasesCount: number;
  lastPurchaseAt: Date | null;
  creditScore: number;
  creditStatus: string;
}

/**
 * Crédito do Cliente (briefing: "Limite, Saldo utilizado, Saldo
 * disponível, Dias de atraso, Maior compra, Ticket médio, Quantidade de
 * compras, Data da última compra, Análise de risco, Status de crédito,
 * Bloqueio automático por inadimplência"). `refreshProfile()` recalcula o
 * snapshot denormalizado em `Customer` a partir das tabelas
 * TRANSACIONAIS reais (`AccountsReceivable`, `Sale`) — chamado após toda
 * venda/recebimento que afete o cliente; nunca o inverso.
 */
@Injectable()
export class CustomerCreditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getProfile(tenantId: string, customerId: string): Promise<CreditProfile> {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const openReceivables = await this.prisma.accountsReceivable.findMany({
      where: { tenantId, customerId, status: { in: ['open', 'partially_paid'] } },
    });
    const usedBalance = openReceivables.reduce((sum, r) => sum + Number(r.amount) - Number(r.receivedAmount), 0);
    const overdue = openReceivables.filter((r) => r.dueDate < new Date());
    const overdueDays = overdue.length > 0 ? Math.max(...overdue.map((r) => Math.floor((Date.now() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24)))) : 0;

    return {
      creditLimit: Number(customer.creditLimit),
      usedBalance,
      availableBalance: Number(customer.creditLimit) - usedBalance,
      overdueDays,
      largestPurchaseValue: Number(customer.largestPurchaseValue),
      averageTicketValue: Number(customer.averageTicketValue),
      totalPurchasesCount: customer.totalPurchasesCount,
      lastPurchaseAt: customer.lastPurchaseAt,
      creditScore: customer.creditScore ?? 0,
      creditStatus: customer.creditStatus,
    };
  }

  /**
   * Recalcula o snapshot de compras/crédito a partir do histórico real de
   * `Sale` (Seção 7) e aplica bloqueio automático por inadimplência
   * (>30 dias de atraso em qualquer título aberto).
   */
  async refreshProfile(ctx: RequestContext, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId: ctx.tenantId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const sales = await this.prisma.sale.findMany({ where: { tenantId: ctx.tenantId, customerId, status: { not: 'cancelled' } }, select: { totalAmount: true, createdAt: true } });
    const totalPurchasesCount = sales.length;
    const totalValue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const averageTicketValue = totalPurchasesCount > 0 ? totalValue / totalPurchasesCount : 0;
    const largestPurchaseValue = sales.length > 0 ? Math.max(...sales.map((s) => Number(s.totalAmount))) : 0;
    const lastPurchaseAt = sales.length > 0 ? sales.reduce((latest, s) => (s.createdAt > latest ? s.createdAt : latest), sales[0].createdAt) : null;

    const profile = await this.getProfile(ctx.tenantId, customerId);
    const creditScore = this.computeScore(profile.overdueDays, totalPurchasesCount, averageTicketValue);

    const previousStatus = customer.creditStatus;
    let newStatus = previousStatus;
    if (profile.overdueDays > 30) newStatus = 'blocked';
    else if (profile.overdueDays > 0) newStatus = 'restricted';
    else if (totalPurchasesCount > 0) newStatus = 'approved';

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { totalPurchasesCount, averageTicketValue, largestPurchaseValue, lastPurchaseAt, creditScore, creditStatus: newStatus as never, creditAnalyzedAt: new Date() },
    });

    if (newStatus !== previousStatus) {
      await this.prisma.customerCreditEvent.create({
        data: {
          tenantId: ctx.tenantId,
          customerId,
          type: newStatus === 'blocked' ? 'automatic_block' : previousStatus === 'blocked' ? 'automatic_unblock' : 'status_change',
          previousStatus: previousStatus as never,
          newStatus: newStatus as never,
          reason: profile.overdueDays > 30 ? `Bloqueio automático — ${profile.overdueDays} dias de atraso` : undefined,
          createdBy: ctx.userId,
        },
      });
      await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'credit_change', entity: 'Customer', entityId: customerId, before: { status: previousStatus }, after: { status: newStatus } });
    }

    return this.getProfile(ctx.tenantId, customerId);
  }

  async updateCreditLimit(ctx: RequestContext, customerId: string, newLimit: number, reason?: string) {
    if (newLimit < 0) throw new BadRequestException('Limite de crédito não pode ser negativo');
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId: ctx.tenantId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const previousLimit = Number(customer.creditLimit);
    await this.prisma.customer.update({ where: { id: customerId }, data: { creditLimit: newLimit } });
    await this.prisma.customerCreditEvent.create({
      data: { tenantId: ctx.tenantId, customerId, type: 'limit_change', previousLimit, newLimit, reason, createdBy: ctx.userId },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'credit_change', entity: 'Customer', entityId: customerId, before: { creditLimit: previousLimit }, after: { creditLimit: newLimit } });

    return this.getProfile(ctx.tenantId, customerId);
  }

  getEventHistory(tenantId: string, customerId: string) {
    return this.prisma.customerCreditEvent.findMany({ where: { tenantId, customerId }, orderBy: { createdAt: 'desc' } });
  }

  /** Score simplificado 0-1000: penaliza atraso, premia recorrência e ticket médio saudável. */
  private computeScore(overdueDays: number, purchaseCount: number, averageTicket: number): number {
    let score = 500;
    score -= Math.min(overdueDays * 10, 400);
    score += Math.min(purchaseCount * 5, 300);
    score += Math.min(Math.floor(averageTicket / 100), 200);
    return Math.max(0, Math.min(1000, score));
  }
}
