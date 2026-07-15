import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/masked-inputs';
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
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useCreateOpportunity, useMoveOpportunity, usePipelineBoard } from '../hooks/useCrm';

interface OpportunityFormValues {
  title: string;
  pipelineStageId: string;
  value: number;
  customerId?: string;
}

/**
 * Pipeline de CRM — quadro kanban com drag-and-drop nativo (mesmo padrão
 * HTML5 usado em `DashboardGrid`/`PhotosTab` das Sprints 04/05). Mover um
 * card é otimista: atualiza a UI antes da resposta da API
 * (`useMoveOpportunity`), com rollback automático em caso de erro.
 */
export default function CrmPipelinePage() {
  const { can } = usePermissions();
  const { data: stages, isLoading } = usePipelineBoard();
  const createOpportunity = useCreateOpportunity();
  const moveOpportunity = useMoveOpportunity();
  const [isOpen, setIsOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const form = useForm<OpportunityFormValues>();

  async function onSubmit(values: OpportunityFormValues) {
    await createOpportunity.mutateAsync(values as unknown as Record<string, unknown>);
    form.reset();
    setIsOpen(false);
  }

  function handleDrop(pipelineStageId: string) {
    if (!draggingId) return;
    moveOpportunity.mutate({ id: draggingId, pipelineStageId });
    setDraggingId(null);
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-96 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pipeline de Vendas"
        description="Leads, oportunidades e negociações — arraste os cards entre as etapas."
        actions={
          can('crm', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Nova oportunidade
            </Button>
          )
        }
      />

      {!stages || stages.length === 0 ? (
        <EmptyState title="Nenhuma etapa configurada" description="Configure as etapas do funil (ex: Novo, Qualificação, Proposta, Ganho, Perdido)." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="w-72 flex-shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-medium">{stage.name}</h3>
                <Badge variant="secondary">{stage.opportunities.length}</Badge>
              </div>
              <div className="space-y-2 rounded-lg bg-muted/30 p-2 min-h-[200px]">
                {stage.opportunities.map((opp) => (
                  <Card
                    key={opp.id}
                    draggable
                    onDragStart={() => setDraggingId(opp.id)}
                    className={`cursor-grab active:cursor-grabbing transition-opacity duration-base ${draggingId === opp.id ? 'opacity-40' : ''}`}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">{opp.title}</p>
                      {opp.customer && <p className="text-xs text-muted-foreground">{opp.customer.name}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-numeric text-sm">{formatCurrencyBRL(Number(opp.value))}</span>
                        <Badge variant="outline">{opp.probability}%</Badge>
                      </div>
                      {opp.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {opp.tags.map((t) => (
                            <Badge key={t.tag.id} variant="secondary" className="text-[10px]">
                              {t.tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova oportunidade</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Título" required>
              <Input {...form.register('title', { required: true })} placeholder="Ex: Kit de embreagem — frota 5 veículos" />
            </FormField>
            <FormField label="Etapa" required>
              <Select onValueChange={(v) => form.setValue('pipelineStageId', v)} value={form.watch('pipelineStageId')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Valor estimado">
              <MoneyInput valueInCents={Math.round((form.watch('value') ?? 0) * 100)} onValueChange={(cents) => form.setValue('value', cents / 100)} />
            </FormField>
            <FormField label="Cliente (ID)" hint="Opcional — deixe vazio para oportunidade sem cliente vinculado ainda">
              <Input {...form.register('customerId')} placeholder="uuid do cliente" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createOpportunity.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
