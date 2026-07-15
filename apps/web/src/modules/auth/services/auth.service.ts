import { supabase } from '@/api/supabaseClient';
import type { LoginFormValues, RegisterFormValues } from '@/modules/auth/types';

/**
 * Serviço de autenticação — encapsula o Supabase Auth.
 * Os módulos de UI (pages/components) nunca chamam supabase.auth diretamente,
 * apenas este serviço, para isolar a dependência de infraestrutura.
 */
export const authService = {
  async signIn({ email, password }: LoginFormValues) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, fullName }: RegisterFormValues) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },
};
