import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/common/LoadingScreen';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Guarda de autenticação: redireciona para /login quando não há sessão
 * Supabase ativa. Primeira camada de proteção do Shell — roda antes de
 * qualquer verificação de permissão granular (ver PermissionGuard).
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen message="Verificando sessão..." />;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
