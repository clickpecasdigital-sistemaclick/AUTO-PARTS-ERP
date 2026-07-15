import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/** Mecânicos — especialidades, certificações, comissões, ordens, horas trabalhadas, agenda (briefing). */
@Injectable()
export class MechanicsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.mechanic.findMany({ where: { tenantId, isActive: true }, include: { employee: { select: { id: true, name: true, photoUrl: true } }, certifications: true } });
  }

  async findOne(tenantId: string, id: string) {
    const mechanic = await this.prisma.mechanic.findFirst({ where: { id, tenantId }, include: { employee: true, certifications: true } });
    if (!mechanic) throw new NotFoundException('Mecânico não encontrado');
    return mechanic;
  }

  addCertification(tenantId: string, mechanicId: string, data: { name: string; issuer?: string; issuedAt?: string; expiresAt?: string }) {
    return this.prisma.mechanicCertification.create({
      data: {
        tenantId,
        mechanicId,
        name: data.name,
        issuer: data.issuer,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  clockIn(tenantId: string, mechanicId: string, serviceOrderId?: string) {
    return this.prisma.mechanicTimeEntry.create({ data: { tenantId, mechanicId, serviceOrderId, startedAt: new Date() } });
  }

  clockOut(tenantId: string, timeEntryId: string) {
    return this.prisma.mechanicTimeEntry.update({ where: { id: timeEntryId }, data: { endedAt: new Date() } });
  }

  /** Horas trabalhadas no período + ordens atendidas — base para comissão/produtividade. */
  async getProductivity(tenantId: string, mechanicId: string, sinceDays = 30) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * sinceDays);
    const [entries, ordersCount, commissionsAgg] = await Promise.all([
      this.prisma.mechanicTimeEntry.findMany({ where: { tenantId, mechanicId, startedAt: { gte: since } } }),
      this.prisma.serviceOrder.count({ where: { tenantId, mechanicId, createdAt: { gte: since } } }),
      this.prisma.commission.aggregate({ where: { tenantId, mechanicId, createdAt: { gte: since } }, _sum: { amount: true } }),
    ]);

    const totalHours = entries
      .filter((e) => e.endedAt)
      .reduce((sum, e) => sum + (e.endedAt!.getTime() - e.startedAt.getTime()) / (1000 * 60 * 60), 0);

    return { totalHours: Number(totalHours.toFixed(1)), ordersCount, commissionAccrued: Number(commissionsAgg._sum.amount ?? 0) };
  }
}
