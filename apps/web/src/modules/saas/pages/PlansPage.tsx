import { Check, Zap } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyBRL } from '@/utils/formatters';
import { usePlans, useSubscription, useSubscriptionUsage } from '../services/saas.service';
import type { Plan } from '../services/saas.service';

const TIER_VARIANT: Record<string, 'secondary' | 'default' | 'warning' | 'destructive'> = { starter: 'secondary', pro: 'default', business: 'default', enterprise: 'warning', ultimate: 'destructive' };

function PlanCard({ plan, currentPlanId }: { plan: Plan; currentPlanId?: string }) {
  const isCurrent = plan.id === currentPlanId;
  return (
    <Card className={isCurrent ? 'border-primary ring-1 ring-primary' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base capitalize">{plan.name}</CardTitle>
          <Badge variant={isCurrent ? 'default' : TIER_VARIANT[plan.tier]}>{isCurrent ? 'Atual' : plan.tier}</Badge>
        </div>
        {plan.priceMonthly != null ? (
          <div className="mt-1"><span className="font-numeric text-2xl font-bold">{formatCurrencyBRL(plan.priceMonthly)}</span><span className="text-xs text-muted-foreground">/mês</span></div>
        ) : (
          <p className="text-sm text-muted-foreground">Sob consulta</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>{plan.limits?.maxUsers ? `${plan.limits.maxUsers} usuários` : 'Usuários ilimitados'}</p>
          {plan.limits?.maxProducts && <p>até {plan.limits.maxProducts} produtos</p>}
          {plan.limits?.maxMonthlyNfes && <p>até {plan.limits.maxMonthlyNfes} NF-e/mês</p>}
          {plan.limits?.maxStorageMb && <p>{Math.round(plan.limits.maxStorageMb / 1024)}GB storage</p>}
        </div>
        {plan.features?.slice(0, 4).map((f) => (
          <div key={f.feature} className="flex items-center gap-1 text-xs"><Check className="size-3 text-primary" /><span className="capitalize">{f.feature.replace(/_/g, ' ')}</span></div>
        ))}
        {!isCurrent && (
          <Button className="w-full" size="sm" variant={plan.tier === 'ultimate' ? 'default' : 'outline'}>
            <Zap className="size-3.5" /> {plan.priceMonthly ? 'Fazer upgrade' : 'Falar com vendas'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans();
  const { data: subscription } = useSubscription();
  const { data: usage } = useSubscriptionUsage();

  return (
    <div className="space-y-6">
      <PageHeader title="Planos & Assinatura" description="Gerencie seu plano, limites e cobrança." />

      {subscription && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Plano atual: <strong>{subscription.plan.name}</strong></p>
                <p className="text-xs text-muted-foreground">Status: {subscription.status} · Renova em {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</p>
              </div>
              {subscription.status === 'trial' && subscription.trialEndsAt && (
                <Badge variant="warning">Trial — expira em {new Date(subscription.trialEndsAt).toLocaleDateString('pt-BR')}</Badge>
              )}
            </div>

            {usage?.limits && (
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {['users', 'products', 'monthlyNfes', 'storageMb'].map((res) => {
                  const limitKey = `max${res.charAt(0).toUpperCase()}${res.slice(1)}` as keyof typeof usage.limits;
                  const max = usage.limits![limitKey];
                  if (!max) return null;
                  const cur = usage.current?.[res] ?? 0;
                  const pct = Math.min(100, Math.round((cur / (max as number)) * 100));
                  return (
                    <div key={res}>
                      <div className="flex justify-between text-xs text-muted-foreground"><span>{res}</span><span>{pct}%</span></div>
                      <div className="h-1.5 rounded-full bg-muted"><div className={`h-full rounded-full ${pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />) : (
          plans?.map((plan) => <PlanCard key={plan.id} plan={plan} currentPlanId={subscription?.plan.id} />)
        )}
      </div>
    </div>
  );
}
