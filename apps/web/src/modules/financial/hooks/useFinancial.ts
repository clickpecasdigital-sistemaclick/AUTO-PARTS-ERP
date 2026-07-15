import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import { financialService, type FinancialQueryParams } from '../services/financial.service';

const KEY = 'financial';

export function usePayables(params: FinancialQueryParams) {
  return useQuery({ queryKey: [KEY, 'payables', params], queryFn: () => financialService.listPayables(params), placeholderData: (prev) => prev });
}

export function useCreatePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: Record<string, unknown> }) => financialService.createPayable(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'payables'] });
      toast.success('Título a pagar criado');
    },
    onError: (error: Error) => toast.error('Não foi possível criar o título', error.message),
  });
}

export function useSettlePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => financialService.settlePayable(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'payables'] });
      toast.success('Baixa registrada');
    },
    onError: (error: Error) => toast.error('Não foi possível dar baixa', error.message),
  });
}

export function useReversePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => financialService.reversePayable(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'payables'] });
      toast.success('Baixa estornada');
    },
    onError: (error: Error) => toast.error('Não foi possível estornar', error.message),
  });
}

export function useRenegotiatePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => financialService.renegotiatePayable(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'payables'] });
      toast.success('Título renegociado');
    },
    onError: (error: Error) => toast.error('Não foi possível renegociar', error.message),
  });
}

export function useReceivables(params: FinancialQueryParams) {
  return useQuery({ queryKey: [KEY, 'receivables', params], queryFn: () => financialService.listReceivables(params), placeholderData: (prev) => prev });
}

export function useCreateReceivable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: Record<string, unknown> }) => financialService.createReceivable(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'receivables'] });
      toast.success('Título a receber criado');
    },
    onError: (error: Error) => toast.error('Não foi possível criar o título', error.message),
  });
}

export function useSettleReceivable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => financialService.settleReceivable(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'receivables'] });
      toast.success('Recebimento registrado');
    },
    onError: (error: Error) => toast.error('Não foi possível registrar o recebimento', error.message),
  });
}

export function useReverseReceivable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => financialService.reverseReceivable(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'receivables'] });
      toast.success('Recebimento estornado');
    },
    onError: (error: Error) => toast.error('Não foi possível estornar', error.message),
  });
}

export function useRenegotiateReceivable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => financialService.renegotiateReceivable(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'receivables'] });
      toast.success('Título renegociado');
    },
    onError: (error: Error) => toast.error('Não foi possível renegociar', error.message),
  });
}

export function useBankAccounts(companyId?: string) {
  return useQuery({ queryKey: [KEY, 'bank-accounts', companyId], queryFn: () => financialService.listBankAccounts(companyId) });
}

export function useCashFlowConsolidated(startDate: string, endDate: string, companyId?: string) {
  return useQuery({ queryKey: [KEY, 'cash-flow', startDate, endDate, companyId], queryFn: () => financialService.getCashFlowConsolidated(startDate, endDate, companyId) });
}

export function useDre(companyId: string | undefined, startDate: string, endDate: string) {
  return useQuery({ queryKey: [KEY, 'dre', companyId, startDate, endDate], queryFn: () => financialService.getDre(companyId!, startDate, endDate), enabled: !!companyId });
}

export function useExecutiveKpis(companyId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'executive-kpis', companyId], queryFn: () => financialService.getExecutiveKpis(companyId!), enabled: !!companyId, refetchInterval: 60_000 });
}

export function useExpenseRanking(companyId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'expense-ranking', companyId], queryFn: () => financialService.getExpenseRanking(companyId!), enabled: !!companyId });
}
