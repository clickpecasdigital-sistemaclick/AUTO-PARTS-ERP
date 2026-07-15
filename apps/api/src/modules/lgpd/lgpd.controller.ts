import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { LgpdService } from './lgpd.service';

function toCtx(u: AuthenticatedRequestUser, req: Request) {
  return { tenantId: u.tenantId, userId: u.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('lgpd')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('lgpd')
export class LgpdController {
  constructor(private readonly lgpd: LgpdService) {}

  @Post('consent')
  @ApiOperation({ summary: 'Registrar consentimento LGPD' })
  grantConsent(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('type') type: string, @Body('version') version: string) {
    return this.lgpd.grantConsent(toCtx(u, req), type, version);
  }

  @Post('consent/revoke')
  revokeConsent(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('type') type: string, @Body('version') version: string) {
    return this.lgpd.revokeConsent(toCtx(u, req), type, version);
  }

  @Get('consent/history')
  consentHistory(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.lgpd.getConsentHistory(u.tenantId, u.id);
  }

  @Get('consent/latest')
  latestConsents(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.lgpd.getLatestConsents(u.tenantId, u.id);
  }

  @Post('request')
  @ApiOperation({ summary: 'Criar requisição LGPD (acesso, exportação, erasure, portabilidade)' })
  createRequest(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('type') type: string, @Body('description') description?: string) {
    return this.lgpd.createRequest(toCtx(u, req), type, description);
  }

  @Get('requests')
  @RequirePermission('settings', 'view')
  listRequests(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.lgpd.listRequests(u.tenantId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Exportar todos os dados do usuário (Portabilidade LGPD)' })
  exportData(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request) {
    return this.lgpd.exportUserData(toCtx(u, req));
  }

  @Get('retention-report')
  @RequirePermission('settings', 'view')
  retentionReport(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.lgpd.getRetentionReport(u.tenantId);
  }

  @Post('requests/:id/process')
  @RequirePermission('settings', 'update')
  processRequest(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('approved') approved: boolean) {
    return this.lgpd.processRequest(toCtx(u, req), id, approved);
  }
}
