import {
  Award,
  Banknote,
  BarChart3,
  Bell,
  Boxes,
  Bot,
  Calculator,
  CalendarClock,
  Car,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileSearch,
  FileText,
  Globe,
  Image,
  LayoutDashboard,
  Package,
  Receipt,
  ReceiptText,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { NavItem } from './nav-types';

/**
 * Fonte única de verdade da navegação do ERP. Cada módulo de negócio
 * só precisa registrar sua página de fato — a entrada de navegação,
 * ícone, categoria e permissão exigida JÁ estão definidas aqui.
 *
 * Estrutura reorganizada (categorias inspiradas em referências do setor:
 * Administração, Cadastro, Veículo, Financeiro, Oficina, Produtos, Escrita
 * Fiscal, Integração) — itens ainda não implementados aparecem como
 * "módulo em construção" automaticamente (ver `app/routes/module-routes.tsx`),
 * então é seguro registrar a estrutura completa antes de toda página existir.
 *
 * `permissions.required` usa o catálogo `module.action` da tabela
 * `permissions` — `usePermissions()` resolve isso contra o perfil do
 * usuário autenticado.
 */
export const navItems: NavItem[] = [
  // ---- GESTÃO ---------------------------------------------------------------
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    category: 'gestao',
    permissions: { module: 'dashboard', required: ['view'] },
  },
  {
    id: 'crm',
    label: 'CRM',
    path: '/crm',
    icon: CalendarClock,
    category: 'gestao',
    permissions: { module: 'crm', required: ['view'] },
    children: [
      {
        id: 'crm-pipeline',
        label: 'Pipeline',
        path: '/crm/pipeline',
        icon: CalendarClock,
        category: 'gestao',
        permissions: { module: 'crm', required: ['view'] },
      },
    ],
  },
  {
    id: 'ia',
    label: 'BI & IA',
    path: '/bi',
    icon: Bot,
    category: 'gestao',
    badge: 'Novo',
    permissions: { module: 'bi', required: ['view'] },
    children: [
      {
        id: 'bi-dashboard',
        label: 'Dashboard Executivo',
        path: '/bi',
        icon: BarChart3,
        category: 'gestao',
        permissions: { module: 'bi', required: ['view'] },
      },
      {
        id: 'bi-ai',
        label: 'Assistente IA',
        path: '/bi/ia',
        icon: Bot,
        category: 'gestao',
        badge: 'Beta',
        permissions: { module: 'bi', required: ['view'] },
      },
      {
        id: 'bi-alerts',
        label: 'Central de Alertas',
        path: '/bi/alertas',
        icon: Bell,
        category: 'gestao',
        permissions: { module: 'bi', required: ['view'] },
      },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    path: '/relatorios',
    icon: BarChart3,
    category: 'gestao',
    permissions: { module: 'reports', required: ['view'] },
  },

  // ---- ADMINISTRAÇÃO --------------------------------------------------------
  {
    id: 'administracao-auditoria',
    label: 'Auditoria',
    path: '/administracao/auditoria',
    icon: FileSearch,
    category: 'administracao',
    permissions: { module: 'settings', required: ['view'] },
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    path: '/configuracoes/usuarios',
    icon: UserCog,
    category: 'administracao',
    permissions: { module: 'users', required: ['view'] },
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    path: '/configuracoes',
    icon: Settings,
    category: 'administracao',
    permissions: { module: 'settings', required: ['view'] },
  },
  {
    id: 'planos',
    label: 'Planos & Assinatura',
    path: '/planos',
    icon: CreditCard,
    category: 'administracao',
    permissions: { module: 'settings', required: ['view'] },
  },
  {
    id: 'superadmin',
    label: 'Super Admin',
    path: '/superadmin',
    icon: ShieldCheck,
    category: 'administracao',
    permissions: { module: 'settings', required: ['view'] },
  },

  // ---- CADASTRO ---------------------------------------------------------------
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/clientes',
    icon: Users,
    category: 'cadastro',
    permissions: { module: 'customers', required: ['view'] },
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores',
    path: '/fornecedores',
    icon: ClipboardList,
    category: 'cadastro',
    permissions: { module: 'suppliers', required: ['view'] },
  },
  {
    id: 'cadastro-imagens',
    label: 'Imagens',
    path: '/cadastro/imagens',
    icon: Image,
    category: 'cadastro',
    permissions: { module: 'products', required: ['view'] },
  },

  // ---- VEÍCULO ---------------------------------------------------------------
  {
    id: 'produtos-catalogo-aplicacoes',
    label: 'Catálogo de Aplicações',
    path: '/produtos/catalogo-aplicacoes',
    icon: Car,
    category: 'veiculo',
    permissions: { module: 'products', required: ['view'] },
  },
  {
    id: 'veiculo-fichas',
    label: 'Fichas de Veículo',
    path: '/veiculo/fichas',
    icon: FileText,
    category: 'veiculo',
    permissions: { module: 'products', required: ['view'] },
  },

  // ---- FINANCEIRO -------------------------------------------------------------
  {
    id: 'financeiro',
    label: 'Financeiro',
    path: '/financeiro',
    icon: Banknote,
    category: 'financeiro',
    permissions: { module: 'financial', required: ['view'] },
    children: [
      {
        id: 'financeiro-pagar',
        label: 'Contas a Pagar',
        path: '/financeiro/contas-a-pagar',
        icon: TrendingDown,
        category: 'financeiro',
        permissions: { module: 'financial', required: ['view'] },
      },
      {
        id: 'financeiro-receber',
        label: 'Contas a Receber',
        path: '/financeiro/contas-a-receber',
        icon: TrendingUp,
        category: 'financeiro',
        permissions: { module: 'financial', required: ['view'] },
      },
    ],
  },
  {
    id: 'financeiro-boleto',
    label: 'Emissão de Boleto',
    path: '/financeiro/boleto',
    icon: Receipt,
    category: 'financeiro',
    permissions: { module: 'financial', required: ['view'] },
  },

  // ---- OFICINA ---------------------------------------------------------------
  {
    id: 'oficina',
    label: 'Oficina',
    path: '/oficina',
    icon: Wrench,
    category: 'oficina',
    permissions: { module: 'workshop', required: ['view'] },
    children: [
      {
        id: 'oficina-ordens',
        label: 'Ordens de Serviço',
        path: '/oficina/ordens',
        icon: ClipboardList,
        category: 'oficina',
        permissions: { module: 'workshop', required: ['view'] },
      },
      {
        id: 'oficina-agenda',
        label: 'Agenda',
        path: '/oficina/agenda',
        icon: CalendarClock,
        category: 'oficina',
        permissions: { module: 'workshop', required: ['view'] },
      },
    ],
  },
  {
    id: 'oficina-garantia',
    label: 'Garantia',
    path: '/oficina/garantia',
    icon: ClipboardCheck,
    category: 'oficina',
    permissions: { module: 'workshop', required: ['view'] },
  },
  {
    id: 'oficina-portaria',
    label: 'Portaria',
    path: '/oficina/portaria',
    icon: Truck,
    category: 'oficina',
    permissions: { module: 'workshop', required: ['view'] },
  },

  // ---- PRODUTOS ---------------------------------------------------------------
  {
    id: 'produtos',
    label: 'Produtos',
    path: '/produtos',
    icon: Package,
    category: 'produtos',
    permissions: { module: 'products', required: ['view'] },
  },
  {
    id: 'pdv',
    label: 'Vendas Balcão (PDV)',
    path: '/pdv',
    icon: Calculator,
    category: 'produtos',
    permissions: { module: 'sales', required: ['view'] },
    children: [
      {
        id: 'pdv-venda',
        label: 'Nova Venda',
        path: '/pdv/venda',
        icon: Calculator,
        category: 'produtos',
        permissions: { module: 'sales', required: ['create'] },
      },
      {
        id: 'pdv-orcamentos',
        label: 'Orçamentos',
        path: '/pdv/orcamentos',
        icon: FileText,
        category: 'produtos',
        permissions: { module: 'sales', required: ['view'] },
      },
      {
        id: 'pdv-pedidos',
        label: 'Pedidos',
        path: '/pdv/pedidos',
        icon: ShoppingBag,
        category: 'produtos',
        permissions: { module: 'sales', required: ['view'] },
      },
      {
        id: 'pdv-caixa',
        label: 'Caixa',
        path: '/pdv/caixa',
        icon: Wallet,
        category: 'produtos',
        permissions: { module: 'sales', required: ['view'] },
      },
      {
        id: 'pdv-devolucoes',
        label: 'Devoluções',
        path: '/pdv/devolucoes',
        icon: RotateCcw,
        category: 'produtos',
        permissions: { module: 'sales', required: ['view'] },
      },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    path: '/estoque',
    icon: Boxes,
    category: 'produtos',
    permissions: { module: 'stock', required: ['view'] },
    children: [
      {
        id: 'estoque-movimentacoes',
        label: 'Movimentações',
        path: '/estoque/movimentacoes',
        icon: Boxes,
        category: 'produtos',
        permissions: { module: 'stock', required: ['view'] },
      },
      {
        id: 'estoque-transferencias',
        label: 'Transferências',
        path: '/estoque/transferencias',
        icon: Truck,
        category: 'produtos',
        permissions: { module: 'stock', required: ['view'] },
      },
      {
        id: 'estoque-inventarios',
        label: 'Inventário',
        path: '/estoque/inventarios',
        icon: ClipboardList,
        category: 'produtos',
        permissions: { module: 'stock', required: ['view'] },
      },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    path: '/compras',
    icon: Truck,
    category: 'produtos',
    permissions: { module: 'purchases', required: ['view'] },
    children: [
      {
        id: 'compras-solicitacoes',
        label: 'Solicitações',
        path: '/compras/solicitacoes',
        icon: ClipboardList,
        category: 'produtos',
        permissions: { module: 'purchases', required: ['view'] },
      },
      {
        id: 'compras-cotacoes',
        label: 'Cotações',
        path: '/compras/cotacoes',
        icon: Award,
        category: 'produtos',
        permissions: { module: 'purchases', required: ['view'] },
      },
      {
        id: 'compras-pedidos',
        label: 'Pedidos',
        path: '/compras/pedidos',
        icon: ShoppingCart,
        category: 'produtos',
        permissions: { module: 'purchases', required: ['view'] },
      },
      {
        id: 'compras-recebimentos',
        label: 'Recebimentos',
        path: '/compras/recebimentos',
        icon: Package,
        category: 'produtos',
        permissions: { module: 'purchases', required: ['view'] },
      },
    ],
  },
  {
    id: 'produtos-promocoes',
    label: 'Promoções',
    path: '/produtos/promocoes',
    icon: Tag,
    category: 'produtos',
    permissions: { module: 'products', required: ['view'] },
  },
  {
    id: 'produtos-vendas-perdidas',
    label: 'Vendas Perdidas',
    path: '/produtos/vendas-perdidas',
    icon: TrendingDown,
    category: 'produtos',
    permissions: { module: 'sales', required: ['view'] },
  },

  // ---- ESCRITA FISCAL -----------------------------------------------------------
  {
    id: 'fiscal',
    label: 'Escrita Fiscal',
    path: '/fiscal',
    icon: Receipt,
    category: 'escrita-fiscal',
    permissions: { module: 'fiscal', required: ['view'] },
    children: [
      {
        id: 'fiscal-monitor',
        label: 'Monitor Fiscal',
        path: '/fiscal',
        icon: Receipt,
        category: 'escrita-fiscal',
        permissions: { module: 'fiscal', required: ['view'] },
      },
      {
        id: 'fiscal-notas',
        label: 'Notas Fiscais',
        path: '/fiscal/notas',
        icon: ReceiptText,
        category: 'escrita-fiscal',
        permissions: { module: 'fiscal', required: ['view'] },
      },
      {
        id: 'fiscal-config',
        label: 'Configuração',
        path: '/fiscal/configuracao',
        icon: Settings,
        category: 'escrita-fiscal',
        permissions: { module: 'fiscal', required: ['update'] },
      },
    ],
  },

  // ---- INTEGRAÇÃO ---------------------------------------------------------------
  {
    id: 'integracao-mercado-livre',
    label: 'Mercado Livre',
    path: '/configuracoes',
    icon: Globe,
    category: 'integracao',
    permissions: { module: 'settings', required: ['update'] },
  },
];

/** Lista plana (inclui submódulos) — usada pela Busca Global e pelo Breadcrumb. */
export const flatNavItems: NavItem[] = navItems.flatMap((item) => [item, ...(item.children ?? [])]);

export function findNavItemByPath(path: string): NavItem | undefined {
  return flatNavItems.find((item) => path === item.path || path.startsWith(`${item.path}/`));
}

export interface BreadcrumbTrailItem {
  label: string;
  path?: string;
}

/**
 * Gera a trilha de Breadcrumb automaticamente a partir do pathname atual:
 * 1) resolve o NavItem pai (e o filho, se houver) via `navigation/nav-items`;
 * 2) qualquer segmento restante da URL (ex: um :id de detalhe) é exibido
 *    como rótulo cru, sem link — módulos de negócio não precisam declarar
 *    breadcrumb manualmente para as rotas já catalogadas aqui.
 */
export function buildBreadcrumbTrail(pathname: string): BreadcrumbTrailItem[] {
  const parentMatch = navItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  if (!parentMatch) return [];

  const trail: BreadcrumbTrailItem[] = [{ label: parentMatch.label, path: parentMatch.path }];

  const childMatch = parentMatch.children?.find((child) => pathname === child.path || pathname.startsWith(`${child.path}/`));
  if (childMatch) trail.push({ label: childMatch.label, path: childMatch.path });

  const matchedPath = childMatch?.path ?? parentMatch.path;
  const remainder = pathname.slice(matchedPath.length).split('/').filter(Boolean);
  remainder.forEach((segment) => {
    const isIdLike = /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
    trail.push({ label: isIdLike ? 'Detalhe' : segment.charAt(0).toUpperCase() + segment.slice(1) });
  });

  return trail;
}
