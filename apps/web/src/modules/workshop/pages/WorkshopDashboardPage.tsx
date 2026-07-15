import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  Plus,
  RotateCcw,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useTodayAgenda, useWorkshopKpis } from '../hooks/useWorkshop';

function formatTimeOfDay(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Dashboard da Oficina (briefing): veículos em atendimento, OS por status, tempo médio, ticket médio, receitas, mecânicos disponíveis, agenda do dia, retrabalho, garantias. */
export default function WorkshopDashboardPage() {
  const { data: kpis, isLoading } = useWorkshopKpis();
  const { data: agenda } = useTodayAgenda();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard da Oficina"
        description="Ciclo completo de atendimento — em tempo real."
        actions={
          <Button asChild size="lg">
            <Link to="/oficina/ordens/nova">
              <Plus /> Nova OS
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : (
          <>
            <StatsCard label="Veículos em atendimento" value={String(kpis?.vehiclesInService ?? 0)} icon={Car} />
            <StatsCard label="OS em execução" value={String(kpis?.inProgressOrders ?? 0)} icon={Wrench} />
            <StatsCard label="Aguardando aprovação" value={String(kpis?.awaitingApprovalOrders ?? 0)} icon={Clock} />
            <StatsCard label="Finalizadas hoje" value={String(kpis?.completedOrdersToday ?? 0)} icon={CheckCircle2} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Ticket médio" value={formatCurrencyBRL(kpis?.averageTicket ?? 0)} icon={CheckCircle2} />
        <StatsCard label="Tempo médio por OS" value={kpis?.averageOrderDurationHours != null ? `${kpis.averageOrderDurationHours}h` : '—'} icon={Clock} />
        <StatsCard label="Mecânicos disponíveis" value={String(kpis?.availableMechanics ?? 0)} icon={Users} />
        <StatsCard label="Garantias abertas" value={String(kpis?.openWarranties ?? 0)} icon={ShieldCheck} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard label="Receita de serviços (mês)" value={formatCurrencyBRL(kpis?.serviceRevenue ?? 0)} icon={Wrench} />
        <StatsCard label="Receita de peças (mês)" value={formatCurrencyBRL(kpis?.partsRevenue ?? 0)} icon={Car} />
      </div>

      {kpis && kpis.reworkRate > 5 && (
        <Card className="border-warning/30">
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <AlertTriangle className="size-4 text-warning" />
            Índice de retrabalho do mês: <span className="font-numeric font-medium">{kpis.reworkRate}%</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="size-4" /> Agenda de hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!agenda || agenda.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
          ) : (
            agenda.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-numeric">{formatTimeOfDay(appt.scheduledAt)}</Badge>
                  {appt.customer.name}
                  {appt.mechanic && <span className="text-muted-foreground">· {appt.mechanic.employee.name}</span>}
                </span>
                {appt.box && <Badge variant="outline">{appt.box.name}</Badge>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link to="/oficina/agenda">
          <RotateCcw /> Ver agenda completa
        </Link>
      </Button>
    </div>
  );
}
