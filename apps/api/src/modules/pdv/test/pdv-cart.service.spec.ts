import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PdvCartService } from '../pdv-cart.service';
import { PdvCartRepository } from '../pdv-cart.repository';
import { PdvDiscountService } from '../pdv-discount.service';
import { StockRepository } from '@/modules/inventory/stock.repository';
import { AuditService } from '@/common/audit/audit.service';
import { PrismaService } from '@/database/prisma/prisma.service';

describe('PdvCartService', () => {
  let service: PdvCartService;
  let repository: jest.Mocked<PdvCartRepository>;
  let discountService: jest.Mocked<PdvDiscountService>;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };
  const openCart = { id: 'sale-1', tenantId: 'tenant-1', status: 'open', customerId: 'customer-1', subtotalAmount: 1000, discountAmount: 0 };

  beforeEach(async () => {
    prisma = {
      branch: { findUnique: jest.fn().mockResolvedValue({ companyId: 'company-1' }) },
      customer: { findFirst: jest.fn().mockResolvedValue({ id: 'customer-1' }), create: jest.fn() },
      product: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', salePrice: 100, averageCostPrice: 60 }) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PdvCartService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: PdvCartRepository,
          useValue: {
            countByTenant: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({ id: 'sale-1', code: 'PDV-00000001' }),
            findById: jest.fn().mockResolvedValue(openCart),
            addItem: jest.fn().mockResolvedValue({ id: 'item-1' }),
            updateItem: jest.fn(),
            removeItem: jest.fn(),
            findItem: jest.fn(),
            recalculateTotals: jest.fn().mockResolvedValue({ id: 'sale-1', totalAmount: 1000 }),
            update: jest.fn(),
          },
        },
        { provide: PdvDiscountService, useValue: { check: jest.fn().mockResolvedValue({ allowed: true, maxPercent: 100, requiresApproval: false }) } },
        { provide: StockRepository, useValue: { getStockBalance: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(PdvCartService);
    repository = moduleRef.get(PdvCartRepository);
    discountService = moduleRef.get(PdvDiscountService);
  });

  describe('openCart', () => {
    it('rejeita Venda Oficina sem veículo vinculado', async () => {
      await expect(service.openCart(ctx, 'branch-1', { mode: 'workshop' as never, warehouseId: 'wh-1' })).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('aceita Venda Oficina quando o veículo é informado', async () => {
      await service.openCart(ctx, 'branch-1', { mode: 'workshop' as never, warehouseId: 'wh-1', customerVehicleId: 'vehicle-1' });
      expect(repository.create).toHaveBeenCalled();
    });

    it('usa o Consumidor Final quando nenhum cliente é informado (venda balcão rápida)', async () => {
      await service.openCart(ctx, 'branch-1', { mode: 'balcony' as never, warehouseId: 'wh-1' });
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'customer-1' }));
    });
  });

  describe('addItem', () => {
    it('usa o preço de tabela do produto quando unitPrice não é informado', async () => {
      await service.addItem(ctx, 'sale-1', { productId: 'p1', quantity: 2 });
      expect(repository.addItem).toHaveBeenCalledWith(expect.objectContaining({ unitPrice: 100, unitCost: 60 }));
    });

    it('rejeita desconto acima do limite permitido pela regra mais restritiva', async () => {
      discountService.check.mockResolvedValue({ allowed: true, maxPercent: 10, requiresApproval: false });

      await expect(service.addItem(ctx, 'sale-1', { productId: 'p1', quantity: 1, discountPercent: 50 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('permite desconto dentro do limite', async () => {
      discountService.check.mockResolvedValue({ allowed: true, maxPercent: 10, requiresApproval: false });

      await service.addItem(ctx, 'sale-1', { productId: 'p1', quantity: 1, discountPercent: 5 });
      expect(repository.addItem).toHaveBeenCalled();
    });

    it('rejeita inclusão de item em venda já finalizada', async () => {
      repository.findById.mockResolvedValue({ ...openCart, status: 'paid' } as never);
      await expect(service.addItem(ctx, 'sale-1', { productId: 'p1', quantity: 1 })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('setDiscount', () => {
    it('rejeita desconto de venda acima do limite percentual', async () => {
      discountService.check.mockResolvedValue({ allowed: true, maxPercent: 5, requiresApproval: false });
      await expect(service.setDiscount(ctx, 'sale-1', { discountAmount: 500 })).rejects.toBeInstanceOf(BadRequestException); // 50% sobre subtotal de 1000
    });
  });
});
