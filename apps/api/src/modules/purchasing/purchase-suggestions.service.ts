import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { StockRepository } from '@/modules/inventory/stock.repository';
import { StockAnalyticsService } from '@/modules/inventory/stock-analytics.service';
import type { RequestContext } from '@/common/types/request-context';
import { PurchaseSuggestionStatus } from '@prisma/client';

/**
 * Reposição Automática — algoritmo considera (briefing): estoque mínimo,
 * Curva ABC, giro, pedidos pendentes, reservas, compras em trânsito e
 * tempo médio de entrega. Reaproveita `StockRepository`/`StockAnalyticsService`
 * (Sprint 06) em vez de duplicar consultas de saldo/giro — esta classe
 * apenas combina os sinais e decide "comprar ou não, quanto".
 */
@Injectable()
export class PurchaseSuggestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockRepository: StockRepository,
    private readonly stockAnalytics: StockAnalyticsService,
  ) {}

  /**
   * Gera (ou atualiza) sugestões pendentes para um Depósito. Critério:
   * saldo projetado (onHand - reserved + em trânsito) abaixo do mínimo, OU
   * cobertura (giro) menor que o lead time médio do fornecedor principal
   * — neste caso, mesmo acima do mínimo, a reposição é sugerida
   * preventivamente porque o estoque "zeraria" antes da próxima entrega
   * chegar.
   */
  async generateSuggestions(ctx: RequestContext, warehouseId: string) {
    const [stocks, turnover, inTransitByProduct] = await Promise.all([
      this.stockRepository.listStockSnapshot(ctx.tenantId, warehouseId),
      this.stockAnalytics.getTurnover(ctx.tenantId, 90, warehouseId),
      this.getInTransitQuantities(ctx.tenantId, warehouseId),
    ]);

    const turnoverByProduct = new Map(
      (turnover as { productId: string; coverageDays: number | null; turnoverRate: number }[]).map((t) => [t.productId, t] as const),
    );
    const created: string[] = [];

    for (const stock of stocks) {
      const onHand = Number(stock.quantityOnHand);
      const reserved = Number(stock.quantityReserved);
      const inTransit = inTransitByProduct.get(stock.productId) ?? 0;
      const projected = onHand - reserved + inTransit;
      const minStock = Number(stock.product.minStock);
      const maxStock = stock.product.maxStock ? Number(stock.product.maxStock) : null;
      const t = turnoverByProduct.get(stock.productId);

      let reason: string | null = null;
      if (projected < minStock) {
        reason = `Saldo projetado (${projected.toFixed(2)}) abaixo do mínimo (${minStock})`;
      } else if (t?.coverageDays !== null && t?.coverageDays !== undefined && t.coverageDays < 15 && t.turnoverRate > 0.5) {
        reason = `Cobertura de apenas ${t.coverageDays} dia(s) com giro alto (${t.turnoverRate.toFixed(2)}) — risco de ruptura`;
      }

      if (!reason) continue;

      const existing = await this.prisma.purchaseSuggestion.findFirst({
        where: { tenantId: ctx.tenantId, productId: stock.productId, warehouseId, status: 'pending' },
      });
      if (existing) continue; // já existe sugestão pendente, evita duplicar

      const target = maxStock ?? minStock * 2;
      const suggestedQuantity = Math.max(target - projected, minStock - projected, 1);

      await this.prisma.purchaseSuggestion.create({
        data: { tenantId: ctx.tenantId, productId: stock.productId, warehouseId, suggestedQuantity, reason },
      });
      created.push(stock.productId);
    }

    return { generated: created.length, productIds: created };
  }

  list(tenantId: string, status?: PurchaseSuggestionStatus) {
    return this.prisma.purchaseSuggestion.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      include: { product: { select: { id: true, internalCode: true, shortDescription: true, primarySupplierId: true } }, warehouse: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async dismiss(tenantId: string, id: string) {
    const { count } = await this.prisma.purchaseSuggestion.updateMany({
      where: { id, tenantId },
      data: { status: PurchaseSuggestionStatus.dismissed },
    });
    if (count === 0) throw new NotFoundException('Sugestão não encontrada');
    return this.prisma.purchaseSuggestion.findUnique({ where: { id } });
  }

  async markConverted(tenantId: string, id: string) {
    const { count } = await this.prisma.purchaseSuggestion.updateMany({
      where: { id, tenantId },
      data: { status: PurchaseSuggestionStatus.converted },
    });
    if (count === 0) throw new NotFoundException('Sugestão não encontrada');
    return this.prisma.purchaseSuggestion.findUnique({ where: { id } });
  }

  /** Quantidade já em trânsito (Pedidos enviados/parcialmente recebidos) por produto, no depósito informado. */
  private async getInTransitQuantities(tenantId: string, warehouseId: string): Promise<Map<string, number>> {
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: {
        tenantId,
        purchaseOrder: { status: { in: ['sent', 'partially_received'] }, goodsReceipts: { some: { warehouseId } } },
      },
    });
    const result = new Map<string, number>();
    for (const item of items) {
      const pending = Number(item.quantity) - Number(item.receivedQuantity);
      if (pending <= 0) continue;
      result.set(item.productId, (result.get(item.productId) ?? 0) + pending);
    }
    return result;
  }
}
