import { Injectable, Logger } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Exportação real (CSV/Excel/PDF) de Pedidos de Compra. Importação de
 * CSV/Excel de itens segue o mesmo padrão de `ProductsImportExportService`
 * (Sprint 05) — reaproveitável quando a tela de criação de Pedido precisar
 * importar uma lista grande de itens. Importação de **XML de NF-e** e de
 * **catálogos de fabricantes** são "estrutura preparada" (briefing): os
 * métodos existem com a assinatura definitiva, mas retornam um relatório
 * vazio documentando o parser que cada futura sprint (Fiscal / Catálogos)
 * deve implementar — nenhum Controller precisará mudar quando isso acontecer.
 */
@Injectable()
export class PurchasingImportExportService {
  private readonly logger = new Logger(PurchasingImportExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async exportOrdersCsv(tenantId: string): Promise<Buffer> {
    const rows = await this.buildExportRows(tenantId);
    return Buffer.from(stringify(rows, { header: true }), 'utf-8');
  }

  async exportOrdersExcel(tenantId: string): Promise<Buffer> {
    const rows = await this.buildExportRows(tenantId);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos de Compra');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportOrderPdf(tenantId: string, orderId: string): Promise<Buffer> {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { supplier: true, branch: true, items: { include: { product: true } } },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 32, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (!order) {
        doc.fontSize(12).text('Pedido de compra não encontrado.');
        doc.end();
        return;
      }

      doc.fontSize(16).text(`Pedido de Compra ${order.code}`);
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#666').text(`Filial: ${order.branch.name} | Emitido em ${order.issueDate.toLocaleDateString('pt-BR')}`);
      doc.moveDown(0.5);
      doc.fillColor('#000').fontSize(11).text(`Fornecedor: ${order.supplier.tradeName ?? order.supplier.name}`);
      doc.fontSize(9).fillColor('#666').text(`CNPJ/CPF: ${order.supplier.document}`);
      doc.moveDown(1);

      order.items.forEach((item, index) => {
        if (index > 0) doc.moveDown(0.3);
        doc.fillColor('#000').fontSize(10).text(`${item.product.internalCode} — ${item.product.shortDescription}`);
        doc.fontSize(8).fillColor('#555').text(`Qtd: ${Number(item.quantity)} x R$ ${Number(item.unitCost).toFixed(2)} = R$ ${Number(item.totalAmount).toFixed(2)}`);
      });

      doc.moveDown(1);
      doc.fontSize(11).fillColor('#000').text(`Total: R$ ${Number(order.totalAmount).toFixed(2)}`, { align: 'right' });

      doc.end();
    });
  }

  /** Estrutura preparada — parser de XML de NF-e (importação de compra) é trabalho da Sprint Fiscal. */
  async importNfeXml(_tenantId: string, _fileBuffer: Buffer): Promise<{ status: 'not_implemented'; message: string }> {
    this.logger.warn('Importação de XML de NF-e ainda não implementada — estrutura preparada para a Sprint Fiscal.');
    return { status: 'not_implemented', message: 'Importação de XML de NF-e será implementada na Sprint Fiscal.' };
  }

  /** Estrutura preparada — adapters por fabricante seguem o mesmo padrão de `ProductsImportExportService.importManufacturerCatalog` (Sprint 05). */
  async importManufacturerCatalog(_tenantId: string, _fileBuffer: Buffer, manufacturerKey: string): Promise<{ status: 'not_implemented'; manufacturerKey: string }> {
    this.logger.warn(`Adapter de catálogo do fabricante "${manufacturerKey}" ainda não implementado.`);
    return { status: 'not_implemented', manufacturerKey };
  }

  private async buildExportRows(tenantId: string) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { supplier: true, branch: true },
      orderBy: { issueDate: 'desc' },
    });
    return orders.map((order) => ({
      Código: order.code,
      Fornecedor: order.supplier.tradeName ?? order.supplier.name,
      Filial: order.branch.name,
      Status: order.status,
      'Data de Emissão': order.issueDate.toLocaleDateString('pt-BR'),
      'Valor Total': Number(order.totalAmount).toFixed(2),
    }));
  }
}
