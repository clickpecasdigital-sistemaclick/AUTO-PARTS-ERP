import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface PurchasingKpis {
  totalToday: number;
  totalThisMonth: number;
  pendingOrders: number;
  approvedOrders: number;
  cancelledOrders: number;
  topSupplier: { supplierId: string; name: string; totalValue: number } | null;
  estimatedSavings: number;
  averageLeadTimeDays: number | null;
  productsAwaitingPurchase: number;
  urgentReplenishments: number;
}

/** Dashboard de Compras — KPIs em tempo real, agregados via SQL (groupBy/aggregate), nunca em memória. */
@Injectable()
export class PurchasingAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(tenantId: string): Promise<PurchasingKpis> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

    const [todayAgg, monthAgg, pending, approved, cancelled, bySupplier, suggestions] = await Promise.all([
      this.prisma.purchaseOrder.aggregate({ where: { tenantId, issueDate: { gte: startOfDay } }, _sum: { totalAmount: true } }),
      this.prisma.purchaseOrder.aggregate({ where: { tenantId, issueDate: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      this.prisma.purchaseOrder.count({ where: { tenantId, status: 'draft' } }),
      this.prisma.purchaseOrder.count({ where: { tenantId, status: { in: ['sent', 'partially_received', 'received'] } } }),
      this.prisma.purchaseOrder.count({ where: { tenantId, status: 'cancelled' } }),
      this.prisma.purchaseOrder.groupBy({ by: ['supplierId'], where: { tenantId, issueDate: { gte: startOfMonth } }, _sum: { totalAmount: true }, orderBy: { _sum: { totalAmount: 'desc' } }, take: 1 }),
      this.prisma.purchaseSuggestion.findMany({ where: { tenantId, status: 'pending' } }),
    ]);

    let topSupplier: PurchasingKpis['topSupplier'] = null;
    if (bySupplier[0]) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: bySupplier[0].supplierId } });
      topSupplier = { supplierId: bySupplier[0].supplierId, name: supplier?.tradeName ?? supplier?.name ?? '—', totalValue: Number(bySupplier[0]._sum.totalAmount ?? 0) };
    }

    const estimatedSavings = await this.computeEstimatedSavings(tenantId, startOfMonth);
    const averageLeadTimeDays = await this.computeAverageLeadTime(tenantId);

    return {
      totalToday: Number(todayAgg._sum.totalAmount ?? 0),
      totalThisMonth: Number(monthAgg._sum.totalAmount ?? 0),
      pendingOrders: pending,
      approvedOrders: approved,
      cancelledOrders: cancelled,
      topSupplier,
      estimatedSavings,
      averageLeadTimeDays,
      productsAwaitingPurchase: suggestions.length,
      urgentReplenishments: suggestions.filter((s) => s.reason.toLowerCase().includes('ruptura') || s.reason.toLowerCase().includes('abaixo do mínimo')).length,
    };
  }

  /** Linha do tempo de compras (últimos N dias) — alimenta o gráfico de linha do Dashboard. */
  async getTimeline(tenantId: string, days = 30) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
    const orders = await this.prisma.purchaseOrder.findMany({ where: { tenantId, issueDate: { gte: since } }, select: { issueDate: true, totalAmount: true } });

    const byDay = new Map<string, number>();
    for (const order of orders) {
      const key = order.issueDate.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(order.totalAmount));
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total }));
  }

  /** Compras por fornecedor (mês atual) — alimenta gráfico de barras. */
  async getPurchasesBySupplier(tenantId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const grouped = await this.prisma.purchaseOrder.groupBy({ by: ['supplierId'], where: { tenantId, issueDate: { gte: startOfMonth } }, _sum: { totalAmount: true } });
    const suppliers = await this.prisma.supplier.findMany({ where: { id: { in: grouped.map((g) => g.supplierId) } }, select: { id: true, name: true, tradeName: true } });
    const nameById = new Map(suppliers.map((s) => [s.id, s.tradeName ?? s.name]));

    return grouped.map((g) => ({ supplierId: g.supplierId, supplierName: nameById.get(g.supplierId) ?? '—', total: Number(g._sum.totalAmount ?? 0) }));
  }

  /** Estimativa de economia: diferença entre a proposta vencedora e a média das demais propostas, nas cotações adjudicadas do período. */
  private async computeEstimatedSavings(tenantId: string, since: Date): Promise<number> {
    const quotations = await this.prisma.purchaseQuotation.findMany({
      where: { tenantId, status: 'awarded', createdAt: { gte: since } },
      include: { suppliers: { include: { items: true } } },
    });

    let totalSavings = 0;
    for (const quotation of quotations) {
      const totals = quotation.suppliers
        .filter((s) => s.respondedAt)
        .map((s) => s.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0) + Number(s.freightAmount));
      if (totals.length < 2) continue;
      const winnerTotal = quotation.suppliers.find((s) => s.isWinner);
      if (!winnerTotal) continue;
      const winnerValue = winnerTotal.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0) + Number(winnerTotal.freightAmount);
      const avgOthers = totals.reduce((s, v) => s + v, 0) / totals.length;
      totalSavings += Math.max(0, avgOthers - winnerValue);
    }
    return totalSavings;
  }

  private async computeAverageLeadTime(tenantId: string): Promise<number | null> {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { tenantId, status: 'received', issueDate: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90) } },
      include: { goodsReceipts: { select: { receivedAt: true }, orderBy: { receivedAt: 'desc' }, take: 1 } },
    });
    const leadTimes = orders.filter((o) => o.goodsReceipts[0]).map((o) => (o.goodsReceipts[0].receivedAt.getTime() - o.issueDate.getTime()) / (1000 * 60 * 60 * 24));
    return leadTimes.length > 0 ? leadTimes.reduce((s, d) => s + d, 0) / leadTimes.length : null;
  }
}
