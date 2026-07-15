import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { SalespersonsService } from './salespersons.service';

@ApiTags('mdm-salespersons')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/salespersons')
export class SalespersonsController {
  constructor(private readonly service: SalespersonsService) {}

  @Get()
  @RequirePermission('employees', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.findAll(user.tenantId);
  }

  @Get('ranking')
  @RequirePermission('employees', 'view')
  @ApiOperation({ summary: 'Ranking de vendedores do mês' })
  getRanking(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getRanking(user.tenantId);
  }

  @Get(':id')
  @RequirePermission('employees', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Get(':id/performance')
  @RequirePermission('employees', 'view')
  getPerformance(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getPerformance(user.tenantId, id);
  }
}
