import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { toDateKey } from '../etl/etl.service';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SalesKpis {
  grossRevenue: number;
  netRevenue: number;
  grossProfit: number;
  margin: number;
  averageTicket: number;
  totalOrders: number;
  totalItems: number;
  discountTotal: number;
  revenueByDay: { dateKey: number; netRevenue: number }[];
  topProducts: { productId: string; name: string; netRevenue: number; quantity: number }[];
  topCustomers: { customerId: string; name: string; netRevenue: number; orders: number }[];
  topSalespeople: { salespersonId: string; name: string; netRevenue: number }[];
}

export interface StockKpis {
  totalSkus: number;
  totalValue: number;
  skusBelowMin: number;
  skusWithoutMovement: number;
  abcCurve: { tier: 'A' | 'B' | 'C'; productId: string; name: string; revenue: number; pct: number }[];
  turnover: number;
  coverageDays: number;
}

export interface FinancialKpis {
  totalReceivable: number;
  totalPayable: number;
  netCashFlow: number;
  overdueReceivable: number;
  overduePayable: number;
  defaultRate: number;
  revenueByMonth: { month: number; year: number; revenue: number; expense: number }[];
}

export interface WorkshopKpis {
  totalOrders: number;
  completedOrders: number;
  averageTicket: number;
  totalRevenue: number;
  averageDurationHours: number | null;
  reworkRate: number;
  npsScore: number | null;
  mechanicPerformance: { mechanicId: string; name: string; totalOrders: number; avgDuration: number | null; reworkRate: number }[];
}

/**
 * Motor de KPIs — consultas sobre o Data Warehouse (fatos/dimensões).
 * Cada método recebe `tenantId` + `DateRange` e retorna os indicadores
 * do período. Preparado para drill-down por filial, produto, categoria,
 * cliente, mecânico, etc. (parâmetros adicionais opcionais). Cache de
 * configurações fiscais (briefing: "pré-agregações") é implementado no
 * Controller via NestJS CacheModule quando necessário.
 */
