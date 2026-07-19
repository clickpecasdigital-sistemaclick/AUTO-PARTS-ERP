import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';

export type LostSaleReason = 'out_of_stock' | 'price_too_high' | 'product_not_found' | 'customer_gave_up' | 'lost_to_competitor' | 'other';

export interface LostSale {
  id: string;
  customerId?: string | null;
  productId?: string | null;
  productDescription?: string | null;
  reason: LostSaleReason;
  estimatedValue?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: { name: string } | null;
  product?: { internalCode: string; shortDescription: string } | null;
}

export interface CreateLostSalePayload {
  customerId?: string;
  productId?: string;
  productDescription?: string;
  reason: LostSaleReason;
  estimatedValue?: number;
  notes?: string;
}

const lostSalesService = {
  list: () => httpClient.get<LostSale[]>('/products/lost-sales'),
  getSummary: () => httpClient.get<{ reason: LostSaleReason; count: number }[]>('/products/lost-sales/summary'),
  create: (branchId: string, payload: CreateLostSalePayload) => httpClient.post<LostSale>('/products/lost-sales', payload, { params: { branchId } }),
};

const KEY = 'lost-sales';

export function useLostSales() {
  return useQuery({ queryKey: [KEY], queryFn: lostSalesService.list });
}

export function useLostSalesSummary() {
  return useQuery({ queryKey: [KEY, 'summary'], queryFn: lostSalesService.getSummary });
}

export function useCreateLostSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: CreateLostSalePayload }) => lostSalesService.create(branchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Venda perdida registrada');
    },
    onError: (error) => toast.error('Não foi possível registrar', error instanceof Error ? error.message : undefined),
  });
}
