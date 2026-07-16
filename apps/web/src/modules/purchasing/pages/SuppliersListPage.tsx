import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { SearchInput } from '@/components/ui/masked-inputs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useCreateSupplier, useSuppliers } from '../services/suppliers.service';
import type { CreateSupplierPayload, Supplier, SupplierStatus } from '../types/supplier.types';

const statusVariant: Record<SupplierStatus, 'success' | 'secondary' | 'destructive'> = { active: 'success', inactive: 'secondary', blocked: 'destructive' };
const statusLabel: Record<SupplierStatus, string> = { active: 'Ativo', inactive: 'Inativo', blocked: 'Bloqueado' };

/** Cadastro de Fornecedores — antes um placeholder "módulo em construção"; o
 * backend só tinha o painel 360° (analytics), nunca o CRUD em si. */
export default function SuppliersListPage() {
  const { can } = usePermissions();
  const activeCompanyId = useWorkspaceStore((s) => s.activeCompanyId);
  const { page, setPage, search, setSearch } = usePagination();
  const debouncedSearch = useDebounce(search, 350);
  const { data, isLoading } = useSuppliers({ page, perPage: 20, search: debouncedSearch });
  const createSupplier = useCreateSupplier();

  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<CreateSupplierPayload>({ defaultValues: { personType: 'business' } });

  async function onSubmit(values: CreateSupplierPayload) {
    if (!activeCompanyId) return;
    await createSupplier.mutateAsync({ companyId: activeCompanyId, payload: values });
    setIsOpen(false);
    form.reset();
  }

  const columns: ColumnDef<Supplier, unknown>[] = [
    {
      id: 'name',
      header: 'Fornecedor',
      cell: ({ row }) => <span className="font-medium">{row.original.tradeName ?? row.original.name}</span>,
    },
    {
      accessorKey: 'document',
      header: 'Documento',
      cell: ({ row }) => <span className="font-numeric">{row.original.document}</span>,
    },
    {
      id: 'contact',
      header: 'Contato',
      cell: ({ row }) => <span>{row.original.phone ?? row.original.email ?? '—'}</span>,
    },
    {
      id: 'city',
      header: 'Cidade/UF',
      cell: ({ row }) => <span>{row.original.city ? `${row.original.city}/${row.original.state ?? ''}` : '—'}</span>,
    },
    {
      id: 'paymentTermDays',
      header: 'Prazo pagto.',
      cell: ({ row }) => <span className="font-numeric">{row.original.paymentTermDays ? `${row.original.paymentTermDays} dias` : '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{statusLabel[row.original.status]}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores usado em Compras, Produtos e Financeiro."
        actions={
          can('purchases', 'create') && (
            <Button onClick={() => setIsOpen(true)} disabled={!activeCompanyId}>
              <Plus /> Novo fornecedor
            </Button>
          )
        }
      />

      {!activeCompanyId && (
        <p className="mb-4 text-sm text-destructive">Selecione uma empresa ativa (canto superior) para cadastrar fornecedores.</p>
      )}

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
        exportFileName="fornecedores"
        emptyMessage="Nenhum fornecedor cadastrado ainda."
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo fornecedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tipo de pessoa" required>
                <Select onValueChange={(v) => form.setValue('personType', v as CreateSupplierPayload['personType'])} value={form.watch('personType')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Pessoa Jurídica</SelectItem>
                    <SelectItem value="individual">Pessoa Física</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="CNPJ/CPF" required>
                <Input {...form.register('document', { required: true })} />
              </FormField>
            </div>
            <FormField label="Razão social / Nome" required>
              <Input {...form.register('name', { required: true })} />
            </FormField>
            <FormField label="Nome fantasia">
              <Input {...form.register('tradeName')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="E-mail">
                <Input type="email" {...form.register('email')} />
              </FormField>
              <FormField label="Telefone">
                <Input {...form.register('phone')} />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Cidade">
                <Input {...form.register('city')} />
              </FormField>
              <FormField label="UF">
                <Input maxLength={2} {...form.register('state')} />
              </FormField>
              <FormField label="Prazo pagto. (dias)">
                <Input type="number" {...form.register('paymentTermDays', { valueAsNumber: true })} />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="submit" isLoading={createSupplier.isPending}>
                Salvar fornecedor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
