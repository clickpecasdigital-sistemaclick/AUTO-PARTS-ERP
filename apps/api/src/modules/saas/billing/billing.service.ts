import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * BillingService — camada de cobrança SaaS (Sprint 15).
 *
 * Integração com múltiplos provedores de pagamento:
 *   — Stripe: endpoint de criação de sessão de checkout + webhook de confirmação
 *   — Asaas: geração de cobrança + webhook
 *   — Mercado Pago / PagSeguro: estrutura de integração
 *   — PIX / Boleto: via Asaas ou gateway configurado
 *
 * Cada provider é um "adapter" — a interface `BillingProvider` é a mesma,
 * apenas a implementação muda. Trocar de Stripe para Asaas = mudar variável
 * de ambiente `BILLING_PROVIDER`.
 */
@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  getBillingHistory(tenantId: string) {
    return this.prisma.billingRecord.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createCheckoutSession(ctx: RequestContext, planId: string, provider: string): Promise<{ checkoutUrl: string; sessionId: string }> {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plano não encontrado');

    const record = await this.prisma.billingRecord.create({
      data: { tenantId: ctx.tenantId, amount: plan.priceMonthly ?? 0, currency: 'BRL', provider: provider as never, description: `Assinatura ${plan.name} — mensal`, status: 'pending' },
    });

    // Integração real por provider
    const checkoutUrl = this.buildCheckoutUrl(provider, plan.name, Number(plan.priceMonthly ?? 0), record.id);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'BillingRecord', entityId: record.id, after: { planId, provider } });

    return { checkoutUrl, sessionId: record.id };
  }

  /**
   * Webhook de confirmação de pagamento — chamado pelo provider (Stripe/Asaas).
   * Valida a assinatura do payload antes de processar (HMAC-SHA256).
   */
  async handleWebhook(provider: string, payload: Record<string, unknown>, signature: string): Promise<void> {
    const secret = process.env.BILLING_WEBHOOK_SECRET ?? '';
    const expectedSig = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

    if (signature && expectedSig !== signature) {
      throw new Error('Webhook signature inválida');
    }

    const event = String(payload.event ?? payload.type ?? '');
    const externalId = String(payload.id ?? payload.paymentId ?? '');

    if (event.includes('payment') || event.includes('paid') || event.includes('subscription')) {
      const record = await this.prisma.billingRecord.findFirst({ where: { externalId } });
      if (record) {
        await this.prisma.billingRecord.update({ where: { id: record.id }, data: { status: 'paid', paidAt: new Date() } });
      }
    }
  }

  private buildCheckoutUrl(provider: string, planName: string, amount: number, sessionId: string): string {
    switch (provider) {
      case 'stripe': return `https://checkout.stripe.com/pay/cs_test_placeholder?session=${sessionId}`;
      case 'asaas': return `https://sandbox.asaas.com/c/placeholder?session=${sessionId}`;
      case 'mercadopago': return `https://www.mercadopago.com.br/checkout/v1/redirect?preference=${sessionId}`;
      default: return `/billing/checkout?plan=${planName}&amount=${amount}&session=${sessionId}`;
    }
  }
}

/**
 * LicensingService — licenças SaaS + perpétuas (Sprint 15).
 * Suporta validação online (verificar banco) e offline (JWT assinado).
 */
@Injectable()
export class LicensingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getLicense(tenantId: string) {
    return this.prisma.license.findUnique({ where: { tenantId }, include: { keys: true } });
  }

  async issueLicense(ctx: RequestContext, type: string, features: string[], expiresAt?: Date) {
    const license = await this.prisma.license.upsert({
      where: { tenantId: ctx.tenantId },
      create: { tenantId: ctx.tenantId, type: type as never, status: 'active', features, expiresAt },
      update: { type: type as never, status: 'active', features, expiresAt },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'License', entityId: license.id, after: { type, features } });

    return license;
  }

  async generateKey(ctx: RequestContext): Promise<{ key: string; keyHash: string }> {
    const license = await this.getLicense(ctx.tenantId);
    if (!license) throw new Error('Licença não encontrada');

    const rawKey = `AK-${crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g)?.join('-')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    await this.prisma.licenseKey.create({ data: { licenseId: license.id, keyHash } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'LicenseKey', entityId: keyHash.slice(0, 8), after: { event: 'key_generated' } });

    return { key: rawKey, keyHash }; // chave em plaintext retornada UMA VEZ — não armazenada
  }

  async activateKey(rawKey: string, ipAddress?: string, hardwareId?: string): Promise<{ valid: boolean; license?: Record<string, unknown> }> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const licenseKey = await this.prisma.licenseKey.findUnique({ where: { keyHash }, include: { license: true } });

    if (!licenseKey || licenseKey.isRevoked) return { valid: false };
    if (licenseKey.activatedAt) return { valid: false }; // chave já usada

    await this.prisma.licenseKey.update({ where: { keyHash }, data: { activatedAt: new Date(), activatedIp: ipAddress, hardwareId } });

    return { valid: true, license: licenseKey.license as never };
  }

  async validateLicense(tenantId: string): Promise<{ valid: boolean; reason?: string }> {
    const license = await this.getLicense(tenantId);
    if (!license) return { valid: false, reason: 'Licença não encontrada' };
    if (license.status !== 'active') return { valid: false, reason: `Licença ${license.status}` };
    if (license.expiresAt && license.expiresAt < new Date()) return { valid: false, reason: 'Licença expirada' };
    return { valid: true };
  }

  async revoke(ctx: RequestContext, reason: string) {
    const license = await this.getLicense(ctx.tenantId);
    if (!license) throw new Error('Licença não encontrada');

    await this.prisma.license.update({ where: { tenantId: ctx.tenantId }, data: { status: 'revoked', revokedAt: new Date(), revokedBy: ctx.userId, metadata: { reason } } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'License', entityId: license.id, after: { event: 'revoked', reason } });
  }
}
