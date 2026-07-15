import {
  AlertTriangle,
  Award,
  Cake,
  Clock,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChartWidget } from '@/components/ui/chart';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useCrmKpis, useCrmTimeline, useOverdueTasks, useTopCustomers, useTopSuppliers } from '../hooks/useCrm';
import { useBirthdays } from '@/modules/mdm/hooks/useMdm';

/** Dashboard CRM — KPIs, conversão, top clientes/fornecedores, follow-ups, linha do tempo. */
export default function CrmDashboardPage() {
  const { data: kpis, isLoading } = useCrmKpis();
  const { data: timeline } = useCrmTimeline(30);
  const { data: topCustomers } = useTopCustomers();
  const { data: topSuppliers } = useTopSuppliers();
  const { data: overdueTasks } = useOverdueTasks();
  const { data: birthdays } = useBirthdays();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard CRM" description="Visão 360° da base de clientes — novos, ativos, conversão e relacionamento." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : (
          <>
            <StatsCard label="Novos clientes (mês)" value={String(kpis?.newCustomersThisMonth ?? 0)} icon={UserPlus} />
            <StatsCard label="Clientes ativos" value={String(kpis?.activeCustomers ?? 0)} icon={Users} />
            <StatsCard label="Clientes inativos" value={String(kpis?.inactiveCustomers ?? 0)} icon={TrendingDown} />
            <StatsCard label="Conversão de leads" value={`${kpis?.leadConversionRate ?? 0}%`} icon={TrendingUp} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard label="Follow-ups pendentes" value={String(kpis?.followUpsPending ?? 0)} icon={Clock} />
        <StatsCard label="Follow-ups atrasados" value={String(kpis?.followUpsOverdue ?? 0)} icon={AlertTriangle} />
      </div>

      {overdueTasks && overdueTasks.length > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4" /> {overdueTasks.length} follow-up(s) atrasado(s)
            </p>
            <div className="space-y-1">
              {overdueTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <span>{task.title}</span>
                  <span className="font-numeric text-muted-foreground">{task.dueAt ? formatDate(task.dueAt) : '—'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Linha do tempo — novos clientes e oportunidades ganhas</CardTitle>
          </CardHeader>
          <CardContent>
            {!timeline ? (
              <Skeleton className="h-56 w-full" />
            ) : timeline.length === 0 ? (
              <EmptyState title="Sem movimento no período" description="Novos clientes e oportunidades ganhas aparecerão aqui." />
            ) : (
              <LineChartWidget
                data={timeline}
                xKey="date"
                series={[
                  { key: 'newCustomers', label: 'Novos clientes' },
                  { key: 'wonValue', label: 'Valor ganho (R$)' },
                ]}
                height={240}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="size-4" /> Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!topCustomers || topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente com histórico de compras ainda.</p>
            ) : (
              topCustomers.slice(0, 8).map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{index + 1}º</Badge>
                    {customer.tradeName ?? customer.name}
                  </span>
                  <span className="font-numeric text-muted-foreground">{formatCurrencyBRL(Number(customer.largestPurchaseValue))}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="size-4" /> Top Fornecedores (ano atual)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!topSuppliers || topSuppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma compra registrada este ano.</p>
          ) : (
            topSuppliers.slice(0, 8).map((supplier, index) => (
              <div key={supplier.supplierId} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="secondary">{index + 1}º</Badge>
                  {supplier.name}
                </span>
                <span className="font-numeric text-muted-foreground">
                  {formatCurrencyBRL(supplier.totalPurchased)} · {supplier.ordersCount} pedido(s)
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="size-4" /> Aniversariantes do mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!birthdays || birthdays.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aniversariante este mês.</p>
          ) : (
            <div className="space-y-1">
              {birthdays.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between text-sm">
                  <span>{customer.name}</span>
                  <span className="font-numeric text-muted-foreground">{formatDate(customer.birthDate)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
