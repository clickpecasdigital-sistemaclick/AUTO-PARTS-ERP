import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PurchasingAnalyticsService } from './purchasing-analytics.service';

@ApiTags('purchasing-analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/analytics')
export class PurchasingAnalyticsController {
  constructor(private readonly service: PurchasingAnalyticsService) {}

  @Get('kpis')
  @RequirePermission('purchases', 'view')
  getKpis(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getKpis(user.tenantId);
  }

  @Get('timeline')
  @RequirePermission('purchases', 'view')
  @ApiOperation({ summary: 'Linha do tempo de compras (gráfico de linha)' })
  getTimeline(@CurrentUser() user: AuthenticatedRequestUser, @Query('days') days?: number) {
    return this.service.getTimeline(user.tenantId, days ? Number(days) : undefined);
  }

  @Get('by-supplier')
  @RequirePermission('purchases', 'view')
  getBySupplier(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getPurchasesBySupplier(user.tenantId);
  }
}
