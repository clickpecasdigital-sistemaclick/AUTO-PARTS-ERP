import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LgpdService } from '../lgpd.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('LgpdService', () => {
  let service: LgpdService;
  let prisma: Record<string, Record<string, jest.Mock> | jest.Mock>;
  let audit: { log: jest.Mock };

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  beforeEach(async () => {
    prisma = {
      customer: { findFirst: jest.fn().mockResolvedValue({ id: 'c1', tenantId: 'tenant-1' }), update: jest.fn() },
      customerContact: { deleteMany: jest.fn() },
      customerAddress: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      customerVehicle: { findMany: jest.fn().mockResolvedValue([]) },
      dataConsent: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      dataSubjectRequest: { create: jest.fn() },
      interaction: { findMany: jest.fn().mockResolvedValue([]) },
      sale: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    audit = { log: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [LgpdService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: audit }],
    }).compile();

    service = moduleRef.get(LgpdService);
  });

  describe('anonymize', () => {
    it('substitui nome/documento por tag irreversível e marca deletedAt', async () => {
      await service.anonymize(ctx, 'c1');

      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: expect.stringContaining('ANONIMIZADO'), document: expect.stringContaining('ANONIMIZADO'), deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('remove contatos e endereços (dados identificadores), mas não toca no histórico transacional (Sale)', async () => {
      await service.anonymize(ctx, 'c1');

      expect(prisma.customerContact.deleteMany).toHaveBeenCalledWith({ where: { customerId: 'c1' } });
      expect(prisma.customerAddress.deleteMany).toHaveBeenCalledWith({ where: { customerId: 'c1' } });
    });

    it('registra a auditoria com a ação dedicada "anonymize"', async () => {
      await service.anonymize(ctx, 'c1');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'anonymize', entity: 'Customer', entityId: 'c1' }));
    });

    it('lança NotFoundException para cliente inexistente', async () => {
      (prisma.customer as Record<string, jest.Mock>).findFirst.mockResolvedValue(null);
      await expect(service.anonymize(ctx, 'inexistente')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('revokeConsent', () => {
    it('rejeita revogar um consentimento já revogado', async () => {
      (prisma.dataConsent as Record<string, jest.Mock>).findFirst.mockResolvedValue({ id: 'consent-1', status: 'revoked' });
      await expect(service.revokeConsent(ctx, 'consent-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('marca status como revoked e registra revokedAt', async () => {
      (prisma.dataConsent as Record<string, jest.Mock>).findFirst.mockResolvedValue({ id: 'consent-1', status: 'given' });
      (prisma.dataConsent as Record<string, jest.Mock>).update.mockResolvedValue({ id: 'consent-1', status: 'revoked' });

      const result = await service.revokeConsent(ctx, 'consent-1');

      expect(result.status).toBe('revoked');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'consent_change' }));
    });
  });
});
