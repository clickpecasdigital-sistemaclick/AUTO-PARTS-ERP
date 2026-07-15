import { Building2, CreditCard, Layers, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyBRL } from '@/utils/formatters';
import { httpClient } from '@/api/http.client';

interface SaDashboard { tenants: number; users: number; activeSubscriptions: number; trials: number; mrrLast30d: number; auditEventsLastHour: number }
interface Tenant { id: string; name: string; subscription?: { plan: { name: string }; status: string } | null }

const statusVariant: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = { active: 'default', trial: 'warning', suspended: 'destructive', cancelled: 'secondary' };

/** Painel do Super Admin — visão global da plataforma SaaS (briefing). */
export default function SuperAdminDashboardPage() {
  const { data: dashboard, isLoading } = useQuery({ queryKey: ['sa', 'dashboard'], queryFn: () => httpClient.get<SaDashboard>('/superadmin/dashboard') });
  const { data: tenants, isLoading: loadingTenants } = useQuery({ queryKey: ['sa', 'tenants'], queryFn: () => httpClient.get<Tenant[]>('/superadmin/tenants') });

  return (
    <div className="space-y-6">
      <PageHeader title="Super Admin" description="Painel global da plataforma AutoCore ERP SaaS." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />) : (
          <>
            <StatsCard label="Empresas" value={String(dashboard?.tenants ?? 0)} icon={Building2} />
            <StatsCard label="Usuários" value={String(dashboard?.users ?? 0)} icon={Users} />
            <StatsCard label="Assinaturas ativas" value={String(dashboard?.activeSubscriptions ?? 0)} icon={Layers} />
            <StatsCard label="MRR (30 dias)" value={formatCurrencyBRL(dashboard?.mrrLast30d ?? 0)} icon={CreditCard} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Em trial" value={String(dashboard?.trials ?? 0)} icon={Layers} />
        <StatsCard label="Eventos de auditoria/h" value={String(dashboard?.auditEventsLastHour ?? 0)} icon={Layers} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Empresas recentes</CardTitle></CardHeader>
        <CardContent>
          {loadingTenants ? <Skeleton className="h-32" /> : (
            <div className="space-y-2">
              {(Array.isArray(tenants) ? tenants : []).slice(0, 15).map((t: Tenant) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t.subscription?.plan.name ?? '—'}</span>
                    <Badge variant={statusVariant[t.subscription?.status ?? 'cancelled'] ?? 'secondary'}>
                      {t.subscription?.status ?? 'sem plano'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
