import { Test } from '@nestjs/testing';
import { PurchaseQuotationsService } from '../purchase-quotations.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('PurchaseQuotationsService — comparativo automático', () => {
  let service: PurchaseQuotationsService;
  let prisma: { purchaseQuotation: Record<string, jest.Mock>; purchaseOrder: Record<string, jest.Mock> };

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  function buildQuotationSupplier(id: string, unitPrice: number, freight: number, deliveryDays: number) {
    return {
      id,
      supplierId: `supplier-${id}`,
      supplier: { name: `Fornecedor ${id}`, tradeName: null },
      respondedAt: new Date(),
      freightAmount: freight,
      discountPercent: 0,
      deliveryDays,
      warrantyDays: 90,
      paymentTerms: '30 dias',
      items: [{ productId: 'p1', quantity: 10, unitPrice, ipiRate: 0, icmsRate: 0 }],
    };
  }

  beforeEach(async () => {
    prisma = {
      purchaseQuotation: { findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      purchaseOrder: { findMany: jest.fn().mockResolvedValue([]) },
    } as never;

    const moduleRef = await Test.createTestingModule({
      providers: [PurchaseQuotationsService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = moduleRef.get(PurchaseQuotationsService);
  });

  it('marca isBestOffer apenas na proposta de maior score (melhor combinação preço+prazo)', async () => {
    prisma.purchaseQuotation.findFirst.mockResolvedValue({
      id: 'q1',
      suppliers: [
        buildQuotationSupplier('A', 100, 20, 10), // mais caro, prazo médio
        buildQuotationSupplier('B', 80, 10, 5), // mais barato, prazo curto -> deve vencer
        buildQuotationSupplier('C', 90, 50, 20), // intermediário, frete alto, prazo longo
      ],
    });

    const result = await service.compare(ctx, 'q1');

    expect(result[0].quotationSupplierId).toBe('B');
    expect(result[0].isBestOffer).toBe(true);
    expect(result.filter((r) => r.isBestOffer)).toHaveLength(1);
  });

  it('ordena do maior para o menor score', async () => {
    prisma.purchaseQuotation.findFirst.mockResolvedValue({
      id: 'q1',
      suppliers: [buildQuotationSupplier('A', 200, 0, 30), buildQuotationSupplier('B', 50, 0, 2)],
    });

    const result = await service.compare(ctx, 'q1');

    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it('ignora fornecedores que ainda não responderam (sem respondedAt)', async () => {
    const notResponded = { ...buildQuotationSupplier('C', 10, 0, 1), respondedAt: null };
    prisma.purchaseQuotation.findFirst.mockResolvedValue({
      id: 'q1',
      suppliers: [buildQuotationSupplier('A', 100, 0, 5), notResponded],
    });

    const result = await service.compare(ctx, 'q1');

    expect(result).toHaveLength(1);
    expect(result[0].quotationSupplierId).toBe('A');
  });

  it('retorna array vazio quando nenhum fornecedor respondeu ainda', async () => {
    prisma.purchaseQuotation.findFirst.mockResolvedValue({ id: 'q1', suppliers: [{ ...buildQuotationSupplier('A', 1, 0, 1), respondedAt: null }] });

    const result = await service.compare(ctx, 'q1');

    expect(result).toEqual([]);
  });
});
