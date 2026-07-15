import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ClipboardList, Eye, EyeOff, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
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
import { useOpenInventory, useStockInventories, useWarehouses } from '../hooks/useInventory';
import { inventoryTypeLabels, type InventoryStatus, type InventoryType } from '../types/inventory.types';

const statusLabels: Record<InventoryStatus, string> = { open: 'Aberto', counting: 'Em contagem', reconciled: 'Reconciliado', cancelled: 'Cancelado' };
const statusVariant: Record<InventoryStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  open: 'secondary',
  counting: 'warning',
  reconciled: 'success',
  cancelled: 'destructive',
};

interface OpenInventoryFormValues {
  warehouseId: string;
  type: InventoryType;
  isBlind: boolean;
}

/** Inventário Físico: Geral, Rotativo, por Local, por Grupo, por Fabricante — com Contagem Cega e Recontagem. */
export default function StockInventoriesPage() {
  const { can } = usePermissions();
  const { data: warehouses } = useWarehouses();
  const { data: inventories, isLoading } = useStockInventories();
  const openInventory = useOpenInventory();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<OpenInventoryFormValues>({ defaultValues: { type: 'general', isBlind: false } });

  async function onSubmit(values: OpenInventoryFormValues) {
    await openInventory.mutateAsync(values as unknown as Record<string, unknown>);
    form.reset({ type: 'general', isBlind: false });
    setIsOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Inventário Físico"
        description="Contagem geral, rotativa, por local, grupo ou fabricante — com conferência, diferenças e recontagem."
        actions={
          can('stock', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Abrir inventário
            </Button>
          )
        }
      />

      {isLoading ? null : !inventories || inventories.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhum inventário aberto" description="Abra um inventário para iniciar a contagem física do estoque." />
      ) : (
        <div className="space-y-3">
          {inventories.map((inv) => (
            <Link key={inv.id} to={`/estoque/inventarios/${inv.id}`}>
              <Card className="transition-shadow duration-base hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-numeric font-medium">{inv.code}</span>
                      <Badge variant={statusVariant[inv.status]}>{statusLabels[inv.status]}</Badge>
                      <Badge variant="secondary">{inventoryTypeLabels[inv.type]}</Badge>
                      {inv.isBlind && (
                        <Badge variant="outline">
                          <EyeOff className="size-3" /> Contagem cega
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{inv._count?.items ?? inv.items?.length ?? 0} item(ns)</p>
                  </div>
                  <Eye className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir inventário</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Select onValueChange={(v) => form.setValue('type', v as InventoryType)} value={form.watch('type')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(inventoryTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('isBlind')} className="size-4 rounded border-input" />
              Contagem cega (oculta o saldo de sistema durante a contagem)
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={openInventory.isPending}>
                Abrir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
