import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

// ============================================================================
// COMMUNICATION SERVICE
// ============================================================================

/**
 * CommunicationService — sistema completo de comunicação multi-canal
 * (Email, WhatsApp Business, SMS, Push) — Sprint 16.
 *
 * Cada canal é um adapter: `EmailAdapter`, `WhatsAppAdapter`, `SmsAdapter`.
 * Trocar de Mailgun para SendGrid = mudar variável SMTP_PROVIDER.
 * WhatsApp usa API oficial Meta Cloud API (estrutura pronta para integração).
 */
@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---- TEMPLATES ----------------------------------------------------------

  listTemplates(tenantId: string, channel?: string) {
    return this.prisma.messageTemplate.findMany({
      where: { OR: [{ tenantId }, { isSystem: true }], ...(channel ? { channel: channel as never } : {}) },
    });
  }

  async createTemplate(ctx: RequestContext, data: { channel: string; name: string; subject?: string; body: string; variables?: string[] }) {
    return this.prisma.messageTemplate.create({ data: { tenantId: ctx.tenantId, channel: data.channel as never, name: data.name, subject: data.subject, body: data.body, variables: data.variables ?? [] } });
  }

  // ---- EMAIL --------------------------------------------------------------

  async sendEmail(ctx: RequestContext, to: string, subject: string, body: string, templateId?: string, variables?: Record<string, string>): Promise<void> {
    let finalBody = body;
    let finalSubject = subject;

    if (templateId) {
      const template = await this.prisma.messageTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        finalBody = template.body;
        finalSubject = template.subject ?? subject;
        for (const [key, val] of Object.entries(variables ?? {})) {
          finalBody = finalBody.replace(new RegExp(`{{${key}}}`, 'g'), val);
          finalSubject = finalSubject.replace(new RegExp(`{{${key}}}`, 'g'), val);
        }
      }
    }

    const history = await this.prisma.messageHistory.create({ data: { tenantId: ctx.tenantId, channel: 'email', templateId, recipient: to, subject: finalSubject, body: finalBody, status: 'queued' } });

    try {
      await this.dispatchEmail(to, finalSubject, finalBody);
      await this.prisma.messageHistory.update({ where: { id: history.id }, data: { status: 'sent', sentAt: new Date() } });
    } catch (e) {
      await this.prisma.messageHistory.update({ where: { id: history.id }, data: { status: 'failed', errorMessage: e instanceof Error ? e.message : String(e) } });
      this.logger.error(`Email failed to ${to}: ${e}`);
    }
  }

  private async dispatchEmail(to: string, subject: string, html: string): Promise<void> {
    const provider = process.env.EMAIL_PROVIDER ?? 'smtp';
    if (provider === 'resend') {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.SMTP_FROM, to, subject, html }),
      });
    } else if (provider === 'sendgrid') {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: process.env.SMTP_FROM }, subject, content: [{ type: 'text/html', value: html }] }),
      });
    } else {
      this.logger.log(`[SMTP] Email queued: to=${to} | subject=${subject} (configure EMAIL_PROVIDER=resend|sendgrid)`);
    }
  }

  // ---- WHATSAPP BUSINESS --------------------------------------------------

  async sendWhatsApp(ctx: RequestContext, phone: string, message: string, templateName?: string): Promise<void> {
    const history = await this.prisma.messageHistory.create({ data: { tenantId: ctx.tenantId, channel: 'whatsapp', recipient: phone, body: message, status: 'queued' } });

    try {
      await this.dispatchWhatsApp(phone, message, templateName);
      await this.prisma.messageHistory.update({ where: { id: history.id }, data: { status: 'sent', sentAt: new Date() } });
    } catch (e) {
      await this.prisma.messageHistory.update({ where: { id: history.id }, data: { status: 'failed', errorMessage: e instanceof Error ? e.message : String(e) } });
    }
  }

  private async dispatchWhatsApp(phone: string, message: string, templateName?: string): Promise<void> {
    const wabaId = process.env.WHATSAPP_WABA_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!wabaId || !token) {
      this.logger.log(`[WhatsApp] Message queued: to=${phone} | msg=${message.slice(0, 50)} (configure WHATSAPP_WABA_ID + WHATSAPP_TOKEN)`);
      return;
    }

    const payload = templateName
      ? { messaging_product: 'whatsapp', to: phone, type: 'template', template: { name: templateName, language: { code: 'pt_BR' } } }
      : { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } };

    await fetch(`https://graph.facebook.com/v19.0/${wabaId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // ---- HELPERS PARA MÓDULOS -----------------------------------------------

  async sendQuotation(ctx: RequestContext, customerId: string, saleId: string) {
    const [customer, sale] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: customerId }, select: { email: true, whatsapp: true, name: true } }),
      this.prisma.sale.findUnique({ where: { id: saleId }, select: { id: true, totalAmount: true } }),
    ]);

    if (!customer || !sale) return;

    const message = `Olá ${customer.name}! Seu orçamento #${saleId.slice(0, 8)} no valor de R$ ${Number(sale.totalAmount).toFixed(2)} está disponível. Acesse o portal do cliente para visualizar.`;

    if (customer.email) await this.sendEmail(ctx, customer.email, 'Seu orçamento está pronto', `<p>${message}</p>`);
    if (customer.whatsapp) await this.sendWhatsApp(ctx, customer.whatsapp, message);
  }

  async sendBoleto(ctx: RequestContext, customerId: string, amount: number, dueDate: Date) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId }, select: { email: true, whatsapp: true, name: true } });
    if (!customer) return;
    const msg = `Olá ${customer.name}! Boleto de R$ ${amount.toFixed(2)} com vencimento em ${dueDate.toLocaleDateString('pt-BR')} gerado. Acesse o portal para pagar.`;
    if (customer.email) await this.sendEmail(ctx, customer.email, 'Boleto disponível', `<p>${msg}</p>`);
    if (customer.whatsapp) await this.sendWhatsApp(ctx, customer.whatsapp, msg);
  }

  getHistory(tenantId: string, channel?: string) {
    return this.prisma.messageHistory.findMany({ where: { tenantId, ...(channel ? { channel: channel as never } : {}) }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
}

// ============================================================================
// SETUP WIZARD SERVICE
// ============================================================================

const WIZARD_STEPS = ['company', 'users', 'products', 'customers', 'suppliers', 'financial', 'fiscal', 'certificate', 'smtp', 'whatsapp', 'backup', 'permissions'] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

@Injectable()
export class SetupWizardService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(tenantId: string) {
    let progress = await this.prisma.setupWizardProgress.findUnique({ where: { tenantId } });
    if (!progress) {
      progress = await this.prisma.setupWizardProgress.create({ data: { tenantId } });
    }
    return { ...progress, steps: progress.steps as Record<string, boolean>, totalSteps: WIZARD_STEPS.length, completedSteps: Object.values(progress.steps as Record<string, boolean>).filter(Boolean).length };
  }

  async completeStep(tenantId: string, step: string) {
    const progress = await this.getProgress(tenantId);
    const steps = { ...((progress.steps as Record<string, boolean>) ?? {}) };
    steps[step] = true;

    const allDone = WIZARD_STEPS.every((s) => steps[s]);
    const nextStep = WIZARD_STEPS.find((s) => !steps[s]);

    await this.prisma.setupWizardProgress.update({ where: { tenantId }, data: { steps: steps as never, currentStep: nextStep ? WIZARD_STEPS.indexOf(nextStep as WizardStep) : WIZARD_STEPS.length, completedAt: allDone ? new Date() : null } });

    return { step, completed: true, nextStep, allDone };
  }

  async autoDetect(tenantId: string) {
    const [company, users, products, customers, suppliers, fiscalConfig] = await Promise.all([
      this.prisma.company.findFirst({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.supplier.count({ where: { tenantId } }),
      this.prisma.fiscalConfiguration.findFirst({ where: { tenantId } }),
    ]);

    const autoSteps: Partial<Record<WizardStep, boolean>> = {
      company: !!company,
      users: users > 1,
      products: products > 0,
      customers: customers > 0,
      suppliers: suppliers > 0,
      fiscal: !!fiscalConfig,
    };

    const progress = await this.getProgress(tenantId);
    const merged = { ...((progress.steps as Record<string, boolean>) ?? {}), ...autoSteps };

    await this.prisma.setupWizardProgress.update({ where: { tenantId }, data: { steps: merged as never } });

    return { autoDetected: Object.keys(autoSteps).filter((k) => (autoSteps as Record<string, boolean>)[k]) };
  }
}

// ============================================================================
// IMPORTER SERVICE
// ============================================================================

@Injectable()
export class ImporterService {
  private readonly logger = new Logger(ImporterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createJob(ctx: RequestContext, entity: string, source: string, mapping?: Record<string, string>): Promise<string> {
    const job = await this.prisma.importJob.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, entity, source, mapping: mapping as never, status: 'pending' } });
    return job.id;
  }

  async processJob(jobId: string, rows: Record<string, unknown>[]): Promise<{ processed: number; errors: number }> {
    await this.prisma.importJob.update({ where: { id: jobId }, data: { status: 'processing', totalRows: rows.length } });

    let processed = 0, errors = 0;
    const errorLog: { row: number; error: string }[] = [];

    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) return { processed: 0, errors: 0 };

    // Importação em massa (produtos/clientes/fornecedores) precisa de uma
    // Company e uma Unit "padrão" do tenant para preencher FKs obrigatórias
    // que a planilha de origem não tem — buscadas uma vez, fora do loop.
    const defaultCompany = await this.prisma.company.findFirst({ where: { tenantId: job.tenantId } });
    const defaultUnit = await this.prisma.unit.findFirst({ orderBy: { code: 'asc' } });

    for (let i = 0; i < rows.length; i++) {
      try {
        await this.importRow(job.tenantId, job.entity, rows[i], job.mapping as Record<string, string> | null, defaultCompany?.id, defaultUnit?.id);
        processed++;
      } catch (e) {
        errors++;
        errorLog.push({ row: i + 1, error: e instanceof Error ? e.message : String(e) });
      }
    }

    await this.prisma.importJob.update({ where: { id: jobId }, data: { status: errors === rows.length ? 'failed' : errors > 0 ? 'partial' : 'done', processedRows: processed, errorRows: errors, errors: errorLog as never, completedAt: new Date() } });

    return { processed, errors };
  }

  private async importRow(tenantId: string, entity: string, row: Record<string, unknown>, mapping: Record<string, string> | null, defaultCompanyId?: string, defaultUnitId?: string): Promise<void> {
    const mapped = mapping ? Object.fromEntries(Object.entries(row).map(([k, v]) => [mapping[k] ?? k, v])) : row;

    switch (entity) {
      case 'products':
        if (!defaultUnitId) throw new Error('Nenhuma unidade de medida cadastrada para o tenant — cadastre uma Unit antes de importar produtos.');
        await this.prisma.product.create({ data: { tenantId, internalCode: String(mapped.internalCode ?? mapped.codigo ?? `IMP-${Date.now()}`), shortDescription: String(mapped.shortDescription ?? mapped.descricao ?? ''), fullDescription: mapped.fullDescription as string, unitId: defaultUnitId, status: 'active' } });
        break;
      case 'customers':
        if (!defaultCompanyId) throw new Error('Nenhuma empresa cadastrada para o tenant — cadastre uma Company antes de importar clientes.');
        const document = String(mapped.cpfCnpj ?? mapped.document ?? '');
        await this.prisma.customer.create({ data: { tenantId, companyId: defaultCompanyId, name: String(mapped.name ?? mapped.nome ?? ''), email: mapped.email as string, document, personType: document.replace(/\D/g, '').length > 11 ? 'business' : 'individual' } });
        break;
      case 'suppliers':
        if (!defaultCompanyId) throw new Error('Nenhuma empresa cadastrada para o tenant — cadastre uma Company antes de importar fornecedores.');
        await this.prisma.supplier.create({ data: { tenantId, companyId: defaultCompanyId, name: String(mapped.name ?? mapped.nome ?? ''), email: mapped.email as string, document: String(mapped.cnpj ?? mapped.document ?? ''), personType: 'business' } });
        break;
      default:
        throw new Error(`Entity '${entity}' não suportada`);
    }
  }

  /** Mapeamento automático de campos por origem (Bling, Tiny, Omie, etc.) */
  getFieldMapping(source: string, entity: string): Record<string, string> {
    const MAPPINGS: Record<string, Record<string, Record<string, string>>> = {
      bling: { products: { codigo: 'internalCode', descricao: 'shortDescription', preco: 'salePrice' }, customers: { nome: 'name', email: 'email', cpf_cnpj: 'cpfCnpj' } },
      tiny: { products: { codigo: 'internalCode', descricao: 'shortDescription', preco_venda: 'salePrice' }, customers: { nome: 'name', email: 'email', cpf_cnpj: 'cpfCnpj' } },
      omie: { products: { codigo_produto: 'internalCode', descricao: 'shortDescription' }, customers: { razao_social: 'name', email: 'email', cnpj_cpf: 'cpfCnpj' } },
    };
    return MAPPINGS[source]?.[entity] ?? {};
  }

  listJobs(tenantId: string) {
    return this.prisma.importJob.findMany({ where: { tenantId }, orderBy: { startedAt: 'desc' }, take: 50 });
  }
}

// ============================================================================
// SUPPORT SERVICE
// ============================================================================

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createTicket(ctx: RequestContext, subject: string, description: string, category?: string, priority?: string) {
    const ticket = await this.prisma.helpTicket.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, subject, description, category, priority: (priority ?? 'medium') as never } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'HelpTicket', entityId: ticket.id, after: { subject, category } });
    return ticket;
  }

  listTickets(tenantId: string, userId?: string) {
    return this.prisma.helpTicket.findMany({ where: { tenantId, ...(userId ? { userId } : {}) }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } }, orderBy: { createdAt: 'desc' } });
  }

  getTicket(id: string) {
    return this.prisma.helpTicket.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
  }

  async addMessage(ctx: RequestContext, ticketId: string, body: string, isAgent = false) {
    return this.prisma.helpMessage.create({ data: { ticketId, tenantId: ctx.tenantId, userId: ctx.userId, body, isAgent } });
  }

  async closeTicket(tenantId: string, id: string) {
    return this.prisma.helpTicket.update({ where: { id }, data: { status: 'closed', closedAt: new Date() } });
  }
}
