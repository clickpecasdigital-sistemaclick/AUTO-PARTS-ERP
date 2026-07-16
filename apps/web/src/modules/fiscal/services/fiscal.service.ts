import { httpClient } from '@/api/http.client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import type { FiscalConfig, FiscalDashboard, FiscalInvoice, TaxRule } from '../types/fiscal.types';

// ---- Service ----------------------------------------------------------------

export const fiscalService = {
  getDashboard: (branchId?: string) => httpClient.get<FiscalDashboard>('/fiscal/dashboard', { params: { branchId } }),
  listInvoices: (params: Record<string, string>) => httpClient.get<{ data: FiscalInvoice[]; total: number; page: number; perPage: number }>('/fiscal/invoices', { params: params as never }),
  getInvoice: (id: string) => httpClient.get<FiscalInvoice>(`/fiscal/invoices/${id}`),
  getXmlUrl: (id: string) => `/fiscal/invoices/${id}/xml`,
  getDanfeUrl: (id: string) => `/fiscal/invoices/${id}/danfe`,
  issueNfe: (branchId: string, payload: Record<string, unknown>) => httpClient.post<FiscalInvoice>('/fiscal/invoices/nfe', { branchId, ...payload }),
  issueNfce: (branchId: string, saleId: string, items: unknown[]) => httpClient.post<FiscalInvoice>('/fiscal/invoices/nfce', { branchId, saleId, items }),
  cancelInvoice: (id: string, justification: string) => httpClient.post(`/fiscal/events/${id}/cancel`, { justification }),
  issueCorrectionLetter: (id: string, correction: string) => httpClient.post(`/fiscal/events/${id}/correction-letter`, { correction }),
  registerRejection: (id: string, code: string, message: string) => httpClient.post(`/fiscal/invoices/${id}/reject`, { code, message }),
  getConfig: (branchId: string) => httpClient.get<FiscalConfig>(`/fiscal/config/${branchId}`),
  upsertConfig: (branchId: string, data: Record<string, unknown>) => httpClient.post<FiscalConfig>(`/fiscal/config/${branchId}`, data),
  listTaxRules: () => httpClient.get<TaxRule[]>('/fiscal/tax-rules'),
  createTaxRule: (data: Record<string, unknown>) => httpClient.post<TaxRule>('/fiscal/tax-rules', data),
  listNcm: (search: string) => httpClient.get('/fiscal/ncm', { params: { search } }),
  listCfop: (type?: string) => httpClient.get('/fiscal/cfop', { params: { type } }),
  listCertificates: () => httpClient.get('/fiscal/certificates'),
  getExpiryAlerts: () => httpClient.get('/fiscal/certificates/expiry-alerts'),
  uploadCertificate: (companyId: string, alias: string, password: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId);
    formData.append('alias', alias);
    formData.append('password', password);
    return httpClient.post('/fiscal/certificates', formData);
  },
};

// ---- Hooks ------------------------------------------------------------------

const KEY = 'fiscal';

export function useFiscalDashboard(branchId?: string) {
  return useQuery({ queryKey: [KEY, 'dashboard', branchId], queryFn: () => fiscalService.getDashboard(branchId), refetchInterval: 30_000 });
}

export function useFiscalInvoices(params: Record<string, string>) {
  return useQuery({ queryKey: [KEY, 'invoices', params], queryFn: () => fiscalService.listInvoices(params), placeholderData: (prev) => prev });
}

export function useFiscalInvoice(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'invoices', id], queryFn: () => fiscalService.getInvoice(id!), enabled: !!id });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) => fiscalService.cancelInvoice(id, justification),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [KEY, 'invoices'] }); toast.success('Nota cancelada'); },
    onError: (e: Error) => toast.error('Erro ao cancelar', e.message),
  });
}

export function useIssueCorrectionLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, correction }: { id: string; correction: string }) => fiscalService.issueCorrectionLetter(id, correction),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [KEY, 'invoices'] }); toast.success('CC-e emitida'); },
    onError: (e: Error) => toast.error('Erro ao emitir CC-e', e.message),
  });
}

export function useFiscalConfig(branchId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'config', branchId], queryFn: () => fiscalService.getConfig(branchId!), enabled: !!branchId });
}

export function useUpsertFiscalConfig(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fiscalService.upsertConfig(branchId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [KEY, 'config', branchId] }); toast.success('Configuração salva'); },
    onError: (e: Error) => toast.error('Erro ao salvar configuração', e.message),
  });
}

export function useTaxRules() {
  return useQuery({ queryKey: [KEY, 'tax-rules'], queryFn: fiscalService.listTaxRules });
}

export function useCreateTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fiscalService.createTaxRule(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [KEY, 'tax-rules'] }); toast.success('Regra criada'); },
  });
}

export function useFiscalCertificates() {
  return useQuery({ queryKey: [KEY, 'certificates'], queryFn: fiscalService.listCertificates });
}

export function useUploadCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, alias, password, file }: { companyId: string; alias: string; password: string; file: File }) =>
      fiscalService.uploadCertificate(companyId, alias, password, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'certificates'] });
      toast.success('Certificado enviado e validado com sucesso');
    },
    onError: (error) => toast.error('Não foi possível enviar o certificado', error instanceof Error ? error.message : undefined),
  });
}

export function useExpiryAlerts() {
  return useQuery({ queryKey: [KEY, 'expiry-alerts'], queryFn: fiscalService.getExpiryAlerts });
}

export function useNcmSearch(search: string) {
  return useQuery({ queryKey: [KEY, 'ncm', search], queryFn: () => fiscalService.listNcm(search), enabled: search.length >= 2 });
}
