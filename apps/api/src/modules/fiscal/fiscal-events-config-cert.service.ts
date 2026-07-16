import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import { NfeXmlBuilderService } from './xml/nfe-xml-builder.service';
import { FiscalSignatureService } from './fiscal-signature.service';
import { SupabaseStorageService } from '@/common/storage/supabase-storage.service';
import type { RequestContext } from '@/common/types/request-context';

/** Eventos fiscais: Cancelamento, CC-e, Inutilização (briefing). */
@Injectable()
export class FiscalEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xmlBuilder: NfeXmlBuilderService,
    private readonly audit: AuditService,
  ) {}

  private async getInvoiceOrThrow(tenantId: string, id: string) {
    const invoice = await this.prisma.fiscalInvoice.findFirst({ where: { id, tenantId }, include: { fiscalSeries: true } });
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');
    return invoice;
  }

  /** Cancelamento — exige nota autorizada e justificativa >= 15 chars (requisito SEFAZ). */
  async cancel(ctx: RequestContext, invoiceId: string, justification: string) {
    if (justification.length < 15) throw new BadRequestException('A justificativa de cancelamento deve ter pelo menos 15 caracteres (requisito SEFAZ)');

    const invoice = await this.getInvoiceOrThrow(ctx.tenantId, invoiceId);
    if (invoice.status !== 'authorized') throw new BadRequestException('Apenas NF-e autorizada pode ser cancelada');

    const config = await this.prisma.fiscalConfiguration.findFirst({ where: { tenantId: ctx.tenantId, branchId: invoice.branchId } });

    const eventXml = this.xmlBuilder.buildCancellationXml({
      accessKey: invoice.accessKey!,
      protocol: invoice.protocolNumber ?? '',
      justification,
      environment: config?.environment ?? 'homologation',
    });

    const event = await this.prisma.fiscalInvoiceEvent.create({
      data: { tenantId: ctx.tenantId, fiscalInvoiceId: invoiceId, type: 'cancellation', sequence: 1, reason: justification },
    });

    await this.prisma.fiscalInvoice.update({ where: { id: invoiceId }, data: { status: 'cancelled' } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'nf_cancel', entity: 'FiscalInvoice', entityId: invoiceId, after: { justification } });
    return { event, eventXml };
  }

  /** Carta de Correcao (CC-e) — maximo de 20 por nota, sequencia incremental. */
  async issueCorrectionLetter(ctx: RequestContext, invoiceId: string, correction: string) {
    if (correction.length < 15) throw new BadRequestException('A correcao deve ter pelo menos 15 caracteres (requisito SEFAZ)');

    const invoice = await this.getInvoiceOrThrow(ctx.tenantId, invoiceId);
    if (invoice.status !== 'authorized') throw new BadRequestException('Apenas NF-e autorizada pode receber Carta de Correcao');

    const lastEvent = await this.prisma.fiscalInvoiceEvent.findFirst({ where: { fiscalInvoiceId: invoiceId, type: 'correction_letter' }, orderBy: { sequence: 'desc' } });
    const sequence = (lastEvent?.sequence ?? 0) + 1;
    if (sequence > 20) throw new BadRequestException('Limite de 20 Cartas de Correcao por NF-e atingido (limite SEFAZ)');

    const config = await this.prisma.fiscalConfiguration.findFirst({ where: { tenantId: ctx.tenantId, branchId: invoice.branchId } });

    const eventXml = this.xmlBuilder.buildCorrectionLetterXml({ accessKey: invoice.accessKey!, correction, sequence, environment: config?.environment ?? 'homologation' });

    const event = await this.prisma.fiscalInvoiceEvent.create({
      data: { tenantId: ctx.tenantId, fiscalInvoiceId: invoiceId, type: 'correction_letter', sequence, reason: correction },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'FiscalInvoice', entityId: invoiceId, after: { event: 'cc-e', sequence } });
    return { event, eventXml };
  }

  /** Inutilizacao de intervalo de numeracao (briefing). */
  async voidRange(ctx: RequestContext, branchId: string, params: { model: string; serie: number; numberFrom: number; numberTo: number; year: number; justification: string; branchCnpj: string }) {
    const config = await this.prisma.fiscalConfiguration.findFirst({ where: { tenantId: ctx.tenantId, branchId } });

    const range = await this.prisma.fiscalVoidingRange.create({
      data: { tenantId: ctx.tenantId, branchId, model: params.model as never, series: params.serie, numberFrom: params.numberFrom, numberTo: params.numberTo, year: params.year, reason: params.justification, createdBy: ctx.userId },
    });

    const xmlContent = this.xmlBuilder.buildVoidingXml({ ...params, environment: config?.environment ?? 'homologation' });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'FiscalVoidingRange', entityId: range.id, after: params });
    return { range, xmlContent };
  }

  listEvents(tenantId: string, invoiceId: string) {
    return this.prisma.fiscalInvoiceEvent.findMany({ where: { tenantId, fiscalInvoiceId: invoiceId }, orderBy: { createdAt: 'asc' } });
  }
}

