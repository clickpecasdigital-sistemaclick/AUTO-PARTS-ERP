import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';
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
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useApproveReturn, useCreateReturn, usePdvReturns } from '../hooks/usePdv';
import { returnStatusLabels, returnTypeLabels, type SaleReturnStatus, type SaleReturnType } from '../types/pdv.types';

const statusVariant: Record<SaleReturnStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  completed: 'success',
};

interface ReturnFormValues {
  saleId: string;
  type: SaleReturnType;
  reason: string;
  saleItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

/** Devoluções — parcial, total, troca, crédito ao cliente (briefing). */
export default function PdvReturnsPage() {
  const { can } = usePermissions();
  const { data: returns, isLoading } = usePdvReturns();
  const createReturn = useCreateReturn();
  const approveReturn = useApproveReturn();
  const [isOpen, setIsOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const form = useForm<ReturnFormValues>({ defaultValues: { type: 'partial' } });

  async function onSubmit(values: ReturnFormValues) {
    await createReturn.mutateAsync({
      saleId: values.saleId,
      payload: { type: values.type, reason: values.reason, items: [{ saleItemId: values.saleItemId, productId: values.productId, quantity: values.quantity, unitPrice: values.unitPrice }] },
    });
    form.reset({ type: 'partial' });
    setIsOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Devoluções"
        description="Devolução parcial, total ou troca — com crédito opcional ao cliente."
        actions={
          can('sales', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <RotateCcw /> Nova devolução
            </Button>
          )
        }
      />

      {isLoading ? null : !returns || returns.length === 0 ? (
        <EmptyState icon={RotateCcw} title="Nenhuma devolução registrada" description="Registre uma devolução a partir do ID da venda original." />
      ) : (
        <div className="space-y-3">
          {returns.map((saleReturn) => (
            <Card key={saleReturn.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[saleReturn.status]}>{returnStatusLabels[saleReturn.status]}</Badge>
                    <Badge variant="outline">{returnTypeLabels[saleReturn.type]}</Badge>
                    {saleReturn.creditIssued && <Badge variant="success">Crédito: {formatCurrencyBRL(Number(saleReturn.creditAmount))}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{saleReturn.reason}</p>
                  <p className="text-xs text-muted-foreground font-numeric">{formatDate(saleReturn.createdAt, true)} · {saleReturn.items.length} item(ns)</p>
                </div>
                {saleReturn.status === 'pending' && can('sales', 'approve') && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setApprovingId(saleReturn.id)}>
                      <CheckCircle2 /> Aprovar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova devolução</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Venda (ID)" required>
              <Input {...form.register('saleId', { required: true })} placeholder="uuid da venda original" />
            </FormField>
            <FormField label="Tipo" required>
              <Select onValueChange={(v) => form.setValue('type', v as SaleReturnType)} value={form.watch('type')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(returnTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Motivo" required>
              <Input {...form.register('reason', { required: true })} />
            </FormField>
            <FormField label="Item da venda (ID)" required>
              <Input {...form.register('saleItemId', { required: true })} placeholder="uuid do SaleItem original" />
            </FormField>
            <FormField label="Produto (ID)" required>
              <Input {...form.register('productId', { required: true })} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Quantidade" required>
                <Input type="number" step="0.0001" {...form.register('quantity', { required: true, valueAsNumber: true })} className="font-numeric" />
              </FormField>
              <FormField label="Preço unitário" required>
                <Input type="number" step="0.01" {...form.register('unitPrice', { required: true, valueAsNumber: true })} className="font-numeric" />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createReturn.isPending}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!approvingId} onOpenChange={(open) => !open && setApprovingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar devolução</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">O estoque será atualizado automaticamente. Deseja emitir crédito ao cliente pelo valor devolvido?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                if (approvingId) await approveReturn.mutateAsync({ id: approvingId, issueCredit: false });
                setApprovingId(null);
              }}
            >
              <X /> Sem crédito
            </Button>
            <Button
              onClick={async () => {
                if (approvingId) await approveReturn.mutateAsync({ id: approvingId, issueCredit: true });
                setApprovingId(null);
              }}
              isLoading={approveReturn.isPending}
            >
              <CheckCircle2 /> Aprovar com crédito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
