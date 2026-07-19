import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  createdAt: string;
  user?: { fullName: string | null; email: string } | null;
}

export interface AuditLogQueryParams {
  page?: number;
  perPage?: number;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
  search?: string;
}

interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  total: number;
  page: number;
  perPage: number;
}

const auditService = {
  list: (params: AuditLogQueryParams) => httpClient.get<PaginatedAuditLogs>('/audit-logs', { params: params as Record<string, string | number | undefined> }),
  listEntities: () => httpClient.get<string[]>('/audit-logs/entities'),
};

export function useAuditLogs(params: AuditLogQueryParams) {
  return useQuery({ queryKey: ['audit-logs', params], queryFn: () => auditService.list(params), placeholderData: (prev) => prev });
}

export function useAuditEntities() {
  return useQuery({ queryKey: ['audit-logs', 'entities'], queryFn: auditService.listEntities, staleTime: 1000 * 60 * 10 });
}

export async function downloadAuditExport(params: AuditLogQueryParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
  const { data: session } = await import('@/api/supabaseClient').then((m) => m.supabase.auth.getSession());

  const response = await fetch(`${base}/audit-logs/export?${search.toString()}`, {
    headers: session.session ? { Authorization: `Bearer ${session.session.access_token}` } : {},
  });
  if (!response.ok) throw new Error('Não foi possível exportar');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
