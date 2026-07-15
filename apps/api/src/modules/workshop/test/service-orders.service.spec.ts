import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ServiceOrdersService } from '../service-orders.service';
import { ServiceOrdersRepository } from '../service-orders.repository';
import { StockService } from '@/modules/inventory/stock.service';
import { StockRepository } from '@/modules/inventory/stock.repository';
import { AuditService } from '@/common/audit/audit.service';
import { PrismaService } from '@/database/prisma/prisma.service';

describe('ServiceOrdersService', () => {
  let service: ServiceOrdersService;
  let repository: jest.Mocked<ServiceOrdersRepository>;
  let stockService: jest.Mocked<StockService>;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };
  const baseOrder = { id: 'os-1', tenantId: 'tenant-1', code: 'OS-000001', status: 'open', customerId: 'c1', vehicleId: 'v1', mechanicId: 'm1', parts: [] as { productId: string; quantity: unknown; unitPrice: unknown }[] };

  beforeEach(async () => {
    prisma = {
      service: { findFirst: jest.fn() },
      serviceOrderService: { create: jest.fn(), delete: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      serviceOrderPart: { create: jest.fn(), delete: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      serviceOrder: { findUnique: jest.fn().mockResolvedValue({ discountAmount: 0 }), update: jest.fn() },
      product: { findFirst: jest.fn() },
      workshopAppointment: { update: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ServiceOrdersService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ServiceOrdersRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue(baseOrder),
            findMany: jest.fn(),
            create: jest.fn().mockResolvedValue(baseOrder),
            update: jest.fn().mockImplementation((id, data) => Promise.resolve({ ...baseOrder, ...data })),
            countByTenant: jest.fn().mockResolvedValue(0),
            recordStatusChange: jest.fn(),
          },
        },
        { provide: StockService, useValue: { move: jest.fn().mockResolvedValue({}) } },
        { provide: StockRepository, useValue: { getStockBalance: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(ServiceOrdersService);
    repository = moduleRef.get(ServiceOrdersRepository);
    stockService = moduleRef.get(StockService);
  });

  describe('transitionStatus — fluxo de status', () => {
    it('permite a transição open -> diagnosing', async () => {
      const result = await service.transitionStatus(ctx, 'os-1', 'diagnosing');
      expect(result.status).toBe('diagnosing');
    });

    it('rejeita pular etapas (open -> in_progress diretamente)', async () => {
      await expect(service.transitionStatus(ctx, 'os-1', 'in_progress')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita transição a partir de um status terminal (delivered)', async () => {
      repository.findById.mockResolvedValue({ ...baseOrder, status: 'delivered' } as never);
      await expect(service.transitionStatus(ctx, 'os-1', 'in_progress')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('registra approvedAt ao transicionar para approved', async () => {
      repository.findById.mockResolvedValue({ ...baseOrder, status: 'awaiting_approval' } as never);
      const result = await service.transitionStatus(ctx, 'os-1', 'approved');
      expect(repository.update).toHaveBeenCalledWith('os-1', expect.objectContaining({ status: 'approved', approvedAt: expect.any(Date) }));
      expect(result.status).toBe('approved');
    });

    it('registra o histórico de mudança de status', async () => {
      await service.transitionStatus(ctx, 'os-1', 'diagnosing');
      expect(repository.recordStatusChange).toHaveBeenCalledWith('tenant-1', 'os-1', 'open', 'diagnosing', 'user-1', undefined);
    });
  });

  describe('cancel', () => {
    it('rejeita cancelamento de OS já entregue', async () => {
      repository.findById.mockResolvedValue({ ...baseOrder, status: 'delivered' } as never);
      await expect(service.cancel(ctx, 'os-1', 'engano')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cancela uma OS em aberto normalmente', async () => {
      const result = await service.cancel(ctx, 'os-1', 'cliente desistiu');
      expect(result.status).toBe('cancelled');
    });
  });

  describe('confirmPartsConsumption — controle de peças', () => {
    it('move o estoque (service_order_out) para cada peça da OS', async () => {
      repository.findById.mockResolvedValue({ ...baseOrder, parts: [{ productId: 'p1', quantity: 2, unitPrice: 50 }] } as never);

      await service.confirmPartsConsumption(ctx, 'os-1', 'wh-1');

      expect(stockService.move).toHaveBeenCalledWith(ctx, expect.objectContaining({ type: 'service_order_out', productId: 'p1', quantity: 2, warehouseId: 'wh-1' }));
    });

    it('não chama StockService quando a OS não tem peças', async () => {
      repository.findById.mockResolvedValue({ ...baseOrder, parts: [] } as never);
      const result = await service.confirmPartsConsumption(ctx, 'os-1', 'wh-1');
      expect(stockService.move).not.toHaveBeenCalled();
      expect(result.consumed).toBe(0);
    });
  });

  describe('createRework — índice de retrabalho', () => {
    it('cria uma nova OS ligada à original via reworkOfId, com prioridade alta', async () => {
      await service.createRework(ctx, 'branch-1', 'os-1', 'voltou com o mesmo problema');

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ reworkOfId: 'os-1', isRework: true, priority: 'high' }));
    });
  });

  describe('addServiceItem', () => {
    it('usa o preço padrão do catálogo quando unitPrice não é informado', async () => {
      prisma.service.findFirst.mockResolvedValue({ id: 'svc-1', standardPrice: 150 });
      prisma.serviceOrderService.create.mockResolvedValue({ id: 'item-1' });

      await service.addServiceItem(ctx, 'os-1', { serviceId: 'svc-1' });

      expect(prisma.serviceOrderService.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ unitPrice: 150 }) }));
    });
  });
});
