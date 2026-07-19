import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';

export interface VehicleListItem {
  id: string;
  plate?: string | null;
  chassis?: string | null;
  color?: string | null;
  modelYear?: number | null;
  manufactureYear?: number | null;
  customer: { id: string; name: string };
  vehicleVersion?: { name: string; model: { name: string; make: { name: string } } } | null;
}

export interface VehicleDetail extends VehicleListItem {
  renavam?: string | null;
  currentKm?: number | null;
  notes?: string | null;
  customer: { id: string; name: string; phone?: string | null; email?: string | null };
  serviceOrders: { id: string; code: string; status: string; openedAt: string; totalAmount: string }[];
}

export interface UpdateVehiclePayload {
  plate?: string;
  chassis?: string;
  renavam?: string;
  color?: string;
  modelYear?: number;
  manufactureYear?: number;
  currentKm?: number;
  notes?: string;
}

const vehiclesService = {
  list: (search?: string) => httpClient.get<VehicleListItem[]>('/mdm/customers/vehicles/all', { params: { search } }),
  get: (id: string) => httpClient.get<VehicleDetail>(`/mdm/customers/vehicles/${id}`),
  update: (id: string, payload: UpdateVehiclePayload) => httpClient.put<VehicleDetail>(`/mdm/customers/vehicles/${id}`, payload),
};

const KEY = 'vehicles-directory';

export function useVehiclesDirectory(search?: string) {
  return useQuery({ queryKey: [KEY, search], queryFn: () => vehiclesService.list(search) });
}

export function useVehicleDetail(id: string | undefined) {
  return useQuery({ queryKey: [KEY, 'detail', id], queryFn: () => vehiclesService.get(id!), enabled: !!id });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVehiclePayload }) => vehiclesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Veículo atualizado');
    },
  });
}
