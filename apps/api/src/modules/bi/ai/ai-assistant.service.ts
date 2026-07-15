import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import { KpiService } from '../kpi/kpi.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Assistente IA do AutoCore ERP — integração com Anthropic API.
 * Arquitetura desacoplada (briefing): trocar de claude-sonnet-4-6 para
 * qualquer outro modelo é uma configuração, não uma reescrita. A resposta
 * é gerada com contexto dos KPIs reais do tenant (buscados antes de
 * chamar a API), garantindo respostas baseadas em dados reais.
 */
@Injectable()
export class AiAssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly kpi: KpiService,
  ) {}

  async query(ctx: RequestContext, question: string): Promise<{ answer: string; tokensUsed?: number; latencyMs?: number }> {
    const range = this.getDefaultRange();
    const context = await this.buildContext(ctx.tenantId, question, range);

    const systemPrompt = this.buildSystemPrompt(context, range);

    const t0 = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, system: systemPrompt, messages: [{ role: 'user', content: question }] }),
    });

    const latencyMs = Date.now() - t0;

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} — ${err}`);
    }

    type AnthropicResponse = { content: { type: string; text: string }[]; usage?: { output_tokens: number } };
    const data = (await response.json()) as AnthropicResponse;
    const answer = data.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
    const tokensUsed = data.usage?.output_tokens;

    await this.prisma.aiQuery.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, query: question, response: answer, tokensUsed, modelUsed: 'claude-sonnet-4-6', latencyMs } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'sensitive_data_view', entity: 'AiQuery', entityId: 'assistant', after: { question: question.slice(0, 100) } });

    return { answer, tokensUsed, latencyMs };
  }

  getHistory(tenantId: string, userId: string, limit = 20) {
    return this.prisma.aiQuery.findMany({ where: { tenantId, userId }, orderBy: { createdAt: 'desc' }, take: limit, select: { id: true, query: true, response: true, latencyMs: true, createdAt: true } });
  }

  private buildSystemPrompt(context: Record<string, unknown>, range: { from: Date; to: Date }): string {
    return `Voce e o Assistente IA do AutoCore ERP, sistema para oficinas mecanicas e distribuidoras de autopecas. Responda em portugues brasileiro, de forma direta e objetiva. Use os dados reais do contexto. Formate valores em R$ com 2 casas decimais. Se nao puder responder com os dados disponiveis, diga claramente.

Periodo dos dados: ${range.from.toLocaleDateString('pt-BR')} a ${range.to.toLocaleDateString('pt-BR')}

Dados do sistema:
${JSON.stringify(context, null, 2)}`;
  }

  private async buildContext(tenantId: string, question: string, range: { from: Date; to: Date }) {
    const q = question.toLowerCase();
    const context: Record<string, unknown> = {};

    const wantsSales = /vend|fatur|receita|ticket|produto|cliente/.test(q);
    const wantsStock = /estoque|acabar|ruptura|m.nimo|produto/.test(q);
    const wantsFinancial = /caixa|pagar|receber|inadimpl|lucro|margem|fluxo/.test(q);
    const wantsWorkshop = /mec.nico|os\b|oficina|ordem|servi.o|produt/.test(q);

    if (wantsSales || (!wantsStock && !wantsFinancial && !wantsWorkshop)) {
      try {
        const s = await this.kpi.getSalesKpis(tenantId, range);
        context.vendas = { receita_liquida: s.netRevenue, lucro_bruto: s.grossProfit, margem_pct: (s.margin * 100).toFixed(1), ticket_medio: s.averageTicket, pedidos: s.totalOrders, top_produtos: s.topProducts.slice(0, 5), top_clientes: s.topCustomers.slice(0, 5) };
      } catch { context.vendas = 'nao disponivel'; }
    }
    if (wantsStock) {
      try {
        const st = await this.kpi.getStockKpis(tenantId);
        context.estoque = { total_skus: st.totalSkus, valor_total: st.totalValue, abaixo_minimo: st.skusBelowMin };
      } catch { context.estoque = 'nao disponivel'; }
    }
    if (wantsFinancial) {
      try {
        const f = await this.kpi.getFinancialKpis(tenantId, range);
        context.financeiro = { a_receber: f.totalReceivable, a_pagar: f.totalPayable, saldo: f.netCashFlow, inadimplencia_pct: (f.defaultRate * 100).toFixed(1), vencidos: f.overdueReceivable };
      } catch { context.financeiro = 'nao disponivel'; }
    }
    if (wantsWorkshop) {
      try {
        const w = await this.kpi.getWorkshopKpis(tenantId, range);
        context.oficina = { total_os: w.totalOrders, receita: w.totalRevenue, ticket_medio: w.averageTicket, duracao_media_horas: w.averageDurationHours, retrabalho_pct: (w.reworkRate * 100).toFixed(1), nps: w.npsScore, mecanicos: w.mechanicPerformance.slice(0, 5) };
      } catch { context.oficina = 'nao disponivel'; }
    }

    return context;
  }

  private getDefaultRange() {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
}
