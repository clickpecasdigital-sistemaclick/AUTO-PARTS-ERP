import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/** Plano de Contas hierárquico (briefing: "Contas Sintéticas, Analíticas, Natureza, Grupo, Subgrupo"). */
@Injectable()
export class ChartOfAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Árvore completa (sintéticas com suas analíticas aninhadas). */
  async getTree(tenantId: string, companyId: string) {
    const all = await this.prisma.chartOfAccount.findMany({ where: { tenantId, companyId, isActive: true }, orderBy: { code: 'asc' } });
    const byParent = new Map<string | null, typeof all>();
    for (const account of all) {
      const key = account.parentId;
      byParent.set(key, [...(byParent.get(key) ?? []), account]);
    }
    function build(parentId: string | null): unknown[] {
      return (byParent.get(parentId) ?? []).map((account) => ({ ...account, children: build(account.id) }));
    }
    return build(null);
  }

  list(tenantId: string, companyId: string) {
    return this.prisma.chartOfAccount.findMany({ where: { tenantId, companyId }, orderBy: { code: 'asc' } });
  }

  create(tenantId: string, companyId: string, data: { code: string; name: string; type: string; parentId?: string }) {
    return this.prisma.chartOfAccount.create({ data: { tenantId, companyId, ...data } as never });
  }

  /** É "sintética" se tiver filhas; "analítica" (a que de fato recebe lançamentos) se for folha — sem campo próprio, calculado aqui. */
  async isAnalytic(accountId: string) {
    const childrenCount = await this.prisma.chartOfAccount.count({ where: { parentId: accountId } });
    return childrenCount === 0;
  }
}

/** Centros de Custo + Rateio (briefing: "Cadastro, Hierarquia, Rateio, Vinculação automática"). */
@Injectable()
export class CostCentersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, companyId: string) {
    return this.prisma.costCenter.findMany({ where: { tenantId, companyId, deletedAt: null }, orderBy: { code: 'asc' } });
  }

  create(tenantId: string, companyId: string, data: { code: string; name: string }) {
    return this.prisma.costCenter.create({ data: { tenantId, companyId, ...data } });
  }

  /**
   * Rateio — divide um título entre N centros de custo por percentual
   * (briefing: "Rateio"). A soma de `percent` deve fechar em 100%
   * (validado aqui, já que o Postgres não valida agregação entre linhas
   * facilmente sem trigger).
   */
  async allocate(tenantId: string, params: { payableId?: string; receivableId?: string }, allocations: { costCenterId: string; percent: number }[]) {
    const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
    if (Math.abs(totalPercent - 100) > 0.01) {
      throw new BadRequestException(`O rateio deve somar 100% (atual: ${totalPercent.toFixed(2)}%)`);
    }

    const document = params.payableId
      ? await this.prisma.accountsPayable.findUnique({ where: { id: params.payableId } })
      : await this.prisma.accountsReceivable.findUnique({ where: { id: params.receivableId } });
    if (!document) throw new BadRequestException('Título não encontrado');

    await this.prisma.costCenterAllocation.deleteMany({ where: { tenantId, ...params } });

    const created = [];
    for (const allocation of allocations) {
      const amount = Number((Number(document.amount) * (allocation.percent / 100)).toFixed(2));
      created.push(await this.prisma.costCenterAllocation.create({ data: { tenantId, ...params, costCenterId: allocation.costCenterId, percent: allocation.percent, amount } }));
    }
    return created;
  }

  getAllocations(tenantId: string, params: { payableId?: string; receivableId?: string }) {
    return this.prisma.costCenterAllocation.findMany({ where: { tenantId, ...params }, include: { costCenter: true } });
  }

  /** Totais por centro de custo no período — base do relatório de "ranking de despesas" do Dashboard Executivo. */
  async getTotalsByPeriod(tenantId: string, companyId: string, startDate: Date, endDate: Date) {
    const costCenters = await this.list(tenantId, companyId);
    const totals = await Promise.all(
      costCenters.map(async (cc) => {
        const [payableAgg, receivableAgg] = await Promise.all([
          this.prisma.accountsPayable.aggregate({ where: { tenantId, costCenterId: cc.id, dueDate: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
          this.prisma.accountsReceivable.aggregate({ where: { tenantId, costCenterId: cc.id, dueDate: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
        ]);
        return { costCenterId: cc.id, name: cc.name, totalExpense: Number(payableAgg._sum.amount ?? 0), totalRevenue: Number(receivableAgg._sum.amount ?? 0) };
      }),
    );
    return totals.sort((a, b) => b.totalExpense - a.totalExpense);
  }
}

/** Comissões configuráveis (briefing: "Por vendedor, mecânico, produto, serviço, campanha"). */
@Injectable()
export class CommissionRulesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.commissionRule.findMany({ where: { tenantId, isActive: true }, orderBy: { priority: 'desc' } });
  }

  create(tenantId: string, data: { scope: string; scopeRefId?: string; ratePercent: number; priority?: number }) {
    return this.prisma.commissionRule.create({ data: { tenantId, ...data } as never });
  }

  /** Resolve a taxa aplicável (maior prioridade entre as regras do escopo correspondente) — usado por quem gera a comissão (PdvCheckoutService, Sprint 09, ou um futuro ServiceOrdersService). */
  async resolveRate(tenantId: string, scope: string, scopeRefId?: string): Promise<number | null> {
    const rules = await this.prisma.commissionRule.findMany({
      where: { tenantId, scope: scope as never, isActive: true, OR: [{ scopeRefId: null }, ...(scopeRefId ? [{ scopeRefId }] : [])] },
      orderBy: { priority: 'desc' },
    });
    return rules[0] ? Number(rules[0].ratePercent) : null;
  }

  listCommissions(tenantId: string, status?: string) {
    return this.prisma.commission.findMany({
      where: { tenantId, ...(status ? { status: status as never } : {}) },
      include: { salesperson: { include: { employee: { select: { name: true } } } }, mechanic: { include: { employee: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  approveCommission(id: string) {
    return this.prisma.commission.update({ where: { id }, data: { status: 'approved' } });
  }

  markCommissionPaid(id: string) {
    return this.prisma.commission.update({ where: { id }, data: { status: 'paid', paidAt: new Date() } });
  }
}
