import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { Package, Plus } from 'lucide-react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
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
import { useWarehouses } from '@/modules/inventory/hooks/useInventory';
import { useCreateMovement } from '@/modules/inventory/hooks/useInventory';
import type { ProductFormValues } from '../../schemas/product.schema';
import type { Product } from '../../types/product.types';

interface StockTabProps {
  product?: Product;
}

/**
 * Aba 3 — Estoque: parâmetros (mínimo/máximo) editáveis aqui. O saldo
 * (`product.stocks`) é somente leitura — a origem da verdade é sempre uma
 * movimentação (auditável). O botão "Ajustar estoque" abaixo não quebra
 * essa regra: ele só abre um atalho pra criar a movimentação sem sair da
 * tela, em vez de forçar ir em Estoque > Movimentações separadamente.
 */
export function StockTab({ product }: StockTabProps) {
  const { register, formState: { errors } } = useFormContext<ProductFormValues>();
  const totalOnHand = product?.stocks?.reduce((sum, s) => sum + Number(s.quantityOnHand), 0) ?? 0;

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const { data: warehouses } = useWarehouses();
  const createMovement = useCreateMovement();
  const queryClient = useQueryClient();

  async function handleAdjust() {
    if (!product || !warehouseId || !delta || !reason) return;
    const quantity = Math.abs(Number(delta));
    if (!quantity) return;
    await createMovement.mutateAsync({
      productId: product.id,
      warehouseId,
      type: Number(delta) >= 0 ? 'adjustment_in' : 'adjustment_out',
      quantity,
      reason,
    });
    queryClient.invalidateQueries({ queryKey: ['products', product.id] });
    setIsAdjustOpen(false);
    setDelta('');
    setReason('');
  }

  return (
    <div className="space-y-6">
      {product && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Estoque atual (todos os depósitos)" value={String(totalOnHand)} icon={Package} />
        </div>
      )}

      <Alert variant="info" title="Saldo somente leitura aqui">
        Estoque mínimo/máximo são parâmetros deste cadastro. O saldo em si só muda por movimentação (entrada/saída),
        pra manter histórico de quem alterou e por quê — use o botão abaixo pra ajustar rápido sem sair desta tela.
      </Alert>

      {product && (
        <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(true)}>
          <Plus /> Ajustar estoque
        </Button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Estoque mínimo" error={errors.minStock?.message}>
          <Input type="number" step="0.0001" {...register('minStock')} className="font-numeric" />
        </FormField>
        <FormField label="Estoque máximo" error={errors.maxStock?.message}>
          <Input type="number" step="0.0001" {...register('maxStock')} className="font-numeric" />
        </FormField>
      </div>

      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Depósito" required>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o depósito" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Quantidade" required hint="Positivo adiciona, negativo remove (ex: -3 pra tirar 3 unidades)">
              <Input type="number" step="0.0001" value={delta} onChange={(e) => setDelta(e.target.value)} className="font-numeric" />
            </FormField>
            <FormField label="Motivo do ajuste" required>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: contagem de inventário, avaria..." />
            </FormField>
          </div>
          <DialogFooter>
            <Button onClick={handleAdjust} isLoading={createMovement.isPending} disabled={!warehouseId || !delta || !reason}>
              Confirmar ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
