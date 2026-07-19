import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef } from '@tanstack/react-table';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import { useAuditEntities, useAuditLogs, downloadAuditExport, type AuditLogEntry } from '../services/audit.service';

const actionLabels: Record<string, string> = {
  insert: 'Criação',
  update: 'Edição',
  delete: 'Exclusão',
  login: 'Login',
  logout: 'Logout',
  nf_emit: 'Emissão de NF',
  nf_cancel: 'Cancelamento de NF',
  permission_change: 'Alteração de permissão',
  stock_adjustment: 'Ajuste de estoque',
  price_change: 'Alteração de preço',
  export: 'Exportação',
  approve: 'Aprovação',
  reject: 'Rejeição',
  receive: 'Recebimento',
  confer: 'Conferência',
  credit_change: 'Alteração de crédito',
  consent_change: 'Alteração de consentimento (LGPD)',
  anonymize: 'Anonimização (LGPD)',
  document_upload: 'Upload de documento',
  document_download: 'Download de documento',
  sensitive_data_view: 'Visualização de dado sensível',
};

const actionVariant: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  insert: 'success',
  update: 'secondary',
  delete: 'destructive',
  login: 'secondary',
  logout: 'secondary',
  permission_change: 'warning',
  price_change: 'warning',
  stock_adjustment: 'warning',
};

/** Auditoria — histórico completo de tudo que já foi criado/alterado/excluído no sistema (a tabela audit_logs já era escrita por todo módulo; essa tela é a primeira forma de ver esse dado). */
export default function AuditPage() {
  const { page, setPage, search, setSearch } = usePagination();
  const debouncedSearch = useDebounce(search, 350);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const queryParams = {
    page,
    perPage: 50,
    search: debouncedSearch || undefined,
    entity: entityFilter === 'all' ? undefined : entityFilter,
    action: actionFilter === 'all' ? undefined : actionFilter,
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isLoading } = useAuditLogs(queryParams);
  const { data: entities } = useAuditEntities();

  async function handleExport() {
    try {
      await downloadAuditExport(queryParams);
    } catch {
      toast.error('Não foi possível exportar o log de auditoria');
    }
  }

  const columns: ColumnDef<AuditLogEntry, unknown>[] = [
    {
      id: 'createdAt',
      header: 'Data/Hora',
      cell: ({ row }) => <span className="font-numeric text-sm">{formatDate(row.original.createdAt, true)}</span>,
    },
    {
      id: 'user',
      header: 'Usuário',
      cell: ({ row }) => <span>{row.original.user?.fullName ?? row.original.user?.email ?? 'Sistema'}</span>,
    },
    {
      id: 'action',
      header: 'Ação',
      cell: ({ row }) => <Badge variant={actionVariant[row.original.action] ?? 'secondary'}>{actionLabels[row.original.action] ?? row.original.action}</Badge>,
    },
    { accessorKey: 'entity', header: 'Módulo' },
    {
      id: 'entityId',
      header: 'Registro',
      cell: ({ row }) => <span className="font-numeric text-xs text-muted-foreground">{row.original.entityId?.slice(0, 8) ?? '—'}</span>,
    },
    {
      id: 'ipAddress',
      header: 'IP',
      cell: ({ row }) => <span className="font-numeric text-xs text-muted-foreground">{row.original.ipAddress ?? '—'}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Histórico completo de criações, edições e exclusões em todo o sistema — quem fez, quando e o quê."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download /> Exportar CSV
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por ID do registro..."
          leftIcon={<Search className="size-4" />}
        />
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {entities?.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.entries(actionLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <AdvancedDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1}
        onPageChange={setPage}
        exportFileName="auditoria"
        emptyMessage="Nenhum evento de auditoria encontrado com esses filtros."
      />
    </div>
  );
}
