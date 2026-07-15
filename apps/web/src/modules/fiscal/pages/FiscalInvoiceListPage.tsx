import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { SearchInput } from '@/components/ui/masked-inputs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useFiscalInvoices, fiscalService } from '../services/fiscal.service';
import { invoiceStatusLabels, type FiscalInvoice, type FiscalInvoiceStatus } from '../types/fiscal.types';

const statusVariant: Record<FiscalInvoiceStatus, 'secondary' | 'warning' | 'success' | 'destructive' | 'default'> = {
  draft: 'secondary',
  pending_authorization: 'warning',
  authorized: 'success',
  rejected: 'destructive',
  cancelled: 'destructive',
  denied: 'destructive',
  contingency: 'warning',
};

export default function FiscalInvoiceListPage() {
  const { page, setPage, search, setSearch } = usePagination();
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState('');
  const [model, setModel] = useState('');

  const { data, isLoading } = useFiscalInvoices({ page: String(page), perPage: '20', search: debouncedSearch, ...(status ? { status } : {}), ...(model ? { model } : {}) });

  const columns: ColumnDef<FiscalInvoice, unknown>[] = [
    {
      id: 'number',
      header: 'Número',
      cell: ({ row }) => <span className="font-numeric">{row.original.series}-{String(row.original.number).padStart(9, '0')}</span>,
    },
    {
      accessorKey: 'model',
      header: 'Modelo',
      cell: ({ row }) => <Badge variant="secondary">{row.original.model.toUpperCase()}</Badge>,
    },
    {
      id: 'recipient',
      header: 'Destinatário',
      cell: ({ row }) => row.original.customer?.name ?? row.original.supplier?.name ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{invoiceStatusLabels[row.original.status]}</Badge>,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => <span className="font-numeric">{formatCurrencyBRL(Number(row.original.totalAmount))}</span>,
    },
    {
      accessorKey: 'issueDate',
      header: 'Emissão',
      cell: ({ row }) => <span className="font-numeric">{formatDate(row.original.issueDate)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" asChild title="Download XML">
            <a href={fiscalService.getXmlUrl(row.original.id)} download>
              <Download className="size-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild title="DANFE">
            <a href={fiscalService.getDanfeUrl(row.original.id)} target="_blank" rel="noopener noreferrer">
              <FileText className="size-3.5" />
            </a>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Notas Fiscais" description="NF-e e NFC-e emitidas — download XML/DANFE, cancelamento, CC-e." />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por número ou chave de acesso..."
          className="max-w-xs"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(invoiceStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={model} onValueChange={(v) => { setModel(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="nfe">NF-e (55)</SelectItem>
            <SelectItem value="nfce">NFC-e (65)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdvancedDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1}
        onPageChange={setPage}
        exportFileName="notas-fiscais"
        emptyMessage="Nenhuma nota fiscal encontrada."
      />
    </div>
  );
}
