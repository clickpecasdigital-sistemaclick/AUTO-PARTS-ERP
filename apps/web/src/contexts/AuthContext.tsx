import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/api/supabaseClient';
import { httpClient } from '@/api/http.client';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { AuthenticatedUser } from '@/types/user.types';
import type { Company, Branch } from '@/types/user.types';

interface AuthContextValue {
  session: Session | null;
  user: AuthenticatedUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Fonte única da sessão autenticada na aplicação.
 * O mapeamento de Session -> AuthenticatedUser (role, tenantId) será
 * completado quando o módulo de Auth/Tenancy for implementado no backend;
 * por ora a estrutura já está preparada para consumir esses dados.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    setUser({
      id: session.user.id,
      email: session.user.email ?? '',
      fullName: session.user.user_metadata?.full_name ?? session.user.email ?? '',
      role: session.user.user_metadata?.role ?? 'viewer',
      tenantId: session.user.user_metadata?.tenant_id ?? '',
      avatarUrl: session.user.user_metadata?.avatar_url ?? null,
      // TODO(Sprint 05+): popular a partir de GET /auth/me quando o módulo de
      // Auth do backend passar a retornar as permissões resolvidas do Profile.
      permissions: session.user.user_metadata?.permissions ?? [],
    });
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    // Busca as empresas/filiais do tenant uma vez por sessão — sem isso,
    // `activeBranchId` fica sempre `null` e qualquer tela que dependa de
    // filial ativa (PDV, Fiscal, Compras...) não tem como funcionar.
    httpClient
      .get<{ companies: Company[]; branches: Branch[] }>('/workspace')
      .then(({ companies, branches }) => {
        useWorkspaceStore.getState().setWorkspace(companies, branches);
        const { activeCompanyId, activeBranchId } = useWorkspaceStore.getState();
        if (!activeCompanyId && companies[0]) useWorkspaceStore.getState().setActiveCompany(companies[0].id);
        if (!activeBranchId && branches[0]) useWorkspaceStore.getState().setActiveBranch(branches[0].id);
      })
      .catch(() => {
        // Silencioso de propósito: se o workspace falhar ao carregar, o
        // resto do app continua funcionando (dashboard, config, etc.) —
        // só as telas que exigem filial ativa vão pedir pra selecionar.
      });
  }, [session?.user?.id]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  return ctx;
}
