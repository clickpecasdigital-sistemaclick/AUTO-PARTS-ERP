import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PdvCashRegisterService } from './pdv-cash-register.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/** "Abrir caixa"/"Fechar caixa" (briefing) → `create`/`update` do catálogo padrão. */
@ApiTags('pdv-cash-register')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pdv/cash-registers')
export class PdvCashRegisterController {
  constructor(private readonly service: PdvCashRegisterService) {}

  @Get('open')
  @RequirePermission('sales', 'view')
  listOpen(@CurrentUser() user: AuthenticatedRequestUser, @Query('branchId') branchId?: string) {
    return this.service.listOpen(user.tenantId, branchId);
  }

  @Get(':id/closing-summary')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Resumo esperado por forma de pagamento antes do fechamento' })
  getClosingSummary(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getClosingSummary(user.tenantId, id);
  }

  @Post('open')
  @RequirePermission('sales', 'create')
  open(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('branchId') branchId: string, @Body('openingAmount') openingAmount: number) {
    return this.service.open(toRequestContext(user, req), branchId, openingAmount);
  }

  @Post(':id/movements')
  @RequirePermission('sales', 'update')
  @ApiOperation({ summary: 'Sangria (withdrawal) ou suprimento (reinforcement)' })
  addMovement(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Body('type') type: 'reinforcement' | 'withdrawal' | 'expense' | 'adjustment',
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.service.addMovement(toRequestContext(user, req), id, type, amount, description);
  }

  @Post(':id/reconcile')
  @RequirePermission('sales', 'update')
  @ApiOperation({ summary: 'Conferência — valor contado x esperado por forma de pagamento' })
  reconcile(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('counts') counts: { paymentMethodId: string; countedAmount: number }[]) {
    return this.service.reconcile(toRequestContext(user, req), id, counts);
  }

  @Post(':id/close')
  @RequirePermission('sales', 'update')
  close(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('closingAmount') closingAmount: number) {
    return this.service.close(toRequestContext(user, req), id, closingAmount);
  }
}
