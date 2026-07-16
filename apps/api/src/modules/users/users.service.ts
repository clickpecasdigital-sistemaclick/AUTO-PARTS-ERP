import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';
import { UserRole } from '@prisma/client';

/**
 * Gestão de usuários do tenant — a peça que fechava o ciclo do bug de
 * onboarding encontrado nesta revisão: qualquer pessoa que se cadastrasse
 * sozinha pelo `/register` virava "viewer" sem nenhuma empresa vinculada
 * (`tenant_id` vazio nos metadados do Supabase Auth), porque nada
 * populava esses dados no self-signup.
 *
 * A forma correta de adicionar um funcionário num SaaS multi-tenant não é
 * deixar qualquer um se cadastrar sozinho — é o ADMIN convidar, já com
 * `tenant_id` e `role` corretos definidos de antemão. É isso que
 * `invite()` faz, via Supabase Admin API (service_role — por isso só o
 * backend pode fazer essa chamada, nunca o frontend).
 */
@Injectable()
export class UsersService {
  private readonly adminClient: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('supabase.url') || process.env.SUPABASE_URL;
    const key = this.configService.get<string>('supabase.serviceRoleKey') || process.env.SUPABASE_SERVICE_KEY;
    if (url && key) {
      this.adminClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    }
  }

  list(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async invite(ctx: RequestContext, params: { email: string; fullName: string; role: UserRole }) {
    if (!this.adminClient) throw new BadRequestException('Supabase Admin não configurado no servidor.');

    const existing = await this.prisma.user.findUnique({ where: { email: params.email } });
    if (existing) throw new BadRequestException('Já existe um usuário com este e-mail.');

    const frontendUrl = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim();
    const { data, error } = await this.adminClient.auth.admin.inviteUserByEmail(params.email, {
      data: { tenant_id: ctx.tenantId, role: params.role, full_name: params.fullName },
      redirectTo: `${frontendUrl}/login`,
    });
    if (error || !data.user) {
      throw new BadRequestException(`Não foi possível convidar: ${error?.message ?? 'erro desconhecido'}`);
    }

    const user = await this.prisma.user.create({
      data: { id: data.user.id, tenantId: ctx.tenantId, email: params.email, fullName: params.fullName, role: params.role, isActive: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'User', entityId: user.id, after: { email: params.email, role: params.role } });
    return user;
  }

  async updateRole(ctx: RequestContext, userId: string, role: UserRole) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId: ctx.tenantId } });
    if (!user) throw new NotFoundException('Usuário não encontrado neste tenant.');

    // Atualiza os dois lugares: nossa tabela (fonte pro resto da API) e os
    // metadados do Supabase Auth (fonte do token JWT — sem isso, o usuário
    // só veria o novo papel depois de deslogar/logar de novo mesmo assim,
    // mas atualizar aqui evita inconsistência entre os dois).
    if (this.adminClient) {
      await this.adminClient.auth.admin.updateUserById(userId, { user_metadata: { role, tenant_id: ctx.tenantId } });
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data: { role } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'User', entityId: userId, before: { role: user.role }, after: { role } });
    return updated;
  }

  async deactivate(ctx: RequestContext, userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId: ctx.tenantId } });
    if (!user) throw new NotFoundException('Usuário não encontrado neste tenant.');
    if (userId === ctx.userId) throw new BadRequestException('Você não pode desativar sua própria conta.');

    await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'User', entityId: userId, after: { isActive: false } });
  }
}
