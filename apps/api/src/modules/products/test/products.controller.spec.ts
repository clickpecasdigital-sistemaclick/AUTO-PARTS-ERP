import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ProductsController } from '../products.controller';
import { ProductsService } from '../products.service';
import { ProductsImportExportService } from '../products-import-export.service';
import { ProductsRepository } from '../products.repository';
import { AuditService } from '@/common/audit/audit.service';
import { SupabaseStorageService } from '@/common/storage/supabase-storage.service';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Teste de integração (sem banco real): monta o módulo Nest de verdade —
 * Controller real, Service real — substituindo apenas a fronteira de
 * infraestrutura (Prisma/Storage). Verifica que o fluxo
 * Controller -> Service -> Repository está corretamente fiado pelo DI do
 * Nest, e que o `RequestContext` (tenantId/userId do usuário autenticado)
 * chega intacto até a camada de repositório.
 */
describe('ProductsController (integração)', () => {
  let controller: ProductsController;
  let prisma: { product: Record<string, jest.Mock> };

  const authenticatedUser = { id: 'user-1', email: 'user@autocore.dev', role: 'operator', tenantId: 'tenant-1' };
  const fakeRequest = { ip: '127.0.0.1', headers: { 'user-agent': 'jest' } } as never;

  beforeEach(async () => {
    prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'product-1', photos: [], ...data })),
      },
      $transaction: jest.fn((arg) => (Array.isArray(arg) ? Promise.all(arg) : arg())),
    } as never;

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        ProductsRepository,
        ProductsImportExportService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: SupabaseStorageService, useValue: { upload: jest.fn(), remove: jest.fn() } },
        Reflector,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(ProductsController);
  });

  it('cria um produto propagando o tenantId do usuário autenticado (nunca do payload)', async () => {
    prisma.product.findFirst.mockResolvedValueOnce(null); // sem conflito de código interno
    prisma.product.count.mockResolvedValueOnce(0);

    await controller.create(authenticatedUser as never, fakeRequest, {
      shortDescription: 'Filtro de óleo',
      unitId: 'unit-1',
      // @ts-expect-error tentativa deliberada de injetar tenantId pelo payload — deve ser ignorado
      tenantId: 'tenant-malicioso',
    });

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-1' }) }),
    );
  });

  it('lista produtos filtrando sempre por tenantId e deletedAt: null', async () => {
    await controller.findAll(authenticatedUser as never, fakeRequest, { page: 1, perPage: 20 } as never);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1', deletedAt: null }) }),
    );
  });
});
