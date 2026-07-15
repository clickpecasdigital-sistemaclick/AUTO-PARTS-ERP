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
            <FormField label="Cliente (ID)" required>
              <Input {...form.register('customerId', { required: true })} placeholder="uuid do cliente" />
            </FormField>
            <FormField label="Veículo (ID)" required>
              <Input {...form.register('vehicleId', { required: true })} placeholder="uuid do veículo" />
            </FormField>
            <FormField label="Mecânico responsável (ID)">
              <Input {...form.register('mechanicId')} placeholder="uuid do mecânico (opcional)" />
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
