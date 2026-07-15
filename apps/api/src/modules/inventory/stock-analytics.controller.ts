import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { StockAnalyticsService, type AbcCriteria } from './stock-analytics.service';

/** Dashboard do Estoque: KPIs em tempo real, Curva ABC, Giro/Cobertura/Tempo parado, Alertas inteligentes. */
@ApiTags('inventory-analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock/analytics')
export class StockAnalyticsController {
  constructor(private readonly analytics: StockAnalyticsService) {}

  @Get('kpis')
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'KPIs do Dashboard: valor total, itens, sem estoque, abaixo/acima do limite, produtos parados' })
  getKpis(@CurrentUser() user: AuthenticatedRequestUser, @Query('warehouseId') warehouseId?: string) {
    return this.analytics.getKpis(user.tenantId, warehouseId);
  }

  @Get('abc-curve')
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'Curva ABC por valor, quantidade, movimentação ou lucro' })
  getAbcCurve(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('criteria') criteria: AbcCriteria = 'value',
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.analytics.getAbcCurve(user.tenantId, criteria, warehouseId);
  }

  @Get('turnover')
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'Giro, cobertura (dias) e tempo parado por produto' })
  getTurnover(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('periodDays') periodDays?: number,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.analytics.getTurnover(user.tenantId, periodDays ? Number(periodDays) : undefined, warehouseId);
  }

  @Get('alerts')
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'Alertas inteligentes: mínimo, máximo, vencendo, negativo' })
  getAlerts(@CurrentUser() user: AuthenticatedRequestUser, @Query('warehouseId') warehouseId?: string) {
    return this.analytics.getAlerts(user.tenantId, warehouseId);
  }
}
