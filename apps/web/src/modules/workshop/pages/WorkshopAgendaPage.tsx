import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarClock, CheckCircle2, Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { appointmentStatusLabels, type WorkshopAppointmentStatus } from '../types/workshop.types';
import { useCancelAppointment, useConfirmAppointment, useCreateAppointment, useWaitlist, useWorkshopAgenda } from '../hooks/useWorkshop';

const statusVariant: Record<WorkshopAppointmentStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  scheduled: 'secondary',
  confirmed: 'success',
  waitlisted: 'warning',
  checked_in: 'success',
  rescheduled: 'secondary',
  cancelled: 'destructive',
  no_show: 'destructive',
};

interface FormValues {
  customerId: string;
  mechanicId?: string;
  boxId?: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
}

function formatTimeOfDay(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Agenda da Oficina — diária (briefing: por mecânico/box/serviço, reagendamento, confirmação, lista de espera). */
export default function WorkshopAgendaPage() {
  const { can } = usePermissions();
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const startDate = `${selectedDate}T00:00:00.000Z`;
  const endDate = `${selectedDate}T23:59:59.999Z`;

  const { data: agenda, isLoading } = useWorkshopAgenda(startDate, endDate);
  const { data: waitlist } = useWaitlist();
  const createAppointment = useCreateAppointment();
  const confirmAppointment = useConfirmAppointment();
  const cancelAppointment = useCancelAppointment();

  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<FormValues>({ defaultValues: { durationMinutes: 60 } });

  async function onSubmit(values: FormValues) {
    if (!activeBranchId) return;
    await createAppointment.mutateAsync({
      branchId: activeBranchId,
      payload: { customerId: values.customerId, mechanicId: values.mechanicId, boxId: values.boxId, scheduledAt: `${values.scheduledDate}T${values.scheduledTime}:00`, durationMinutes: values.durationMinutes },
    });
    form.reset({ durationMinutes: 60 });
    setIsOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Agenda da Oficina"
        description="Agendamento por mecânico, box e serviço — conflitos entram na lista de espera automaticamente."
        actions={
          can('workshop', 'update') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Novo agendamento
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-xs">
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="font-numeric" />
      </div>

      {isLoading ? null : !agenda || agenda.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nenhum agendamento neste dia" description="Use o botão acima para criar um novo agendamento." />
      ) : (
        <div className="space-y-2">
          {agenda.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="font-numeric">{formatTimeOfDay(appt.scheduledAt)}</Badge>
                  <div>
                    <p className="text-sm font-medium">{appt.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {appt.mechanic?.employee.name ?? 'Sem mecânico'} {appt.box && `· ${appt.box.name}`} {appt.service && `· ${appt.service.name}`}
                    </p>
                  </div>
                  <Badge variant={statusVariant[appt.status]}>{appointmentStatusLabels[appt.status]}</Badge>
                </div>
                {can('workshop', 'update') && (
                  <div className="flex gap-1">
                    {appt.status === 'scheduled' && (
                      <Button size="sm" variant="ghost" onClick={() => confirmAppointment.mutate(appt.id)}>
                        <CheckCircle2 className="size-3.5" /> Confirmar
                      </Button>
                    )}
                    {appt.status !== 'cancelled' && (
                      <Button size="sm" variant="ghost" onClick={() => cancelAppointment.mutate({ id: appt.id, reason: 'Cancelado pelo operador' })}>
                        <X className="size-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {waitlist && waitlist.length > 0 && (
        <Card className="mt-6 border-warning/30">
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">Lista de espera ({waitlist.length})</p>
            {waitlist.map((appt) => (
              <p key={appt.id} className="text-sm text-muted-foreground">
                {appt.customer.name} — {new Date(appt.scheduledAt).toLocaleString('pt-BR')}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Cliente (ID)" required>
              <Input {...form.register('customerId', { required: true })} placeholder="uuid do cliente" />
            </FormField>
            <FormField label="Mecânico (ID)">
              <Input {...form.register('mechanicId')} placeholder="uuid do mecânico (opcional)" />
            </FormField>
            <FormField label="Box (ID)">
              <Input {...form.register('boxId')} placeholder="uuid do box (opcional)" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Data" required>
                <Input type="date" {...form.register('scheduledDate', { required: true })} />
              </FormField>
              <FormField label="Hora" required>
                <Input type="time" {...form.register('scheduledTime', { required: true })} />
              </FormField>
            </div>
            <FormField label="Duração (minutos)">
              <Input type="number" {...form.register('durationMinutes', { valueAsNumber: true })} className="w-32 font-numeric" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createAppointment.isPending}>
                Agendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
