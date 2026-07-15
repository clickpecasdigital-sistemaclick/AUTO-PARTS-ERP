/**
 * Configuração tipada centralizada, consumida via ConfigService em toda a
 * aplicação. Nenhum módulo deve ler process.env diretamente.
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '3333', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },
});
