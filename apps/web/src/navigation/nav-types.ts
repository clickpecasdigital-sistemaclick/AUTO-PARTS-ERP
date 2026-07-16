import type { LucideIcon } from 'lucide-react';

/**
 * Ações granulares de permissão — espelham exatamente o catálogo de
 * Permission (module.action) definido no schema Prisma da Sprint 02.
 */
export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'print' | 'approve' | 'cancel';

export interface ModulePermissions {
  /** Chave do módulo usada para compor `${module}.${action}` (ex: "products.view"). */
  module: string;
  /** Ações que esta rota especificamente exige para renderizar (mínimo: 'view'). */
  required: PermissionAction[];
}

export type NavCategory = 'gestao' | 'administracao' | 'cadastro' | 'veiculo' | 'financeiro' | 'oficina' | 'produtos' | 'escrita-fiscal' | 'integracao';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  category: NavCategory;
  permissions: ModulePermissions;
  /** Itens de submenu (ex: Fiscal > NF-e). */
  children?: NavItem[];
  /** Selo opcional (ex: "Novo", "Beta") exibido ao lado do label na Sidebar. */
  badge?: string;
}

export const categoryLabels: Record<NavCategory, string> = {
  gestao: 'Gestão',
  administracao: 'Administração',
  cadastro: 'Cadastro',
  veiculo: 'Veículo',
  financeiro: 'Financeiro',
  oficina: 'Oficina',
  produtos: 'Produtos',
  'escrita-fiscal': 'Escrita Fiscal',
  integracao: 'Integração',
};
