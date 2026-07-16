import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { ProductsService, type RequestContext } from './products.service';
import { ProductsRepository, type ProductWithRelations } from './products.repository';
import type { QueryProductDto } from './dto/query-product.dto';
import { IMPORT_COLUMNS, type ImportReport, type ImportRowResult } from './dto/import-products.dto';

/**
 * Importação/Exportação do catálogo de Produtos.
 *
 * Importação: CSV e Excel (.xlsx) são suportados de ponta a ponta hoje
 * (parse real, linha a linha, com relatório de erro por linha — nunca
 * "tudo ou nada"). Importação de catálogos de fabricantes (formatos
 * proprietários por fornecedor) é "estrutura preparada", conforme
 * escopo: `importManufacturerCatalog()` define o contrato (Buffer entra,
 * `ImportReport` sai) que cada adaptador de fabricante implementará numa
 * sprint futura, sem mudar o Controller.
 *
 * Exportação: Excel, CSV e PDF são gerados de fato (não apenas a
 * estrutura) a partir da mesma listagem usada na tela (mesmos filtros).
 */
@Injectable()
export class ProductsImportExportService {
  private readonly logger = new Logger(ProductsImportExportService.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly repository: ProductsRepository,
  ) {}

  // --- Importação --------------------------------------------------------------

  async importCsv(ctx: RequestContext, fileBuffer: Buffer): Promise<ImportReport> {
    const rows: Record<string, string>[] = parse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true });
    return this.importRows(ctx, rows);
  }

  async importExcel(ctx: RequestContext, fileBuffer: Buffer): Promise<ImportReport> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { raw: false, defval: '' });
    return this.importRows(ctx, rows);
  }

  /**
   * Ponto de extensão para catálogos de fabricantes (formatos proprietários
   * de cada fornecedor — ex: planilha padrão da Bosch, da NGK etc.).
   * Estrutura preparada: cada fabricante terá seu próprio "adapter" que
   * traduz o arquivo original para o array de linhas no formato de
   * `importRows`, reaproveitando toda a validação/relatório já existente.
   */
  async importManufacturerCatalog(_ctx: RequestContext, _fileBuffer: Buffer, manufacturerKey: string): Promise<ImportReport> {
    this.logger.warn(`Adapter de importação para o fabricante "${manufacturerKey}" ainda não implementado.`);
    return { totalRows: 0, created: 0, updated: 0, errors: 0, results: [] };
  }

  private async importRows(ctx: RequestContext, rows: Record<string, string>[]): Promise<ImportReport> {
    const results: ImportRowResult[] = [];
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +1 (1-indexed) +1 (linha de cabeçalho)
      const row = rows[i];

      try {
        const missingColumns = IMPORT_COLUMNS.filter((col) => col === 'shortDescription' || col === 'unitId').filter(
          (col) => !row[col],
        );
        if (missingColumns.length > 0) {
          throw new Error(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`);
        }

        const existing = row.internalCode ? await this.repository.findByInternalCode(ctx.tenantId, row.internalCode) : null;

        const payload = {
          internalCode: row.internalCode || undefined,
          barcode: row.barcode || undefined,
          manufacturerCode: row.manufacturerCode || undefined,
          originalCode: row.originalCode || undefined,
          shortDescription: row.shortDescription,
          fullDescription: row.fullDescription || undefined,
          unitId: row.unitId,
          ncmCode: row.ncmCode || undefined,
          costPrice: row.costPrice ? Number(row.costPrice) : undefined,
          salePrice: row.salePrice ? Number(row.salePrice) : undefined,
          minStock: row.minStock ? Number(row.minStock) : undefined,
          maxStock: row.maxStock ? Number(row.maxStock) : undefined,
        };

        if (existing) {
          await this.productsService.update(ctx, existing.id, payload);
          updated++;
          results.push({ row: rowNumber, internalCode: existing.internalCode, status: 'updated' });
        } else {
          const product = await this.productsService.create(ctx, payload);
          created++;
          results.push({ row: rowNumber, internalCode: product.internalCode, status: 'created' });
        }
      } catch (error) {
        errors++;
        results.push({
          row: rowNumber,
          internalCode: row.internalCode,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return { totalRows: rows.length, created, updated, errors, results };
  }

  // --- Exportação -----------------------------------------------------------------

  async exportCsv(ctx: RequestContext, query: QueryProductDto): Promise<Buffer> {
    const products = await this.repository.findAllForExport(ctx.tenantId, query);
    const rows = products.map((product) => this.toExportRow(product));
    const csv = stringify(rows, { header: true });
    return Buffer.from(csv, 'utf-8');
  }

  async exportExcel(ctx: RequestContext, query: QueryProductDto): Promise<Buffer> {
    const products = await this.repository.findAllForExport(ctx.tenantId, query);
    const rows = products.map((product) => this.toExportRow(product));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportPdf(ctx: RequestContext, query: QueryProductDto): Promise<Buffer> {
    const products = await this.repository.findAllForExport(ctx.tenantId, query);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 32, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('Auto Parts ERP — Catálogo de Produtos', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#666').text(`Gerado em ${new Date().toLocaleString('pt-BR')} — ${products.length} produto(s)`);
      doc.moveDown(1);

      products.forEach((product, index) => {
        if (index > 0) doc.moveDown(0.4);
        doc
          .fillColor('#000')
          .fontSize(10)
          .text(`${product.internalCode} — ${product.shortDescription}`, { continued: false });
        doc
          .fontSize(8)
          .fillColor('#555')
          .text(
            `Marca: ${product.brand?.name ?? '—'}  |  Preço de venda: R$ ${Number(product.salePrice).toFixed(2)}  |  Status: ${product.status}`,
          );
        if (index < products.length - 1) doc.moveTo(doc.x, doc.y + 4).lineTo(560, doc.y + 4).strokeColor('#eee').stroke();
      });

      doc.end();
    });
  }

  private toExportRow(product: ProductWithRelations) {
    return {
      'Código Interno': product.internalCode,
      'Código de Barras': product.barcode ?? '',
      Descrição: product.shortDescription,
      Marca: product.brand?.name ?? '',
      Fabricante: product.manufacturer?.name ?? '',
      NCM: product.ncmCode ?? '',
      'Preço de Custo': Number(product.costPrice).toFixed(2),
      'Preço de Venda': Number(product.salePrice).toFixed(2),
      'Estoque Mínimo': Number(product.minStock),
      Status: product.status,
    };
  }
}
