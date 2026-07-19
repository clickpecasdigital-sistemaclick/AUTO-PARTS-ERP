import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductsRepository, type ProductWithRelations } from './products.repository';
import { AuditService } from '@/common/audit/audit.service';
import { SupabaseStorageService } from '@/common/storage/supabase-storage.service';
import { buildPaginatedResult, type PaginatedResult } from '@/common/dto/paginated-result.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { QueryProductDto } from './dto/query-product.dto';
import type { CreateProductSupplierDto, UpdateProductSupplierDto } from './dto/create-product-supplier.dto';
import type { CreateProductApplicationDto } from './dto/create-product-application.dto';
import type { CreateProductCrossReferenceDto } from './dto/create-product-cross-reference.dto';
import type { CreateProductPromotionDto } from './dto/create-product-promotion.dto';
import type { RequestContext } from '@/common/types/request-context';

const PRODUCT_PHOTOS_BUCKET = 'product-photos';

// Reexportado por compatibilidade — `RequestContext` agora vive em
// `@/common/types/request-context` (Sprint 06), compartilhado entre todos
// os módulos de negócio. Nenhum import existente (`from
// '@/modules/products/products.service'`) precisa mudar.
export type { RequestContext };

export interface ComputedFinancials {
  markupPercent?: number;
  marginPercent?: number;
}

/**
 * Regras de negócio do Módulo Comercial de Produtos. Toda escrita passa
 * por aqui (nunca o Controller chama o Repository direto) — é este
 * service que garante multi-tenant (tenantId sempre vem do usuário
 * autenticado, nunca do payload do cliente), gera o código interno
 * automaticamente, calcula margem/markup e grava auditoria.
 *
 * Usa os tipos `Unchecked*Input` do Prisma (FKs como escalares simples,
 * ex: `brandId: string`) em vez de `connect`/`disconnect` aninhado — o
 * resultado é idêntico, porém com DTOs mapeados 1:1 para o input do
 * Prisma, sem ambiguidade de tipos.
 */
