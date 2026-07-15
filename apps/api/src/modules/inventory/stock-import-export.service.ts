import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { StockRepository } from './stock.repository';
import { StockService } from './stock.service';
import type { RequestContext } from '@/common/types/request-context';
import type { ImportReport, ImportRowResult } from '@/modules/products/dto/import-products.dto';

/**
 * Importação/Exportação de Estoque. Importação aceita CSV/Excel com saldo
 * inicial ou contagem de inventário (colunas: internalCode, warehouseCode,
 * quantity, unitCost) — cada linha gera um `StockMovement` real via
 * `StockService.move()` (tipo `inventory_in`), reaproveitando toda a
 * validação/atomicidade do motor de movimentações, igual ao import de
 * Produtos da Sprint 05. Exportação gera o relatório de saldo atual.
 */
@Injectable()
export class StockImportExportService {
  constructor(
    private readonly repository: StockRepository,
    private readonly stockService: StockService,
  ) {}

  async importStockCsv(ctx: RequestContext, fileBuffer: Buffer): Promise<ImportReport> {
    const rows: Record<string, string>[] = parse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true });
    return this.importRows(ctx, rows);
  }

  async importStockExcel(ctx: RequestContext, fileBuffer: Buffer): Promise<ImportReport> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false, defval: '' });
    return this.importRows(ctx, rows);
  }

  private async importRows(ctx: RequestContext, rows: Record<string, string>[]): Promise<ImportReport> {
    const results: ImportRowResult[] = [];
    let created = 0;
    const errors: ImportRowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const row = rows[i];
      try {
        if (!row.productId || !row.warehouseId || !row.quantity) {
          throw new Error('Colunas obrigatórias: productId, warehouseId, quantity');
        }
        await this.stockService.move(ctx, {
          productId: row.productId,
          warehouseId: row.warehouseId,
          type: 'inventory_in' as never,
          quantity: Number(row.quantity),
          unitCost: row.unitCost ? Number(row.unitCost) : undefined,
          reason: 'Importação de saldo inicial/inventário',
          documentType: 'import',
        });
        created++;
        results.push({ row: rowNumber, status: 'created' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        errors.push({ row: rowNumber, status: 'error', message });
        results.push({ row: rowNumber, status: 'error', message });
      }
    }

    return { totalRows: rows.length, created, updated: 0, errors: errors.length, results };
  }

  async exportCsv(tenantId: string, warehouseId?: string): Promise<Buffer> {
    const rows = await this.buildExportRows(tenantId, warehouseId);
    return Buffer.from(stringify(rows, { header: true }), 'utf-8');
  }

  async exportExcel(tenantId: string, warehouseId?: string): Promise<Buffer> {
    const rows = await this.buildExportRows(tenantId, warehouseId);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportPdf(tenantId: string, warehouseId?: string): Promise<Buffer> {
    const stocks = await this.repository.listStockSnapshot(tenantId, warehouseId);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 32, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('AutoCore ERP — Relatório de Estoque');
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#666').text(`Gerado em ${new Date().toLocaleString('pt-BR')} — ${stocks.length} produto(s)`);
      doc.moveDown(1);

      stocks.forEach((stock, index) => {
        if (index > 0) doc.moveDown(0.3);
        doc.fillColor('#000').fontSize(10).text(`${stock.product.internalCode} — ${stock.product.shortDescription}`);
        doc
          .fontSize(8)
          .fillColor('#555')
          .text(`Depósito: ${stock.warehouse.name} | Saldo: ${Number(stock.quantityOnHand)} | Reservado: ${Number(stock.quantityReserved)}`);
      });

      doc.end();
    });
  }

  private async buildExportRows(tenantId: string, warehouseId?: string) {
    const stocks = await this.repository.listStockSnapshot(tenantId, warehouseId);
    return stocks.map((stock) => ({
      'Código Interno': stock.product.internalCode,
      Descrição: stock.product.shortDescription,
      Depósito: stock.warehouse.name,
      'Saldo Atual': Number(stock.quantityOnHand),
      Reservado: Number(stock.quantityReserved),
      Disponível: Number(stock.quantityOnHand) - Number(stock.quantityReserved),
      'Custo Médio': Number(stock.product.averageCostPrice).toFixed(2),
      'Valor em Estoque': (Number(stock.quantityOnHand) * Number(stock.product.averageCostPrice)).toFixed(2),
    }));
  }
}
