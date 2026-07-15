import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import type { ModulePermissions } from '@/navigation/nav-types';

interface PermissionGuardProps {
  permissions: ModulePermissions;
  children: ReactNode;
}

/**
 * Guarda de autorização granular: aplicado por rota (ver app/routes), exige
 * que o usuário satisfaça TODAS as ações declaradas em `permissions.required`
 * (view/create/update/delete/export/print/approve/cancel — catálogo da
 * Sprint 02). Renderiza a página 403 quando a checagem falha, sem precisar
 * de nenhuma lógica nova por módulo de negócio.
 */
export function PermissionGuard({ permissions, children }: PermissionGuardProps) {
  const { canAccess } = usePermissions();

  if (!canAccess(permissions)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
