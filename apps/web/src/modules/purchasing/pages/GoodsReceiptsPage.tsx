import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Barcode, CheckCircle2, Package, Plus, ScanLine } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate } from '@/utils/formatters';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useWarehouses } from '@/modules/inventory/hooks/useInventory';
import {
  useConferItem,
  useCreateGoodsReceipt,
  useFinalizeReceipt,
  useGoodsReceipt,
  useGoodsReceipts,
  usePurchaseOrders,
} from '../hooks/usePurchasing';
import type { GoodsReceiptItemDisposition, GoodsReceiptStatus } from '../types/purchasing.types';

const statusLabels: Record<GoodsReceiptStatus, string> = { pending: 'Pendente', confirmed: 'Confirmado', cancelled: 'Cancelado' };
const dispositionVariant: Record<GoodsReceiptItemDisposition, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  pending: 'secondary',
  accepted: 'success',
  partially_accepted: 'warning',
  rejected: 'destructive',
};
const dispositionLabels: Record<GoodsReceiptItemDisposition, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  partially_accepted: 'Aceite parcial',
  rejected: 'Recusado',
};

interface ReceiptFormValues {
  purchaseOrderId: string;
  warehouseId: string;
  invoiceNumber: string;
}

/** Recebimento e Conferência — registra a chegada física e confere item a item (manual, código de barras ou QR Code). */
export default function GoodsReceiptsPage() {
  const { can } = usePermissions();
  const { data: receipts, isLoading } = useGoodsReceipts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: receipt } = useGoodsReceipt(selectedId ?? undefined);
  const createReceipt = useCreateGoodsReceipt();
  const conferItem = useConferItem(selectedId ?? '');
  const finalizeReceipt = useFinalizeReceipt(selectedId ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { accepted: number; rejected: number }>>({});

  const form = useForm<ReceiptFormValues>();
  const { data: warehouses } = useWarehouses();
  const { data: openOrders } = usePurchaseOrders({ status: 'approved' });

  async function onSubmit(values: ReceiptFormValues) {
    await createReceipt.mutateAsync(values as unknown as Record<string, unknown>);
    form.reset();
    setIsOpen(false);
  }

  function handleConfer(itemId: string) {
    const draft = drafts[itemId];
    if (!draft) return;
    conferItem.mutate({ goodsReceiptItemId: itemId, acceptedQuantity: draft.accepted, rejectedQuantity: draft.rejected, conferredVia: 'manual' });
  }

  return (
    <div>
      <PageHeader
        title="Recebimento e Conferência"
        description="Transportadora, volumes, peso, frete, NF do fornecedor — conferência manual ou por código de barras/QR Code."
        actions={
          can('purchases', 'update') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Novo recebimento
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {isLoading ? null : !receipts || receipts.length === 0 ? (
            <EmptyState icon={Package} title="Nenhum recebimento" description="Registre o recebimento de um pedido de compra." />
          ) : (
            <div className="space-y-2">
              {receipts.map((r) => (
                <Card
                  key={r.id}
                  className={`cursor-pointer transition-shadow duration-base hover:shadow-md ${selectedId === r.id ? 'ring-1 ring-primary' : ''}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-numeric text-sm font-medium">{r.code}</span>
                      <Badge variant={r.status === 'confirmed' ? 'success' : 'secondary'}>{statusLabels[r.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-numeric">{formatDate(r.receivedAt, true)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!receipt ? (
            <EmptyState title="Selecione um recebimento" description="Escolha um recebimento na lista para conferir os itens." />
          ) : (
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanLine className="size-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Confira cada item — use um leitor de código de barras/QR Code ou digite manualmente.</p>
                  </div>
                  {receipt.status === 'pending' && can('purchases', 'approve') && (
                    <Button size="sm" onClick={() => finalizeReceipt.mutate(undefined)} isLoading={finalizeReceipt.isPending}>
                      <CheckCircle2 /> Finalizar (entra no estoque)
                    </Button>
                  )}
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-medium text-muted-foreground">Produto</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Qtd</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Aceito</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Recusado</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-2">
                          <p className="font-medium">{item.product.internalCode}</p>
                          <p className="text-xs text-muted-foreground">{item.product.shortDescription}</p>
                        </td>
                        <td className="p-2 font-numeric">{Number(item.quantity)}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="w-20 font-numeric"
                            defaultValue={Number(item.acceptedQuantity) || undefined}
                            disabled={receipt.status !== 'pending'}
                            onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: { ...d[item.id], accepted: Number(e.target.value), rejected: d[item.id]?.rejected ?? 0 } }))}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="w-20 font-numeric"
                            defaultValue={Number(item.rejectedQuantity) || undefined}
                            disabled={receipt.status !== 'pending'}
                            onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: { ...d[item.id], rejected: Number(e.target.value), accepted: d[item.id]?.accepted ?? 0 } }))}
                          />
                        </td>
                        <td className="p-2">
                          <Badge variant={dispositionVariant[item.disposition]}>{dispositionLabels[item.disposition]}</Badge>
                        </td>
                        <td className="p-2">
                          {receipt.status === 'pending' && (
                            <Button variant="ghost" size="icon-sm" onClick={() => handleConfer(item.id)} aria-label="Conferir item">
                              <Barcode className="size-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo recebimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Pedido de Compra" required>
              <Autocomplete
                value={form.watch('purchaseOrderId') ?? null}
                onChange={(v) => form.setValue('purchaseOrderId', v ?? '', { shouldValidate: true })}
                options={(openOrders?.data ?? []).map((o) => ({ value: o.id, label: o.code }))}
                placeholder="Buscar pedido aprovado..."
              />
            </FormField>
            <FormField label="Depósito" required>
              <Autocomplete
                value={form.watch('warehouseId') ?? null}
                onChange={(v) => form.setValue('warehouseId', v ?? '', { shouldValidate: true })}
                options={(warehouses ?? []).map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
                placeholder="Selecione o depósito..."
              />
            </FormField>
            <FormField label="Número da NF do fornecedor">
              <Input {...form.register('invoiceNumber')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createReceipt.isPending}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
