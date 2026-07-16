import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, CheckCircle2, Plus, Truck, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
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
import { formatDate } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useProducts } from '@/modules/products/hooks/useProducts';
import {
  useCancelTransfer,
  useCreateTransfer,
  useReceiveTransfer,
  useShipTransfer,
  useStockTransfers,
  useWarehouses,
} from '../hooks/useInventory';
import type { StockTransferStatus } from '../types/inventory.types';

const statusLabels: Record<StockTransferStatus, string> = {
  pending: 'Pendente',
  in_transit: 'Em trânsito',
  received: 'Recebida',
  cancelled: 'Cancelada',
};
const statusVariant: Record<StockTransferStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  pending: 'secondary',
  in_transit: 'warning',
  received: 'success',
  cancelled: 'destructive',
};

interface TransferFormValues {
  originWarehouseId: string;
  destinationWarehouseId: string;
  reason: string;
  productId: string;
  quantity: number;
}

/** Transferências entre Depósitos/Filiais/Empresas — fluxo Criar → Expedir → Receber, com motivo e observações registrados. */
export default function StockTransfersPage() {
  const { can } = usePermissions();
  const { data: warehouses } = useWarehouses();
  const { data: transfers, isLoading } = useStockTransfers();
  const createTransfer = useCreateTransfer();
  const shipTransfer = useShipTransfer();
  const receiveTransfer = useReceiveTransfer();
  const cancelTransfer = useCancelTransfer();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TransferFormValues>();
  const { data: productOptions } = useProducts({ page: 1, perPage: 50 });

  async function onSubmit(values: TransferFormValues) {
    await createTransfer.mutateAsync({
      originWarehouseId: values.originWarehouseId,
      destinationWarehouseId: values.destinationWarehouseId,
      reason: values.reason,
      items: [{ productId: values.productId, quantity: values.quantity }],
    });
    form.reset();
    setIsOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Transferências de Estoque"
        description="Movimentação entre depósitos, filiais e empresas — sempre com usuário, data, origem, destino e motivo registrados."
        actions={
          can('stock', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Nova transferência
            </Button>
          )
        }
      />

      {isLoading ? null : !transfers || transfers.length === 0 ? (
        <EmptyState icon={Truck} title="Nenhuma transferência registrada" description="Crie uma transferência entre depósitos." />
      ) : (
        <div className="space-y-3">
          {transfers.map((transfer) => (
            <Card key={transfer.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-medium">{transfer.code}</span>
                    <Badge variant={statusVariant[transfer.status]}>{statusLabels[transfer.status]}</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    {transfer.originWarehouse.name} <ArrowRight className="size-3.5" /> {transfer.destinationWarehouse.name}
                  </p>
                  {transfer.reason && <p className="text-xs text-muted-foreground">Motivo: {transfer.reason}</p>}
                  <p className="text-xs text-muted-foreground font-numeric">Criada em {formatDate(transfer.createdAt, true)}</p>
                </div>
                <div className="flex gap-2">
                  {transfer.status === 'pending' && can('stock', 'update') && (
                    <Button size="sm" variant="outline" onClick={() => shipTransfer.mutate(transfer.id)} isLoading={shipTransfer.isPending}>
                      <Truck /> Expedir
                    </Button>
                  )}
                  {transfer.status === 'in_transit' && can('stock', 'update') && (
                    <Button size="sm" onClick={() => receiveTransfer.mutate(transfer.id)} isLoading={receiveTransfer.isPending}>
                      <CheckCircle2 /> Receber
                    </Button>
                  )}
                  {(transfer.status === 'pending' || transfer.status === 'in_transit') && can('stock', 'cancel') && (
                    <Button size="sm" variant="ghost" onClick={() => cancelTransfer.mutate(transfer.id)}>
                      <X /> Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova transferência</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Depósito de origem" required>
              <Select onValueChange={(v) => form.setValue('originWarehouseId', v)} value={form.watch('originWarehouseId')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Depósito de destino" required>
              <Select onValueChange={(v) => form.setValue('destinationWarehouseId', v)} value={form.watch('destinationWarehouseId')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <FormField label="Motivo">
              <Input {...form.register('reason')} placeholder="Ex: reabastecimento entre filiais" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createTransfer.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
