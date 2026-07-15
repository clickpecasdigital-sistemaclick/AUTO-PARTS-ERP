import {
  AlertTriangle,
  Banknote,
  Clock,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { LineChartWidget, BarChartWidget } from '@/components/ui/chart';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useCashFlowConsolidated, useExecutiveKpis, useExpenseRanking } from '../hooks/useFinancial';

/** Dashboard Executivo (briefing): saldo em caixa/bancário, receitas/despesas do mês, lucro operacional, inadimplência, contas vencidas/a vencer, fluxo de caixa, ranking de despesas. */
export default function FinancialDashboardPage() {
  const activeCompanyId = useWorkspaceStore((s) => s.activeCompanyId);
  const { data: kpis, isLoading } = useExecutiveKpis(activeCompanyId ?? undefined);
  const { data: expenseRanking } = useExpenseRanking(activeCompanyId ?? undefined);

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const { data: cashFlow } = useCashFlowConsolidated(startDate, endDate, activeCompanyId ?? undefined);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Executivo" description="Controle financeiro completo — saldo, fluxo de caixa e inadimplência em tempo real." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : (
          <>
            <StatsCard label="Saldo em caixa" value={formatCurrencyBRL(kpis?.cashBalance ?? 0)} icon={Wallet} />
            <StatsCard label="Saldo bancário" value={formatCurrencyBRL(kpis?.bankBalance ?? 0)} icon={Banknote} />
            <StatsCard label="Receitas do mês" value={formatCurrencyBRL(kpis?.revenueThisMonth ?? 0)} icon={TrendingUp} />
            <StatsCard label="Despesas do mês" value={formatCurrencyBRL(kpis?.expenseThisMonth ?? 0)} icon={TrendingDown} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Lucro operacional"
          value={formatCurrencyBRL(kpis?.operatingProfit ?? 0)}
          icon={kpis && kpis.operatingProfit >= 0 ? TrendingUp : TrendingDown}
        />
        <StatsCard label="Inadimplência" value={`${kpis?.delinquencyRate ?? 0}%`} icon={AlertTriangle} />
        <StatsCard label="Contas a vencer (30 dias)" value={String((kpis?.upcomingPayables.count ?? 0) + (kpis?.upcomingReceivables.count ?? 0))} icon={Clock} />
      </div>

      {kpis && (kpis.overduePayables.count > 0 || kpis.overdueReceivables.count > 0) && (
        <div className="space-y-2">
          {kpis.overdueReceivables.count > 0 && (
            <Alert variant="warning" title="Contas a receber vencidas">
              {kpis.overdueReceivables.count} título(s) vencido(s) — {formatCurrencyBRL(kpis.overdueReceivables.total)}
            </Alert>
          )}
          {kpis.overduePayables.count > 0 && (
            <Alert variant="destructive" title="Contas a pagar vencidas">
              {kpis.overduePayables.count} título(s) vencido(s) — {formatCurrencyBRL(kpis.overduePayables.total)}
            </Alert>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fluxo de caixa consolidado (mês atual)</CardTitle>
          </CardHeader>
          <CardContent>
            {!cashFlow || cashFlow.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem movimentação no período.</p>
            ) : (
              <LineChartWidget
                data={cashFlow as unknown as Record<string, string | number>[]}
                xKey="date"
                series={[
                  { key: 'inflow', label: 'Entradas' },
                  { key: 'outflow', label: 'Saídas' },
                  { key: 'balance', label: 'Saldo acumulado' },
                ]}
                height={260}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de despesas por centro de custo</CardTitle>
          </CardHeader>
          <CardContent>
            {!expenseRanking || expenseRanking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma despesa com centro de custo definido este mês.</p>
            ) : (
              <BarChartWidget data={expenseRanking.map((r) => ({ name: r.name, total: r.total }))} xKey="name" series={[{ key: 'total', label: 'Total' }]} height={260} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
