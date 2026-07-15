import {
  Ban,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChartWidget } from '@/components/ui/chart';
import { formatCurrencyBRL } from '@/utils/formatters';
import { usePdvByOperator, usePdvByPaymentMethod, usePdvKpis, usePdvTopProducts } from '../hooks/usePdv';

/** Dashboard PDV — vendas do dia, ticket médio, itens vendidos, mais vendidos, operadores, formas de pagamento, cancelamentos, descontos (briefing). */
export default function PdvDashboardPage() {
  const { data: kpis, isLoading } = usePdvKpis();
  const { data: topProducts } = usePdvTopProducts();
  const { data: byOperator } = usePdvByOperator();
  const { data: byPaymentMethod } = usePdvByPaymentMethod();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard PDV"
        description="Velocidade operacional — vendas do dia em tempo real."
        actions={
          <Button asChild size="lg">
            <Link to="/pdv/venda">
              <ShoppingCart /> Nova Venda
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : (
          <>
            <StatsCard label="Vendas do dia" value={formatCurrencyBRL(kpis?.totalSalesToday ?? 0)} icon={Receipt} />
            <StatsCard label="Ticket médio" value={formatCurrencyBRL(kpis?.averageTicket ?? 0)} icon={TrendingUp} />
            <StatsCard label="Itens vendidos" value={String(kpis?.itemsSoldToday ?? 0)} icon={Package} />
            <StatsCard label="Cancelamentos" value={String(kpis?.cancellationsToday ?? 0)} icon={Ban} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard label="Vendas concluídas" value={String(kpis?.salesCountToday ?? 0)} icon={ShoppingCart} />
        <StatsCard label="Descontos concedidos" value={formatCurrencyBRL(kpis?.discountsGrantedToday ?? 0)} icon={Percent} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos mais vendidos hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {!topProducts || topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda hoje.</p>
            ) : (
              <BarChartWidget data={topProducts.map((p) => ({ name: p.internalCode, quantidade: p.quantitySold }))} xKey="name" series={[{ key: 'quantidade', label: 'Qtd. vendida' }]} height={220} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formas de pagamento (hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            {!byPaymentMethod || byPaymentMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda hoje.</p>
            ) : (
              <BarChartWidget data={byPaymentMethod.map((p) => ({ name: p.name, total: p.total }))} xKey="name" series={[{ key: 'total', label: 'Total' }]} height={220} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operadores — vendas de hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!byOperator || byOperator.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda hoje.</p>
          ) : (
            byOperator.map((op) => (
              <div key={op.userId} className="flex items-center justify-between text-sm">
                <span>{op.name}</span>
                <span className="font-numeric text-muted-foreground">{op.salesCount} venda(s) · {formatCurrencyBRL(op.totalAmount)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
