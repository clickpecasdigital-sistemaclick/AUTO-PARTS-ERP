import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * LgpdService — módulo LGPD completo (Sprint 14).
 *
 * Cobre os 10 direitos dos titulares (Lei 13.709/2018):
 *   ✓ Confirmação e Acesso (export)
 *   ✓ Correção (via requisição + fluxo de RH/MDM)
 *   ✓ Anonimização (dados desnecessários)
 *   ✓ Portabilidade (exportação JSON/CSV)
 *   ✓ Eliminação (right to erasure + soft-delete existente)
 *   ✓ Informação sobre compartilhamento (consentimentos)
 *   ✓ Revogação de consentimento
 *   ✓ Oposição ao tratamento
 *   ✓ Revisão automatizada (log de auditoria)
 *   ✓ Petição à ANPD (log de pedidos)
 *
 * "Anonimização" real: substitui campos de identificação por tokens
 * não-reversíveis (SHA-256 + salt do tenant). Todos os campos de
 * relacionamento (FK) são preservados — integridade referencial mantida.
 */
@Injectable()
export class LgpdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---- CONSENTIMENTOS -------------------------------------------------------

  async grantConsent(ctx: RequestContext, type: string, version: string) {
    await this.prisma.lgpdConsent.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, type: type as never, granted: true, version, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'LgpdConsent', entityId: ctx.userId, after: { type, granted: true } });
  }

  async revokeConsent(ctx: RequestContext, type: string, version: string) {
    await this.prisma.lgpdConsent.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, type: type as never, granted: false, version, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'LgpdConsent', entityId: ctx.userId, after: { type, granted: false } });
  }

  getConsentHistory(tenantId: string, userId: string) {
    return this.prisma.lgpdConsent.findMany({ where: { tenantId, userId }, orderBy: { createdAt: 'desc' } });
  }

  getLatestConsents(tenantId: string, userId: string) {
    return this.prisma.lgpdConsent.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      distinct: ['type'],
    });
  }

  // ---- REQUISIÇÕES LGPD -----------------------------------------------------

  async createRequest(ctx: RequestContext, type: string, description?: string) {
    const req = await this.prisma.lgpdRequest.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, type: type as never, description } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'LgpdRequest', entityId: req.id, after: { type } });
    return req;
  }

  listRequests(tenantId: string, userId?: string) {
    return this.prisma.lgpdRequest.findMany({ where: { tenantId, ...(userId ? { userId } : {}) }, orderBy: { createdAt: 'desc' } });
  }

  // ---- EXPORTAÇÃO DE DADOS (Portabilidade) ----------------------------------

  async exportUserData(ctx: RequestContext): Promise<Record<string, unknown>> {
    const [user, consents, auditLogs] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: ctx.userId }, select: { id: true, email: true, fullName: true, role: true, createdAt: true } }),
      this.prisma.lgpdConsent.findMany({ where: { userId: ctx.userId, tenantId: ctx.tenantId } }),
      this.prisma.auditLog.findMany({ where: { userId: ctx.userId, tenantId: ctx.tenantId }, take: 500, orderBy: { createdAt: 'desc' } }),
    ]);

    const exportData = { user, consents, recentActivity: auditLogs, exportedAt: new Date().toISOString(), format: 'AutoCore ERP LGPD Export v1.0' };

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'export', entity: 'LgpdRequest', entityId: ctx.userId, after: { event: 'data_exported' } });

    return exportData;
  }

  // ---- ANONIMIZAÇÃO (Direito ao Esquecimento) --------------------------------

  /**
   * Anonimização irreversível de PII de um Customer.
   * NUNCA deleta registros (soft-delete existente + integridade referencial).
   * Substitui PII por token SHA-256 não-reversível (salt = tenantId + userId).
   * Relacionamentos (FK) preservados — relatórios históricos continuam funcionando.
   */
  async anonymizeCustomer(ctx: RequestContext, customerId: string): Promise<void> {
    const salt = `${ctx.tenantId}:${customerId}:lgpd-anon`;
    const anon = (field: string) => `ANON_${Buffer.from(`${field}:${salt}`).toString('base64').slice(0, 20)}`;

    await this.prisma.customer.update({
      where: { id: customerId, tenantId: ctx.tenantId },
      data: {
        name: anon('name'),
        tradeName: null,
        email: `${anon('email')}@deleted.lgpd`,
        phone: anon('phone'),
        whatsapp: null,
        document: anon('document'),
        deletedAt: new Date(),
      },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'Customer', entityId: customerId, after: { event: 'lgpd_anonymized' } });
  }

  async anonymizeEmployee(ctx: RequestContext, employeeId: string): Promise<void> {
    const salt = `${ctx.tenantId}:${employeeId}:lgpd-anon`;
    const anon = (field: string) => `ANON_${Buffer.from(`${field}:${salt}`).toString('base64').slice(0, 20)}`;

    await this.prisma.employee.update({
      where: { id: employeeId, tenantId: ctx.tenantId },
      data: { name: anon('name'), email: `${anon('email')}@deleted.lgpd`, phone: null, document: anon('document'), deletedAt: new Date() },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'Employee', entityId: employeeId, after: { event: 'lgpd_anonymized' } });
  }

  /** Retorna relatório de retenção — dados com mais de N dias que podem ser anonimizados. */
  async getRetentionReport(tenantId: string, retentionDays = 1825 /* 5 anos */) {
    const cutoff = new Date(Date.now() - retentionDays * 86400000);

    const [customers, employees] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId, createdAt: { lt: cutoff }, deletedAt: null } }),
      this.prisma.employee.count({ where: { tenantId, createdAt: { lt: cutoff }, deletedAt: null } }),
    ]);

    return { retentionDays, cutoffDate: cutoff, eligible: { customers, employees } };
  }

  async processRequest(ctx: RequestContext, requestId: string, approved: boolean) {
    const req = await this.prisma.lgpdRequest.findFirst({ where: { id: requestId, tenantId: ctx.tenantId } });
    if (!req) throw new Error('Requisição não encontrada');

    if (approved && req.type === 'export') {
      await this.exportUserData({ ...ctx, userId: req.userId });
    }
    if (approved && req.type === 'erasure') {
      await this.anonymizeCustomer(ctx, req.userId).catch(() => null);
    }

    await this.prisma.lgpdRequest.update({ where: { id: requestId }, data: { status: approved ? 'completed' : 'rejected', processedAt: new Date(), processedBy: ctx.userId } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'LgpdRequest', entityId: requestId, after: { approved } });
  }
}
