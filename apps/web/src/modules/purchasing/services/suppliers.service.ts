import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';
import type { CreateSupplierPayload, Supplier } from '../types/supplier.types';

export interface SupplierQueryParams {
  search?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

interface PaginatedSuppliers {
  data: Supplier[];
  total: number;
  page: number;
  perPage: number;
}

const suppliersService = {
  list: (params: SupplierQueryParams) => httpClient.get<PaginatedSuppliers>('/purchasing/suppliers', { params: params as Record<string, string | number | undefined> }),
  get: (id: string) => httpClient.get<Supplier>(`/purchasing/suppliers/${id}`),
  create: (companyId: string, payload: CreateSupplierPayload) => httpClient.post<Supplier>('/purchasing/suppliers', payload, { params: { companyId } }),
  update: (id: string, payload: Partial<CreateSupplierPayload>) => httpClient.put<Supplier>(`/purchasing/suppliers/${id}`, payload),
  remove: (id: string) => httpClient.delete(`/purchasing/suppliers/${id}`),
};

const KEY = 'purchasing-suppliers';

export function useSuppliers(params: SupplierQueryParams) {
  return useQuery({ queryKey: [KEY, params], queryFn: () => suppliersService.list(params), placeholderData: (prev) => prev });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateSupplierPayload }) => suppliersService.create(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Fornecedor cadastrado');
    },
    onError: (error) => toast.error('Não foi possível cadastrar o fornecedor', error instanceof Error ? error.message : undefined),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSupplierPayload> }) => suppliersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Fornecedor atualizado');
    },
  });
}

export function useRemoveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Fornecedor inativado');
    },
  });
}
