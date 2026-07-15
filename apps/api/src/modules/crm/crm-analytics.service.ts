import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface CrmDashboardKpis {
  newCustomersThisMonth: number;
  activeCustomers: number;
  inactiveCustomers: number;
  leadConversionRate: number;
  followUpsPending: number;
  followUpsOverdue: number;
}

/**
 * Dashboard CRM (briefing): KPIs, Novos Clientes, Clientes Ativos/
 * Inativos, Conversão, Vendas por Cliente, Top Clientes, Top
 * Fornecedores, Aniversariantes, Follow-ups Pendentes, Mapa de Clientes,
 * Linha do Tempo. Top Fornecedores reaproveita o ranking já calculado
 * pela Sprint 07 (`Supplier360Service`) via consulta direta — sem
 * duplicar a lógica de pontualidade/lead time aqui.
 */
@Injectable()
export class CrmAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(tenantId: string): Promise<CrmDashboardKpis> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [newCustomers, activeCustomers, inactiveCustomers, totalLeads, convertedLeads, followUpsPending, followUpsOverdue] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId, createdAt: { gte: startOfMonth }, deletedAt: null } }),
      this.prisma.customer.count({ where: { tenantId, status: 'active', deletedAt: null } }),
      this.prisma.customer.count({ where: { tenantId, status: 'inactive', deletedAt: null } }),
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.lead.count({ where: { tenantId, status: 'converted' } }),
      this.prisma.crmTask.count({ where: { tenantId, status: 'pending' } }),
      this.prisma.crmTask.count({ where: { tenantId, status: 'pending', dueAt: { lt: new Date() } } }),
    ]);

    return {
      newCustomersThisMonth: newCustomers,
      activeCustomers,
      inactiveCustomers,
      leadConversionRate: totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0,
      followUpsPending,
      followUpsOverdue,
    };
  }

  /** Top clientes por valor comprado (usa o snapshot denormalizado da Sprint 08 MDM — sem agregação pesada). */
  async getTopCustomers(tenantId: string, limit = 10) {
    return this.prisma.customer.findMany({
      where: { tenantId, deletedAt: null, totalPurchasesCount: { gt: 0 } },
      orderBy: [{ largestPurchaseValue: 'desc' }],
      take: limit,
      select: { id: true, name: true, tradeName: true, totalPurchasesCount: true, averageTicketValue: true, largestPurchaseValue: true, lastPurchaseAt: true },
    });
  }

  /** Top fornecedores — reaproveita o histórico real de PurchaseOrder (mesmo dado-base do Supplier360Service, Sprint 07). */
  async getTopSuppliers(tenantId: string, limit = 10) {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const grouped = await this.prisma.purchaseOrder.groupBy({
      by: ['supplierId'],
      where: { tenantId, issueDate: { gte: startOfYear } },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });
    const suppliers: { id: string; name: string; tradeName: string | null }[] = await this.prisma.supplier.findMany({ where: { id: { in: grouped.map((g) => g.supplierId) } }, select: { id: true, name: true, tradeName: true } });
    const byId = new Map(suppliers.map((s) => [s.id, s] as const));
    return grouped.map((g) => ({ supplierId: g.supplierId, name: byId.get(g.supplierId)?.tradeName ?? byId.get(g.supplierId)?.name ?? '—', totalPurchased: Number(g._sum.totalAmount ?? 0), ordersCount: g._count }));
  }

  /** Vendas por cliente (mês atual) — alimenta gráfico/lista do Dashboard. */
  async getSalesByCustomer(tenantId: string, limit = 10) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const grouped = await this.prisma.sale.groupBy({
      by: ['customerId'],
      where: { tenantId, createdAt: { gte: startOfMonth }, status: { not: 'cancelled' } },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });
    const customers = await this.prisma.customer.findMany({ where: { id: { in: grouped.map((g) => g.customerId) } }, select: { id: true, name: true } });
    const byId = new Map(customers.map((c) => [c.id, c.name]));
    return grouped.map((g) => ({ customerId: g.customerId, customerName: byId.get(g.customerId) ?? '—', total: Number(g._sum.totalAmount ?? 0) }));
  }

  /** Mapa de Clientes — coordenadas já cadastradas (Customer.latitude/longitude ou endereço padrão). */
  async getCustomerMap(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, deletedAt: null, latitude: { not: null }, longitude: { not: null } },
      select: { id: true, name: true, latitude: true, longitude: true, city: true, state: true },
    });
    return customers.map((c) => ({ ...c, latitude: Number(c.latitude), longitude: Number(c.longitude) }));
  }

  /** Linha do tempo de novos clientes/oportunidades ganhas — últimos N dias. */
  async getTimeline(tenantId: string, days = 30) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
    const [customers, wonOpportunities] = await Promise.all([
      this.prisma.customer.findMany({ where: { tenantId, createdAt: { gte: since } }, select: { createdAt: true } }),
      this.prisma.crmOpportunity.findMany({ where: { tenantId, closedAt: { gte: since }, pipelineStage: { isWon: true } }, select: { closedAt: true, value: true } }),
    ]);

    const byDay = new Map<string, { newCustomers: number; wonValue: number }>();
    for (const c of customers) {
      const key = c.createdAt.toISOString().slice(0, 10);
      const entry = byDay.get(key) ?? { newCustomers: 0, wonValue: 0 };
      entry.newCustomers++;
      byDay.set(key, entry);
    }
    for (const o of wonOpportunities) {
      const key = o.closedAt!.toISOString().slice(0, 10);
      const entry = byDay.get(key) ?? { newCustomers: 0, wonValue: 0 };
      entry.wonValue += Number(o.value);
      byDay.set(key, entry);
    }

    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, data]) => ({ date, ...data }));
  }
}
