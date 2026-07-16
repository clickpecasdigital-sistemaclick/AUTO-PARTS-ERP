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
          { shortDescription: { contains: cleanTerm, mode: 'insensitive' } },
          { brand: { name: { contains: cleanTerm, mode: 'insensitive' } } },
        ],
      },
      include: { brand: { select: { name: true } }, unit: { select: { code: true } }, stocks: { select: { warehouseId: true, quantityOnHand: true, quantityReserved: true } } },
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

  /** Pesquisa Full Text preparada (Sprint 05) — usada quando a migration do índice GIN existir no banco real. */
  async searchProductsFullText(tenantId: string, term: string, limit = 20) {
    return this.prisma.$queryRaw`SELECT * FROM search_products(${tenantId}::uuid, ${term}, ${limit})`;
  }
}
