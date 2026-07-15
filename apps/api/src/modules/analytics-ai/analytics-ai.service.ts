import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * AnalyticsAiService — IA Analítica do AutoCore ERP (Sprint 16).
 *
 * Gera previsões e insights usando os dados do Data Warehouse (Sprint 13).
 * Todas as previsões são armazenadas em `AiPrediction` com validade e
 * confiança, para exibição em dashboards e acionamento de automações.
 *
 * Modelos implementados (heurísticos sobre DW — sem dependência externa):
 *   — Previsão de vendas (média móvel + tendência linear)
 *   — Risco de ruptura de estoque (cobertura atual vs giro médio)
 *   — Risco de inadimplência (histórico de atrasos por cliente)
 *   — Risco de abandono de cliente (tempo sem comprar)
 *   — Sugestão automática de compras (reposição baseada em giro)
 *   — Produtos com maior margem
 *   — Produtos parados (sem giro em N dias)
 *   — Detecção de anomalias (desvio de receita vs média histórica)
 */
@Injectable()
export class AnalyticsAiService {
  constructor(private readonly prisma: PrismaService) {}

  async generateAllPredictions(tenantId: string): Promise<{ generated: number; types: string[] }> {
    const results = await Promise.allSettled([
      this.salesForecast(tenantId),
      this.stockRupturePrediction(tenantId),
      this.churnRiskPrediction(tenantId),
      this.delinquencyRiskPrediction(tenantId),
      this.purchaseSuggestions(tenantId),
      this.topMarginProducts(tenantId),
      this.slowMovingProducts(tenantId),
      this.revenueAnomalyDetection(tenantId),
    ]);

    const success = results.filter((r) => r.status === 'fulfilled');
    const types = ['sales_forecast', 'stock_rupture', 'churn_risk', 'delinquency_risk', 'purchase_suggestion', 'top_margin', 'slow_moving', 'revenue_anomaly'];

    return { generated: success.length, types: types.slice(0, success.length) };
  }

  getPredictions(tenantId: string, type?: string) {
    return this.prisma.aiPrediction.findMany({
      where: { tenantId, ...(type ? { type } : {}), validUntil: { gte: new Date() } },
      orderBy: { confidence: 'desc' },
      take: 50,
    });
  }

  // ---- PREVISÃO DE VENDAS (média móvel 30 dias) ----------------------------

  async salesForecast(tenantId: string) {
    const today = new Date();
    const days30 = this.toDateKey(new Date(today.getTime() - 30 * 86400000));
    const days60 = this.toDateKey(new Date(today.getTime() - 60 * 86400000));

    const [period1, period2] = await Promise.all([
      this.prisma.factSale.aggregate({ where: { tenantId, dateKey: { gte: days30 } }, _sum: { netRevenue: true } }),
      this.prisma.factSale.aggregate({ where: { tenantId, dateKey: { gte: days60, lt: days30 } }, _sum: { netRevenue: true } }),
    ]);

    const current = Number(period1._sum.netRevenue ?? 0);
    const previous = Number(period2._sum.netRevenue ?? 0);
    const trend = previous > 0 ? (current - previous) / previous : 0;
    const forecast30d = current * (1 + trend);

    await this.savePrediction(tenantId, 'sales_forecast', null, null, { current30d: current, trend: `${(trend * 100).toFixed(1)}%`, forecast30d }, 0.7, 30);

    return { forecast30d, trend };
  }

  // ---- RISCO DE RUPTURA DE ESTOQUE ----------------------------------------

