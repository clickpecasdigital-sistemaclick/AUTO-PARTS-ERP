import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { MechanicPanelService, PostSaleService, WarrantiesService } from './warranty-mechanic-postsale.service';
import { ClaimWarrantyDto, CreateWarrantyDto } from './dto/workshop-support.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('workshop-warranties')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop')
export class WarrantiesController {
  constructor(private readonly service: WarrantiesService) {}

  @Get('warranties/active')
  @RequirePermission('workshop', 'view')
  listActive(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listActive(user.tenantId);
  }

  @Get('orders/:orderId/warranties')
  @RequirePermission('workshop', 'view')
  listByOrder(@CurrentUser() user: AuthenticatedRequestUser, @Param('orderId') orderId: string) {
    return this.service.listByServiceOrder(user.tenantId, orderId);
  }

  @Post('orders/:orderId/warranties')
  @RequirePermission('workshop', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('orderId') orderId: string, @Body() dto: CreateWarrantyDto) {
    return this.service.create(toRequestContext(user, req), orderId, dto);
  }

  @Post('warranties/:id/claim')
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Aciona a garantia' })
  claim(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: ClaimWarrantyDto) {
    return this.service.claim(toRequestContext(user, req), id, dto);
  }

  @Post('warranties/:id/void')
  @RequirePermission('workshop', 'update')
  void(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('reason') reason: string) {
    return this.service.void(toRequestContext(user, req), id, reason);
  }
}

@ApiTags('workshop-mechanic-panel')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/mechanics/:mechanicId')
export class MechanicPanelController {
  constructor(private readonly service: MechanicPanelService) {}

  @Get('panel')
  @RequirePermission('workshop', 'view')
  @ApiOperation({ summary: 'Painel individual: agenda, serviços, horas, eficiência, retrabalho, comissões' })
  getPanel(@CurrentUser() user: AuthenticatedRequestUser, @Param('mechanicId') mechanicId: string, @Query('sinceDays') sinceDays?: number) {
    return this.service.getPanel(user.tenantId, mechanicId, sinceDays ? Number(sinceDays) : undefined);
  }

  @Get('agenda')
  @RequirePermission('workshop', 'view')
  getAgenda(@CurrentUser() user: AuthenticatedRequestUser, @Param('mechanicId') mechanicId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.service.getAgenda(user.tenantId, mechanicId, new Date(startDate), new Date(endDate));
  }
}

@ApiTags('workshop-post-sale')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/post-sale')
export class PostSaleController {
  constructor(private readonly service: PostSaleService) {}

  @Post('orders/:orderId/survey')
  @RequirePermission('workshop', 'create')
  sendSurvey(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('orderId') orderId: string) {
    return this.service.sendSurvey(toRequestContext(user, req), orderId);
  }

  @Post('surveys/:surveyId/respond')
  respondSurvey(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('surveyId') surveyId: string,
    @Body('npsScore') npsScore: number,
    @Body('satisfactionScore') satisfactionScore: number,
    @Body('comments') comments?: string,
  ) {
    return this.service.respondSurvey(toRequestContext(user, req), surveyId, npsScore, satisfactionScore, comments);
  }

  @Get('nps-summary')
  @RequirePermission('workshop', 'view')
  getNpsSummary(@CurrentUser() user: AuthenticatedRequestUser, @Query('sinceDays') sinceDays?: number) {
    return this.service.getNpsSummary(user.tenantId, sinceDays ? Number(sinceDays) : undefined);
  }

  @Post('orders/:orderId/revision-reminder')
  @RequirePermission('workshop', 'create')
  scheduleRevisionReminder(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body('customerId') customerId: string,
    @Body('monthsAhead') monthsAhead?: number,
  ) {
    return this.service.scheduleRevisionReminder(toRequestContext(user, req), orderId, customerId, monthsAhead);
  }

  @Get('follow-ups/pending')
  @RequirePermission('workshop', 'view')
  listPending(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listPending(user.tenantId);
  }

  @Post('follow-ups/:id/complete')
  @RequirePermission('workshop', 'update')
  complete(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('notes') notes?: string) {
    return this.service.complete(toRequestContext(user, req), id, notes);
  }

  @Get('customers/:customerId/history')
  @RequirePermission('workshop', 'view')
  getCustomerHistory(@CurrentUser() user: AuthenticatedRequestUser, @Param('customerId') customerId: string) {
    return this.service.getCustomerHistory(user.tenantId, customerId);
  }
}
