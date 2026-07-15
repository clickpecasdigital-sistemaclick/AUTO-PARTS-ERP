import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface CashFlowDay {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

/**
 * Fluxo de Caixa (briefing: "Realizado, Previsto, Consolidado. Filtros
 * por Empresa, Filial, Conta, Centro de Custo, Período"). Realizado =
 * títulos já baixados (`paidAt`/`receivedAt` preenchidos); Previsto =
 * títulos abertos pela data de vencimento (ainda pode não acontecer —
 * por isso "previsto", não "garantido"); Consolidado = soma dos dois,
 * dia a dia, com saldo acumulado.
 */
@Injectable()
export class CashFlowService {
  constructor(private readonly prisma: PrismaService) {}

  async getRealized(tenantId: string, startDate: Date, endDate: Date, filters?: { companyId?: string; costCenterId?: string; bankAccountId?: string }): Promise<CashFlowDay[]> {
    const [payables, receivables] = await Promise.all([
      this.prisma.accountsPayable.findMany({ where: { tenantId, paidAt: { gte: startDate, lte: endDate }, ...filters }, select: { paidAt: true, paidAmount: true } }),
      this.prisma.accountsReceivable.findMany({ where: { tenantId, receivedAt: { gte: startDate, lte: endDate }, ...filters }, select: { receivedAt: true, receivedAmount: true } }),
    ]);
    return this.buildDailySeries(
      receivables.map((r) => ({ date: r.receivedAt!, amount: Number(r.receivedAmount) })),
      payables.map((p) => ({ date: p.paidAt!, amount: Number(p.paidAmount) })),
    );
  }

  async getProjected(tenantId: string, startDate: Date, endDate: Date, filters?: { companyId?: string; costCenterId?: string; bankAccountId?: string }): Promise<CashFlowDay[]> {
    const [payables, receivables] = await Promise.all([
      this.prisma.accountsPayable.findMany({ where: { tenantId, dueDate: { gte: startDate, lte: endDate }, status: { in: ['open', 'partially_paid'] }, ...filters }, select: { dueDate: true, amount: true, paidAmount: true } }),
      this.prisma.accountsReceivable.findMany({ where: { tenantId, dueDate: { gte: startDate, lte: endDate }, status: { in: ['open', 'partially_paid'] }, ...filters }, select: { dueDate: true, amount: true, receivedAmount: true } }),
    ]);
    return this.buildDailySeries(
      receivables.map((r) => ({ date: r.dueDate, amount: Number(r.amount) - Number(r.receivedAmount) })),
      payables.map((p) => ({ date: p.dueDate, amount: Number(p.amount) - Number(p.paidAmount) })),
    );
  }

  /** Consolidado — realizado até hoje + previsto a partir de hoje, numa única série contínua. */
  async getConsolidated(tenantId: string, startDate: Date, endDate: Date, filters?: { companyId?: string; costCenterId?: string; bankAccountId?: string }) {
    const today = new Date();
    const [realized, projected] = await Promise.all([
      this.getRealized(tenantId, startDate, today < endDate ? today : endDate, filters),
      today < endDate ? this.getProjected(tenantId, today, endDate, filters) : Promise.resolve([]),
    ]);

    const byDate = new Map<string, CashFlowDay>();
    for (const day of [...realized, ...projected]) byDate.set(day.date, day);

    let runningBalance = 0;
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).map((day) => {
      runningBalance += day.inflow - day.outflow;
      return { ...day, balance: runningBalance };
    });
  }

  private buildDailySeries(inflows: { date: Date; amount: number }[], outflows: { date: Date; amount: number }[]): CashFlowDay[] {
    const byDate = new Map<string, { inflow: number; outflow: number }>();
    for (const { date, amount } of inflows) {
      const key = date.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? { inflow: 0, outflow: 0 };
      entry.inflow += amount;
      byDate.set(key, entry);
    }
    for (const { date, amount } of outflows) {
      const key = date.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? { inflow: 0, outflow: 0 };
      entry.outflow += amount;
      byDate.set(key, entry);
    }

    let runningBalance = 0;
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { inflow, outflow }]) => {
        runningBalance += inflow - outflow;
        return { date, inflow, outflow, balance: runningBalance };
      });
  }
}

export interface DreReport {
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  costs: number;
  expenses: number;
  ebitda: number;
  operatingProfit: number;
  netProfit: number;
}

/**
 * DRE Gerencial (briefing: "Receita Bruta, Deduções, Receita Líquida,
 * Custos, Despesas, EBITDA, Lucro Operacional, Lucro Líquido. Baseado no
 * Plano de Contas."). Classifica cada `ChartOfAccount` pelo `type`
 * (revenue/expense) já existente no schema (Sprint 02) — uma conta
 * analítica com código iniciando em "3" é convenção comum de "deduções"
 * (impostos sobre venda); pode ser refinado por tenant configurando o
 * Plano de Contas, sem mudança neste service.
 */
@Injectable()
export class DreService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(tenantId: string, companyId: string, startDate: Date, endDate: Date): Promise<DreReport> {
    const accounts = await this.prisma.chartOfAccount.findMany({ where: { tenantId, companyId } });
    const revenueAccountIds = accounts.filter((a) => a.type === 'revenue').map((a) => a.id);
    const expenseAccountIds = accounts.filter((a) => a.type === 'expense').map((a) => a.id);
    const deductionAccountIds = accounts.filter((a) => a.type === 'revenue' && a.code.startsWith('3')).map((a) => a.id);

    const [grossRevenueAgg, expenseAgg] = await Promise.all([
      this.prisma.accountsReceivable.aggregate({ where: { tenantId, companyId, chartOfAccountId: { in: revenueAccountIds }, dueDate: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
      this.prisma.accountsPayable.aggregate({ where: { tenantId, companyId, chartOfAccountId: { in: expenseAccountIds }, dueDate: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
    ]);

    const deductionsAgg = deductionAccountIds.length
      ? await this.prisma.accountsReceivable.aggregate({ where: { tenantId, companyId, chartOfAccountId: { in: deductionAccountIds }, dueDate: { gte: startDate, lte: endDate } }, _sum: { amount: true } })
      : { _sum: { amount: null } };

    const grossRevenue = Number(grossRevenueAgg._sum.amount ?? 0);
    const deductions = Number(deductionsAgg._sum.amount ?? 0);
    const netRevenue = grossRevenue - deductions;
    const totalExpense = Number(expenseAgg._sum.amount ?? 0);

    // Sem uma conta "Custo da Mercadoria Vendida" separada nesta sprint,
    // todo `expense` é tratado como despesa operacional; CMV real (ligado
    // ao custo médio do produto vendido, Sprint 05/06) é refinamento de
    // produto quando o Plano de Contas tiver a conta de CMV configurada.
    const costs = 0;
    const expenses = totalExpense;
    const ebitda = netRevenue - costs - expenses;
    const operatingProfit = ebitda; // sem depreciação/amortização modelada nesta sprint
    const netProfit = operatingProfit; // sem IR/CSLL modelados nesta sprint

    return { grossRevenue, deductions, netRevenue, costs, expenses, ebitda, operatingProfit, netProfit };
  }
}
