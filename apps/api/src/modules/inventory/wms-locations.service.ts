import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { CreateAisleDto, CreateShelfDto, CreateStorageLocationDto, CreateStreetDto, CreateWarehouseDto } from './dto/wms-location.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * CRUD da hierarquia WMS completa (briefing): Depósito → Corredor → Rua →
 * Prateleira → Posição (Nível + Posição). `fullAddress` é montado aqui e
 * denormalizado em `StorageLocation` na criação — único lugar que conhece
 * o formato "A01-B05-P03-N02" (Corredor-Rua-Prateleira-Nível).
 */
@Injectable()
export class WmsLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Depósitos -----------------------------------------------------------------

  listWarehouses(tenantId: string) {
    return this.prisma.warehouse.findMany({ where: { tenantId, deletedAt: null }, orderBy: { name: 'asc' } });
  }

  createWarehouse(ctx: RequestContext, dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: { tenantId: ctx.tenantId, ...dto } });
  }

  async softDeleteWarehouse(tenantId: string, id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id, tenantId } });
    if (!warehouse) throw new NotFoundException('Depósito não encontrado');
    return this.prisma.warehouse.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  // --- Corredores / Ruas / Prateleiras --------------------------------------------

  listAisles(tenantId: string, warehouseId: string) {
    return this.prisma.aisle.findMany({ where: { tenantId, warehouseId }, orderBy: { code: 'asc' } });
  }

  createAisle(ctx: RequestContext, dto: CreateAisleDto) {
    return this.prisma.aisle.create({ data: { tenantId: ctx.tenantId, ...dto } });
  }

  listStreets(tenantId: string, aisleId: string) {
    return this.prisma.street.findMany({ where: { tenantId, aisleId }, orderBy: { code: 'asc' } });
  }

  createStreet(ctx: RequestContext, dto: CreateStreetDto) {
    return this.prisma.street.create({ data: { tenantId: ctx.tenantId, ...dto } });
  }

  listShelves(tenantId: string, streetId: string) {
    return this.prisma.shelf.findMany({ where: { tenantId, streetId }, orderBy: { code: 'asc' } });
  }

  createShelf(ctx: RequestContext, dto: CreateShelfDto) {
    return this.prisma.shelf.create({ data: { tenantId: ctx.tenantId, ...dto } });
  }

  // --- Posições (Nível + Posição) -------------------------------------------------

  async listLocations(tenantId: string, shelfId: string) {
    return this.prisma.storageLocation.findMany({ where: { tenantId, shelfId }, orderBy: [{ level: 'asc' }, { position: 'asc' }] });
  }

  async createLocation(ctx: RequestContext, dto: CreateStorageLocationDto) {
    const shelf = await this.prisma.shelf.findUnique({
      where: { id: dto.shelfId },
      include: { street: { include: { aisle: true } } },
    });
    if (!shelf) throw new NotFoundException('Prateleira não encontrada');

    const fullAddress = `${shelf.street.aisle.code}-${shelf.street.code}-${shelf.code}-${dto.level}${dto.position}`;

    return this.prisma.storageLocation.create({
      data: { tenantId: ctx.tenantId, shelfId: dto.shelfId, level: dto.level, position: dto.position, fullAddress },
    });
  }

  /** Busca por código completo (ex: leitor de código de barras lendo uma etiqueta de posição). */
  async findByFullAddress(tenantId: string, fullAddress: string) {
    return this.prisma.storageLocation.findFirst({ where: { tenantId, fullAddress } });
  }

  /** Árvore completa de um Depósito (para a tela de gestão WMS) — Corredores > Ruas > Prateleiras > Posições. */
  async getWarehouseTree(tenantId: string, warehouseId: string) {
    return this.prisma.aisle.findMany({
      where: { tenantId, warehouseId },
      orderBy: { code: 'asc' },
      include: {
        streets: {
          orderBy: { code: 'asc' },
          include: {
            shelves: {
              orderBy: { code: 'asc' },
              include: { locations: { orderBy: [{ level: 'asc' }, { position: 'asc' }] } },
            },
          },
        },
      },
    });
  }
}
