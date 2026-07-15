import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface DiscountCheckResult {
  allowed: boolean;
  maxPercent: number;
  requiresApproval: boolean;
}

/**
 * Regras de desconto (briefing: "Aplicar regras por Usuário, Perfil,
 * Cliente, Produto, Campanha. Registrar toda alteração em auditoria.").
 * `check()` retorna o limite MAIS RESTRITIVO entre todas as regras
 * aplicáveis ao contexto (usuário logado + perfil + cliente + produto) —
 * nunca o mais permissivo, para que uma regra de produto específica não
 * sobreponha um limite mais baixo do perfil do operador. A auditoria de
 * "toda alteração" é responsabilidade do chamador (`PdvCartService`), que
 * já grava `discount` no audit log a cada item alterado.
 */
@Injectable()
export class PdvDiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async check(params: { tenantId: string; userId: string | null; profileId?: string | null; customerId?: string; productId?: string }): Promise<DiscountCheckResult> {
    const scopeFilters: { scope: string; scopeRefId: string | null }[] = [
      { scope: 'user', scopeRefId: params.userId },
      { scope: 'profile', scopeRefId: params.profileId ?? null },
      { scope: 'customer', scopeRefId: params.customerId ?? null },
      { scope: 'product', scopeRefId: params.productId ?? null },
    ].filter((f) => f.scopeRefId !== null) as { scope: string; scopeRefId: string }[];

    const rules = await this.prisma.discountRule.findMany({
      where: {
        tenantId: params.tenantId,
        isActive: true,
        OR: [{ scopeRefId: null }, ...scopeFilters.map((f) => ({ scope: f.scope as never, scopeRefId: f.scopeRefId }))],
      },
    });

    if (rules.length === 0) {
      return { allowed: true, maxPercent: 100, requiresApproval: false };
    }

    const mostRestrictive = rules.reduce((min, rule) => (Number(rule.maxDiscountPercent) < min ? Number(rule.maxDiscountPercent) : min), 100);
    const lowestApprovalThreshold = rules
      .map((r) => (r.requiresApprovalAbovePercent ? Number(r.requiresApprovalAbovePercent) : null))
      .filter((v): v is number => v !== null);

    return {
      allowed: true,
      maxPercent: mostRestrictive,
      requiresApproval: lowestApprovalThreshold.length > 0 ? Math.min(...lowestApprovalThreshold) <= mostRestrictive : false,
    };
  }

  listRules(tenantId: string) {
    return this.prisma.discountRule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  createRule(tenantId: string, data: { scope: string; scopeRefId?: string; maxDiscountPercent: number; requiresApprovalAbovePercent?: number }) {
    return this.prisma.discountRule.create({ data: { tenantId, ...data } as never });
  }
}
