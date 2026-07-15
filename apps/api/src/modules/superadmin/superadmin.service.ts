import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * SuperAdminService — painel exclusivo para o administrador da plataforma SaaS.
 * Visibilidade total: todos os tenants, usuários, assinaturas, uso, erros.
 * Acesso protegido por role 'superadmin' (verificado no guard).
 */
@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---- DASHBOARD GERAL -----------------------------------------------------

  async getDashboard() {
    const [tenantCount, userCount, activeSubCount, trialCount, mrr, recentAuditErrors] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: 'active' } }),
      this.prisma.subscription.count({ where: { status: 'trial' } }),
      this.prisma.billingRecord.aggregate({ where: { status: 'paid', createdAt: { gte: new Date(Date.now() - 30 * 86400000) } }, _sum: { amount: true } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 3600000) } } }),
    ]);

    return {
      tenants: tenantCount,
      users: userCount,
      activeSubscriptions: activeSubCount,
      trials: trialCount,
      mrrLast30d: Number(mrr._sum.amount ?? 0),
      auditEventsLastHour: recentAuditErrors,
    };
  }

  // ---- GESTÃO DE TENANTS ---------------------------------------------------

  listTenants(page = 1, perPage = 20, search?: string) {
    return this.prisma.tenant.findMany({
      where: search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { document: { contains: search } }] } : {},
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  getTenant(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: { include: { limits: true } }, history: { take: 10, orderBy: { createdAt: 'desc' } } } },
        users: { take: 10, select: { id: true, email: true, fullName: true, createdAt: true } },
      },
    });
  }

  async suspendTenant(ctx: RequestContext, tenantId: string, reason: string) {
    await this.prisma.subscription.update({ where: { tenantId }, data: { status: 'suspended' } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Tenant', entityId: tenantId, after: { event: 'suspended', reason } });
    return { message: `Tenant ${tenantId} suspenso` };
  }

  async reactivateTenant(ctx: RequestContext, tenantId: string) {
    await this.prisma.subscription.update({ where: { tenantId }, data: { status: 'active' } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Tenant', entityId: tenantId, after: { event: 'reactivated' } });
    return { message: `Tenant ${tenantId} reativado` };
  }

  // ---- USO E MÉTRICAS ------------------------------------------------------

  async getUsageReport() {
    const tenants = await this.prisma.tenant.findMany({ include: { subscription: { include: { plan: true, usage: true } } } });

    return tenants.map((t) => ({
      tenantId: t.id,
      name: t.name,
      plan: t.subscription?.plan.name ?? 'none',
      status: t.subscription?.status ?? 'none',
      usage: Object.fromEntries((t.subscription?.usage ?? []).map((u) => [u.resource, u.currentValue])),
    }));
  }

  async getStorageReport() {
    return this.prisma.backupJob.groupBy({ by: ['tenantId'], _sum: { sizeBytes: true }, orderBy: { _sum: { sizeBytes: 'desc' } }, take: 50 });
  }

  // ---- LOGS GLOBAIS --------------------------------------------------------

  getGlobalAuditLog(page = 1, perPage = 50, tenantId?: string) {
    return this.prisma.auditLog.findMany({
      where: { ...(tenantId ? { tenantId } : {}) },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  // ---- PLANOS (gerenciar do painel SA) -------------------------------------

  listPlans() {
    return this.prisma.plan.findMany({ include: { limits: true, features: true, _count: { select: { subscriptions: true } } }, orderBy: { sortOrder: 'asc' } });
  }

  async createOrUpdatePlan(data: Record<string, unknown>) {
    const { limits, features: _features, ...planData } = data;
    const plan = await this.prisma.plan.upsert({
      where: { name: String(planData.name) },
      create: planData as never,
      update: planData as never,
    });

    if (limits) {
      await this.prisma.planLimits.upsert({ where: { planId: plan.id }, create: { planId: plan.id, ...(limits as Record<string, unknown>) } as never, update: limits as never });
    }

    return plan;
  }

  // ---- MARKETPLACE (gerenciar plugins) -------------------------------------

  async publishPlugin(data: Record<string, unknown>) {
    return this.prisma.plugin.create({ data: data as never });
  }

  async updatePlugin(id: string, data: Record<string, unknown>) {
    return this.prisma.plugin.update({ where: { id }, data: data as never });
  }
}
