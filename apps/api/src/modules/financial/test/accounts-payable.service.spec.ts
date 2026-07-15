import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AccountsPayableService } from '../accounts-payable.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('AccountsPayableService', () => {
  let service: AccountsPayableService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };
  const basePayable = {
    id: 'pay-1',
    tenantId: 'tenant-1',
    companyId: 'company-1',
    amount: 1000,
    paidAmount: 0,
    interestAmount: 0,
    fineAmount: 0,
    discountAmount: 0,
    status: 'open',
    bankAccountId: 'bank-1',
    supplierId: 'supplier-1',
    costCenterId: null,
    chartOfAccountId: null,
    documentNumber: 'DOC-1',
  };

  beforeEach(async () => {
    prisma = {
      accountsPayable: {
        create: jest.fn().mockResolvedValue({ id: 'pay-1' }),
        findFirst: jest.fn().mockResolvedValue(basePayable),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...basePayable, ...data })),
      },
      bankAccount: { update: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AccountsPayableService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = moduleRef.get(AccountsPayableService);
  });

  describe('settle', () => {
    it('marca status partially_paid quando a baixa não cobre o valor total', async () => {
      const result = await service.settle(ctx, 'pay-1', { amount: 400 });
      expect(result.status).toBe('partially_paid');
    });

    it('marca status paid quando a baixa cobre o valor total (líquido de juros/multa/desconto)', async () => {
      const result = await service.settle(ctx, 'pay-1', { amount: 1000 });
      expect(result.status).toBe('paid');
    });

    it('considera juros e multa no valor líquido devido', async () => {
      // 1000 + 50 juros + 20 multa = 1070 devido; pagar 1000 não fecha
      const result = await service.settle(ctx, 'pay-1', { amount: 1000, interestAmount: 50, fineAmount: 20 });
      expect(result.status).toBe('partially_paid');
    });

    it('debita o saldo da conta bancária quando bankAccountId é informado', async () => {
      await service.settle(ctx, 'pay-1', { amount: 1000, bankAccountId: 'bank-2' });
      expect(prisma.bankAccount.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'bank-2' }, data: expect.objectContaining({ currentBalance: { decrement: 1000 } }) }));
    });

    it('rejeita baixa em título cancelado', async () => {
      prisma.accountsPayable.findFirst.mockResolvedValue({ ...basePayable, status: 'cancelled' });
      await expect(service.settle(ctx, 'pay-1', { amount: 100 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita baixa em título já totalmente pago', async () => {
      prisma.accountsPayable.findFirst.mockResolvedValue({ ...basePayable, status: 'paid' });
      await expect(service.settle(ctx, 'pay-1', { amount: 100 })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('reverse', () => {
    it('rejeita estorno de título sem nenhuma baixa', async () => {
      await expect(service.reverse(ctx, 'pay-1', 'engano')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reabre o título (status: open) e zera paidAmount', async () => {
      prisma.accountsPayable.findFirst.mockResolvedValue({ ...basePayable, paidAmount: 500, status: 'partially_paid' });
      const result = await service.reverse(ctx, 'pay-1', 'pagamento em duplicidade');
      expect(result.status).toBe('open');
      expect(result.paidAmount).toBe(0);
    });

    it('devolve o saldo à conta bancária vinculada', async () => {
      prisma.accountsPayable.findFirst.mockResolvedValue({ ...basePayable, paidAmount: 500, status: 'partially_paid', bankAccountId: 'bank-1' });
      await service.reverse(ctx, 'pay-1', 'engano');
      expect(prisma.bankAccount.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'bank-1' }, data: expect.objectContaining({ currentBalance: { increment: 500 } }) }));
    });
  });

  describe('renegotiate', () => {
    it('rejeita renegociação de título já pago', async () => {
      prisma.accountsPayable.findFirst.mockResolvedValue({ ...basePayable, status: 'paid' });
      await expect(service.renegotiate(ctx, 'pay-1', { newDueDate: '2026-12-01', reason: 'acordo' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('marca o título original como cancelled (nunca apaga) e cria um novo ligado por renegotiatedFromId', async () => {
      await service.renegotiate(ctx, 'pay-1', { newDueDate: '2026-12-01', reason: 'acordo de pagamento' });

      expect(prisma.accountsPayable.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'pay-1' }, data: expect.objectContaining({ status: 'cancelled' }) }));
      expect(prisma.accountsPayable.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ renegotiatedFromId: 'pay-1' }) }));
    });
  });
});
