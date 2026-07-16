import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Send } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { formatDate } from '@/utils/formatters';
import { useCreatePurchaseRequest, usePurchaseRequests, useSubmitPurchaseRequest } from '../hooks/usePurchasing';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useProducts } from '@/modules/products/hooks/useProducts';
import { priorityLabels, requestStatusLabels, type PurchasePriority, type PurchaseRequestStatus } from '../types/purchasing.types';

const statusVariant: Record<PurchaseRequestStatus, 'secondary' | 'warning' | 'success' | 'destructive' | 'default'> = {
  draft: 'secondary',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'destructive',
  quoting: 'default',
  converted: 'success',
  cancelled: 'destructive',
};

interface RequestFormValues {
  justification: string;
  priority: PurchasePriority;
  isUrgent: boolean;
  productId: string;
  quantity: number;
}

/** Solicitação de Compra — a "Necessidade" que inicia o ciclo. */
export default function PurchaseRequestsPage() {
  const { can } = usePermissions();
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const { data, isLoading } = usePurchaseRequests();
  const createRequest = useCreatePurchaseRequest();
  const submitRequest = useSubmitPurchaseRequest();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<RequestFormValues>({ defaultValues: { priority: 'normal', isUrgent: false } });
  const { data: productOptions } = useProducts({ page: 1, perPage: 50 });

  async function onSubmit(values: RequestFormValues) {
    if (!activeBranchId) {
      form.setError('justification', { message: 'Selecione uma filial ativa no topo da tela antes de criar uma solicitação.' });
      return;
    }
    await createRequest.mutateAsync({
      branchId: activeBranchId,
      payload: {
        justification: values.justification,
        priority: values.priority,
        isUrgent: values.isUrgent,
        items: [{ productId: values.productId, quantity: values.quantity }],
      },
    });
    form.reset({ priority: 'normal', isUrgent: false });
    setIsOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Solicitações de Compra"
        description="A necessidade que inicia o ciclo de abastecimento — com centro de custo, departamento, prioridade e justificativa."
        actions={
          can('purchases', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Nova solicitação
            </Button>
          )
        }
      />

      {isLoading ? null : !data?.data || data.data.length === 0 ? (
        <EmptyState title="Nenhuma solicitação registrada" description="Crie a primeira solicitação de compra." />
      ) : (
        <div className="space-y-3">
          {data.data.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-medium">{request.code}</span>
                    <Badge variant={statusVariant[request.status]}>{requestStatusLabels[request.status]}</Badge>
                    <Badge variant="outline">{priorityLabels[request.priority]}</Badge>
                    {request.isUrgent && <Badge variant="destructive">Urgente</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{request.justification}</p>
                  <p className="text-xs text-muted-foreground font-numeric">{formatDate(request.requestedAt, true)} · {request.items.length} item(ns)</p>
                </div>
                {request.status === 'draft' && can('purchases', 'create') && (
                  <Button size="sm" variant="outline" onClick={() => submitRequest.mutate({ id: request.id, estimatedValue: 0 })}>
                    <Send /> Submeter
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Compra</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Justificativa" required>
              <Textarea {...form.register('justification', { required: true })} rows={3} />
            </FormField>
            <FormField label="Prioridade">
              <Select onValueChange={(v) => form.setValue('priority', v as PurchasePriority)} value={form.watch('priority')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('isUrgent')} className="size-4 rounded border-input" />
              Marcar como urgente
            </label>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createRequest.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
