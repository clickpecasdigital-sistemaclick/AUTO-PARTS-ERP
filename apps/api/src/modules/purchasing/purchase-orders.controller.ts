import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchasingImportExportService } from './purchasing-import-export.service';
import { CreatePurchaseOrderDto, QueryPurchaseOrderDto } from './dto/purchase-order.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('purchasing-orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/orders')
export class PurchaseOrdersController {
  constructor(
    private readonly service: PurchaseOrdersService,
    private readonly importExport: PurchasingImportExportService,
  ) {}

  @Get()
  @RequirePermission('purchases', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Query() query: QueryPurchaseOrderDto) {
    return this.service.findAll(toRequestContext(user, req), query);
  }

  @Get('export')
  @RequirePermission('purchases', 'export')
  async export(@CurrentUser() user: AuthenticatedRequestUser, @Query('format') format: 'csv' | 'xlsx' = 'csv', @Res() res: Response) {
    const fileName = `pedidos-compra-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'xlsx') {
      const buffer = await this.importExport.exportOrdersExcel(user.tenantId);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${fileName}.xlsx"` });
      return res.send(buffer);
    }
    const buffer = await this.importExport.exportOrdersCsv(user.tenantId);
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName}.csv"` });
    return res.send(buffer);
  }

  @Get(':id')
  @RequirePermission('purchases', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.findOne(toRequestContext(user, req), id);
  }

  @Get(':id/pdf')
  @RequirePermission('purchases', 'print')
  @ApiOperation({ summary: 'Gera o PDF de impressão do pedido' })
  async printPdf(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Res() res: Response) {
    const buffer = await this.importExport.exportOrderPdf(user.tenantId, id);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="pedido-${id}.pdf"` });
    return res.send(buffer);
  }

  @Post()
  @RequirePermission('purchases', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('branchId') branchId: string, @Body() dto: CreatePurchaseOrderDto) {
    return this.service.create(toRequestContext(user, req), branchId, dto);
  }

  @Post(':id/send')
  @RequirePermission('purchases', 'update')
  @ApiOperation({ summary: 'Envia o pedido para aprovação/fornecedor' })
  send(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('estimatedValue') estimatedValue: number) {
    return this.service.send(toRequestContext(user, req), id, estimatedValue);
  }

  @Post(':id/approve')
  @RequirePermission('purchases', 'approve')
  approve(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.approve(toRequestContext(user, req), id);
  }

  @Post(':id/duplicate')
  @RequirePermission('purchases', 'create')
  duplicate(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.duplicate(toRequestContext(user, req), id);
  }

  @Post(':id/reopen')
  @RequirePermission('purchases', 'update')
  reopen(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.reopen(toRequestContext(user, req), id);
  }

  @Post(':id/cancel')
  @RequirePermission('purchases', 'cancel')
  cancel(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.cancel(toRequestContext(user, req), id);
  }
}
