import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import { pdvService } from '../services/pdv.service';

const KEY = 'pdv';

export function useProductSearch(term: string) {
  return useQuery({ queryKey: [KEY, 'search', term], queryFn: () => pdvService.searchProducts(term), enabled: term.trim().length >= 2 });
}

export function useRelatedProducts(productId: string | undefined, warehouseId?: string) {
  return useQuery({
    queryKey: [KEY, 'related', productId, warehouseId],
    queryFn: () => pdvService.getRelatedProducts(productId!, warehouseId),
    enabled: !!productId,
  });
}

export function useFrequentlyBoughtTogether(productId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'frequently-bought', productId],
    queryFn: () => pdvService.getFrequentlyBoughtTogether(productId!),
    enabled: !!productId,
  });
}

export function useCustomerRecentPurchases(customerId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'customer-recent-purchases', customerId],
    queryFn: () => pdvService.getCustomerRecentPurchases(customerId!),
    enabled: !!customerId,
  });
}

export function usePaymentMethods() {
  return useQuery({ queryKey: [KEY, 'payment-methods'], queryFn: pdvService.listPaymentMethods, staleTime: 1000 * 60 * 10 });
}

export function useCart(cartId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'cart', cartId], queryFn: () => pdvService.getCart(cartId!), enabled: !!cartId, refetchOnWindowFocus: false });
}

export function useOpenCart() {
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Record<string, unknown> }) => pdvService.openCart(branchId, payload),
    onError: (error: Error) => toast.error('Não foi possível abrir a venda', error.message),
  });
}

function useCartMutation<TArgs>(mutationFn: (args: TArgs) => Promise<unknown>, cartId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'cart', cartId] }),
    onError: (error: Error) => toast.error('Não foi possível concluir a operação', error.message),
  });
}

export function useAddCartItem(cartId: string) {
  return useCartMutation((payload: Record<string, unknown>) => pdvService.addItem(cartId, payload), cartId);
}

export function useUpdateCartItem(cartId: string) {
  return useCartMutation(({ itemId, payload }: { itemId: string; payload: Record<string, unknown> }) => pdvService.updateItem(cartId, itemId, payload), cartId);
}

export function useRemoveCartItem(cartId: string) {
  return useCartMutation((itemId: string) => pdvService.removeItem(cartId, itemId), cartId);
}

export function useSetCartCustomer(cartId: string) {
  return useCartMutation((payload: Record<string, unknown>) => pdvService.setCustomer(cartId, payload), cartId);
}

export function useSetCartDiscount(cartId: string) {
  return useCartMutation((payload: Record<string, unknown>) => pdvService.setDiscount(cartId, payload), cartId);
}

export function useCheckout(cartId: string) {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => pdvService.checkout(cartId, payload),
    onSuccess: () => toast.success('Venda finalizada com sucesso'),
    onError: (error: Error) => toast.error('Não foi possível finalizar a venda', error.message),
  });
}

export function useCancelCart(cartId: string) {
  return useMutation({
    mutationFn: (reason: string) => pdvService.cancelCart(cartId, reason),
    onSuccess: () => toast.success('Venda cancelada'),
  });
}

export function usePdvKpis(branchId?: string) {
  return useQuery({ queryKey: [KEY, 'kpis', branchId], queryFn: () => pdvService.getKpis(branchId), refetchInterval: 30_000 });
}

export function usePdvTopProducts() {
  return useQuery({ queryKey: [KEY, 'top-products'], queryFn: pdvService.getTopProducts });
}

export function usePdvByOperator() {
  return useQuery({ queryKey: [KEY, 'by-operator'], queryFn: pdvService.getByOperator });
}

export function usePdvByPaymentMethod() {
  return useQuery({ queryKey: [KEY, 'by-payment-method'], queryFn: pdvService.getByPaymentMethod });
}

// --- Orçamentos -----------------------------------------------------------------

export function usePdvQuotes(customerId?: string) {
  return useQuery({ queryKey: [KEY, 'quotes', customerId], queryFn: () => pdvService.listQuotes(customerId) });
}

