import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CopilotService } from './copilot.service';
import { AnalyticsAiService } from '@/modules/analytics-ai/analytics-ai.service';
import { CommunicationService, SetupWizardService, ImporterService, SupportService } from '@/modules/communication/communication.service';

@ApiTags('copilot-ai')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('copilot')
export class CopilotController {
  constructor(
    private readonly copilot: CopilotService,
    private readonly analytics: AnalyticsAiService,
    private readonly comm: CommunicationService,
    private readonly wizard: SetupWizardService,
    private readonly importer: ImporterService,
    private readonly support: SupportService,
  ) {}

  // ---- COPILOT -------
  @Post('command')
  @ApiOperation({ summary: 'Executar comando em linguagem natural no Copilot' })
  command(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('command') command: string, @Body('screen') screen?: string) {
    const permissions = (req as Request & { user: { permissions?: string[] } }).user?.permissions ?? [];
    return this.copilot.processCommand({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip, permissions }, command, screen);
  }

  @Get('history')
  history(@CurrentUser() u: AuthenticatedRequestUser) { return this.copilot.getHistory(u.tenantId, u.id); }

  // ---- ANALYTICS IA -------
  @Post('analytics/run')
  @RequirePermission('bi', 'create')
  @ApiOperation({ summary: 'Executar motor de IA analítica (previsões, insights)' })
  runAnalytics(@CurrentUser() u: AuthenticatedRequestUser) { return this.analytics.generateAllPredictions(u.tenantId); }

  @Get('analytics/predictions')
  @RequirePermission('bi', 'view')
  predictions(@CurrentUser() u: AuthenticatedRequestUser, @Query('type') type?: string) { return this.analytics.getPredictions(u.tenantId, type); }

  @Get('analytics/sales-forecast')
  @RequirePermission('bi', 'view')
  salesForecast(@CurrentUser() u: AuthenticatedRequestUser) { return this.analytics.salesForecast(u.tenantId); }

  @Get('analytics/stock-rupture')
  @RequirePermission('stock', 'view')
  stockRupture(@CurrentUser() u: AuthenticatedRequestUser) { return this.analytics.stockRupturePrediction(u.tenantId); }

  @Get('analytics/purchase-suggestions')
  @RequirePermission('purchases', 'view')
  purchaseSuggestions(@CurrentUser() u: AuthenticatedRequestUser) { return this.analytics.purchaseSuggestions(u.tenantId); }

  @Get('analytics/churn-risk')
  @RequirePermission('customers', 'view')
  churnRisk(@CurrentUser() u: AuthenticatedRequestUser) { return this.analytics.churnRiskPrediction(u.tenantId); }

  // ---- COMUNICAÇÃO -------
  @Get('messages/templates')
  @RequirePermission('settings', 'view')
  templates(@CurrentUser() u: AuthenticatedRequestUser, @Query('channel') channel?: string) { return this.comm.listTemplates(u.tenantId, channel); }

  @Post('messages/templates')
  @RequirePermission('settings', 'create')
  createTemplate(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body() data: Record<string, unknown>) { return this.comm.createTemplate({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip }, data as never); }

  @Post('messages/email')
  @RequirePermission('settings', 'create')
  sendEmail(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('to') to: string, @Body('subject') subject: string, @Body('body') body: string) { return this.comm.sendEmail({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip }, to, subject, body); }

  @Post('messages/whatsapp')
  @RequirePermission('settings', 'create')
  sendWhatsApp(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('phone') phone: string, @Body('message') message: string) { return this.comm.sendWhatsApp({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip }, phone, message); }

  @Get('messages/history')
  @RequirePermission('settings', 'view')
  msgHistory(@CurrentUser() u: AuthenticatedRequestUser, @Query('channel') channel?: string) { return this.comm.getHistory(u.tenantId, channel); }

  // ---- SETUP WIZARD -------
  @Get('setup-wizard')
  @ApiOperation({ summary: 'Progresso do assistente de implantação' })
  wizardProgress(@CurrentUser() u: AuthenticatedRequestUser) { return this.wizard.getProgress(u.tenantId); }

  @Post('setup-wizard/step/:step/complete')
  completeStep(@CurrentUser() u: AuthenticatedRequestUser, @Param('step') step: string) { return this.wizard.completeStep(u.tenantId, step); }

  @Post('setup-wizard/auto-detect')
  autoDetect(@CurrentUser() u: AuthenticatedRequestUser) { return this.wizard.autoDetect(u.tenantId); }

  // ---- IMPORTAÇÃO -------
  @Post('import/job')
  @RequirePermission('settings', 'create')
  createImport(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('entity') entity: string, @Body('source') source: string, @Body('mapping') mapping?: Record<string, string>) { return this.importer.createJob({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip }, entity, source, mapping); }

  @Post('import/job/:id/process')
  @RequirePermission('settings', 'create')
  processImport(@Param('id') id: string, @Body('rows') rows: Record<string, unknown>[]) { return this.importer.processJob(id, rows); }

  @Get('import/mapping/:source/:entity')
  getMapping(@Param('source') source: string, @Param('entity') entity: string) { return this.importer.getFieldMapping(source, entity); }

  @Get('import/jobs')
  @RequirePermission('settings', 'view')
  listJobs(@CurrentUser() u: AuthenticatedRequestUser) { return this.importer.listJobs(u.tenantId); }

  // ---- SUPORTE -------
  @Post('support/tickets')
  createTicket(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('subject') subject: string, @Body('description') description: string, @Body('category') category?: string) { return this.support.createTicket({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip }, subject, description, category); }

  @Get('support/tickets')
  listTickets(@CurrentUser() u: AuthenticatedRequestUser) { return this.support.listTickets(u.tenantId, u.id); }

  @Get('support/tickets/:id')
  getTicket(@Param('id') id: string) { return this.support.getTicket(id); }

  @Post('support/tickets/:id/messages')
  addMessage(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('body') body: string) { return this.support.addMessage({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip }, id, body); }

  @Delete('support/tickets/:id')
  closeTicket(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) { return this.support.closeTicket(u.tenantId, id); }
}
