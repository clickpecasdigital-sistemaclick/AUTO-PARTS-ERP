import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import { purchasingService } from '../services/purchasing.service';

const KEY = 'purchasing';

export function usePurchasingKpis() {
  return useQuery({ queryKey: [KEY, 'kpis'], queryFn: purchasingService.getKpis, refetchInterval: 60_000 });
}

export function usePurchasingTimeline(days?: number) {
  return useQuery({ queryKey: [KEY, 'timeline', days], queryFn: () => purchasingService.getTimeline(days) });
}

export function usePurchasesBySupplier() {
  return useQuery({ queryKey: [KEY, 'by-supplier'], queryFn: purchasingService.getBySupplier });
}

export function usePurchaseRequests(params?: Record<string, unknown>) {
  return useQuery({ queryKey: [KEY, 'requests', params], queryFn: () => purchasingService.listRequests(params) });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Record<string, unknown> }) => purchasingService.createRequest(branchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'requests'] });
      toast.success('Solicitação de compra criada');
    },
    onError: (error: Error) => toast.error('Não foi possível criar a solicitação', error.message),
  });
}

export function useSubmitPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estimatedValue }: { id: string; estimatedValue: number }) => purchasingService.submitRequest(id, estimatedValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'requests'] });
      toast.success('Solicitação submetida para aprovação');
    },
  });
}

export function usePurchaseQuotations() {
  return useQuery({ queryKey: [KEY, 'quotations'], queryFn: purchasingService.listQuotations });
}

export function usePurchaseQuotation(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'quotations', id], queryFn: () => purchasingService.getQuotation(id!), enabled: !!id });
}

export function useQuotationComparison(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'quotations', id, 'compare'], queryFn: () => purchasingService.compareQuotation(id!), enabled: !!id });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Record<string, unknown> }) => purchasingService.createQuotation(branchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'quotations'] });
      toast.success('Cotação aberta');
    },
    onError: (error: Error) => toast.error('Não foi possível abrir a cotação', error.message),
  });
}

export function useSubmitQuotationResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotationSupplierId, payload }: { quotationSupplierId: string; payload: Record<string, unknown> }) =>
      purchasingService.submitQuotationResponse(quotationSupplierId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'quotations'] });
      toast.success('Resposta da cotação registrada');
    },
  });
}

export function useAwardQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quotationSupplierId }: { id: string; quotationSupplierId: string }) => purchasingService.awardQuotation(id, quotationSupplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'quotations'] });
      toast.success('Cotação adjudicada');
    },
  });
}

export function useGenerateOrderFromQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotationId, quotationSupplierId }: { quotationId: string; quotationSupplierId: string }) =>
      purchasingService.generateOrderFromQuotation(quotationId, quotationSupplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Pedido de compra gerado a partir da cotação');
    },
    onError: (error: Error) => toast.error('Não foi possível gerar o pedido', error.message),
  });
}

export function usePurchaseOrders(params?: Record<string, unknown>) {
  return useQuery({ queryKey: [KEY, 'orders', params], queryFn: () => purchasingService.listOrders(params), placeholderData: (prev) => prev });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'orders', id], queryFn: () => purchasingService.getOrder(id!), enabled: !!id });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Record<string, unknown> }) => purchasingService.createOrder(branchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'orders'] });
      toast.success('Pedido de compra criado');
    },
    onError: (error: Error) => toast.error('Não foi possível criar o pedido', error.message),
  });
}

function useOrderAction(action: (id: string) => Promise<unknown>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'orders'] });
      toast.success(successMessage);
    },
    onError: (error: Error) => toast.error('Não foi possível concluir a ação', error.message),
  });
}

export function useApproveOrder() {
  return useOrderAction((id) => purchasingService.approveOrder(id), 'Pedido aprovado');
}
export function useDuplicateOrder() {
  return useOrderAction((id) => purchasingService.duplicateOrder(id), 'Pedido duplicado');
}
export function useReopenOrder() {
  return useOrderAction((id) => purchasingService.reopenOrder(id), 'Pedido reaberto');
}
export function useCancelOrder() {
  return useOrderAction((id) => purchasingService.cancelOrder(id), 'Pedido cancelado');
}

export function useSendOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estimatedValue }: { id: string; estimatedValue: number }) => purchasingService.sendOrder(id, estimatedValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'orders'] });
      toast.success('Pedido enviado');
    },
  });
}

export function useGoodsReceipts(purchaseOrderId?: string) {
  return useQuery({ queryKey: [KEY, 'receipts', purchaseOrderId], queryFn: () => purchasingService.listReceipts(purchaseOrderId) });
}

export function useGoodsReceipt(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'receipts', id], queryFn: () => purchasingService.getReceipt(id!), enabled: !!id });
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => purchasingService.createReceipt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'receipts'] });
      toast.success('Recebimento registrado');
    },
    onError: (error: Error) => toast.error('Não foi possível registrar o recebimento', error.message),
  });
}

export function useConferItem(receiptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => purchasingService.conferItem(receiptId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'receipts', receiptId] }),
  });
}

export function useFinalizeReceipt(receiptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (installments?: number) => purchasingService.finalizeReceipt(receiptId, installments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Recebimento finalizado — estoque e financeiro atualizados');
    },
    onError: (error: Error) => toast.error('Não foi possível finalizar', error.message),
  });
}

export function usePurchaseSuggestions(status?: string) {
  return useQuery({ queryKey: [KEY, 'suggestions', status], queryFn: () => purchasingService.listSuggestions(status) });
}

export function useGenerateSuggestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) => purchasingService.generateSuggestions(warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'suggestions'] });
      toast.success('Sugestões de reposição geradas');
    },
  });
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasingService.dismissSuggestion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'suggestions'] }),
  });
}

export function useSupplierPanel(supplierId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'supplier-panel', supplierId], queryFn: () => purchasingService.getSupplierPanel(supplierId!), enabled: !!supplierId });
}
