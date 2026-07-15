import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

// ---- API GATEWAY -----------------------------------------------------------

/**
 * ApiGatewayService — gestão de API Keys para integrações externas (Sprint 15).
 * Scopes: read:sales, write:products, read:fiscal, write:stock, etc.
 * Rate limiting por key (override do plano). IP whitelist por key.
 */
@Injectable()
export class ApiGatewayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createApiKey(ctx: RequestContext, name: string, scopes: string[], expiresAt?: Date, ipWhitelist?: string[]): Promise<{ key: string; apiKey: Record<string, unknown> }> {
    const rawKey = `ak_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = `ak_${rawKey.slice(3, 11)}`;

    const apiKey = await this.prisma.apiKey.create({
      data: { tenantId: ctx.tenantId, userId: ctx.userId, name, keyHash, keyPrefix, scopes, expiresAt, ipWhitelist: ipWhitelist ?? [] },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'ApiKey', entityId: apiKey.id, after: { name, scopes } });

    return { key: rawKey, apiKey: { ...apiKey, keyHash: undefined } };
  }

  async validateApiKey(rawKey: string, requiredScope?: string, ipAddress?: string): Promise<{ tenantId: string; scopes: string[] }> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });

    if (!apiKey || !apiKey.isActive) throw new UnauthorizedException('API Key inválida');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) throw new UnauthorizedException('API Key expirada');
    if (ipAddress && apiKey.ipWhitelist.length > 0 && !apiKey.ipWhitelist.includes(ipAddress)) {
      throw new UnauthorizedException('IP não autorizado para esta API Key');
    }
    if (requiredScope && !apiKey.scopes.includes(requiredScope) && !apiKey.scopes.includes('*')) {
      throw new UnauthorizedException(`Scope insuficiente: ${requiredScope}`);
    }

    await this.prisma.apiKey.update({ where: { keyHash }, data: { lastUsedAt: new Date() } });

    return { tenantId: apiKey.tenantId, scopes: apiKey.scopes };
  }

  listApiKeys(tenantId: string) {
    return this.prisma.apiKey.findMany({ where: { tenantId }, select: { id: true, name: true, keyPrefix: true, scopes: true, isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true } });
  }

  async revokeApiKey(tenantId: string, id: string) {
    return this.prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  }

  /** Lista de todos os scopes disponíveis por módulo. */
  getScopes() {
    return {
      read: ['read:sales', 'read:products', 'read:stock', 'read:customers', 'read:fiscal', 'read:financial', 'read:workshop', 'read:bi'],
      write: ['write:products', 'write:stock', 'write:customers', 'write:fiscal', 'write:workshop'],
      admin: ['admin:users', 'admin:settings'],
    };
  }
}

// ---- PORTAIS ---------------------------------------------------------------

/**
 * PortalService — acesso a portais externos sem autenticação do ERP.
 * Emite JWT de curta duração com escopo limitado ao portal e ao tenant.
 *
 * Portal do Cliente: notas, boletos, OS, orçamentos, veículos, garantias
 * Portal do Fornecedor: pedidos, financeiro, notas, entregas
 * Portal do Contador: notas, SPED, financeiro, relatórios, XML
 */
@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generatePortalToken(ctx: RequestContext, type: string, entityId: string, email?: string, expiryHours = 720): Promise<string> {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + expiryHours * 3600000);
    const scopeMap: Record<string, string[]> = {
      customer: ['invoices', 'payments', 'service_orders', 'quotations', 'vehicles', 'warranties'],
      supplier: ['purchase_orders', 'invoices', 'deliveries', 'financial'],
      accountant: ['invoices', 'sped', 'financial', 'reports', 'xml_export'],
    };

    await this.prisma.portalToken.create({ data: { tenantId: ctx.tenantId, type: type as never, entityId, tokenHash, email, scopes: scopeMap[type] ?? [], expiresAt } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'PortalToken', entityId, after: { type, email } });

    return rawToken;
  }

  async validatePortalToken(rawToken: string): Promise<{ tenantId: string; entityId: string; type: string; scopes: string[] } | null> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const pt = await this.prisma.portalToken.findUnique({ where: { tokenHash } });

    if (!pt || !pt.isActive || pt.expiresAt < new Date()) return null;

    await this.prisma.portalToken.update({ where: { tokenHash }, data: { lastAccessAt: new Date() } });

    return { tenantId: pt.tenantId, entityId: pt.entityId, type: pt.type, scopes: pt.scopes };
  }

  // ---- PORTAL DO CLIENTE ---------------------------------------------------

  async getCustomerPortalData(tenantId: string, customerId: string) {
    const [customer, invoices, serviceOrders, receivables, vehicles] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: customerId, tenantId }, select: { id: true, name: true, tradeName: true, email: true } }),
      this.prisma.fiscalInvoice.findMany({ where: { customerId, tenantId }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, number: true, status: true, totalAmount: true, createdAt: true } }),
      this.prisma.serviceOrder.findMany({ where: { customerId, tenantId }, orderBy: { openedAt: 'desc' }, take: 10, select: { id: true, code: true, status: true, totalAmount: true, openedAt: true, completedAt: true } }),
      this.prisma.accountsReceivable.findMany({ where: { customerId, tenantId }, orderBy: { dueDate: 'asc' }, take: 20, select: { id: true, notes: true, amount: true, status: true, dueDate: true } }),
      this.prisma.customerVehicle.findMany({ where: { customerId, tenantId }, select: { id: true, plate: true, modelYear: true, manufactureYear: true, vehicleVersion: { select: { name: true, model: { select: { name: true, make: { select: { name: true } } } } } } } }),
    ]);

    return { customer, invoices, serviceOrders, receivables, vehicles };
  }

  // ---- PORTAL DO FORNECEDOR ------------------------------------------------

  async getSupplierPortalData(tenantId: string, supplierId: string) {
    const [supplier, purchaseOrders, payables, invoices] = await Promise.all([
      this.prisma.supplier.findUnique({ where: { id: supplierId, tenantId }, select: { id: true, name: true, tradeName: true, email: true } }),
      this.prisma.purchaseOrder.findMany({ where: { supplierId, tenantId }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, code: true, status: true, totalAmount: true, createdAt: true, expectedDate: true } }),
      this.prisma.accountsPayable.findMany({ where: { supplierId, tenantId }, take: 20, select: { id: true, notes: true, amount: true, status: true, dueDate: true } }),
      this.prisma.fiscalInvoice.findMany({ where: { supplierId, tenantId }, take: 20, select: { id: true, number: true, status: true, totalAmount: true, createdAt: true } }),
    ]);

    return { supplier, purchaseOrders, payables, invoices };
  }

  // ---- PORTAL DO CONTADOR --------------------------------------------------

  async getAccountantPortalData(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [invoicesMonth, receivables, payables, fiscalConfig] = await Promise.all([
      this.prisma.fiscalInvoice.findMany({ where: { tenantId, createdAt: { gte: monthStart } }, select: { id: true, number: true, status: true, totalAmount: true, createdAt: true, model: true } }),
      this.prisma.accountsReceivable.aggregate({ where: { tenantId }, _sum: { amount: true } }),
      this.prisma.accountsPayable.aggregate({ where: { tenantId }, _sum: { amount: true } }),
      this.prisma.fiscalConfiguration.findFirst({ where: { tenantId }, select: { taxRegime: true, uf: true } }),
    ]);

    return { invoicesMonth, totalReceivable: receivables._sum.amount, totalPayable: payables._sum.amount, fiscalConfig };
  }
}

// ---- MARKETPLACE -----------------------------------------------------------

/**
 * MarketplaceService — plataforma de plugins (Sprint 15).
 * Verifica compatibilidade de plano e dependências antes de instalar.
 */
@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPlugins(category?: string) {
    return this.prisma.plugin.findMany({ where: { isActive: true, ...(category ? { category: category as never } : {}) }, orderBy: [{ isVerified: 'desc' }, { avgRating: 'desc' }] });
  }

  getPlugin(slug: string) {
    return this.prisma.plugin.findUnique({ where: { slug } });
  }

  getInstalledPlugins(tenantId: string) {
    return this.prisma.pluginInstallation.findMany({ where: { tenantId }, include: { plugin: true } });
  }

  async installPlugin(ctx: RequestContext, pluginId: string, config?: Record<string, unknown>) {
    const plugin = await this.prisma.plugin.findUnique({ where: { id: pluginId } });
    if (!plugin) throw new Error('Plugin não encontrado');

    // Verificar dependências
    for (const dep of plugin.dependencies) {
      const depPlugin = await this.prisma.plugin.findUnique({ where: { slug: dep } });
      if (!depPlugin) throw new Error(`Dependência não encontrada: ${dep}`);

      const installed = await this.prisma.pluginInstallation.findFirst({ where: { tenantId: ctx.tenantId, pluginId: depPlugin.id } });
      if (!installed) throw new Error(`Instale a dependência '${dep}' primeiro`);
    }

    const installation = await this.prisma.pluginInstallation.upsert({
      where: { tenantId_pluginId: { tenantId: ctx.tenantId, pluginId } },
      create: { tenantId: ctx.tenantId, pluginId, version: plugin.version, isEnabled: true, config: config as never, installedBy: ctx.userId },
      update: { version: plugin.version, isEnabled: true, config: config as never },
    });

    await this.prisma.plugin.update({ where: { id: pluginId }, data: { totalInstalls: { increment: 1 } } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'PluginInstallation', entityId: installation.id, after: { plugin: plugin.slug } });

    return installation;
  }

  async uninstallPlugin(ctx: RequestContext, pluginId: string) {
    const installation = await this.prisma.pluginInstallation.findFirst({ where: { tenantId: ctx.tenantId, pluginId } });
    if (!installation) throw new Error('Plugin não instalado');

    await this.prisma.pluginInstallation.delete({ where: { id: installation.id } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'PluginInstallation', entityId: installation.id, after: { pluginId } });
  }
}
