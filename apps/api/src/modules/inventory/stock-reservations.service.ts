import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { CreateStockReservationDto } from './dto/transfer-inventory-reservation.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Reserva de estoque — produto reservado entra em `Stock.quantityReserved`
 * e fica indisponível para nova venda/compromisso
 * (`StockService.move` já valida disponível = onHand - reserved antes de
 * qualquer saída). `sourceType`/`sourceId` genéricos são o ponto de
 * integração pronto para os módulos de Pedidos, Orçamentos, OS e Compras
 * (Sprint 07+): cada um chama `reserve()` ao confirmar um documento e
 * `release()`/`consume()` ao cancelar/faturar — nenhuma mudança neste
 * serviço será necessária quando isso acontecer.
 */
@Injectable()
export class StockReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async reserve(ctx: RequestContext, dto: CreateStockReservationDto) {
    const stock = await this.prisma.stock.findUnique({ where: { productId_warehouseId: { productId: dto.productId, warehouseId: dto.warehouseId } } });
    const available = Number(stock?.quantityOnHand ?? 0) - Number(stock?.quantityReserved ?? 0);
    if (available < dto.quantity) {
      throw new BadRequestException(`Estoque disponível insuficiente para reserva: disponível ${available}, solicitado ${dto.quantity}`);
    }

    const [reservation] = await this.prisma.$transaction([
      this.prisma.stockReservation.create({
        data: {
          tenantId: ctx.tenantId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: dto.quantity,
          sourceType: dto.sourceType as never,
          sourceId: dto.sourceId,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          createdBy: ctx.userId,
        },
      }),
      this.prisma.stock.update({
        where: { productId_warehouseId: { productId: dto.productId, warehouseId: dto.warehouseId } },
        data: { quantityReserved: { increment: dto.quantity } },
      }),
    ]);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'StockReservation', entityId: reservation.id, after: dto });
    return reservation;
  }

  /** Libera a reserva sem consumir estoque (ex: pedido/orçamento cancelado). */
  async release(ctx: RequestContext, reservationId: string) {
    const reservation = await this.getOrThrow(ctx.tenantId, reservationId);
    if (reservation.status !== 'active') throw new BadRequestException('Reserva não está ativa');

    await this.prisma.$transaction([
      this.prisma.stockReservation.update({ where: { id: reservationId }, data: { status: 'released', releasedAt: new Date() } }),
      this.prisma.stock.update({
        where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
        data: { quantityReserved: { decrement: Number(reservation.quantity) } },
      }),
    ]);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'StockReservation', entityId: reservationId, after: { status: 'released' } });
  }

  /**
   * Consome a reserva — chamado quando o documento de origem é efetivado
   * (ex: venda faturada). Apenas marca a reserva como `consumed` e libera
   * `quantityReserved`; a saída real de `quantityOnHand` é uma
   * `StockMovement` separada (`sale_out` etc.), disparada pelo módulo que
   * efetivou o documento via `StockService.move()`.
   */
  async consume(ctx: RequestContext, reservationId: string) {
    const reservation = await this.getOrThrow(ctx.tenantId, reservationId);
    if (reservation.status !== 'active') throw new BadRequestException('Reserva não está ativa');

    await this.prisma.$transaction([
      this.prisma.stockReservation.update({ where: { id: reservationId }, data: { status: 'consumed' } }),
      this.prisma.stock.update({
        where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
        data: { quantityReserved: { decrement: Number(reservation.quantity) } },
      }),
    ]);
  }

  listBySource(tenantId: string, sourceType: string, sourceId: string) {
    return this.prisma.stockReservation.findMany({ where: { tenantId, sourceType: sourceType as never, sourceId } });
  }

  listActive(tenantId: string, productId?: string) {
    return this.prisma.stockReservation.findMany({ where: { tenantId, status: 'active', ...(productId ? { productId } : {}) } });
  }

  private async getOrThrow(tenantId: string, id: string) {
    const reservation = await this.prisma.stockReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    return reservation;
  }
}
