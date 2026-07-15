import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PdvCheckoutService } from '../pdv-checkout.service';
import { StockService } from '@/modules/inventory/stock.service';
import { AuditService } from '@/common/audit/audit.service';
import { PrismaService } from '@/database/prisma/prisma.service';

describe('PdvCheckoutService — integração', () => {
  let service: PdvCheckoutService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let stockService: jest.Mocked<StockService>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };
  const baseCart = {
    id: 'sale-1',
    tenantId: 'tenant-1',
    status: 'open',
    mode: 'balcony',
    code: 'PDV-00000001',
    customerId: 'customer-1',
    salespersonId: null,
    branchId: 'branch-1',
    warehouseId: 'wh-1',
    totalAmount: 200,
    items: [{ productId: 'p1', quantity: 2, unitCost: 60 }],
  };

  beforeEach(async () => {
    prisma = {
      sale: { findFirst: jest.fn().mockResolvedValue(baseCart), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...baseCart, ...data })) },
      paymentMethod: { findMany: jest.fn().mockResolvedValue([{ id: 'pm-cash', kind: 'cash' }]) },
      salePayment: { create: jest.fn() },
      accountsReceivable: { create: jest.fn() },
      commission: { create: jest.fn() },
      salesperson: { findUnique: jest.fn() },
      branch: { findUnique: jest.fn().mockResolvedValue({ companyId: 'company-1' }) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PdvCheckoutService,
        { provide: PrismaService, useValue: prisma },
        { provide: StockService, useValue: { move: jest.fn().mockResolvedValue({}) } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(PdvCheckoutService);
    stockService = moduleRef.get(StockService);
  });

  it('rejeita checkout quando o pagamento não cobre o total da venda', async () => {
    await expect(service.checkout(ctx, 'sale-1', { payments: [{ paymentMethodId: 'pm-cash', amount: 50 }] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('baixa o estoque (sale_out) de cada item ao finalizar uma venda balcão', async () => {
    await service.checkout(ctx, 'sale-1', { payments: [{ paymentMethodId: 'pm-cash', amount: 200 }] });

    expect(stockService.move).toHaveBeenCalledWith(ctx, expect.objectContaining({ type: 'sale_out', productId: 'p1', quantity: 2, warehouseId: 'wh-1' }));
  });

  it('NÃO baixa estoque para Venda Futura (mode: future_sale)', async () => {
    prisma.sale.findFirst.mockResolvedValue({ ...baseCart, mode: 'future_sale' });

    await service.checkout(ctx, 'sale-1', { payments: [{ paymentMethodId: 'pm-cash', amount: 200 }] });

    expect(stockService.move).not.toHaveBeenCalled();
  });

  it('gera AccountsReceivable quando o pagamento é a prazo (crediário/boleto)', async () => {
    prisma.paymentMethod.findMany.mockResolvedValue([{ id: 'pm-credit', kind: 'in_house_installment' }]);

    await service.checkout(ctx, 'sale-1', { payments: [{ paymentMethodId: 'pm-credit', amount: 200, installments: 2 }] });

    expect(prisma.accountsReceivable.create).toHaveBeenCalledTimes(2); // 2 parcelas
  });

  it('NÃO gera AccountsReceivable para pagamento em dinheiro (à vista)', async () => {
    await service.checkout(ctx, 'sale-1', { payments: [{ paymentMethodId: 'pm-cash', amount: 200 }] });
    expect(prisma.accountsReceivable.create).not.toHaveBeenCalled();
  });

  it('gera comissão para o vendedor quando a venda tem salespersonId', async () => {
    prisma.sale.findFirst.mockResolvedValue({ ...baseCart, salespersonId: 'sp-1' });
    prisma.salesperson.findUnique.mockResolvedValue({ id: 'sp-1', commissionRate: 5 });

    await service.checkout(ctx, 'sale-1', { payments: [{ paymentMethodId: 'pm-cash', amount: 200 }] });

    expect(prisma.commission.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ salespersonId: 'sp-1', baseAmount: 200, rate: 5, amount: 10 }) })); // 5% de 200
  });

  it('aceita pagamento com tolerância de 1 centavo e marca status paid', async () => {
    await service.checkout(ctx, 'sale-1', { payments: [{ paymentMethodId: 'pm-cash', amount: 199.999 }] });
    expect(prisma.sale.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'paid' }) }));
  });
});
