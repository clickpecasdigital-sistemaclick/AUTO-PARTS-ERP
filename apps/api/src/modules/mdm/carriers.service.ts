import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/** Transportadoras — tabela de frete por região, frota e motoristas (briefing). */
@Injectable()
export class CarriersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.carrier.findMany({ where: { tenantId, deletedAt: null }, orderBy: { name: 'asc' } });
  }

  async findOne(tenantId: string, id: string) {
    const carrier = await this.prisma.carrier.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { freightTables: true, vehicles: true, drivers: true },
    });
    if (!carrier) throw new NotFoundException('Transportadora não encontrada');
    return carrier;
  }

  async create(ctx: RequestContext, companyId: string, dto: Record<string, unknown>) {
    const carrier = await this.prisma.carrier.create({ data: { tenantId: ctx.tenantId, companyId, ...dto } as never });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'Carrier', entityId: carrier.id, after: carrier });
    return carrier;
  }

  addFreightTable(tenantId: string, carrierId: string, data: { region: string; pricePerKg?: number; flatRate?: number; leadTimeDays: number }) {
    return this.prisma.carrierFreightTable.create({ data: { tenantId, carrierId, ...data } });
  }

  addVehicle(tenantId: string, carrierId: string, data: { plate: string; model?: string; capacityKg?: number }) {
    return this.prisma.carrierVehicle.create({ data: { tenantId, carrierId, ...data } });
  }

  addDriver(tenantId: string, carrierId: string, data: { name: string; document?: string; licenseNumber?: string; phone?: string }) {
    return this.prisma.carrierDriver.create({ data: { tenantId, carrierId, ...data } });
  }

  /** Cotação simplificada por região — usada por Logística/Compras para estimar frete antes de fechar uma transferência/entrega. */
  async quoteFreight(tenantId: string, region: string, weightKg?: number) {
    const tables = await this.prisma.carrierFreightTable.findMany({ where: { tenantId, region: { equals: region, mode: 'insensitive' }, isActive: true }, include: { carrier: true } });
    return tables
      .map((t) => ({
        carrierId: t.carrierId,
        carrierName: t.carrier.name,
        leadTimeDays: t.leadTimeDays,
        estimatedCost: t.flatRate ? Number(t.flatRate) : t.pricePerKg && weightKg ? Number(t.pricePerKg) * weightKg : null,
      }))
      .sort((a, b) => (a.estimatedCost ?? Infinity) - (b.estimatedCost ?? Infinity));
  }
}
