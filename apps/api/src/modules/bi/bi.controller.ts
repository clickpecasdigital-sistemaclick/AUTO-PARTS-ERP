import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { EtlService } from './etl/etl.service';
import { KpiService } from './kpi/kpi.service';
import { AiAssistantService } from './ai/ai-assistant.service';
import { AlertsEngineService, AutomationsService, NotificationsService, ReportService } from './bi-engine.service';

function toCtx(u: AuthenticatedRequestUser, req: Request) {
  return { tenantId: u.tenantId, userId: u.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

function parseRange(from?: string, to?: string) {
  return { from: from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: to ? new Date(to) : new Date() };
}

@ApiTags('bi-kpi')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('bi')
export class BiController {
  constructor(
    private readonly etl: EtlService,
    private readonly kpi: KpiService,
    private readonly ai: AiAssistantService,
    private readonly alerts: AlertsEngineService,
    private readonly automations: AutomationsService,
    private readonly notifications: NotificationsService,
    private readonly reports: ReportService,
  ) {}

  // ---- ETL ------------------------------------------------------------------
  @Post('etl/run')
  @RequirePermission('bi', 'create')
  runEtl(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.etl.runAllForTenant(u.tenantId);
  }

  @Get('etl/status')
  @RequirePermission('bi', 'view')
  etlStatus(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.etl.getStatus(u.tenantId);
  }

  // ---- KPIs -----------------------------------------------------------------
  @Get('kpi/executive')
  @RequirePermission('bi', 'view')
  @ApiOperation({ summary: 'Resumo executivo: receita, margem, caixa, oficina, NPS' })
  executive(@CurrentUser() u: AuthenticatedRequestUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.kpi.getExecutiveSummary(u.tenantId, parseRange(from, to));
  }

  @Get('kpi/sales')
  @RequirePermission('bi', 'view')
  sales(@CurrentUser() u: AuthenticatedRequestUser, @Query('from') from?: string, @Query('to') to?: string, @Query('branchId') branchId?: string) {
    return this.kpi.getSalesKpis(u.tenantId, parseRange(from, to), branchId);
  }

  @Get('kpi/abc')
  @RequirePermission('bi', 'view')
  abc(@CurrentUser() u: AuthenticatedRequestUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.kpi.getAbcCurve(u.tenantId, parseRange(from, to));
  }

  @Get('kpi/stock')
  @RequirePermission('bi', 'view')
  stock(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.kpi.getStockKpis(u.tenantId);
  }

  @Get('kpi/financial')
  @RequirePermission('bi', 'view')
  financial(@CurrentUser() u: AuthenticatedRequestUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.kpi.getFinancialKpis(u.tenantId, parseRange(from, to));
  }

  @Get('kpi/workshop')
  @RequirePermission('bi', 'view')
  workshop(@CurrentUser() u: AuthenticatedRequestUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.kpi.getWorkshopKpis(u.tenantId, parseRange(from, to));
  }

  // ---- IA -------------------------------------------------------------------
  @Post('ai/query')
  @RequirePermission('bi', 'view')
  @ApiOperation({ summary: 'Consulta em linguagem natural ao Assistente IA do ERP' })
  aiQuery(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('question') question: string) {
    return this.ai.query(toCtx(u, req), question);
  }

  @Get('ai/history')
  @RequirePermission('bi', 'view')
  aiHistory(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.ai.getHistory(u.tenantId, u.id);
  }

  // ---- ALERTAS --------------------------------------------------------------
  @Get('alerts')
  @RequirePermission('bi', 'view')
  listAlerts(@CurrentUser() u: AuthenticatedRequestUser, @Query('status') status?: string, @Query('category') category?: string) {
    return this.alerts.listAlerts(u.tenantId, status, category);
  }

  @Get('alerts/count')
  @RequirePermission('bi', 'view')
  alertCount(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.alerts.getUnreadCount(u.tenantId);
  }

  @Post('alerts/run')
  @RequirePermission('bi', 'create')
  runAlerts(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.alerts.runChecks(u.tenantId);
  }

  @Post('alerts/:id/acknowledge')
  @RequirePermission('bi', 'update')
  acknowledge(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.alerts.acknowledge(u.tenantId, id, u.id);
  }

  @Post('alerts/:id/resolve')
  @RequirePermission('bi', 'update')
  resolve(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.alerts.resolve(u.tenantId, id);
  }

  // ---- AUTOMAÇÕES -----------------------------------------------------------
  @Get('automations')
  @RequirePermission('bi', 'view')
  listAutomations(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.automations.listAutomations(u.tenantId);
  }

  @Post('automations')
  @RequirePermission('bi', 'create')
  createAutomation(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body() data: Record<string, unknown>) {
    return this.automations.createAutomation(toCtx(u, req), data);
  }

  @Post('automations/:id/run')
  @RequirePermission('bi', 'create')
  runAutomation(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.automations.runAutomation(toCtx(u, req), id);
  }

  @Get('automations/:id/logs')
  @RequirePermission('bi', 'view')
  automationLogs(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.automations.getLogs(u.tenantId, id);
  }

  // ---- NOTIFICAÇÕES ---------------------------------------------------------
  @Get('notifications')
  @RequirePermission('bi', 'view')
  listNotifications(@CurrentUser() u: AuthenticatedRequestUser, @Query('page') page?: number) {
    return this.notifications.getAll(u.tenantId, u.id, page ? Number(page) : 1);
  }

  @Get('notifications/unread')
  @RequirePermission('bi', 'view')
  unreadNotifications(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.notifications.getUnread(u.tenantId, u.id);
  }

  @Get('notifications/count')
  @RequirePermission('bi', 'view')
  notifCount(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.notifications.getUnreadCount(u.tenantId, u.id);
  }

  @Post('notifications/:id/read')
  markRead(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.notifications.markRead(u.tenantId, u.id, id);
  }

  @Post('notifications/read-all')
  markAllRead(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.notifications.markAllRead(u.tenantId, u.id);
  }

  // ---- RELATÓRIOS -----------------------------------------------------------
  @Get('reports')
  @RequirePermission('bi', 'view')
  listReports(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.reports.listDefinitions(u.tenantId, u.id);
  }

  @Post('reports')
  @RequirePermission('bi', 'create')
  createReport(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body() data: Record<string, unknown>) {
    return this.reports.createDefinition(toCtx(u, req), data as never);
  }

  @Post('reports/:id/execute')
  @RequirePermission('bi', 'export')
  executeReport(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('format') format: 'pdf' | 'xlsx' | 'csv') {
    return this.reports.execute(toCtx(u, req), id, format ?? 'xlsx');
  }

  @Get('reports/:id/history')
  @RequirePermission('bi', 'view')
  reportHistory(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.reports.getHistory(u.tenantId, id);
  }
}
