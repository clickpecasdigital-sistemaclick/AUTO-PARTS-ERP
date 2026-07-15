import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * CopilotService — IA Copilot integrada em todas as telas (Sprint 16).
 *
 * Princípio fundamental: o Copilot NUNCA executa uma ação ou retorna
 * dados sem antes verificar as permissões do usuário. O sistema de
 * permissões existente (Sprint 01) é a única fonte de verdade.
 *
 * Fluxo:
 * 1. Recebe comando em linguagem natural
 * 2. Detecta intenção + extrai entidades (NER simples por regex/keywords)
 * 3. Verifica permissão para a ação detectada
 * 4. Busca dados reais do tenant (via Prisma, não inventando)
 * 5. Chama Anthropic API com contexto real + persona do ERP
 * 6. Retorna resposta + eventualmente executa ação (navigate, create, etc.)
 * 7. Audita tudo via AuditService
 */
@Injectable()
export class CopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async processCommand(ctx: RequestContext & { permissions: string[] }, command: string, screen?: string): Promise<{ answer: string; action?: CopilotAction; latencyMs?: number }> {
    const intent = this.detectIntent(command);
    await this.checkPermission(ctx, intent);

    const context = await this.buildContext(ctx.tenantId, command, intent);
    const sessionId = await this.getOrCreateSession(ctx);

    const t0 = Date.now();
    const response = await this.callAI(command, context, screen);
    const latencyMs = Date.now() - t0;

