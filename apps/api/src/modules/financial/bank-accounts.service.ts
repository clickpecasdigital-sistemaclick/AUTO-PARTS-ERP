import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/** Bancos, Agências, Contas, Chaves PIX, Limites, Saldos (briefing). */
@Injectable()
export class BankAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listBanks() {
    return this.prisma.bank.findMany({ orderBy: { name: 'asc' } });
  }

  listAccounts(tenantId: string, companyId?: string) {
    return this.prisma.bankAccount.findMany({ where: { tenantId, isActive: true, ...(companyId ? { companyId } : {}) }, include: { pixKeys: true } });
  }

  async getAccount(tenantId: string, id: string) {
    const account = await this.prisma.bankAccount.findFirst({ where: { id, tenantId }, include: { pixKeys: true } });
    if (!account) throw new NotFoundException('Conta bancária não encontrada');
    return account;
  }

  async createAccount(ctx: RequestContext, companyId: string, data: Record<string, unknown>) {
    const account = await this.prisma.bankAccount.create({ data: { tenantId: ctx.tenantId, companyId, currentBalance: data.initialBalance ?? 0, ...data } as never });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'BankAccount', entityId: account.id, after: account });
    return account;
  }

  addPixKey(tenantId: string, bankAccountId: string, type: string, value: string) {
    return this.prisma.bankAccountPixKey.create({ data: { tenantId, bankAccountId, type, value } });
  }

  /**
   * Recalcula `currentBalance` a partir de `initialBalance` + todas as
   * baixas (AccountsPayable.paidAmount/AccountsReceivable.receivedAmount)
   * vinculadas a esta conta — usado para corrigir divergências, já que o
   * dia a dia atualiza o saldo incrementalmente em cada baixa
   * (`AccountsPayableService.settle`/`AccountsReceivableService.settle`).
   */
  async refreshBalance(tenantId: string, bankAccountId: string) {
    const account = await this.getAccount(tenantId, bankAccountId);
    const [paidAgg, receivedAgg] = await Promise.all([
      this.prisma.accountsPayable.aggregate({ where: { tenantId, bankAccountId }, _sum: { paidAmount: true } }),
      this.prisma.accountsReceivable.aggregate({ where: { tenantId, bankAccountId }, _sum: { receivedAmount: true } }),
    ]);

    const currentBalance = Number(account.initialBalance) + Number(receivedAgg._sum.receivedAmount ?? 0) - Number(paidAgg._sum.paidAmount ?? 0);
    return this.prisma.bankAccount.update({ where: { id: bankAccountId }, data: { currentBalance, balanceUpdatedAt: new Date() } });
  }

  getTotalBalances(tenantId: string, companyId?: string) {
    return this.prisma.bankAccount.aggregate({ where: { tenantId, isActive: true, ...(companyId ? { companyId } : {}) }, _sum: { currentBalance: true } });
  }
}
