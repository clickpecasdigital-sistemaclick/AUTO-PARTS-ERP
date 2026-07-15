/**
 * Tipos do schema do banco de dados (Supabase Postgres).
 *
 * Este arquivo deve ser gerado/atualizado automaticamente via:
 *   npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
 *
 * Mantido aqui como placeholder estrutural até a primeira geração,
 * para que o `supabaseClient.ts` já fique corretamente tipado quando
 * os módulos de negócio começarem a ser modelados no Prisma/Supabase.
 */
export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
