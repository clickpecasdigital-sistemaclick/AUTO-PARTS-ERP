import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Plus, RotateCcw, Repeat } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/masked-inputs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ColumnDef } from '@tanstack/react-table';
import { usePagination } from '@/hooks/usePagination';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useSupplierOptions } from '@/modules/products/hooks/useCatalogs';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import {
  useCreatePayable,
  usePayables,
  useRenegotiatePayable,
  useReversePayable,
  useSettlePayable,
} from '../hooks/useFinancial';
import { payableStatusLabels, type Payable, type PayableStatus } from '../types/financial.types';

const statusVariant: Record<PayableStatus, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  open: 'secondary',
  paid: 'success',
  partially_paid: 'warning',
  overdue: 'destructive',
  cancelled: 'destructive',
};

interface CreateFormValues {
  supplierId?: string;
  documentNumber?: string;
  amount: number;
  dueDate: string;
  installments?: number;
  notes?: string;
}

/** Contas a Pagar — títulos, parcelas, baixa parcial/total, renegociação, estorno, juros, multa e desconto (briefing). */
export default function PayablesPage() {
  const { can } = usePermissions();
  const activeCompanyId = useWorkspaceStore((s) => s.activeCompanyId);
  const { page, setPage } = usePagination();
  const { data, isLoading } = usePayables({ page, perPage: 20 });
  const createPayable = useCreatePayable();
  const settlePayable = useSettlePayable();
  const reversePayable = useReversePayable();
  const renegotiatePayable = useRenegotiatePayable();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settleAmountCents, setSettleAmountCents] = useState(0);
  const [renegotiatingId, setRenegotiatingId] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  const form = useForm<CreateFormValues>();
  const { data: supplierOptions } = useSupplierOptions();

  async function onCreate(values: CreateFormValues) {
    if (!activeCompanyId) return;
    await createPayable.mutateAsync({ companyId: activeCompanyId, payload: values as unknown as Record<string, unknown> });
    form.reset();
    setIsCreateOpen(false);
  }

  const columns: ColumnDef<Payable, unknown>[] = [
    {
      id: 'supplier',
      header: 'Fornecedor',
      cell: ({ row }) => row.original.supplier?.tradeName ?? row.original.supplier?.name ?? row.original.documentNumber ?? '—',
    },
    {
      id: 'installment',
      header: 'Parcela',
      cell: ({ row }) => <span className="font-numeric">{row.original.installmentNumber}/{row.original.totalInstallments}</span>,
    },
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => <span className="font-numeric">{formatDate(row.original.dueDate)}</span>,
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => <span className="font-numeric">{formatCurrencyBRL(Number(row.original.amount))}</span>,
    },
    {
      id: 'paid',
      header: 'Pago',
      cell: ({ row }) => <span className="font-numeric">{formatCurrencyBRL(Number(row.original.paidAmount))}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{payableStatusLabels[row.original.status]}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const payable = row.original;
        return (
          <div className="flex justify-end gap-1">
            {payable.status !== 'paid' && payable.status !== 'cancelled' && can('financial', 'update') && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Baixar"
                onClick={() => {
                  setSettlingId(payable.id);
                  setSettleAmountCents(Math.round((Number(payable.amount) - Number(payable.paidAmount)) * 100));
                }}
              >
                <CheckCircle2 className="size-3.5" />
              </Button>
            )}
            {Number(payable.paidAmount) > 0 && can('financial', 'cancel') && (
              <Button variant="ghost" size="icon-sm" aria-label="Estornar" onClick={() => reversePayable.mutate({ id: payable.id, reason: 'Estorno solicitado pelo operador' })}>
                <RotateCcw className="size-3.5 text-destructive" />
              </Button>
            )}
            {payable.status !== 'paid' && payable.status !== 'cancelled' && can('financial', 'update') && (
              <Button variant="ghost" size="icon-sm" aria-label="Renegociar" onClick={() => setRenegotiatingId(payable.id)}>
                <Repeat className="size-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contas a Pagar"
        description="Títulos, parcelas, baixa parcial/total, renegociação, estorno, juros, multa e desconto."
        actions={
          can('financial', 'create') && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus /> Novo título
            </Button>
          )
        }
      />

      <AdvancedDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1}
        onPageChange={setPage}
        exportFileName="contas-a-pagar"
        emptyMessage="Nenhum título a pagar registrado."
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo título a pagar</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
            <FormField label="Fornecedor">
              <Autocomplete
                value={form.watch('supplierId') ?? null}
                onChange={(v) => form.setValue('supplierId', v ?? undefined)}
                options={(supplierOptions ?? []).map((s) => ({ value: s.id, label: s.name ?? s.code ?? s.id }))}
                placeholder="Buscar fornecedor (opcional)..."
              />
            </FormField>
            <FormField label="Número do documento">
              <Input {...form.register('documentNumber')} />
            </FormField>
            <FormField label="Valor" required>
              <MoneyInput valueInCents={Math.round((form.watch('amount') ?? 0) * 100)} onValueChange={(cents) => form.setValue('amount', cents / 100)} />
            </FormField>
            <FormField label="Vencimento (1ª parcela)" required>
              <Input type="date" {...form.register('dueDate', { required: true })} />
            </FormField>
            <FormField label="Número de parcelas">
              <Input type="number" min={1} {...form.register('installments', { valueAsNumber: true })} className="font-numeric" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createPayable.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!settlingId} onOpenChange={(open) => !open && setSettlingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baixar título</DialogTitle>
          </DialogHeader>
          <FormField label="Valor da baixa">
            <MoneyInput valueInCents={settleAmountCents} onValueChange={setSettleAmountCents} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettlingId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (settlingId) await settlePayable.mutateAsync({ id: settlingId, payload: { amount: settleAmountCents / 100 } });
                setSettlingId(null);
              }}
              isLoading={settlePayable.isPending}
            >
              Confirmar baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renegotiatingId} onOpenChange={(open) => !open && setRenegotiatingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renegociar título</DialogTitle>
          </DialogHeader>
          <FormField label="Nova data de vencimento" required>
            <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenegotiatingId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (renegotiatingId) await renegotiatePayable.mutateAsync({ id: renegotiatingId, payload: { newDueDate, reason: 'Renegociação solicitada' } });
                setRenegotiatingId(null);
                setNewDueDate('');
              }}
              isLoading={renegotiatePayable.isPending}
              disabled={!newDueDate}
            >
              Confirmar renegociação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
