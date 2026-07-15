import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';

/**
 * Extrai o usuário autenticado (populado pelo JwtAuthGuard a partir do
 * token Supabase) para uso direto nos Controllers de qualquer módulo:
 *   findAll(@CurrentUser() user: AuthenticatedRequestUser)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedRequestUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedRequestUser }>();
    return request.user;
  },
);
