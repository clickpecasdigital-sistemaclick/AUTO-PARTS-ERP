import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/formatters';
import { stockMovementTypeLabels, type StockMovement } from '../types/inventory.types';

const inboundTypes = new Set(['purchase_in', 'transfer_in', 'adjustment_in', 'inventory_in', 'return_in', 'bonus_in']);

export const movementColumns: ColumnDef<StockMovement, unknown>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Data',
    cell: ({ row }) => <span className="font-numeric text-sm">{formatDate(row.original.createdAt, true)}</span>,
  },
  {
    id: 'product',
    header: 'Produto',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.product.internalCode}</p>
        <p className="text-xs text-muted-foreground">{row.original.product.shortDescription}</p>
      </div>
    ),
  },
  {
    id: 'warehouse',
    header: 'Depósito',
    cell: ({ row }) => row.original.warehouse.name,
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge variant={inboundTypes.has(row.original.type) ? 'success' : 'secondary'}>{stockMovementTypeLabels[row.original.type]}</Badge>
    ),
  },
  {
    accessorKey: 'quantity',
    header: 'Quantidade',
    cell: ({ row }) => <span className="font-numeric">{Number(row.original.quantity)}</span>,
  },
  {
    id: 'totalValue',
    header: 'Valor',
    cell: ({ row }) => <span className="font-numeric">{row.original.totalValue ? `R$ ${Number(row.original.totalValue).toFixed(2)}` : '—'}</span>,
  },
  {
    accessorKey: 'reason',
    header: 'Motivo',
    cell: ({ row }) => row.original.reason ?? '—',
  },
];
