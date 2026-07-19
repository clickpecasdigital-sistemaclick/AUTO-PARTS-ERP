import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CheckInService, ChecklistService, DeliveryService } from './checkin-checklist-delivery.service';
import { CreateCheckInDto, CreateDeliveryDto, FillChecklistItemDto } from './dto/workshop-support.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('workshop-checkin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/orders/:orderId/check-in')
export class CheckInController {
  constructor(private readonly service: CheckInService) {}

  @Get()
  @RequirePermission('workshop', 'view')
  get(@CurrentUser() user: AuthenticatedRequestUser, @Param('orderId') orderId: string) {
    return this.service.get(user.tenantId, orderId);
  }

  @Get('attachments')
  @RequirePermission('workshop', 'view')
  listAttachments(@CurrentUser() user: AuthenticatedRequestUser, @Param('orderId') orderId: string) {
    return this.service.listAttachments(user.tenantId, orderId);
  }

  @Post()
  @RequirePermission('workshop', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('orderId') orderId: string, @Body() dto: CreateCheckInDto) {
    return this.service.create(toRequestContext(user, req), orderId, dto);
  }
}

@ApiTags('workshop-checklist')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/checklists')
export class ChecklistController {
  constructor(private readonly service: ChecklistService) {}

  @Get('templates')
  @RequirePermission('workshop', 'view')
  listTemplates(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listTemplates(user.tenantId);
  }

  @Post('templates')
  @RequirePermission('workshop', 'create')
  @ApiOperation({ summary: 'Cria um modelo de checklist configurável (pneus, freios, suspensão, óleo, luzes, bateria, arrefecimento, ar-condicionado, limpadores, itens personalizados)' })
  createTemplate(@CurrentUser() user: AuthenticatedRequestUser, @Body('name') name: string, @Body('items') items: { label: string; position?: number }[]) {
    return this.service.createTemplate(user.tenantId, name, items);
  }

  @Get('orders/:orderId')
  @RequirePermission('workshop', 'view')
  getByServiceOrder(@CurrentUser() user: AuthenticatedRequestUser, @Param('orderId') orderId: string) {
    return this.service.getByServiceOrder(user.tenantId, orderId);
  }

  @Post('orders/:orderId/apply')
  @RequirePermission('workshop', 'update')
  applyToServiceOrder(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('orderId') orderId: string, @Body('templateId') templateId: string) {
    return this.service.applyToServiceOrder(toRequestContext(user, req), orderId, templateId);
  }

  @Post(':checklistId/items')
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Preenche um item do checklist (permite anexar fotos/vídeos via Attachment, entity=service_order_checklist_item)' })
  fillItem(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('checklistId') checklistId: string, @Body() dto: FillChecklistItemDto) {
    return this.service.fillItem(toRequestContext(user, req), checklistId, dto);
  }
}

@ApiTags('workshop-delivery')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/orders/:orderId/delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get()
  @RequirePermission('workshop', 'view')
  get(@CurrentUser() user: AuthenticatedRequestUser, @Param('orderId') orderId: string) {
    return this.service.get(user.tenantId, orderId);
  }

  @Post()
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Registra a entrega — exige que a OS esteja completed' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('orderId') orderId: string, @Body() dto: CreateDeliveryDto) {
    return this.service.create(toRequestContext(user, req), orderId, dto);
  }

  @Post('link-sale')
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Vincula a venda/cobrança do PDV gerada na entrega' })
  linkSale(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('orderId') orderId: string, @Body('deliveryId') deliveryId: string, @Body('saleId') saleId: string) {
    return this.service.linkSale(toRequestContext(user, req), deliveryId, saleId);
  }
}

/** Portaria — monitor de entrada de veículos (check-ins recentes, de todas as OS). */
@ApiTags('workshop-portaria')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/portaria')
export class PortariaController {
  constructor(private readonly service: CheckInService) {}

  @Get('recent')
  @RequirePermission('workshop', 'view')
  @ApiOperation({ summary: 'Check-ins recentes de veículos, de todas as Ordens de Serviço' })
  listRecent(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listRecent(user.tenantId);
  }
}
