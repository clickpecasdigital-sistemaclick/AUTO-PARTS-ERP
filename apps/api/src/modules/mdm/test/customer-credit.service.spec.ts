import { Test } from '@nestjs/testing';
import { CustomerCreditService } from '../customer-credit.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('CustomerCreditService', () => {
  let service: CustomerCreditService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let audit: { log: jest.Mock };

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };
  const baseCustomer = { id: 'c1', tenantId: 'tenant-1', creditLimit: 1000, creditStatus: 'approved', creditScore: 500, totalPurchasesCount: 0, averageTicketValue: 0, largestPurchaseValue: 0, lastPurchaseAt: null };

  beforeEach(async () => {
    prisma = {
      customer: { findFirst: jest.fn().mockResolvedValue(baseCustomer), update: jest.fn().mockResolvedValue(baseCustomer) },
      accountsReceivable: { findMany: jest.fn().mockResolvedValue([]) },
      sale: { findMany: jest.fn().mockResolvedValue([]) },
      customerCreditEvent: { create: jest.fn() },
    };
    audit = { log: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [CustomerCreditService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: audit }],
    }).compile();

    service = moduleRef.get(CustomerCreditService);
  });

  describe('getProfile', () => {
    it('calcula saldo disponível como limite menos saldo em aberto', async () => {
      prisma.accountsReceivable.findMany.mockResolvedValue([{ amount: 300, paidAmount: 100, dueDate: new Date(Date.now() + 86400000) }]);

      const profile = await service.getProfile('tenant-1', 'c1');

      expect(profile.usedBalance).toBe(200); // 300 - 100
      expect(profile.availableBalance).toBe(800); // 1000 - 200
    });

    it('calcula dias de atraso como o maior atraso entre os títulos vencidos', async () => {
      const tenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10);
      const fiveDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5);
      prisma.accountsReceivable.findMany.mockResolvedValue([
        { amount: 100, paidAmount: 0, dueDate: tenDaysAgo },
        { amount: 50, paidAmount: 0, dueDate: fiveDaysAgo },
      ]);

      const profile = await service.getProfile('tenant-1', 'c1');

      expect(profile.overdueDays).toBe(10);
    });
  });

  describe('refreshProfile — bloqueio automático', () => {
    it('bloqueia automaticamente o cliente com mais de 30 dias de atraso', async () => {
      const fortyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 40);
      prisma.accountsReceivable.findMany.mockResolvedValue([{ amount: 100, paidAmount: 0, dueDate: fortyDaysAgo }]);

      await service.refreshProfile(ctx, 'c1');

      expect(prisma.customer.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ creditStatus: 'blocked' }) }));
      expect(prisma.customerCreditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'automatic_block' }) }),
      );
    });

    it('marca como "restricted" (não bloqueado) para atraso entre 1 e 30 dias', async () => {
      const fiveDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5);
      prisma.accountsReceivable.findMany.mockResolvedValue([{ amount: 100, paidAmount: 0, dueDate: fiveDaysAgo }]);

      await service.refreshProfile(ctx, 'c1');

      expect(prisma.customer.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ creditStatus: 'restricted' }) }));
    });

    it('não gera evento de auditoria quando o status de crédito não muda', async () => {
      prisma.customer.findFirst.mockResolvedValue({ ...baseCustomer, creditStatus: 'approved' });
      prisma.accountsReceivable.findMany.mockResolvedValue([]);
      prisma.sale.findMany.mockResolvedValue([{ totalAmount: 100, createdAt: new Date() }]);

      await service.refreshProfile(ctx, 'c1');

      expect(prisma.customerCreditEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCreditLimit', () => {
    it('rejeita limite negativo', async () => {
      await expect(service.updateCreditLimit(ctx, 'c1', -100)).rejects.toThrow();
    });

    it('registra CustomerCreditEvent do tipo limit_change', async () => {
      await service.updateCreditLimit(ctx, 'c1', 5000, 'Cliente recorrente, aumento aprovado');

      expect(prisma.customerCreditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'limit_change', previousLimit: 1000, newLimit: 5000 }) }),
      );
    });
  });
});
