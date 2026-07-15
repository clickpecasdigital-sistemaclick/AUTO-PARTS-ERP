import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { QueryStockMovementDto } from './dto/stock-movement.dto';

/**
 * Sinal de cada tipo de movimentação sobre `Stock.quantityOnHand` — única
 * fonte de verdade do "entra ou sai", consultada por `StockService` e
 * pelos relatórios (Curva ABC, Giro). Adicionar um novo tipo de
 * movimentação no enum do Prisma exige apenas uma linha aqui.
 */
export const MOVEMENT_SIGN: Record<string, 1 | -1> = {
  purchase_in: 1,
  sale_out: -1,
  transfer_in: 1,
  transfer_out: -1,
  adjustment_in: 1,
  adjustment_out: -1,
  inventory_in: 1,
  inventory_out: -1,
  service_order_out: -1,
  return_in: 1,
  loss_out: -1,
  breakage_out: -1,
  internal_consumption_out: -1,
  bonus_in: 1,
};

export const INBOUND_TYPES = Object.entries(MOVEMENT_SIGN).filter(([, sign]) => sign === 1).map(([type]) => type);
export const OUTBOUND_TYPES = Object.entries(MOVEMENT_SIGN).filter(([, sign]) => sign === -1).map(([type]) => type);

@Injectable()
export class StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  getStockBalance(productId: string, warehouseId: string) {
    return this.prisma.stock.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
  }

  /**
   * Cria a movimentação (ledger) e atualiza o saldo consolidado (`Stock`)
   * em uma única transação — nunca os dois passos separados, sob risco de
   * o saldo ficar inconsistente com o histórico em caso de falha parcial.
   */
  async createMovementAndUpdateBalance(params: {
    tenantId: string;
    productId: string;
    warehouseId: string;
    locationId?: string;
    batchId?: string;
    serialId?: string;
    type: string;
    quantity: number;
    unitCost?: number;
    reason?: string;
    documentType?: string;
    documentId?: string;
    notes?: string;
    ipAddress?: string;
    userId: string | null;
  }) {
    const sign = MOVEMENT_SIGN[params.type] ?? 0;
    const delta = sign * params.quantity;
    const totalValue = params.unitCost ? params.unitCost * params.quantity : undefined;

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          tenantId: params.tenantId,
          productId: params.productId,
          warehouseId: params.warehouseId,
          locationId: params.locationId,
          batchId: params.batchId,
          serialId: params.serialId,
          type: params.type as never,
          quantity: params.quantity,
          unitCost: params.unitCost,
          totalValue,
          reason: params.reason,
          documentType: params.documentType,
          documentId: params.documentId,
          notes: params.notes,
          ipAddress: params.ipAddress,
          createdBy: params.userId,
        },
      });

      const stock = await tx.stock.upsert({
        where: { productId_warehouseId: { productId: params.productId, warehouseId: params.warehouseId } },
        create: {
          tenantId: params.tenantId,
          productId: params.productId,
          warehouseId: params.warehouseId,
          quantityOnHand: Math.max(0, delta),
        },
        update: { quantityOnHand: { increment: delta } },
      });

      if (params.locationId) {
        await tx.stockByLocation.upsert({
          where: { productId_locationId: { productId: params.productId, locationId: params.locationId } },
          create: { tenantId: params.tenantId, productId: params.productId, locationId: params.locationId, quantity: Math.max(0, delta) },
          update: { quantity: { increment: delta } },
        });
      }

      // Custo médio ponderado — atualizado a cada entrada com custo informado.
      // PEPS/UEPS completos (consumo por lote de custo específico) ficam
      // para quando o módulo de Compras existir de fato (Sprint 07+) e
      // alimentar lotes de custo reais; aqui o método "average" já funciona
      // de ponta a ponta, que é o padrão (default) de `Company.costingMethod`.
      if (sign === 1 && params.unitCost) {
        const product = await tx.product.findUnique({ where: { id: params.productId }, select: { averageCostPrice: true } });
        if (product) {
          const previousQty = Number(stock.quantityOnHand) - delta;
          const previousAvg = Number(product.averageCostPrice);
          const newAvg =
            previousQty <= 0 ? params.unitCost : (previousQty * previousAvg + params.quantity * params.unitCost) / (previousQty + params.quantity);
          await tx.product.update({ where: { id: params.productId }, data: { averageCostPrice: newAvg } });
        }
      }

      return { movement, stock };
    });
  }

  async findMovements(tenantId: string, query: QueryStockMovementDto) {
    const where: any = { tenantId };
    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.type) where.type = query.type as never;
    if (query.startDate || query.endDate) {
      where.createdAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        include: { product: { select: { id: true, internalCode: true, shortDescription: true } }, warehouse: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  /** Saldo + custo médio, por produto, em todos os depósitos do tenant (ou de um depósito específico). */
  async listStockSnapshot(tenantId: string, warehouseId?: string) {
    return this.prisma.stock.findMany({
      where: { tenantId, ...(warehouseId ? { warehouseId } : {}) },
      include: {
        product: {
          select: {
            id: true,
            internalCode: true,
            shortDescription: true,
            minStock: true,
            maxStock: true,
            averageCostPrice: true,
            salePrice: true,
            groupId: true,
            manufacturerId: true,
          },
        },
        warehouse: { select: { id: true, name: true } },
      },
    });
  }

  async lastMovementDateByProduct(tenantId: string, warehouseId?: string): Promise<Map<string, Date>> {
    const rows = await this.prisma.stockMovement.groupBy({
      by: ['productId'],
      where: { tenantId, ...(warehouseId ? { warehouseId } : {}) },
      _max: { createdAt: true },
    });
    return new Map(rows.map((r) => [r.productId, r._max.createdAt!]));
  }

  async movementsAggregateByProduct(tenantId: string, sinceDate: Date, warehouseId?: string) {
    return this.prisma.stockMovement.groupBy({
      by: ['productId', 'type'],
      where: { tenantId, createdAt: { gte: sinceDate }, ...(warehouseId ? { warehouseId } : {}) },
      _sum: { quantity: true, totalValue: true },
    });
  }
}
