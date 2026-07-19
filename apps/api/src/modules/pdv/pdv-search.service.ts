import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Busca rápida do PDV (briefing: <100ms, código interno/barras/OEM/
 * fabricante/descrição/marca/aplicação por veículo/placa). Usa os mesmos
 * índices já criados (Sprint 05: `internalCode`/`barcode`; Sprint 02:
 * `CustomerVehicle.plate`) e a função `search_products()` preparada em
 * `prisma/sql/products_fulltext_search.sql` (Sprint 05) — aqui a busca por
 * `ILIKE` é o fallback funcional até a migration do índice GIN ser
 * aplicada num ambiente com banco real; a troca é só dentro deste método,
 * a API não muda.
 */
@Injectable()
export class PdvSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchSales(tenantId: string, term: string, limit = 20) {
    const cleanTerm = term.trim();
    if (!cleanTerm) return [];

    return this.prisma.sale.findMany({
      where: {
        tenantId,
        status: { in: ['paid', 'partially_paid'] },
        OR: [
          { code: { contains: cleanTerm, mode: 'insensitive' } },
          { customer: { name: { contains: cleanTerm, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        code: true,
        totalAmount: true,
        issuedAt: true,
        customer: { select: { name: true } },
        items: { select: { id: true, productId: true, quantity: true, unitPrice: true, product: { select: { internalCode: true, shortDescription: true } } } },
      },
      take: limit,
      orderBy: { issuedAt: 'desc' },
    });
  }

  async searchProducts(tenantId: string, term: string, limit = 20) {
    const cleanTerm = term.trim();
    if (!cleanTerm) return [];

    return this.prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'active',
        OR: [
          { internalCode: { contains: cleanTerm, mode: 'insensitive' } },
          { barcode: { contains: cleanTerm } },
          { originalCode: { contains: cleanTerm, mode: 'insensitive' } }, // código OEM
          { manufacturerCode: { contains: cleanTerm, mode: 'insensitive' } },
          { similarCode: { contains: cleanTerm, mode: 'insensitive' } },
          { shortDescription: { contains: cleanTerm, mode: 'insensitive' } },
          { brand: { name: { contains: cleanTerm, mode: 'insensitive' } } },
        ],
      },
      include: {
        brand: { select: { name: true } },
        unit: { select: { code: true } },
        category: { select: { name: true } },
        defaultLocation: { select: { fullAddress: true, level: true, position: true } },
        photos: { where: { isPrimary: true }, select: { url: true }, take: 1 },
        stocks: { select: { warehouseId: true, quantityOnHand: true, quantityReserved: true } },
      },
      take: limit,
      orderBy: { internalCode: 'asc' },
    });
  }

  /** Busca por aplicação veicular — produtos compatíveis com a versão do veículo selecionado. */
  async searchByVehicleApplication(tenantId: string, vehicleVersionId: string, limit = 50) {
    return this.prisma.product.findMany({
      where: { tenantId, deletedAt: null, status: 'active', vehicleApplications: { some: { vehicleVersionId } } },
      include: { brand: { select: { name: true } } },
      take: limit,
    });
  }

  /** Busca por placa — resolve o veículo do cliente e retorna as peças já aplicadas a ele. */
  async searchByPlate(tenantId: string, plate: string) {
    const vehicle = await this.prisma.customerVehicle.findFirst({
      where: { tenantId, plate: { equals: plate, mode: 'insensitive' } },
      include: { customer: { select: { id: true, name: true, creditStatus: true } }, vehicleVersion: { include: { model: { include: { make: true } } } } },
    });
    if (!vehicle) return null;

    const compatibleProducts = vehicle.vehicleVersionId
      ? await this.searchByVehicleApplication(tenantId, vehicle.vehicleVersionId)
      : [];

    return { vehicle, compatibleProducts };
  }

