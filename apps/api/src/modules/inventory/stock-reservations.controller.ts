import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { StockReservationsService } from './stock-reservations.service';
import { CreateStockReservationDto } from './dto/transfer-inventory-reservation.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/**
 * Reservas de Estoque — ponto de integração para Pedidos, Orçamentos, OS e
 * Compras (Sprint 07+). Esses módulos futuros injetam `StockReservationsService`
 * diretamente (`StockModule` já o exporta) em vez de chamar este endpoint
 * HTTP entre serviços internos — o controller existe para uso administrativo
 * (ex: tela de "reservas ativas") e testes manuais via Swagger.
 */
@ApiTags('inventory-reservations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock/reservations')
export class StockReservationsController {
  constructor(private readonly reservations: StockReservationsService) {}

  @Get()
  @RequirePermission('stock', 'view')
  listActive(@CurrentUser() user: AuthenticatedRequestUser, @Query('productId') productId?: string) {
    return this.reservations.listActive(user.tenantId, productId);
  }

  @Post()
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Cria uma reserva (incrementa quantityReserved, indisponibiliza para venda)' })
  reserve(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateStockReservationDto) {
    return this.reservations.reserve(toRequestContext(user, req), dto);
  }

  @Post(':id/release')
  @RequirePermission('stock', 'cancel')
  @ApiOperation({ summary: 'Libera a reserva sem consumir estoque' })
  release(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.reservations.release(toRequestContext(user, req), id);
  }

  @Post(':id/consume')
  @RequirePermission('stock', 'update')
  @ApiOperation({ summary: 'Consome a reserva (documento de origem foi efetivado)' })
  consume(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.reservations.consume(toRequestContext(user, req), id);
  }
}