    await this.updateSession(sessionId, command, response.answer);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'sensitive_data_view', entity: 'CopilotSession', entityId: sessionId, after: { command: command.slice(0, 100), intent: intent.type } });

    return { answer: response.answer, action: intent.action ? { type: intent.action, params: intent.params } : undefined, latencyMs };
  }

  private detectIntent(command: string): Intent {
    const cmd = command.toLowerCase().trim();

    // Navegação
    if (/abr[ia]|ir para|naveg/.test(cmd)) {
      if (/cliente|customer/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/clientes' }, requiredModule: 'customers', requiredAction: 'view' };
      if (/produto/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/produtos' }, requiredModule: 'products', requiredAction: 'view' };
      if (/venda|pdv/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/pdv' }, requiredModule: 'sales', requiredAction: 'view' };
      if (/estoque/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/estoque' }, requiredModule: 'stock', requiredAction: 'view' };
      if (/compra/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/compras' }, requiredModule: 'purchases', requiredAction: 'view' };
      if (/financeiro|caixa/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/financeiro' }, requiredModule: 'financial', requiredAction: 'view' };
      if (/fiscal|nf/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/fiscal' }, requiredModule: 'fiscal', requiredAction: 'view' };
      if (/oficina|ordem/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/oficina' }, requiredModule: 'workshop', requiredAction: 'view' };
      if (/dashboard|início/.test(cmd)) return { type: 'navigate', action: 'navigate', params: { path: '/' }, requiredModule: null, requiredAction: null };
    }

    // Ações de criação
    if (/cri[ae]r?|new|novo|abrir/.test(cmd)) {
      if (/os|ordem de servi/.test(cmd)) return { type: 'create', action: 'navigate', params: { path: '/oficina/ordens/nova' }, requiredModule: 'workshop', requiredAction: 'create' };
      if (/pedido de compra/.test(cmd)) return { type: 'create', action: 'navigate', params: { path: '/compras/pedidos/novo' }, requiredModule: 'purchases', requiredAction: 'create' };
      if (/cliente/.test(cmd)) return { type: 'create', action: 'navigate', params: { path: '/clientes/novo' }, requiredModule: 'customers', requiredAction: 'create' };
      if (/produto/.test(cmd)) return { type: 'create', action: 'navigate', params: { path: '/produtos/novo' }, requiredModule: 'products', requiredAction: 'create' };
      if (/venda/.test(cmd)) return { type: 'create', action: 'navigate', params: { path: '/pdv/venda' }, requiredModule: 'sales', requiredAction: 'create' };
    }

    // Fiscal
    if (/emiti?r?|nf-e|nota fiscal/.test(cmd)) return { type: 'fiscal', action: 'navigate', params: { path: '/fiscal/notas' }, requiredModule: 'fiscal', requiredAction: 'issue' };
    if (/cancelar nf|cancel/.test(cmd)) return { type: 'fiscal', action: 'navigate', params: { path: '/fiscal/monitor' }, requiredModule: 'fiscal', requiredAction: 'void' };

    // Financeiro
    if (/abrir caixa/.test(cmd)) return { type: 'financial', action: 'navigate', params: { path: '/pdv/caixa' }, requiredModule: 'financial', requiredAction: 'create' };
    if (/fechar caixa/.test(cmd)) return { type: 'financial', action: 'navigate', params: { path: '/pdv/caixa' }, requiredModule: 'financial', requiredAction: 'create' };

    // Consultas de dados (KPI)
    if (/quanto vend|vend.*m[eê]s|fatur/.test(cmd)) return { type: 'query_sales', requiredModule: 'bi', requiredAction: 'view' };
    if (/estoque m[ií]nimo|produto.*acabar|ruptura/.test(cmd)) return { type: 'query_stock', requiredModule: 'stock', requiredAction: 'view' };
    if (/fornecedor.*r[áa]pid|entrega mais r/.test(cmd)) return { type: 'query_suppliers', requiredModule: 'purchases', requiredAction: 'view' };
    if (/mecânico.*produti|melhor mecânico/.test(cmd)) return { type: 'query_workshop', requiredModule: 'workshop', requiredAction: 'view' };
    if (/lucro|margem|financeiro/.test(cmd)) return { type: 'query_financial', requiredModule: 'financial', requiredAction: 'view' };
    if (/relat[oó]rio/.test(cmd)) return { type: 'report', action: 'navigate', params: { path: '/bi' }, requiredModule: 'bi', requiredAction: 'view' };

    return { type: 'general', requiredModule: null, requiredAction: null };
  }

  private async checkPermission(ctx: RequestContext & { permissions: string[] }, intent: Intent) {
    if (!intent.requiredModule || !intent.requiredAction) return;

    const perm = `${intent.requiredModule}:${intent.requiredAction}`;
    if (!ctx.permissions.includes(perm) && !ctx.permissions.includes('*:*')) {
      throw new ForbiddenException(`Permissão insuficiente para executar esta ação (${perm})`);
    }
  }

  private async buildContext(tenantId: string, command: string, intent: Intent): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = { intent: intent.type };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      if (intent.type === 'query_sales') {
        const [agg] = await Promise.all([
          this.prisma.factSale.aggregate({ where: { tenantId, dateKey: { gte: parseInt(`${monthStart.getFullYear()}${String(monthStart.getMonth() + 1).padStart(2, '0')}01`) } }, _sum: { netRevenue: true }, _count: { saleId: true } }),
        ]);
        context.vendas_mes = { receita: agg._sum.netRevenue ?? 0, pedidos: agg._count.saleId ?? 0 };
      }

      if (intent.type === 'query_stock') {
        const belowMin = await this.prisma.stock.count({ where: { tenantId, quantityOnHand: { lte: 0 } } });
        context.estoque = { produtos_sem_estoque: belowMin };
      }

      if (intent.type === 'query_suppliers') {
        const fastSupplier = await this.prisma.factPurchase.groupBy({ by: ['supplierId'], where: { tenantId, leadTimeDays: { not: null } }, _avg: { leadTimeDays: true }, orderBy: { _avg: { leadTimeDays: 'asc' } }, take: 3 });
        context.fornecedores = fastSupplier;
      }

      if (intent.type === 'query_financial') {
        const [rec, pay] = await Promise.all([
          this.prisma.accountsReceivable.aggregate({ where: { tenantId }, _sum: { amount: true } }),
          this.prisma.accountsPayable.aggregate({ where: { tenantId }, _sum: { amount: true } }),
        ]);
        context.financeiro = { a_receber: rec._sum.amount ?? 0, a_pagar: pay._sum.amount ?? 0 };
      }
    } catch { /* contexto parcial OK */ }

    return context;
  }

  private async callAI(command: string, context: Record<string, unknown>, screen?: string): Promise<{ answer: string }> {
    const systemPrompt = `Voce e o Copilot do AutoCore ERP, assistente de IA integrado ao sistema de gestao para oficinas mecanicas e distribuidoras de autopecas. Responda em portugues brasileiro de forma direta e objetiva. Tela atual: ${screen ?? 'desconhecida'}. Use os dados do contexto. Para navegacao ou acoes, confirme que a acao sera executada.

Contexto atual: ${JSON.stringify(context)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 512, system: systemPrompt, messages: [{ role: 'user', content: command }] }),
    });

    if (!response.ok) return { answer: 'Não foi possível processar o comando. Tente novamente.' };

    type AIResp = { content: { type: string; text: string }[] };
    const data = (await response.json()) as AIResp;
    return { answer: data.content.filter((c) => c.type === 'text').map((c) => c.text).join('') };
  }

  private async getOrCreateSession(ctx: RequestContext): Promise<string> {
    let session = await this.prisma.copilotSession.findFirst({ where: { tenantId: ctx.tenantId, userId: ctx.userId }, orderBy: { updatedAt: 'desc' } });
    if (!session) session = await this.prisma.copilotSession.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId } });
    return session.id;
  }

  private async updateSession(sessionId: string, command: string, answer: string) {
    const session = await this.prisma.copilotSession.findUnique({ where: { id: sessionId } });
    const messages = (session?.messages as { role: string; content: string }[] ?? []);
    messages.push({ role: 'user', content: command }, { role: 'assistant', content: answer });
    if (messages.length > 40) messages.splice(0, 2); // mantém últimas 20 trocas
    await this.prisma.copilotSession.update({ where: { id: sessionId }, data: { messages: messages as never } });
  }

  getHistory(tenantId: string, userId: string) {
    return this.prisma.copilotSession.findFirst({ where: { tenantId, userId }, orderBy: { updatedAt: 'desc' } });
  }
}

export interface Intent {
  type: string;
  action?: string;
  params?: Record<string, unknown>;
  requiredModule: string | null;
  requiredAction: string | null;
}

export interface CopilotAction {
  type: string;
  params?: Record<string, unknown>;
}
