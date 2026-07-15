import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StockService } from '../stock.service';
import { StockRepository } from '../stock.repository';
import { AuditService } from '@/common/audit/audit.service';

describe('StockService', () => {
  let service: StockService;
  let repository: jest.Mocked<StockRepository>;
  let audit: jest.Mocked<AuditService>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: StockRepository,
          useValue: {
            getStockBalance: jest.fn(),
            createMovementAndUpdateBalance: jest.fn(),
            findMovements: jest.fn(),
          },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(StockService);
    repository = moduleRef.get(StockRepository);
    audit = moduleRef.get(AuditService);
  });

  describe('move — validações de negócio', () => {
    it('exige `reason` para movimentações do tipo ajuste/perda/quebra/consumo interno', async () => {
      await expect(
        service.move(ctx, { productId: 'p1', warehouseId: 'w1', type: 'loss_out' as never, quantity: 5 }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.createMovementAndUpdateBalance).not.toHaveBeenCalled();
    });

    it('aceita ajuste/perda quando `reason` é informado', async () => {
      repository.getStockBalance.mockResolvedValue({ quantityOnHand: 10, quantityReserved: 0 } as never);
      repository.createMovementAndUpdateBalance.mockResolvedValue({ movement: { id: 'm1' }, stock: {} } as never);

      await service.move(ctx, { productId: 'p1', warehouseId: 'w1', type: 'loss_out' as never, quantity: 5, reason: 'Avaria no transporte' });

      expect(repository.createMovementAndUpdateBalance).toHaveBeenCalled();
    });

    it('bloqueia saída quando o saldo disponível (onHand - reserved) é insuficiente', async () => {
      repository.getStockBalance.mockResolvedValue({ quantityOnHand: 10, quantityReserved: 8 } as never);

      await expect(
        service.move(ctx, { productId: 'p1', warehouseId: 'w1', type: 'sale_out' as never, quantity: 5 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('permite saída quando o saldo disponível é suficiente, considerando reservas', async () => {
      repository.getStockBalance.mockResolvedValue({ quantityOnHand: 10, quantityReserved: 2 } as never);
      repository.createMovementAndUpdateBalance.mockResolvedValue({ movement: { id: 'm2' }, stock: {} } as never);

      await service.move(ctx, { productId: 'p1', warehouseId: 'w1', type: 'sale_out' as never, quantity: 5 });

      expect(repository.createMovementAndUpdateBalance).toHaveBeenCalled();
    });

    it('não exige saldo para movimentações de entrada', async () => {
      repository.createMovementAndUpdateBalance.mockResolvedValue({ movement: { id: 'm3' }, stock: {} } as never);

      await service.move(ctx, { productId: 'p1', warehouseId: 'w1', type: 'purchase_in' as never, quantity: 100 });

      expect(repository.getStockBalance).not.toHaveBeenCalled();
      expect(repository.createMovementAndUpdateBalance).toHaveBeenCalled();
    });

    it('registra auditoria do tipo stock_adjustment em toda movimentação', async () => {
      repository.createMovementAndUpdateBalance.mockResolvedValue({ movement: { id: 'm4' }, stock: {} } as never);

      await service.move(ctx, { productId: 'p1', warehouseId: 'w1', type: 'purchase_in' as never, quantity: 10 });

      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'stock_adjustment', entity: 'StockMovement' }));
    });
  });
});
