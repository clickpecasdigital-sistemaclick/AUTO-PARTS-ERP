import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface TaxCalculationInput {
  tenantId: string;
  ncmCode?: string;
  cfopCode?: string;
  originState: string;
  destState: string;
  taxRegime: string;
  productId?: string;
  productValue: number;
  quantity: number;
  freightValue?: number;
  insuranceValue?: number;
  discountValue?: number;
}

export interface TaxCalculationResult {
  cstIcms: string | null;
  csosnIcms: string | null;
  icmsOrigin: string;
  icmsRate: number;
  icmsBcAmount: number;
  icmsAmount: number;
  icmsStRate: number;
  icmsStBcAmount: number;
  icmsStAmount: number;
  mvaPercent: number;
  fcpRate: number;
  fcpAmount: number;
  cstIpi: string | null;
  ipiRate: number;
  ipiAmount: number;
  cstPis: string | null;
  pisRate: number;
  pisAmount: number;
  cstCofins: string | null;
  cofinsRate: number;
  cofinsAmount: number;
  totalAmount: number;
  appliedRuleId: string | null;
}

/**
 * Motor de Tributação parametrizável (briefing: "engine parametrizável,
 * não criar regras fixas em código"). Resolve a regra mais específica
 * (maior `priority`) para a combinação NCM+UF+regime+operação via
 * `TaxCalculationRule`, calcula todos os tributos e retorna os valores
 * prontos para montar o `FiscalInvoiceItem`. Se nenhuma regra existir,
 * retorna zeros — operador vê isso no preview da nota antes de emitir.
 *
 * Tributos suportados: ICMS, ICMS-ST, IPI, PIS, COFINS, FCP.
 * ISS e retenções: campos presentes na regra, cálculo preparado — a nota
 * de serviço (NFS-e) usará o mesmo motor numa evolução futura.
 */
@Injectable()
export class TaxEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(input: TaxCalculationInput): Promise<TaxCalculationResult> {
    const rule = await this.resolveRule(input);

    const bcBase = input.productValue + (input.freightValue ?? 0) + (input.insuranceValue ?? 0) - (input.discountValue ?? 0);

    // ICMS
    const icmsRate = Number(rule?.icmsRate ?? 0);
    const icmsBcAmount = bcBase;
    const icmsAmount = icmsBcAmount * (icmsRate / 100);

    // ICMS-ST (substituição tributária)
    const icmsStRate = Number(rule?.icmsStRate ?? 0);
    const mvaPercent = Number(rule?.mvaPercent ?? 0);
    const icmsStBcAmount = mvaPercent > 0 ? icmsBcAmount * (1 + mvaPercent / 100) : 0;
    const icmsStAmount = icmsStBcAmount > 0 ? icmsStBcAmount * (icmsStRate / 100) - icmsAmount : 0;

    // FCP
    const fcpRate = Number(rule?.fcpRate ?? 0);
    const fcpAmount = icmsBcAmount * (fcpRate / 100);

    // IPI
    const ipiRate = Number(rule?.ipiRate ?? 0);
    const ipiAmount = input.productValue * (ipiRate / 100);

    // PIS / COFINS
    const pisRate = Number(rule?.pisRate ?? 0);
    const cofinsRate = Number(rule?.cofinsRate ?? 0);
    const pisAmount = input.productValue * (pisRate / 100);
    const cofinsAmount = input.productValue * (cofinsRate / 100);

    const totalAmount = input.productValue + icmsStAmount + ipiAmount - (input.discountValue ?? 0);

    return {
      cstIcms: rule?.cstIcms ?? null,
      csosnIcms: rule?.csosnIcms ?? null,
      icmsOrigin: rule?.icmsOrigin ?? '0',
      icmsRate,
      icmsBcAmount,
      icmsAmount,
      icmsStRate,
      icmsStBcAmount,
      icmsStAmount: Math.max(0, icmsStAmount),
      mvaPercent,
      fcpRate,
      fcpAmount,
      cstIpi: rule?.cstIpi ?? null,
      ipiRate,
      ipiAmount,
      cstPis: rule?.cstPis ?? null,
      pisRate,
      pisAmount,
      cstCofins: rule?.cstCofins ?? null,
      cofinsRate,
      cofinsAmount,
      totalAmount,
      appliedRuleId: rule?.id ?? null,
    };
  }

  /** Calcula o DIFAL para operações interestaduais para não contribuintes (EC 87/2015). */
  calculateDifal(stateIcmsRate: number, destStateIcmsRate: number, productValue: number): { difalAmount: number; fcpDifalAmount: number } {
    const interestateRate = stateIcmsRate;
    const difalAmount = productValue * ((destStateIcmsRate - interestateRate) / 100);
    const fcpDifalAmount = 0; // FCP do DIFAL — alíquota varia por estado, deixado como 0 para configuração futura
    return { difalAmount: Math.max(0, difalAmount), fcpDifalAmount };
  }

  /**
   * Resolve a regra mais específica (maior `priority`) para os parâmetros
   * de entrada. Especificidade: produto > NCM+UF+regime > NCM+UF > NCM+regime >
   * NCM > UF+regime > UF > regime > padrão (sem critério).
   */
  private async resolveRule(input: TaxCalculationInput) {
    const candidates = await this.prisma.taxCalculationRule.findMany({
      where: {
        tenantId: input.tenantId,
        isActive: true,
        OR: [
          { productId: input.productId ?? null },
          { ncmCode: input.ncmCode ?? null },
          { ncmCode: null },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    // Filtra candidatos compatíveis (null num critério = "qualquer valor")
    const compatible = candidates.filter((r) => {
      if (r.productId && r.productId !== input.productId) return false;
      if (r.ncmCode && r.ncmCode !== input.ncmCode) return false;
      if (r.cfopCode && r.cfopCode !== input.cfopCode) return false;
      if (r.originState && r.originState !== input.originState) return false;
      if (r.destState && r.destState !== input.destState) return false;
      if (r.taxRegime && r.taxRegime !== input.taxRegime) return false;
      return true;
    });

    return compatible[0] ?? null;
  }

  /** Lista todas as regras configuradas — para exibição no painel de tributação. */
  listRules(tenantId: string) {
    return this.prisma.taxCalculationRule.findMany({ where: { tenantId }, orderBy: { priority: 'desc' } });
  }

  createRule(tenantId: string, data: Record<string, unknown>) {
    return this.prisma.taxCalculationRule.create({ data: { tenantId, ...data } as never });
  }

  async updateRule(tenantId: string, id: string, data: Record<string, unknown>) {
    const { count } = await this.prisma.taxCalculationRule.updateMany({ where: { id, tenantId }, data: data as never });
    if (count === 0) throw new NotFoundException('Regra de tributação não encontrada');
    return this.prisma.taxCalculationRule.findUnique({ where: { id } });
  }

  async deactivateRule(tenantId: string, id: string) {
    const { count } = await this.prisma.taxCalculationRule.updateMany({ where: { id, tenantId }, data: { isActive: false } });
    if (count === 0) throw new NotFoundException('Regra de tributação não encontrada');
    return this.prisma.taxCalculationRule.findUnique({ where: { id } });
  }
}
