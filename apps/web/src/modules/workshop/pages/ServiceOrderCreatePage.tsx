import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useCreateServiceOrder } from '../hooks/useWorkshop';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useCustomer, useCustomers, useMechanics } from '@/modules/mdm/hooks/useMdm';
import { priorityLabels, type ServiceOrderPriority } from '../types/workshop.types';

interface CreateFormValues {
  customerId: string;
  vehicleId: string;
  mechanicId?: string;
  priority: ServiceOrderPriority;
  complaint?: string;
  odometerKm?: number;
}

/** Recepção — abertura da OS (briefing: Agendamento → Recepção). */
export default function ServiceOrderCreatePage() {
  const navigate = useNavigate();
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const createOrder = useCreateServiceOrder();
  const form = useForm<CreateFormValues>({ defaultValues: { priority: 'normal' } });
  const selectedCustomerId = form.watch('customerId');
  const { data: customerOptions } = useCustomers({ page: 1, perPage: 50 });
  const { data: selectedCustomer } = useCustomer(selectedCustomerId || undefined);
  const { data: mechanicOptions } = useMechanics();

  async function onSubmit(values: CreateFormValues) {
    if (!activeBranchId) return;
    const created = await createOrder.mutateAsync({ branchId: activeBranchId, payload: values as unknown as Record<string, unknown> });
    navigate(`/oficina/ordens/${created.id}`, { replace: true });
  }

  return (
    <div>
      <PageHeader title="Nova Ordem de Serviço" description="Recepção do veículo — cliente, veículo, mecânico responsável e queixa relatada." />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <FormField label="Cliente" required>
              <Autocomplete
                value={selectedCustomerId ?? null}
                onChange={(v) => { form.setValue('customerId', v ?? '', { shouldValidate: true }); form.setValue('vehicleId', ''); }}
                options={(customerOptions?.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Buscar cliente..."
              />
            </FormField>
            <FormField label="Veículo" required>
              <Autocomplete
                value={form.watch('vehicleId') ?? null}
                onChange={(v) => form.setValue('vehicleId', v ?? '', { shouldValidate: true })}
                options={(selectedCustomer?.vehicles ?? []).map((v) => ({ value: v.id, label: v.plate ? `Placa ${v.plate}` : `Veículo (${v.id.slice(0, 8)})` }))}
                placeholder={selectedCustomerId ? 'Selecione o veículo...' : 'Escolha um cliente primeiro'}
                disabled={!selectedCustomerId}
                emptyMessage="Esse cliente ainda não tem veículo cadastrado — adicione um no perfil do cliente (Customer 360)."
              />
            </FormField>
            <FormField label="Mecânico responsável">
              <Autocomplete
                value={form.watch('mechanicId') ?? null}
                onChange={(v) => form.setValue('mechanicId', v ?? undefined)}
                options={(mechanicOptions ?? []).map((m) => ({ value: m.id, label: m.employee?.name ?? m.id }))}
                placeholder="Buscar mecânico (opcional)..."
              />
            </FormField>
            <FormField label="Prioridade" required>
              <Select onValueChange={(v) => form.setValue('priority', v as ServiceOrderPriority)} value={form.watch('priority')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Quilometragem">
              <Input type="number" {...form.register('odometerKm', { valueAsNumber: true })} className="font-numeric" />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Queixa relatada pelo cliente">
                <Input {...form.register('complaint')} placeholder="Ex: barulho na suspensão dianteira" />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" isLoading={createOrder.isPending}>
                <Save /> Abrir OS
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
