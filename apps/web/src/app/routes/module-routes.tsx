import type { RouteObject } from 'react-router-dom';
import { PermissionGuard } from '@/app/guards/PermissionGuard';
import { ModulePlaceholderPage } from '@/modules/shell/pages/ModulePlaceholderPage';
import { flatNavItems } from '@/navigation/nav-items';

/**
 * Ids de `navigation/nav-items.ts` que já possuem implementação real e são
 * registrados explicitamente em `app/router.tsx` — não devem receber o
 * `ModulePlaceholderPage` automático.
 */
const IMPLEMENTED_NAV_IDS = [
  'dashboard',
  'configuracoes',
  'produtos',
  'produtos-catalogo-aplicacoes',
  'veiculo-fichas',
  'fornecedores',
  'usuarios',
  'administracao-auditoria',
  'estoque',
  'estoque-movimentacoes',
  'estoque-transferencias',
  'estoque-inventarios',
  'compras',
  'compras-solicitacoes',
  'compras-cotacoes',
  'compras-pedidos',
  'compras-recebimentos',
  'clientes',
  'crm',
  'crm-pipeline',
  'pdv',
  'pdv-venda',
  'pdv-orcamentos',
  'pdv-pedidos',
  'pdv-caixa',
  'pdv-devolucoes',
  'financeiro',
  'financeiro-pagar',
  'financeiro-receber',
  'financeiro-boleto',
  'oficina',
  'oficina-ordens',
  'oficina-agenda',
  'oficina-garantia',
  'oficina-portaria',
  'produtos-promocoes',
  'produtos-vendas-perdidas',
  'fiscal',
  'fiscal-monitor',
  'fiscal-notas',
  'fiscal-config',
  'ia',
  'bi-dashboard',
  'bi-ai',
  'bi-alerts',
  'superadmin',
  'setup-wizard',
];

/**
 * Gera automaticamente UMA rota protegida por permissão para cada entrada
 * de `navigation/nav-items.ts` (incluindo submódulos como Fiscal > NF-e),
 * exceto as já implementadas (`IMPLEMENTED_NAV_IDS`). Esta é a "estrutura
 * de rotas" pedida na Sprint 04: todo módulo de negócio futuro (Sprint 05+)
 * deve SUBSTITUIR o `ModulePlaceholderPage` da sua rota por sua página real
 * — a rota, o guard de permissão e a entrada de menu já existem e não
 * precisam ser recriados.
 */
export const moduleRoutes: RouteObject[] = flatNavItems
  .filter((item) => !IMPLEMENTED_NAV_IDS.includes(item.id))
  .map((item) => ({
    path: item.path,
    element: (
      <PermissionGuard permissions={item.permissions}>
        <ModulePlaceholderPage title={item.label} description={`Painel de ${item.label.toLowerCase()} do Auto Parts ERP.`} icon={item.icon} />
      </PermissionGuard>
    ),
  }));
