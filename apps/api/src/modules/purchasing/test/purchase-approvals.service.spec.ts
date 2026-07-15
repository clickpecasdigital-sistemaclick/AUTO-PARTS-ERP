import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PurchaseApprovalsService } from '../purchase-approvals.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('PurchaseApprovalsService', () => {
  let service: PurchaseApprovalsService;
  let prisma: Record<string, jest.Mock | Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  beforeEach(async () => {
    prisma = {
      purchaseApprovalRule: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      purchaseApproval: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn((arg) => Promise.all(arg)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [PurchaseApprovalsService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = moduleRef.get(PurchaseApprovalsService);
  });

  describe('requestApprovals', () => {
    it('aprova automaticamente quando nenhuma regra se aplica ao valor/departamento', async () => {
      (prisma.purchaseApprovalRule as Record<string, jest.Mock>).findMany.mockResolvedValue([]);

      const result = await service.requestApprovals(ctx, { documentType: 'purchase_request', purchaseRequestId: 'req-1', value: 100 });

      expect(result.autoApproved).toBe(true);
      expect(prisma.purchaseApproval.create).not.toHaveBeenCalled();
    });

    it('cria um PurchaseApproval pendente por nível de regra aplicável', async () => {
      (prisma.purchaseApprovalRule as Record<string, jest.Mock>).findMany.mockResolvedValue([
        { level: 1, approverRole: 'manager' },
        { level: 2, approverRole: 'admin' },
      ]);
      (prisma.purchaseApproval as Record<string, jest.Mock>).create.mockResolvedValue({ id: 'approval-1' });

      const result = await service.requestApprovals(ctx, { documentType: 'purchase_order', purchaseOrderId: 'order-1', value: 50000 });

      expect(result.autoApproved).toBe(false);
      expect(prisma.purchaseApproval.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('decide', () => {
    it('rejeita decisão de uma etapa já decidida', async () => {
      (prisma.purchaseApproval as Record<string, jest.Mock>).findFirst.mockResolvedValue({ id: 'a1', status: 'approved', level: 1 });

      await expect(service.decide(ctx, 'a1', 'manager', { decision: 'approved' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('bloqueia aprovador sem o papel exigido pela regra do nível', async () => {
      (prisma.purchaseApproval as Record<string, jest.Mock>).findFirst.mockResolvedValue({ id: 'a1', status: 'pending', level: 1 });
      (prisma.purchaseApprovalRule as Record<string, jest.Mock>).findFirst.mockResolvedValue({ level: 1, approverRole: 'admin' });

      await expect(service.decide(ctx, 'a1', 'operator', { decision: 'approved' })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite super_admin/admin decidir independente do papel exigido pela regra', async () => {
      (prisma.purchaseApproval as Record<string, jest.Mock>).findFirst.mockResolvedValue({ id: 'a1', status: 'pending', level: 1 });
      (prisma.purchaseApprovalRule as Record<string, jest.Mock>).findFirst.mockResolvedValue({ level: 1, approverRole: 'manager' });
      (prisma.purchaseApproval as Record<string, jest.Mock>).update.mockResolvedValue({ id: 'a1', status: 'approved' });

      await expect(service.decide(ctx, 'a1', 'admin', { decision: 'approved' })).resolves.toEqual(expect.objectContaining({ status: 'approved' }));
    });
  });

  describe('isFullyApproved', () => {
    it('retorna true quando não há nenhuma etapa de aprovação (documento de baixo valor, bootstrap)', async () => {
      (prisma.purchaseApproval as Record<string, jest.Mock>).findMany.mockResolvedValue([]);
      await expect(service.isFullyApproved('tenant-1', { purchaseOrderId: 'order-1' })).resolves.toBe(true);
    });

    it('retorna false quando ao menos uma etapa ainda está pendente', async () => {
      (prisma.purchaseApproval as Record<string, jest.Mock>).findMany.mockResolvedValue([{ status: 'approved' }, { status: 'pending' }]);
      await expect(service.isFullyApproved('tenant-1', { purchaseOrderId: 'order-1' })).resolves.toBe(false);
    });
  });
});
