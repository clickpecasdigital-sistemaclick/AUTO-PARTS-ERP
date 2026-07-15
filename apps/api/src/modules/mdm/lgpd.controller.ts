import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { LgpdService } from './lgpd.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('mdm-lgpd')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/lgpd')
export class LgpdController {
  constructor(private readonly service: LgpdService) {}

  @Post('customers/:customerId/consents')
  @RequirePermission('customers', 'update')
  giveConsent(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('customerId') customerId: string,
    @Body('purpose') purpose: string,
    @Body('legalBasis') legalBasis: string,
  ) {
    return this.service.giveConsent(toRequestContext(user, req), customerId, purpose, legalBasis);
  }

  @Post('consents/:consentId/revoke')
  @RequirePermission('customers', 'update')
  revokeConsent(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('consentId') consentId: string) {
    return this.service.revokeConsent(toRequestContext(user, req), consentId);
  }

  @Get('customers/:customerId/consents')
  @RequirePermission('customers', 'view')
  getConsentHistory(@CurrentUser() user: AuthenticatedRequestUser, @Param('customerId') customerId: string) {
    return this.service.getConsentHistory(user.tenantId, customerId);
  }

  @Get('requests')
  @RequirePermission('customers', 'view')
  listRequests(@CurrentUser() user: AuthenticatedRequestUser, @Query('customerId') customerId?: string) {
    return this.service.listRequests(user.tenantId, customerId);
  }

  @Post('customers/:customerId/export')
  @RequirePermission('customers', 'export')
  @ApiOperation({ summary: 'Exportação de dados do titular (portabilidade, LGPD art. 18)' })
  exportData(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('customerId') customerId: string) {
    return this.service.exportCustomerData(toRequestContext(user, req), customerId);
  }

  @Post('customers/:customerId/anonymize')
  @RequirePermission('customers', 'delete')
  @ApiOperation({ summary: 'Anonimização irreversível dos campos identificadores (preserva histórico transacional)' })
  anonymize(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('customerId') customerId: string) {
    return this.service.anonymize(toRequestContext(user, req), customerId);
  }
}
