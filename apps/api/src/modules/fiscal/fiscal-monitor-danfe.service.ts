import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

/** Monitor Fiscal (briefing: notas emitidas/pendentes/rejeitadas/canceladas/inutilizadas, alertas, ultimas rejeicoes). */
@Injectable()
export class FiscalMonitorService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId: string, branchId?: string) {
    const where: any = { tenantId, ...(branchId ? { branchId } : {}) };

    const [emitted, pending, rejected, cancelled, authorized, voidedRanges, recentRejections, certificates] = await Promise.all([
      this.prisma.fiscalInvoice.count({ where }),
      this.prisma.fiscalInvoice.count({ where: { ...where, status: 'pending_authorization' } }),
      this.prisma.fiscalInvoice.count({ where: { ...where, status: 'rejected' } }),
      this.prisma.fiscalInvoice.count({ where: { ...where, status: 'cancelled' } }),
      this.prisma.fiscalInvoice.count({ where: { ...where, status: 'authorized' } }),
      this.prisma.fiscalVoidingRange.count({ where: { tenantId } }),
      this.prisma.fiscalRejectionLog.findMany({ where: { tenantId }, orderBy: { occurredAt: 'desc' }, take: 5 }),
      this.prisma.fiscalCertificate.findMany({ where: { tenantId, isActive: true, validUntil: { lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) } } }),
    ]);

    return { totals: { emitted, pending, rejected, cancelled, authorized, voidedRanges }, recentRejections, expiringCertificates: certificates };
  }

  async listInvoices(tenantId: string, query: PaginationQueryDto & { status?: string; model?: string; search?: string; branchId?: string }) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status as never;
    if (query.model) where.model = query.model as never;
    if (query.branchId) where.branchId = query.branchId;
    if (query.search) {
      where.OR = [{ accessKey: { contains: query.search } }, { number: isNaN(Number(query.search)) ? undefined : Number(query.search) }];
    }

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.fiscalInvoice.findMany({ where, include: { customer: { select: { name: true } }, supplier: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.fiscalInvoice.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  getInvoice(tenantId: string, id: string) {
    return this.prisma.fiscalInvoice.findFirst({ where: { id, tenantId }, include: { items: { include: { product: { select: { internalCode: true, shortDescription: true } } } }, events: true, rejectionLogs: true } });
  }

  getXml(tenantId: string, id: string) {
    return this.prisma.fiscalInvoice.findFirst({ where: { id, tenantId }, select: { xmlContent: true, accessKey: true, number: true, model: true } });
  }
}

/**
 * DANFE (Documento Auxiliar da Nota Fiscal Eletronica) — PDF via pdfkit.
 * Mesmo pdfkit ja utilizado pelo PdvPrintService (Sprint 09). Layout com
 * todos os campos fiscais legíveis e chave de acesso para consulta.
 */
@Injectable()
export class DanfeService {
  async generatePdf(invoice: {
    model: string;
    number: number;
    series: number;
    accessKey: string | null;
    issueDate: Date;
    totalAmount: number;
    protocolNumber?: string | null;
    customer?: { name: string; tradeName?: string | null } | null;
    items: { product: { shortDescription: string }; quantity: number; unitPrice: number; totalAmount: number }[];
  }): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFDocument = require('pdfkit');
    const doc: NodeJS.ReadableStream & { end: () => void; fontSize: (n: number) => typeof doc; font: (f: string) => typeof doc; text: (s: string, opts?: Record<string, unknown>) => typeof doc; moveDown: () => typeof doc } = new PDFDocument({ size: 'A4', margin: 30 });
    const chunks: Buffer[] = [];
    (doc as NodeJS.ReadableStream).on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise((resolve, reject) => {
      (doc as NodeJS.ReadableStream).on('end', () => resolve(Buffer.concat(chunks)));
      (doc as NodeJS.ReadableStream).on('error', reject);

      const modelLabel = invoice.model === 'nfce' ? 'NFC-e (65)' : 'NF-e (55)';

      doc.fontSize(14).font('Helvetica-Bold').text(`DANFE — ${modelLabel}`, { align: 'center' } as never);
      doc.fontSize(10).font('Helvetica').moveDown();
      doc.text(`Numero: ${invoice.series}-${String(invoice.number).padStart(9, '0')}`);
      doc.text(`Emissao: ${invoice.issueDate.toLocaleDateString('pt-BR')}`);
      doc.text(`Protocolo: ${invoice.protocolNumber ?? 'Pendente'}`);
      if (invoice.customer) doc.text(`Destinatario: ${invoice.customer.tradeName ?? invoice.customer.name}`);
      doc.moveDown();
      doc.text(`Chave de Acesso: ${invoice.accessKey ?? 'N/A'}`, { width: 500 } as never);
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Itens:', { underline: true } as never);
      doc.font('Helvetica');
      for (const item of invoice.items) {
        doc.text(`* ${item.product.shortDescription} -- Qtd: ${Number(item.quantity).toFixed(2)} x R$ ${Number(item.unitPrice).toFixed(2)} = R$ ${Number(item.totalAmount).toFixed(2)}`);
      }
      doc.moveDown();
      doc.font('Helvetica-Bold').text(`TOTAL: R$ ${Number(invoice.totalAmount).toFixed(2)}`, { align: 'right' } as never);
      doc.fontSize(7).font('Helvetica').moveDown();
      doc.text('Documento auxiliar simplificado. Consulte a validade da NF-e pelo site da SEFAZ.', { align: 'center' } as never);

      doc.end();
    });
  }
}
