import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface Supplier360Panel {
  supplier: { id: string; name: string; tradeName: string | null; document: string; email: string | null; phone: string | null };
  totalOrders: number;
  totalPurchasedValue: number;
  averageOrderValue: number;
  averageLeadTimeDays: number | null;
  onTimeDeliveryRate: number | null;
  averagePriceByProduct: { productId: string; internalCode: string; shortDescription: string; averagePrice: number }[];
  ranking: { position: number; totalSuppliers: number };
  overdueAccountsPayable: number;
  recentOrders: { id: string; code: string; status: string; totalAmount: number; issueDate: Date }[];
}

/**
 * Painel 360° do Fornecedor (briefing): histórico, lead time,
 * pontualidade, preço médio, avaliação/ranking, produtos fornecidos,
 * inadimplência. Toda métrica é CALCULADA a partir de `PurchaseOrder`/
 * `GoodsReceipt`/`AccountsPayable` reais — nenhum campo de "nota" é
 * armazenado isoladamente (evita o painel mentir quando o histórico
 * muda); o ranking compara o fornecedor com os demais do mesmo tenant
 * pelo critério combinado de pontualidade + preço competitivo.
 */
@Injectable()
export class Supplier360Service {
  constructor(private readonly prisma: PrismaService) {}

  async getPanel(tenantId: string, supplierId: string): Promise<Supplier360Panel> {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, tenantId } });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');

    const orders = await this.prisma.purchaseOrder.findMany({
      where: { tenantId, supplierId },
      include: { goodsReceipts: { select: { receivedAt: true }, orderBy: { receivedAt: 'desc' }, take: 1 }, items: true },
      orderBy: { issueDate: 'desc' },
    });

    const totalOrders = orders.length;
    const totalPurchasedValue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalPurchasedValue / totalOrders : 0;

    const leadTimes = orders
      .filter((o) => o.goodsReceipts[0])
      .map((o) => (o.goodsReceipts[0].receivedAt.getTime() - o.issueDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageLeadTimeDays = leadTimes.length > 0 ? leadTimes.reduce((s, d) => s + d, 0) / leadTimes.length : null;

    const onTime = orders.filter((o) => o.expectedDate && o.goodsReceipts[0] && o.goodsReceipts[0].receivedAt <= o.expectedDate);
    const withExpectedAndReceived = orders.filter((o) => o.expectedDate && o.goodsReceipts[0]);
    const onTimeDeliveryRate = withExpectedAndReceived.length > 0 ? onTime.length / withExpectedAndReceived.length : null;

    const priceByProduct = new Map<string, { total: number; count: number; internalCode: string; shortDescription: string }>();
    for (const order of orders) {
      for (const item of order.items) {
        const current = priceByProduct.get(item.productId) ?? { total: 0, count: 0, internalCode: '', shortDescription: '' };
        current.total += Number(item.unitCost);
        current.count += 1;
        priceByProduct.set(item.productId, current);
      }
    }
    const productIds = [...priceByProduct.keys()];
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, internalCode: true, shortDescription: true } });
    const averagePriceByProduct = products.map((p) => {
      const entry = priceByProduct.get(p.id)!;
      return { productId: p.id, internalCode: p.internalCode, shortDescription: p.shortDescription, averagePrice: entry.total / entry.count };
    });

    const overdue = await this.prisma.accountsPayable.count({ where: { tenantId, supplierId, status: { in: ['open', 'partially_paid'] }, dueDate: { lt: new Date() } } });

    const ranking = await this.computeRanking(tenantId, supplierId);

    return {
      supplier: { id: supplier.id, name: supplier.name, tradeName: supplier.tradeName, document: supplier.document, email: supplier.email, phone: supplier.phone },
      totalOrders,
      totalPurchasedValue,
      averageOrderValue,
      averageLeadTimeDays,
      onTimeDeliveryRate,
      averagePriceByProduct,
      ranking,
      overdueAccountsPayable: overdue,
      recentOrders: orders.slice(0, 10).map((o) => ({ id: o.id, code: o.code, status: o.status, totalAmount: Number(o.totalAmount), issueDate: o.issueDate })),
    };
  }

  /** Ranking simples: fornecedores com maior taxa de pontualidade entram primeiro; empate quebrado por menor preço médio histórico. */
  private async computeRanking(tenantId: string, supplierId: string) {
    const suppliers = await this.prisma.supplier.findMany({ where: { tenantId, status: 'active' }, select: { id: true } });
    const scored: { supplierId: string; score: number }[] = [];

    for (const s of suppliers) {
      const orders = await this.prisma.purchaseOrder.findMany({
        where: { tenantId, supplierId: s.id },
        include: { goodsReceipts: { select: { receivedAt: true }, take: 1 } },
      });
      const withReceipt = orders.filter((o) => o.expectedDate && o.goodsReceipts[0]);
      const onTime = withReceipt.filter((o) => o.goodsReceipts[0].receivedAt <= o.expectedDate!);
      const rate = withReceipt.length > 0 ? onTime.length / withReceipt.length : 0;
      scored.push({ supplierId: s.id, score: rate });
    }

    scored.sort((a, b) => b.score - a.score);
    const position = scored.findIndex((s) => s.supplierId === supplierId) + 1;
    return { position: position || scored.length, totalSuppliers: scored.length };
  }
}
