import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Car, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useVehicleMakes, useVehicleModels, useVehicleVersions } from '../../hooks/useCatalogs';
import { useAddProductApplication, useRemoveProductApplication } from '../../hooks/useProducts';
import { productApplicationSchema, type ProductApplicationFormValues } from '../../schemas/product.schema';
import type { Product } from '../../types/product.types';

interface ApplicationsTabProps {
  product: Product;
}

/**
 * Aba 6 — Aplicações: vincula o produto a versões de veículo do catálogo
 * global (Montadora → Modelo → Versão, Sprint 02). Seleção em cascata:
 * Montadora primeiro, depois Modelo, depois Versão (já carrega motor/
 * combustível/ano embutidos).
 */
export function ApplicationsTab({ product }: ApplicationsTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [makeId, setMakeId] = useState<string>();
  const [modelId, setModelId] = useState<string>();

  const { data: makes } = useVehicleMakes();
  const { data: models } = useVehicleModels(makeId);
  const { data: versions } = useVehicleVersions(modelId);

  const addApplication = useAddProductApplication(product.id);
  const removeApplication = useRemoveProductApplication(product.id);

  const form = useForm<ProductApplicationFormValues>({ resolver: zodResolver(productApplicationSchema) });

  async function onSubmit(values: ProductApplicationFormValues) {
    await addApplication.mutateAsync(values);
    form.reset();
    setMakeId(undefined);
    setModelId(undefined);
    setIsOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Esta peça é compatível com {product.vehicleApplications.length} aplicação(ões) cadastrada(s).</p>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus /> Nova aplicação
        </Button>
      </div>

      {product.vehicleApplications.length === 0 ? (
        <EmptyState icon={Car} title="Nenhuma aplicação cadastrada" description="Vincule este produto às versões de veículo compatíveis." />
      ) : (
        <div className="space-y-2">
          {product.vehicleApplications.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">
                    {app.vehicleVersion.model.make.name} {app.vehicleVersion.model.name} — {app.vehicleVersion.name}
                  </p>
                  <p className="text-sm text-muted-foreground font-numeric">
                    {app.vehicleVersion.yearStart}–{app.vehicleVersion.yearEnd ?? 'atual'}
                    {app.position && ` · ${app.position}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeApplication.mutate(app.id)} aria-label="Remover aplicação">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova aplicação veicular</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Montadora">
              <Select onValueChange={setMakeId} value={makeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a montadora" />
                </SelectTrigger>
                <SelectContent>
                  {makes?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Modelo" hint={!makeId ? 'Selecione a montadora primeiro' : undefined}>
              <Select onValueChange={setModelId} value={modelId} disabled={!makeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {models?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Versão" required error={form.formState.errors.vehicleVersionId?.message} hint={!modelId ? 'Selecione o modelo primeiro' : undefined}>
              <Select onValueChange={(v) => form.setValue('vehicleVersionId', v)} value={form.watch('vehicleVersionId')} disabled={!modelId}>
                <SelectTrigger error={!!form.formState.errors.vehicleVersionId}>
                  <SelectValue placeholder="Selecione a versão" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.yearStart}–{v.yearEnd ?? 'atual'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Posição" hint='Ex: "dianteiro", "traseiro", "lado direito"'>
              <Input {...form.register('position')} />
            </FormField>
            <FormField label="Observações da aplicação">
              <Input {...form.register('notes')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={addApplication.isPending}>
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
