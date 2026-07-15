/**
 * Catálogo central de endpoints da API.
 * Cada módulo de negócio (Estoque, Vendas, Clientes, Financeiro, etc.)
 * deverá registrar aqui suas rotas, evitando strings mágicas espalhadas
 * pelos services dos módulos.
 */
export const endpoints = {
  auth: {
    me: '/auth/me',
    refresh: '/auth/refresh',
  },
  health: {
    check: '/health',
  },
  // Próximos módulos de negócio serão adicionados aqui nas próximas sprints.
} as const;
