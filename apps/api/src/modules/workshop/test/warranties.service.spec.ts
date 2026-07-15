import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WarrantiesService } from '../warranty-mechanic-postsale.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('WarrantiesService', () => {
  let service: WarrantiesService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  beforeEach(async () => {
    prisma = {
      warranty: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'w1', ...data })) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [WarrantiesService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = moduleRef.get(WarrantiesService);
  });

  describe('create', () => {
    it('calcula endDate como startDate + termDays', async () => {
      prisma.warranty.create.mockImplementation(({ data }) => Promise.resolve(data));

      const result = await service.create(ctx, 'os-1', { type: 'service' as never, description: 'Garantia de troca de óleo', termDays: 90 });

      const diffDays = Math.round((result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(90);
    });
  });

  describe('claim — acionamento', () => {
    it('rejeita acionar garantia que não está ativa', async () => {
      prisma.warranty.findFirst.mockResolvedValue({ id: 'w1', status: 'claimed', endDate: new Date(Date.now() + 86400000) });
      await expect(service.claim(ctx, 'w1', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita acionar garantia vencida', async () => {
      prisma.warranty.findFirst.mockResolvedValue({ id: 'w1', status: 'active', endDate: new Date(Date.now() - 86400000) });
      await expect(service.claim(ctx, 'w1', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('aciona a garantia ativa e dentro do prazo, registrando custo do acionamento', async () => {
      prisma.warranty.findFirst.mockResolvedValue({ id: 'w1', status: 'active', endDate: new Date(Date.now() + 86400000) });

      const result = await service.claim(ctx, 'w1', { claimCost: 150, claimNotes: 'Peça com defeito recorrente' });

      expect(result.status).toBe('claimed');
      expect(result.claimCost).toBe(150);
    });
  });
});
