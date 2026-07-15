import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CostCentersService } from '../chart-cost-center-commission.service';
import { PrismaService } from '@/database/prisma/prisma.service';

describe('CostCentersService — Rateio', () => {
  let service: CostCentersService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      accountsPayable: { findUnique: jest.fn().mockResolvedValue({ id: 'pay-1', amount: 1000 }) },
      accountsReceivable: { findUnique: jest.fn() },
      costCenterAllocation: { deleteMany: jest.fn(), create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)) },
      costCenter: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CostCentersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CostCentersService);
  });

  it('rejeita rateio cuja soma de percentuais não fecha 100%', async () => {
    await expect(
      service.allocate('tenant-1', { payableId: 'pay-1' }, [
        { costCenterId: 'cc-1', percent: 50 },
        { costCenterId: 'cc-2', percent: 30 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aceita rateio cuja soma fecha exatamente 100%', async () => {
    const result = await service.allocate('tenant-1', { payableId: 'pay-1' }, [
      { costCenterId: 'cc-1', percent: 60 },
      { costCenterId: 'cc-2', percent: 40 },
    ]);
    expect(result).toHaveLength(2);
  });

  it('calcula o valor de cada linha como percent% do valor do título', async () => {
    const result = await service.allocate('tenant-1', { payableId: 'pay-1' }, [
      { costCenterId: 'cc-1', percent: 70 },
      { costCenterId: 'cc-2', percent: 30 },
    ]);

    expect(result[0]).toEqual(expect.objectContaining({ percent: 70, amount: 700 }));
    expect(result[1]).toEqual(expect.objectContaining({ percent: 30, amount: 300 }));
  });

  it('tolera pequenos arredondamentos (99.99% ou 100.01%) sem rejeitar', async () => {
    await expect(
      service.allocate('tenant-1', { payableId: 'pay-1' }, [
        { costCenterId: 'cc-1', percent: 33.33 },
        { costCenterId: 'cc-2', percent: 33.33 },
        { costCenterId: 'cc-3', percent: 33.34 },
      ]),
    ).resolves.toHaveLength(3);
  });

  it('remove rateios anteriores do mesmo título antes de criar os novos', async () => {
    await service.allocate('tenant-1', { payableId: 'pay-1' }, [{ costCenterId: 'cc-1', percent: 100 }]);
    expect(prisma.costCenterAllocation.deleteMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1', payableId: 'pay-1' } });
  });
});
