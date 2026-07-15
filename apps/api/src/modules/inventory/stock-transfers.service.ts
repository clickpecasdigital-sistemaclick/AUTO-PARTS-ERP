import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { StockService } from './stock.service';
import { AuditService } from '@/common/audit/audit.service';
import type { CreateStockTransferDto } from './dto/transfer-inventory-reservation.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Transferências entre Depósitos (e, por consequência, entre Filiais/
 * Empresas distintas do mesmo tenant, já que `Warehouse` pertence a uma
 * `Branch` de uma `Company`). Fluxo: `create` (pendente) → `ship` (gera
 * `transfer_out` na origem) → `receive` (gera `transfer_in` no destino).
 * Cada etapa registra usuário/data/hora automaticamente (`createdBy`/
 * `createdAt` do Prisma) — exatamente o exigido no briefing.
 */
@Injectable()
export class StockTransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, dto: CreateStockTransferDto) {
    if (dto.originWarehouseId === dto.destinationWarehouseId) {
      throw new BadRequestException('Depósito de origem e destino não podem ser o mesmo');
    }

    const code = `TRF-${Date.now()}`;
    const transfer = await this.prisma.stockTransfer.create({
      data: {
        tenantId: ctx.tenantId,
        code,
        originWarehouseId: dto.originWarehouseId,
        destinationWarehouseId: dto.destinationWarehouseId,
        reason: dto.reason,
        notes: dto.notes,
        createdBy: ctx.userId,
        items: { createMany: { data: dto.items.map((item) => ({ tenantId: ctx.tenantId, ...item })) } },
      },
      include: { items: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'StockTransfer', entityId: transfer.id, after: transfer });
    return transfer;
  }

  async ship(ctx: RequestContext, transferId: string) {
    const transfer = await this.getOrThrow(ctx.tenantId, transferId);
    if (transfer.status !== 'pending') throw new BadRequestException('Apenas transferências pendentes podem ser expedidas');

    for (const item of transfer.items) {
      await this.stockService.move(ctx, {
        productId: item.productId,
        warehouseId: transfer.originWarehouseId,
        locationId: item.originLocationId ?? undefined,
        type: 'transfer_out' as never,
        quantity: Number(item.quantity),
        documentType: 'stock_transfer',
        documentId: transfer.id,
        reason: transfer.reason ?? 'Transferência entre depósitos',
      });
    }

    return this.prisma.stockTransfer.update({ where: { id: transferId }, data: { status: 'in_transit', shippedAt: new Date() } });
  }

  async receive(ctx: RequestContext, transferId: string) {
    const transfer = await this.getOrThrow(ctx.tenantId, transferId);
    if (transfer.status !== 'in_transit') throw new BadRequestException('Apenas transferências em trânsito podem ser recebidas');

    for (const item of transfer.items) {
      await this.stockService.move(ctx, {
        productId: item.productId,
        warehouseId: transfer.destinationWarehouseId,
        locationId: item.destinationLocationId ?? undefined,
        type: 'transfer_in' as never,
        quantity: Number(item.quantity),
        documentType: 'stock_transfer',
        documentId: transfer.id,
        reason: transfer.reason ?? 'Transferência entre depósitos',
      });
    }

    const updated = await this.prisma.stockTransfer.update({ where: { id: transferId }, data: { status: 'received', receivedAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'StockTransfer', entityId: transferId, after: { status: 'received' } });
    return updated;
  }

  async cancel(ctx: RequestContext, transferId: string) {
    const transfer = await this.getOrThrow(ctx.tenantId, transferId);
    if (transfer.status === 'received') throw new BadRequestException('Transferência já recebida não pode ser cancelada');
    return this.prisma.stockTransfer.update({ where: { id: transferId }, data: { status: 'cancelled' } });
  }

  list(tenantId: string) {
    return this.prisma.stockTransfer.findMany({
      where: { tenantId },
      include: { originWarehouse: true, destinationWarehouse: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOrThrow(tenantId: string, id: string) {
    const transfer = await this.prisma.stockTransfer.findFirst({ where: { id, tenantId }, include: { items: true } });
    if (!transfer) throw new NotFoundException('Transferência não encontrada');
    return transfer;
  }
}
