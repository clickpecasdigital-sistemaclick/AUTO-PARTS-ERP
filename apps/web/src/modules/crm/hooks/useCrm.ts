import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import { crmService } from '../services/crm.service';
import type { PipelineStageWithOpportunities } from '../types/crm.types';

const KEY = 'crm';

export function useCrmKpis() {
  return useQuery({ queryKey: [KEY, 'kpis'], queryFn: crmService.getKpis, refetchInterval: 60_000 });
}

export function useTopCustomers() {
  return useQuery({ queryKey: [KEY, 'top-customers'], queryFn: crmService.getTopCustomers });
}

export function useTopSuppliers() {
  return useQuery({ queryKey: [KEY, 'top-suppliers'], queryFn: crmService.getTopSuppliers });
}

export function useSalesByCustomer() {
  return useQuery({ queryKey: [KEY, 'sales-by-customer'], queryFn: crmService.getSalesByCustomer });
}

export function useCrmTimeline(days?: number) {
  return useQuery({ queryKey: [KEY, 'timeline', days], queryFn: () => crmService.getTimeline(days) });
}

export function usePendingTasks() {
  return useQuery({ queryKey: [KEY, 'tasks', 'pending'], queryFn: () => crmService.listPendingTasks() });
}

export function useOverdueTasks() {
  return useQuery({ queryKey: [KEY, 'tasks', 'overdue'], queryFn: crmService.listOverdueTasks });
}

export function usePipelineBoard() {
  return useQuery({ queryKey: [KEY, 'board'], queryFn: crmService.getBoard });
}

export function usePipelineStages() {
  return useQuery({ queryKey: [KEY, 'stages'], queryFn: crmService.listStages });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => crmService.createOpportunity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'board'] });
      toast.success('Oportunidade criada');
    },
    onError: (error: Error) => toast.error('Não foi possível criar a oportunidade', error.message),
  });
}

export function useMoveOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pipelineStageId }: { id: string; pipelineStageId: string }) => crmService.moveOpportunity(id, pipelineStageId),
    onMutate: async ({ id, pipelineStageId }) => {
      // Atualização otimista — move o card imediatamente no kanban, sem esperar a resposta da API.
      await queryClient.cancelQueries({ queryKey: [KEY, 'board'] });
      const previous = queryClient.getQueryData<PipelineStageWithOpportunities[]>([KEY, 'board']);
      if (previous) {
        const next = previous.map((stage) => ({
          ...stage,
          opportunities: stage.opportunities.filter((o) => o.id !== id),
        }));
        const movedOpportunity = previous.flatMap((s) => s.opportunities).find((o) => o.id === id);
        if (movedOpportunity) {
          const targetStage = next.find((s) => s.id === pipelineStageId);
          targetStage?.opportunities.unshift({ ...movedOpportunity, pipelineStageId });
        }
        queryClient.setQueryData([KEY, 'board'], next);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData([KEY, 'board'], context.previous);
      toast.error('Não foi possível mover a oportunidade');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [KEY, 'board'] }),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => crmService.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'tasks'] });
      toast.success('Tarefa criada');
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmService.completeTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'tasks'] }),
  });
}
