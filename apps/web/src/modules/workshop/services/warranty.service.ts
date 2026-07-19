import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';

export type WarrantyStatus = 'active' | 'expired' | 'claimed' | 'voided';
export type WarrantyType = 'part' | 'service';

export interface Warranty {
  id: string;
  serviceOrderId: string;
  type: WarrantyType;
  description: string;
  termDays: number;
  startDate: string;
  endDate: string;
  status: WarrantyStatus;
  claimedAt?: string | null;
  claimCost?: string | null;
  claimNotes?: string | null;
  serviceOrder: { code: string; customerId: string };
}

const warrantyService = {
  listActive: () => httpClient.get<Warranty[]>('/workshop/warranties/active'),
  claim: (id: string, payload: { claimCost?: number; claimNotes?: string }) =>
    httpClient.post<Warranty>(`/workshop/warranties/${id}/claim`, payload),
  void: (id: string, reason: string) => httpClient.post<Warranty>(`/workshop/warranties/${id}/void`, { reason }),
};

const KEY = 'warranties';

export function useActiveWarranties() {
  return useQuery({ queryKey: [KEY, 'active'], queryFn: warrantyService.listActive });
}

export function useClaimWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, claimCost, claimNotes }: { id: string; claimCost?: number; claimNotes?: string }) =>
      warrantyService.claim(id, { claimCost, claimNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Garantia acionada');
    },
    onError: (error) => toast.error('Não foi possível acionar a garantia', error instanceof Error ? error.message : undefined),
  });
}

export function useVoidWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => warrantyService.void(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Garantia anulada');
    },
  });
}
