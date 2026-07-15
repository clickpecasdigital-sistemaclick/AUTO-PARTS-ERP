import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { FiscalIssuanceService } from './fiscal-issuance.service';
import { FiscalEventsService, FiscalConfigService, FiscalCertificateService } from './fiscal-events-config-cert.service';
import { FiscalMonitorService, DanfeService } from './fiscal-monitor-danfe.service';
import { TaxEngineService } from './tax-engine.service';

function toCtx(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('fiscal-issuance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('fiscal/invoices')
export class FiscalIssuanceController {
  constructor(
    private readonly issuance: FiscalIssuanceService,
    private readonly monitor: FiscalMonitorService,
    private readonly danfe: DanfeService,
  ) {}

  @Get()
  @RequirePermission('fiscal', 'view')
  list(@CurrentUser() u: AuthenticatedRequestUser, @Query() q: Record<string, string>) {
    return this.monitor.listInvoices(u.tenantId, q as never);
  }

  @Get(':id')
  @RequirePermission('fiscal', 'view')
  get(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.monitor.getInvoice(u.tenantId, id);
  }

  @Get(':id/xml')
  @RequirePermission('fiscal', 'export')
  @ApiOperation({ summary: 'Download XML da NF-e' })
  async xml(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string, @Res() res: Response) {
    const inv = await this.monitor.getXml(u.tenantId, id);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="NFe_${inv?.accessKey ?? id}.xml"`);
    res.send(inv?.xmlContent ?? '');
  }

  @Get(':id/danfe')
  @RequirePermission('fiscal', 'print')
  @ApiOperation({ summary: 'Download DANFE em PDF' })
  async pdf(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string, @Res() res: Response) {
    const inv = await this.monitor.getInvoice(u.tenantId, id);
    if (!inv) return res.status(404).send('Nota nao encontrada');
    const buf = await this.danfe.generatePdf(inv as never);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="DANFE_${inv.number}.pdf"`);
    res.send(buf);
  }

  @Post('nfe')
  @RequirePermission('fiscal', 'issue')
  @ApiOperation({ summary: 'Emite NF-e modelo 55' })
  issueNfe(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('branchId') branchId: string, @Body() params: Record<string, unknown>) {
    return this.issuance.issueNfe(toCtx(u, req), branchId, params as never);
  }

  @Post('nfce')
  @RequirePermission('fiscal', 'issue')
  @ApiOperation({ summary: 'Emite NFC-e modelo 65 para PDV balcao' })
  issueNfce(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('branchId') branchId: string, @Body('saleId') saleId: string, @Body('items') items: never[], @Body('paymentType') paymentType?: string) {
    return this.issuance.issueNfce(toCtx(u, req), branchId, saleId, items, paymentType);
  }

  @Post(':id/authorize')
  @RequirePermission('fiscal', 'issue')
  @ApiOperation({ summary: 'Webhook de autorizacao SEFAZ/PSP' })
  authorize(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('protocolNumber') proto: string, @Body('xmlPath') xmlPath?: string) {
    return this.issuance.confirmAuthorization(toCtx(u, req), id, proto, xmlPath);
  }

  @Post(':id/reject')
  @RequirePermission('fiscal', 'issue')
  reject(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('code') code: string, @Body('message') msg: string) {
    return this.issuance.registerRejection(toCtx(u, req), id, code, msg);
  }
}

@ApiTags('fiscal-events')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('fiscal/events')
export class FiscalEventsController {
  constructor(private readonly events: FiscalEventsService) {}

  @Get(':invoiceId')
  @RequirePermission('fiscal', 'view')
  list(@CurrentUser() u: AuthenticatedRequestUser, @Param('invoiceId') id: string) {
    return this.events.listEvents(u.tenantId, id);
  }

  @Post(':invoiceId/cancel')
  @RequirePermission('fiscal', 'cancel')
  cancel(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('invoiceId') id: string, @Body('justification') j: string) {
    return this.events.cancel(toCtx(u, req), id, j);
  }

  @Post(':invoiceId/correction-letter')
  @RequirePermission('fiscal', 'cancel')
  cce(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('invoiceId') id: string, @Body('correction') c: string) {
    return this.events.issueCorrectionLetter(toCtx(u, req), id, c);
  }
}

@ApiTags('fiscal-config')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('fiscal')
export class FiscalConfigController {
  constructor(
    private readonly config: FiscalConfigService,
    private readonly cert: FiscalCertificateService,
    private readonly monitor: FiscalMonitorService,
    private readonly tax: TaxEngineService,
    private readonly events: FiscalEventsService,
  ) {}

  @Get('dashboard')
  @RequirePermission('fiscal', 'view')
  dashboard(@CurrentUser() u: AuthenticatedRequestUser, @Query('branchId') b?: string) {
    return this.monitor.getDashboard(u.tenantId, b);
  }

  @Get('config/:branchId')
  @RequirePermission('fiscal', 'view')
  getConfig(@CurrentUser() u: AuthenticatedRequestUser, @Param('branchId') b: string) {
    return this.config.getConfig(u.tenantId, b);
  }

  @Post('config/:branchId')
  @RequirePermission('fiscal', 'manage_config')
  upsertConfig(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('branchId') b: string, @Body() data: Record<string, unknown>) {
    return this.config.upsertConfig(toCtx(u, req), b, data);
  }

  @Get('series/:branchId')
  @RequirePermission('fiscal', 'view')
  series(@CurrentUser() u: AuthenticatedRequestUser, @Param('branchId') b: string) {
    return this.config.listSeries(u.tenantId, b);
  }

  @Post('series/:branchId')
  @RequirePermission('fiscal', 'manage_config')
  createSeries(@CurrentUser() u: AuthenticatedRequestUser, @Param('branchId') b: string, @Body('model') model: string, @Body('series') s: number) {
    return this.config.createSeries(u.tenantId, b, model, s);
  }

  @Post('void-range/:branchId')
  @RequirePermission('fiscal', 'void')
  voidRange(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('branchId') b: string, @Body() params: Record<string, unknown>) {
    return this.events.voidRange(toCtx(u, req), b, params as never);
  }

  @Get('ncm')
  @RequirePermission('fiscal', 'view')
  ncm(@Query('search') s: string) {
    return this.config.listNcm(s ?? '');
  }

  @Get('cfop')
  @RequirePermission('fiscal', 'view')
  cfop(@Query('type') t?: string) {
    return this.config.listCfop(t);
  }

  @Get('tax-rules')
  @RequirePermission('fiscal', 'view')
  taxRules(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.tax.listRules(u.tenantId);
  }

  @Post('tax-rules')
  @RequirePermission('fiscal', 'manage_config')
  createTaxRule(@CurrentUser() u: AuthenticatedRequestUser, @Body() data: Record<string, unknown>) {
    return this.tax.createRule(u.tenantId, data);
  }

  @Get('certificates')
  @RequirePermission('fiscal', 'manage_certs')
  certs(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.cert.listCertificates(u.tenantId);
  }

  @Post('certificates')
  @RequirePermission('fiscal', 'manage_certs')
  uploadCert(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('companyId') companyId: string, @Body() params: Record<string, unknown>) {
    return this.cert.uploadCertificate(toCtx(u, req), companyId, params as never);
  }

  @Get('certificates/expiry-alerts')
  @RequirePermission('fiscal', 'view')
  expiryAlerts(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.cert.getExpiryAlerts(u.tenantId);
  }
}
