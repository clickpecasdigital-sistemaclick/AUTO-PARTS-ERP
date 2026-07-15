import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PdvQuotesService, type QuoteItemInput } from './pdv-quotes.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('pdv-quotes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pdv/quotes')
export class PdvQuotesController {
  constructor(private readonly service: PdvQuotesService) {}

  @Get()
  @RequirePermission('sales', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Query('customerId') customerId?: string) {
    return this.service.findAll(user.tenantId, customerId);
  }

  @Get(':id')
  @RequirePermission('sales', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermission('sales', 'create')
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Body('branchId') branchId: string,
    @Body() data: { customerId: string; salespersonId?: string; validUntil?: string; notes?: string; items: QuoteItemInput[] },
  ) {
    return this.service.create(toRequestContext(user, req), branchId, data);
  }

  @Post(':id/approve')
  @RequirePermission('sales', 'approve')
  approve(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.approve(toRequestContext(user, req), id);
  }

  @Post(':id/reject')
  @RequirePermission('sales', 'update')
  reject(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('reason') reason: string) {
    return this.service.reject(toRequestContext(user, req), id, reason);
  }

  @Post(':id/send')
  @RequirePermission('sales', 'export')
  @ApiOperation({ summary: 'Marca como enviado por e-mail' })
  markSent(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('sentTo') sentTo: string) {
    return this.service.markSent(toRequestContext(user, req), id, sentTo);
  }

  @Post(':id/convert-to-order')
  @RequirePermission('sales', 'create')
  @ApiOperation({ summary: 'Converte para Pedido (reserva estoque automaticamente ao aprovar o pedido)' })
  convertToOrder(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.convertToOrder(toRequestContext(user, req), id);
  }
}
