import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';

export interface MercadoLivreStatus {
  connected: boolean;
  mlNickname?: string | null;
  tokenExpiresAt?: string | null;
  lastSyncAt?: string | null;
}

const mercadoLivreService = {
  getStatus: () => httpClient.get<MercadoLivreStatus>('/integrations/mercado-livre/status'),
  connect: (data: { clientId: string; clientSecret: string; redirectUri: string }) =>
    httpClient.post<{ authUrl: string }>('/integrations/mercado-livre/connect', data),
  disconnect: () => httpClient.post('/integrations/mercado-livre/disconnect', {}),
};

export function useMercadoLivreStatus() {
  return useQuery({ queryKey: ['integrations', 'mercado-livre', 'status'], queryFn: mercadoLivreService.getStatus });
}

export function useConnectMercadoLivre() {
  return useMutation({
    mutationFn: mercadoLivreService.connect,
    onSuccess: (data) => {
      // Redireciona o navegador pra tela de autorização do Mercado Livre —
      // não é uma navegação SPA, é sair do app mesmo, por design do OAuth.
      window.location.href = data.authUrl;
    },
    onError: (error) => toast.error('Não foi possível iniciar a conexão', error instanceof Error ? error.message : undefined),
  });
}

export function useDisconnectMercadoLivre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mercadoLivreService.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'mercado-livre', 'status'] });
      toast.success('Mercado Livre desconectado');
    },
  });
}
