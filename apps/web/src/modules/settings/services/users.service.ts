import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer';

export interface TenantUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InviteUserPayload {
  email: string;
  fullName: string;
  role: UserRole;
}

const usersService = {
  list: () => httpClient.get<TenantUser[]>('/users'),
  invite: (payload: InviteUserPayload) => httpClient.post<TenantUser>('/users/invite', payload),
  updateRole: (id: string, role: UserRole) => httpClient.put<TenantUser>(`/users/${id}/role`, { role }),
  deactivate: (id: string) => httpClient.delete(`/users/${id}`),
};

const KEY = 'users';

export function useUsers() {
  return useQuery({ queryKey: [KEY], queryFn: usersService.list });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersService.invite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Convite enviado — a pessoa recebe um e-mail para definir a senha e acessar.');
    },
    onError: (error) => toast.error('Não foi possível convidar', error instanceof Error ? error.message : undefined),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Papel atualizado');
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersService.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Usuário desativado');
    },
  });
}
