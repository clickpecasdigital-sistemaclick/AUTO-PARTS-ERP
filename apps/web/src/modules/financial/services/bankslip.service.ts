import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';

export type BankSlipStatus = 'registered' | 'paid' | 'overdue' | 'cancelled';

export interface BankSlip {
  id: string;
  ourNumber?: string | null;
  barcodeNumber?: string | null;
  amount: string;
  dueDate: string;
  status: BankSlipStatus;
  bankAccount: { bankName: string };
  receivable?: { customer?: { name: string } | null } | null;
}

const bankSlipService = {
  list: () => httpClient.get<BankSlip[]>('/financial/bank-slips'),
  register: (payload: { bankAccountId: string; amount: number; dueDate: string; receivableId?: string }) =>
    httpClient.post<BankSlip>('/financial/bank-slips', payload),
  settle: (id: string) => httpClient.post<BankSlip>(`/financial/bank-slips/${id}/settle`, {}),
};

const KEY = 'bank-slips';

export function useBankSlips() {
  return useQuery({ queryKey: [KEY], queryFn: bankSlipService.list });
}

export function useRegisterBankSlip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bankSlipService.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Boleto registrado');
    },
    onError: (error) => toast.error('Não foi possível registrar o boleto', error instanceof Error ? error.message : undefined),
  });
}

export function useSettleBankSlip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bankSlipService.settle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Boleto baixado como pago');
    },
  });
}
