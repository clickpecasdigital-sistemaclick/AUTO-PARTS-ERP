import { httpClient } from '@/api/http.client';
import type {
  BankAccount,
  CashFlowDay,
  DreReport,
  ExecutiveDashboardKpis,
  ExpenseRankingItem,
  Payable,
  Receivable,
} from '../types/financial.types';

export interface FinancialQueryParams {
  status?: string;
  costCenterId?: string;
  bankAccountId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  perPage?: number;
}

/** Camada de serviço HTTP do Financeiro — espelha 1:1 as rotas de `apps/api/src/modules/financial`. */
export const financialService = {
  // Contas a Pagar
  listPayables: (params: FinancialQueryParams) => httpClient.get<{ data: Payable[]; total: number; page: number; perPage: number }>('/financial/payables', { params: params as never }),
  getPayable: (id: string) => httpClient.get<Payable>(`/financial/payables/${id}`),
  createPayable: (companyId: string, payload: Record<string, unknown>) => httpClient.post<Payable>('/financial/payables', payload, { params: { companyId } }),
  settlePayable: (id: string, payload: Record<string, unknown>) => httpClient.post<Payable>(`/financial/payables/${id}/settle`, payload),
  reversePayable: (id: string, reason: string) => httpClient.post<Payable>(`/financial/payables/${id}/reverse`, { reason }),
  renegotiatePayable: (id: string, payload: Record<string, unknown>) => httpClient.post<Payable>(`/financial/payables/${id}/renegotiate`, payload),

  // Contas a Receber
  listReceivables: (params: FinancialQueryParams) => httpClient.get<{ data: Receivable[]; total: number; page: number; perPage: number }>('/financial/receivables', { params: params as never }),
  getReceivable: (id: string) => httpClient.get<Receivable>(`/financial/receivables/${id}`),
  createReceivable: (companyId: string, payload: Record<string, unknown>) => httpClient.post<Receivable>('/financial/receivables', payload, { params: { companyId } }),
  settleReceivable: (id: string, payload: Record<string, unknown>) => httpClient.post<Receivable>(`/financial/receivables/${id}/settle`, payload),
  reverseReceivable: (id: string, reason: string) => httpClient.post<Receivable>(`/financial/receivables/${id}/reverse`, { reason }),
  renegotiateReceivable: (id: string, payload: Record<string, unknown>) => httpClient.post<Receivable>(`/financial/receivables/${id}/renegotiate`, payload),

  // Bancos
  listBankAccounts: (companyId?: string) => httpClient.get<BankAccount[]>('/financial/banks/accounts', { params: { companyId } }),

  // Fluxo de Caixa / DRE
  getCashFlowConsolidated: (startDate: string, endDate: string, companyId?: string) =>
    httpClient.get<CashFlowDay[]>('/financial/cash-flow/consolidated', { params: { startDate, endDate, companyId } }),
  getDre: (companyId: string, startDate: string, endDate: string) => httpClient.get<DreReport>('/financial/dre', { params: { companyId, startDate, endDate } }),

  // Dashboard Executivo
  getExecutiveKpis: (companyId: string) => httpClient.get<ExecutiveDashboardKpis>('/financial/analytics/executive-kpis', { params: { companyId } }),
  getExpenseRanking: (companyId: string) => httpClient.get<ExpenseRankingItem[]>('/financial/analytics/expense-ranking', { params: { companyId } }),
};