/** Configuracao fiscal por filial (briefing: painel completo). */
@Injectable()
export class FiscalConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  getConfig(tenantId: string, branchId: string) {
    return this.prisma.fiscalConfiguration.findFirst({ where: { tenantId, branchId }, include: { certificate: true } });
  }

  async upsertConfig(ctx: RequestContext, branchId: string, data: Record<string, unknown>) {
    const config = await this.prisma.fiscalConfiguration.upsert({
      where: { branchId },
      create: { tenantId: ctx.tenantId, branchId, uf: 'RS', ...data } as never,
      update: data as never,
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'FiscalConfiguration', entityId: config.id, after: data });
    return config;
  }

  listSeries(tenantId: string, branchId: string) {
    return this.prisma.fiscalSeries.findMany({ where: { tenantId, branchId } });
  }

  createSeries(tenantId: string, branchId: string, model: string, series: number) {
    return this.prisma.fiscalSeries.create({ data: { tenantId, branchId, model: model as never, series } });
  }

  listVoidingRanges(tenantId: string) {
    return this.prisma.fiscalVoidingRange.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  listNcm(search: string) {
    return this.prisma.ncm.findMany({ where: { OR: [{ code: { contains: search } }, { description: { contains: search, mode: 'insensitive' } }] }, take: 20 });
  }

  listCfop(type?: string) {
    return this.prisma.cfop.findMany({ where: type ? { type: type as never } : {}, orderBy: { code: 'asc' }, take: 100 });
  }
}

/** Certificado Digital A1 (briefing). */
@Injectable()
export class FiscalCertificateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly signature: FiscalSignatureService,
    private readonly storage: SupabaseStorageService,
  ) {}

  listCertificates(tenantId: string, companyId?: string) {
    return this.prisma.fiscalCertificate.findMany({ where: { tenantId, ...(companyId ? { companyId } : {}) }, orderBy: { createdAt: 'desc' } });
  }

  /**
   * Upload de certificado A1 (.pfx). Diferente da versão anterior — que
   * confiava cegamente em metadados enviados pelo cliente e nunca recebia
   * a senha —, aqui o backend abre o arquivo de verdade para confirmar
   * que a senha está certa e extrair os dados reais (validade, titular,
   * número de série), e guarda a senha criptografada (nunca em texto
   * puro), porque sem ela o servidor jamais conseguiria assinar nada.
   */
  async uploadCertificate(
    ctx: RequestContext,
    companyId: string,
    params: { alias: string; password: string; fileBuffer: Buffer; originalName: string; renewedFromId?: string },
  ) {
    const inspected = this.signature.inspectCertificate(params.fileBuffer, params.password);
    if (inspected.validUntil < new Date()) {
      throw new BadRequestException(`Este certificado venceu em ${inspected.validUntil.toLocaleDateString('pt-BR')} — envie um certificado válido.`);
    }

    const storageRef = `${ctx.tenantId}/${companyId}/${Date.now()}-${params.originalName}`;
    await this.storage.upload('fiscal-certificates', storageRef, params.fileBuffer, 'application/x-pkcs12');
    const encryptedPassword = this.signature.encryptPassword(params.password);

    if (params.renewedFromId) {
      await this.prisma.fiscalCertificate.update({ where: { id: params.renewedFromId }, data: { isActive: false } });
    }

    const cert = await this.prisma.fiscalCertificate.create({
      data: {
        tenantId: ctx.tenantId,
        companyId,
        isActive: true,
        validFrom: inspected.validFrom,
        validUntil: inspected.validUntil,
        alias: params.alias,
        storageRef,
        serialNumber: inspected.serialNumber,
        subjectCN: inspected.subjectCN,
        encryptedPassword,
        renewedFromId: params.renewedFromId,
      },
    });

    // Nunca logar a senha (nem criptografada) — só os metadados não-sensíveis.
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'document_upload', entity: 'FiscalCertificate', entityId: cert.id, after: { alias: params.alias, validUntil: inspected.validUntil, subjectCN: inspected.subjectCN } });
    return { ...cert, encryptedPassword: undefined };
  }

  /** Verifica certificados prestes a vencer (briefing: "Alerta de vencimento"). */
  async getExpiryAlerts(tenantId: string, warningDays = 30) {
    const warningDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * warningDays);
    return this.prisma.fiscalCertificate.findMany({ where: { tenantId, isActive: true, validUntil: { lte: warningDate } }, orderBy: { validUntil: 'asc' } });
  }

  revoke(ctx: RequestContext, certId: string) {
    return this.prisma.fiscalCertificate.update({ where: { id: certId }, data: { isActive: false } });
  }
}
