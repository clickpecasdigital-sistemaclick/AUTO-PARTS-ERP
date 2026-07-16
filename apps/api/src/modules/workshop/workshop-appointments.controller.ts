import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { WorkshopAppointmentsService } from './workshop-appointments.service';
import { CancelAppointmentDto, CreateAppointmentDto, RescheduleAppointmentDto } from './dto/workshop-support.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/** "Gerenciar agenda" (briefing) → ação `update` do catálogo padrão. */
@ApiTags('workshop-appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/appointments')
export class WorkshopAppointmentsController {
  constructor(private readonly service: WorkshopAppointmentsService) {}

  @Get()
  @RequirePermission('workshop', 'view')
  @ApiOperation({ summary: 'Agenda diária/semanal/mensal — período definido por startDate/endDate' })
  getAgenda(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('mechanicId') mechanicId?: string,
    @Query('boxId') boxId?: string,
  ) {
    return this.service.getAgenda(user.tenantId, new Date(startDate), new Date(endDate), mechanicId, boxId);
  }

  @Get('waitlist')
  @RequirePermission('workshop', 'view')
  listWaitlist(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listWaitlist(user.tenantId);
  }

  @Post()
  @RequirePermission('workshop', 'update')
  @ApiOperation({ summary: 'Agenda por mecânico/box/serviço — conflito de horário cai automaticamente na lista de espera' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Query('branchId') branchId: string, @Body() dto: CreateAppointmentDto) {
    return this.service.create(toRequestContext(user, req), branchId, dto);
  }

  @Post(':id/confirm')
  @RequirePermission('workshop', 'update')
  confirm(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.confirm(toRequestContext(user, req), id);
  }

  @Post(':id/reschedule')
  @RequirePermission('workshop', 'update')
  reschedule(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.service.reschedule(toRequestContext(user, req), id, dto.newScheduledAt, dto.durationMinutes);
  }

  @Post(':id/cancel')
  @RequirePermission('workshop', 'update')
  cancel(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.service.cancel(toRequestContext(user, req), id, dto.reason);
  }

  @Post(':id/no-show')
  @RequirePermission('workshop', 'update')
  markNoShow(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.markNoShow(toRequestContext(user, req), id);
  }
}
