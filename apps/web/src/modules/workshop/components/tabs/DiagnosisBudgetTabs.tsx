import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrencyBRL } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useAddPartItem,
  useAddServiceItem,
  useRemovePartItem,
  useRemoveServiceItem,
  useUpdateDiagnosis,
} from '../../hooks/useWorkshop';
import type { ServiceOrder } from '../../types/workshop.types';

interface DiagnosisTabProps {
  order: ServiceOrder;
}

/** Diagnóstico (briefing: problema informado [complaint, somente leitura aqui], diagnóstico técnico, solução proposta, tempo estimado). */
export function DiagnosisTab({ order }: DiagnosisTabProps) {
  const { can } = usePermissions();
  const updateDiagnosis = useUpdateDiagnosis(order.id);
  const form = useForm({
    defaultValues: { technicalDiagnosis: order.technicalDiagnosis ?? '', proposedSolution: order.proposedSolution ?? '', estimatedMinutes: order.estimatedMinutes ?? undefined },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => updateDiagnosis.mutate(values))} className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Problema informado pelo cliente</p>
          <p className="text-sm">{order.complaint ?? 'Nenhuma queixa registrada.'}</p>
        </CardContent>
      </Card>
      <FormField label="Diagnóstico técnico">
        <Textarea {...form.register('technicalDiagnosis')} rows={3} disabled={!can('workshop', 'update')} />
      </FormField>
      <FormField label="Solução proposta">
        <Textarea {...form.register('proposedSolution')} rows={3} disabled={!can('workshop', 'update')} />
      </FormField>
      <FormField label="Tempo estimado (minutos)">
        <Input type="number" {...form.register('estimatedMinutes', { valueAsNumber: true })} className="w-32 font-numeric" disabled={!can('workshop', 'update')} />
      </FormField>
      {can('workshop', 'update') && (
        <Button type="submit" isLoading={updateDiagnosis.isPending}>
          <Save /> Salvar diagnóstico
        </Button>
      )}
    </form>
  );
}

interface BudgetTabProps {
  order: ServiceOrder;
}

/** Orçamento — peças, serviços, mão de obra, total (briefing: gerado automaticamente a partir dos itens). */
export function BudgetTab({ order }: BudgetTabProps) {
  const { can } = usePermissions();
  const addService = useAddServiceItem(order.id);
  const removeService = useRemoveServiceItem(order.id);
  const addPart = useAddPartItem(order.id);
  const removePart = useRemovePartItem(order.id);

  const [serviceId, setServiceId] = useState('');
  const [productId, setProductId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium">Serviços (mão de obra)</p>
        <div className="space-y-1">
          {order.services.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span>{item.service.name} × {item.quantity}</span>
              <div className="flex items-center gap-2">
                <span className="font-numeric">{formatCurrencyBRL(Number(item.totalAmount))}</span>
                {can('workshop', 'update') && (
                  <Button variant="ghost" size="icon-sm" onClick={() => removeService.mutate(item.id)} aria-label="Remover serviço">
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {can('workshop', 'update') && (
          <div className="mt-2 flex gap-2">
            <Input value={serviceId} onChange={(e) => setServiceId(e.target.value)} placeholder="ID do serviço do catálogo" className="flex-1" />
            <Button
              variant="outline"
              onClick={() => {
                if (serviceId) addService.mutate({ serviceId });
                setServiceId('');
              }}
            >
              <Plus /> Adicionar
            </Button>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Peças</p>
        <div className="space-y-1">
          {order.parts.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span className="font-numeric">{item.product.internalCode} — {item.product.shortDescription} × {Number(item.quantity)}</span>
              <div className="flex items-center gap-2">
                <span className="font-numeric">{formatCurrencyBRL(Number(item.totalAmount))}</span>
                {can('workshop', 'update') && (
                  <Button variant="ghost" size="icon-sm" onClick={() => removePart.mutate(item.id)} aria-label="Remover peça">
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {can('workshop', 'update') && (
          <div className="mt-2 flex gap-2">
            <Input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="ID do produto" className="flex-1" />
            <Input type="number" step="0.0001" value={partQuantity} onChange={(e) => setPartQuantity(Number(e.target.value))} className="w-24 font-numeric" />
            <Button
              variant="outline"
              onClick={() => {
                if (productId) addPart.mutate({ productId, quantity: partQuantity });
                setProductId('');
                setPartQuantity(1);
              }}
            >
              <Plus /> Adicionar
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-1 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mão de obra</span>
            <span className="font-numeric">{formatCurrencyBRL(Number(order.laborAmount))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Peças</span>
            <span className="font-numeric">{formatCurrencyBRL(Number(order.partsAmount))}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
            <span>Total</span>
            <span className="font-numeric">{formatCurrencyBRL(Number(order.totalAmount))}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
