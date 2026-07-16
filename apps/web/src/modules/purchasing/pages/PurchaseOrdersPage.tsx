import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Ban, CheckCircle2, Copy, Download, FileText, MoreHorizontal, Plus, RotateCcw, Send } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnDef } from '@tanstack/react-table';
import { usePagination } from '@/hooks/usePagination';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { env } from '@/config/env';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useSupplierOptions } from '@/modules/products/hooks/useCatalogs';
import { useProducts } from '@/modules/products/hooks/useProducts';
import {
  useApproveOrder,
  useCancelOrder,
  useCreatePurchaseOrder,
  useDuplicateOrder,
  usePurchaseOrders,
  useReopenOrder,
  useSendOrder,
} from '../hooks/usePurchasing';
import { orderStatusLabels, type PurchaseOrder, type PurchaseOrderStatus } from '../types/purchasing.types';

interface OrderFormValues {
  supplierId: string;
  productId: string;
  quantity: number;
  unitCost: number;
}

const statusVariant: Record<PurchaseOrderStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  draft: 'secondary',
  sent: 'warning',
  partially_received: 'warning',
  received: 'success',
  cancelled: 'destructive',
};

/** Pedidos de Compra — gerados manualmente ou automaticamente a partir de uma Cotação adjudicada. */
export default function PurchaseOrdersPage() {
  const { can } = usePermissions();
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const { page, setPage } = usePagination();
  const { data, isLoading } = usePurchaseOrders({ page, perPage: 20 });
  const createOrder = useCreatePurchaseOrder();
  const sendOrder = useSendOrder();
  const approveOrder = useApproveOrder();
  const duplicateOrder = useDuplicateOrder();
  const reopenOrder = useReopenOrder();
  const cancelOrder = useCancelOrder();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<OrderFormValues>();
  const { data: supplierOptions } = useSupplierOptions();
  const { data: productOptions } = useProducts({ page: 1, perPage: 50 });

  async function onSubmit(values: OrderFormValues) {
    if (!activeBranchId) return;
    await createOrder.mutateAsync({
      branchId: activeBranchId,
      payload: { supplierId: values.supplierId, items: [{ productId: values.productId, quantity: values.quantity, unitCost: values.unitCost }] },
    });
    form.reset();
    setIsOpen(false);
  }

  const columns: ColumnDef<PurchaseOrder, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => <span className="font-numeric font-medium">{row.original.code}</span>,
    },
    {
      id: 'supplier',
      header: 'Fornecedor',
      cell: ({ row }) => row.original.supplier.tradeName ?? row.original.supplier.name,
    },
    {
      accessorKey: 'issueDate',
      header: 'Emissão',
      cell: ({ row }) => <span className="font-numeric">{formatDate(row.original.issueDate)}</span>,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => <span className="font-numeric">{formatCurrencyBRL(Number(row.original.totalAmount))}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{orderStatusLabels[row.original.status]}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" asChild>
              <a href={`${env.apiUrl}/purchasing/orders/${order.id}/pdf`} target="_blank" rel="noreferrer" aria-label="Imprimir PDF">
                <FileText className="size-3.5" />
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Mais ações">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {order.status === 'draft' && can('purchases', 'update') && (
                  <DropdownMenuItem onClick={() => sendOrder.mutate({ id: order.id, estimatedValue: Number(order.totalAmount) })}>
                    <Send className="mr-2 size-4" /> Enviar
                  </DropdownMenuItem>
                )}
                {can('purchases', 'approve') && (
                  <DropdownMenuItem onClick={() => approveOrder.mutate(order.id)}>
                    <CheckCircle2 className="mr-2 size-4" /> Aprovar
                  </DropdownMenuItem>
                )}
                {can('purchases', 'create') && (
                  <DropdownMenuItem onClick={() => duplicateOrder.mutate(order.id)}>
                    <Copy className="mr-2 size-4" /> Duplicar
                  </DropdownMenuItem>
                )}
                {order.status === 'cancelled' && can('purchases', 'update') && (
                  <DropdownMenuItem onClick={() => reopenOrder.mutate(order.id)}>
                    <RotateCcw className="mr-2 size-4" /> Reabrir
                  </DropdownMenuItem>
                )}
                {order.status !== 'received' && order.status !== 'cancelled' && can('purchases', 'cancel') && (
                  <DropdownMenuItem onClick={() => cancelOrder.mutate(order.id)} className="text-destructive focus:text-destructive">
                    <Ban className="mr-2 size-4" /> Cancelar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pedidos de Compra"
        description="Gerados manualmente ou automaticamente a partir de uma cotação adjudicada."
        actions={
          <>
            {can('purchases', 'export') && (
              <Button variant="outline" asChild>
                <a href={`${env.apiUrl}/purchasing/orders/export?format=xlsx`} target="_blank" rel="noreferrer">
                  <Download /> Exportar
                </a>
              </Button>
            )}
            {can('purchases', 'create') && (
              <Button onClick={() => setIsOpen(true)}>
                <Plus /> Novo pedido
              </Button>
            )}
          </>
        }
      />

      <AdvancedDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1}
        onPageChange={setPage}
        exportFileName="pedidos-compra"
        emptyMessage="Nenhum pedido de compra registrado ainda."
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo pedido de compra</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Fornecedor" required>
              <Autocomplete
                value={form.watch('supplierId') ?? null}
                onChange={(v) => form.setValue('supplierId', v ?? '', { shouldValidate: true })}
                options={(supplierOptions ?? []).map((s) => ({ value: s.id, label: s.name ?? s.code ?? s.id }))}
                placeholder="Buscar fornecedor..."
              />
            </FormField>
            <FormField label="Produto" required>
              <Autocomplete
                value={form.watch('productId') ?? null}
                onChange={(v) => form.setValue('productId', v ?? '', { shouldValidate: true })}
                options={(productOptions?.data ?? []).map((p) => ({ value: p.id, label: `${p.internalCode} — ${p.shortDescription}` }))}
                placeholder="Buscar produto..."
              />
            </FormField>
            <FormField label="Quantidade" required>
              <Input type="number" step="0.0001" {...form.register('quantity', { required: true, valueAsNumber: true })} className="font-numeric" />
            </FormField>
            <FormField label="Custo unitário" required>
              <MoneyInput valueInCents={Math.round((form.watch('unitCost') ?? 0) * 100)} onValueChange={(cents) => form.setValue('unitCost', cents / 100)} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createOrder.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
