import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Lookups de apoio ao cadastro de Produtos. Catálogos GLOBAIS (Brand,
 * Manufacturer, Unit, VehicleMake/Model/Version — Sprint 02) são
 * compartilhados entre tenants; Group/Subgroup/Category são tenant-scoped.
 * Somente leitura — a administração desses catálogos (CRUD completo) é uma
 * tela própria de Configurações em sprint futura; aqui existe só o
 * necessário para alimentar os `Select`/`Autocomplete` do cadastro de
 * Produto sem bloquear esta sprint.
 */
@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  brands() {
    return this.prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  manufacturers() {
    return this.prisma.manufacturer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  units() {
    return this.prisma.unit.findMany({ orderBy: { code: 'asc' } });
  }

  groups(tenantId: string) {
    return this.prisma.productGroup.findMany({ where: { tenantId, isActive: true, deletedAt: null }, orderBy: { name: 'asc' } });
  }

  subgroups(tenantId: string, groupId?: string) {
    return this.prisma.productSubgroup.findMany({
      where: { tenantId, isActive: true, deletedAt: null, ...(groupId ? { groupId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  categories(tenantId: string) {
    return this.prisma.productCategory.findMany({ where: { tenantId, isActive: true, deletedAt: null }, orderBy: { name: 'asc' } });
  }

  suppliers(tenantId: string, search?: string) {
    return this.prisma.supplier.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'active',
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { name: 'asc' },
      take: 30,
    });
  }

  vehicleMakes() {
    return this.prisma.vehicleMake.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  vehicleModels(makeId: string) {
    return this.prisma.vehicleModel.findMany({ where: { makeId, isActive: true }, orderBy: { name: 'asc' } });
  }

  vehicleVersions(modelId: string) {
    return this.prisma.vehicleVersion.findMany({
      where: { modelId, isActive: true },
      include: { engine: true, fuelType: true },
      orderBy: { name: 'asc' },
    });
  }

  searchVehicleVersions(search: string) {
    return this.prisma.vehicleVersion.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { model: { name: { contains: search, mode: 'insensitive' as const } } },
          { model: { make: { name: { contains: search, mode: 'insensitive' as const } } } },
        ],
      },
      include: { model: { include: { make: true } } },
      take: 20,
    });
  }

  /** Catálogo de Aplicações — peças compatíveis com uma versão de veículo específica. */
  productsByVehicleVersion(tenantId: string, vehicleVersionId: string) {
    return this.prisma.product.findMany({
      where: { tenantId, deletedAt: null, status: 'active', vehicleApplications: { some: { vehicleVersionId } } },
      include: {
        brand: { select: { name: true } },
        unit: { select: { code: true } },
        stocks: { select: { quantityOnHand: true } },
        vehicleApplications: { where: { vehicleVersionId }, select: { position: true, notes: true } },
      },
      orderBy: { internalCode: 'asc' },
    });
  }
}
