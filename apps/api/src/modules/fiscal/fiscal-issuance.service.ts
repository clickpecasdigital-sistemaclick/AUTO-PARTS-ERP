import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import { TaxEngineService } from './tax-engine.service';
import { NfeXmlBuilderService } from './xml/nfe-xml-builder.service';
import { resolveRejection } from './rejection-catalog';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Motor de emissão de NF-e/NFC-e (briefing: fluxo Validação→XML→Assinatura→
 * Transmissão→Autorização→Gravação→DANFE→E-mail→Auditoria).
 *
 * Transmissão real para a SEFAZ exige certificado A1 plugado +
 * biblioteca de assinatura (`xml-crypto`) + endpoint SOAP da SEFAZ — a
 * estrutura de integração com PSP real é a mesma do PIX (Sprint 10:
 * ponto de integração pronto, sem PSP plugado nesta sprint). O resultado
 * aqui é um XML bem formado com os totais corretos e a chave de acesso
 * calculada, armazenado com `status: pending_authorization` até que a
 * integração real confirme a autorização.
 */
@Injectable()
export class FiscalIssuanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxEngine: TaxEngineService,
    private readonly xmlBuilder: NfeXmlBuilderService,
    private readonly audit: AuditService,
  ) {}

  /** Emite NF-e (modelo 55) a partir de uma venda ou compra já existente. */
  async issueNfe(
    ctx: RequestContext,
    branchId: string,
    params: {
      saleId?: string;
      purchaseOrderId?: string;
      serviceOrderId?: string;
      customerId?: string;
      supplierId?: string;
      carrierId?: string;
      items: NfeItemInput[];
      additionalInfo?: string;
    },
  ) {
    const config = await this.getFiscalConfig(ctx.tenantId, branchId);
    const series = await this.getOrCreateSeries(ctx.tenantId, branchId, 'nfe', 1);
    const number = await this.getNextNumber(series.id);

    const accessKeyBody = this.buildAccessKey(config.uf, new Date(), '55', branchId, series.series, number);
    const cDV = this.computeAccessKeyDigit(accessKeyBody);
    const fullKey = accessKeyBody + cDV;

    const itemsWithTax = await Promise.all(params.items.map((item) => this.calculateItemTax(ctx, config, item)));
    const totalProducts = itemsWithTax.reduce((s, i) => s + i.productValue, 0);
    const totalDiscount = itemsWithTax.reduce((s, i) => s + i.discountAmount, 0);
    const totalAmount = itemsWithTax.reduce((s, i) => s + i.totalAmount, 0);

    const emitente = await this.buildEmitente(config);

    const xmlContent = this.xmlBuilder.buildNfeXml({
      accessKey: fullKey,
      cuf: config.uf,
      cnf: accessKeyBody.slice(35, 43),
      cDV,
      naturezaOperacao: config.defaultNatureOfOperation ?? 'Venda de Mercadoria',
      serie: series.series,
      number,
      issueDate: new Date().toISOString(),
      tpNF: '1',
      idDest: '1',
      cMunFG: config.ibgeCode ?? '0000000',
      indFinal: '1',
      indPres: '1',
      tpEmis: '1',
      environment: config.environment,
      emitente,
      destinatario: params.customerId
        ? await this.buildDestinatario(params.customerId)
        : { cnpj: '99999999000191', indIEDest: '9', name: 'Consumidor Final', street: 'N/A', number: 'S/N', neighborhood: 'N/A', city: 'N/A', uf: config.uf, cep: '00000000', ibgeCode: config.ibgeCode ?? '0000000' },
      items: itemsWithTax,
      additionalInfo: params.additionalInfo,
    } as never);

    const invoice = await this.prisma.fiscalInvoice.create({
      data: {
        tenantId: ctx.tenantId,
        branchId,
        fiscalSeriesId: series.id,
        saleId: params.saleId,
        purchaseOrderId: params.purchaseOrderId,
        serviceOrderId: params.serviceOrderId,
        customerId: params.customerId,
        supplierId: params.supplierId,
        carrierId: params.carrierId,
        model: 'nfe',
        number,
        series: series.series,
        accessKey: fullKey,
        status: 'pending_authorization',
        totalProducts,
        totalDiscount,
        totalAmount,
        xmlContent,
        createdBy: ctx.userId,
        items: { create: itemsWithTax.map((item) => ({ tenantId: ctx.tenantId, ...item })) },
      },
      include: { items: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'nf_emit', entity: 'FiscalInvoice', entityId: invoice.id, after: { model: 'nfe', number, status: 'pending_authorization' } });
    return invoice;
  }

  /** Emite NFC-e (modelo 65) — versão simplificada para PDV balcão. */
  async issueNfce(ctx: RequestContext, branchId: string, saleId: string, items: NfeItemInput[], paymentType = '01') {
    const config = await this.getFiscalConfig(ctx.tenantId, branchId);
    const series = await this.getOrCreateSeries(ctx.tenantId, branchId, 'nfce', 1);
    const number = await this.getNextNumber(series.id);

    const accessKeyBody = this.buildAccessKey(config.uf, new Date(), '65', branchId, series.series, number);
    const cDV = this.computeAccessKeyDigit(accessKeyBody);
    const fullKey = accessKeyBody + cDV;

    const itemsWithTax = await Promise.all(items.map((item) => this.calculateItemTax(ctx, config, item)));
    const totalAmount = itemsWithTax.reduce((s, i) => s + i.totalAmount, 0);
    const emitente = await this.buildEmitente(config);

    const xmlContent = this.xmlBuilder.buildNfceXml({
      accessKey: fullKey,
      cuf: config.uf,
      cnf: accessKeyBody.slice(35, 43),
      cDV,
      naturezaOperacao: 'Venda a Consumidor',
      serie: series.series,
      number,
      issueDate: new Date().toISOString(),
      tpEmis: '1',
      cMunFG: config.ibgeCode ?? '0000000',
      environment: config.environment,
      emitente,
      items: itemsWithTax,
      payments: [{ type: paymentType, value: totalAmount }],
    } as never);

    const invoice = await this.prisma.fiscalInvoice.create({
      data: {
        tenantId: ctx.tenantId,
        branchId,
        fiscalSeriesId: series.id,
        saleId,
        model: 'nfce',
        number,
        series: series.series,
        accessKey: fullKey,
        status: 'pending_authorization',
        totalAmount,
        xmlContent,
        createdBy: ctx.userId,
        items: { create: itemsWithTax.map((item) => ({ tenantId: ctx.tenantId, ...item })) },
      },
      include: { items: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'nf_emit', entity: 'FiscalInvoice', entityId: invoice.id, after: { model: 'nfce', number } });
    return invoice;
  }

  /**
   * Ponto de integração para autorização pelo SEFAZ (ou PSP) — quando a
   * resposta real chegar (webhook, polling ou lote), este método é chamado.
   * Mesmo padrão do `PixService.confirmWebhook()` (Sprint 10).
   */
  async confirmAuthorization(ctx: RequestContext, invoiceId: string, protocolNumber: string, authorizedXmlPath?: string) {
    const updated = await this.prisma.fiscalInvoice.update({
      where: { id: invoiceId },
      data: { status: 'authorized', authorizedAt: new Date(), protocolNumber, xmlPath: authorizedXmlPath },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'approve', entity: 'FiscalInvoice', entityId: invoiceId, after: { status: 'authorized', protocolNumber } });
    return updated;
  }

  /** Registra rejeição com catálogo inteligente (briefing). */
  async registerRejection(ctx: RequestContext, invoiceId: string, rejectionCode: string, rawMessage: string) {
    const entry = resolveRejection(rejectionCode);
    await this.prisma.fiscalInvoice.update({ where: { id: invoiceId }, data: { status: 'rejected', rejectionCode, rejectionReason: entry.message } });
    await this.prisma.fiscalRejectionLog.create({
      data: { tenantId: ctx.tenantId, fiscalInvoiceId: invoiceId, rejectionCode, rejectionMessage: rawMessage, explanation: entry.explanation, possibleCause: entry.possibleCause, suggestedFix: entry.suggestedFix, internalLink: entry.internalLink },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'reject', entity: 'FiscalInvoice', entityId: invoiceId, after: { rejectionCode } });
  }

  // ---- Chave de acesso ----------------------------------------------------------

  private buildAccessKey(uf: string, date: Date, model: string, cnpjOrBranchId: string, serie: number, number: number): string {
    const year = String(date.getFullYear()).slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const cleanCnpj = cnpjOrBranchId.replace(/\D/g, '').slice(0, 14).padStart(14, '0');
    const cNF = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
    return `${uf}${year}${month}${cleanCnpj}${model.padStart(2, '0')}${String(serie).padStart(3, '0')}${String(number).padStart(9, '0')}1${cNF}`;
  }

  private computeAccessKeyDigit(key: string): string {
    let sum = 0;
    let weight = 2;
    for (let i = key.length - 1; i >= 0; i--) {
      sum += parseInt(key[i], 10) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const remainder = sum % 11;
    return String(remainder < 2 ? 0 : 11 - remainder);
  }

  // ---- Helpers -----------------------------------------------------------------

  private async getFiscalConfig(tenantId: string, branchId: string) {
    const config = await this.prisma.fiscalConfiguration.findFirst({ where: { tenantId, branchId } });
    if (!config) throw new NotFoundException('Configuração fiscal não encontrada para esta filial. Configure em /fiscal/configuracao.');
    return config;
  }

  private async getOrCreateSeries(tenantId: string, branchId: string, model: string, series: number) {
    let s = await this.prisma.fiscalSeries.findFirst({ where: { tenantId, branchId, model: model as never, series, isActive: true } });
    if (!s) {
      s = await this.prisma.fiscalSeries.create({ data: { tenantId, branchId, model: model as never, series } });
    }
    return s;
  }

  private async getNextNumber(seriesId: string): Promise<number> {
    const series = await this.prisma.fiscalSeries.update({ where: { id: seriesId }, data: { nextNumber: { increment: 1 } } });
    return series.nextNumber - 1;
  }

  private async calculateItemTax(ctx: RequestContext, config: { taxRegime: string; uf: string }, item: NfeItemInput) {
    const tax = await this.taxEngine.calculate({
      tenantId: ctx.tenantId,
      ncmCode: item.ncmCode,
      cfopCode: item.cfopCode,
      originState: config.uf,
      destState: item.destState ?? config.uf,
      taxRegime: config.taxRegime,
      productId: item.productId,
      productValue: item.unitPrice * item.quantity,
      quantity: item.quantity,
      discountValue: item.discountAmount ?? 0,
    });

    return { productId: item.productId, cfopCode: item.cfopCode, ncmCode: item.ncmCode, quantity: item.quantity, unitPrice: item.unitPrice, discountAmount: item.discountAmount ?? 0, productValue: item.unitPrice * item.quantity, ...tax };
  }

  private async buildEmitente(config: { branchId: string; uf: string; crt: number }) {
    const branch = await this.prisma.branch.findUnique({ where: { id: config.branchId }, include: { company: true } });
    if (!branch) throw new NotFoundException('Filial não encontrada');
    return { cnpj: branch.company.document.replace(/\D/g, ''), ie: 'ISENTO', name: branch.company.legalName, tradeName: branch.company.tradeName ?? undefined, crt: config.crt, street: 'Rua Exemplo', number: '1', neighborhood: 'Centro', city: 'Cidade', uf: config.uf, cep: '00000000', ibgeCode: '0000000' };
  }

  private async buildDestinatario(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    const doc = customer.document.replace(/\D/g, '');
    return { cnpj: doc.length === 14 ? doc : undefined, cpf: doc.length === 11 ? doc : undefined, ie: undefined, indIEDest: '9', name: customer.tradeName ?? customer.name, street: 'N/A', number: 'S/N', neighborhood: 'N/A', city: 'N/A', uf: 'RS', cep: '00000000', ibgeCode: '0000000' };
  }
}

interface NfeItemInput {
  productId: string;
  ncmCode?: string;
  cfopCode: string;
  destState?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}
