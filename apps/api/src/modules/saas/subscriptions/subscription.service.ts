import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * PlanService — gestão de planos SaaS (Starter/Pro/Business/Enterprise/Ultimate).
 * Cada plano define limites via PlanLimits e feature flags via PlanFeature.
 */
@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  listPlans(publicOnly = true) {
    return this.prisma.plan.findMany({
      where: { isActive: true, ...(publicOnly ? { isPublic: true } : {}) },
      include: { limits: true, features: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  getPlan(id: string) {
    return this.prisma.plan.findUnique({ where: { id }, include: { limits: true, features: true } });
  }

  async createPlan(data: Record<string, unknown>) {
    return this.prisma.plan.create({ data: data as never });
  }

  async updatePlan(id: string, data: Record<string, unknown>) {
    return this.prisma.plan.update({ where: { id }, data: data as never });
  }
}

/**
 * SubscriptionService — ciclo de vida completo de assinaturas:
 * trial → active → past_due → suspended → cancelled.
 * Enforcement de quotas integrado (bloqueia operações quando limite atingido).
 */
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: { include: { limits: true, features: true } } },
    });
  }

  async startTrial(tenantId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plano não encontrado');

    const trialEndsAt = new Date(Date.now() + (plan.trialDays ?? 14) * 86400000);
    const now = new Date();

    return this.prisma.subscription.upsert({
      where: { tenantId },
      create: { tenantId, planId, status: 'trial', trialEndsAt, currentPeriodStart: now, currentPeriodEnd: trialEndsAt },
      update: { planId, status: 'trial', trialEndsAt, currentPeriodStart: now, currentPeriodEnd: trialEndsAt },
    });
  }

  async upgrade(ctx: RequestContext, newPlanId: string) {
    const sub = await this.getSubscription(ctx.tenantId);
    if (!sub) throw new Error('Assinatura não encontrada');

    const updated = await this.prisma.subscription.update({
      where: { tenantId: ctx.tenantId },
      data: { planId: newPlanId, status: 'active', updatedAt: new Date() },
    });

    await this.prisma.subscriptionHistory.create({ data: { subscriptionId: sub.id, tenantId: ctx.tenantId, eventType: 'upgraded', fromPlanId: sub.planId, toPlanId: newPlanId, performedBy: ctx.userId } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Subscription', entityId: sub.id, after: { event: 'upgraded', planId: newPlanId } });

    return updated;
  }

  async cancel(ctx: RequestContext, cancelAt?: Date) {
    const sub = await this.getSubscription(ctx.tenantId);
    if (!sub) throw new Error('Assinatura não encontrada');

    const updated = await this.prisma.subscription.update({
      where: { tenantId: ctx.tenantId },
      data: { status: 'cancelled', cancelAt: cancelAt ?? new Date(), cancelledAt: new Date() },
    });

    await this.prisma.subscriptionHistory.create({ data: { subscriptionId: sub.id, tenantId: ctx.tenantId, eventType: 'cancelled', fromPlanId: sub.planId, performedBy: ctx.userId } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Subscription', entityId: sub.id, after: { event: 'cancelled' } });

    return updated;
  }

  async reactivate(ctx: RequestContext) {
    const sub = await this.getSubscription(ctx.tenantId);
    if (!sub) throw new Error('Assinatura não encontrada');

    const updated = await this.prisma.subscription.update({
      where: { tenantId: ctx.tenantId },
      data: { status: 'active', cancelAt: null, cancelledAt: null },
    });

    await this.prisma.subscriptionHistory.create({ data: { subscriptionId: sub.id, tenantId: ctx.tenantId, eventType: 'reactivated', fromPlanId: sub.planId, toPlanId: sub.planId, performedBy: ctx.userId } });

    return updated;
  }

  // ---- QUOTA ENFORCEMENT ---------------------------------------------------

  /** Verifica se o tenant atingiu um limite do plano. Lança ForbiddenException se sim. */
  async checkQuota(tenantId: string, resource: string): Promise<void> {
    const sub = await this.getSubscription(tenantId);
    if (!sub) return; // sem assinatura = sem restrição (dev/admin)

    if (['cancelled', 'expired', 'suspended'].includes(sub.status)) {
      throw new ForbiddenException(`Assinatura ${sub.status} — renove para continuar operando.`);
    }

    const limits = sub.plan.limits;
    if (!limits) return;

    const limitKey = `max${resource.charAt(0).toUpperCase()}${resource.slice(1)}` as keyof typeof limits;
    const limit = limits[limitKey] as number | null;
    if (limit === null || limit === undefined) return;

    const usage = await this.prisma.subscriptionUsage.findFirst({ where: { tenantId, resource } });
    if (usage && usage.currentValue >= limit) {
      throw new ForbiddenException(`Limite do plano atingido: ${resource}. Limite: ${limit}. Faça upgrade para continuar.`);
    }
  }

  async incrementUsage(tenantId: string, resource: string, by = 1) {
    const sub = await this.getSubscription(tenantId);
    if (!sub) return;

    await this.prisma.subscriptionUsage.upsert({
      where: { tenantId_resource: { tenantId, resource } },
      create: { subscriptionId: sub.id, tenantId, resource, currentValue: by },
      update: { currentValue: { increment: by }, updatedAt: new Date() },
    });
  }

  async getUsage(tenantId: string) {
    const [sub, usages] = await Promise.all([
      this.getSubscription(tenantId),
      this.prisma.subscriptionUsage.findMany({ where: { tenantId } }),
    ]);

    return {
      plan: sub?.plan.name ?? 'none',
      status: sub?.status ?? 'none',
      trialEndsAt: sub?.trialEndsAt,
      periodEnd: sub?.currentPeriodEnd,
      limits: sub?.plan.limits,
      current: Object.fromEntries(usages.map((u) => [u.resource, u.currentValue])),
    };
  }

  getHistory(tenantId: string) {
    return this.prisma.subscriptionHistory.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }
}
