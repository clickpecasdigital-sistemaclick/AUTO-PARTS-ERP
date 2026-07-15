import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import { inventoryService, type MovementQueryParams } from '../services/inventory.service';
import type { AbcCriteria } from '../types/inventory.types';

const KEY = 'inventory';

export function useWarehouses() {
  return useQuery({ queryKey: [KEY, 'warehouses'], queryFn: inventoryService.listWarehouses, staleTime: 1000 * 60 * 5 });
}

export function useStockKpis(warehouseId?: string) {
  return useQuery({ queryKey: [KEY, 'kpis', warehouseId], queryFn: () => inventoryService.getKpis(warehouseId), refetchInterval: 60_000 });
}

export function useAbcCurve(criteria: AbcCriteria, warehouseId?: string) {
  return useQuery({ queryKey: [KEY, 'abc-curve', criteria, warehouseId], queryFn: () => inventoryService.getAbcCurve(criteria, warehouseId) });
}

export function useTurnover(periodDays?: number, warehouseId?: string) {
  return useQuery({ queryKey: [KEY, 'turnover', periodDays, warehouseId], queryFn: () => inventoryService.getTurnover(periodDays, warehouseId) });
}

export function useStockAlerts(warehouseId?: string) {
  return useQuery({ queryKey: [KEY, 'alerts', warehouseId], queryFn: () => inventoryService.getAlerts(warehouseId), refetchInterval: 60_000 });
}

export function useStockMovements(params: MovementQueryParams) {
  return useQuery({ queryKey: [KEY, 'movements', params], queryFn: () => inventoryService.listMovements(params), placeholderData: (prev) => prev });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => inventoryService.createMovement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Movimentação registrada');
    },
    onError: (error: Error) => toast.error('Não foi possível registrar a movimentação', error.message),
  });
}

export function useStockTransfers() {
  return useQuery({ queryKey: [KEY, 'transfers'], queryFn: inventoryService.listTransfers });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => inventoryService.createTransfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'transfers'] });
      toast.success('Transferência criada');
    },
    onError: (error: Error) => toast.error('Não foi possível criar a transferência', error.message),
  });
}

export function useShipTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.shipTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Transferência expedida');
    },
    onError: (error: Error) => toast.error('Não foi possível expedir', error.message),
  });
}

export function useReceiveTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.receiveTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Transferência recebida');
    },
    onError: (error: Error) => toast.error('Não foi possível receber', error.message),
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.cancelTransfer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'transfers'] }),
  });
}

export function useStockInventories(warehouseId?: string) {
  return useQuery({ queryKey: [KEY, 'inventories', warehouseId], queryFn: () => inventoryService.listInventories(warehouseId) });
}

export function useStockInventory(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'inventories', id], queryFn: () => inventoryService.getInventory(id!), enabled: !!id });
}

export function useOpenInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => inventoryService.openInventory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'inventories'] });
      toast.success('Inventário aberto');
    },
    onError: (error: Error) => toast.error('Não foi possível abrir o inventário', error.message),
  });
}

export function useSubmitCount(inventoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { productId: string; countedQuantity: number }) => inventoryService.submitCount(inventoryId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'inventories', inventoryId] }),
  });
}

export function useReconcileInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.reconcileInventory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Inventário reconciliado — ajustes de saldo aplicados');
    },
    onError: (error: Error) => toast.error('Não foi possível reconciliar', error.message),
  });
}
