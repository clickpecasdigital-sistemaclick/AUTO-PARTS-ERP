import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';

/**
 * Guard global de autenticação: valida o JWT emitido pelo Supabase Auth
 * (enviado pelo frontend via Authorization: Bearer <token>) e popula
 * request.user para os Controllers de todos os módulos protegidos.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedRequestUser }>();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Token de autenticação ausente');
    }

    const supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.serviceRoleKey')!,
    );

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? '',
      role: data.user.user_metadata?.role ?? 'viewer',
      tenantId: data.user.user_metadata?.tenant_id ?? '',
    };

    return true;
  }
}
