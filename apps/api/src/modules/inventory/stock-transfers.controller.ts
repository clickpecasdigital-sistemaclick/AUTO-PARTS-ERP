import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { StockTransfersService } from './stock-transfers.service';
import { CreateStockTransferDto } from './dto/transfer-inventory-reservation.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/** "Transferir" (briefing) → ação `update` do catálogo padrão (criar = `create`, expedir/receber/cancelar = `update`). */
@ApiTags('inventory-transfers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock/transfers')
export class StockTransfersController {
  constructor(private readonly transfers: StockTransfersService) {}

  @Get()
  @RequirePermission('stock', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.transfers.list(user.tenantId);
  }

  @Post()
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Cria uma transferência (status: pendente)' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateStockTransferDto) {
    return this.transfers.create(toRequestContext(user, req), dto);
  }

  @Post(':id/ship')
  @RequirePermission('stock', 'update')
  @ApiOperation({ summary: 'Expede a transferência (gera saída na origem)' })
  ship(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.transfers.ship(toRequestContext(user, req), id);
  }

  @Post(':id/receive')
  @RequirePermission('stock', 'update')
  @ApiOperation({ summary: 'Recebe a transferência (gera entrada no destino)' })
  receive(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.transfers.receive(toRequestContext(user, req), id);
  }

  @Post(':id/cancel')
  @RequirePermission('stock', 'cancel')
  @ApiOperation({ summary: 'Cancela uma transferência pendente ou em trânsito' })
  cancel(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.transfers.cancel(toRequestContext(user, req), id);
  }
}
