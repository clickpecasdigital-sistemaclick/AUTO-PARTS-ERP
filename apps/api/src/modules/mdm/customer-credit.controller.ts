import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CustomerCreditService } from './customer-credit.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/**
 * Crédito do Cliente. "Visualizar Financeiro" (briefing) → mapeado para a
 * ação `view` do catálogo padrão (visualização) e "Liberar Crédito" →
 * `update` (a alteração do limite/status já é auditada com ação dedicada
 * `credit_change`, então o controle granular vem do log, não de uma nova
 * ação de permissão).
 */
@ApiTags('mdm-customer-credit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/customers/:customerId/credit')
export class CustomerCreditController {
  constructor(private readonly service: CustomerCreditService) {}

  @Get()
  @RequirePermission('customers', 'view')
  @ApiOperation({ summary: 'Limite, saldo, dias de atraso, maior compra, ticket médio, score e status de crédito' })
  getProfile(@CurrentUser() user: AuthenticatedRequestUser, @Param('customerId') customerId: string) {
    return this.service.getProfile(user.tenantId, customerId);
  }

  @Get('history')
  @RequirePermission('customers', 'view')
  getHistory(@CurrentUser() user: AuthenticatedRequestUser, @Param('customerId') customerId: string) {
    return this.service.getEventHistory(user.tenantId, customerId);
  }

  @Post('refresh')
  @RequirePermission('customers', 'update')
  @ApiOperation({ summary: 'Recalcula o perfil de crédito e aplica bloqueio automático por inadimplência' })
  refresh(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('customerId') customerId: string) {
    return this.service.refreshProfile(toRequestContext(user, req), customerId);
  }

  @Post('limit')
  @RequirePermission('customers', 'update')
  @ApiOperation({ summary: 'Altera o limite de crédito (auditado)' })
  updateLimit(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('customerId') customerId: string,
    @Body('newLimit') newLimit: number,
    @Body('reason') reason?: string,
  ) {
    return this.service.updateCreditLimit(toRequestContext(user, req), customerId, newLimit, reason);
  }
}
