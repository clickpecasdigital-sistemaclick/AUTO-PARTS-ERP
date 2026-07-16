import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { QueryProductDto } from './dto/query-product.dto';

const PRODUCT_INCLUDE = {
  brand: true,
  manufacturer: true,
  group: true,
  subgroup: true,
  category: true,
  unit: true,
  defaultLocation: true,
  primarySupplier: { select: { id: true, name: true, tradeName: true } },
  photos: { orderBy: { position: 'asc' as const } },
  suppliers: { include: { supplier: { select: { id: true, name: true, tradeName: true } } } },
  vehicleApplications: { include: { vehicleVersion: { include: { model: { include: { make: true } } } } } },
  crossReferencesFrom: { include: { relatedProduct: { select: { id: true, internalCode: true, shortDescription: true } } } },
  promotions: { where: { isActive: true } },
} satisfies any;

export type ProductWithRelations = any;

/**
 * Repository Pattern (Sprint 02, "Estratégia de Performance"): única classe
 * que conhece o shape exato das queries Prisma de Produto. `ProductsService`
 * nunca importa `PrismaService` diretamente — sempre passa por aqui,
 * isolando a camada de domínio de detalhes de persistência (Clean
 * Architecture, conforme arquitetura definida na Sprint 01).
 */
@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, id: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: PRODUCT_INCLUDE,
    });
  }

  async findByInternalCode(tenantId: string, internalCode: string) {
    return this.prisma.product.findFirst({ where: { tenantId, internalCode, deletedAt: null } });
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.prisma.product.count({ where: { tenantId } });
  }

  /**
   * Listagem paginada com busca multi-campo e filtros avançados.
   *
   * `search` usa `ILIKE` (case-insensitive) nos campos de código e
   * descrição — funcional hoje e já preparado para ser substituído por
   * Full Text Search nativo do Postgres: ver
   * `prisma/sql/products_fulltext_search.sql` (Sprint 05) para o índice
   * `tsvector`/GIN e a função `search_products()` que tornam essa mesma
   * assinatura de método ordens de magnitude mais rápida em catálogos de
   * milhões de linhas, sem qualquer mudança no `ProductsService`/Controller.
   */
  async findMany(tenantId: string, query: QueryProductDto) {
    const where = this.buildWhereClause(tenantId, query);
    const orderBy = query.sortBy ? { [query.sortBy]: query.sortDirection ?? 'asc' } : { createdAt: 'desc' as const };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy,
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  /** Mesma cláusula `where` da listagem, reaproveitada pela exportação (sem paginação). */
  async findAllForExport(tenantId: string, query: QueryProductDto) {
    const where = this.buildWhereClause(tenantId, query);
    return this.prisma.product.findMany({ where, include: PRODUCT_INCLUDE, orderBy: { internalCode: 'asc' } });
  }

  private buildWhereClause(tenantId: string, query: QueryProductDto): any {
    const where: any = { tenantId, deletedAt: null };

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { internalCode: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { manufacturerCode: { contains: term, mode: 'insensitive' } },
        { originalCode: { contains: term, mode: 'insensitive' } },
        { similarCode: { contains: term, mode: 'insensitive' } },
        { shortDescription: { contains: term, mode: 'insensitive' } },
        { brand: { name: { contains: term, mode: 'insensitive' } } },
        { manufacturer: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (query.brandId) where.brandId = query.brandId;
    if (query.manufacturerId) where.manufacturerId = query.manufacturerId;
    if (query.groupId) where.groupId = query.groupId;
    if (query.subgroupId) where.subgroupId = query.subgroupId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.supplierId) {
      where.suppliers = { some: { supplierId: query.supplierId } };
    }
    if (query.vehicleVersionId) {
      where.vehicleApplications = { some: { vehicleVersionId: query.vehicleVersionId } };
    }
    if (query.onlyActive) where.status = 'active';

    return where;
  }

  async create(tenantId: string, userId: string | null, data: any) {
    return this.prisma.product.create({
      data: { ...data, tenantId, createdBy: userId, updatedBy: userId },
      include: PRODUCT_INCLUDE,
    });
  }

  async update(id: string, userId: string | null, data: any) {
    return this.prisma.product.update({
      where: { id },
      data: { ...data, updatedBy: userId },
      include: PRODUCT_INCLUDE,
    });
  }

  /** Soft delete — NUNCA um DELETE físico (padrão definido na Sprint 02). */
  async softDelete(id: string, userId: string | null) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId, status: 'inactive' },
    });
  }

  // --- Fotos -------------------------------------------------------------

  async addPhoto(tenantId: string, productId: string, url: string, isPrimary: boolean, position: number) {
    if (isPrimary) {
      await this.prisma.productPhoto.updateMany({ where: { productId }, data: { isPrimary: false } });
    }
    return this.prisma.productPhoto.create({ data: { tenantId, productId, url, isPrimary, position } });
  }

  async getPhoto(id: string) {
    return this.prisma.productPhoto.findUnique({ where: { id } });
  }

  async removePhoto(id: string) {
    return this.prisma.productPhoto.delete({ where: { id } });
  }

  async reorderPhotos(productId: string, photoIdsInOrder: string[]) {
    await this.prisma.$transaction(
      photoIdsInOrder.map((id, index) =>
        this.prisma.productPhoto.update({ where: { id }, data: { position: index, productId } }),
      ),
    );
  }

  async setPrimaryPhoto(productId: string, photoId: string) {
    await this.prisma.$transaction([
      this.prisma.productPhoto.updateMany({ where: { productId }, data: { isPrimary: false } }),
      this.prisma.productPhoto.update({ where: { id: photoId }, data: { isPrimary: true } }),
    ]);
  }

  // --- Fornecedores --------------------------------------------------------

  async addSupplier(tenantId: string, productId: string, data: object) {
    return this.prisma.productSupplier.create({ data: { ...data, tenantId, productId } as Prisma.ProductSupplierUncheckedCreateInput });
  }

  async updateSupplier(id: string, data: any) {
    return this.prisma.productSupplier.update({ where: { id }, data });
  }

  async removeSupplier(id: string) {
    return this.prisma.productSupplier.delete({ where: { id } });
  }

  // --- Aplicações veiculares ------------------------------------------------

  async addApplication(tenantId: string, productId: string, vehicleVersionId: string, position?: string, notes?: string) {
    return this.prisma.productVehicleApplication.create({
      data: { tenantId, productId, vehicleVersionId, position, notes },
    });
  }

  async removeApplication(id: string) {
    return this.prisma.productVehicleApplication.delete({ where: { id } });
  }

  // --- Produtos relacionados -------------------------------------------------

  async addCrossReference(tenantId: string, productId: string, relatedProductId: string, type: string, notes?: string) {
    return this.prisma.productCrossReference.create({
      data: { tenantId, productId, relatedProductId, type: type as never, notes },
    });
  }

  async removeCrossReference(id: string) {
    return this.prisma.productCrossReference.delete({ where: { id } });
  }

  // --- Promoções ------------------------------------------------------------

  async addPromotion(tenantId: string, productId: string, userId: string | null, data: object) {
    return this.prisma.productPromotion.create({ data: { ...data, tenantId, productId, createdBy: userId } as Prisma.ProductPromotionUncheckedCreateInput });
  }

  // --- Histórico (auditoria) -------------------------------------------------

  async findHistory(tenantId: string, productId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId, entity: 'Product', entityId: productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
  }
}
