import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/api/supabaseClient';
import type { AuthenticatedUser } from '@/types/user.types';

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