@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly audit: AuditService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async findAll(ctx: RequestContext, query: QueryProductDto): Promise<PaginatedResult<ProductWithRelations & { computed: ComputedFinancials }>> {
    const { data, total } = await this.repository.findMany(ctx.tenantId, query);
    const enriched = data.map((product) => ({ ...product, computed: this.computeFinancials(product) }));
    return buildPaginatedResult(enriched, total, query.page, query.perPage);
  }

  async findOne(ctx: RequestContext, id: string) {
    const product = await this.repository.findById(ctx.tenantId, id);
    if (!product) throw new NotFoundException('Produto não encontrado');
    return { ...product, computed: this.computeFinancials(product) };
  }

  async create(ctx: RequestContext, dto: CreateProductDto) {
    const internalCode = dto.internalCode?.trim() || (await this.generateInternalCode(ctx.tenantId));

    const existing = await this.repository.findByInternalCode(ctx.tenantId, internalCode);
    if (existing) throw new ConflictException(`Já existe um produto com o código interno "${internalCode}"`);

    const data: any = {
      tenantId: ctx.tenantId,
      internalCode,
      barcode: dto.barcode,
      manufacturerCode: dto.manufacturerCode,
      originalCode: dto.originalCode,
      similarCode: dto.similarCode,
      shortDescription: dto.shortDescription,
      fullDescription: dto.fullDescription,
      brandId: dto.brandId,
      manufacturerId: dto.manufacturerId,
      groupId: dto.groupId,
      subgroupId: dto.subgroupId,
      categoryId: dto.categoryId,
      unitId: dto.unitId,
      ncmCode: dto.ncmCode,
      cestCode: dto.cestCode,
      defaultCfopCode: dto.defaultCfopCode,
      defaultCstCode: dto.defaultCstCode,
      defaultCsosnCode: dto.defaultCsosnCode,
      origin: dto.origin as never,
      ipiRate: dto.ipiRate,
      icmsRate: dto.icmsRate,
      pisRate: dto.pisRate,
      cofinsRate: dto.cofinsRate,
      weightKg: dto.weightKg,
      heightCm: dto.heightCm,
      widthCm: dto.widthCm,
      lengthCm: dto.lengthCm,
      defaultLocationId: dto.defaultLocationId,
      minStock: dto.minStock,
      maxStock: dto.maxStock,
      costPrice: dto.costPrice,
      averageCostPrice: dto.costPrice, // custo médio inicia igual ao custo informado
      salePrice: dto.salePrice,
      wholesalePrice: dto.wholesalePrice,
      workshopPrice: dto.workshopPrice,
      distributorPrice: dto.distributorPrice,
      marginPercent: this.calculateMargin(dto.costPrice, dto.salePrice),
      primarySupplierId: dto.primarySupplierId,
      warrantyDays: dto.warrantyDays,
      notes: dto.notes,
      status: dto.isActive === false ? 'inactive' : 'active',
    };

    const product = await this.repository.create(ctx.tenantId, ctx.userId, data);

    await this.audit.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'insert',
      entity: 'Product',
      entityId: product.id,
      after: product,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return product;
  }

  async update(ctx: RequestContext, id: string, dto: UpdateProductDto) {
    const before = await this.repository.findById(ctx.tenantId, id);
    if (!before) throw new NotFoundException('Produto não encontrado');

    if (dto.internalCode && dto.internalCode !== before.internalCode) {
      const conflict = await this.repository.findByInternalCode(ctx.tenantId, dto.internalCode);
      if (conflict) throw new ConflictException(`Já existe um produto com o código interno "${dto.internalCode}"`);
    }

    const isPriceChange = dto.costPrice !== undefined || dto.salePrice !== undefined;
    const nextCost = dto.costPrice ?? Number(before.costPrice);
    const nextSale = dto.salePrice ?? Number(before.salePrice);
    const isSupplierChange = dto.primarySupplierId !== undefined && dto.primarySupplierId !== before.primarySupplierId;

    // `isActive` é um campo de conveniência do DTO (mapeado para `status` no
    // create); o Prisma não tem essa coluna — removido do payload antes de
    // montar o update para não violar o tipo `ProductUncheckedUpdateInput`.
    const { isActive: _isActive, ...rest } = dto;

    const data: any = {
      ...rest,
      origin: dto.origin as never,
      status: dto.status as never,
      marginPercent: isPriceChange ? this.calculateMargin(nextCost, nextSale) : undefined,
    };

    const product = await this.repository.update(id, ctx.userId, data);

    let action: 'update' | 'price_change' = 'update';
    if (isPriceChange) action = 'price_change';

    await this.audit.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action,
      entity: 'Product',
      entityId: id,
      before,
      after: product,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    if (isSupplierChange) {
      await this.audit.log({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'update',
        entity: 'Product',
        entityId: id,
        before: { primarySupplierId: before.primarySupplierId },
        after: { primarySupplierId: dto.primarySupplierId },
      });
    }

    return product;
  }

  async remove(ctx: RequestContext, id: string) {
    const before = await this.repository.findById(ctx.tenantId, id);
    if (!before) throw new NotFoundException('Produto não encontrado');

    await this.repository.softDelete(id, ctx.userId);

    await this.audit.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'delete',
      entity: 'Product',
      entityId: id,
      before,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  // --- Fotos -----------------------------------------------------------------

  async uploadPhoto(ctx: RequestContext, productId: string, file: { buffer: Buffer; originalname: string; mimetype: string }, isPrimary: boolean) {
    const product = await this.repository.findById(ctx.tenantId, productId);
    if (!product) throw new NotFoundException('Produto não encontrado');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Apenas imagens são permitidas');

    const path = `${ctx.tenantId}/${productId}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const { publicUrl } = await this.storage.upload(PRODUCT_PHOTOS_BUCKET, path, file.buffer, file.mimetype);

    const photo = await this.repository.addPhoto(ctx.tenantId, productId, publicUrl, isPrimary || product.photos.length === 0, product.photos.length);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, after: { photoAdded: photo.id } });
    return photo;
  }

  async removePhoto(ctx: RequestContext, productId: string, photoId: string) {
    const photo = await this.repository.getPhoto(photoId);
    if (!photo || photo.productId !== productId) throw new NotFoundException('Foto não encontrada');

    const path = this.extractStoragePath(photo.url);
    if (path) await this.storage.delete(PRODUCT_PHOTOS_BUCKET, path);
    await this.repository.removePhoto(photoId);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, before: { photoRemoved: photoId } });
  }

  async reorderPhotos(ctx: RequestContext, productId: string, photoIdsInOrder: string[]) {
    await this.repository.reorderPhotos(productId, photoIdsInOrder);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, after: { photosReordered: true } });
  }

  async setPrimaryPhoto(ctx: RequestContext, productId: string, photoId: string) {
    await this.repository.setPrimaryPhoto(productId, photoId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, after: { primaryPhoto: photoId } });
  }

  // --- Fornecedores ------------------------------------------------------------

  async addSupplier(ctx: RequestContext, productId: string, dto: CreateProductSupplierDto) {
    const supplier = await this.repository.addSupplier(ctx.tenantId, productId, dto);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, after: { supplierAdded: dto.supplierId } });
    return supplier;
  }

  async updateSupplier(ctx: RequestContext, productId: string, productSupplierId: string, dto: UpdateProductSupplierDto) {
    const updated = await this.repository.updateSupplier(productSupplierId, dto);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, after: { supplierUpdated: productSupplierId } });
    return updated;
  }

  async removeSupplier(ctx: RequestContext, productId: string, productSupplierId: string) {
    await this.repository.removeSupplier(productSupplierId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, before: { supplierRemoved: productSupplierId } });
  }

  // --- Aplicações veiculares -------------------------------------------------

  async addApplication(ctx: RequestContext, productId: string, dto: CreateProductApplicationDto) {
    const application = await this.repository.addApplication(ctx.tenantId, productId, dto.vehicleVersionId, dto.position, dto.notes);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, after: { applicationAdded: dto.vehicleVersionId } });
    return application;
  }

  async removeApplication(ctx: RequestContext, productId: string, applicationId: string) {
    await this.repository.removeApplication(applicationId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, before: { applicationRemoved: applicationId } });
  }

  // --- Produtos relacionados ---------------------------------------------------

  async addCrossReference(ctx: RequestContext, productId: string, dto: CreateProductCrossReferenceDto) {
    if (productId === dto.relatedProductId) throw new BadRequestException('Um produto não pode se relacionar consigo mesmo');
    const reference = await this.repository.addCrossReference(ctx.tenantId, productId, dto.relatedProductId, dto.type, dto.notes);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, after: { relatedAdded: dto.relatedProductId, type: dto.type } });
    return reference;
  }

  async removeCrossReference(ctx: RequestContext, productId: string, crossReferenceId: string) {
    await this.repository.removeCrossReference(crossReferenceId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Product', entityId: productId, before: { relatedRemoved: crossReferenceId } });
  }

  // --- Promoções (estrutura) ----------------------------------------------------

  async addPromotion(ctx: RequestContext, productId: string, dto: CreateProductPromotionDto) {
    return this.repository.addPromotion(ctx.tenantId, productId, ctx.userId, {
      type: dto.type as never,
      value: dto.value,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      isActive: dto.isActive,
    });
  }

  listAllPromotions(tenantId: string) {
    return this.repository.listAllPromotions(tenantId);
  }

  async deactivatePromotion(ctx: RequestContext, promotionId: string) {
    return this.repository.deactivatePromotion(ctx.tenantId, promotionId);
  }

  // --- Histórico --------------------------------------------------------------

  async getHistory(ctx: RequestContext, productId: string) {
    return this.repository.findHistory(ctx.tenantId, productId);
  }

  // --- Helpers internos ---------------------------------------------------------

  /** Código interno sequencial por tenant: "PRD-000001", "PRD-000002"... */
  private async generateInternalCode(tenantId: string): Promise<string> {
    const count = await this.repository.countByTenant(tenantId);
    return `PRD-${String(count + 1).padStart(6, '0')}`;
  }

  private calculateMargin(costPrice?: number, salePrice?: number): number | undefined {
    if (!costPrice || !salePrice || costPrice <= 0) return undefined;
    return Number((((salePrice - costPrice) / salePrice) * 100).toFixed(4));
  }

  /** Markup = quanto o preço de venda é maior que o custo, em %. Diferente de margem (calculada sobre o preço de venda). */
  private calculateMarkup(costPrice?: number | number, salePrice?: number | number): number | undefined {
    const cost = Number(costPrice);
    const sale = Number(salePrice);
    if (!cost || cost <= 0) return undefined;
    return Number((((sale - cost) / cost) * 100).toFixed(4));
  }

  private computeFinancials(product: ProductWithRelations): ComputedFinancials {
    return {
      markupPercent: this.calculateMarkup(product.costPrice, product.salePrice),
      marginPercent: product.marginPercent
        ? Number(product.marginPercent)
        : this.calculateMargin(Number(product.costPrice), Number(product.salePrice)),
    };
  }

  private extractStoragePath(publicUrl: string): string | null {
    const marker = '/product-photos/';
    const index = publicUrl.indexOf(marker);
    return index === -1 ? null : publicUrl.slice(index + marker.length);
  }
}
