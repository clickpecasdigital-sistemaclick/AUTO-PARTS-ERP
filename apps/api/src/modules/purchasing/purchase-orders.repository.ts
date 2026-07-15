import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { QueryPurchaseOrderDto } from './dto/purchase-order.dto';

const PURCHASE_ORDER_INCLUDE = {
  supplier: { select: { id: true, name: true, tradeName: true, document: true } },
  branch: { select: { id: true, name: true } },
  purchaseRequest: { select: { id: true, code: true } },
  items: { include: { product: { select: { id: true, internalCode: true, shortDescription: true } } } },
  goodsReceipts: true,
  approvals: true,
} satisfies any;

export type PurchaseOrderWithRelations = any;

/** Repository Pattern (idêntico ao padrão de `ProductsRepository`/`StockRepository` das Sprints 05/06). */
@Injectable()
export class PurchaseOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string) {
    return this.prisma.purchaseOrder.findFirst({ where: { id, tenantId, deletedAt: null }, include: PURCHASE_ORDER_INCLUDE });
  }

  async findMany(tenantId: string, query: QueryPurchaseOrderDto) {
    const where: any = { tenantId, deletedAt: null };
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.status) where.status = query.status as never;
    if (query.search?.trim()) where.code = { contains: query.search.trim(), mode: 'insensitive' };

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({ where, include: PURCHASE_ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  create(tenantId: string, userId: string | null, data: any) {
    return this.prisma.purchaseOrder.create({ data: { ...data, tenantId, createdBy: userId, updatedBy: userId }, include: PURCHASE_ORDER_INCLUDE });
  }

  update(id: string, userId: string | null, data: any) {
    return this.prisma.purchaseOrder.update({ where: { id }, data: { ...data, updatedBy: userId }, include: PURCHASE_ORDER_INCLUDE });
  }

  countByTenant(tenantId: string) {
    return this.prisma.purchaseOrder.count({ where: { tenantId } });
  }
}
