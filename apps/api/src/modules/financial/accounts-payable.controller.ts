import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { AccountsPayableService } from './accounts-payable.service';
import { CreatePayableDto, QueryFinancialDocumentDto, RenegotiateDto, ReverseDto, SettleDto } from './dto/financial-document.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/** "Baixar"→`update`, "Estornar"→`cancel` (briefing → catálogo padrão de permissões). */
@ApiTags('financial-payable')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial/payables')
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Get()
  @RequirePermission('financial', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Query() query: QueryFinancialDocumentDto) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermission('financial', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Get(':id/history')
  @RequirePermission('financial', 'view')
  getHistory(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getHistory(user.tenantId, id);
  }

  @Post()
  @RequirePermission('financial', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Query('companyId') companyId: string, @Body() dto: CreatePayableDto) {
    return this.service.create(toRequestContext(user, req), companyId, dto);
  }

  @Post(':id/settle')
  @RequirePermission('financial', 'update')
  @ApiOperation({ summary: 'Baixa parcial ou total, com juros/multa/desconto' })
  settle(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: SettleDto) {
    return this.service.settle(toRequestContext(user, req), id, dto);
  }

  @Post(':id/reverse')
  @RequirePermission('financial', 'cancel')
  reverse(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: ReverseDto) {
    return this.service.reverse(toRequestContext(user, req), id, dto.reason);
  }

  @Post(':id/renegotiate')
  @RequirePermission('financial', 'update')
  renegotiate(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: RenegotiateDto) {
    return this.service.renegotiate(toRequestContext(user, req), id, dto);
  }

  @Post(':id/schedule')
  @RequirePermission('financial', 'approve')
  @ApiOperation({ summary: 'Agendamento de pagamento ("Aprovar pagamentos" — define quando será pago)' })
  schedule(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('scheduledAt') scheduledAt: string) {
    return this.service.schedule(toRequestContext(user, req), id, scheduledAt);
  }
}
