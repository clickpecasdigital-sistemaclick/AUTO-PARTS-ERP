import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { ChartOfAccountsService, CommissionRulesService, CostCentersService } from './chart-cost-center-commission.service';

@ApiTags('financial-chart-of-accounts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/chart-of-accounts')
export class ChartOfAccountsController {
  constructor(private readonly service: ChartOfAccountsService) {}

  @Get('tree')
  @RequirePermission('financial', 'view')
  getTree(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string) {
    return this.service.getTree(user.tenantId, companyId);
  }

  @Get()
  @RequirePermission('financial', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string) {
    return this.service.list(user.tenantId, companyId);
  }

  @Post()
  @RequirePermission('financial', 'create')
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('companyId') companyId: string,
    @Body() data: { code: string; name: string; type: string; parentId?: string },
  ) {
    return this.service.create(user.tenantId, companyId, data);
  }
}

@ApiTags('financial-cost-centers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/cost-centers')
export class CostCentersController {
  constructor(private readonly service: CostCentersService) {}

  @Get()
  @RequirePermission('financial', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string) {
    return this.service.list(user.tenantId, companyId);
  }

  @Post()
  @RequirePermission('financial', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body('companyId') companyId: string, @Body() data: { code: string; name: string }) {
    return this.service.create(user.tenantId, companyId, data);
  }

  @Get('allocations')
  @RequirePermission('financial', 'view')
  getAllocations(@CurrentUser() user: AuthenticatedRequestUser, @Query('payableId') payableId?: string, @Query('receivableId') receivableId?: string) {
    return this.service.getAllocations(user.tenantId, { payableId, receivableId });
  }

  @Post('allocate')
  @RequirePermission('financial', 'update')
  @ApiOperation({ summary: 'Rateio de um título entre múltiplos centros de custo (soma deve fechar 100%)' })
  allocate(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body('payableId') payableId: string | undefined,
    @Body('receivableId') receivableId: string | undefined,
    @Body('allocations') allocations: { costCenterId: string; percent: number }[],
  ) {
    return this.service.allocate(user.tenantId, { payableId, receivableId }, allocations);
  }

  @Get('totals-by-period')
  @RequirePermission('financial', 'view')
  getTotalsByPeriod(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.service.getTotalsByPeriod(user.tenantId, companyId, new Date(startDate), new Date(endDate));
  }
}

@ApiTags('financial-commissions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/commissions')
export class CommissionsController {
  constructor(private readonly service: CommissionRulesService) {}

  @Get('rules')
  @RequirePermission('financial', 'view')
  listRules(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.list(user.tenantId);
  }

  @Post('rules')
  @RequirePermission('financial', 'create')
  createRule(@CurrentUser() user: AuthenticatedRequestUser, @Body() data: { scope: string; scopeRefId?: string; ratePercent: number; priority?: number }) {
    return this.service.create(user.tenantId, data);
  }

  @Get()
  @RequirePermission('financial', 'view')
  listCommissions(@CurrentUser() user: AuthenticatedRequestUser, @Query('status') status?: string) {
    return this.service.listCommissions(user.tenantId, status);
  }

  @Post(':id/approve')
  @RequirePermission('financial', 'approve')
  approve(@Param('id') id: string) {
    return this.service.approveCommission(id);
  }

  @Post(':id/pay')
  @RequirePermission('financial', 'update')
  markPaid(@Param('id') id: string) {
    return this.service.markCommissionPaid(id);
  }
}
