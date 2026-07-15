import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Conciliação Bancária (briefing: "Importação OFX, Importação CNAB,
 * Conciliação manual, automática, Divergências, Pendências, Histórico").
 * `importStatement()` é a estrutura preparada para os parsers reais de
 * OFX/CNAB — aceita linhas já normalizadas (data/descrição/valor), o
 * parser específico de cada formato é trabalho da Sprint de Integrações
 * (briefing: "não implementar integrações bancárias reais... nesta
 * Sprint"). `autoMatch()` já funciona de ponta a ponta hoje (concilia por
 * valor exato + janela de 3 dias), sem depender de PSP nenhum.
 */
@Injectable()
export class BankReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Estrutura preparada — recebe linhas já normalizadas (o parser de OFX/CNAB em si é Sprint de Integrações). */
  async importStatement(ctx: RequestContext, bankAccountId: string, source: 'ofx' | 'cnab' | 'manual', rows: { postedAt: string; description: string; amount: number; externalId?: string }[]) {
    const created = [];
    for (const row of rows) {
      const entry = await this.prisma.bankStatementEntry.upsert({
        where: { bankAccountId_externalId: { bankAccountId, externalId: row.externalId ?? `${row.postedAt}-${row.amount}-${row.description}` } },
        update: {},
        create: { tenantId: ctx.tenantId, bankAccountId, postedAt: new Date(row.postedAt), description: row.description, amount: row.amount, externalId: row.externalId, importSource: source },
      });
      created.push(entry);
    }
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'BankStatementEntry', entityId: bankAccountId, after: { source, count: created.length } });
    return created;
  }

  listUnmatched(tenantId: string, bankAccountId: string) {
    return this.prisma.bankStatementEntry.findMany({ where: { tenantId, bankAccountId, status: 'unmatched' }, orderBy: { postedAt: 'desc' } });
  }

  async openReconciliation(ctx: RequestContext, bankAccountId: string, periodStart: string, periodEnd: string) {
    const reconciliation = await this.prisma.bankReconciliation.create({
      data: { tenantId: ctx.tenantId, bankAccountId, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd), createdBy: ctx.userId },
    });
    return reconciliation;
  }

  /** Conciliação manual — operador escolhe explicitamente qual título corresponde à linha do extrato. */
  async matchManually(ctx: RequestContext, reconciliationId: string, statementEntryId: string, params: { payableId?: string; receivableId?: string }) {
    const entry = await this.prisma.bankStatementEntry.findFirst({ where: { id: statementEntryId, tenantId: ctx.tenantId } });
    if (!entry) throw new NotFoundException('Linha de extrato não encontrada');
    if (entry.status !== 'unmatched') throw new BadRequestException('Esta linha já foi conciliada');

    const expectedAmount = params.payableId
      ? Number((await this.prisma.accountsPayable.findUnique({ where: { id: params.payableId } }))?.amount ?? 0)
      : Number((await this.prisma.accountsReceivable.findUnique({ where: { id: params.receivableId } }))?.amount ?? 0);
    const divergence = Math.abs(entry.amount.toNumber()) - expectedAmount;

    await this.prisma.bankStatementEntry.update({ where: { id: statementEntryId }, data: { status: 'matched', matchedPayableId: params.payableId, matchedReceivableId: params.receivableId } });
    const item = await this.prisma.bankReconciliationItem.create({
      data: { tenantId: ctx.tenantId, reconciliationId, statementEntryId, matchMethod: 'manual', divergenceAmount: divergence },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'BankStatementEntry', entityId: statementEntryId, after: { status: 'matched', method: 'manual' } });
    return item;
  }

  /**
   * Conciliação automática — concilia linhas de extrato com títulos
   * abertos do mesmo valor (tolerância de R$0,01) dentro de uma janela de
   * 3 dias da data de vencimento. Tudo que não casar automaticamente
   * permanece `unmatched` para decisão manual (Pendências/Divergências).
   */
  async autoMatch(ctx: RequestContext, reconciliationId: string, bankAccountId: string) {
    const unmatched = await this.listUnmatched(ctx.tenantId, bankAccountId);
    let matchedCount = 0;

    for (const entry of unmatched) {
      const amount = Math.abs(entry.amount.toNumber());
      const windowStart = new Date(entry.postedAt);
      windowStart.setDate(windowStart.getDate() - 3);
      const windowEnd = new Date(entry.postedAt);
      windowEnd.setDate(windowEnd.getDate() + 3);

      if (entry.amount.toNumber() < 0) {
        const candidate = await this.prisma.accountsPayable.findFirst({ where: { tenantId: ctx.tenantId, bankAccountId, status: { in: ['open', 'partially_paid'] }, amount: { gte: amount - 0.01, lte: amount + 0.01 }, dueDate: { gte: windowStart, lte: windowEnd } } });
        if (candidate) {
          await this.prisma.bankStatementEntry.update({ where: { id: entry.id }, data: { status: 'matched', matchedPayableId: candidate.id } });
          await this.prisma.bankReconciliationItem.create({ data: { tenantId: ctx.tenantId, reconciliationId, statementEntryId: entry.id, matchMethod: 'automatic', divergenceAmount: 0 } });
          matchedCount++;
        }
      } else {
        const candidate = await this.prisma.accountsReceivable.findFirst({ where: { tenantId: ctx.tenantId, bankAccountId, status: { in: ['open', 'partially_paid'] }, amount: { gte: amount - 0.01, lte: amount + 0.01 }, dueDate: { gte: windowStart, lte: windowEnd } } });
        if (candidate) {
          await this.prisma.bankStatementEntry.update({ where: { id: entry.id }, data: { status: 'matched', matchedReceivableId: candidate.id } });
          await this.prisma.bankReconciliationItem.create({ data: { tenantId: ctx.tenantId, reconciliationId, statementEntryId: entry.id, matchMethod: 'automatic', divergenceAmount: 0 } });
          matchedCount++;
        }
      }
    }

    return { totalUnmatched: unmatched.length, matched: matchedCount, stillPending: unmatched.length - matchedCount };
  }

  async closeReconciliation(ctx: RequestContext, id: string) {
    const reconciliation = await this.prisma.bankReconciliation.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!reconciliation) throw new NotFoundException('Conciliação não encontrada');
    const updated = await this.prisma.bankReconciliation.update({ where: { id }, data: { status: 'closed', closedAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'BankReconciliation', entityId: id, after: { status: 'closed' } });
    return updated;
  }

  getHistory(tenantId: string, bankAccountId?: string) {
    return this.prisma.bankReconciliation.findMany({ where: { tenantId, ...(bankAccountId ? { bankAccountId } : {}) }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }
}
