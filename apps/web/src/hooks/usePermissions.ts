import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { ModulePermissions, PermissionAction } from '@/navigation/nav-types';

/**
 * Resolve permissões granulares do usuário autenticado contra o catálogo
 * `module.action` (Sprint 02, tabela `permissions`).
 *
 * Regras:
 * 1. `super_admin` e `admin` têm acesso irrestrito (consistente com a
 *    Sprint 02, onde esses papéis administram o tenant).
 * 2. Enquanto `user.permissions` estiver vazio — ou seja, o endpoint
 *    `/auth/me` ainda não resolve o Profile/ProfilePermission do usuário
 *    (trabalho de Sprint 05+) — a ação `view` é liberada por padrão para
 *    qualquer usuário autenticado, para que o Shell seja navegável mesmo
 *    antes do RBAC granular existir de fato. Ações que alteram dados
 *    (`create`/`update`/`delete`/`export`/`print`/`approve`/`cancel`)
 *    SEMPRE exigem grant explícito, mesmo nesse modo "bootstrap" — a
 *    política de menor privilégio nunca é violada para ações destrutivas.
 * 3. Assim que `user.permissions` passar a ser populado pelo backend, o
 *    fallback do item 2 deixa de se aplicar automaticamente: a ausência de
 *    uma chave específica passa a significar "negado", como em qualquer
 *    RBAC real.
 */
export function usePermissions() {
  const { user } = useAuth();

  const can = useMemo(() => {
    return (moduleKey: string, action: PermissionAction = 'view'): boolean => {
      if (!user) return false;
      if (user.role === 'super_admin' || user.role === 'admin') return true;
      if (user.permissions.length === 0) return action === 'view';
      return user.permissions.includes(`${moduleKey}.${action}`);
    };
  }, [user]);

  const canAccess = useMemo(() => {
    return (permissions: ModulePermissions): boolean =>
      permissions.required.every((action) => can(permissions.module, action));
  }, [can]);

  return { can, canAccess };
}
