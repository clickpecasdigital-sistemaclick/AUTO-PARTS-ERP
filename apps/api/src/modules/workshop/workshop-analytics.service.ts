import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface WorkshopDashboardKpis {
  vehiclesInService: number;
  openOrders: number;
  inProgressOrders: number;
  awaitingApprovalOrders: number;
  completedOrdersToday: number;
  averageOrderDurationHours: number | null;
  averageTicket: number;
  serviceRevenue: number;
  partsRevenue: number;
  availableMechanics: number;
  reworkRate: number;
  openWarranties: number;
}

/**
 * Dashboard da Oficina (briefing): veículos em atendimento, OS por
 * status, tempo médio por OS, ticket médio, receita de serviços/peças,
 * mecânicos disponíveis, agenda do dia, índice de retrabalho, garantias
 * abertas — tudo via agregação SQL, preparado para "milhares de OS
 * simultâneas" (briefing de performance).
 */
@Injectable()
export class WorkshopAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(tenantId: string, branchId?: string): Promise<WorkshopDashboardKpis> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const where = { tenantId, ...(branchId ? { branchId } : {}) };

    const [
      vehiclesInService,
      openOrders,
      inProgressOrders,
      awaitingApprovalOrders,
      completedToday,
      completedThisMonth,
      totalMechanics,
      busyMechanicIds,
      reworkThisMonth,
      ordersThisMonth,
      openWarranties,
    ] = await Promise.all([
      this.prisma.serviceOrder.count({ where: { ...where, status: { in: ['open', 'diagnosing', 'awaiting_approval', 'approved', 'in_progress', 'awaiting_parts'] } } }),
      this.prisma.serviceOrder.count({ where: { ...where, status: 'open' } }),
      this.prisma.serviceOrder.count({ where: { ...where, status: 'in_progress' } }),
      this.prisma.serviceOrder.count({ where: { ...where, status: 'awaiting_approval' } }),
      this.prisma.serviceOrder.count({ where: { ...where, status: { in: ['completed', 'delivered'] }, completedAt: { gte: startOfDay } } }),
      this.prisma.serviceOrder.findMany({ where: { ...where, status: { in: ['completed', 'delivered'] }, completedAt: { gte: startOfMonth } }, select: { openedAt: true, completedAt: true, totalAmount: true, laborAmount: true, partsAmount: true } }),
      this.prisma.mechanic.count({ where: { tenantId, isActive: true } }),
      this.prisma.serviceOrder.findMany({ where: { ...where, status: { in: ['in_progress', 'diagnosing'] }, mechanicId: { not: null } }, select: { mechanicId: true }, distinct: ['mechanicId'] }),
      this.prisma.serviceOrder.count({ where: { ...where, isRework: true, createdAt: { gte: startOfMonth } } }),
      this.prisma.serviceOrder.count({ where: { ...where, createdAt: { gte: startOfMonth } } }),
      this.prisma.warranty.count({ where: { tenantId, status: 'active' } }),
    ]);

    const durations = completedThisMonth.filter((o) => o.completedAt).map((o) => (o.completedAt!.getTime() - o.openedAt.getTime()) / (1000 * 60 * 60));
    const averageOrderDurationHours = durations.length > 0 ? Number((durations.reduce((s, d) => s + d, 0) / durations.length).toFixed(1)) : null;
    const totalRevenue = completedThisMonth.reduce((s, o) => s + Number(o.totalAmount), 0);

    return {
      vehiclesInService,
      openOrders,
      inProgressOrders,
      awaitingApprovalOrders,
      completedOrdersToday: completedToday,
      averageOrderDurationHours,
      averageTicket: completedThisMonth.length > 0 ? totalRevenue / completedThisMonth.length : 0,
      serviceRevenue: completedThisMonth.reduce((s, o) => s + Number(o.laborAmount), 0),
      partsRevenue: completedThisMonth.reduce((s, o) => s + Number(o.partsAmount), 0),
      availableMechanics: totalMechanics - busyMechanicIds.length,
      reworkRate: ordersThisMonth > 0 ? Number(((reworkThisMonth / ordersThisMonth) * 100).toFixed(1)) : 0,
      openWarranties,
    };
  }

  /** Agenda do dia (briefing) — atalho sobre a agenda da oficina, exposto aqui para o Dashboard. */
  getTodayAgenda(tenantId: string, branchId?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.workshopAppointment.findMany({
      where: { tenantId, ...(branchId ? { branchId } : {}), scheduledAt: { gte: startOfDay, lte: endOfDay } },
      include: { customer: { select: { name: true } }, mechanic: { include: { employee: { select: { name: true } } } }, box: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getOrdersByStatus(tenantId: string, branchId?: string) {
    const grouped = await this.prisma.serviceOrder.groupBy({ by: ['status'], where: { tenantId, ...(branchId ? { branchId } : {}) }, _count: true });
    return grouped.map((g) => ({ status: g.status, count: g._count }));
  }
}
