import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { BankAccountsService } from './bank-accounts.service';

/** Projeções/Simulações/Cenários manuais (briefing) — distintas do fluxo previsto calculado a partir de títulos reais. */
@Injectable()
export class FinancialProjectionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, companyId: string) {
    return this.prisma.financialProjection.findMany({ where: { tenantId, companyId }, orderBy: { referenceMonth: 'asc' } });
  }

  create(tenantId: string, companyId: string, userId: string | null, data: { name: string; scenario: string; referenceMonth: string; projectedRevenue: number; projectedExpense: number; notes?: string }) {
    return this.prisma.financialProjection.create({
      data: { tenantId, companyId, createdBy: userId, ...data, referenceMonth: new Date(data.referenceMonth) } as never,
    });
  }

  /** Compara os 3 cenários (realista/otimista/pessimista) lado a lado para um mês de referência. */
  async compareScenarios(tenantId: string, companyId: string, referenceMonth: string) {
    const projections = await this.prisma.financialProjection.findMany({ where: { tenantId, companyId, referenceMonth: new Date(referenceMonth) } });
    return projections.map((p) => ({ scenario: p.scenario, projectedRevenue: Number(p.projectedRevenue), projectedExpense: Number(p.projectedExpense), projectedProfit: Number(p.projectedRevenue) - Number(p.projectedExpense) }));
  }
}

export interface ExecutiveDashboardKpis {
  cashBalance: number;
  bankBalance: number;
  revenueThisMonth: number;
  expenseThisMonth: number;
  operatingProfit: number;
  delinquencyRate: number;
  overdueReceivables: { count: number; total: number };
  upcomingReceivables: { count: number; total: number };
  overduePayables: { count: number; total: number };
  upcomingPayables: { count: number; total: number };
}

/**
 * Dashboard Executivo (briefing): saldo em caixa, saldo bancário,
 * receitas/despesas do mês, lucro operacional, inadimplência, contas
 * vencidas/a vencer, fluxo de caixa, DRE resumido, ranking de despesas —
 * tudo via agregação SQL (nunca carregando listas completas em memória),
 * preparado para "milhões de lançamentos" (briefing de performance).
 */
@Injectable()
export class FinancialAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bankAccounts: BankAccountsService,
  ) {}

  async getExecutiveKpis(tenantId: string, companyId: string): Promise<ExecutiveDashboardKpis> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const now = new Date();
    const next30Days = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const [
      openCashRegisters,
      bankBalances,
      revenueAgg,
      expenseAgg,
      overdueReceivables,
      overdueReceivablesAgg,
      upcomingReceivables,
      upcomingReceivablesAgg,
      overduePayables,
      overduePayablesAgg,
      upcomingPayables,
      upcomingPayablesAgg,
      totalReceivablesDue,
    ] = await Promise.all([
      this.prisma.cashRegister.aggregate({ where: { tenantId, status: 'open' }, _sum: { openingAmount: true } }),
      this.bankAccounts.getTotalBalances(tenantId, companyId),
      this.prisma.accountsReceivable.aggregate({ where: { tenantId, companyId, dueDate: { gte: startOfMonth } }, _sum: { amount: true } }),
      this.prisma.accountsPayable.aggregate({ where: { tenantId, companyId, dueDate: { gte: startOfMonth } }, _sum: { amount: true } }),
      this.prisma.accountsReceivable.count({ where: { tenantId, companyId, status: { in: ['open', 'partially_paid'] }, dueDate: { lt: now } } }),
      this.prisma.accountsReceivable.aggregate({ where: { tenantId, companyId, status: { in: ['open', 'partially_paid'] }, dueDate: { lt: now } }, _sum: { amount: true } }),
      this.prisma.accountsReceivable.count({ where: { tenantId, companyId, status: 'open', dueDate: { gte: now, lte: next30Days } } }),
      this.prisma.accountsReceivable.aggregate({ where: { tenantId, companyId, status: 'open', dueDate: { gte: now, lte: next30Days } }, _sum: { amount: true } }),
      this.prisma.accountsPayable.count({ where: { tenantId, companyId, status: { in: ['open', 'partially_paid'] }, dueDate: { lt: now } } }),
      this.prisma.accountsPayable.aggregate({ where: { tenantId, companyId, status: { in: ['open', 'partially_paid'] }, dueDate: { lt: now } }, _sum: { amount: true } }),
      this.prisma.accountsPayable.count({ where: { tenantId, companyId, status: 'open', dueDate: { gte: now, lte: next30Days } } }),
      this.prisma.accountsPayable.aggregate({ where: { tenantId, companyId, status: 'open', dueDate: { gte: now, lte: next30Days } }, _sum: { amount: true } }),
      this.prisma.accountsReceivable.count({ where: { tenantId, companyId, dueDate: { lt: now } } }),
    ]);

    const revenueThisMonth = Number(revenueAgg._sum.amount ?? 0);
    const expenseThisMonth = Number(expenseAgg._sum.amount ?? 0);

    return {
      cashBalance: Number(openCashRegisters._sum.openingAmount ?? 0),
      bankBalance: Number(bankBalances._sum.currentBalance ?? 0),
      revenueThisMonth,
      expenseThisMonth,
      operatingProfit: revenueThisMonth - expenseThisMonth,
      delinquencyRate: totalReceivablesDue > 0 ? Number(((overdueReceivables / totalReceivablesDue) * 100).toFixed(2)) : 0,
      overdueReceivables: { count: overdueReceivables, total: Number(overdueReceivablesAgg._sum.amount ?? 0) },
      upcomingReceivables: { count: upcomingReceivables, total: Number(upcomingReceivablesAgg._sum.amount ?? 0) },
      overduePayables: { count: overduePayables, total: Number(overduePayablesAgg._sum.amount ?? 0) },
      upcomingPayables: { count: upcomingPayables, total: Number(upcomingPayablesAgg._sum.amount ?? 0) },
    };
  }

  /** Ranking de despesas por Centro de Custo (mês atual) — atalho do Dashboard sobre os mesmos dados de `CostCentersService.getTotalsByPeriod`. */
  async getExpenseRanking(tenantId: string, companyId: string, limit = 10) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    const grouped = await this.prisma.accountsPayable.groupBy({
      by: ['costCenterId'],
      where: { tenantId, companyId, dueDate: { gte: startOfMonth, lte: endOfMonth }, costCenterId: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const costCenterIds = grouped.map((g) => g.costCenterId).filter((id): id is string => !!id);
    const costCenters = await this.prisma.costCenter.findMany({ where: { id: { in: costCenterIds } } });
    const byId = new Map(costCenters.map((cc) => [cc.id, cc.name]));

    return grouped.map((g) => ({ costCenterId: g.costCenterId, name: byId.get(g.costCenterId!) ?? '—', total: Number(g._sum.amount ?? 0) }));
  }
}
