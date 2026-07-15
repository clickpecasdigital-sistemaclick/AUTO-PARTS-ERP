import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { GoodsReceiptsService } from './goods-receipts.service';
import { ConferGoodsReceiptItemDto, CreateGoodsReceiptDto } from './dto/goods-receipt.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/** "Receber" e "Conferir" (briefing) → mapeados para `update` do catálogo padrão de permissões. */
@ApiTags('purchasing-receipts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/receipts')
export class GoodsReceiptsController {
  constructor(private readonly service: GoodsReceiptsService) {}

  @Get()
  @RequirePermission('purchases', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('purchaseOrderId') purchaseOrderId?: string) {
    return this.service.list(user.tenantId, purchaseOrderId);
  }

  @Get(':id')
  @RequirePermission('purchases', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Get(':id/lookup')
  @RequirePermission('purchases', 'update')
  @ApiOperation({ summary: 'Busca um item do recebimento por código de barras/QR Code (coletor de dados)' })
  lookup(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Query('code') code: string) {
    return this.service.lookupItemByCode(toRequestContext(user, req), id, code);
  }

  @Post()
  @RequirePermission('purchases', 'update')
  @ApiOperation({ summary: 'Registra o recebimento físico (transportadora, volumes, peso, frete, NF do fornecedor)' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateGoodsReceiptDto) {
    return this.service.create(toRequestContext(user, req), dto);
  }

  @Post(':id/confer')
  @RequirePermission('purchases', 'update')
  @ApiOperation({ summary: 'Confere um item (manual, código de barras, QR Code) — aceite/recusa parcial' })
  confer(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: ConferGoodsReceiptItemDto) {
    return this.service.conferItem(toRequestContext(user, req), id, dto);
  }

  @Post(':id/finalize')
  @RequirePermission('purchases', 'approve')
  @ApiOperation({ summary: 'Finaliza: entra no estoque (StockService), atualiza custo médio e gera Contas a Pagar' })
  finalize(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('installments') installments?: number) {
    return this.service.finalize(toRequestContext(user, req), id, installments);
  }
}