  /** Busca por chassi — mesmo fluxo da busca por placa, para quando o cliente só tem o chassi em mãos. */
  async searchByChassis(tenantId: string, chassis: string) {
    const vehicle = await this.prisma.customerVehicle.findFirst({
      where: { tenantId, chassis: { equals: chassis, mode: 'insensitive' } },
      include: { customer: { select: { id: true, name: true, creditStatus: true } }, vehicleVersion: { include: { model: { include: { make: true } } } } },
    });
    if (!vehicle) return null;

    const compatibleProducts = vehicle.vehicleVersionId
      ? await this.searchByVehicleApplication(tenantId, vehicle.vehicleVersionId)
      : [];

    return { vehicle, compatibleProducts };
  }

  /** Pesquisa Full Text preparada (Sprint 05) — usada quando a migration do índice GIN existir no banco real. */
  async searchProductsFullText(tenantId: string, term: string, limit = 20) {
    return this.prisma.$queryRaw`SELECT * FROM search_products(${tenantId}::uuid, ${term}, ${limit})`;
  }

  /**
   * Produtos relacionados a uma peça (similar/equivalente/substituto) —
   * mesma base de dados do cadastro de Produto (aba "Relacionados"), só
   * que aqui devolvendo o suficiente pra vender direto do balcão (preço,
   * estoque), sem precisar sair da venda pra consultar o cadastro.
   */
  async getRelatedProducts(tenantId: string, productId: string, warehouseId?: string) {
    const refs = await this.prisma.productCrossReference.findMany({
      where: { tenantId, productId },
      include: {
        relatedProduct: {
          select: {
            id: true,
            internalCode: true,
            shortDescription: true,
            salePrice: true,
            brand: { select: { name: true } },
            stocks: warehouseId ? { where: { warehouseId }, select: { quantityOnHand: true, quantityReserved: true } } : { select: { quantityOnHand: true, quantityReserved: true } },
          },
        },
      },
    });
    return refs.map((r) => ({ type: r.type, product: r.relatedProduct }));
  }

  /**
   * "Vendidos juntos" (venda cruzada) — produtos que mais aparecem na
   * mesma venda que o produto informado, historicamente. Sem tabela
   * dedicada: agrega direto de `SaleItem` (mesma venda = mesmo `saleId`).
   */
  async getFrequentlyBoughtTogether(tenantId: string, productId: string, limit = 5) {
    const saleIds = await this.prisma.saleItem.findMany({
      where: { tenantId, productId },
      select: { saleId: true },
      take: 200,
      orderBy: { id: 'desc' },
    });
    const ids = saleIds.map((s) => s.saleId);
    if (ids.length === 0) return [];

    const coOccurring = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { tenantId, saleId: { in: ids }, productId: { not: productId } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    const products = await this.prisma.product.findMany({
      where: { id: { in: coOccurring.map((c) => c.productId) } },
      select: { id: true, internalCode: true, shortDescription: true, salePrice: true },
    });
    const byId = new Map(products.map((p) => [p.id, p] as const));
    return coOccurring.map((c) => byId.get(c.productId)).filter((p): p is NonNullable<typeof p> => !!p);
  }

  /** Últimas compras do cliente — pra sugerir recompra rápida direto do balcão. */
  async getCustomerRecentPurchases(tenantId: string, customerId: string, limit = 8) {
    const items = await this.prisma.saleItem.findMany({
      where: { tenantId, sale: { customerId } },
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        sale: { select: { issuedAt: true } },
        product: { select: { id: true, internalCode: true, shortDescription: true, salePrice: true } },
      },
      orderBy: { sale: { issuedAt: 'desc' } },
      take: limit * 3, // busca uma margem maior pra depois deduplicar por produto
    });

    const seen = new Set<string>();
    const deduped: typeof items = [];
    for (const item of items) {
      if (seen.has(item.product.id)) continue;
      seen.add(item.product.id);
      deduped.push(item);
      if (deduped.length >= limit) break;
    }
    return deduped;
  }
}
