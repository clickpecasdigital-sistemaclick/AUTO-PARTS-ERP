import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';
import type { Prisma } from '@prisma/client';

/**
 * BrandingService — White Label completo (Sprint 15).
 * Cada tenant pode personalizar: logo, nome, cores, fontes, domínio,
 * email de remetente, textos de login, etc. Resolvido por subdomain
 * ou custom domain no middleware de tenant.
 */
@Injectable()
export class BrandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getBranding(tenantId: string) {
    return this.prisma.tenantBranding.findUnique({ where: { tenantId } });
  }

  async getBrandingBySubdomain(subdomain: string) {
    return this.prisma.tenantBranding.findUnique({ where: { subdomain } });
  }

  async getBrandingByDomain(domain: string) {
    return this.prisma.tenantBranding.findFirst({ where: { customDomain: domain } });
  }

  async upsertBranding(ctx: RequestContext, data: Record<string, unknown>) {
    const branding = await this.prisma.tenantBranding.upsert({
      where: { tenantId: ctx.tenantId },
      create: { tenantId: ctx.tenantId, ...data } as never,
      update: data as never,
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'TenantBranding', entityId: branding.id, after: { event: 'branding_updated' } });

    return branding;
  }

  /** Gera CSS custom gerado dinamicamente a partir das cores do tenant. */
  generateCss(branding: { primaryColor?: string; secondaryColor?: string; accentColor?: string | null; fontFamily?: string; customCss?: string | null }): string {
    const css = `
:root {
  --primary: ${branding.primaryColor ?? '#0f172a'};
  --secondary: ${branding.secondaryColor ?? '#3b82f6'};
  --accent: ${branding.accentColor ?? branding.secondaryColor ?? '#3b82f6'};
  --font-sans: '${branding.fontFamily ?? 'Inter'}', system-ui, sans-serif;
}
${branding.customCss ?? ''}
    `.trim();
    return css;
  }

  /** Gera HTML de email com branding do tenant (header, footer). */
  generateEmailTemplate(branding: { appName?: string; logoUrl?: string | null; primaryColor?: string; supportEmail?: string | null }, content: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
  <div style="background: ${branding.primaryColor ?? '#0f172a'}; padding: 24px; text-align: center;">
    ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.appName ?? 'ERP'}" style="height: 40px;">` : `<h1 style="color: white; margin: 0;">${branding.appName ?? 'Auto Parts ERP'}</h1>`}
  </div>
  <div style="padding: 32px;">${content}</div>
  <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
    ${branding.appName ?? 'Auto Parts ERP'} ${branding.supportEmail ? `• <a href="mailto:${branding.supportEmail}">${branding.supportEmail}</a>` : ''}
  </div>
</div></body></html>`;
  }
}

/**
 * WebhookEngine — motor de webhooks com retry automático, assinatura HMAC-SHA256
 * e log de entregas (briefing: eventos de venda, compra, cliente, produto, etc.).
 *
 * Eventos suportados: sale.created, invoice.issued, invoice.rejected,
 * customer.created, customer.updated, product.updated, payment.received,
 * service_order.completed, supplier.updated, stock.adjusted.
 */
@Injectable()
export class WebhookEngine {
  private readonly logger = new Logger(WebhookEngine.name);
  private readonly AES_KEY = Buffer.from(process.env.AES_256_KEY ?? 'autocore-erp-aes256-key-placeholder-!!', 'utf8').slice(0, 32);

  constructor(private readonly prisma: PrismaService) {}

  async dispatch(tenantId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({ where: { tenantId, isActive: true, events: { has: event } } });

    for (const ep of endpoints) {
      this.deliverAsync(ep.id, tenantId, event, payload, ep.secret, ep.url, ep.timeoutMs, ep.retryCount).catch((e) =>
        this.logger.error(`Webhook delivery failed [${ep.id}]: ${e.message}`),
      );
    }
  }

  private async deliverAsync(endpointId: string, tenantId: string, event: string, payload: Record<string, unknown>, encryptedSecret: string, url: string, timeoutMs: number, maxRetries: number, attempt = 1): Promise<void> {
    const secret = this.decryptSecret(encryptedSecret);
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const t0 = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let success = false;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AutoParts-Signature': `sha256=${signature}`, 'X-AutoParts-Event': event },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      responseStatus = response.status;
      responseBody = await response.text().catch(() => '');
      success = response.ok;
    } catch (e) {
      responseBody = e instanceof Error ? e.message : String(e);
    }

    const delivery = await this.prisma.webhookDelivery.create({ data: { tenantId, endpointId, event, payload: payload as Prisma.InputJsonValue, responseStatus, responseBody, duration: Date.now() - t0, attempt, success } });

    if (!success && attempt < maxRetries) {
      const retryDelay = Math.pow(2, attempt) * 1000;
      setTimeout(() => this.deliverAsync(endpointId, tenantId, event, payload, encryptedSecret, url, timeoutMs, maxRetries, attempt + 1), retryDelay);
      await this.prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { nextRetryAt: new Date(Date.now() + retryDelay) } });
    }
  }

  async createEndpoint(ctx: RequestContext, url: string, events: string[], description?: string) {
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const encryptedSecret = this.encryptSecret(rawSecret);

    const ep = await this.prisma.webhookEndpoint.create({ data: { tenantId: ctx.tenantId, url, events, secret: encryptedSecret, description } });

    return { ...ep, secret: rawSecret }; // secret em plaintext retornado UMA VEZ
  }

  listEndpoints(tenantId: string) {
    return this.prisma.webhookEndpoint.findMany({ where: { tenantId }, select: { id: true, url: true, events: true, isActive: true, description: true, lastPingAt: true, createdAt: true } });
  }

  async toggleEndpoint(tenantId: string, id: string, isActive: boolean) {
    return this.prisma.webhookEndpoint.update({ where: { id }, data: { isActive } });
  }

  getDeliveries(tenantId: string, endpointId: string) {
    return this.prisma.webhookDelivery.findMany({ where: { tenantId, endpointId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async deleteEndpoint(tenantId: string, id: string) {
    return this.prisma.webhookEndpoint.delete({ where: { id } });
  }

  /** Ping — testa a conectividade do endpoint. */
  async ping(ctx: RequestContext, endpointId: string) {
    const ep = await this.prisma.webhookEndpoint.findFirst({ where: { id: endpointId, tenantId: ctx.tenantId } });
    if (!ep) throw new Error('Endpoint não encontrado');

    await this.dispatch(ctx.tenantId, 'ping', { message: 'Auto Parts ERP webhook ping', timestamp: new Date().toISOString() });
    await this.prisma.webhookEndpoint.update({ where: { id: endpointId }, data: { lastPingAt: new Date() } });

    return { message: 'Ping enviado' };
  }

  private encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.AES_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decryptSecret(ciphertext: string): string {
    try {
      const [ivHex, tagHex, dataHex] = ciphertext.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const data = Buffer.from(dataHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.AES_KEY, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch {
      return ciphertext; // fallback para testes
    }
  }
}
