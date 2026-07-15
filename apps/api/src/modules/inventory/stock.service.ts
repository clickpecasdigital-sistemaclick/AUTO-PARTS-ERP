import { BadRequestException, Injectable } from '@nestjs/common';
import { StockRepository } from './stock.repository';
import { AuditService } from '@/common/audit/audit.service';
import { REASON_REQUIRED_TYPES, type CreateStockMovementDto, type QueryStockMovementDto } from './dto/stock-movement.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Motor central de movimentações de estoque — TODO ponto do sistema que
 * precisa alterar saldo (Compras, Vendas, PDV, OS, Transferências,
 * Inventário, ajustes manuais) passa por `StockService.move()`, nunca
 * grava em `Stock`/`StockMovement` diretamente. Garante: validação de
 * saldo negativo, motivo obrigatório por tipo, atomicidade
 * (movimentação + saldo na mesma transação, via `StockRepository`) e
 * auditoria completa.
 */
@Injectable()
export class StockService {
  constructor(
    private readonly repository: StockRepository,
    private readonly audit: AuditService,
  ) {}

  async move(ctx: RequestContext, dto: CreateStockMovementDto) {
    if (REASON_REQUIRED_TYPES.includes(dto.type as never) && !dto.reason?.trim()) {
      throw new BadRequestException(`O motivo é obrigatório para movimentações do tipo "${dto.type}"`);
    }

    const isOutbound = dto.type.endsWith('_out');
    if (isOutbound) {
      const balance = await this.repository.getStockBalance(dto.productId, dto.warehouseId);
      const available = Number(balance?.quantityOnHand ?? 0) - Number(balance?.quantityReserved ?? 0);
      if (available < dto.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente: disponível ${available}, solicitado ${dto.quantity} (saldo total ${Number(balance?.quantityOnHand ?? 0)}, reservado ${Number(balance?.quantityReserved ?? 0)})`,
        );
      }
    }

    const { movement, stock } = await this.repository.createMovementAndUpdateBalance({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      ipAddress: ctx.ipAddress ?? undefined,
      ...dto,
    });

    await this.audit.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'stock_adjustment',
      entity: 'StockMovement',
      entityId: movement.id,
      after: { type: dto.type, productId: dto.productId, warehouseId: dto.warehouseId, quantity: dto.quantity, reason: dto.reason },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { movement, stock };
  }

  findMovements(ctx: RequestContext, query: QueryStockMovementDto) {
    return this.repository.findMovements(ctx.tenantId, query);
  }

  getBalance(productId: string, warehouseId: string) {
    return this.repository.getStockBalance(productId, warehouseId);
  }
}
