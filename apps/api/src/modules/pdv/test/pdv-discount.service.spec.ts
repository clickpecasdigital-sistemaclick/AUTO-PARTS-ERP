import { Test } from '@nestjs/testing';
import { PdvDiscountService } from '../pdv-discount.service';
import { PrismaService } from '@/database/prisma/prisma.service';

describe('PdvDiscountService', () => {
  let service: PdvDiscountService;
  let prisma: { discountRule: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { discountRule: { findMany: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [PdvDiscountService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PdvDiscountService);
  });

  it('permite até 100% quando nenhuma regra está configurada (sem restrição por padrão)', async () => {
    prisma.discountRule.findMany.mockResolvedValue([]);
    const result = await service.check({ tenantId: 'tenant-1', userId: 'user-1' });
    expect(result.maxPercent).toBe(100);
  });

  it('aplica o limite MAIS RESTRITIVO entre as regras de perfil e de produto', async () => {
    prisma.discountRule.findMany.mockResolvedValue([
      { scope: 'profile', maxDiscountPercent: 15, requiresApprovalAbovePercent: null },
      { scope: 'product', maxDiscountPercent: 5, requiresApprovalAbovePercent: null },
    ]);

    const result = await service.check({ tenantId: 'tenant-1', userId: 'user-1', productId: 'p1' });

    expect(result.maxPercent).toBe(5);
  });

  it('marca requiresApproval quando o limite mais restritivo está dentro do threshold de aprovação', async () => {
    prisma.discountRule.findMany.mockResolvedValue([{ scope: 'user', maxDiscountPercent: 20, requiresApprovalAbovePercent: 10 }]);

    const result = await service.check({ tenantId: 'tenant-1', userId: 'user-1' });

    expect(result.requiresApproval).toBe(true);
  });

  it('não exige aprovação quando nenhuma regra define requiresApprovalAbovePercent', async () => {
    prisma.discountRule.findMany.mockResolvedValue([{ scope: 'user', maxDiscountPercent: 20, requiresApprovalAbovePercent: null }]);

    const result = await service.check({ tenantId: 'tenant-1', userId: 'user-1' });

    expect(result.requiresApproval).toBe(false);
  });
});
