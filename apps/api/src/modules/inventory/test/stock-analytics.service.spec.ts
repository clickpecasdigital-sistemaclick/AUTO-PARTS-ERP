import { Test } from '@nestjs/testing';
import { StockAnalyticsService } from '../stock-analytics.service';
import { StockRepository } from '../stock.repository';
import { PrismaService } from '@/database/prisma/prisma.service';

function buildStock(id: string, qty: number, cost: number) {
  return {
    productId: id,
    quantityOnHand: qty,
    quantityReserved: 0,
    product: { id, internalCode: id, shortDescription: id, minStock: 0, maxStock: null, averageCostPrice: cost, salePrice: cost * 2, groupId: null, manufacturerId: null },
    warehouse: { id: 'w1', name: 'Principal' },
  };
}

describe('StockAnalyticsService — Curva ABC', () => {
  let service: StockAnalyticsService;
  let repository: jest.Mocked<StockRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StockAnalyticsService,
        { provide: PrismaService, useValue: {} },
        { provide: StockRepository, useValue: { listStockSnapshot: jest.fn(), movementsAggregateByProduct: jest.fn(), lastMovementDateByProduct: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(StockAnalyticsService);
    repository = moduleRef.get(StockRepository);
  });

  it('classifica corretamente A (até 80% acumulado), B (até 95%) e C (restante) por valor', async () => {
    // valores em estoque desenhados para um corte de Pareto bem definido:
    // produto A concentra 80% do valor total isoladamente.
    repository.listStockSnapshot.mockResolvedValue([
      buildStock('A', 1, 800), // valor 800 -> 80% do total (1000)
      buildStock('B', 1, 150), // valor 150 -> 15% (acumulado 95%)
      buildStock('C', 1, 50), // valor 50 -> 5% (acumulado 100%)
    ] as never);

    const result = await service.getAbcCurve('tenant-1', 'value');

    expect(result.find((r) => r.productId === 'A')?.class).toBe('A');
    expect(result.find((r) => r.productId === 'B')?.class).toBe('B');
    expect(result.find((r) => r.productId === 'C')?.class).toBe('C');
  });

  it('ordena do maior para o menor valor antes de calcular o acumulado', async () => {
    repository.listStockSnapshot.mockResolvedValue([
      buildStock('low', 1, 10),
      buildStock('high', 1, 990),
    ] as never);

    const result = await service.getAbcCurve('tenant-1', 'value');

    expect(result[0].productId).toBe('high');
    expect(result[0].class).toBe('A');
  });

  it('ignora produtos com valor zero no critério escolhido', async () => {
    repository.listStockSnapshot.mockResolvedValue([buildStock('zero', 0, 100), buildStock('nonzero', 5, 100)] as never);

    const result = await service.getAbcCurve('tenant-1', 'value');

    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('nonzero');
  });
});
