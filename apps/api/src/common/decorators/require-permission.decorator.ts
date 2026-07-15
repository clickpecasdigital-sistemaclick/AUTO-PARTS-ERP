import { SetMetadata } from '@nestjs/common';
import type { PermissionAction } from '@/common/guards/permissions.guard';

export const PERMISSION_KEY = 'permission';

export interface RequiredPermission {
  module: string;
  action: PermissionAction;
}

/**
 * Declara a permissão granular exigida por um endpoint, no mesmo formato
 * `module.action` do catálogo `Permission` (Sprint 02) e espelhando
 * exatamente as 8 ações usadas no frontend (`navigation/nav-types.ts`,
 * Sprint 04): view, create, update, delete, export, print, approve, cancel.
 *
 * Uso: `@RequirePermission('products', 'create')` acima do método do
 * controller. Avaliado por `PermissionsGuard`.
 */
export const RequirePermission = (module: string, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { module, action } satisfies RequiredPermission);
