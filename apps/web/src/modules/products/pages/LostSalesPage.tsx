import { useState } from 'react';
import { Plus, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { EmptyState } from '@/components/common/EmptyState';
import { StatsCard } from '@/components/ui/stats-card';
import { Autocomplete } from '@/components/ui/autocomplete';
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
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useCustomers } from '@/modules/mdm/hooks/useMdm';
import { useProducts } from '@/modules/products/hooks/useProducts';
import {
  useCreateLostSale,
  useLostSales,
  useLostSalesSummary,
  type CreateLostSalePayload,
  type LostSaleReason,
} from '../services/lost-sales.service';

const reasonLabels: Record<LostSaleReason, string> = {
  out_of_stock: 'Sem estoque',
  price_too_high: 'Preço alto',
  product_not_found: 'Produto não encontrado',
  customer_gave_up: 'Cliente desistiu',
  lost_to_competitor: 'Perdeu pro concorrente',
  other: 'Outro motivo',
};

/** Vendas Perdidas — registro rápido do que o cliente queria e não conseguimos vender, e por quê. Alimenta a decisão de compra (Sugestão de Compra já cruza isso). */
export default function LostSalesPage() {
  const { can } = usePermissions();
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const { data: lostSales, isLoading } = useLostSales();
  const { data: summary } = useLostSalesSummary();
  const createLostSale = useCreateLostSale();
  const { data: customerOptions } = useCustomers({ page: 1, perPage: 50 });
  const { data: productOptions } = useProducts({ page: 1, perPage: 100 });

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<CreateLostSalePayload>({ reason: 'out_of_stock' });

  async function handleSubmit() {
    if (!activeBranchId) return;
    await createLostSale.mutateAsync({ branchId: activeBranchId, payload: form });
    setIsOpen(false);
    setForm({ reason: 'out_of_stock' });
  }

  const topReason = summary?.slice().sort((a, b) => b.count - a.count)[0];

  return (
    <div>
      <PageHeader
        title="Vendas Perdidas"
        description="Registre rápido o que o cliente queria e não conseguimos vender — vira dado pra decisão de compra."
        actions={
          can('sales', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Registrar venda perdida
            </Button>
          )
        }
      />

      {!!summary?.length && (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatsCard label="Total registrado" value={String(summary.reduce((sum, s) => sum + s.count, 0))} icon={TrendingDown} />
          {topReason && <StatsCard label="Principal motivo" value={reasonLabels[topReason.reason]} icon={TrendingDown} />}
        </div>
      )}

      {isLoading ? null : !lostSales || lostSales.length === 0 ? (
        <EmptyState icon={TrendingDown} title="Nenhuma venda perdida registrada" description="Registre quando um cliente não fechar a compra por falta de estoque, preço ou outro motivo." />
      ) : (
        <div className="space-y-2">
          {lostSales.map((ls) => (
            <Card key={ls.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ls.product?.shortDescription ?? ls.productDescription ?? 'Produto não especificado'}</span>
                    <Badge variant="warning">{reasonLabels[ls.reason]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ls.customer?.name ?? 'Cliente não identificado'} · {formatDate(ls.createdAt)}
                  </p>
                  {ls.notes && <p className="mt-1 text-xs text-muted-foreground">{ls.notes}</p>}
                </div>
                {ls.estimatedValue && <span className="font-numeric text-sm text-muted-foreground">{formatCurrencyBRL(Number(ls.estimatedValue))}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar venda perdida</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Produto (se estiver no catálogo)">
              <Autocomplete
                value={form.productId ?? null}
                onChange={(v) => setForm((f) => ({ ...f, productId: v ?? undefined }))}
                options={(productOptions?.data ?? []).map((p) => ({ value: p.id, label: `${p.internalCode} — ${p.shortDescription}` }))}
                placeholder="Buscar produto..."
              />
            </FormField>
            <FormField label="Ou descreva o que o cliente pediu" hint="Use quando o produto não está no catálogo">
              <Input value={form.productDescription ?? ''} onChange={(e) => setForm((f) => ({ ...f, productDescription: e.target.value }))} />
            </FormField>
            <FormField label="Cliente">
              <Autocomplete
                value={form.customerId ?? null}
                onChange={(v) => setForm((f) => ({ ...f, customerId: v ?? undefined }))}
                options={(customerOptions?.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Buscar cliente (opcional)..."
              />
            </FormField>
            <FormField label="Motivo" required>
              <Select value={form.reason} onValueChange={(v) => setForm((f) => ({ ...f, reason: v as LostSaleReason }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reasonLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Valor estimado (R$)">
                <Input type="number" step="0.01" value={form.estimatedValue ?? ''} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: Number(e.target.value) }))} className="font-numeric" />
              </FormField>
              <FormField label="Observações">
                <Input value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} isLoading={createLostSale.isPending} disabled={!activeBranchId}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