  async stockRupturePrediction(tenantId: string) {
    const today = this.toDateKey(new Date());
    const days30 = this.toDateKey(new Date(Date.now() - 30 * 86400000));

    const stocks = await this.prisma.factStock.findMany({ where: { tenantId, dateKey: today }, select: { productId: true, quantityOnHand: true, warehouseId: true } });
    const sales = await this.prisma.factSale.groupBy({ by: ['productId'], where: { tenantId, dateKey: { gte: days30 }, productId: { not: null } }, _sum: { quantity: true } });

    const salesMap = new Map(sales.map((s) => [s.productId!, Number(s._sum.quantity ?? 0)]));
    const ruptures: { productId: string; daysOfCoverage: number; daily: number }[] = [];

    for (const s of stocks) {
      const monthlySales = Number(salesMap.get(s.productId) ?? 0);
      const dailySales = Number(monthlySales) / 30;
      if (dailySales <= 0) continue;
      const daysOfCoverage = Number(s.quantityOnHand as any) / dailySales;
      if (daysOfCoverage < 15) {
        ruptures.push({ productId: s.productId, daysOfCoverage: Math.round(daysOfCoverage), daily: dailySales });
        await this.savePrediction(tenantId, 'stock_rupture', 'product', s.productId, { daysOfCoverage: Math.round(daysOfCoverage), dailySales }, 0.85, 15);
      }
    }

    return { count: ruptures.length, items: ruptures.slice(0, 20) };
  }

  // ---- RISCO DE ABANDONO DE CLIENTE (churn) --------------------------------

