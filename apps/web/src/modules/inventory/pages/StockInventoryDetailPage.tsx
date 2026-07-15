import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import { Alert } from '@/components/ui/alert';
import { usePermissions } from '@/hooks/usePermissions';
import { useReconcileInventory, useStockInventory, useSubmitCount } from '../hooks/useInventory';
import { inventoryTypeLabels } from '../types/inventory.types';

/**
 * Conferência de inventário: um campo de contagem por produto
 * (`isBlind` controla, na própria página, se o saldo de sistema é exibido
 * ou ocultado do operador), com salvamento individual e reconciliação
 * final (gera os ajustes de saldo definitivos via `StockService`).
 */
export default function StockInventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermissions();
  const { data: inventory, isLoading, isError, refetch } = useStockInventory(id);
  const submitCount = useSubmitCount(id ?? '');
  const reconcile = useReconcileInventory();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (isLoading) return <LoadingScreen message="Carregando inventário..." fullScreen={false} />;
  if (isError || !inventory) return <ErrorState onRetry={() => refetch()} />;

  const isClosed = inventory.status === 'reconciled' || inventory.status === 'cancelled';

  async function handleSaveCount(productId: string) {
    const value = drafts[productId];
    if (value === undefined || value === '') return;
    await submitCount.mutateAsync({ productId, countedQuantity: Number(value) });
  }

  return (
    <div>
      <PageHeader
        title={`Inventário ${inventory.code}`}
        description={`${inventoryTypeLabels[inventory.type]} — ${inventory.items.length} produto(s)`}
        actions={
          !isClosed &&
          can('stock', 'approve') && (
            <Button onClick={() => reconcile.mutate(inventory.id)} isLoading={reconcile.isPending}>
              <CheckCircle2 /> Reconciliar inventário
            </Button>
          )
        }
      />

      {inventory.isBlind && inventory.status !== 'reconciled' && (
        <Alert variant="info" title="Contagem cega ativa" className="mb-4">
          O saldo de sistema está oculto durante a contagem para evitar viés do operador. Ele será exibido após a reconciliação.
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium text-muted-foreground">Produto</th>
                {!inventory.isBlind && <th className="p-3 text-left font-medium text-muted-foreground">Sistema</th>}
                <th className="p-3 text-left font-medium text-muted-foreground">Contado</th>
                {!inventory.isBlind && <th className="p-3 text-left font-medium text-muted-foreground">Diferença</th>}
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {inventory.items.map((item) => {
                const counted = item.countedQuantity !== null && item.countedQuantity !== undefined ? Number(item.countedQuantity) : undefined;
                const diff = counted !== undefined ? counted - Number(item.systemQuantity) : undefined;
                return (
                  <tr key={item.id} className="border-t border-border">
                    <td className="p-3">
                      <p className="font-medium">{item.product.internalCode}</p>
                      <p className="text-xs text-muted-foreground">{item.product.shortDescription}</p>
                    </td>
                    {!inventory.isBlind && <td className="p-3 font-numeric">{Number(item.systemQuantity)}</td>}
                    <td className="p-3">
                      {isClosed ? (
                        <span className="font-numeric">{counted ?? '—'}</span>
                      ) : (
                        <Input
                          type="number"
                          step="0.0001"
                          className="w-28 font-numeric"
                          defaultValue={counted}
                          onChange={(e) => setDrafts((d) => ({ ...d, [item.productId]: e.target.value }))}
                          onBlur={() => handleSaveCount(item.productId)}
                        />
                      )}
                    </td>
                    {!inventory.isBlind && (
                      <td className="p-3">
                        {diff !== undefined && diff !== 0 ? (
                          <Badge variant={diff > 0 ? 'success' : 'destructive'}>{diff > 0 ? `+${diff}` : diff}</Badge>
                        ) : diff === 0 ? (
                          <Badge variant="secondary">OK</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                    <td className="p-3">
                      {!isClosed && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleSaveCount(item.productId)} aria-label="Salvar contagem">
                          <Save className="size-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
