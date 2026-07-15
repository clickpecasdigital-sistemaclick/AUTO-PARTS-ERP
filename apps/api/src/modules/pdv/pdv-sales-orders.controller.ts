import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PdvSalesOrdersService } from './pdv-sales-orders.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('pdv-sales-orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pdv/orders')
export class PdvSalesOrdersController {
  constructor(private readonly service: PdvSalesOrdersService) {}

  @Get()
  @RequirePermission('sales', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Query('status') status?: string) {
    return this.service.findAll(user.tenantId, status);
  }

  @Get(':id')
  @RequirePermission('sales', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post(':id/approve')
  @RequirePermission('sales', 'approve')
  @ApiOperation({ summary: 'Aprova o pedido e reserva o estoque automaticamente' })
  approve(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('warehouseId') warehouseId: string) {
    return this.service.approve(toRequestContext(user, req), id, warehouseId);
  }

  @Post(':id/separation/start')
  @RequirePermission('sales', 'update')
  startSeparation(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.startSeparation(toRequestContext(user, req), id);
  }

  @Post(':id/separation/complete')
  @RequirePermission('sales', 'update')
  completeSeparation(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.completeSeparation(toRequestContext(user, req), id);
  }

  @Post(':id/ship')
  @RequirePermission('sales', 'update')
  ship(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.ship(toRequestContext(user, req), id);
  }

  @Post(':id/cancel')
  @RequirePermission('sales', 'cancel')
  cancel(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.cancel(toRequestContext(user, req), id);
  }
}
