import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface PdvDashboardKpis {
  totalSalesToday: number;
  salesCountToday: number;
  averageTicket: number;
  itemsSoldToday: number;
  cancellationsToday: number;
  discountsGrantedToday: number;
}

/** Dashboard PDV (briefing): vendas do dia, ticket médio, itens vendidos, mais vendidos, operadores, formas de pagamento, cancelamentos, descontos. */
@Injectable()
export class PdvAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(tenantId: string, branchId?: string): Promise<PdvDashboardKpis> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const where = { tenantId, issuedAt: { gte: startOfDay }, ...(branchId ? { branchId } : {}) };

    const [paidAgg, itemsAgg, cancelledCount, discountAgg] = await Promise.all([
      this.prisma.sale.aggregate({ where: { ...where, status: { in: ['paid', 'partially_paid'] } }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.saleItem.aggregate({ where: { tenantId, sale: { issuedAt: { gte: startOfDay }, status: { in: ['paid', 'partially_paid'] } } }, _sum: { quantity: true } }),
      this.prisma.sale.count({ where: { ...where, status: 'cancelled' } }),
      this.prisma.sale.aggregate({ where: { ...where, status: { in: ['paid', 'partially_paid'] } }, _sum: { discountAmount: true } }),
    ]);

    const totalSales = Number(paidAgg._sum.totalAmount ?? 0);
    const salesCount = paidAgg._count;

    return {
      totalSalesToday: totalSales,
      salesCountToday: salesCount,
      averageTicket: salesCount > 0 ? totalSales / salesCount : 0,
      itemsSoldToday: Number(itemsAgg._sum.quantity ?? 0),
      cancellationsToday: cancelledCount,
      discountsGrantedToday: Number(discountAgg._sum.discountAmount ?? 0),
    };
  }

  async getTopProducts(tenantId: string, limit = 10) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const grouped = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { tenantId, sale: { issuedAt: { gte: startOfDay }, status: { in: ['paid', 'partially_paid'] } } },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const products: { id: string; internalCode: string; shortDescription: string }[] = await this.prisma.product.findMany({ where: { id: { in: grouped.map((g) => g.productId) } }, select: { id: true, internalCode: true, shortDescription: true } });
    const byId = new Map(products.map((p) => [p.id, p] as const));

    return grouped.map((g) => ({
      productId: g.productId,
      internalCode: byId.get(g.productId)?.internalCode ?? '—',
      shortDescription: byId.get(g.productId)?.shortDescription ?? '—',
      quantitySold: Number(g._sum.quantity ?? 0),
      totalAmount: Number(g._sum.totalAmount ?? 0),
    }));
  }

  /** Vendas por operador (criador da venda) — ranking do dia. */
  async getByOperator(tenantId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const grouped = await this.prisma.sale.groupBy({
      by: ['createdBy'],
      where: { tenantId, issuedAt: { gte: startOfDay }, status: { in: ['paid', 'partially_paid'] }, createdBy: { not: null } },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
    });

    const userIds = grouped.map((g) => g.createdBy).filter((id): id is string => !!id);
    const users: { id: string; fullName: string | null; email: string }[] = await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } });
    const byId = new Map(users.map((u) => [u.id, u] as const));

    return grouped.map((g) => ({ userId: g.createdBy, name: byId.get(g.createdBy!)?.fullName ?? byId.get(g.createdBy!)?.email ?? '—', salesCount: g._count, totalAmount: Number(g._sum.totalAmount ?? 0) }));
  }

  /** Distribuição por forma de pagamento — alimenta gráfico de pizza/barras. */
  async getByPaymentMethod(tenantId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const grouped = await this.prisma.salePayment.groupBy({
      by: ['paymentMethodId'],
      where: { tenantId, paidAt: { gte: startOfDay } },
      _sum: { amount: true },
    });

    const methods: { id: string; name: string }[] = await this.prisma.paymentMethod.findMany({ where: { id: { in: grouped.map((g) => g.paymentMethodId) } } });
    const byId = new Map(methods.map((m) => [m.id, m] as const));

    return grouped.map((g) => ({ paymentMethodId: g.paymentMethodId, name: byId.get(g.paymentMethodId)?.name ?? '—', total: Number(g._sum.amount ?? 0) }));
  }
}
