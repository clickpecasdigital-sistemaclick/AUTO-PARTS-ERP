import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
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
import { DataTable } from '@/components/ui/data-table';
import { usePagination } from '@/hooks/usePagination';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useProducts } from '@/modules/products/hooks/useProducts';
import { usePermissions } from '@/hooks/usePermissions';
import { useCreateMovement, useStockMovements, useWarehouses } from '../hooks/useInventory';
import { stockMovementTypeLabels, type StockMovementType } from '../types/inventory.types';
import { movementColumns } from '../components/movement-columns';
import { REASON_REQUIRED_MOVEMENT_TYPES } from '../components/movement-constants';

interface MovementFormValues {
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  reason?: string;
  notes?: string;
}

/** Movimentações de Estoque: ledger completo + registro manual (entrada, saída, ajuste, perda, quebra, consumo interno, bonificação). */
export default function StockMovementsPage() {
  const { can } = usePermissions();
  const { page, setPage } = usePagination();
  const { data: warehouses } = useWarehouses();
  const { data, isLoading } = useStockMovements({ page, perPage: 20 });
  const createMovement = useCreateMovement();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<MovementFormValues>();
  const { data: productOptions } = useProducts({ page: 1, perPage: 50 });
  const selectedType = form.watch('type');
  const reasonRequired = REASON_REQUIRED_MOVEMENT_TYPES.includes(selectedType);

  async function onSubmit(values: MovementFormValues) {
    await createMovement.mutateAsync(values as unknown as Record<string, unknown>);
    form.reset();
    setIsOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Movimentações de Estoque"
        description="Ledger completo de entradas, saídas, ajustes e transferências — auditado integralmente."
        actions={
          can('stock', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Nova movimentação
            </Button>
          )
        }
      />

      <DataTable
        columns={movementColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1}
        onPageChange={setPage}
        emptyMessage="Nenhuma movimentação registrada ainda."
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova movimentação</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Produto" required>
              <Autocomplete
                value={form.watch('productId') ?? null}
                onChange={(v) => form.setValue('productId', v ?? '', { shouldValidate: true })}
                options={(productOptions?.data ?? []).map((p) => ({ value: p.id, label: `${p.internalCode} — ${p.shortDescription}` }))}
                placeholder="Buscar produto..."
              />
            </FormField>
            <FormField label="Depósito" required>
              <Select onValueChange={(v) => form.setValue('warehouseId', v)} value={form.watch('warehouseId')}>
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
            <FormField label="Tipo" required>
              <Select onValueChange={(v) => form.setValue('type', v as StockMovementType)} value={selectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stockMovementTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Quantidade" required>
              <Input type="number" step="0.0001" {...form.register('quantity', { required: true, valueAsNumber: true })} className="font-numeric" />
            </FormField>
            <FormField label="Custo unitário">
              <Input type="number" step="0.0001" {...form.register('unitCost', { valueAsNumber: true })} className="font-numeric" />
            </FormField>
            <FormField label="Motivo" required={reasonRequired} hint={reasonRequired ? 'Obrigatório para este tipo de movimentação' : undefined}>
              <Input {...form.register('reason')} />
            </FormField>
            <FormField label="Observações">
              <Textarea {...form.register('notes')} rows={2} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createMovement.isPending}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
