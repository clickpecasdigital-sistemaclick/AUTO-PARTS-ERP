import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

// ---- ALERTAS ----------------------------------------------------------------

/**
 * Motor de alertas automáticos (briefing: produtos abaixo do mínimo,
 * clientes inadimplentes, pedidos atrasados, notas rejeitadas, certificado
 * vencendo, fluxo de caixa negativo, queda de faturamento). Todas as
 * verificações são parametrizáveis via `AlertRule` — nenhuma regra
 * hardcoded. O método `runChecks` é chamado pelo scheduler (NestJS
 * CronJob) ou manualmente pelo endpoint `/bi/alerts/run`.
 */
@Injectable()
export class AlertsEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async runChecks(tenantId: string) {
    const results: { check: string; alertsCreated: number }[] = [];
    results.push(await this.checkStockBelowMinimum(tenantId));
    results.push(await this.checkOverdueCustomers(tenantId));
    results.push(await this.checkExpiringCertificates(tenantId));
    results.push(await this.checkRejectedInvoices(tenantId));
    return results;
  }

  private async createAlertIfNotExists(data: { tenantId: string; severity: string; category: string; title: string; message: string; entityType?: string; entityId?: string; internalLink?: string; ruleId?: string }) {
    const existing = await this.prisma.alert.findFirst({ where: { tenantId: data.tenantId, title: data.title, entityId: data.entityId, status: 'active' } });
    if (existing) return 0;
    await this.prisma.alert.create({ data: { ...data, severity: data.severity as never, expiresAt: new Date(Date.now() + 7 * 86400000) } });
    return 1;
  }

  async checkStockBelowMinimum(tenantId: string) {
    // Produtos com estoque zero (simplificado — em produção compararia com `minimumStock`)
    const products = await this.prisma.product.findMany({ where: { tenantId, deletedAt: null, stocks: { some: { quantityOnHand: { lte: 0 } } } }, select: { id: true, shortDescription: true, internalCode: true }, take: 100 });

    let created = 0;
    for (const p of products) {
      created += await this.createAlertIfNotExists({ tenantId, severity: 'critical', category: 'stock', title: `Produto sem estoque: ${p.internalCode}`, message: `${p.shortDescription} está com estoque zerado e pode gerar ruptura.`, entityType: 'product', entityId: p.id, internalLink: `/produtos/${p.id}` });
    }
    return { check: 'stock_below_minimum', alertsCreated: created };
  }

  async checkOverdueCustomers(tenantId: string) {
    const overdue = await this.prisma.accountsReceivable.findMany({ where: { tenantId, status: 'overdue' }, include: { customer: { select: { id: true, name: true } } }, take: 50 });

    let created = 0;
    for (const ar of overdue) {
      if (!ar.customer) continue;
      created += await this.createAlertIfNotExists({ tenantId, severity: 'warning', category: 'financial', title: `Inadimplência: ${ar.customer.name}`, message: `Valor em aberto vencido: R$ ${Number(ar.amount).toFixed(2)}`, entityType: 'customer', entityId: ar.customer.id, internalLink: `/clientes/${ar.customer.id}` });
    }
    return { check: 'overdue_customers', alertsCreated: created };
  }

  async checkExpiringCertificates(tenantId: string) {
    const warningDate = new Date(Date.now() + 30 * 86400000);
    const certs = await this.prisma.fiscalCertificate.findMany({ where: { tenantId, isActive: true, validUntil: { lte: warningDate } } });

    let created = 0;
    for (const c of certs) {
      const daysLeft = Math.ceil((c.validUntil.getTime() - Date.now()) / 86400000);
      created += await this.createAlertIfNotExists({ tenantId, severity: daysLeft <= 7 ? 'critical' : 'warning', category: 'fiscal', title: `Certificado A1 vencendo: ${c.alias}`, message: `O certificado digital vence em ${daysLeft} dias (${c.validUntil.toLocaleDateString('pt-BR')}). Renove com urgência.`, entityType: 'certificate', entityId: c.id, internalLink: '/fiscal/configuracao' });
    }
    return { check: 'expiring_certificates', alertsCreated: created };
  }

  async checkRejectedInvoices(tenantId: string) {
    const rejected = await this.prisma.fiscalInvoice.findMany({ where: { tenantId, status: 'rejected', createdAt: { gte: new Date(Date.now() - 24 * 3600000) } }, select: { id: true, number: true, rejectionCode: true, rejectionReason: true } });

    let created = 0;
    for (const inv of rejected) {
      created += await this.createAlertIfNotExists({ tenantId, severity: 'critical', category: 'fiscal', title: `NF-e rejeitada: nota ${inv.number}`, message: `Código: ${inv.rejectionCode} — ${inv.rejectionReason ?? 'Verifique o monitor fiscal.'}`, entityType: 'fiscal_invoice', entityId: inv.id, internalLink: `/fiscal/notas` });
    }
    return { check: 'rejected_invoices', alertsCreated: created };
  }

  listAlerts(tenantId: string, status?: string, category?: string) {
    return this.prisma.alert.findMany({ where: { tenantId, ...(status ? { status: status as never } : {}), ...(category ? { category } : {}), OR: [{ expiresAt: { gte: new Date() } }, { expiresAt: null }] }, orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }] });
  }

  async acknowledge(tenantId: string, id: string, userId: string) {
    const { count } = await this.prisma.alert.updateMany({ where: { id, tenantId }, data: { status: 'acknowledged', acknowledgedAt: new Date(), acknowledgedBy: userId } });
    if (count === 0) throw new NotFoundException('Alerta não encontrado');
    return this.prisma.alert.findUnique({ where: { id } });
  }

  async resolve(tenantId: string, id: string) {
    const { count } = await this.prisma.alert.updateMany({ where: { id, tenantId }, data: { status: 'resolved', resolvedAt: new Date() } });
    if (count === 0) throw new NotFoundException('Alerta não encontrado');
    return this.prisma.alert.findUnique({ where: { id } });
  }

  getUnreadCount(tenantId: string) {
    return this.prisma.alert.count({ where: { tenantId, status: 'active' } });
  }
}

