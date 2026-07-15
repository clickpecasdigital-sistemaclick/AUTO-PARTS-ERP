import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { SearchInput } from '@/components/ui/masked-inputs';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useServiceOrders } from '../hooks/useWorkshop';
import { priorityLabels, serviceOrderStatusLabels, type ServiceOrder, type ServiceOrderPriority, type ServiceOrderStatus } from '../types/workshop.types';

const statusVariant: Record<ServiceOrderStatus, 'secondary' | 'warning' | 'success' | 'destructive' | 'default'> = {
  open: 'secondary',
  diagnosing: 'warning',
  awaiting_approval: 'warning',
  approved: 'default',
  in_progress: 'default',
  awaiting_parts: 'warning',
  completed: 'success',
  delivered: 'success',
  cancelled: 'destructive',
};

const priorityVariant: Record<ServiceOrderPriority, 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  normal: 'secondary',
  high: 'warning',
  urgent: 'destructive',
};

/** Listagem de Ordens de Serviço — número, cliente, veículo, mecânico, consultor, status, prioridade, previsão de entrega (briefing). */
export default function ServiceOrdersListPage() {
  const { can } = usePermissions();
  const { page, setPage, search, setSearch } = usePagination();
  const debouncedSearch = useDebounce(search, 350);
  const { data, isLoading } = useServiceOrders({ page, perPage: 20, search: debouncedSearch });

  const columns: ColumnDef<ServiceOrder, unknown>[] = [
    {
      id: 'code',
      header: 'OS',
      cell: ({ row }) => (
        <Link to={`/oficina/ordens/${row.original.id}`} className="font-numeric font-medium text-primary hover:underline">
          {row.original.code}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Cliente',
      cell: ({ row }) => row.original.customer.tradeName ?? row.original.customer.name,
    },
    {
      id: 'vehicle',
      header: 'Veículo',
      cell: ({ row }) => <span className="font-numeric">{row.original.vehicle.plate ?? '—'}</span>,
    },
    {
      id: 'mechanic',
      header: 'Mecânico',
      cell: ({ row }) => row.original.mechanic?.employee.name ?? '—',
    },
    {
      accessorKey: 'priority',
      header: 'Prioridade',
      cell: ({ row }) => <Badge variant={priorityVariant[row.original.priority]}>{priorityLabels[row.original.priority]}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{serviceOrderStatusLabels[row.original.status]}</Badge>,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => <span className="font-numeric">{formatCurrencyBRL(Number(row.original.totalAmount))}</span>,
    },
    {
      accessorKey: 'openedAt',
      header: 'Aberta em',
      cell: ({ row }) => <span className="font-numeric">{formatDate(row.original.openedAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ordens de Serviço"
        description="Ciclo completo: recepção, diagnóstico, orçamento, execução, entrega."
        actions={
          can('workshop', 'create') && (
            <Button asChild>
              <Link to="/oficina/ordens/nova">
                <Plus /> Nova OS
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por número da OS..."
        />
      </div>

      <AdvancedDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1}
        onPageChange={setPage}
        exportFileName="ordens-de-servico"
        emptyMessage="Nenhuma Ordem de Serviço encontrada."
      />
    </div>
  );
}
