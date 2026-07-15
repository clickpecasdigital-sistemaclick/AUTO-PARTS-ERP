import { flatNavItems } from '@/navigation/nav-items';

export type SearchResultCategory =
  | 'modules'
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'invoices'
  | 'orders'
  | 'purchases'
  | 'serviceOrders'
  | 'users'
  | 'settings';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: SearchResultCategory;
  path: string;
}

export const searchCategoryLabels: Record<SearchResultCategory, string> = {
  modules: 'Módulos',
  products: 'Produtos',
  customers: 'Clientes',
  suppliers: 'Fornecedores',
  invoices: 'Notas',
  orders: 'Pedidos',
  purchases: 'Compras',
  serviceOrders: 'Ordens de Serviço',
  users: 'Usuários',
  settings: 'Configurações',
};

/**
 * Busca Global (Command Palette) — estrutura completa e funcional para
 * navegação entre módulos HOJE; os buscadores por entidade de negócio
 * (produtos, clientes, fornecedores, notas, pedidos, compras, OS, usuários)
 * já estão com a assinatura e o contrato de retorno definitivos, prontos
 * para troca de implementação por uma consulta real ao Supabase quando os
 * respectivos módulos existirem — nenhum componente que os consome precisa
 * mudar quando isso acontecer.
 */
function searchModules(query: string): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return flatNavItems
    .filter((item) => item.label.toLowerCase().includes(normalized))
    .map((item) => ({ id: item.id, title: item.label, category: 'modules' as const, path: item.path }));
}

/** @todo Sprint do módulo de Produtos: `supabase.from('products').select('id, short_description, internal_code').ilike('short_description', `%${query}%`)`. */
async function searchProducts(_query: string): Promise<SearchResult[]> {
  return [];
}

/** @todo Sprint do módulo de Clientes. */
async function searchCustomers(_query: string): Promise<SearchResult[]> {
  return [];
}

/** @todo Sprint do módulo de Fornecedores. */
async function searchSuppliers(_query: string): Promise<SearchResult[]> {
  return [];
}

/** @todo Sprint do módulo Fiscal (fiscal_invoices). */
async function searchInvoices(_query: string): Promise<SearchResult[]> {
  return [];
}

/** @todo Sprint do módulo de Vendas (sales_orders). */
async function searchOrders(_query: string): Promise<SearchResult[]> {
  return [];
}

/** @todo Sprint do módulo de Compras (purchase_orders). */
async function searchPurchases(_query: string): Promise<SearchResult[]> {
  return [];
}

/** @todo Sprint do módulo de Oficina (service_orders). */
async function searchServiceOrders(_query: string): Promise<SearchResult[]> {
  return [];
}

/** @todo Sprint de Usuários — requer permissão `users.view`. */
async function searchUsers(_query: string): Promise<SearchResult[]> {
  return [];
}

export const searchService = {
  /**
   * Ponto único de entrada da Busca Global. Roda a busca de módulos
   * (síncrona, sempre disponível) em paralelo com as buscas de entidades de
   * negócio (hoje stubs assíncronos) e consolida tudo num único array.
   * Os stubs documentam, via JSDoc, exatamente a consulta Supabase que os
   * substituirá quando cada módulo de negócio for implementado.
   */
  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const [products, customers, suppliers, invoices, orders, purchases, serviceOrders, users] = await Promise.all([
      searchProducts(query),
      searchCustomers(query),
      searchSuppliers(query),
      searchInvoices(query),
      searchOrders(query),
      searchPurchases(query),
      searchServiceOrders(query),
      searchUsers(query),
    ]);

    return [...searchModules(query), ...products, ...customers, ...suppliers, ...invoices, ...orders, ...purchases, ...serviceOrders, ...users];
  },
};
