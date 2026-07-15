import { QueryClient } from '@tanstack/react-query';

/**
 * Instância única do TanStack Query.
 * staleTime e retry calibrados para um ERP: dados de negócio mudam,
 * mas não queremos refetch agressivo o suficiente para sobrecarregar a API
 * em um cenário de milhares de usuários simultâneos.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s
      gcTime: 1000 * 60 * 5, // 5min
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
