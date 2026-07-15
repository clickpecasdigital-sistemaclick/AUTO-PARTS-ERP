import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/** Catálogo de Serviços (briefing: código, descrição, tempo padrão, valor padrão, especialidade, categoria, garantia). */
@Injectable()
export class ServicesCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, category?: string) {
    return this.prisma.service.findMany({ where: { tenantId, isActive: true, deletedAt: null, ...(category ? { category: category as never } : {}) }, orderBy: { name: 'asc' } });
  }

  create(tenantId: string, data: { code?: string; name: string; description?: string; category?: string; specialty?: string; standardPrice: number; estimatedMinutes?: number; warrantyDays?: number }) {
    return this.prisma.service.create({ data: { tenantId, ...data } as never });
  }

  update(tenantId: string, id: string, data: Record<string, unknown>) {
    return this.prisma.service.update({ where: { id }, data: data as never });
  }

  /** Sugere serviços compatíveis com a especialidade do mecânico (briefing: especialidade do serviço x especialidade do mecânico). */
  async suggestByMechanicSpecialty(tenantId: string, mechanicId: string) {
    const mechanic = await this.prisma.mechanic.findFirst({ where: { id: mechanicId, tenantId } });
    if (!mechanic || mechanic.specialties.length === 0) return this.list(tenantId);

    return this.prisma.service.findMany({ where: { tenantId, isActive: true, specialty: { in: mechanic.specialties } } });
  }
}

/** Boxes/elevadores (briefing: "Agendamento por box"). */
@Injectable()
export class ServiceBoxesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, branchId?: string) {
    return this.prisma.serviceBox.findMany({ where: { tenantId, isActive: true, ...(branchId ? { branchId } : {}) } });
  }

  create(tenantId: string, branchId: string, code: string, name: string) {
    return this.prisma.serviceBox.create({ data: { tenantId, branchId, code, name } });
  }

  /** Ocupação atual — quais boxes têm OS em execução agora. */
  async getOccupancy(tenantId: string, branchId: string) {
    const boxes = await this.list(tenantId, branchId);
    const occupied = await this.prisma.serviceOrder.findMany({
      where: { tenantId, branchId, status: { in: ['in_progress', 'diagnosing', 'awaiting_parts'] }, boxId: { not: null } },
      select: { boxId: true, code: true },
    });
    const occupiedByBoxId = new Map(occupied.map((o) => [o.boxId, o.code]));

    return boxes.map((box) => ({ ...box, occupied: occupiedByBoxId.has(box.id), currentOrderCode: occupiedByBoxId.get(box.id) ?? null }));
  }
}
