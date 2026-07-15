import {
  Award,
  Banknote,
  CreditCard,
  ShieldCheck,
  Bell,
  Bot,
  Boxes,
  Calculator,
  CalendarClock,
  FileText,
  LayoutDashboard,
  Receipt,
  RotateCcw,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  TrendingDown,
  TrendingUp,
  Users,
  UserCog,
  Wallet,
  Wrench,
  ClipboardList,
  BarChart3,
  Package,
  ReceiptText,
} from 'lucide-react';
import type { NavItem } from './nav-types';

/**
 * Fonte única de verdade da navegação do ERP. Cada módulo de negócio
 * (Sprint 05+) só precisa registrar sua página de fato — a entrada de
 * navegação, ícone, categoria e permissão exigida JÁ estão definidas aqui.
 *
 * `permissions.required` usa o catálogo `module.action` do Prisma (Sprint 02,
 * tabela `permissions`) — `usePermissions()` resolve isso contra o perfil do
 * usuário autenticado.
 */
export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    category: 'operacional',
    permissions: { module: 'dashboard', required: ['view'] },
  },
  {
    id: 'pdv',
    label: 'PDV',
    path: '/pdv',
    icon: Calculator,
    category: 'comercial',
    permissions: { module: 'sales', required: ['view'] },
    children: [
      {
        id: 'pdv-venda',
        label: 'Nova Venda',
        path: '/pdv/venda',
        icon: Calculator,
        category: 'comercial',
        permissions: { module: 'sales', required: ['create'] },
      },
      {
        id: 'pdv-orcamentos',
        label: 'Orçamentos',
        path: '/pdv/orcamentos',
        icon: FileText,
        category: 'comercial',
        permissions: { module: 'sales', required: ['view'] },
      },
      {
        id: 'pdv-pedidos',
        label: 'Pedidos',
        path: '/pdv/pedidos',
        icon: ShoppingBag,
        category: 'comercial',
        permissions: { module: 'sales', required: ['view'] },
      },
      {
        id: 'pdv-caixa',
        label: 'Caixa',
        path: '/pdv/caixa',
        icon: Wallet,
        category: 'comercial',
        permissions: { module: 'sales', required: ['view'] },
      },
      {
        id: 'pdv-devolucoes',
        label: 'Devoluções',
        path: '/pdv/devolucoes',
        icon: RotateCcw,
        category: 'comercial',
        permissions: { module: 'sales', required: ['view'] },
      },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    path: '/vendas',
    icon: ShoppingCart,
    category: 'comercial',
    permissions: { module: 'sales', required: ['view'] },
  },
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/clientes',
    icon: Users,
    category: 'comercial',
    permissions: { module: 'customers', required: ['view'] },
  },
  {
    id: 'produtos',
    label: 'Produtos',
    path: '/produtos',
    icon: Package,
    category: 'operacional',
    permissions: { module: 'products', required: ['view'] },
  },
  {
    id: 'estoque',
    label: 'Estoque',
    path: '/estoque',
    icon: Boxes,
    category: 'operacional',
    permissions: { module: 'stock', required: ['view'] },
    children: [
      {
        id: 'estoque-movimentacoes',
        label: 'Movimentações',
        path: '/estoque/movimentacoes',
        icon: Boxes,
        category: 'operacional',
        permissions: { module: 'stock', required: ['view'] },
      },
      {
        id: 'estoque-transferencias',
        label: 'Transferências',
        path: '/estoque/transferencias',
        icon: Truck,
        category: 'operacional',
        permissions: { module: 'stock', required: ['view'] },
      },
      {
        id: 'estoque-inventarios',
        label: 'Inventário',
        path: '/estoque/inventarios',
        icon: ClipboardList,
        category: 'operacional',
        permissions: { module: 'stock', required: ['view'] },
      },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    path: '/compras',
    icon: Truck,
    category: 'operacional',
    permissions: { module: 'purchases', required: ['view'] },
    children: [
      {
        id: 'compras-solicitacoes',
        label: 'Solicitações',
        path: '/compras/solicitacoes',
        icon: ClipboardList,
        category: 'operacional',
        permissions: { module: 'purchases', required: ['view'] },
      },
      {
        id: 'compras-cotacoes',
        label: 'Cotações',
        path: '/compras/cotacoes',
        icon: Award,
        category: 'operacional',
        permissions: { module: 'purchases', required: ['view'] },
      },
      {
        id: 'compras-pedidos',
        label: 'Pedidos',
        path: '/compras/pedidos',
        icon: ShoppingCart,
        category: 'operacional',
        permissions: { module: 'purchases', required: ['view'] },
      },
      {
        id: 'compras-recebimentos',
        label: 'Recebimentos',
        path: '/compras/recebimentos',
        icon: Package,
        category: 'operacional',
        permissions: { module: 'purchases', required: ['view'] },
      },
    ],
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores',
    path: '/fornecedores',
    icon: ClipboardList,
    category: 'operacional',
    permissions: { module: 'suppliers', required: ['view'] },
  },
  {
    id: 'oficina',
    label: 'Oficina',
    path: '/oficina',
    icon: Wrench,
    category: 'operacional',
    permissions: { module: 'workshop', required: ['view'] },
    children: [
      {
        id: 'oficina-ordens',
        label: 'Ordens de Serviço',
        path: '/oficina/ordens',
        icon: ClipboardList,
        category: 'operacional',
        permissions: { module: 'workshop', required: ['view'] },
      },
      {
        id: 'oficina-agenda',
        label: 'Agenda',
        path: '/oficina/agenda',
        icon: CalendarClock,
        category: 'operacional',
        permissions: { module: 'workshop', required: ['view'] },
      },
    ],
  },
  {
    id: 'caixa',
    label: 'Caixa',
    path: '/caixa',
    icon: Wallet,
    category: 'financeiro',
    permissions: { module: 'cashier', required: ['view'] },
  },
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
    id: 'fiscal',
    label: 'Fiscal',
    path: '/fiscal',
    icon: Receipt,
    category: 'financeiro',
    permissions: { module: 'fiscal', required: ['view'] },
    children: [
      {
        id: 'fiscal-monitor',
        label: 'Monitor Fiscal',
        path: '/fiscal',
        icon: Receipt,
        category: 'financeiro',
        permissions: { module: 'fiscal', required: ['view'] },
      },
      {
        id: 'fiscal-notas',
        label: 'Notas Fiscais',
        path: '/fiscal/notas',
        icon: ReceiptText,
        category: 'financeiro',
        permissions: { module: 'fiscal', required: ['view'] },
      },
      {
        id: 'fiscal-config',
        label: 'Configuração',
        path: '/fiscal/configuracao',
        icon: Settings,
        category: 'financeiro',
        permissions: { module: 'fiscal', required: ['update'] },
      },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    path: '/crm',
    icon: CalendarClock,
    category: 'comercial',
    permissions: { module: 'crm', required: ['view'] },
    children: [
      {
        id: 'crm-pipeline',
        label: 'Pipeline',
        path: '/crm/pipeline',
        icon: CalendarClock,
        category: 'comercial',
        permissions: { module: 'crm', required: ['view'] },
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
    id: 'usuarios',
    label: 'Usuários',
    path: '/configuracoes/usuarios',
    icon: UserCog,
    category: 'sistema',
    permissions: { module: 'users', required: ['view'] },
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    path: '/configuracoes',
    icon: Settings,
    category: 'sistema',
    permissions: { module: 'settings', required: ['view'] },
  },
  {
    id: 'planos',
    label: 'Planos & Assinatura',
    path: '/planos',
    icon: CreditCard,
    category: 'sistema',
    permissions: { module: 'settings', required: ['view'] },
  },
  {
    id: 'superadmin',
    label: 'Super Admin',
    path: '/superadmin',
    icon: ShieldCheck,
    category: 'sistema',
    permissions: { module: 'settings', required: ['view'] },
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
