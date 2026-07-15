import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * ETL Service — extração incremental das tabelas operacionais para o DW.
 * Cursor: EtlSyncControl.lastSyncAt — apenas novos registros processados.
 * Padrão upsert por chave natural garante idempotência.
 */
@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);
  private readonly CHUNK = 500;

  constructor(private readonly prisma: PrismaService) {}

  async runAllForTenant(tenantId: string) {
    const results: Record<string, { processed: number; error?: string }> = {};
    for (const entity of ['sale', 'purchase', 'stock', 'financial', 'workshop'] as const) {
      results[entity] = await this.runEntity(tenantId, entity);
    }
    return results;
  }

  async runEntity(tenantId: string, entity: 'sale' | 'purchase' | 'stock' | 'financial' | 'workshop') {
    const ctrl = await this.getOrCreateControl(tenantId, entity);
    await this.prisma.etlSyncControl.update({ where: { id: ctrl.id }, data: { lastStatus: 'running' } });

    try {
      let processed = 0;
      if (entity === 'sale') processed = await this.syncSales(tenantId, ctrl.lastSyncAt);
      if (entity === 'purchase') processed = await this.syncPurchases(tenantId, ctrl.lastSyncAt);
      if (entity === 'stock') processed = await this.syncStock(tenantId);
      if (entity === 'financial') processed = await this.syncFinancial(tenantId, ctrl.lastSyncAt);
      if (entity === 'workshop') processed = await this.syncWorkshop(tenantId, ctrl.lastSyncAt);

      await this.prisma.etlSyncControl.update({ where: { id: ctrl.id }, data: { lastStatus: 'done', lastSyncAt: new Date(), rowsProcessed: processed, lastError: null } });
      this.logger.log(`ETL [${entity}] tenant=${tenantId}: ${processed} rows`);
      return { processed };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.prisma.etlSyncControl.update({ where: { id: ctrl.id }, data: { lastStatus: 'error', lastError: msg } });
      return { processed: 0, error: msg };
    }
  }

  private async syncSales(tenantId: string, since: Date): Promise<number> {
    const items = await this.prisma.saleItem.findMany({
      where: { tenantId, sale: { createdAt: { gte: since } } },
      include: { sale: true, product: { select: { categoryId: true, brandId: true, averageCostPrice: true } } },
      take: this.CHUNK,
    });

    let count = 0;
    for (const item of items) {
      const dateKey = toDateKey(item.sale.createdAt);
      const grossRevenue = Number(item.quantity) * Number(item.unitPrice);
      const unitCost = Number(item.product?.averageCostPrice ?? 0);
      const discount = Number(item.discountAmount ?? 0);
      const netRevenue = grossRevenue - discount;
      const grossProfit = netRevenue - Number(item.quantity) * unitCost;
      const margin = netRevenue > 0 ? grossProfit / netRevenue : 0;

      await this.prisma.factSale.upsert({
        where: { tenantId_saleItemId: { tenantId, saleItemId: item.id } },
        create: { tenantId, dateKey, branchId: item.sale.branchId, saleId: item.saleId, saleItemId: item.id, productId: item.productId, customerId: item.sale.customerId, salespersonId: item.sale.salespersonId, categoryId: item.product?.categoryId, brandId: item.product?.brandId, quantity: item.quantity, unitPrice: item.unitPrice, unitCost, discountAmount: discount, grossRevenue, netRevenue, grossProfit, margin },
        update: { quantity: item.quantity, grossRevenue, netRevenue, grossProfit, margin, syncedAt: new Date() },
      });
      count++;
    }
    return count;
  }

  private async syncPurchases(tenantId: string, since: Date): Promise<number> {
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { tenantId, purchaseOrder: { createdAt: { gte: since } } },
      include: { purchaseOrder: true, product: { select: { categoryId: true } } },
      take: this.CHUNK,
    });

    let count = 0;
    for (const item of items) {
      const dateKey = toDateKey(item.purchaseOrder.createdAt);
      await this.prisma.factPurchase.upsert({
        where: { tenantId_purchaseItemId: { tenantId, purchaseItemId: item.id } },
        create: { tenantId, dateKey, branchId: item.purchaseOrder.branchId, purchaseOrderId: item.purchaseOrderId, purchaseItemId: item.id, productId: item.productId, supplierId: item.purchaseOrder.supplierId, categoryId: item.product?.categoryId, quantity: item.quantity, unitCost: item.unitCost, totalCost: Number(item.quantity) * Number(item.unitCost) },
        update: { totalCost: Number(item.quantity) * Number(item.unitCost), syncedAt: new Date() },
      });
      count++;
    }
    return count;
  }

  private async syncStock(tenantId: string): Promise<number> {
    const dateKey = toDateKey(new Date());
    const stocks = await this.prisma.stock.findMany({ where: { tenantId }, include: { product: { select: { categoryId: true, averageCostPrice: true } } }, take: this.CHUNK });

    let count = 0;
    for (const s of stocks) {
      await this.prisma.factStock.upsert({
        where: { tenantId_dateKey_productId_warehouseId: { tenantId, dateKey, productId: s.productId, warehouseId: s.warehouseId } },
        create: { tenantId, dateKey, productId: s.productId, warehouseId: s.warehouseId, categoryId: s.product?.categoryId, quantityOnHand: s.quantityOnHand, quantityReserved: s.quantityReserved, averageCost: s.product?.averageCostPrice ?? 0, totalValue: Number(s.quantityOnHand) * Number(s.product?.averageCostPrice ?? 0) },
        update: { quantityOnHand: s.quantityOnHand, quantityReserved: s.quantityReserved, totalValue: Number(s.quantityOnHand) * Number(s.product?.averageCostPrice ?? 0), syncedAt: new Date() },
      });
      count++;
    }
    return count;
  }

  private async syncFinancial(tenantId: string, since: Date): Promise<number> {
    const [pay, rec] = await Promise.all([
      this.prisma.accountsPayable.findMany({ where: { tenantId, updatedAt: { gte: since } }, take: this.CHUNK }),
      this.prisma.accountsReceivable.findMany({ where: { tenantId, updatedAt: { gte: since } }, take: this.CHUNK }),
    ]);

    let count = 0;
    for (const p of pay) {
      await this.prisma.factFinancial.upsert({
        where: { id: `pay_${p.id}` },
        create: { id: `pay_${p.id}`, tenantId, dateKey: toDateKey(p.dueDate), paidDateKey: p.paidAt ? toDateKey(p.paidAt) : null, type: 'payable', status: p.status, amount: p.amount, paidAmount: p.paidAmount ?? 0, supplierId: p.supplierId },
        update: { status: p.status, paidAmount: p.paidAmount ?? 0, syncedAt: new Date() },
      });
      count++;
    }
    for (const r of rec) {
      await this.prisma.factFinancial.upsert({
        where: { id: `rec_${r.id}` },
        create: { id: `rec_${r.id}`, tenantId, dateKey: toDateKey(r.dueDate), paidDateKey: r.receivedAt ? toDateKey(r.receivedAt) : null, type: 'receivable', status: r.status, amount: r.amount, paidAmount: r.receivedAmount ?? 0, customerId: r.customerId },
        update: { status: r.status, paidAmount: r.receivedAmount ?? 0, syncedAt: new Date() },
      });
      count++;
    }
    return count;
  }

  private async syncWorkshop(tenantId: string, since: Date): Promise<number> {
    const orders = await this.prisma.serviceOrder.findMany({ where: { tenantId, updatedAt: { gte: since }, status: { in: ['completed', 'delivered'] } }, include: { satisfactionSurvey: true }, take: this.CHUNK });

    let count = 0;
    for (const o of orders) {
      const durationHours = o.completedAt ? (o.completedAt.getTime() - o.openedAt.getTime()) / 3600000 : null;
      await this.prisma.factWorkshop.upsert({
        where: { tenantId_serviceOrderId: { tenantId, serviceOrderId: o.id } },
        create: { tenantId, dateKey: toDateKey(o.openedAt), closedDateKey: o.completedAt ? toDateKey(o.completedAt) : null, serviceOrderId: o.id, mechanicId: o.mechanicId, customerId: o.customerId, vehicleId: o.vehicleId, laborAmount: o.laborAmount, partsAmount: o.partsAmount, totalAmount: o.totalAmount, durationHours, isRework: o.isRework, npsScore: o.satisfactionSurvey?.npsScore },
        update: { totalAmount: o.totalAmount, durationHours, npsScore: o.satisfactionSurvey?.npsScore, syncedAt: new Date() },
      });
      count++;
    }
    return count;
  }

  getStatus(tenantId: string) {
    return this.prisma.etlSyncControl.findMany({ where: { tenantId } });
  }

  private async getOrCreateControl(tenantId: string, entity: string) {
    let c = await this.prisma.etlSyncControl.findFirst({ where: { tenantId, entity } });
    if (!c) c = await this.prisma.etlSyncControl.create({ data: { tenantId, entity } });
    return c;
  }
}

export function toDateKey(date: Date): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`, 10);
}
