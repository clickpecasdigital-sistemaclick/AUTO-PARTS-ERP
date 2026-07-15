import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, Check, Play, ShieldAlert, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import { biService, useAlerts, useAcknowledgeAlert, type Alert } from '../services/bi.service';

const sevVariant: Record<string, 'secondary' | 'warning' | 'destructive'> = { info: 'secondary', warning: 'warning', critical: 'destructive' };

function AlertCard({ alert, onAck, onResolve }: { alert: Alert; onAck: (id: string) => void; onResolve: (id: string) => void }) {
  const Icon = alert.severity === 'critical' ? ShieldAlert : alert.severity === 'warning' ? AlertTriangle : Bell;
  return (
    <Card className={alert.severity === 'critical' ? 'border-destructive/40' : alert.severity === 'warning' ? 'border-warning/40' : ''}>
      <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 size-4 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'warning' ? 'text-warning' : 'text-muted-foreground'}`} />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={sevVariant[alert.severity]}>{alert.severity}</Badge>
              <Badge variant="secondary">{alert.category}</Badge>
            </div>
            <p className="mt-1 text-sm font-medium">{alert.title}</p>
            <p className="text-xs text-muted-foreground">{alert.message}</p>
            <p className="mt-1 font-numeric text-xs text-muted-foreground">{formatDate(alert.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {alert.internalLink && <Button variant="ghost" size="sm" asChild><Link to={alert.internalLink}>Ver</Link></Button>}
          {alert.status === 'active' && <Button variant="ghost" size="icon-sm" onClick={() => onAck(alert.id)} title="Reconhecer"><Check className="size-3.5" /></Button>}
          <Button variant="ghost" size="icon-sm" onClick={() => onResolve(alert.id)} title="Resolver"><X className="size-3.5 text-destructive" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlertsCenterPage() {
  const qc = useQueryClient();
  const { data: alerts, isLoading } = useAlerts('active');
  const acknowledge = useAcknowledgeAlert();
  const resolve = useMutation({
    mutationFn: (id: string) => biService.resolveAlert(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bi', 'alerts'] }); toast.success('Alerta resolvido'); },
  });
  const runAlertsM = useMutation({
    mutationFn: biService.runAlerts,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bi', 'alerts'] }); toast.success('Motor executado'); },
  });

  const criticals = alerts?.filter((a) => a.severity === 'critical') ?? [];
  const warnings = alerts?.filter((a) => a.severity === 'warning') ?? [];
  const infos = alerts?.filter((a) => a.severity === 'info') ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Alertas"
        description="Alertas automáticos — estoque, inadimplência, certificado, notas rejeitadas."
        actions={<Button variant="outline" onClick={() => runAlertsM.mutate()} isLoading={runAlertsM.isPending}><Play className="size-4" /> Executar motor</Button>}
      />

      {isLoading ? null : !alerts || alerts.length === 0 ? (
        <EmptyState icon={Bell} title="Nenhum alerta ativo" description="O motor não detectou nenhuma situação de atenção." />
      ) : (
        <div className="space-y-4">
          {criticals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-destructive">Crítico ({criticals.length})</p>
              {criticals.map((a) => <AlertCard key={a.id} alert={a} onAck={(id) => acknowledge.mutate(id)} onResolve={(id) => resolve.mutate(id)} />)}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-warning">Atenção ({warnings.length})</p>
              {warnings.map((a) => <AlertCard key={a.id} alert={a} onAck={(id) => acknowledge.mutate(id)} onResolve={(id) => resolve.mutate(id)} />)}
            </div>
          )}
          {infos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Info ({infos.length})</p>
              {infos.map((a) => <AlertCard key={a.id} alert={a} onAck={(id) => acknowledge.mutate(id)} onResolve={(id) => resolve.mutate(id)} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
