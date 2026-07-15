import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GoodsReceiptsService } from '../goods-receipts.service';
import { StockService } from '@/modules/inventory/stock.service';
import { AuditService } from '@/common/audit/audit.service';
import { PrismaService } from '@/database/prisma/prisma.service';

describe('GoodsReceiptsService — conferência e finalização', () => {
  let service: GoodsReceiptsService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let stockService: jest.Mocked<StockService>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  const receiptRecord = {
    id: 'receipt-1',
    tenantId: 'tenant-1',
    status: 'pending',
    warehouseId: 'wh-1',
    purchaseOrderId: 'order-1',
    code: 'REC-000001',
    items: [
      { id: 'item-1', purchaseOrderItemId: 'poi-1', productId: 'p1', quantity: 10, unitCost: 5, acceptedQuantity: 10, rejectedQuantity: 0, disposition: 'accepted' },
    ],
    purchaseOrder: { branch: { companyId: 'company-1' } },
  };

  beforeEach(async () => {
    prisma = {
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue({ id: 'order-1', status: 'sent', items: [{ id: 'poi-1', productId: 'p1', quantity: 10, receivedQuantity: 0, unitCost: 5 }] }),
        findUnique: jest.fn().mockResolvedValue({ id: 'order-1', supplierId: 'supplier-1', code: 'PC-000001', items: [{ quantity: 10, receivedQuantity: 10 }] }),
        update: jest.fn(),
      },
      goodsReceipt: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'receipt-1', items: [] }),
        findFirst: jest.fn().mockResolvedValue(receiptRecord),
        update: jest.fn().mockResolvedValue({ id: 'receipt-1', status: 'confirmed' }),
      },
      goodsReceiptItem: { findFirst: jest.fn(), update: jest.fn() },
      purchaseOrderItem: { update: jest.fn() },
      accountsPayable: { create: jest.fn().mockResolvedValue({ id: 'ap-1' }) },
      product: { findFirst: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GoodsReceiptsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StockService, useValue: { move: jest.fn().mockResolvedValue({}) } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(GoodsReceiptsService);
    stockService = moduleRef.get(StockService);
  });

  it('finalize() chama StockService.move com tipo purchase_in para cada item aceito', async () => {
    await service.finalize(ctx, 'receipt-1');

    expect(stockService.move).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({ type: 'purchase_in', productId: 'p1', quantity: 10, unitCost: 5, warehouseId: 'wh-1' }),
    );
  });

  it('finalize() gera AccountsPayable com o valor total dos itens aceitos', async () => {
    await service.finalize(ctx, 'receipt-1');

    expect(prisma.accountsPayable.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ purchaseOrderId: 'order-1', amount: 50 }) }), // 10 unidades x 5 = 50
    );
  });

  it('finalize() rejeita recebimento já confirmado', async () => {
    prisma.goodsReceipt.findFirst.mockResolvedValue({ ...receiptRecord, status: 'confirmed' });
    await expect(service.finalize(ctx, 'receipt-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finalize() rejeita quando nenhum item foi conferido ainda (todos pending)', async () => {
    prisma.goodsReceipt.findFirst.mockResolvedValue({ ...receiptRecord, items: [{ ...receiptRecord.items[0], disposition: 'pending' }] });
    await expect(service.finalize(ctx, 'receipt-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('conferItem() rejeita quando a soma aceito+recusado excede a quantidade recebida', async () => {
    prisma.goodsReceiptItem.findFirst.mockResolvedValue({ id: 'item-1', quantity: 10, goodsReceiptId: 'receipt-1' });

    await expect(
      service.conferItem(ctx, 'receipt-1', { goodsReceiptItemId: 'item-1', acceptedQuantity: 8, rejectedQuantity: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('conferItem() marca disposition "accepted" quando tudo foi aceito', async () => {
    prisma.goodsReceiptItem.findFirst.mockResolvedValue({ id: 'item-1', quantity: 10, goodsReceiptId: 'receipt-1' });
    prisma.goodsReceiptItem.update.mockImplementation(({ data }) => Promise.resolve(data));

    const result = await service.conferItem(ctx, 'receipt-1', { goodsReceiptItemId: 'item-1', acceptedQuantity: 10, rejectedQuantity: 0 });

    expect(result.disposition).toBe('accepted');
  });
});
