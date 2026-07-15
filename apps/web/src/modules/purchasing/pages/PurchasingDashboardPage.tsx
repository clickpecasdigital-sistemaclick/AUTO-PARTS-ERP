import {
  AlertTriangle,
  Award,
  Ban,
  CheckCircle2,
  Clock,
  PackageSearch,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { LineChartWidget, BarChartWidget } from '@/components/ui/chart';
import { formatCurrencyBRL } from '@/utils/formatters';
import { usePurchasesBySupplier, usePurchasingKpis, usePurchasingTimeline } from '../hooks/usePurchasing';

/** Dashboard de Compras — KPIs em tempo real, linha do tempo, compras por fornecedor, alertas — 100% Design System. */
export default function PurchasingDashboardPage() {
  const { data: kpis, isLoading } = usePurchasingKpis();
  const { data: timeline } = usePurchasingTimeline(30);
  const { data: bySupplier } = usePurchasesBySupplier();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard de Compras" description="Ciclo completo de abastecimento — da necessidade à entrada no estoque." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : (
          <>
            <StatsCard label="Comprado hoje" value={formatCurrencyBRL(kpis?.totalToday ?? 0)} icon={ShoppingCart} />
            <StatsCard label="Comprado no mês" value={formatCurrencyBRL(kpis?.totalThisMonth ?? 0)} icon={ShoppingCart} />
            <StatsCard label="Pedidos pendentes" value={String(kpis?.pendingOrders ?? 0)} icon={Clock} />
            <StatsCard label="Pedidos aprovados" value={String(kpis?.approvedOrders ?? 0)} icon={CheckCircle2} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Pedidos cancelados" value={String(kpis?.cancelledOrders ?? 0)} icon={Ban} />
        <StatsCard label="Economia obtida (mês)" value={formatCurrencyBRL(kpis?.estimatedSavings ?? 0)} icon={Award} />
        <StatsCard label="Lead time médio" value={kpis?.averageLeadTimeDays ? `${kpis.averageLeadTimeDays.toFixed(1)} dias` : '—'} icon={Clock} />
        <StatsCard label="Fornecedor mais utilizado" value={kpis?.topSupplier?.name ?? '—'} icon={Award} />
      </div>

      {(kpis?.productsAwaitingPurchase ?? 0) > 0 && (
        <Alert variant="warning" title="Produtos aguardando compra">
          {kpis?.productsAwaitingPurchase} produto(s) com sugestão de reposição pendente
          {kpis && kpis.urgentReplenishments > 0 && `, sendo ${kpis.urgentReplenishments} urgente(s)`}.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Linha do tempo de compras (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {!timeline ? (
              <Skeleton className="h-56 w-full" />
            ) : timeline.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <PackageSearch className="size-8" />
                <p className="text-sm">Nenhuma compra no período.</p>
              </div>
            ) : (
              <LineChartWidget data={timeline} xKey="date" series={[{ key: 'total', label: 'Total comprado' }]} height={240} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compras por fornecedor (mês atual)</CardTitle>
          </CardHeader>
          <CardContent>
            {!bySupplier ? (
              <Skeleton className="h-56 w-full" />
            ) : bySupplier.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <TrendingDown className="size-8" />
                <p className="text-sm">Nenhuma compra registrada ainda.</p>
              </div>
            ) : (
              <BarChartWidget data={bySupplier.map((s) => ({ name: s.supplierName, total: s.total }))} xKey="name" series={[{ key: 'total', label: 'Total' }]} height={240} />
            )}
          </CardContent>
        </Card>
      </div>

      {kpis && kpis.urgentReplenishments > 0 && (
        <Alert variant="destructive" title="Reposições urgentes">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4" /> {kpis.urgentReplenishments} produto(s) em risco de ruptura — veja Reposição Automática.
          </div>
        </Alert>
      )}
    </div>
  );
}
