import { httpClient } from '@/api/http.client';
import type {
  GoodsReceipt,
  PurchaseOrder,
  PurchaseQuotation,
  PurchaseRequest,
  PurchaseSuggestion,
  PurchasingKpis,
  QuotationComparisonEntry,
  Supplier360Panel,
} from '../types/purchasing.types';

/** Camada de serviço HTTP do módulo de Compras — espelha 1:1 as rotas REST de `apps/api/src/modules/purchasing`. */
export const purchasingService = {
  // Solicitações
  listRequests: (params?: Record<string, unknown>) => httpClient.get<{ data: PurchaseRequest[] }>('/purchasing/requests', { params: params as never }),
  getRequest: (id: string) => httpClient.get<PurchaseRequest>(`/purchasing/requests/${id}`),
  createRequest: (branchId: string, payload: Record<string, unknown>) => httpClient.post<PurchaseRequest>('/purchasing/requests', { branchId, ...payload }),
  submitRequest: (id: string, estimatedValue: number) => httpClient.post(`/purchasing/requests/${id}/submit`, { estimatedValue }),

  // Cotações
  listQuotations: () => httpClient.get<PurchaseQuotation[]>('/purchasing/quotations'),
  getQuotation: (id: string) => httpClient.get<PurchaseQuotation>(`/purchasing/quotations/${id}`),
  compareQuotation: (id: string) => httpClient.get<QuotationComparisonEntry[]>(`/purchasing/quotations/${id}/compare`),
  createQuotation: (branchId: string, payload: Record<string, unknown>) => httpClient.post<PurchaseQuotation>('/purchasing/quotations', { branchId, ...payload }),
  submitQuotationResponse: (quotationSupplierId: string, payload: Record<string, unknown>) =>
    httpClient.post(`/purchasing/quotations/suppliers/${quotationSupplierId}/response`, payload),
  awardQuotation: (id: string, quotationSupplierId: string) => httpClient.post(`/purchasing/quotations/${id}/award`, { quotationSupplierId }),
  generateOrderFromQuotation: (quotationId: string, quotationSupplierId: string) =>
    httpClient.post<PurchaseOrder>(`/purchasing/quotations/${quotationId}/generate-order`, { quotationSupplierId }),

  // Pedidos
  listOrders: (params?: Record<string, unknown>) => httpClient.get<{ data: PurchaseOrder[]; total: number; page: number; perPage: number }>('/purchasing/orders', { params: params as never }),
  getOrder: (id: string) => httpClient.get<PurchaseOrder>(`/purchasing/orders/${id}`),
  createOrder: (branchId: string, payload: Record<string, unknown>) => httpClient.post<PurchaseOrder>('/purchasing/orders', { branchId, ...payload }),
  sendOrder: (id: string, estimatedValue: number) => httpClient.post(`/purchasing/orders/${id}/send`, { estimatedValue }),
  approveOrder: (id: string) => httpClient.post(`/purchasing/orders/${id}/approve`),
  duplicateOrder: (id: string) => httpClient.post<PurchaseOrder>(`/purchasing/orders/${id}/duplicate`),
  reopenOrder: (id: string) => httpClient.post(`/purchasing/orders/${id}/reopen`),
  cancelOrder: (id: string) => httpClient.post(`/purchasing/orders/${id}/cancel`),

  // Recebimento/Conferência
  listReceipts: (purchaseOrderId?: string) => httpClient.get<GoodsReceipt[]>('/purchasing/receipts', { params: { purchaseOrderId } }),
  getReceipt: (id: string) => httpClient.get<GoodsReceipt>(`/purchasing/receipts/${id}`),
  createReceipt: (payload: Record<string, unknown>) => httpClient.post<GoodsReceipt>('/purchasing/receipts', payload),
  conferItem: (receiptId: string, payload: Record<string, unknown>) => httpClient.post(`/purchasing/receipts/${receiptId}/confer`, payload),
  finalizeReceipt: (receiptId: string, installments?: number) => httpClient.post(`/purchasing/receipts/${receiptId}/finalize`, { installments }),

  // Reposição automática
  listSuggestions: (status?: string) => httpClient.get<PurchaseSuggestion[]>('/purchasing/suggestions', { params: { status } }),
  generateSuggestions: (warehouseId: string) => httpClient.post('/purchasing/suggestions/generate', { warehouseId }),
  dismissSuggestion: (id: string) => httpClient.post(`/purchasing/suggestions/${id}/dismiss`),

  // Fornecedor 360
  getSupplierPanel: (supplierId: string) => httpClient.get<Supplier360Panel>(`/purchasing/suppliers/${supplierId}/panel`),

  // Analytics
  getKpis: () => httpClient.get<PurchasingKpis>('/purchasing/analytics/kpis'),
  getTimeline: (days?: number) => httpClient.get<{ date: string; total: number }[]>('/purchasing/analytics/timeline', { params: { days } }),
  getBySupplier: () => httpClient.get<{ supplierId: string; supplierName: string; total: number }[]>('/purchasing/analytics/by-supplier'),
};
