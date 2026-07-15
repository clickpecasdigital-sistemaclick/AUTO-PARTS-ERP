import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { Customer360Service } from './customer-360.service';

@ApiTags('mdm-customer-360')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/customers/:customerId/360')
export class Customer360Controller {
  constructor(private readonly service: Customer360Service) {}

  @Get('summary')
  @RequirePermission('customers', 'view')
  getSummary(@CurrentUser() user: AuthenticatedRequestUser, @Param('customerId') customerId: string) {
    return this.service.getSummary(user.tenantId, customerId);
  }

  @Get('timeline')
  @RequirePermission('customers', 'view')
  @ApiOperation({ summary: 'Histórico unificado: compras, orçamentos, OS, financeiro, interações, chamados, oportunidades' })
  getTimeline(@CurrentUser() user: AuthenticatedRequestUser, @Param('customerId') customerId: string) {
    return this.service.getTimeline(user.tenantId, customerId);
  }
}
