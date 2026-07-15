import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import { mdmService, type CustomerQueryParams } from '../services/mdm.service';

const KEY = 'mdm';

export function useCustomers(params: CustomerQueryParams) {
  return useQuery({ queryKey: [KEY, 'customers', params], queryFn: () => mdmService.listCustomers(params), placeholderData: (prev) => prev });
}

export function useCustomer(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'customers', id], queryFn: () => mdmService.getCustomer(id!), enabled: !!id });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: Record<string, unknown> }) => mdmService.createCustomer(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'customers'] });
      toast.success('Cliente cadastrado — fonte oficial atualizada (MDM)');
    },
    onError: (error: Error) => toast.error('Não foi possível cadastrar o cliente', error.message),
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => mdmService.updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'customers'] });
      toast.success('Cliente atualizado');
    },
    onError: (error: Error) => toast.error('Não foi possível atualizar', error.message),
  });
}

export function useBirthdays(month?: number) {
  return useQuery({ queryKey: [KEY, 'birthdays', month], queryFn: () => mdmService.getBirthdays(month) });
}

export function useCustomer360Summary(customerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'customers', customerId, '360-summary'], queryFn: () => mdmService.getCustomer360Summary(customerId!), enabled: !!customerId });
}

export function useCustomer360Timeline(customerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'customers', customerId, '360-timeline'], queryFn: () => mdmService.getCustomer360Timeline(customerId!), enabled: !!customerId });
}

export function useCreditProfile(customerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'customers', customerId, 'credit'], queryFn: () => mdmService.getCreditProfile(customerId!), enabled: !!customerId });
}

export function useCreditHistory(customerId: string | undefined) {
  return useQuery({ queryKey: [KEY, 'customers', customerId, 'credit-history'], queryFn: () => mdmService.getCreditHistory(customerId!), enabled: !!customerId });
}

export function useRefreshCredit(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mdmService.refreshCredit(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'customers', customerId] });
      toast.success('Perfil de crédito recalculado');
    },
  });
}

export function useUpdateCreditLimit(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ newLimit, reason }: { newLimit: number; reason?: string }) => mdmService.updateCreditLimit(customerId, newLimit, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'customers', customerId] });
      toast.success('Limite de crédito atualizado');
    },
    onError: (error: Error) => toast.error('Não foi possível atualizar o limite', error.message),
  });
}

export function useAddContact(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => mdmService.addContact(customerId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'customers', customerId] }),
  });
}

export function useRemoveContact(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => mdmService.removeContact(customerId, contactId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'customers', customerId] }),
  });
}

export function useAddAddress(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => mdmService.addAddress(customerId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'customers', customerId] }),
  });
}

export function useRemoveAddress(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => mdmService.removeAddress(addressId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, 'customers', customerId] }),
  });
}

export function useAddVehicle(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => mdmService.addVehicle(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'customers', customerId] });
      toast.success('Veículo adicionado');
    },
  });
}

export function useExportCustomerData() {
  return useMutation({
    mutationFn: (customerId: string) => mdmService.exportCustomerData(customerId),
    onSuccess: () => toast.success('Exportação de dados (LGPD) concluída'),
  });
}

export function useAnonymizeCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => mdmService.anonymizeCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'customers'] });
      toast.success('Cliente anonimizado (LGPD)');
    },
  });
}
