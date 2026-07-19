import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';

export type PromotionType = 'percentage_discount' | 'fixed_discount' | 'fixed_price';

export interface Promotion {
  id: string;
  productId: string;
  type: PromotionType;
  value: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  product: { id: string; internalCode: string; shortDescription: string; salePrice: string };
}

export interface CreatePromotionPayload {
  type: PromotionType;
  value: number;
  startDate: string;
  endDate: string;
}

const promotionsService = {
  list: () => httpClient.get<Promotion[]>('/products/promotions'),
  create: (productId: string, payload: CreatePromotionPayload) => httpClient.post<Promotion>(`/products/${productId}/promotions`, payload),
  deactivate: (promotionId: string) => httpClient.post(`/products/promotions/${promotionId}/deactivate`, {}),
};

const KEY = 'promotions';

export function usePromotions() {
  return useQuery({ queryKey: [KEY], queryFn: promotionsService.list });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: CreatePromotionPayload }) => promotionsService.create(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Promoção cadastrada');
    },
    onError: (error) => toast.error('Não foi possível cadastrar a promoção', error instanceof Error ? error.message : undefined),
  });
}

export function useDeactivatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promotionsService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Promoção desativada');
    },
  });
}
