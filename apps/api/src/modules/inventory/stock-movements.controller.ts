import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { StockService } from './stock.service';
import { CreateStockMovementDto, QueryStockMovementDto } from './dto/stock-movement.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/**
 * Movimentações de Estoque — API REST (Sprint 06). Mapa de permissões
 * deste módulo (ver `docs/INVENTORY_MODULE.md` para a tabela completa):
 * "Movimentar" (briefing) → ação `create` do catálogo padrão
 * (view/create/update/delete/export/print/approve/cancel, Sprint 04/05),
 * para não alterar a arquitetura de RBAC já aprovada.
 */
@ApiTags('inventory-movements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock/movements')
export class StockMovementsController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'Lista movimentações de estoque (filtros por produto/depósito/tipo/período)' })
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Query() query: QueryStockMovementDto) {
    return this.stockService.findMovements(toRequestContext(user, req), query);
  }

  @Get('balance/:productId/:warehouseId')
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'Saldo atual (onHand/reserved/onOrder) de um produto em um depósito' })
  getBalance(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string) {
    return this.stockService.getBalance(productId, warehouseId);
  }

  @Post()
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Registra uma movimentação manual (entrada, saída, ajuste, perda, quebra, consumo interno, bonificação)' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateStockMovementDto) {
    return this.stockService.move(toRequestContext(user, req), dto);
  }
}
