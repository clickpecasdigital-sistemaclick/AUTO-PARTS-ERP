export type UserRole = 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer';

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
}
