import { httpClient } from '@/api/http.client';
import type {
  CashRegister,
  Cart,
  ClosingSummary,
  PaymentMethod,
  PdvDashboardKpis,
  PdvSalesOrder,
  ProductSearchResult,
  Quote,
  SaleReturn,
} from '../types/pdv.types';

export interface TopProduct {
  productId: string;
  internalCode: string;
  shortDescription: string;
  quantitySold: number;
  totalAmount: number;
}

export interface OperatorSales {
  userId: string | null;
  name: string;
  salesCount: number;
  totalAmount: number;
}

/** Camada de serviço HTTP do PDV — espelha 1:1 as rotas de `apps/api/src/modules/pdv`. */
export const pdvService = {
  // Busca
  searchProducts: (term: string) => httpClient.get<ProductSearchResult[]>('/pdv/search/products', { params: { term } }),
  searchByPlate: (plate: string) => httpClient.get('/pdv/search/by-plate', { params: { plate } }),
  searchSales: (term: string) =>
    httpClient.get<
      { id: string; code: string; totalAmount: string; issuedAt: string; customer: { name: string }; items: { id: string; productId: string; quantity: string; unitPrice: string; product: { internalCode: string; shortDescription: string } }[] }[]
    >('/pdv/search/sales', { params: { term } }),

  // Carrinho
  listPaymentMethods: () => httpClient.get<PaymentMethod[]>('/pdv/carts/payment-methods'),
  openCart: (branchId: string, payload: Record<string, unknown>) => httpClient.post<Cart>('/pdv/carts', payload, { params: { branchId } }),
  getCart: (id: string) => httpClient.get<Cart>(`/pdv/carts/${id}`),
  addItem: (cartId: string, payload: Record<string, unknown>) => httpClient.post<Cart>(`/pdv/carts/${cartId}/items`, payload),
  updateItem: (cartId: string, itemId: string, payload: Record<string, unknown>) => httpClient.put<Cart>(`/pdv/carts/${cartId}/items/${itemId}`, payload),
  removeItem: (cartId: string, itemId: string) => httpClient.delete<Cart>(`/pdv/carts/${cartId}/items/${itemId}`),
  setCustomer: (cartId: string, payload: Record<string, unknown>) => httpClient.put<Cart>(`/pdv/carts/${cartId}/customer`, payload),
  setDiscount: (cartId: string, payload: Record<string, unknown>) => httpClient.put<Cart>(`/pdv/carts/${cartId}/discount`, payload),
  checkAvailability: (productId: string, warehouseId: string) =>
    httpClient.get<{ onHand: number; reserved: number; available: number }>(`/pdv/carts/availability/${productId}/${warehouseId}`),
  checkout: (cartId: string, payload: Record<string, unknown>) => httpClient.post<Cart>(`/pdv/carts/${cartId}/checkout`, payload),
  cancelCart: (cartId: string, reason: string) => httpClient.post(`/pdv/carts/${cartId}/cancel`, { reason }),

  // Dashboard
  getKpis: (branchId?: string) => httpClient.get<PdvDashboardKpis>('/pdv/analytics/kpis', { params: { branchId } }),
  getTopProducts: () => httpClient.get<TopProduct[]>('/pdv/analytics/top-products'),
  getByOperator: () => httpClient.get<OperatorSales[]>('/pdv/analytics/by-operator'),
  getByPaymentMethod: () => httpClient.get<{ paymentMethodId: string; name: string; total: number }[]>('/pdv/analytics/by-payment-method'),

  // Orçamentos
  listQuotes: (customerId?: string) => httpClient.get<Quote[]>('/pdv/quotes', { params: { customerId } }),
  getQuote: (id: string) => httpClient.get<Quote>(`/pdv/quotes/${id}`),
  createQuote: (branchId: string, payload: Record<string, unknown>) => httpClient.post<Quote>('/pdv/quotes', { branchId, ...payload }),
  approveQuote: (id: string) => httpClient.post<Quote>(`/pdv/quotes/${id}/approve`),
  rejectQuote: (id: string, reason: string) => httpClient.post<Quote>(`/pdv/quotes/${id}/reject`, { reason }),
  sendQuote: (id: string, sentTo: string) => httpClient.post<Quote>(`/pdv/quotes/${id}/send`, { sentTo }),
  convertQuoteToOrder: (id: string) => httpClient.post<PdvSalesOrder>(`/pdv/quotes/${id}/convert-to-order`),

  // Pedidos
  listOrders: (status?: string) => httpClient.get<PdvSalesOrder[]>('/pdv/orders', { params: { status } }),
  getOrder: (id: string) => httpClient.get<PdvSalesOrder>(`/pdv/orders/${id}`),
  approveOrder: (id: string, warehouseId: string) => httpClient.post<PdvSalesOrder>(`/pdv/orders/${id}/approve`, { warehouseId }),
  startSeparation: (id: string) => httpClient.post<PdvSalesOrder>(`/pdv/orders/${id}/separation/start`),
  completeSeparation: (id: string) => httpClient.post<PdvSalesOrder>(`/pdv/orders/${id}/separation/complete`),
  shipOrder: (id: string) => httpClient.post<PdvSalesOrder>(`/pdv/orders/${id}/ship`),
  cancelOrder: (id: string) => httpClient.post<PdvSalesOrder>(`/pdv/orders/${id}/cancel`),

  // Caixa
  listOpenRegisters: (branchId?: string) => httpClient.get<CashRegister[]>('/pdv/cash-registers/open', { params: { branchId } }),
  openRegister: (branchId: string, openingAmount: number) => httpClient.post<CashRegister>('/pdv/cash-registers/open', { branchId, openingAmount }),
  getClosingSummary: (id: string) => httpClient.get<ClosingSummary>(`/pdv/cash-registers/${id}/closing-summary`),
  addCashMovement: (id: string, type: string, amount: number, description?: string) => httpClient.post(`/pdv/cash-registers/${id}/movements`, { type, amount, description }),
  reconcileRegister: (id: string, counts: { paymentMethodId: string; countedAmount: number }[]) => httpClient.post(`/pdv/cash-registers/${id}/reconcile`, { counts }),
  closeRegister: (id: string, closingAmount: number) => httpClient.post<CashRegister>(`/pdv/cash-registers/${id}/close`, { closingAmount }),

  // Devoluções
  listReturns: (saleId?: string) => httpClient.get<SaleReturn[]>('/pdv/returns', { params: { saleId } }),
  createReturn: (saleId: string, payload: Record<string, unknown>) => httpClient.post<SaleReturn>(`/pdv/returns/sales/${saleId}`, payload),
  approveReturn: (id: string, issueCredit: boolean) => httpClient.post<SaleReturn>(`/pdv/returns/${id}/approve`, { issueCredit }),
  rejectReturn: (id: string, reason: string) => httpClient.post<SaleReturn>(`/pdv/returns/${id}/reject`, { reason }),
};
