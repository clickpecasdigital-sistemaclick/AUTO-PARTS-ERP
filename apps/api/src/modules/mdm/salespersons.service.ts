import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/** Vendedores — metas, comissões, ranking, vendas, clientes, agenda (briefing). */
@Injectable()
export class SalespersonsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.salesperson.findMany({ where: { tenantId, isActive: true }, include: { employee: { select: { id: true, name: true, photoUrl: true } } } });
  }

  async findOne(tenantId: string, id: string) {
    const salesperson = await this.prisma.salesperson.findFirst({ where: { id, tenantId }, include: { employee: true } });
    if (!salesperson) throw new NotFoundException('Vendedor não encontrado');
    return salesperson;
  }

  /** Performance do mês: vendas realizadas x meta, comissão acumulada. */
  async getPerformance(tenantId: string, salespersonId: string) {
    const salesperson = await this.findOne(tenantId, salespersonId);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [salesAgg, commissionsAgg, customersCount] = await Promise.all([
      this.prisma.sale.aggregate({ where: { tenantId, salespersonId, createdAt: { gte: startOfMonth }, status: { not: 'cancelled' } }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.commission.aggregate({ where: { tenantId, salespersonId, createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      this.prisma.sale.findMany({ where: { tenantId, salespersonId }, distinct: ['customerId'], select: { customerId: true } }),
    ]);

    const totalSold = Number(salesAgg._sum.totalAmount ?? 0);
    const goal = Number(salesperson.monthlyGoal ?? 0);

    return {
      totalSoldThisMonth: totalSold,
      salesCount: salesAgg._count,
      goalProgress: goal > 0 ? Number(((totalSold / goal) * 100).toFixed(1)) : null,
      commissionAccrued: Number(commissionsAgg._sum.amount ?? 0),
      uniqueCustomersServed: customersCount.length,
    };
  }

  /** Ranking de vendedores do mês — ordenado por valor vendido. */
  async getRanking(tenantId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const grouped = await this.prisma.sale.groupBy({
      by: ['salespersonId'],
      where: { tenantId, createdAt: { gte: startOfMonth }, status: { not: 'cancelled' }, salespersonId: { not: null } },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
    });

    const salespersonIds = grouped.map((g) => g.salespersonId).filter((id): id is string => !!id);
    const salespersons: { id: string; employee: { name: string; photoUrl: string | null } | null }[] = await this.prisma.salesperson.findMany({ where: { id: { in: salespersonIds } }, include: { employee: { select: { name: true, photoUrl: true } } } });
    const byId = new Map(salespersons.map((s) => [s.id, s] as const));

    return grouped.map((g, index) => ({
      position: index + 1,
      salespersonId: g.salespersonId!,
      name: byId.get(g.salespersonId!)?.employee?.name ?? '—',
      photoUrl: byId.get(g.salespersonId!)?.employee?.photoUrl ?? null,
      totalSold: Number(g._sum.totalAmount ?? 0),
    }));
  }
}
