import { useState } from 'react';
import { Award, Plus, ShoppingCart, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { formatCurrencyBRL } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useAwardQuotation,
  useGenerateOrderFromQuotation,
  usePurchaseQuotations,
  useQuotationComparison,
} from '../hooks/usePurchasing';
import type { PurchaseQuotationStatus } from '../types/purchasing.types';

const statusLabels: Record<PurchaseQuotationStatus, string> = { open: 'Aberta', comparing: 'Em comparação', awarded: 'Adjudicada', cancelled: 'Cancelada' };
const statusVariant: Record<PurchaseQuotationStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  open: 'secondary',
  comparing: 'warning',
  awarded: 'success',
  cancelled: 'destructive',
};

/**
 * Cotação — lista + comparativo automático. O comparativo (briefing: "O
 * sistema deverá destacar automaticamente a melhor proposta") é a aba
 * central: cada linha mostra preço, frete, prazo, garantia, pagamento e o
 * score ponderado, com a melhor proposta sinalizada com um troféu.
 */
export default function PurchaseQuotationsPage() {
  const { can } = usePermissions();
  const { data: quotations, isLoading } = usePurchaseQuotations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: comparison, isLoading: comparisonLoading } = useQuotationComparison(selectedId ?? undefined);
  const awardQuotation = useAwardQuotation();
  const generateOrder = useGenerateOrderFromQuotation();

  return (
    <div>
      <PageHeader
        title="Cotações"
        description="Cotação multi-fornecedor com comparativo automático — preço, IPI, ICMS, frete, prazo, garantia e condição de pagamento."
        actions={
          can('purchases', 'create') && (
            <Button>
              <Plus /> Nova cotação
            </Button>
          )
        }
      />

      {isLoading ? null : !quotations || quotations.length === 0 ? (
        <EmptyState title="Nenhuma cotação aberta" description="Abra uma cotação para solicitar propostas a fornecedores." />
      ) : (
        <Tabs defaultValue="list" onValueChange={(v) => v === 'list' && setSelectedId(null)}>
          <TabsList>
            <TabsTrigger value="list">Cotações</TabsTrigger>
            <TabsTrigger value="compare" disabled={!selectedId}>
              Comparativo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="space-y-3">
              {quotations.map((quotation) => (
                <Card key={quotation.id} className="cursor-pointer transition-shadow duration-base hover:shadow-md" onClick={() => setSelectedId(quotation.id)}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-numeric font-medium">{quotation.code}</span>
                        <Badge variant={statusVariant[quotation.status]}>{statusLabels[quotation.status]}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{quotation.suppliers.length} fornecedor(es) convidado(s)</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Ver comparativo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compare">
            {comparisonLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !comparison || comparison.length === 0 ? (
              <EmptyState title="Sem respostas ainda" description="Aguardando os fornecedores responderem a cotação." />
            ) : (
              <div className="space-y-3">
                {comparison.map((entry) => (
                  <Card key={entry.quotationSupplierId} className={entry.isBestOffer ? 'border-success ring-1 ring-success/30' : undefined}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {entry.isBestOffer && (
                            <Badge variant="success">
                              <Trophy className="size-3" /> Melhor proposta
                            </Badge>
                          )}
                          <span className="font-medium">{entry.supplierName}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Itens: <span className="font-numeric text-foreground">{formatCurrencyBRL(entry.itemsTotal)}</span></span>
                          <span>Frete: <span className="font-numeric text-foreground">{formatCurrencyBRL(entry.freightAmount)}</span></span>
                          <span>Desconto: <span className="font-numeric text-foreground">{entry.discountPercent}%</span></span>
                          <span>Prazo: <span className="font-numeric text-foreground">{entry.deliveryDays ?? '—'} dia(s)</span></span>
                          <span>Garantia: <span className="font-numeric text-foreground">{entry.warrantyDays ?? '—'} dia(s)</span></span>
                          <span>Pagamento: <span className="text-foreground">{entry.paymentTerms ?? '—'}</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-numeric text-h3">{formatCurrencyBRL(entry.grandTotal)}</p>
                        <p className="text-xs text-muted-foreground">Score: {(entry.score * 100).toFixed(0)}/100</p>
                        {can('purchases', 'approve') && selectedId && (
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => awardQuotation.mutate({ id: selectedId, quotationSupplierId: entry.quotationSupplierId })}>
                              <Award /> Adjudicar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => generateOrder.mutate({ quotationId: selectedId, quotationSupplierId: entry.quotationSupplierId })}
                              isLoading={generateOrder.isPending}
                            >
                              <ShoppingCart /> Gerar Pedido
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
