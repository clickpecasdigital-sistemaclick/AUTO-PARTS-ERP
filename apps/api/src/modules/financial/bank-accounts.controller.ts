import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { BankAccountsService } from './bank-accounts.service';
import { BankReconciliationService } from './bank-reconciliation.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('financial-banks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/banks')
export class BankAccountsController {
  constructor(private readonly service: BankAccountsService) {}

  @Get('catalog')
  @RequirePermission('financial', 'view')
  listBanks() {
    return this.service.listBanks();
  }

  @Get('accounts')
  @RequirePermission('financial', 'view')
  listAccounts(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId?: string) {
    return this.service.listAccounts(user.tenantId, companyId);
  }

  @Get('accounts/:id')
  @RequirePermission('financial', 'view')
  getAccount(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getAccount(user.tenantId, id);
  }

  @Post('accounts')
  @RequirePermission('financial', 'create')
  createAccount(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('companyId') companyId: string, @Body() data: Record<string, unknown>) {
    return this.service.createAccount(toRequestContext(user, req), companyId, data);
  }

  @Post('accounts/:id/pix-keys')
  @RequirePermission('financial', 'update')
  addPixKey(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body('type') type: string, @Body('value') value: string) {
    return this.service.addPixKey(user.tenantId, id, type, value);
  }

  @Post('accounts/:id/refresh-balance')
  @RequirePermission('financial', 'update')
  refreshBalance(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.refreshBalance(user.tenantId, id);
  }
}

/** "Conciliar" (briefing) → ação `update` do catálogo padrão. */
@ApiTags('financial-reconciliation')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/reconciliation')
export class BankReconciliationController {
  constructor(private readonly service: BankReconciliationService) {}

  @Get('history')
  @RequirePermission('financial', 'view')
  getHistory(@CurrentUser() user: AuthenticatedRequestUser, @Query('bankAccountId') bankAccountId?: string) {
    return this.service.getHistory(user.tenantId, bankAccountId);
  }

  @Get('unmatched/:bankAccountId')
  @RequirePermission('financial', 'view')
  @ApiOperation({ summary: 'Pendências — linhas de extrato ainda não conciliadas' })
  listUnmatched(@CurrentUser() user: AuthenticatedRequestUser, @Param('bankAccountId') bankAccountId: string) {
    return this.service.listUnmatched(user.tenantId, bankAccountId);
  }

  @Post('import')
  @RequirePermission('financial', 'create')
  @ApiOperation({ summary: 'Importação OFX/CNAB — estrutura preparada (recebe linhas já normalizadas)' })
  importStatement(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Body('bankAccountId') bankAccountId: string,
    @Body('source') source: 'ofx' | 'cnab' | 'manual',
    @Body('rows') rows: { postedAt: string; description: string; amount: number; externalId?: string }[],
  ) {
    return this.service.importStatement(toRequestContext(user, req), bankAccountId, source, rows);
  }

  @Post('open')
  @RequirePermission('financial', 'update')
  open(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('bankAccountId') bankAccountId: string, @Body('periodStart') periodStart: string, @Body('periodEnd') periodEnd: string) {
    return this.service.openReconciliation(toRequestContext(user, req), bankAccountId, periodStart, periodEnd);
  }

  @Post(':id/match-manual')
  @RequirePermission('financial', 'update')
  matchManually(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Body('statementEntryId') statementEntryId: string,
    @Body('payableId') payableId?: string,
    @Body('receivableId') receivableId?: string,
  ) {
    return this.service.matchManually(toRequestContext(user, req), id, statementEntryId, { payableId, receivableId });
  }

  @Post(':id/auto-match')
  @RequirePermission('financial', 'update')
  @ApiOperation({ summary: 'Conciliação automática por valor exato + janela de 3 dias' })
  autoMatch(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('bankAccountId') bankAccountId: string) {
    return this.service.autoMatch(toRequestContext(user, req), id, bankAccountId);
  }

  @Post(':id/close')
  @RequirePermission('financial', 'update')
  close(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.closeReconciliation(toRequestContext(user, req), id);
  }
}
