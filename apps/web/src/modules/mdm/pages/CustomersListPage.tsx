import { useState } from 'react';
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
import { formatCurrencyBRL } from '@/utils/formatters';
import { useCustomers } from '../hooks/useMdm';
import { creditStatusLabels, customerTypeLabels, type Customer, type CreditStatus, type CustomerStatus } from '../types/mdm.types';

const statusVariant: Record<CustomerStatus, 'success' | 'secondary' | 'destructive'> = { active: 'success', inactive: 'secondary', blocked: 'destructive' };
const creditVariant: Record<CreditStatus, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  not_analyzed: 'secondary',
  approved: 'success',
  under_review: 'warning',
  restricted: 'warning',
  blocked: 'destructive',
};

/** Cadastro Mestre de Clientes — fonte oficial consumida por todo o ERP. */
export default function CustomersListPage() {
  const { can } = usePermissions();
  const { page, setPage, search, setSearch } = usePagination();
  const debouncedSearch = useDebounce(search, 350);
  const { data, isLoading } = useCustomers({ page, perPage: 20, search: debouncedSearch });

  const columns: ColumnDef<Customer, unknown>[] = [
    {
      id: 'name',
      header: 'Cliente',
      cell: ({ row }) => (
        <Link to={`/clientes/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.tradeName ?? row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'document',
      header: 'Documento',
      cell: ({ row }) => <span className="font-numeric">{row.original.document}</span>,
    },
    {
      id: 'customerType',
      header: 'Tipo',
      cell: ({ row }) => <Badge variant="outline">{customerTypeLabels[row.original.customerType]}</Badge>,
    },
    {
      id: 'totalPurchases',
      header: 'Compras',
      cell: ({ row }) => <span className="font-numeric">{row.original.totalPurchasesCount}</span>,
    },
    {
      id: 'averageTicket',
      header: 'Ticket médio',
      cell: ({ row }) => <span className="font-numeric">{formatCurrencyBRL(Number(row.original.averageTicketValue))}</span>,
    },
    {
      id: 'creditStatus',
      header: 'Crédito',
      cell: ({ row }) => <Badge variant={creditVariant[row.original.creditStatus]}>{creditStatusLabels[row.original.creditStatus]}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status === 'active' ? 'Ativo' : row.original.status === 'inactive' ? 'Inativo' : 'Bloqueado'}</Badge>,
    },
  ];

  const [, setSelected] = useState<Customer[]>([]);

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro Mestre — fonte oficial de dados de cliente para todo o ERP."
        actions={
          can('customers', 'create') && (
            <Button asChild>
              <Link to="/clientes/novo">
                <Plus /> Novo cliente
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
          placeholder="Buscar por nome, documento, e-mail, telefone..."
        />
      </div>

      <AdvancedDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1}
        onPageChange={setPage}
        onRowSelectionChange={setSelected}
        exportFileName="clientes"
        emptyMessage="Nenhum cliente encontrado."
      />
    </div>
  );
}
