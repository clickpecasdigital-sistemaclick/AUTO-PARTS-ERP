import { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  Clock,
  PackageX,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChartWidget } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useAbcCurve, useStockAlerts, useStockKpis, useTurnover, useWarehouses } from '../hooks/useInventory';
import type { AbcCriteria } from '../types/inventory.types';

const abcCriteriaLabels: Record<AbcCriteria, string> = {
  value: 'Valor em estoque',
  quantity: 'Quantidade',
  movement: 'Movimentação (90 dias)',
  profit: 'Lucro potencial',
};

/**
 * Dashboard do Estoque — KPIs em tempo real, Curva ABC, Giro/Cobertura/
 * Tempo parado e Alertas inteligentes, 100% sobre componentes do Design
 * System (StatsCard, Chart, Alert, Tabs — nenhum novo primitivo criado).
 */
export default function InventoryDashboardPage() {
  const [warehouseId, setWarehouseId] = useState<string>();
  const [abcCriteria, setAbcCriteria] = useState<AbcCriteria>('value');

  const { data: warehouses } = useWarehouses();
  const { data: kpis, isLoading: kpisLoading } = useStockKpis(warehouseId);
  const { data: abcCurve, isLoading: abcLoading } = useAbcCurve(abcCriteria, warehouseId);
  const { data: turnover, isLoading: turnoverLoading } = useTurnover(90, warehouseId);
  const { data: alerts } = useStockAlerts(warehouseId);

  const staleTotal = kpis ? Object.values(kpis.staleProducts).reduce((sum, v) => sum + v, 0) : 0;

  const abcSummary = abcCurve
    ? (['A', 'B', 'C'] as const).map((klass) => ({
        classe: klass,
        produtos: abcCurve.filter((e) => e.class === klass).length,
      }))
    : [];

  const mostIdle = [...(turnover ?? [])].sort((a, b) => (b.idleDays ?? 0) - (a.idleDays ?? 0)).slice(0, 8);
  const mostMoved = [...(turnover ?? [])].sort((a, b) => b.outboundQuantity - a.outboundQuantity).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard do Estoque"
        description="Indicadores em tempo real do estoque — o coração operacional do ERP."
        actions={
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todos os depósitos" />
            </SelectTrigger>
            <SelectContent>
              {warehouses?.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : (
          <>
            <StatsCard label="Valor total em estoque" value={formatCurrencyBRL(kpis?.totalStockValue ?? 0)} icon={Boxes} />
            <StatsCard label="Itens em estoque" value={String(kpis?.totalItems ?? 0)} icon={ArrowDownToLine} />
            <StatsCard label="Produtos sem estoque" value={String(kpis?.outOfStockCount ?? 0)} icon={PackageX} />
            <StatsCard label="Produtos parados (30+ dias)" value={String(staleTotal)} icon={Clock} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard label="Abaixo do estoque mínimo" value={String(kpis?.belowMinCount ?? 0)} icon={TrendingDown} />
        <StatsCard label="Acima do estoque máximo" value={String(kpis?.aboveMaxCount ?? 0)} icon={TrendingUp} />
      </div>

      {/* Alertas inteligentes */}
      {alerts && (alerts.belowMin.length > 0 || alerts.negative.length > 0 || alerts.expiringBatches.length > 0) && (
        <div className="space-y-2">
          {alerts.negative.length > 0 && (
            <Alert variant="destructive" title="Saldo negativo detectado">
              {alerts.negative.length} produto(s) com saldo negativo — verifique movimentações recentes.
            </Alert>
          )}
          {alerts.belowMin.length > 0 && (
            <Alert variant="warning" title="Reposição sugerida">
              {alerts.belowMin.length} produto(s) abaixo do estoque mínimo.
            </Alert>
          )}
          {alerts.expiringBatches.length > 0 && (
            <Alert variant="info" title="Lotes vencendo em até 30 dias">
              {alerts.expiringBatches.length} lote(s) próximos do vencimento.
            </Alert>
          )}
        </div>
      )}

      <Tabs defaultValue="abc">
        <TabsList>
          <TabsTrigger value="abc">Curva ABC</TabsTrigger>
          <TabsTrigger value="turnover">Giro e Produtos Parados</TabsTrigger>
          <TabsTrigger value="alerts">Alertas Detalhados</TabsTrigger>
        </TabsList>

        <TabsContent value="abc">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Curva ABC</CardTitle>
              <Select value={abcCriteria} onValueChange={(v) => setAbcCriteria(v as AbcCriteria)}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(abcCriteriaLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {abcLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : !abcCurve || abcCurve.length === 0 ? (
                <EmptyState title="Sem dados suficientes" description="Cadastre saldo de estoque para gerar a Curva ABC." />
              ) : (
                <>
                  <BarChartWidget
                    data={abcSummary}
                    xKey="classe"
                    series={[{ key: 'produtos', label: 'Produtos' }]}
                    height={240}
                  />
                  <div className="mt-4 max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
                    {abcCurve.slice(0, 20).map((entry) => (
                      <div key={entry.productId} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                        <span className="flex items-center gap-2">
                          <Badge variant={entry.class === 'A' ? 'success' : entry.class === 'B' ? 'warning' : 'secondary'}>{entry.class}</Badge>
                          {entry.internalCode} — {entry.shortDescription}
                        </span>
                        <span className="font-numeric text-muted-foreground">{entry.percentOfTotal.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Produtos mais movimentados (90 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                {turnoverLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <BarChartWidget
                    data={mostMoved.map((t) => ({ name: t.internalCode, saida: t.outboundQuantity }))}
                    xKey="name"
                    series={[{ key: 'saida', label: 'Saídas' }]}
                    height={220}
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Produtos parados (dias sem movimentação)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {mostIdle.map((t) => (
                  <div key={t.productId} className="flex items-center justify-between text-sm">
                    <span>{t.internalCode} — {t.shortDescription}</span>
                    <span className="font-numeric text-muted-foreground">{t.idleDays ?? '—'} dia(s)</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="mb-2 text-sm font-medium">Abaixo do mínimo</p>
                {alerts?.belowMin.length ? (
                  alerts.belowMin.map((a) => (
                    <div key={a.productId} className="flex justify-between text-sm text-muted-foreground">
                      <span>{a.internalCode} — {a.shortDescription}</span>
                      <span className="font-numeric">{a.quantityOnHand} / mín. {a.minStock}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum produto abaixo do mínimo.</p>
                )}
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                  <AlertTriangle className="size-3.5 text-destructive" /> Saldo negativo
                </p>
                {alerts?.negative.length ? (
                  alerts.negative.map((a) => (
                    <div key={a.productId} className="flex justify-between text-sm text-destructive">
                      <span>{a.internalCode}</span>
                      <span className="font-numeric">{a.quantityOnHand}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum saldo negativo.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
