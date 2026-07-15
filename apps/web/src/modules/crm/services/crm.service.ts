import { httpClient } from '@/api/http.client';
import type {
  CrmDashboardKpis,
  CrmTask,
  Opportunity,
  PipelineStage,
  PipelineStageWithOpportunities,
  TopCustomer,
  TopSupplier,
} from '../types/crm.types';

/** Camada de serviço HTTP do CRM — espelha 1:1 as rotas de `apps/api/src/modules/crm`. */
export const crmService = {
  // Pipeline
  listStages: () => httpClient.get<PipelineStage[]>('/crm/pipeline-stages'),
  createStage: (payload: Record<string, unknown>) => httpClient.post<PipelineStage>('/crm/pipeline-stages', payload),
  getBoard: () => httpClient.get<PipelineStageWithOpportunities[]>('/crm/board'),
  getOpportunity: (id: string) => httpClient.get<Opportunity>(`/crm/opportunities/${id}`),
  createOpportunity: (payload: Record<string, unknown>) => httpClient.post<Opportunity>('/crm/opportunities', payload),
  moveOpportunity: (id: string, pipelineStageId: string) => httpClient.post(`/crm/opportunities/${id}/move`, { pipelineStageId }),

  // Tarefas
  listPendingTasks: (assignedTo?: string) => httpClient.get<CrmTask[]>('/crm/tasks', { params: { assignedTo } }),
  listOverdueTasks: () => httpClient.get<CrmTask[]>('/crm/tasks/overdue'),
  createTask: (payload: Record<string, unknown>) => httpClient.post('/crm/tasks', payload),
  completeTask: (id: string) => httpClient.post(`/crm/tasks/${id}/complete`),

  // Analytics / Dashboard
  getKpis: () => httpClient.get<CrmDashboardKpis>('/crm/analytics/kpis'),
  getTopCustomers: () => httpClient.get<TopCustomer[]>('/crm/analytics/top-customers'),
  getTopSuppliers: () => httpClient.get<TopSupplier[]>('/crm/analytics/top-suppliers'),
  getSalesByCustomer: () => httpClient.get<{ customerId: string; customerName: string; total: number }[]>('/crm/analytics/sales-by-customer'),
  getTimeline: (days?: number) => httpClient.get<{ date: string; newCustomers: number; wonValue: number }[]>('/crm/analytics/timeline', { params: { days } }),
  getCustomerMap: () => httpClient.get<{ id: string; name: string; latitude: number; longitude: number; city: string; state: string }[]>('/crm/analytics/customer-map'),

  // Chamados
  listSupportTickets: (status?: string) => httpClient.get('/crm/support-tickets', { params: { status } }),
};
