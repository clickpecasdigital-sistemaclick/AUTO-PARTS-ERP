import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { StockReservationsService } from '@/modules/inventory/stock-reservations.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Pedidos de Venda (briefing: "Reserva automática de estoque, Aprovação,
 * Separação, Expedição (estrutura), Conversão para faturamento"). Reserva
 * via `StockReservationsService` (Sprint 06) — `sourceType: sales_order` é
 * exatamente o ponto de integração que já existia pronto para isso.
 */
@Injectable()
export class PdvSalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: StockReservationsService,
    private readonly audit: AuditService,
  ) {}

  findAll(tenantId: string, status?: string) {
    return this.prisma.salesOrder.findMany({
      where: { tenantId, deletedAt: null, ...(status ? { status: status as never } : {}) },
      include: { customer: { select: { id: true, name: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({ where: { id, tenantId }, include: { items: { include: { product: true } }, customer: true } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  /** Aprova o pedido e reserva o estoque de cada item automaticamente (briefing). */
  async approve(ctx: RequestContext, id: string, warehouseId: string) {
    const order = await this.findOne(ctx.tenantId, id);
    if (order.status !== 'pending') throw new BadRequestException('Apenas pedidos pendentes podem ser aprovados');

    for (const item of order.items) {
      await this.reservations.reserve(ctx, {
        productId: item.productId,
        warehouseId,
        quantity: Number(item.quantity),
        sourceType: 'sales_order' as never,
        sourceId: order.id,
      });
    }

    const updated = await this.prisma.salesOrder.update({ where: { id }, data: { status: 'confirmed', approvedBy: ctx.userId, approvedAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'approve', entity: 'SalesOrder', entityId: id, after: { warehouseId } });
    return updated;
  }

  async startSeparation(ctx: RequestContext, id: string) {
    await this.findOne(ctx.tenantId, id);
    return this.prisma.salesOrder.update({ where: { id }, data: { separationStatus: 'separating' } });
  }

  async completeSeparation(ctx: RequestContext, id: string) {
    await this.findOne(ctx.tenantId, id);
    const updated = await this.prisma.salesOrder.update({ where: { id }, data: { separationStatus: 'separated', separatedAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'SalesOrder', entityId: id, after: { separationStatus: 'separated' } });
    return updated;
  }

  /** Expedição — estrutura preparada (briefing); aqui apenas o carimbo de data/hora, sem integração de transporte ainda. */
  async ship(ctx: RequestContext, id: string) {
    const order = await this.findOne(ctx.tenantId, id);
    if (order.separationStatus !== 'separated') throw new BadRequestException('Pedido precisa estar separado antes da expedição');

    return this.prisma.salesOrder.update({ where: { id }, data: { separationStatus: 'shipped', shippedAt: new Date() } });
  }

  async cancel(ctx: RequestContext, id: string) {
    const order = await this.findOne(ctx.tenantId, id);
    if (order.status === 'invoiced') throw new BadRequestException('Pedido já faturado não pode ser cancelado');

    const activeReservations = await this.prisma.stockReservation.findMany({ where: { tenantId: ctx.tenantId, sourceType: 'sales_order', sourceId: id, status: 'active' } });
    for (const reservation of activeReservations) {
      await this.reservations.release(ctx, reservation.id);
    }

    const updated = await this.prisma.salesOrder.update({ where: { id }, data: { status: 'cancelled' } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'SalesOrder', entityId: id });
    return updated;
  }
}
