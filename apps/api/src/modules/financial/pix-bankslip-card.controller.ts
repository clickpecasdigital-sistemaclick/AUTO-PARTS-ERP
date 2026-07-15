import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { BankSlipService, CardTransactionsService, PixService } from './pix-bankslip-card.service';

@ApiTags('financial-pix')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/pix')
export class PixController {
  constructor(private readonly service: PixService) {}

  @Post('charges')
  @RequirePermission('financial', 'create')
  @ApiOperation({ summary: 'Gera cobrança PIX (QR Code + Copia e Cola) — sem integração de PSP nesta sprint' })
  createCharge(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body('bankAccountId') bankAccountId: string,
    @Body('amount') amount: number,
    @Body('receivableId') receivableId?: string,
  ) {
    return this.service.createCharge(user.tenantId, bankAccountId, amount, receivableId);
  }

  @Get('charges/:id')
  @RequirePermission('financial', 'view')
  getCharge(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getCharge(user.tenantId, id);
  }

  @Post('webhook/:txId')
  @ApiOperation({ summary: 'Ponto de integração para o webhook real do PSP (estrutura preparada)' })
  confirmWebhook(@Param('txId') txId: string, @Body() payload: Record<string, unknown>) {
    return this.service.confirmWebhook(txId, JSON.stringify(payload));
  }
}

@ApiTags('financial-bank-slip')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/bank-slips')
export class BankSlipController {
  constructor(private readonly service: BankSlipService) {}

  @Post()
  @RequirePermission('financial', 'create')
  register(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body('bankAccountId') bankAccountId: string,
    @Body('amount') amount: number,
    @Body('dueDate') dueDate: string,
    @Body('receivableId') receivableId?: string,
  ) {
    return this.service.register(user.tenantId, bankAccountId, amount, dueDate, receivableId);
  }

  @Get(':id')
  @RequirePermission('financial', 'view')
  getSlip(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getSlip(user.tenantId, id);
  }

  @Post(':id/settle')
  @RequirePermission('financial', 'update')
  settle(@Param('id') id: string) {
    return this.service.settle(id);
  }

  @Post('remittance')
  @RequirePermission('financial', 'export')
  @ApiOperation({ summary: 'Estrutura preparada para remessa CNAB' })
  generateRemittance(@CurrentUser() user: AuthenticatedRequestUser, @Body('slipIds') slipIds: string[]) {
    return this.service.generateRemittanceBatch(user.tenantId, slipIds);
  }

  @Post('return-file')
  @RequirePermission('financial', 'create')
  @ApiOperation({ summary: 'Estrutura preparada para retorno CNAB (recebe linhas já parseadas)' })
  processReturn(@CurrentUser() user: AuthenticatedRequestUser, @Body('entries') entries: { ourNumber: string; paid: boolean }[]) {
    return this.service.processReturnFile(user.tenantId, entries);
  }
}

@ApiTags('financial-cards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/cards')
export class CardTransactionsController {
  constructor(private readonly service: CardTransactionsService) {}

  @Get('operators')
  @RequirePermission('financial', 'view')
  listOperators(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listOperators(user.tenantId);
  }

  @Post('operators')
  @RequirePermission('financial', 'create')
  createOperator(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() data: { name: string; debitFeePercent: number; creditFeePercent: number; settlementDays: number; anticipationFeePercent?: number },
  ) {
    return this.service.createOperator(user.tenantId, data);
  }

  @Get('pending-settlement')
  @RequirePermission('financial', 'view')
  listPendingSettlement(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listPendingSettlement(user.tenantId);
  }

  @Post(':id/anticipate')
  @RequirePermission('financial', 'update')
  @ApiOperation({ summary: 'Antecipa o recebível, aplicando a taxa de antecipação da operadora' })
  anticipate(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.anticipate(user.tenantId, id);
  }

  @Post(':id/settle')
  @RequirePermission('financial', 'update')
  settle(@Param('id') id: string) {
    return this.service.settle(id);
  }
}
