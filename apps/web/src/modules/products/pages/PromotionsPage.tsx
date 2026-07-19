import { useState } from 'react';
import { Plus, Tag, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
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
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useProducts } from '../hooks/useProducts';
import { useCreatePromotion, useDeactivatePromotion, usePromotions, type CreatePromotionPayload, type PromotionType } from '../services/promotions.service';

const typeLabel: Record<PromotionType, string> = {
  percentage_discount: 'Desconto percentual',
  fixed_discount: 'Desconto em R$',
  fixed_price: 'Preço fixo promocional',
};

function formatValue(type: PromotionType, value: string) {
  if (type === 'percentage_discount') return `${Number(value).toFixed(1)}%`;
  return formatCurrencyBRL(Number(value));
}

/** Promoções de produto — desconto percentual, valor fixo ou preço promocional, por período. */
export default function PromotionsPage() {
  const { can } = usePermissions();
  const { data: promotions, isLoading } = usePromotions();
  const deactivatePromotion = useDeactivatePromotion();
  const createPromotion = useCreatePromotion();
  const { data: productOptions } = useProducts({ page: 1, perPage: 100 });

  const [isOpen, setIsOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [form, setForm] = useState<CreatePromotionPayload>({ type: 'percentage_discount', value: 0, startDate: '', endDate: '' });

  async function handleCreate() {
    if (!productId || !form.startDate || !form.endDate || !form.value) return;
    await createPromotion.mutateAsync({ productId, payload: form });
    setIsOpen(false);
    setProductId('');
    setForm({ type: 'percentage_discount', value: 0, startDate: '', endDate: '' });
  }

  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Promoções"
        description="Descontos e preços promocionais por período. A aplicação automática no PDV é um refinamento futuro — hoje o desconto pode ser aplicado manualmente na venda."
        actions={
          can('products', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Nova promoção
            </Button>
          )
        }
      />

      {isLoading ? null : !promotions || promotions.length === 0 ? (
        <EmptyState icon={Tag} title="Nenhuma promoção cadastrada" description="Cadastre uma promoção pra destacar um produto por um período." />
      ) : (
        <div className="space-y-2">
          {promotions.map((p) => {
            const isExpired = new Date(p.endDate) < now;
            return (
              <Card key={p.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.product.shortDescription}</span>
                      <Badge variant="outline">{typeLabel[p.type]}</Badge>
                      <Badge variant={!p.isActive ? 'secondary' : isExpired ? 'destructive' : 'success'}>
                        {!p.isActive ? 'Inativa' : isExpired ? 'Vencida' : 'Ativa'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-numeric">
                      {p.product.internalCode} · De {formatDate(p.startDate)} até {formatDate(p.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-numeric font-semibold">{formatValue(p.type, p.value)}</span>
                    {p.isActive && can('products', 'update') && (
                      <Button variant="ghost" size="icon-sm" onClick={() => deactivatePromotion.mutate(p.id)} title="Desativar">
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova promoção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Produto" required>
              <Autocomplete
                value={productId || null}
                onChange={(v) => setProductId(v ?? '')}
                options={(productOptions?.data ?? []).map((p) => ({ value: p.id, label: `${p.internalCode} — ${p.shortDescription}` }))}
                placeholder="Buscar produto..."
              />
            </FormField>
            <FormField label="Tipo" required>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as PromotionType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={form.type === 'percentage_discount' ? 'Valor (%)' : 'Valor (R$)'} required>
              <Input type="number" step="0.01" value={form.value || ''} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} className="font-numeric" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Início" required>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </FormField>
              <FormField label="Fim" required>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} isLoading={createPromotion.isPending} disabled={!productId || !form.value || !form.startDate || !form.endDate}>
              Criar promoção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
