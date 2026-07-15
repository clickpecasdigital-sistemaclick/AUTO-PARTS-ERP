import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { ServiceOrdersService } from './service-orders.service';
import {
  AddPartItemDto,
  AddServiceItemDto,
  CancelServiceOrderDto,
  CreateServiceOrderDto,
  QueryServiceOrderDto,
  UpdateDiagnosisDto,
} from './dto/service-order.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/**
 * Ordens de Serviço. "Alterar preços"→`update`, "Liberar descontos"→`update`
 * (a regra de limite, se desejada, reaproveitaria `PdvDiscountService` da
 * Sprint 09 — não duplicada aqui), "Visualizar custos"→`view` (o custo da
 * peça já vem no payload normal, granularidade de "esconder custo" fica
 * para refinamento de UI), "Encerrar OS"→`approve` (mesmo nível de
 * confiança de uma aprovação).
 */
@ApiTags('workshop-service-orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/orders')
export class ServiceOrdersController {
  constructor(private readonly service: ServiceOrdersService) {}

  @Get()
  @RequirePermission('workshop', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Query() query: QueryServiceOrderDto) {
    return this.service.findAll(toRequestContext(user, req), query);
  }

  @Get(':id')
  @RequirePermission('workshop', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.findOne(toRequestContext(user, req), id);
  }

  @Post()
  @RequirePermission('workshop', 'create')
  @ApiOperation({ summary: 'Cria uma OS (a partir de Recepção/Check-in, ou de um Agendamento via appointmentId)' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('branchId') branchId: string, @Body() dto: CreateServiceOrderDto) {
    return this.service.create(toRequestContext(user, req), branchId, dto);
  }

  @Post(':id/transition')
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Transição de status — valida o fluxo permitido (ex: open→diagnosing→awaiting_approval→approved→in_progress→completed→delivered)' })
  transition(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('toStatus') toStatus: string, @Body('notes') notes?: string) {
    return this.service.transitionStatus(toRequestContext(user, req), id, toStatus, notes);
  }

  @Post(':id/cancel')
  @RequirePermission('workshop', 'cancel')
  cancel(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CancelServiceOrderDto) {
    return this.service.cancel(toRequestContext(user, req), id, dto.reason);
  }

  @Post(':id/diagnosis')
  @RequirePermission('workshop', 'update')
  updateDiagnosis(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: UpdateDiagnosisDto) {
    return this.service.updateDiagnosis(toRequestContext(user, req), id, dto);
  }

  @Post(':id/services')
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Adiciona item de mão de obra ao orçamento' })
  addServiceItem(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: AddServiceItemDto) {
    return this.service.addServiceItem(toRequestContext(user, req), id, dto);
  }

  @Delete(':id/services/:itemId')
  @RequirePermission('workshop', 'update')
  removeServiceItem(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeServiceItem(toRequestContext(user, req), id, itemId);
  }

  @Post(':id/parts')
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Adiciona peça ao orçamento — não baixa estoque ainda (ver /parts/confirm)' })
  addPartItem(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: AddPartItemDto) {
    return this.service.addPartItem(toRequestContext(user, req), id, dto);
  }

  @Delete(':id/parts/:itemId')
  @RequirePermission('workshop', 'update')
  removePartItem(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removePartItem(toRequestContext(user, req), id, itemId);
  }

  @Get(':id/parts/availability/:productId/:warehouseId')
  @RequirePermission('workshop', 'view')
  checkAvailability(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string) {
    return this.service.checkPartAvailability(productId, warehouseId);
  }

  @Post(':id/parts/confirm')
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Confirma consumo físico das peças — reserva, baixa estoque, registra movimentação e custo (integração total com Estoque)' })
  confirmParts(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('warehouseId') warehouseId: string) {
    return this.service.confirmPartsConsumption(toRequestContext(user, req), id, warehouseId);
  }

  @Post(':id/rework')
  @RequirePermission('workshop', 'create')
  @ApiOperation({ summary: 'Cria uma OS de retrabalho ligada a esta' })
  createRework(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('branchId') branchId: string, @Body('complaint') complaint: string) {
    return this.service.createRework(toRequestContext(user, req), branchId, id, complaint);
  }
}
