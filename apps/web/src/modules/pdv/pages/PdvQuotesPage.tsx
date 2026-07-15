import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, FileText, Mail, Plus, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
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
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useApproveQuote, useConvertQuoteToOrder, useCreateQuote, usePdvQuotes, useSendQuote } from '../hooks/usePdv';
import { quoteStatusLabels, type QuoteStatus } from '../types/pdv.types';

const statusVariant: Record<QuoteStatus, 'secondary' | 'warning' | 'success' | 'destructive' | 'default'> = {
  draft: 'secondary',
  sent: 'warning',
  approved: 'success',
  rejected: 'destructive',
  expired: 'destructive',
  converted: 'default',
};

interface QuoteFormValues {
  customerId: string;
  validUntil?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

/** Orçamentos — criação, aprovação, envio por e-mail, conversão em Pedido (briefing). */
export default function PdvQuotesPage() {
  const { can } = usePermissions();
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const { data: quotes, isLoading } = usePdvQuotes();
  const createQuote = useCreateQuote();
  const approveQuote = useApproveQuote();
  const convertToOrder = useConvertQuoteToOrder();
  const sendQuote = useSendQuote();
  const [isOpen, setIsOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');

  const form = useForm<QuoteFormValues>();

  async function onSubmit(values: QuoteFormValues) {
    if (!activeBranchId) return;
    await createQuote.mutateAsync({
      branchId: activeBranchId,
      payload: { customerId: values.customerId, validUntil: values.validUntil, items: [{ productId: values.productId, quantity: values.quantity, unitPrice: values.unitPrice }] },
    });
    form.reset();
    setIsOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Validade, aprovação, envio por e-mail e conversão para Pedido."
        actions={
          can('sales', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Novo orçamento
            </Button>
          )
        }
      />

      {isLoading ? null : !quotes || quotes.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum orçamento registrado" description="Crie o primeiro orçamento." />
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <Card key={quote.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-medium">{quote.code}</span>
                    <Badge variant={statusVariant[quote.status]}>{quoteStatusLabels[quote.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{quote.customer.tradeName ?? quote.customer.name}</p>
                  <p className="text-xs text-muted-foreground font-numeric">
                    {formatDate(quote.createdAt)} {quote.validUntil && `· Válido até ${formatDate(quote.validUntil)}`} · {formatCurrencyBRL(Number(quote.totalAmount))}
                  </p>
                </div>
                <div className="flex gap-2">
                  {quote.status === 'draft' && can('sales', 'approve') && (
                    <Button size="sm" variant="outline" onClick={() => approveQuote.mutate(quote.id)}>
                      <CheckCircle2 /> Aprovar
                    </Button>
                  )}
                  {quote.status !== 'converted' && can('sales', 'export') && (
                    <Button size="sm" variant="outline" onClick={() => setSendingId(quote.id)}>
                      <Mail /> Enviar
                    </Button>
                  )}
                  {quote.status === 'approved' && can('sales', 'create') && (
                    <Button size="sm" onClick={() => convertToOrder.mutate(quote.id)} isLoading={convertToOrder.isPending}>
                      <ShoppingCart /> Converter em Pedido
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
            <DialogTitle>Novo orçamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Cliente (ID)" required>
              <Input {...form.register('customerId', { required: true })} placeholder="uuid do cliente" />
            </FormField>
            <FormField label="Válido até">
              <Input type="date" {...form.register('validUntil')} />
            </FormField>
            <FormField label="Produto (ID)" required>
              <Input {...form.register('productId', { required: true })} placeholder="uuid do produto" />
            </FormField>
            <FormField label="Quantidade" required>
              <Input type="number" step="0.0001" {...form.register('quantity', { required: true, valueAsNumber: true })} className="font-numeric" />
            </FormField>
            <FormField label="Preço unitário" required>
              <Input type="number" step="0.01" {...form.register('unitPrice', { required: true, valueAsNumber: true })} className="font-numeric" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createQuote.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sendingId} onOpenChange={(open) => !open && setSendingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar orçamento por e-mail</DialogTitle>
          </DialogHeader>
          <FormField label="E-mail de destino" required>
            <Input type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendingId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (sendingId) await sendQuote.mutateAsync({ id: sendingId, sentTo: emailDraft });
                setSendingId(null);
                setEmailDraft('');
              }}
              isLoading={sendQuote.isPending}
            >
              Marcar como enviado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
