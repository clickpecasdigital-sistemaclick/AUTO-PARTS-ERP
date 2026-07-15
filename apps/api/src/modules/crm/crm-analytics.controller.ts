import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CrmAnalyticsService } from './crm-analytics.service';

@ApiTags('crm-analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm/analytics')
export class CrmAnalyticsController {
  constructor(private readonly service: CrmAnalyticsService) {}

  @Get('kpis')
  @RequirePermission('crm', 'view')
  getKpis(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getKpis(user.tenantId);
  }

  @Get('top-customers')
  @RequirePermission('crm', 'view')
  getTopCustomers(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getTopCustomers(user.tenantId);
  }

  @Get('top-suppliers')
  @RequirePermission('crm', 'view')
  getTopSuppliers(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getTopSuppliers(user.tenantId);
  }

  @Get('sales-by-customer')
  @RequirePermission('crm', 'view')
  getSalesByCustomer(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getSalesByCustomer(user.tenantId);
  }

  @Get('customer-map')
  @RequirePermission('crm', 'view')
  getCustomerMap(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getCustomerMap(user.tenantId);
  }

  @Get('timeline')
  @RequirePermission('crm', 'view')
  getTimeline(@CurrentUser() user: AuthenticatedRequestUser, @Query('days') days?: number) {
    return this.service.getTimeline(user.tenantId, days ? Number(days) : undefined);
  }
}
