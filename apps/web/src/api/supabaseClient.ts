import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import type { Database } from '@/types/database.types';

/**
 * Cliente único do Supabase, tipado a partir do schema gerado pelo Prisma/Supabase CLI
 * (ver apps/web/src/types/database.types.ts). Toda comunicação com Supabase
 * (Auth, Storage, Realtime, Postgres via PostgREST) passa por aqui.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
