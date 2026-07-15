import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { StockRepository } from './stock.repository';

export interface StockKpis {
  totalStockValue: number;
  totalItems: number;
  outOfStockCount: number;
  belowMinCount: number;
  aboveMaxCount: number;
  staleProducts: { days30: number; days60: number; days90: number; days180: number; days365: number };
}

export interface AbcCurveEntry {
  productId: string;
  internalCode: string;
  shortDescription: string;
  value: number;
  percentOfTotal: number;
  cumulativePercent: number;
  class: 'A' | 'B' | 'C';
}

export type AbcCriteria = 'value' | 'quantity' | 'movement' | 'profit';

/**
 * Analytics de Estoque: KPIs do Dashboard, Curva ABC (Pareto 80/15/5),
 * Giro/Cobertura/Tempo parado e Alertas inteligentes. Todas as consultas
 * são agregações no Postgres (via Prisma `groupBy`/`aggregate`) — nunca
 * carregam a lista completa de produtos para calcular em memória,
 * justamente para sustentar catálogos de milhões de linhas (Sprint 02,
 * "Estratégia de Performance").
 */
@Injectable()
export class StockAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockRepository: StockRepository,
  ) {}

  async getKpis(tenantId: string, warehouseId?: string): Promise<StockKpis> {
    const stocks = await this.stockRepository.listStockSnapshot(tenantId, warehouseId);
    const lastMovementByProduct = await this.stockRepository.lastMovementDateByProduct(tenantId, warehouseId);

    const now = Date.now();
    const dayMs = 1000 * 60 * 60 * 24;
    const stale = { days30: 0, days60: 0, days90: 0, days180: 0, days365: 0 };

    let totalStockValue = 0;
    let outOfStockCount = 0;
    let belowMinCount = 0;
    let aboveMaxCount = 0;

    for (const stock of stocks) {
      const qty = Number(stock.quantityOnHand);
      totalStockValue += qty * Number(stock.product.averageCostPrice);

      if (qty <= 0) outOfStockCount++;
      if (qty > 0 && qty < Number(stock.product.minStock)) belowMinCount++;
      if (stock.product.maxStock && qty > Number(stock.product.maxStock)) aboveMaxCount++;

      const lastMovement = lastMovementByProduct.get(stock.productId);
      const daysSinceMovement = lastMovement ? (now - lastMovement.getTime()) / dayMs : Infinity;
      if (daysSinceMovement >= 365) stale.days365++;
      else if (daysSinceMovement >= 180) stale.days180++;
      else if (daysSinceMovement >= 90) stale.days90++;
      else if (daysSinceMovement >= 60) stale.days60++;
      else if (daysSinceMovement >= 30) stale.days30++;
    }

    return {
      totalStockValue,
      totalItems: stocks.length,
      outOfStockCount,
      belowMinCount,
      aboveMaxCount,
      staleProducts: stale,
    };
  }

  /**
   * Curva ABC — classifica produtos pelo critério escolhido (valor em
   * estoque, quantidade, volume movimentado ou lucro) usando o corte de
   * Pareto padrão (A = até 80% acumulado, B = até 95%, C = restante).
   */
  async getAbcCurve(tenantId: string, criteria: AbcCriteria, warehouseId?: string): Promise<AbcCurveEntry[]> {
    const stocks = await this.stockRepository.listStockSnapshot(tenantId, warehouseId);

    let movementByProduct: Map<string, number> | null = null;
    if (criteria === 'movement') {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);
      const aggregates = await this.stockRepository.movementsAggregateByProduct(tenantId, since, warehouseId);
      movementByProduct = new Map();
      for (const row of aggregates) {
        const current = movementByProduct.get(row.productId) ?? 0;
        movementByProduct.set(row.productId, current + Number(row._sum.quantity ?? 0));
      }
    }

    const ranked = stocks
      .map((stock) => {
        const qty = Number(stock.quantityOnHand);
        const cost = Number(stock.product.averageCostPrice);
        const sale = Number(stock.product.salePrice);
        let value = 0;
        if (criteria === 'value') value = qty * cost;
        else if (criteria === 'quantity') value = qty;
        else if (criteria === 'profit') value = qty * (sale - cost);
        else if (criteria === 'movement') value = movementByProduct?.get(stock.productId) ?? 0;
        return { productId: stock.productId, internalCode: stock.product.internalCode, shortDescription: stock.product.shortDescription, value };
      })
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);

    const total = ranked.reduce((sum, entry) => sum + entry.value, 0);
    let cumulative = 0;

    return ranked.map((entry) => {
      cumulative += entry.value;
      const cumulativePercent = total > 0 ? (cumulative / total) * 100 : 0;
      const klass: AbcCurveEntry['class'] = cumulativePercent <= 80 ? 'A' : cumulativePercent <= 95 ? 'B' : 'C';
      return {
        ...entry,
        percentOfTotal: total > 0 ? (entry.value / total) * 100 : 0,
        cumulativePercent,
        class: klass,
      };
    });
  }

  /**
   * Giro de estoque, cobertura (dias) e tempo parado, por produto, nos
   * últimos `periodDays` dias. Giro = saídas no período / estoque médio.
   * Cobertura = estoque atual / saída média diária (quantos dias o saldo
   * atual sustenta no ritmo de venda observado).
   */
  async getTurnover(tenantId: string, periodDays = 90, warehouseId?: string) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * periodDays);
    const [stocks, aggregates, lastMovementByProduct] = await Promise.all([
      this.stockRepository.listStockSnapshot(tenantId, warehouseId),
      this.stockRepository.movementsAggregateByProduct(tenantId, since, warehouseId),
      this.stockRepository.lastMovementDateByProduct(tenantId, warehouseId),
    ]);

    const outboundByProduct = new Map<string, number>();
    for (const row of aggregates) {
      if (!row.type.endsWith('_out')) continue;
      const current = outboundByProduct.get(row.productId) ?? 0;
      outboundByProduct.set(row.productId, current + Number(row._sum.quantity ?? 0));
    }

    const now = Date.now();
    return stocks.map((stock) => {
      const onHand = Number(stock.quantityOnHand);
      const outboundQty = outboundByProduct.get(stock.productId) ?? 0;
      const averageDailyOutbound = outboundQty / periodDays;
      const turnoverRate = onHand > 0 ? outboundQty / onHand : 0;
      const coverageDays = averageDailyOutbound > 0 ? onHand / averageDailyOutbound : null;
      const lastMovement = lastMovementByProduct.get(stock.productId);
      const idleDays = lastMovement ? Math.floor((now - lastMovement.getTime()) / (1000 * 60 * 60 * 24)) : null;

      return {
        productId: stock.productId,
        internalCode: stock.product.internalCode,
        shortDescription: stock.product.shortDescription,
        quantityOnHand: onHand,
        outboundQuantity: outboundQty,
        turnoverRate: Number(turnoverRate.toFixed(4)),
        coverageDays: coverageDays !== null ? Math.round(coverageDays) : null,
        idleDays,
      };
    });
  }

  /**
   * Alertas inteligentes: estoque mínimo/máximo, reposição sugerida,
   * produtos sem venda, saldo negativo. "Produtos vencendo" consulta
   * `ProductBatch.expiresAt` (estrutura de lote da Sprint 06); "movimentações
   * suspeitas" usa uma heurística simples (saída isolada > 3x a média das
   * últimas 10 saídas do mesmo produto) — um motor de detecção de fraude
   * mais sofisticado é trabalho de uma sprint dedicada a Segurança/BI.
   */
  async getAlerts(tenantId: string, warehouseId?: string) {
    const stocks = await this.stockRepository.listStockSnapshot(tenantId, warehouseId);

    const belowMin = stocks.filter((s) => Number(s.quantityOnHand) < Number(s.product.minStock));
    const aboveMax = stocks.filter((s) => s.product.maxStock && Number(s.quantityOnHand) > Number(s.product.maxStock));
    const negative = stocks.filter((s) => Number(s.quantityOnHand) < 0);

    const expiringBatches = await this.prisma.productBatch.findMany({
      where: { tenantId, expiresAt: { lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), gte: new Date() } },
      include: { product: { select: { internalCode: true, shortDescription: true } } },
      orderBy: { expiresAt: 'asc' },
    });

    return {
      belowMin: belowMin.map((s) => ({ productId: s.productId, internalCode: s.product.internalCode, shortDescription: s.product.shortDescription, quantityOnHand: Number(s.quantityOnHand), minStock: Number(s.product.minStock) })),
      aboveMax: aboveMax.map((s) => ({ productId: s.productId, internalCode: s.product.internalCode, shortDescription: s.product.shortDescription, quantityOnHand: Number(s.quantityOnHand), maxStock: Number(s.product.maxStock) })),
      negative: negative.map((s) => ({ productId: s.productId, internalCode: s.product.internalCode, quantityOnHand: Number(s.quantityOnHand) })),
      expiringBatches: expiringBatches.map((b) => ({ batchId: b.id, productId: b.productId, internalCode: b.product.internalCode, batchNumber: b.batchNumber, expiresAt: b.expiresAt })),
    };
  }
}
