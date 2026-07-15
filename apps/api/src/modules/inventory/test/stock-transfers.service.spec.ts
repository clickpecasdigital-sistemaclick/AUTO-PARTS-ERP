import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StockTransfersService } from '../stock-transfers.service';
import { StockService } from '../stock.service';
import { AuditService } from '@/common/audit/audit.service';
import { PrismaService } from '@/database/prisma/prisma.service';

describe('StockTransfersService (integração do fluxo create → ship → receive)', () => {
  let service: StockTransfersService;
  let prisma: { stockTransfer: Record<string, jest.Mock> };
  let stockService: jest.Mocked<StockService>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };
  const transferRecord = {
    id: 'transfer-1',
    tenantId: 'tenant-1',
    status: 'pending',
    originWarehouseId: 'wh-origin',
    destinationWarehouseId: 'wh-dest',
    reason: 'Reabastecimento entre filiais',
    items: [{ productId: 'p1', quantity: 10, originLocationId: null, destinationLocationId: null }],
  };

  beforeEach(async () => {
    prisma = {
      stockTransfer: {
        create: jest.fn().mockResolvedValue(transferRecord),
        findFirst: jest.fn().mockResolvedValue(transferRecord),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...transferRecord, ...data })),
      },
    } as never;

    const moduleRef = await Test.createTestingModule({
      providers: [
        StockTransfersService,
        { provide: PrismaService, useValue: prisma },
        { provide: StockService, useValue: { move: jest.fn().mockResolvedValue({}) } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(StockTransfersService);
    stockService = moduleRef.get(StockService);
  });

  it('rejeita transferência com origem e destino iguais', async () => {
    await expect(
      service.create(ctx, { originWarehouseId: 'wh-1', destinationWarehouseId: 'wh-1', items: [{ productId: 'p1', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ship() gera StockMovement transfer_out na origem e atualiza status para in_transit', async () => {
    await service.ship(ctx, 'transfer-1');

    expect(stockService.move).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({ type: 'transfer_out', warehouseId: 'wh-origin', productId: 'p1', quantity: 10 }),
    );
    expect(prisma.stockTransfer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'in_transit' }) }),
    );
  });

  it('receive() gera StockMovement transfer_in no destino e atualiza status para received', async () => {
    prisma.stockTransfer.findFirst.mockResolvedValue({ ...transferRecord, status: 'in_transit' });

    await service.receive(ctx, 'transfer-1');

    expect(stockService.move).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({ type: 'transfer_in', warehouseId: 'wh-dest', productId: 'p1', quantity: 10 }),
    );
    expect(prisma.stockTransfer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'received' }) }),
    );
  });

  it('não permite expedir uma transferência que não está pendente', async () => {
    prisma.stockTransfer.findFirst.mockResolvedValue({ ...transferRecord, status: 'received' });
    await expect(service.ship(ctx, 'transfer-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
