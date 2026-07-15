export type UserRole = 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer';

/** Espelha `permissions.key` do Prisma (Sprint 02): "${module}.${action}". */
export type PermissionKey = string;

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string | null;
  /**
   * Chaves de permissão resolvidas para o usuário (via Profile/ProfilePermission).
   * `super_admin` ignora esta lista e tem acesso irrestrito — ver usePermissions().
   * Populado futuramente pelo endpoint `/auth/me`; até lá, lista vazia
   * (apenas super_admin/admin têm acesso liberado por padrão — ver hook).
   */
  permissions: PermissionKey[];
}

export interface Company {
  id: string;
  legalName: string;
  tradeName?: string | null;
  document: string;
}

export interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
}
