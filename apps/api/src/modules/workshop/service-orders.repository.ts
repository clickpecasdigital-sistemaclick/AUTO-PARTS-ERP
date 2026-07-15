import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';
import type { QueryServiceOrderDto } from './dto/service-order.dto';

const SERVICE_ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, tradeName: true, phone: true } },
  vehicle: true,
  mechanic: { include: { employee: { select: { name: true } } } },
  consultant: { select: { id: true, name: true } },
  box: true,
  services: { include: { service: true } },
  parts: { include: { product: { select: { id: true, internalCode: true, shortDescription: true } } } },
  checklists: { include: { items: { include: { templateItem: true } } } },
  warranties: true,
  checkIn: true,
  delivery: true,
} satisfies any;

export type ServiceOrderWithRelations = any;

/** Repository Pattern (mesmo padrão de todos os módulos desde a Sprint 05). */
@Injectable()
export class ServiceOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string) {
    return this.prisma.serviceOrder.findFirst({ where: { id, tenantId }, include: SERVICE_ORDER_INCLUDE });
  }

  async findMany(tenantId: string, query: QueryServiceOrderDto) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status as never;
    if (query.mechanicId) where.mechanicId = query.mechanicId;
    if (query.boxId) where.boxId = query.boxId;
    if (query.priority) where.priority = query.priority as never;
    if (query.search?.trim()) where.code = { contains: query.search.trim(), mode: 'insensitive' };

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.serviceOrder.findMany({ where, include: SERVICE_ORDER_INCLUDE, orderBy: { openedAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.serviceOrder.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  create(data: any) {
    return this.prisma.serviceOrder.create({ data, include: SERVICE_ORDER_INCLUDE });
  }

  update(id: string, data: any) {
    return this.prisma.serviceOrder.update({ where: { id }, data, include: SERVICE_ORDER_INCLUDE });
  }

  countByTenant(tenantId: string) {
    return this.prisma.serviceOrder.count({ where: { tenantId } });
  }

  recordStatusChange(tenantId: string, serviceOrderId: string, fromStatus: string | null, toStatus: string, userId: string | null, notes?: string) {
    return this.prisma.serviceOrderStatusHistory.create({
      data: { tenantId, serviceOrderId, fromStatus: fromStatus as never, toStatus: toStatus as never, changedBy: userId, notes },
    });
  }
}
