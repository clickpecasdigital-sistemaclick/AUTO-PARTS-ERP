import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OpportunitiesService } from '../opportunities.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('OpportunitiesService — Pipeline', () => {
  let service: OpportunitiesService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };
  const opportunity = { id: 'opp-1', tenantId: 'tenant-1', pipelineStageId: 'stage-1' };

  beforeEach(async () => {
    prisma = {
      crmOpportunity: {
        findFirst: jest.fn().mockResolvedValue(opportunity),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...opportunity, ...data })),
        create: jest.fn(),
      },
      crmPipelineStage: { findFirst: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [OpportunitiesService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = moduleRef.get(OpportunitiesService);
  });

  it('move a oportunidade para a nova etapa sem fechar quando a etapa não é ganha nem perdida', async () => {
    prisma.crmPipelineStage.findFirst.mockResolvedValue({ id: 'stage-2', isWon: false, isLost: false });

    const result = await service.moveStage(ctx, 'opp-1', 'stage-2');

    expect(result.pipelineStageId).toBe('stage-2');
    expect(prisma.crmOpportunity.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ closedAt: null }) }));
  });

  it('fecha a oportunidade (closedAt) ao mover para uma etapa marcada como Ganha', async () => {
    prisma.crmPipelineStage.findFirst.mockResolvedValue({ id: 'stage-won', isWon: true, isLost: false });

    await service.moveStage(ctx, 'opp-1', 'stage-won');

    expect(prisma.crmOpportunity.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ closedAt: expect.any(Date) }) }));
  });

  it('fecha a oportunidade ao mover para uma etapa marcada como Perdida', async () => {
    prisma.crmPipelineStage.findFirst.mockResolvedValue({ id: 'stage-lost', isWon: false, isLost: true });

    await service.moveStage(ctx, 'opp-1', 'stage-lost');

    expect(prisma.crmOpportunity.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ closedAt: expect.any(Date) }) }));
  });

  it('lança NotFoundException para etapa inexistente', async () => {
    prisma.crmPipelineStage.findFirst.mockResolvedValue(null);
    await expect(service.moveStage(ctx, 'opp-1', 'stage-inexistente')).rejects.toBeInstanceOf(NotFoundException);
  });
});
