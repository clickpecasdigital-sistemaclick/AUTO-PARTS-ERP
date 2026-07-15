import { Test } from '@nestjs/testing';
import { BankReconciliationService } from '../bank-reconciliation.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

function decimalLike(value: number) {
  return { toNumber: () => value };
}

describe('BankReconciliationService — autoMatch', () => {
  let service: BankReconciliationService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  beforeEach(async () => {
    prisma = {
      bankStatementEntry: { findMany: jest.fn(), update: jest.fn(), upsert: jest.fn() },
      accountsPayable: { findFirst: jest.fn() },
      accountsReceivable: { findFirst: jest.fn() },
      bankReconciliationItem: { create: jest.fn() },
      bankReconciliation: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [BankReconciliationService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = moduleRef.get(BankReconciliationService);
  });

  it('concilia automaticamente uma saída de extrato com uma conta a pagar do mesmo valor', async () => {
    prisma.bankStatementEntry.findMany.mockResolvedValue([
      { id: 'entry-1', postedAt: new Date('2026-06-15'), amount: decimalLike(-500), status: 'unmatched' },
    ]);
    prisma.accountsPayable.findFirst.mockResolvedValue({ id: 'pay-1', amount: 500 });

    const result = await service.autoMatch(ctx, 'recon-1', 'bank-1');

    expect(prisma.bankStatementEntry.update).toHaveBeenCalledWith({ where: { id: 'entry-1' }, data: { status: 'matched', matchedPayableId: 'pay-1' } });
    expect(result.matched).toBe(1);
  });

  it('concilia automaticamente uma entrada de extrato com uma conta a receber do mesmo valor', async () => {
    prisma.bankStatementEntry.findMany.mockResolvedValue([
      { id: 'entry-2', postedAt: new Date('2026-06-15'), amount: decimalLike(800), status: 'unmatched' },
    ]);
    prisma.accountsReceivable.findFirst.mockResolvedValue({ id: 'rec-1', amount: 800 });

    const result = await service.autoMatch(ctx, 'recon-1', 'bank-1');

    expect(prisma.bankStatementEntry.update).toHaveBeenCalledWith({ where: { id: 'entry-2' }, data: { status: 'matched', matchedReceivableId: 'rec-1' } });
    expect(result.matched).toBe(1);
  });

  it('deixa pendente (não concilia) quando nenhum título corresponde ao valor', async () => {
    prisma.bankStatementEntry.findMany.mockResolvedValue([
      { id: 'entry-3', postedAt: new Date('2026-06-15'), amount: decimalLike(-999), status: 'unmatched' },
    ]);
    prisma.accountsPayable.findFirst.mockResolvedValue(null);

    const result = await service.autoMatch(ctx, 'recon-1', 'bank-1');

    expect(prisma.bankStatementEntry.update).not.toHaveBeenCalled();
    expect(result.stillPending).toBe(1);
  });

  it('retorna a contagem correta de pendências quando há múltiplas linhas', async () => {
    prisma.bankStatementEntry.findMany.mockResolvedValue([
      { id: 'entry-4', postedAt: new Date('2026-06-15'), amount: decimalLike(-100), status: 'unmatched' },
      { id: 'entry-5', postedAt: new Date('2026-06-15'), amount: decimalLike(-200), status: 'unmatched' },
    ]);
    prisma.accountsPayable.findFirst.mockResolvedValueOnce({ id: 'pay-x', amount: 100 }).mockResolvedValueOnce(null);

    const result = await service.autoMatch(ctx, 'recon-1', 'bank-1');

    expect(result.totalUnmatched).toBe(2);
    expect(result.matched).toBe(1);
    expect(result.stillPending).toBe(1);
  });
});
