/**
 * Configuração centralizada de variáveis de ambiente do frontend.
 * Nenhuma outra parte da aplicação deve acessar import.meta.env diretamente,
 * isso garante um único ponto de validação e tipagem.
 */
function getEnvVar(key: keyof ImportMetaEnv, required = true): string {
  const value = import.meta.env[key];
  if (required && !value) {
    throw new Error(`[env] Variável de ambiente obrigatória ausente: ${key}`);
  }
  return value ?? '';
}

export const env = {
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  apiUrl: getEnvVar('VITE_API_URL'),
  appName: getEnvVar('VITE_APP_NAME', false) || 'AutoCore ERP',
  appEnv: (getEnvVar('VITE_APP_ENV', false) || 'development') as
    | 'development'
    | 'staging'
    | 'production',
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
} as const;
