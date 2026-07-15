import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Car, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useAddVehicle } from '../../hooks/useMdm';
import type { CustomerVehicle } from '../../types/mdm.types';

interface VehiclesTabProps {
  customerId: string;
  vehicles: CustomerVehicle[];
}

interface VehicleFormValues {
  plate?: string;
  chassis?: string;
  color?: string;
  modelYear?: number;
  currentKm?: number;
  notes?: string;
}

/** Aba Veículos — cada cliente pode possuir diversos veículos (briefing). */
export function VehiclesTab({ customerId, vehicles }: VehiclesTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const addVehicle = useAddVehicle(customerId);
  const form = useForm<VehicleFormValues>();

  async function onSubmit(values: VehicleFormValues) {
    await addVehicle.mutateAsync(values as unknown as Record<string, unknown>);
    form.reset();
    setIsOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{vehicles.length} veículo(s) cadastrado(s).</p>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus /> Novo veículo
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState icon={Car} title="Nenhum veículo cadastrado" description="Cadastre os veículos do cliente para histórico de OS e aplicações de peças." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Car className="size-4 text-muted-foreground" />
                  <span className="font-numeric font-medium">{vehicle.plate ?? 'Placa não informada'}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {vehicle.color} {vehicle.modelYear && `· ${vehicle.modelYear}`} {vehicle.currentKm && `· ${vehicle.currentKm.toLocaleString('pt-BR')} km`}
                </p>
                {vehicle.notes && <p className="mt-1 text-xs text-muted-foreground">{vehicle.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo veículo</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Placa">
              <Input {...form.register('plate')} placeholder="ABC1D23" />
            </FormField>
            <FormField label="Chassi (VIN)">
              <Input {...form.register('chassis')} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Cor">
                <Input {...form.register('color')} />
              </FormField>
              <FormField label="Ano modelo">
                <Input type="number" {...form.register('modelYear', { valueAsNumber: true })} className="font-numeric" />
              </FormField>
            </div>
            <FormField label="Quilometragem atual">
              <Input type="number" {...form.register('currentKm', { valueAsNumber: true })} className="font-numeric" />
            </FormField>
            <FormField label="Observações">
              <Input {...form.register('notes')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={addVehicle.isPending}>
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
