import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { AuthenticatedRequestUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Garante que o usuário autenticado no Supabase Auth possua um registro
   * correspondente na tabela User (multi-tenant). Chamado no primeiro
   * acesso autenticado de cada sessão.
   */
  async syncUser(authUser: AuthenticatedRequestUser) {
    return this.prisma.user.upsert({
      where: { id: authUser.id },
      update: { email: authUser.email },
      create: {
        id: authUser.id,
        email: authUser.email,
        tenantId: authUser.tenantId,
        role: authUser.role,
      },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
