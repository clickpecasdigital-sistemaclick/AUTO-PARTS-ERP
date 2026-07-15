import { httpClient } from '@/api/http.client';
import type {
  AbcCriteria,
  AbcCurveEntry,
  StockAlerts,
  StockInventory,
  StockKpis,
  StockMovement,
  StockTransfer,
  TurnoverEntry,
  Warehouse,
} from '../types/inventory.types';

export interface MovementQueryParams {
  productId?: string;
  warehouseId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

/** Camada de serviço HTTP do módulo de Estoque — espelha 1:1 as rotas REST de `apps/api/src/modules/inventory`. */
export const inventoryService = {
  // Depósitos / WMS
  listWarehouses: () => httpClient.get<Warehouse[]>('/stock/warehouses'),
  getWarehouseTree: (warehouseId: string) => httpClient.get(`/stock/warehouses/${warehouseId}/tree`),

  // Movimentações
  listMovements: (params: MovementQueryParams) =>
    httpClient.get<{ data: StockMovement[]; total: number; page: number; perPage: number }>('/stock/movements', {
      params: params as Record<string, string | number | boolean | undefined>,
    }),
  createMovement: (payload: Record<string, unknown>) => httpClient.post('/stock/movements', payload),
  getBalance: (productId: string, warehouseId: string) => httpClient.get(`/stock/movements/balance/${productId}/${warehouseId}`),

  // Analytics / Dashboard
  getKpis: (warehouseId?: string) => httpClient.get<StockKpis>('/stock/analytics/kpis', { params: { warehouseId } }),
  getAbcCurve: (criteria: AbcCriteria, warehouseId?: string) =>
    httpClient.get<AbcCurveEntry[]>('/stock/analytics/abc-curve', { params: { criteria, warehouseId } }),
  getTurnover: (periodDays?: number, warehouseId?: string) =>
    httpClient.get<TurnoverEntry[]>('/stock/analytics/turnover', { params: { periodDays, warehouseId } }),
  getAlerts: (warehouseId?: string) => httpClient.get<StockAlerts>('/stock/analytics/alerts', { params: { warehouseId } }),

  // Transferências
  listTransfers: () => httpClient.get<StockTransfer[]>('/stock/transfers'),
  createTransfer: (payload: Record<string, unknown>) => httpClient.post<StockTransfer>('/stock/transfers', payload),
  shipTransfer: (id: string) => httpClient.post(`/stock/transfers/${id}/ship`),
  receiveTransfer: (id: string) => httpClient.post(`/stock/transfers/${id}/receive`),
  cancelTransfer: (id: string) => httpClient.post(`/stock/transfers/${id}/cancel`),

  // Inventário
  listInventories: (warehouseId?: string) => httpClient.get<StockInventory[]>('/stock/inventories', { params: { warehouseId } }),
  getInventory: (id: string) => httpClient.get<StockInventory>(`/stock/inventories/${id}`),
  getInventoryDifferences: (id: string) => httpClient.get(`/stock/inventories/${id}/differences`),
  openInventory: (payload: Record<string, unknown>) => httpClient.post<StockInventory>('/stock/inventories', payload),
  submitCount: (inventoryId: string, payload: { productId: string; countedQuantity: number }) =>
    httpClient.post(`/stock/inventories/${inventoryId}/count`, payload),
  reconcileInventory: (id: string) => httpClient.post(`/stock/inventories/${id}/reconcile`),
  recountInventory: (id: string, productIds: string[]) => httpClient.post(`/stock/inventories/${id}/recount`, { productIds }),

  // Reservas
  listActiveReservations: (productId?: string) => httpClient.get('/stock/reservations', { params: { productId } }),
  reserve: (payload: Record<string, unknown>) => httpClient.post('/stock/reservations', payload),
  releaseReservation: (id: string) => httpClient.post(`/stock/reservations/${id}/release`),

  // Import/Export
  importStock: (file: File, format: 'csv' | 'xlsx') => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post(`/stock/import?format=${format}`, formData);
  },
};
