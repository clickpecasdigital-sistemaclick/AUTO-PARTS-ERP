import { httpClient } from '@/api/http.client';
import type { ServiceCatalogItem, ServiceOrder, WorkshopAppointment, WorkshopDashboardKpis } from '../types/workshop.types';

export interface ServiceOrderQueryParams {
  status?: string;
  mechanicId?: string;
  boxId?: string;
  priority?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

/** Camada de serviço HTTP da Oficina — espelha 1:1 as rotas de `apps/api/src/modules/workshop`. */
export const workshopService = {
  // Ordens de Serviço
  listOrders: (params: ServiceOrderQueryParams) => httpClient.get<{ data: ServiceOrder[]; total: number; page: number; perPage: number }>('/workshop/orders', { params: params as never }),
  getOrder: (id: string) => httpClient.get<ServiceOrder>(`/workshop/orders/${id}`),
  createOrder: (branchId: string, payload: Record<string, unknown>) => httpClient.post<ServiceOrder>('/workshop/orders', { branchId, ...payload }),
  transitionOrder: (id: string, toStatus: string, notes?: string) => httpClient.post<ServiceOrder>(`/workshop/orders/${id}/transition`, { toStatus, notes }),
  cancelOrder: (id: string, reason: string) => httpClient.post<ServiceOrder>(`/workshop/orders/${id}/cancel`, { reason }),
  updateDiagnosis: (id: string, payload: Record<string, unknown>) => httpClient.post<ServiceOrder>(`/workshop/orders/${id}/diagnosis`, payload),
  addServiceItem: (id: string, payload: Record<string, unknown>) => httpClient.post(`/workshop/orders/${id}/services`, payload),
  removeServiceItem: (id: string, itemId: string) => httpClient.delete(`/workshop/orders/${id}/services/${itemId}`),
  addPartItem: (id: string, payload: Record<string, unknown>) => httpClient.post(`/workshop/orders/${id}/parts`, payload),
  removePartItem: (id: string, itemId: string) => httpClient.delete(`/workshop/orders/${id}/parts/${itemId}`),
  confirmParts: (id: string, warehouseId: string) => httpClient.post(`/workshop/orders/${id}/parts/confirm`, { warehouseId }),
  createRework: (id: string, branchId: string, complaint: string) => httpClient.post<ServiceOrder>(`/workshop/orders/${id}/rework`, { branchId, complaint }),

  // Check-in
  getCheckIn: (orderId: string) => httpClient.get(`/workshop/orders/${orderId}/check-in`),
  createCheckIn: (orderId: string, payload: Record<string, unknown>) => httpClient.post(`/workshop/orders/${orderId}/check-in`, payload),

  // Checklist
  listChecklistTemplates: () => httpClient.get('/workshop/checklists/templates'),
  getChecklistsByOrder: (orderId: string) => httpClient.get(`/workshop/checklists/orders/${orderId}`),
  applyChecklist: (orderId: string, templateId: string) => httpClient.post(`/workshop/checklists/orders/${orderId}/apply`, { templateId }),
  fillChecklistItem: (checklistId: string, payload: Record<string, unknown>) => httpClient.post(`/workshop/checklists/${checklistId}/items`, payload),

  // Entrega
  getDelivery: (orderId: string) => httpClient.get(`/workshop/orders/${orderId}/delivery`),
  createDelivery: (orderId: string, payload: Record<string, unknown>) => httpClient.post(`/workshop/orders/${orderId}/delivery`, payload),

  // Agenda
  getAgenda: (startDate: string, endDate: string, mechanicId?: string, boxId?: string) =>
    httpClient.get<WorkshopAppointment[]>('/workshop/appointments', { params: { startDate, endDate, mechanicId, boxId } }),
  listWaitlist: () => httpClient.get<WorkshopAppointment[]>('/workshop/appointments/waitlist'),
  createAppointment: (branchId: string, payload: Record<string, unknown>) => httpClient.post<WorkshopAppointment>('/workshop/appointments', { branchId, ...payload }),
  confirmAppointment: (id: string) => httpClient.post(`/workshop/appointments/${id}/confirm`),
  rescheduleAppointment: (id: string, newScheduledAt: string, durationMinutes?: number) => httpClient.post(`/workshop/appointments/${id}/reschedule`, { newScheduledAt, durationMinutes }),
  cancelAppointment: (id: string, reason: string) => httpClient.post(`/workshop/appointments/${id}/cancel`, { reason }),

  // Garantias
  listActiveWarranties: () => httpClient.get('/workshop/warranties/active'),
  claimWarranty: (id: string, payload: Record<string, unknown>) => httpClient.post(`/workshop/warranties/${id}/claim`, payload),

  // Painel do Mecânico
  getMechanicPanel: (mechanicId: string) => httpClient.get(`/workshop/mechanics/${mechanicId}/panel`),

  // Pós-venda
  listFollowUpsPending: () => httpClient.get('/workshop/post-sale/follow-ups/pending'),
  getNpsSummary: () => httpClient.get('/workshop/post-sale/nps-summary'),

  // Catálogo de Serviços / Boxes
  listServices: (category?: string) => httpClient.get<ServiceCatalogItem[]>('/workshop/services', { params: { category } }),
  listBoxes: (branchId?: string) => httpClient.get('/workshop/boxes', { params: { branchId } }),

  // Dashboard
  getKpis: (branchId?: string) => httpClient.get<WorkshopDashboardKpis>('/workshop/analytics/kpis', { params: { branchId } }),
  getTodayAgenda: (branchId?: string) => httpClient.get<WorkshopAppointment[]>('/workshop/analytics/today-agenda', { params: { branchId } }),
  getOrdersByStatus: (branchId?: string) => httpClient.get<{ status: string; count: number }[]>('/workshop/analytics/orders-by-status', { params: { branchId } }),
};
