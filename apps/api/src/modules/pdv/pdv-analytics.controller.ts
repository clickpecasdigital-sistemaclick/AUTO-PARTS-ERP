import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PdvAnalyticsService } from './pdv-analytics.service';
import { PdvDiscountService } from './pdv-discount.service';

@ApiTags('pdv-analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pdv/analytics')
export class PdvAnalyticsController {
  constructor(private readonly service: PdvAnalyticsService) {}

  @Get('kpis')
  @RequirePermission('sales', 'view')
  getKpis(@CurrentUser() user: AuthenticatedRequestUser, @Query('branchId') branchId?: string) {
    return this.service.getKpis(user.tenantId, branchId);
  }

  @Get('top-products')
  @RequirePermission('sales', 'view')
  getTopProducts(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getTopProducts(user.tenantId);
  }

  @Get('by-operator')
  @RequirePermission('sales', 'view')
  getByOperator(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getByOperator(user.tenantId);
  }

  @Get('by-payment-method')
  @RequirePermission('sales', 'view')
  getByPaymentMethod(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getByPaymentMethod(user.tenantId);
  }
}

@ApiTags('pdv-discount-rules')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pdv/discount-rules')
export class PdvDiscountRulesController {
  constructor(private readonly service: PdvDiscountService) {}

  @Get()
  @RequirePermission('sales', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listRules(user.tenantId);
  }

  @Post()
  @RequirePermission('sales', 'update')
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() data: { scope: string; scopeRefId?: string; maxDiscountPercent: number; requiresApprovalAbovePercent?: number },
  ) {
    return this.service.createRule(user.tenantId, data);
  }
}
