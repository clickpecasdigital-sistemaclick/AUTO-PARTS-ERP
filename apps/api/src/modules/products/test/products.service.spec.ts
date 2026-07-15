import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products.service';
import { ProductsRepository } from '../products.repository';
import { AuditService } from '@/common/audit/audit.service';
import { SupabaseStorageService } from '@/common/storage/supabase-storage.service';
import type { CreateProductDto } from '../dto/create-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;
  let audit: jest.Mocked<AuditService>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  const baseProduct = {
    id: 'product-1',
    tenantId: 'tenant-1',
    internalCode: 'PRD-000001',
    shortDescription: 'Pastilha de freio dianteira',
    costPrice: 50,
    salePrice: 100,
    marginPercent: 50,
    status: 'active',
    photos: [],
    primarySupplierId: null,
  } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            findById: jest.fn(),
            findByInternalCode: jest.fn(),
            countByTenant: jest.fn(),
            findMany: jest.fn(),
            findAllForExport: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            addPhoto: jest.fn(),
            getPhoto: jest.fn(),
            removePhoto: jest.fn(),
            reorderPhotos: jest.fn(),
            setPrimaryPhoto: jest.fn(),
            addSupplier: jest.fn(),
            updateSupplier: jest.fn(),
            removeSupplier: jest.fn(),
            addApplication: jest.fn(),
            removeApplication: jest.fn(),
            addCrossReference: jest.fn(),
            removeCrossReference: jest.fn(),
            addPromotion: jest.fn(),
            findHistory: jest.fn(),
          },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: SupabaseStorageService, useValue: { upload: jest.fn(), remove: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
    repository = moduleRef.get(ProductsRepository);
    audit = moduleRef.get(AuditService);
  });

  describe('create', () => {
    const dto: CreateProductDto = { shortDescription: 'Pastilha de freio dianteira', unitId: 'unit-1', costPrice: 50, salePrice: 100 };

    it('gera o código interno automaticamente quando não informado', async () => {
      repository.countByTenant.mockResolvedValue(4);
      repository.findByInternalCode.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...baseProduct, internalCode: 'PRD-000005' });

      const result = await service.create(ctx, dto);

      expect(repository.create).toHaveBeenCalledWith(
        ctx.tenantId,
        ctx.userId,
        expect.objectContaining({ internalCode: 'PRD-000005' }),
      );
      expect(result.internalCode).toBe('PRD-000005');
    });

    it('calcula a margem percentual a partir de custo e preço de venda', async () => {
      repository.countByTenant.mockResolvedValue(0);
      repository.findByInternalCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(baseProduct);

      await service.create(ctx, dto);

      expect(repository.create).toHaveBeenCalledWith(
        ctx.tenantId,
        ctx.userId,
        expect.objectContaining({ marginPercent: 50 }),
      );
    });

    it('rejeita código interno duplicado dentro do mesmo tenant', async () => {
      repository.findByInternalCode.mockResolvedValue(baseProduct);

      await expect(service.create(ctx, { ...dto, internalCode: 'PRD-000001' })).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('registra auditoria de criação', async () => {
      repository.countByTenant.mockResolvedValue(0);
      repository.findByInternalCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(baseProduct);

      await service.create(ctx, dto);

      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'insert', entity: 'Product', tenantId: ctx.tenantId }));
    });
  });

  describe('update', () => {
    it('lança NotFoundException quando o produto não existe no tenant', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(ctx, 'inexistente', { shortDescription: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('registra a ação price_change quando custo ou preço de venda mudam', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      repository.update.mockResolvedValue({ ...baseProduct, salePrice: 120 });

      await service.update(ctx, baseProduct.id, { salePrice: 120 });

      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'price_change' }));
    });

    it('registra auditoria adicional quando o fornecedor principal muda', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      repository.update.mockResolvedValue({ ...baseProduct, primarySupplierId: 'supplier-2' });

      await service.update(ctx, baseProduct.id, { primarySupplierId: 'supplier-2' });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ after: { primarySupplierId: 'supplier-2' } }),
      );
    });
  });

  describe('remove', () => {
    it('realiza soft delete (nunca DELETE físico) e audita', async () => {
      repository.findById.mockResolvedValue(baseProduct);

      await service.remove(ctx, baseProduct.id);

      expect(repository.softDelete).toHaveBeenCalledWith(baseProduct.id, ctx.userId);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
    });

    it('lança NotFoundException para produto de outro tenant/inexistente', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.remove(ctx, 'outro-tenant-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('addCrossReference', () => {
    it('rejeita um produto se relacionar consigo mesmo', async () => {
      await expect(
        service.addCrossReference(ctx, baseProduct.id, { relatedProductId: baseProduct.id, type: 'similar' as never }),
      ).rejects.toThrow('Um produto não pode se relacionar consigo mesmo');
    });
  });
});
