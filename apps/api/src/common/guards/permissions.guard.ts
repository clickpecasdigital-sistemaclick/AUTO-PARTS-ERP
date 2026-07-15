import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '@/database/prisma/prisma.service';
import { PERMISSION_KEY, type RequiredPermission } from '@/common/decorators/require-permission.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'print' | 'approve' | 'cancel' | 'issue' | 'void' | 'manage_config' | 'manage_certs' | string;

/**
 * Guard de autorização granular (RBAC — Sprint 02: Profile →
 * ProfilePermission → Permission). Roda DEPOIS do `JwtAuthGuard` (que
 * popula `request.user`).
 *
 * Política de bootstrap — espelha exatamente `usePermissions.ts` do
 * frontend (Sprint 04), para que back e front nunca divirjam: enquanto o
 * usuário não tiver um `Profile` com permissões explícitas atribuídas, a
 * ação `view` é liberada por padrão (o sistema precisa ser usável antes do
 * RBAC granular estar todo configurado pelo administrador do tenant).
 * Ações que alteram dados (create/update/delete/export/print/approve/
 * cancel) SEMPRE exigem grant explícito — a política de menor privilégio
 * nunca é violada para ações destrutivas, mesmo em modo bootstrap.
 * `super_admin`/`admin` têm acesso irrestrito.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<RequiredPermission>(PERMISSION_KEY, context.getHandler());
    if (!required) return true; // endpoint sem @RequirePermission — apenas autenticação é exigida

    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedRequestUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Usuário não autenticado');

    if (user.role === 'super_admin' || user.role === 'admin') return true;

    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { profile: { select: { permissions: { select: { permission: { select: { key: true } } } } } } },
    });

    const grantedKeys: string[] =
      profile?.profile?.permissions.map((p: { permission: { key: string } }) => p.permission.key) ?? [];

    if (grantedKeys.length === 0 && required.action === 'view') return true;

    const requiredKey = `${required.module}.${required.action}`;
    if (!grantedKeys.includes(requiredKey)) {
      throw new ForbiddenException(`Permissão necessária: ${requiredKey}`);
    }

    return true;
  }
}