export function usePdvQuote(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'quotes', id], queryFn: () => pdvService.getQuote(id!), enabled: !!id });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Record<string, unknown> }) => pdvService.createQuote(branchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'quotes'] });
      toast.success('Orçamento criado');
    },
    onError: (error: Error) => toast.error('Não foi possível criar o orçamento', error.message),
  });
}

function useQuoteAction(action: (id: string) => Promise<unknown>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'quotes'] });
      toast.success(successMessage);
    },
    onError: (error: Error) => toast.error('Não foi possível concluir a ação', error.message),
  });
}

export function useApproveQuote() {
  return useQuoteAction((id) => pdvService.approveQuote(id), 'Orçamento aprovado');
}
export function useConvertQuoteToOrder() {
  return useQuoteAction((id) => pdvService.convertQuoteToOrder(id), 'Orçamento convertido em pedido');
}
export function useSendQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sentTo }: { id: string; sentTo: string }) => pdvService.sendQuote(id, sentTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'quotes'] });
      toast.success('Orçamento marcado como enviado');
    },
  });
}

// --- Pedidos -------------------------------------------------------------------

export function usePdvOrders(status?: string) {
  return useQuery({ queryKey: [KEY, 'orders', status], queryFn: () => pdvService.listOrders(status) });
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, warehouseId }: { id: string; warehouseId: string }) => pdvService.approveOrder(id, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'orders'] });
      toast.success('Pedido aprovado — estoque reservado automaticamente');
    },
    onError: (error: Error) => toast.error('Não foi possível aprovar', error.message),
  });
}
export function useStartSeparation() {
  return useOrderAction((id) => pdvService.startSeparation(id), 'Separação iniciada');
}
export function useCompleteSeparation() {
  return useOrderAction((id) => pdvService.completeSeparation(id), 'Separação concluída');
}
export function useShipOrder() {
  return useOrderAction((id) => pdvService.shipOrder(id), 'Pedido expedido');
}
export function useCancelOrder() {
  return useOrderAction((id) => pdvService.cancelOrder(id), 'Pedido cancelado');
}

// --- Caixa ---------------------------------------------------------------------

export function useOpenRegisters(branchId?: string) {
  return useQuery({ queryKey: [KEY, 'registers', branchId], queryFn: () => pdvService.listOpenRegisters(branchId) });
}

export function useClosingSummary(registerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'registers', registerId, 'summary'], queryFn: () => pdvService.getClosingSummary(registerId!), enabled: !!registerId });
}

export function useOpenRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, openingAmount }: { branchId: string; openingAmount: number }) => pdvService.openRegister(branchId, openingAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'registers'] });
      toast.success('Caixa aberto');
    },
    onError: (error: Error) => toast.error('Não foi possível abrir o caixa', error.message),
  });
}

export function useAddCashMovement(registerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, amount, description }: { type: string; amount: number; description?: string }) => pdvService.addCashMovement(registerId, type, amount, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'registers'] });
      toast.success('Movimento registrado');
    },
  });
}

export function useReconcileRegister(registerId: string) {
  return useMutation({
    mutationFn: (counts: { paymentMethodId: string; countedAmount: number }[]) => pdvService.reconcileRegister(registerId, counts),
    onSuccess: () => toast.success('Conferência registrada'),
  });
}

export function useCloseRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, closingAmount }: { id: string; closingAmount: number }) => pdvService.closeRegister(id, closingAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'registers'] });
      toast.success('Caixa fechado');
    },
  });
}

// --- Devoluções ----------------------------------------------------------------

export function usePdvReturns(saleId?: string) {
  return useQuery({ queryKey: [KEY, 'returns', saleId], queryFn: () => pdvService.listReturns(saleId) });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ saleId, payload }: { saleId: string; payload: Record<string, unknown> }) => pdvService.createReturn(saleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'returns'] });
      toast.success('Devolução registrada');
    },
    onError: (error: Error) => toast.error('Não foi possível registrar a devolução', error.message),
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, issueCredit }: { id: string; issueCredit: boolean }) => pdvService.approveReturn(id, issueCredit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'returns'] });
      toast.success('Devolução aprovada — estoque atualizado');
    },
    onError: (error: Error) => toast.error('Não foi possível aprovar', error.message),
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => pdvService.rejectReturn(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'returns'] }),
  });
}
