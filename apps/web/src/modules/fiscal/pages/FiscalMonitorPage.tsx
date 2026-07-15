import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Download, FileX, Plus, ShieldAlert, Wrench, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatters';
import { useFiscalDashboard } from '../services/fiscal.service';

export default function FiscalMonitorPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useFiscalDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitor Fiscal"
        description="NF-e / NFC-e — emissão, transmissão, cancelamento, CC-e, inutilização."
        actions={
          <Button asChild>
            <Link to="/fiscal/notas">
              <Plus /> Emitir NF-e
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : (
          <>
            <StatsCard label="Total emitidas" value={String(data?.totals.emitted ?? 0)} icon={CheckCircle2} />
            <StatsCard label="Autorizadas" value={String(data?.totals.authorized ?? 0)} icon={CheckCircle2} />
            <StatsCard label="Pendentes" value={String(data?.totals.pending ?? 0)} icon={Clock} />
            <StatsCard label="Rejeitadas" value={String(data?.totals.rejected ?? 0)} icon={X} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard label="Canceladas" value={String(data?.totals.cancelled ?? 0)} icon={FileX} />
        <StatsCard label="Intervalos inutilizados" value={String(data?.totals.voidedRanges ?? 0)} icon={Wrench} />
      </div>

      {data?.expiringCertificates && data.expiringCertificates.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-warning">
              <ShieldAlert className="size-4" /> Certificados prestes a vencer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.expiringCertificates.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between text-sm">
                <span>{cert.alias}</span>
                <Badge variant="warning">{formatDate(cert.validUntil)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data?.recentRejections && data.recentRejections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" /> Últimas rejeições
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentRejections.map((rej, i) => (
              <div key={i} className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="font-numeric">{rej.rejectionCode}</Badge>
                  <span className="text-sm font-medium">{rej.rejectionMessage}</span>
                </div>
                {rej.explanation && <p className="mt-1 text-xs text-muted-foreground">{rej.explanation}</p>}
                {rej.suggestedFix && (
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Correção: </span>{rej.suggestedFix}
                    {rej.internalLink && (
                      <Button variant="link" size="sm" className="ml-1 h-auto p-0 text-xs" onClick={() => navigate(rej.internalLink!)}>
                        Ir para configuração
                      </Button>
                    )}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button asChild variant="outline">
        <Link to="/fiscal/notas">
          <Download /> Ver todas as notas
        </Link>
      </Button>
    </div>
  );
}