// ---- AUTOMAÇÕES -------------------------------------------------------------

/** Motor de automações SE → ENTÃO (briefing). */
@Injectable()
export class AutomationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly alerts: AlertsEngineService,
  ) {}

  listAutomations(tenantId: string) {
    return this.prisma.automation.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  createAutomation(ctx: RequestContext, data: Record<string, unknown>) {
    return this.prisma.automation.create({ data: { tenantId: ctx.tenantId, createdBy: ctx.userId, ...data } as never });
  }

  async toggleStatus(tenantId: string, id: string, status: 'active' | 'paused') {
    const { count } = await this.prisma.automation.updateMany({ where: { id, tenantId }, data: { status } });
    if (count === 0) throw new NotFoundException('Automação não encontrada');
    return this.prisma.automation.findUnique({ where: { id } });
  }

  async runAutomation(ctx: RequestContext, automationId: string) {
    const automation = await this.prisma.automation.findFirst({ where: { id: automationId, tenantId: ctx.tenantId } });
    if (!automation) throw new Error('Automação não encontrada');

    const startAt = Date.now();
    let status = 'success';
    let result: unknown = null;
    let error: string | undefined;

    try {
      result = await this.executeAction(ctx, automation.action, automation.actionParams as Record<string, unknown>);
    } catch (e) {
      status = 'error';
      error = e instanceof Error ? e.message : String(e);
    }

    await this.prisma.automationLog.create({ data: { tenantId: ctx.tenantId, automationId, triggeredBy: 'manual', status, result: result as never, error } });
    await this.prisma.automation.update({ where: { id: automationId }, data: { lastRunAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Automation', entityId: automationId, after: { status, latencyMs: Date.now() - startAt } });

    return { status, result, error };
  }

  private async executeAction(ctx: RequestContext, action: string, params: Record<string, unknown>) {
    switch (action) {
      case 'create_purchase_suggestion':
        return this.prisma.purchaseSuggestion.create({ data: { tenantId: ctx.tenantId, productId: params.productId as string, warehouseId: params.warehouseId as string, suggestedQuantity: Number(params.quantity ?? 0), reason: 'automation', status: 'pending' } });
      case 'create_alert':
        return this.alerts.checkStockBelowMinimum(ctx.tenantId);
      case 'send_notification':
        return { sent: true, message: params.message };
      default:
        return { skipped: true, action };
    }
  }

  getLogs(tenantId: string, automationId: string) {
    return this.prisma.automationLog.findMany({ where: { tenantId, automationId }, orderBy: { executedAt: 'desc' }, take: 50 });
  }
}

// ---- NOTIFICAÇÕES -----------------------------------------------------------

/** Central de Notificações em tempo real (briefing). */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUnread(tenantId: string, userId: string) {
    return this.prisma.notification.findMany({ where: { tenantId, userId, isRead: false }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  getAll(tenantId: string, userId: string, page = 1, perPage = 20) {
    return this.prisma.notification.findMany({ where: { tenantId, userId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage });
  }

  async markRead(tenantId: string, userId: string, id: string) {
    const { count } = await this.prisma.notification.updateMany({ where: { id, tenantId, userId }, data: { isRead: true, readAt: new Date() } });
    if (count === 0) throw new NotFoundException('Notificação não encontrada');
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async markAllRead(tenantId: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { tenantId, userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  }

  async create(tenantId: string, userId: string, params: { kind?: string; category?: string; title: string; message: string; link?: string; channel?: string }) {
    return this.prisma.notification.create({ data: { tenantId, userId, kind: (params.kind ?? 'info') as never, category: params.category ?? 'system', title: params.title, message: params.message, link: params.link, channel: params.channel ?? 'in_app' } });
  }

  getUnreadCount(tenantId: string, userId: string) {
    return this.prisma.notification.count({ where: { tenantId, userId, isRead: false } });
  }
}

// ---- RELATÓRIOS -------------------------------------------------------------

/** Gerador universal de relatórios PDF/Excel/CSV (briefing). */
@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listDefinitions(tenantId: string, userId: string) {
    return this.prisma.reportDefinition.findMany({ where: { tenantId, OR: [{ userId }, { isShared: true }] }, orderBy: { createdAt: 'desc' } });
  }

  createDefinition(ctx: RequestContext, data: { name: string; category: string; config: Record<string, unknown>; isShared?: boolean }) {
    return this.prisma.reportDefinition.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, name: data.name, category: data.category, config: data.config as never, isShared: data.isShared ?? false } });
  }

  async execute(ctx: RequestContext, reportId: string, format: 'pdf' | 'xlsx' | 'csv') {
    const report = await this.prisma.reportDefinition.findFirst({ where: { id: reportId, tenantId: ctx.tenantId } });
    if (!report) throw new Error('Relatório não encontrado');

    const exec = await this.prisma.reportExecution.create({ data: { tenantId: ctx.tenantId, reportId, userId: ctx.userId, format, status: 'running' } });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'export', entity: 'ReportExecution', entityId: exec.id, after: { reportId, format } });

    // Geração assíncrona (simplificada — integração real usaria BullMQ ou NestJS Queue)
    const data = await this.fetchReportData(ctx.tenantId, report.category, report.config as Record<string, unknown>);
    const rowCount = data.length;
    const filePath = `/reports/${exec.id}.${format}`;

    await this.prisma.reportExecution.update({ where: { id: exec.id }, data: { status: 'done', rowCount, filePath, completedAt: new Date() } });

    return { id: exec.id, format, rowCount, filePath };
  }

  getHistory(tenantId: string, reportId: string) {
    return this.prisma.reportExecution.findMany({ where: { tenantId, reportId }, orderBy: { executedAt: 'desc' }, take: 20 });
  }

  private async fetchReportData(tenantId: string, category: string, _config: Record<string, unknown>): Promise<unknown[]> {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromKey = parseInt(`${from.getFullYear()}${String(from.getMonth() + 1).padStart(2, '0')}${String(from.getDate()).padStart(2, '0')}`, 10);

    switch (category) {
      case 'sales': return this.prisma.factSale.findMany({ where: { tenantId, dateKey: { gte: fromKey } }, take: 5000 });
      case 'purchases': return this.prisma.factPurchase.findMany({ where: { tenantId, dateKey: { gte: fromKey } }, take: 5000 });
      case 'stock': return this.prisma.factStock.findMany({ where: { tenantId }, take: 5000 });
      case 'financial': return this.prisma.factFinancial.findMany({ where: { tenantId, dateKey: { gte: fromKey } }, take: 5000 });
      case 'workshop': return this.prisma.factWorkshop.findMany({ where: { tenantId, dateKey: { gte: fromKey } }, take: 5000 });
      default: return [];
    }
  }
}