  async churnRiskPrediction(tenantId: string) {
    const days90 = new Date(Date.now() - 90 * 86400000);
    const days180 = new Date(Date.now() - 180 * 86400000);

    // Clientes que compraram entre 90-180 dias atrás mas não compraram nos últimos 90 dias
    const churnRisk = await this.prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        sales: {
          some: { createdAt: { gte: days180, lt: days90 } },
          none: { createdAt: { gte: days90 } },
        },
      },
      select: { id: true, name: true },
      take: 50,
    });

    for (const c of churnRisk) {
      await this.savePrediction(tenantId, 'churn_risk', 'customer', c.id, { name: c.name, lastPurchaseDays: '90-180', recommendation: 'Enviar campanha de reativação' }, 0.75, 30);
    }

    return { count: churnRisk.length };
  }

  // ---- RISCO DE INADIMPLÊNCIA ---------------------------------------------

  async delinquencyRiskPrediction(tenantId: string) {
    const overdue = await this.prisma.accountsReceivable.findMany({
      where: { tenantId, status: 'overdue' },
      include: { customer: { select: { id: true, name: true } } },
      take: 50,
    });

    for (const ar of overdue) {
      if (!ar.customer) continue;
      await this.savePrediction(tenantId, 'delinquency_risk', 'customer', ar.customer.id, { name: ar.customer.name, overdueAmount: Number(ar.amount), recommendation: 'Acionar cobrança preventiva' }, 0.9, 30);
    }

    return { count: overdue.length };
  }

  // ---- SUGESTÃO DE COMPRAS ------------------------------------------------

  async purchaseSuggestions(tenantId: string) {
    const days30 = this.toDateKey(new Date(Date.now() - 30 * 86400000));
    const today = this.toDateKey(new Date());

    const sales = await this.prisma.factSale.groupBy({ by: ['productId'], where: { tenantId, dateKey: { gte: days30 }, productId: { not: null } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 30 });
    const stocks = await this.prisma.factStock.findMany({ where: { tenantId, dateKey: today, productId: { in: sales.map((s) => s.productId!) } }, select: { productId: true, quantityOnHand: true } });
    const stockMap = new Map<string, number>(stocks.map((s) => [s.productId, Number(s.quantityOnHand)]));

    const suggestions: { productId: string; suggestedQty: number; monthlySales: number }[] = [];
    for (const s of sales) {
      const monthlySales = Number(s._sum.quantity ?? 0);
      const currentStock = stockMap.get(s.productId!) ?? 0;
      const coverage = currentStock / (monthlySales / 30);
      if (coverage < 15 && s.productId) {
        const suggestedQty = Math.ceil(monthlySales * 1.5 - currentStock);
        suggestions.push({ productId: s.productId, suggestedQty, monthlySales });
        await this.savePrediction(tenantId, 'purchase_suggestion', 'product', s.productId, { suggestedQuantity: suggestedQty, monthlySales, coverageDays: Math.round(coverage) }, 0.8, 7);
      }
    }

    return { count: suggestions.length, items: suggestions.slice(0, 10) };
  }

  // ---- TOP MARGENS --------------------------------------------------------

  async topMarginProducts(tenantId: string) {
    const days30 = this.toDateKey(new Date(Date.now() - 30 * 86400000));
    const top = await this.prisma.factSale.groupBy({ by: ['productId'], where: { tenantId, dateKey: { gte: days30 }, productId: { not: null } }, _avg: { margin: true }, _sum: { grossProfit: true }, orderBy: { _avg: { margin: 'desc' } }, take: 10 });

    for (const p of top.slice(0, 10)) {
      if (!p.productId) continue;
      await this.savePrediction(tenantId, 'top_margin', 'product', p.productId, { avgMargin: Number(p._avg.margin ?? 0), grossProfit30d: Number(p._sum.grossProfit ?? 0) }, 0.9, 30);
    }

    return { count: top.length };
  }

  // ---- PRODUTOS PARADOS ---------------------------------------------------

  async slowMovingProducts(tenantId: string) {
    const days90 = this.toDateKey(new Date(Date.now() - 90 * 86400000));
    const today = this.toDateKey(new Date());

    const withStock = await this.prisma.factStock.findMany({ where: { tenantId, dateKey: today, quantityOnHand: { gt: 0 } }, select: { productId: true, quantityOnHand: true, totalValue: true } });
    const withRecentSales = await this.prisma.factSale.groupBy({ by: ['productId'], where: { tenantId, dateKey: { gte: days90 } } });
    const activeProducts = new Set(withRecentSales.map((s) => s.productId));

    const slow = withStock.filter((s) => !activeProducts.has(s.productId)).slice(0, 50);

    for (const s of slow) {
      await this.savePrediction(tenantId, 'slow_moving', 'product', s.productId, { daysWithoutSales: 90, stockValue: Number(s.totalValue), recommendation: 'Considerar promoção ou liquidação' }, 0.85, 30);
    }

    return { count: slow.length };
  }

  // ---- DETECÇÃO DE ANOMALIAS -----------------------------------------------

  async revenueAnomalyDetection(tenantId: string) {
    const today = this.toDateKey(new Date());
    const yesterday = this.toDateKey(new Date(Date.now() - 86400000));

    const [todayRev, last7Avg] = await Promise.all([
      this.prisma.factSale.aggregate({ where: { tenantId, dateKey: today }, _sum: { netRevenue: true } }),
      this.prisma.factSale.aggregate({ where: { tenantId, dateKey: { gte: this.toDateKey(new Date(Date.now() - 7 * 86400000)), lt: yesterday } }, _sum: { netRevenue: true } }),
    ]);

    const todayVal = Number(todayRev._sum.netRevenue ?? 0);
    const dailyAvg = Number(last7Avg._sum.netRevenue ?? 0) / 6;
    const deviation = dailyAvg > 0 ? Math.abs(todayVal - dailyAvg) / dailyAvg : 0;

    if (deviation > 0.5) {
      const direction = todayVal > dailyAvg ? 'acima' : 'abaixo';
      await this.savePrediction(tenantId, 'revenue_anomaly', null, null, { todayRevenue: todayVal, dailyAverage: dailyAvg, deviationPct: `${(deviation * 100).toFixed(0)}%`, direction, message: `Faturamento ${direction} da média em ${(deviation * 100).toFixed(0)}%` }, deviation > 0.5 ? 0.8 : 0.6, 1);
    }

    return { anomaly: deviation > 0.5, deviation };
  }

  // ---- HELPERS -------------------------------------------------------------

  private async savePrediction(tenantId: string, type: string, entityType: string | null, entityId: string | null, prediction: Record<string, unknown>, confidence: number, horizonDays: number) {
    const validUntil = new Date(Date.now() + horizonDays * 86400000);

    await this.prisma.aiPrediction.upsert({
      where: { id: `${tenantId}_${type}_${entityId ?? 'global'}`.slice(0, 36) },
      create: { id: `${tenantId}_${type}_${entityId ?? 'global'}`.slice(0, 36), tenantId, type, entityType, entityId, prediction: prediction as Prisma.InputJsonValue, confidence, horizon: horizonDays, validUntil },
      update: { prediction: prediction as Prisma.InputJsonValue, confidence, validUntil },
    });
  }

  private toDateKey(date: Date): number {
    return parseInt(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
  }
}
