import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CrmCampaignsService, CrmTagsService, CrmTasksService, SupportTicketsService } from './crm-support.service';
import { CreateCampaignDto, CreateCrmTagDto, CreateCrmTaskDto, CreateSupportTicketDto } from './dto/crm.dto';

@ApiTags('crm-tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm/tasks')
export class CrmTasksController {
  constructor(private readonly service: CrmTasksService) {}

  @Get()
  @RequirePermission('crm', 'view')
  listPending(@CurrentUser() user: AuthenticatedRequestUser, @Query('assignedTo') assignedTo?: string) {
    return this.service.listPending(user.tenantId, assignedTo);
  }

  @Get('overdue')
  @RequirePermission('crm', 'view')
  listOverdue(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listOverdue(user.tenantId);
  }

  @Post()
  @RequirePermission('crm', 'create')
  @ApiOperation({ summary: 'Cria tarefa: ligação, visita, follow-up, e-mail, WhatsApp (estrutura)' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CreateCrmTaskDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Post(':id/complete')
  @RequirePermission('crm', 'update')
  complete(@Param('id') id: string) {
    return this.service.complete(id);
  }

  @Post(':id/cancel')
  @RequirePermission('crm', 'cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}

@ApiTags('crm-tags')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm/tags')
export class CrmTagsController {
  constructor(private readonly service: CrmTagsService) {}

  @Get()
  @RequirePermission('crm', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermission('crm', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CreateCrmTagDto) {
    return this.service.create(user.tenantId, dto);
  }
}

@ApiTags('crm-campaigns')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm/campaigns')
export class CrmCampaignsController {
  constructor(private readonly service: CrmCampaignsService) {}

  @Get()
  @RequirePermission('crm', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermission('crm', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CreateCampaignDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Post(':id/members')
  @RequirePermission('crm', 'update')
  addMember(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() data: { customerId?: string; leadId?: string }) {
    return this.service.addMember(user.tenantId, id, data);
  }

  @Post(':id/activate')
  @RequirePermission('crm', 'update')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Post(':id/finish')
  @RequirePermission('crm', 'update')
  finish(@Param('id') id: string) {
    return this.service.finish(id);
  }
}

@ApiTags('crm-support-tickets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm/support-tickets')
export class SupportTicketsController {
  constructor(private readonly service: SupportTicketsService) {}

  @Get()
  @RequirePermission('crm', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('status') status?: string) {
    return this.service.list(user.tenantId, status);
  }

  @Post()
  @RequirePermission('crm', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CreateSupportTicketDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Post(':id/resolve')
  @RequirePermission('crm', 'update')
  resolve(@Param('id') id: string) {
    return this.service.resolve(id);
  }

  @Post(':id/close')
  @RequirePermission('crm', 'update')
  close(@Param('id') id: string) {
    return this.service.close(id);
  }
}
