import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { ServiceBoxesService, ServicesCatalogService } from './services-catalog-boxes.service';
import { WorkshopAnalyticsService } from './workshop-analytics.service';

@ApiTags('workshop-services-catalog')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/services')
export class ServicesCatalogController {
  constructor(private readonly service: ServicesCatalogService) {}

  @Get()
  @RequirePermission('workshop', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('category') category?: string) {
    return this.service.list(user.tenantId, category);
  }

  @Post()
  @RequirePermission('workshop', 'create')
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() data: { code?: string; name: string; description?: string; category?: string; specialty?: string; standardPrice: number; estimatedMinutes?: number; warrantyDays?: number },
  ) {
    return this.service.create(user.tenantId, data);
  }

  @Put(':id')
  @RequirePermission('workshop', 'update')
  update(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.service.update(user.tenantId, id, data);
  }

  @Get('suggest/:mechanicId')
  @RequirePermission('workshop', 'view')
  @ApiOperation({ summary: 'Sugere serviços compatíveis com a especialidade do mecânico' })
  suggestByMechanic(@CurrentUser() user: AuthenticatedRequestUser, @Param('mechanicId') mechanicId: string) {
    return this.service.suggestByMechanicSpecialty(user.tenantId, mechanicId);
  }
}

@ApiTags('workshop-boxes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/boxes')
export class ServiceBoxesController {
  constructor(private readonly service: ServiceBoxesService) {}

  @Get()
  @RequirePermission('workshop', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('branchId') branchId?: string) {
    return this.service.list(user.tenantId, branchId);
  }

  @Post()
  @RequirePermission('workshop', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body('branchId') branchId: string, @Body('code') code: string, @Body('name') name: string) {
    return this.service.create(user.tenantId, branchId, code, name);
  }

  @Get('occupancy')
  @RequirePermission('workshop', 'view')
  getOccupancy(@CurrentUser() user: AuthenticatedRequestUser, @Query('branchId') branchId: string) {
    return this.service.getOccupancy(user.tenantId, branchId);
  }
}

@ApiTags('workshop-dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workshop/analytics')
export class WorkshopAnalyticsController {
  constructor(private readonly service: WorkshopAnalyticsService) {}

  @Get('kpis')
  @RequirePermission('workshop', 'view')
  getKpis(@CurrentUser() user: AuthenticatedRequestUser, @Query('branchId') branchId?: string) {
    return this.service.getKpis(user.tenantId, branchId);
  }

  @Get('today-agenda')
  @RequirePermission('workshop', 'view')
  getTodayAgenda(@CurrentUser() user: AuthenticatedRequestUser, @Query('branchId') branchId?: string) {
    return this.service.getTodayAgenda(user.tenantId, branchId);
  }

  @Get('orders-by-status')
  @RequirePermission('workshop', 'view')
  getOrdersByStatus(@CurrentUser() user: AuthenticatedRequestUser, @Query('branchId') branchId?: string) {
    return this.service.getOrdersByStatus(user.tenantId, branchId);
  }
}
