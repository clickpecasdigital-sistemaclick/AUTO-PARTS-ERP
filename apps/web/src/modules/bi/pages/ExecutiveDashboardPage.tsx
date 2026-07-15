import { useState } from 'react';
import { BarChart3, DollarSign, RefreshCw, TrendingUp, Users, Wrench } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useExecutiveSummary, useSalesKpis, useAbcCurve, useRunEtl } from '../services/bi.service';

function getDateRange(period: string) {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date();
  if (period === '7d') from.setDate(from.getDate() - 7);
  else if (period === '30d') from.setDate(from.getDate() - 30);
  else if (period === '90d') from.setDate(from.getDate() - 90);
  else from.setDate(1);
  return { from: from.toISOString().slice(0, 10), to };
}

export default function ExecutiveDashboardPage() {
  const [period, setPeriod] = useState('30d');
  const { from, to } = getDateRange(period);
  const runEtl = useRunEtl();

  const { data: exec, isLoading: loadingExec } = useExecutiveSummary(from, to);
  const { data: sales, isLoading: loadingSales } = useSalesKpis(from, to);
  const { data: abc } = useAbcCurve(from, to);

  const revenueData = (sales?.revenueByDay ?? []).map((d) => ({
    date: String(d.dateKey).slice(4).replace(/(\d{2})(\d{2})/, '$1/$2'),
    receita: d.netRevenue,
  }));

  const abcData = (abc ?? []).slice(0, 15).map((item) => ({ name: item.name.slice(0, 20), receita: item.revenue }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Executivo"
        description="Visão consolidada de vendas, financeiro, oficina e NPS."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="mtd">Mês atual</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => runEtl.mutate()} isLoading={runEtl.isPending}>
              <RefreshCw className="size-4" /> Atualizar dados
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingExec ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />) : (
          <>
            <StatsCard label="Receita líquida" value={formatCurrencyBRL(exec?.revenue ?? 0)} icon={DollarSign} />
            <StatsCard label="Lucro bruto" value={formatCurrencyBRL(exec?.grossProfit ?? 0)} icon={TrendingUp} />
            <StatsCard label="Margem" value={`${((exec?.margin ?? 0) * 100).toFixed(1)}%`} icon={BarChart3} />
            <StatsCard label="Saldo de caixa" value={formatCurrencyBRL(exec?.cashFlow ?? 0)} icon={DollarSign} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Inadimplência" value={`${((exec?.overdueRate ?? 0) * 100).toFixed(1)}%`} icon={Users} />
        <StatsCard label="Receita oficina" value={formatCurrencyBRL(exec?.workshopRevenue ?? 0)} icon={Wrench} />
        <StatsCard label="NPS" value={exec?.nps != null ? exec.nps.toFixed(0) : '—'} icon={TrendingUp} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Receita Diária (R$)</CardTitle></CardHeader>
          <CardContent>
            {loadingSales ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Receita']} />
                  <Area type="monotone" dataKey="receita" stroke="rgb(var(--primary))" fill="url(#receitaGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              Curva ABC — Top Produtos
              <Badge variant="secondary" className="text-xs">por faturamento</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!abc || abc.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Execute o ETL para calcular a curva ABC.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={abcData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis type="number" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Receita']} />
                  <Bar dataKey="receita" fill="rgb(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {sales?.topProducts && sales.topProducts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Produtos</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {sales.topProducts.slice(0, 8).map((p) => (
              <div key={p.productId} className="flex items-center justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-numeric text-xs text-muted-foreground">×{Number(p.quantity).toFixed(0)}</span>
                  <span className="font-numeric">{formatCurrencyBRL(p.netRevenue)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
