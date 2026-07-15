// ---- Types ------------------------------------------------------------------

export interface SalesKpis {
  grossRevenue: number;
  netRevenue: number;
  grossProfit: number;
  margin: number;
  averageTicket: number;
  totalOrders: number;
  totalItems: number;
  discountTotal: number;
  revenueByDay: { dateKey: number; netRevenue: number }[];
  topProducts: { productId: string; name: string; netRevenue: number; quantity: number }[];
  topCustomers: { customerId: string; name: string; netRevenue: number; orders: number }[];
}

export interface ExecutiveSummary {
  revenue: number;
  grossProfit: number;
  margin: number;
  cashFlow: number;
  overdueRate: number;
  workshopRevenue: number;
  nps: number | null;
}

export interface AbcItem {
  tier: 'A' | 'B' | 'C';
  productId: string;
  name: string;
  revenue: number;
  pct: number;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'snoozed';
  category: string;
  title: string;
  message: string;
  internalLink?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  kind: string;
  category: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface WorkshopKpis {
  totalOrders: number;
  completedOrders: number;
  averageTicket: number;
  totalRevenue: number;
  averageDurationHours: number | null;
  reworkRate: number;
  npsScore: number | null;
  mechanicPerformance: { mechanicId: string; name: string; totalOrders: number; avgDuration: number | null; reworkRate: number }[];
}

export interface FinancialKpis {
  totalReceivable: number;
  totalPayable: number;
  netCashFlow: number;
  overdueReceivable: number;
  overduePayable: number;
  defaultRate: number;
}

// ---- Service ----------------------------------------------------------------

import { httpClient } from '@/api/http.client';

export const biService = {
  getExecutive: (from?: string, to?: string) => httpClient.get<ExecutiveSummary>('/bi/kpi/executive', { params: { from, to } }),
  getSalesKpis: (from?: string, to?: string, branchId?: string) => httpClient.get<SalesKpis>('/bi/kpi/sales', { params: { from, to, branchId } }),
  getAbcCurve: (from?: string, to?: string) => httpClient.get<AbcItem[]>('/bi/kpi/abc', { params: { from, to } }),
  getWorkshopKpis: (from?: string, to?: string) => httpClient.get<WorkshopKpis>('/bi/kpi/workshop', { params: { from, to } }),
  getFinancialKpis: (from?: string, to?: string) => httpClient.get<FinancialKpis>('/bi/kpi/financial', { params: { from, to } }),
  aiQuery: (question: string) => httpClient.post<{ answer: string; latencyMs?: number }>('/bi/ai/query', { question }),
  getAiHistory: () => httpClient.get<{ id: string; query: string; response: string; createdAt: string }[]>('/bi/ai/history'),
  listAlerts: (status?: string) => httpClient.get<Alert[]>('/bi/alerts', { params: { status } }),
  getAlertCount: () => httpClient.get<number>('/bi/alerts/count'),
  runAlerts: () => httpClient.post('/bi/alerts/run'),
  acknowledgeAlert: (id: string) => httpClient.post(`/bi/alerts/${id}/acknowledge`),
  resolveAlert: (id: string) => httpClient.post(`/bi/alerts/${id}/resolve`),
  getNotifications: (page?: number) => httpClient.get<Notification[]>('/bi/notifications', { params: { page } }),
  getUnreadNotifications: () => httpClient.get<Notification[]>('/bi/notifications/unread'),
  getNotifCount: () => httpClient.get<number>('/bi/notifications/count'),
  markRead: (id: string) => httpClient.post(`/bi/notifications/${id}/read`),
  markAllRead: () => httpClient.post('/bi/notifications/read-all'),
  listReports: () => httpClient.get('/bi/reports'),
  createReport: (data: Record<string, unknown>) => httpClient.post('/bi/reports', data),
  executeReport: (id: string, format: 'pdf' | 'xlsx' | 'csv') => httpClient.post(`/bi/reports/${id}/execute`, { format }),
  listAutomations: () => httpClient.get('/bi/automations'),
  createAutomation: (data: Record<string, unknown>) => httpClient.post('/bi/automations', data),
  runAutomation: (id: string) => httpClient.post(`/bi/automations/${id}/run`),
  runEtl: () => httpClient.post('/bi/etl/run'),
};

// ---- Hooks ------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';

const KEY = 'bi';

export function useExecutiveSummary(from?: string, to?: string) {
  return useQuery({ queryKey: [KEY, 'executive', from, to], queryFn: () => biService.getExecutive(from, to), refetchInterval: 60_000 });
}

export function useSalesKpis(from?: string, to?: string) {
  return useQuery({ queryKey: [KEY, 'sales', from, to], queryFn: () => biService.getSalesKpis(from, to) });
}

export function useAbcCurve(from?: string, to?: string) {
  return useQuery({ queryKey: [KEY, 'abc', from, to], queryFn: () => biService.getAbcCurve(from, to) });
}

export function useWorkshopKpis(from?: string, to?: string) {
  return useQuery({ queryKey: [KEY, 'workshop', from, to], queryFn: () => biService.getWorkshopKpis(from, to) });
}

export function useFinancialKpis(from?: string, to?: string) {
  return useQuery({ queryKey: [KEY, 'financial', from, to], queryFn: () => biService.getFinancialKpis(from, to) });
}

export function useAiQuery() {
  return useMutation({ mutationFn: (question: string) => biService.aiQuery(question), onError: (e: Error) => toast.error('Erro ao consultar IA', e.message) });
}

export function useAiHistory() {
  return useQuery({ queryKey: [KEY, 'ai-history'], queryFn: biService.getAiHistory });
}

export function useAlerts(status?: string) {
  return useQuery({ queryKey: [KEY, 'alerts', status], queryFn: () => biService.listAlerts(status), refetchInterval: 30_000 });
}

export function useAlertCount() {
  return useQuery({ queryKey: [KEY, 'alert-count'], queryFn: biService.getAlertCount, refetchInterval: 30_000 });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => biService.acknowledgeAlert(id), onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, 'alerts'] }); qc.invalidateQueries({ queryKey: [KEY, 'alert-count'] }); } });
}

export function useNotifications() {
  return useQuery({ queryKey: [KEY, 'notifications'], queryFn: biService.getUnreadNotifications, refetchInterval: 15_000 });
}

export function useNotifCount() {
  return useQuery({ queryKey: [KEY, 'notif-count'], queryFn: biService.getNotifCount, refetchInterval: 15_000 });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: biService.markAllRead, onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, 'notifications'] }); qc.invalidateQueries({ queryKey: [KEY, 'notif-count'] }); } });
}

export function useRunEtl() {
  return useMutation({ mutationFn: biService.runEtl, onSuccess: () => toast.success('ETL executado — dados atualizados'), onError: (e: Error) => toast.error('Erro no ETL', e.message) });
}

export function useAutomations() {
  return useQuery({ queryKey: [KEY, 'automations'], queryFn: biService.listAutomations });
}

export function useRunAutomation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => biService.runAutomation(id), onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, 'automations'] }); toast.success('Automação executada'); } });
}
