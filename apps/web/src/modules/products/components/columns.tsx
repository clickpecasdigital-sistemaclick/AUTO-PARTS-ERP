import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyBRL } from '@/utils/formatters';
import type { Product } from '../types/product.types';

const statusVariant: Record<Product['status'], 'success' | 'secondary' | 'destructive'> = {
  active: 'success',
  inactive: 'secondary',
  discontinued: 'destructive',
};

const statusLabel: Record<Product['status'], string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  discontinued: 'Descontinuado',
};

/**
 * Colunas da listagem de Produtos (`AdvancedDataTable`, Design System
 * Sprint 03). `minStock`/estoque atual aparecem apenas como referência —
 * este módulo não escreve em `Stock` (somente leitura, conforme escopo).
 */
export const productColumns: ColumnDef<Product, unknown>[] = [
  {
    accessorKey: 'internalCode',
    header: 'Código',
    cell: ({ row }) => (
      <Link to={`/produtos/${row.original.id}`} className="font-numeric font-medium text-primary hover:underline">
        {row.original.internalCode}
      </Link>
    ),
  },
  {
    accessorKey: 'shortDescription',
    header: 'Descrição',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.shortDescription}</p>
        {row.original.barcode && <p className="text-xs text-muted-foreground font-numeric">{row.original.barcode}</p>}
      </div>
    ),
  },
  {
    id: 'brand',
    header: 'Marca',
    cell: ({ row }) => row.original.brand?.name ?? '—',
  },
  {
    id: 'group',
    header: 'Grupo',
    cell: ({ row }) => row.original.group?.name ?? '—',
  },
  {
    accessorKey: 'salePrice',
    header: 'Preço de venda',
    cell: ({ row }) => <span className="font-numeric">{formatCurrencyBRL(Number(row.original.salePrice))}</span>,
  },
  {
    id: 'margin',
    header: 'Margem',
    cell: ({ row }) => {
      const margin = row.original.computed?.marginPercent;
      return <span className="font-numeric">{margin !== undefined ? `${margin.toFixed(1)}%` : '—'}</span>;
    },
  },
  {
    accessorKey: 'minStock',
    header: 'Estoque mín.',
    cell: ({ row }) => <span className="font-numeric">{Number(row.original.minStock)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{statusLabel[row.original.status]}</Badge>,
  },
];
