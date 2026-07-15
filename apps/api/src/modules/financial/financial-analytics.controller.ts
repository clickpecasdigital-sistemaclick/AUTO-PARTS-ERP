import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CashFlowService, DreService } from './cash-flow-dre.service';
import { FinancialAnalyticsService, FinancialProjectionsService } from './financial-projections-analytics.service';

@ApiTags('financial-cash-flow')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/cash-flow')
export class CashFlowController {
  constructor(private readonly service: CashFlowService) {}

  @Get('realized')
  @RequirePermission('financial', 'view')
  getRealized(@CurrentUser() user: AuthenticatedRequestUser, @Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('companyId') companyId?: string, @Query('costCenterId') costCenterId?: string, @Query('bankAccountId') bankAccountId?: string) {
    return this.service.getRealized(user.tenantId, new Date(startDate), new Date(endDate), { companyId, costCenterId, bankAccountId });
  }

  @Get('projected')
  @RequirePermission('financial', 'view')
  getProjected(@CurrentUser() user: AuthenticatedRequestUser, @Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('companyId') companyId?: string, @Query('costCenterId') costCenterId?: string, @Query('bankAccountId') bankAccountId?: string) {
    return this.service.getProjected(user.tenantId, new Date(startDate), new Date(endDate), { companyId, costCenterId, bankAccountId });
  }

  @Get('consolidated')
  @RequirePermission('financial', 'view')
  getConsolidated(@CurrentUser() user: AuthenticatedRequestUser, @Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('companyId') companyId?: string, @Query('costCenterId') costCenterId?: string, @Query('bankAccountId') bankAccountId?: string) {
    return this.service.getConsolidated(user.tenantId, new Date(startDate), new Date(endDate), { companyId, costCenterId, bankAccountId });
  }
}

@ApiTags('financial-dre')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/dre')
export class DreController {
  constructor(private readonly service: DreService) {}

  @Get()
  @RequirePermission('financial', 'view')
  @ApiOperation({ summary: 'DRE Gerencial — Receita Bruta, Deduções, Receita Líquida, Custos, Despesas, EBITDA, Lucro Operacional/Líquido' })
  generate(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.service.generate(user.tenantId, companyId, new Date(startDate), new Date(endDate));
  }
}

@ApiTags('financial-projections')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/projections')
export class FinancialProjectionsController {
  constructor(private readonly service: FinancialProjectionsService) {}

  @Get()
  @RequirePermission('financial', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string) {
    return this.service.list(user.tenantId, companyId);
  }

  @Post()
  @RequirePermission('financial', 'create')
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body('companyId') companyId: string,
    @Body() data: { name: string; scenario: string; referenceMonth: string; projectedRevenue: number; projectedExpense: number; notes?: string },
  ) {
    return this.service.create(user.tenantId, companyId, user.id, data);
  }

  @Get('compare-scenarios')
  @RequirePermission('financial', 'view')
  compareScenarios(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string, @Query('referenceMonth') referenceMonth: string) {
    return this.service.compareScenarios(user.tenantId, companyId, referenceMonth);
  }
}

@ApiTags('financial-analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/analytics')
export class FinancialAnalyticsController {
  constructor(private readonly service: FinancialAnalyticsService) {}

  @Get('executive-kpis')
  @RequirePermission('financial', 'view')
  getExecutiveKpis(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string) {
    return this.service.getExecutiveKpis(user.tenantId, companyId);
  }

  @Get('expense-ranking')
  @RequirePermission('financial', 'view')
  getExpenseRanking(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string) {
    return this.service.getExpenseRanking(user.tenantId, companyId);
  }
}
