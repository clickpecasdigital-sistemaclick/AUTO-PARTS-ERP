import { Test } from '@nestjs/testing';
import { KpiService } from '../kpi/kpi.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AlertsEngineService } from '../bi-engine.service';

// ---- KPI -------------------------------------------------------------------

describe('KpiService', () => {
  let service: KpiService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const range = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

  beforeEach(async () => {
    prisma = {
      factSale: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { grossRevenue: 10000, netRevenue: 9000, grossProfit: 3000, discountAmount: 1000, quantity: 100 }, _count: { saleId: 50 } }),
        groupBy: jest.fn().mockResolvedValue([{ dateKey: 20260110, _sum: { netRevenue: 9000 } }]),
        findMany: jest.fn().mockResolvedValue([{ productId: 'p1', customerId: 'c1', salespersonId: 's1', netRevenue: 9000, quantity: 100, saleId: 'sale-1' }]),
      },
      product: { findMany: jest.fn().mockResolvedValue([{ id: 'p1', shortDescription: 'Filtro de Óleo' }]) },
      customer: { findMany: jest.fn().mockResolvedValue([{ id: 'c1', name: 'Auto Center', tradeName: 'Auto Center' }]) },
      factFinancial: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 5000, paidAmount: 4000 } }),
      },
      factWorkshop: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 3000, durationHours: 20, isRework: 2 }, _count: { serviceOrderId: 10 }, _avg: { npsScore: 8.5 } }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      mechanic: { findMany: jest.fn().mockResolvedValue([]) },
      factStock: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalValue: 50000 }, _count: { productId: 200 } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      stock: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const moduleRef = await Test.createTestingModule({ providers: [KpiService, { provide: PrismaService, useValue: prisma }] }).compile();
    service = moduleRef.get(KpiService);
  });

  describe('getSalesKpis', () => {
    it('calcula receita, margem e ticket corretamente', async () => {
      const result = await service.getSalesKpis('tenant-1', range);

      expect(result.netRevenue).toBe(9000);
      expect(result.grossProfit).toBe(3000);
      expect(result.totalOrders).toBe(1); // 1 saleId único no mock
      expect(result.averageTicket).toBe(9000); // 9000 / 1 pedido
    });

    it('retorna top produtos e top clientes', async () => {
      const result = await service.getSalesKpis('tenant-1', range);

      expect(result.topProducts).toHaveLength(1);
      expect(result.topProducts[0].name).toBe('Filtro de Óleo');
      expect(result.topCustomers[0].name).toBe('Auto Center');
    });
  });

  describe('getAbcCurve', () => {
    it('classifica produto como A quando representa 100% da receita', async () => {
      prisma.factSale.groupBy.mockResolvedValue([{ productId: 'p1', _sum: { netRevenue: 9000 } }]);
      prisma.product.findMany.mockResolvedValue([{ id: 'p1', shortDescription: 'Filtro de Óleo' }]);

      const result = await service.getAbcCurve('tenant-1', range);

      expect(result).toHaveLength(1);
      expect(result[0].tier).toBe('A');
      expect(result[0].pct).toBeCloseTo(1.0);
    });

    it('retorna lista vazia quando não há vendas', async () => {
      prisma.factSale.groupBy.mockResolvedValue([]);
      const result = await service.getAbcCurve('tenant-1', range);
      expect(result).toHaveLength(0);
    });
  });

  describe('getWorkshopKpis', () => {
    it('calcula taxa de retrabalho e NPS corretamente', async () => {
      const result = await service.getWorkshopKpis('tenant-1', range);

      expect(result.totalOrders).toBe(10);
      expect(result.reworkRate).toBeCloseTo(0.2); // 2 / 10
      expect(result.npsScore).toBe(8.5);
    });
  });
});

// ---- ALERTAS ---------------------------------------------------------------

describe('AlertsEngineService', () => {
  let service: AlertsEngineService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      alert: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'alert-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ id: 'alert-1' }),
        count: jest.fn().mockResolvedValue(3),
      },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      accountsReceivable: { findMany: jest.fn().mockResolvedValue([]) },
      fiscalCertificate: { findMany: jest.fn().mockResolvedValue([]) },
      fiscalInvoice: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const moduleRef = await Test.createTestingModule({ providers: [AlertsEngineService, { provide: PrismaService, useValue: prisma }] }).compile();
    service = moduleRef.get(AlertsEngineService);
  });

  it('não cria alerta duplicado quando já existe um ativo', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', shortDescription: 'Produto X', internalCode: 'P001' }]);
    prisma.alert.findFirst.mockResolvedValue({ id: 'existing', status: 'active' });

    const result = await service.checkStockBelowMinimum('tenant-1');

    expect(prisma.alert.create).not.toHaveBeenCalled();
    expect(result.alertsCreated).toBe(0);
  });

  it('cria alerta de estoque zerado quando não há alerta ativo', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', shortDescription: 'Produto X', internalCode: 'P001' }]);
    prisma.alert.findFirst.mockResolvedValue(null);

    const result = await service.checkStockBelowMinimum('tenant-1');

    expect(prisma.alert.create).toHaveBeenCalledTimes(1);
    expect(result.alertsCreated).toBe(1);
  });

  it('retorna contagem de alertas ativos', async () => {
    const count = await service.getUnreadCount('tenant-1');
    expect(count).toBe(3);
  });
});

// ---- ETL -------------------------------------------------------------------

describe('EtlService — toDateKey', () => {
  it('converte data para chave YYYYMMDD corretamente', () => {
    // Import inline para testar a função pura
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toDateKey } = require('../etl/etl.service');
    expect(toDateKey(new Date('2026-07-01'))).toBe(20260701);
    expect(toDateKey(new Date('2026-01-09'))).toBe(20260109);
    expect(toDateKey(new Date('2026-12-31'))).toBe(20261231);
  });
});
