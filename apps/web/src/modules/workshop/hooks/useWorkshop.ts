import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import { workshopService, type ServiceOrderQueryParams } from '../services/workshop.service';

const KEY = 'workshop';

export function useServiceOrders(params: ServiceOrderQueryParams) {
  return useQuery({ queryKey: [KEY, 'orders', params], queryFn: () => workshopService.listOrders(params), placeholderData: (prev) => prev });
}

export function useServiceOrder(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'orders', id], queryFn: () => workshopService.getOrder(id!), enabled: !!id });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Record<string, unknown> }) => workshopService.createOrder(branchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'orders'] });
      toast.success('Ordem de Serviço criada');
    },
    onError: (error: Error) => toast.error('Não foi possível criar a OS', error.message),
  });
}

function useOrderMutation<TArgs>(orderId: string, mutationFn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'orders', orderId] }),
    onError: (error: Error) => toast.error('Não foi possível concluir a operação', error.message),
  });
}

export function useTransitionOrder(orderId: string) {
  return useOrderMutation(orderId, ({ toStatus, notes }: { toStatus: string; notes?: string }) => workshopService.transitionOrder(orderId, toStatus, notes));
}

export function useCancelOrder(orderId: string) {
  return useOrderMutation(orderId, (reason: string) => workshopService.cancelOrder(orderId, reason));
}

export function useUpdateDiagnosis(orderId: string) {
  return useOrderMutation(orderId, (payload: Record<string, unknown>) => workshopService.updateDiagnosis(orderId, payload));
}

export function useAddServiceItem(orderId: string) {
  return useOrderMutation(orderId, (payload: Record<string, unknown>) => workshopService.addServiceItem(orderId, payload));
}

export function useRemoveServiceItem(orderId: string) {
  return useOrderMutation(orderId, (itemId: string) => workshopService.removeServiceItem(orderId, itemId));
}

export function useAddPartItem(orderId: string) {
  return useOrderMutation(orderId, (payload: Record<string, unknown>) => workshopService.addPartItem(orderId, payload));
}

export function useRemovePartItem(orderId: string) {
  return useOrderMutation(orderId, (itemId: string) => workshopService.removePartItem(orderId, itemId));
}

export function useConfirmParts(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) => workshopService.confirmParts(orderId, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'orders', orderId] });
      toast.success('Peças confirmadas — estoque baixado');
    },
    onError: (error: Error) => toast.error('Não foi possível confirmar as peças', error.message),
  });
}

export function useServicesCatalog(category?: string) {
  return useQuery({ queryKey: [KEY, 'services', category], queryFn: () => workshopService.listServices(category) });
}

export function useChecklistTemplates() {
  return useQuery({ queryKey: [KEY, 'checklist-templates'], queryFn: workshopService.listChecklistTemplates });
}

export function useChecklistsByOrder(orderId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'checklists', orderId], queryFn: () => workshopService.getChecklistsByOrder(orderId!), enabled: !!orderId });
}

export function useApplyChecklist(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => workshopService.applyChecklist(orderId, templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'checklists', orderId] }),
  });
}

export function useFillChecklistItem(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, payload }: { checklistId: string; payload: Record<string, unknown> }) => workshopService.fillChecklistItem(checklistId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'checklists', orderId] }),
  });
}

export function useCreateCheckIn(orderId: string) {
  return useOrderMutation(orderId, (payload: Record<string, unknown>) => workshopService.createCheckIn(orderId, payload));
}

export function useCreateDelivery(orderId: string) {
  return useOrderMutation(orderId, (payload: Record<string, unknown>) => workshopService.createDelivery(orderId, payload));
}

export function useWorkshopAgenda(startDate: string, endDate: string, mechanicId?: string, boxId?: string) {
  return useQuery({ queryKey: [KEY, 'agenda', startDate, endDate, mechanicId, boxId], queryFn: () => workshopService.getAgenda(startDate, endDate, mechanicId, boxId) });
}

export function useWaitlist() {
  return useQuery({ queryKey: [KEY, 'waitlist'], queryFn: workshopService.listWaitlist });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Record<string, unknown> }) => workshopService.createAppointment(branchId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'agenda'] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'waitlist'] });
      toast.success(data.status === 'waitlisted' ? 'Horário ocupado — adicionado à lista de espera' : 'Agendamento criado');
    },
    onError: (error: Error) => toast.error('Não foi possível agendar', error.message),
  });
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workshopService.confirmAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'agenda'] }),
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newScheduledAt, durationMinutes }: { id: string; newScheduledAt: string; durationMinutes?: number }) => workshopService.rescheduleAppointment(id, newScheduledAt, durationMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'agenda'] });
      toast.success('Reagendado');
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => workshopService.cancelAppointment(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'agenda'] }),
  });
}

export function useActiveWarranties() {
  return useQuery({ queryKey: [KEY, 'warranties', 'active'], queryFn: workshopService.listActiveWarranties });
}

export function useClaimWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => workshopService.claimWarranty(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'warranties'] });
      toast.success('Garantia acionada');
    },
  });
}

export function useMechanicPanel(mechanicId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'mechanic-panel', mechanicId], queryFn: () => workshopService.getMechanicPanel(mechanicId!), enabled: !!mechanicId });
}

export function useFollowUpsPending() {
  return useQuery({ queryKey: [KEY, 'follow-ups-pending'], queryFn: workshopService.listFollowUpsPending });
}

export function useNpsSummary() {
  return useQuery({ queryKey: [KEY, 'nps-summary'], queryFn: workshopService.getNpsSummary });
}

export function useWorkshopKpis(branchId?: string) {
  return useQuery({ queryKey: [KEY, 'kpis', branchId], queryFn: () => workshopService.getKpis(branchId), refetchInterval: 30_000 });
}

export function useTodayAgenda(branchId?: string) {
  return useQuery({ queryKey: [KEY, 'today-agenda', branchId], queryFn: () => workshopService.getTodayAgenda(branchId) });
}

export function useOrdersByStatus(branchId?: string) {
  return useQuery({ queryKey: [KEY, 'orders-by-status', branchId], queryFn: () => workshopService.getOrdersByStatus(branchId) });
}