@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- VENDAS ---------------------------------------------------------------

  async getSalesKpis(tenantId: string, range: DateRange, branchId?: string): Promise<SalesKpis> {
    const fromKey = toDateKey(range.from);
    const toKey = toDateKey(range.to);
    const where: any = { tenantId, dateKey: { gte: fromKey, lte: toKey }, ...(branchId ? { branchId } : {}) };

    const [agg, byDay, facts] = await Promise.all([
      this.prisma.factSale.aggregate({ where, _sum: { grossRevenue: true, netRevenue: true, grossProfit: true, discountAmount: true, quantity: true }, _count: { saleId: true } }),
      this.prisma.factSale.groupBy({ by: ['dateKey'], where, _sum: { netRevenue: true }, orderBy: { dateKey: 'asc' } }),
      this.prisma.factSale.findMany({ where, select: { productId: true, customerId: true, salespersonId: true, netRevenue: true, quantity: true, saleId: true } }),
    ]);

    const totalRevenue = Number(agg._sum.netRevenue ?? 0);
    const totalOrders = new Set(facts.map((f) => f.saleId)).size;

    // Top produtos
    const productMap = new Map<string, { netRevenue: number; quantity: number }>();
    facts.forEach((f) => {
      if (!f.productId) return;
      const e = productMap.get(f.productId) ?? { netRevenue: 0, quantity: 0 };
      productMap.set(f.productId, { netRevenue: e.netRevenue + Number(f.netRevenue), quantity: e.quantity + Number(f.quantity) });
    });

    const productIds = [...productMap.keys()].slice(0, 20);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, shortDescription: true } });
    const productNameMap = new Map(products.map((p) => [p.id, p.shortDescription]));

    const topProducts = [...productMap.entries()]
      .sort((a, b) => b[1].netRevenue - a[1].netRevenue)
      .slice(0, 10)
      .map(([productId, data]) => ({ productId, name: String(productNameMap.get(productId) ?? productId), ...data }));

    // Top clientes
    const customerMap = new Map<string, { netRevenue: number; orders: Set<string> }>();
    facts.forEach((f) => {
      if (!f.customerId) return;
      const e = customerMap.get(f.customerId) ?? { netRevenue: 0, orders: new Set() };
      e.netRevenue += Number(f.netRevenue);
      e.orders.add(f.saleId);
      customerMap.set(f.customerId, e);
    });

    const customerIds = [...customerMap.keys()].slice(0, 20);
    const customers = await this.prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, tradeName: true } });
    const customerNameMap = new Map(customers.map((c) => [c.id, c.tradeName ?? c.name]));

    const topCustomers = [...customerMap.entries()]
      .sort((a, b) => b[1].netRevenue - a[1].netRevenue)
      .slice(0, 10)
      .map(([customerId, data]) => ({ customerId, name: String(customerNameMap.get(customerId) ?? customerId), netRevenue: data.netRevenue, orders: data.orders.size }));

    return {
      grossRevenue: Number(agg._sum.grossRevenue ?? 0),
      netRevenue: totalRevenue,
      grossProfit: Number(agg._sum.grossProfit ?? 0),
      margin: totalRevenue > 0 ? Number(agg._sum.grossProfit ?? 0) / totalRevenue : 0,
      averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalOrders,
      totalItems: Number(agg._count.saleId ?? 0),
      discountTotal: Number(agg._sum.discountAmount ?? 0),
      revenueByDay: byDay.map((b) => ({ dateKey: b.dateKey, netRevenue: Number(b._sum.netRevenue ?? 0) })),
      topProducts,
      topCustomers,
      topSalespeople: [],
    };
  }

  /** Curva ABC de produtos por faturamento (briefing: "Curva ABC"). */
  async getAbcCurve(tenantId: string, range: DateRange): Promise<{ tier: 'A' | 'B' | 'C'; productId: string; name: string; revenue: number; pct: number }[]> {
    const fromKey = toDateKey(range.from);
    const toKey = toDateKey(range.to);

    const grouped = await this.prisma.factSale.groupBy({ by: ['productId'], where: { tenantId, dateKey: { gte: fromKey, lte: toKey }, productId: { not: null } }, _sum: { netRevenue: true }, orderBy: { _sum: { netRevenue: 'desc' } } });

    const total = grouped.reduce((s, g) => s + Number(g._sum.netRevenue ?? 0), 0);
    if (total === 0) return [];

    const productIds = grouped.map((g) => g.productId!);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, shortDescription: true } });
    const nameMap = new Map(products.map((p) => [p.id, p.shortDescription]));

    let accumulated = 0;
    return grouped.map((g) => {
      const revenue = Number(g._sum.netRevenue ?? 0);
      accumulated += revenue;
      const pct = revenue / total;
      const accPct = accumulated / total;
      const tier: 'A' | 'B' | 'C' = accPct <= 0.8 ? 'A' : accPct <= 0.95 ? 'B' : 'C';
      return { tier, productId: g.productId!, name: nameMap.get(g.productId!) ?? g.productId!, revenue, pct };
    });
  }

  // ---- ESTOQUE ---------------------------------------------------------------

  async getStockKpis(tenantId: string): Promise<StockKpis> {
    const today = toDateKey(new Date());

    const [agg, minStockProducts] = await Promise.all([
      this.prisma.factStock.aggregate({ where: { tenantId, dateKey: today }, _sum: { totalValue: true }, _count: { productId: true } }),
      this.prisma.product.findMany({ where: { tenantId, stocks: { some: { quantityOnHand: { lte: 0 } } } }, select: { id: true } }),
    ]);

    return {
      totalSkus: Number(agg._count.productId ?? 0),
      totalValue: Number(agg._sum.totalValue ?? 0),
      skusBelowMin: minStockProducts.length,
      skusWithoutMovement: 0,
      abcCurve: [],
      turnover: 0,
      coverageDays: 0,
    };
  }

  // ---- FINANCEIRO -----------------------------------------------------------

  async getFinancialKpis(tenantId: string, range: DateRange): Promise<FinancialKpis> {
    const fromKey = toDateKey(range.from);
    const toKey = toDateKey(range.to);
    const where: any = { tenantId, dateKey: { gte: fromKey, lte: toKey } };

    const [recAgg, payAgg, overdueRec, overduePay] = await Promise.all([
      this.prisma.factFinancial.aggregate({ where: { ...where, type: 'receivable' }, _sum: { amount: true, paidAmount: true } }),
      this.prisma.factFinancial.aggregate({ where: { ...where, type: 'payable' }, _sum: { amount: true, paidAmount: true } }),
      this.prisma.factFinancial.aggregate({ where: { ...where, type: 'receivable', status: 'overdue' }, _sum: { amount: true } }),
      this.prisma.factFinancial.aggregate({ where: { ...where, type: 'payable', status: 'overdue' }, _sum: { amount: true } }),
    ]);

    const totalReceivable = Number(recAgg._sum.amount ?? 0);
    const totalPayable = Number(payAgg._sum.amount ?? 0);
    const overdueRecVal = Number(overdueRec._sum.amount ?? 0);

    return {
      totalReceivable,
      totalPayable,
      netCashFlow: totalReceivable - totalPayable,
      overdueReceivable: overdueRecVal,
      overduePayable: Number(overduePay._sum.amount ?? 0),
      defaultRate: totalReceivable > 0 ? overdueRecVal / totalReceivable : 0,
      revenueByMonth: [],
    };
  }

  // ---- OFICINA ---------------------------------------------------------------

  async getWorkshopKpis(tenantId: string, range: DateRange): Promise<WorkshopKpis> {
    const fromKey = toDateKey(range.from);
    const toKey = toDateKey(range.to);
    const where: any = { tenantId, dateKey: { gte: fromKey, lte: toKey } };

    // `isRework` é Boolean — não é somável via `_sum` no Prisma (só numéricos).
    // reworkCount/reworkRate por mecânico agora vêm de um count() à parte,
    // filtrando isRework: true, em vez do `_sum: { isRework: true }` inválido.
    const [agg, byMechanic, reworkByMechanic] = await Promise.all([
      this.prisma.factWorkshop.aggregate({ where, _sum: { totalAmount: true }, _count: { serviceOrderId: true }, _avg: { npsScore: true, durationHours: true } }),
      this.prisma.factWorkshop.groupBy({ by: ['mechanicId'], where: { ...where, mechanicId: { not: null } }, _count: { serviceOrderId: true }, _avg: { durationHours: true } }),
      this.prisma.factWorkshop.groupBy({ by: ['mechanicId'], where: { ...where, mechanicId: { not: null }, isRework: true }, _count: { serviceOrderId: true } }),
    ]);

    const total = Number(agg._count.serviceOrderId ?? 0);
    const reworkCountTotal = await this.prisma.factWorkshop.count({ where: { ...where, isRework: true } });
    const reworkByMechanicMap = new Map(reworkByMechanic.map((r) => [r.mechanicId, Number(r._count.serviceOrderId)]));

    const mechanicIds = byMechanic.map((b) => b.mechanicId!).filter(Boolean);
    const mechanics = await this.prisma.mechanic.findMany({ where: { id: { in: mechanicIds } }, include: { employee: { select: { name: true } } } });
    const nameMap = new Map(mechanics.map((m) => [m.id, m.employee.name]));

    return {
      totalOrders: total,
      completedOrders: total,
      averageTicket: total > 0 ? Number(agg._sum.totalAmount ?? 0) / total : 0,
      totalRevenue: Number(agg._sum.totalAmount ?? 0),
      averageDurationHours: agg._avg?.durationHours ? Number(agg._avg.durationHours) : null,
      reworkRate: total > 0 ? reworkCountTotal / total : 0,
      npsScore: agg._avg?.npsScore ? Number(agg._avg.npsScore) : null,
      mechanicPerformance: byMechanic.map((b) => ({
        mechanicId: b.mechanicId!,
        name: nameMap.get(b.mechanicId!) ?? b.mechanicId!,
        totalOrders: Number(b._count.serviceOrderId),
        avgDuration: b._avg?.durationHours ? Number(b._avg.durationHours) : null,
        reworkRate: Number(b._count.serviceOrderId) > 0 ? (reworkByMechanicMap.get(b.mechanicId) ?? 0) / Number(b._count.serviceOrderId) : 0,
      })),
    };
  }

  // ---- DIRETORIA ------------------------------------------------------------

  async getExecutiveSummary(tenantId: string, range: DateRange) {
    const [sales, financial, workshop] = await Promise.all([
      this.getSalesKpis(tenantId, range),
      this.getFinancialKpis(tenantId, range),
      this.getWorkshopKpis(tenantId, range),
    ]);

    return {
      revenue: sales.netRevenue,
      grossProfit: sales.grossProfit,
      margin: sales.margin,
      cashFlow: financial.netCashFlow,
      overdueRate: financial.defaultRate,
      workshopRevenue: workshop.totalRevenue,
      nps: workshop.npsScore,
    };
  }
}