import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '@/database/prisma/prisma.service';
import { CART_INCLUDE } from './pdv-cart.repository';

/**
 * Impressão (briefing: "Impressora térmica, A4, PDF, Cupom não fiscal").
 * Gera PDF real nos dois formatos — o formato térmico (largura ~80mm) é o
 * "cupom não fiscal" pedido (rótulo explícito no documento: "NÃO É
 * DOCUMENTO FISCAL", já que a emissão fiscal real é da Sprint Fiscal).
 * Envio para impressora térmica via ESC/POS é integração de driver/SO,
 * fora do escopo de uma API REST — o PDF de 80mm é o que se entrega à
 * impressora (qualquer driver térmico imprime um PDF nesse tamanho).
 */
@Injectable()
export class PdvPrintService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReceipt(tenantId: string, saleId: string, format: 'thermal' | 'a4'): Promise<Buffer> {
    const sale = await this.prisma.sale.findFirst({ where: { id: saleId, tenantId }, include: { ...CART_INCLUDE, branch: { include: { company: true } } } });
    if (!sale) throw new NotFoundException('Venda não encontrada');

    const isThermal = format === 'thermal';
    const pageWidth = isThermal ? 226 : 595; // ~80mm em pontos vs A4

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: isThermal ? [pageWidth, 1000] : 'A4', margin: isThermal ? 8 : 32 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fontSize = isThermal ? 7 : 10;
      doc.fontSize(isThermal ? 9 : 14).text(sale.branch.company.legalName, { align: 'center' });
      doc.fontSize(fontSize).text('CUPOM NÃO FISCAL — sem valor fiscal', { align: 'center' });
      doc.moveDown(0.5);
      doc.text(`Venda: ${sale.code}`);
      doc.text(`Data: ${sale.issuedAt.toLocaleString('pt-BR')}`);
      doc.text(`Cliente: ${sale.customer.tradeName ?? sale.customer.name}`);
      if (sale.customerVehicle?.plate) doc.text(`Veículo: ${sale.customerVehicle.plate}`);
      doc.moveDown(0.5);

      sale.items.forEach((item) => {
        doc.text(`${item.product.internalCode} ${item.product.shortDescription}`);
        doc.text(`  ${Number(item.quantity)} x R$ ${Number(item.unitPrice).toFixed(2)} = R$ ${Number(item.totalAmount).toFixed(2)}`);
      });

      doc.moveDown(0.5);
      doc.text(`Subtotal: R$ ${Number(sale.subtotalAmount).toFixed(2)}`);
      doc.text(`Desconto: R$ ${Number(sale.discountAmount).toFixed(2)}`);
      doc.fontSize(isThermal ? 10 : 12).text(`TOTAL: R$ ${Number(sale.totalAmount).toFixed(2)}`);
      doc.fontSize(fontSize).moveDown(0.5);

      sale.payments.forEach((payment) => {
        doc.text(`${payment.paymentMethod.name}: R$ ${Number(payment.amount).toFixed(2)}`);
      });

      doc.end();
    });
  }
}
