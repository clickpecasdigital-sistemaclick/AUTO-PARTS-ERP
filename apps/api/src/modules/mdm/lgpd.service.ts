import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * LGPD (briefing: "Consentimentos, Base legal, Revogação, Anonimização,
 * Histórico, Exportação de dados, Exclusão lógica"). `anonymize()` é
 * destrutivo para os campos identificadores (nunca para o histórico
 * transacional — vendas/OS permanecem, só perdem o vínculo nominal),
 * por isso exige confirmação explícita no Controller (ação dedicada, não
 * acoplada a um DELETE comum).
 */
@Injectable()
export class LgpdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Consentimento ------------------------------------------------------------

  giveConsent(ctx: RequestContext, customerId: string, purpose: string, legalBasis: string) {
    return this.prisma.dataConsent.create({
      data: { tenantId: ctx.tenantId, customerId, purpose, legalBasis: legalBasis as never, ipAddress: ctx.ipAddress, createdBy: ctx.userId },
    });
  }

  async revokeConsent(ctx: RequestContext, consentId: string) {
    const consent = await this.prisma.dataConsent.findFirst({ where: { id: consentId, tenantId: ctx.tenantId } });
    if (!consent) throw new NotFoundException('Consentimento não encontrado');
    if (consent.status === 'revoked') throw new BadRequestException('Consentimento já revogado');

    const updated = await this.prisma.dataConsent.update({ where: { id: consentId }, data: { status: 'revoked', revokedAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'consent_change', entity: 'DataConsent', entityId: consentId, after: { status: 'revoked' } });
    return updated;
  }

  getConsentHistory(tenantId: string, customerId: string) {
    return this.prisma.dataConsent.findMany({ where: { tenantId, customerId }, orderBy: { givenAt: 'desc' } });
  }

  // --- Solicitações do titular ----------------------------------------------------

  createRequest(tenantId: string, customerId: string, type: string) {
    return this.prisma.dataSubjectRequest.create({ data: { tenantId, customerId, type: type as never } });
  }

  listRequests(tenantId: string, customerId?: string) {
    return this.prisma.dataSubjectRequest.findMany({ where: { tenantId, ...(customerId ? { customerId } : {}) }, orderBy: { requestedAt: 'desc' } });
  }

  /** Exportação de dados — junta tudo que o ERP guarda sobre o titular (briefing: portabilidade). */
  async exportCustomerData(ctx: RequestContext, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId: ctx.tenantId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const [addresses, contacts, vehicles, consents, interactions, sales] = await Promise.all([
      this.prisma.customerAddress.findMany({ where: { customerId } }),
      this.prisma.customerContact.findMany({ where: { customerId } }),
      this.prisma.customerVehicle.findMany({ where: { customerId } }),
      this.prisma.dataConsent.findMany({ where: { customerId } }),
      this.prisma.interaction.findMany({ where: { customerId } }),
      this.prisma.sale.findMany({ where: { customerId }, select: { id: true, code: true, totalAmount: true, createdAt: true } }),
    ]);

    const exportPayload = { customer, addresses, contacts, vehicles, consents, interactions, sales };

    await this.prisma.dataSubjectRequest.create({
      data: { tenantId: ctx.tenantId, customerId, type: 'export', status: 'completed', completedAt: new Date(), completedBy: ctx.userId },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'export', entity: 'Customer', entityId: customerId, after: { lgpdExport: true } });

    return exportPayload;
  }

  /**
   * Anonimização — substitui os campos identificadores por valores
   * irreversíveis ("ANONIMIZADO-<id curto>"), preserva o histórico
   * transacional (Sale/ServiceOrder continuam existindo, só sem nome
   * legível). Não é soft delete (esse já existe via `deletedAt`) — é uma
   * ação ADICIONAL e irreversível, por isso auditada com ação própria.
   */
  async anonymize(ctx: RequestContext, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId: ctx.tenantId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const anonymizedTag = `ANONIMIZADO-${customerId.slice(0, 8)}`;
    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id: customerId },
        data: {
          name: anonymizedTag,
          tradeName: null,
          document: anonymizedTag,
          email: null,
          phone: null,
          whatsapp: null,
          rg: null,
          notes: null,
          deletedAt: new Date(),
          status: 'inactive',
        },
      }),
      this.prisma.customerContact.deleteMany({ where: { customerId } }),
      this.prisma.customerAddress.deleteMany({ where: { customerId } }),
      this.prisma.dataSubjectRequest.create({
        data: { tenantId: ctx.tenantId, customerId, type: 'anonymization', status: 'completed', completedAt: new Date(), completedBy: ctx.userId },
      }),
    ]);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'anonymize', entity: 'Customer', entityId: customerId });
    return { status: 'anonymized' };
  }
}
