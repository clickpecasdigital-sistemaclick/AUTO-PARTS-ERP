export interface ImportRowResult {
  row: number;
  internalCode?: string;
  status: 'created' | 'updated' | 'error';
  message?: string;
}

export interface ImportReport {
  totalRows: number;
  created: number;
  updated: number;
  errors: number;
  results: ImportRowResult[];
}

/**
 * Mapeamento de colunas aceito no CSV/Excel de importação. Mantido simples
 * e explícito (sem "auto-detecção mágica" de colunas) para que o relatório
 * de erro por linha seja sempre previsível.
 */
export const IMPORT_COLUMNS = [
  'internalCode',
  'barcode',
  'manufacturerCode',
  'originalCode',
  'shortDescription',
  'fullDescription',
  'unitId',
  'ncmCode',
  'costPrice',
  'salePrice',
  'minStock',
  'maxStock',
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];
