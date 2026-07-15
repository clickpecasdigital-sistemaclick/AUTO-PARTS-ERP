import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface Customer360Timeline {
  id: string;
  type: 'sale' | 'quote' | 'sales_order' | 'service_order' | 'invoice' | 'payment' | 'interaction' | 'appointment' | 'support_ticket' | 'opportunity';
  title: string;
  value?: number;
  status?: string;
  occurredAt: Date;
}

/**
 * Visão 360° do Cliente (briefing: "Compras, Orçamentos, Pedidos, OS,
 * Notas, Financeiro, Pagamentos, Mensagens, E-mails, WhatsApp, Chamados,
 * Atendimentos — tudo em uma visão única"). Agrega SOMENTE leitura, sem
 * tabela própria — cada item da timeline aponta para a tabela
 * transacional real (Sale, Quote, ServiceOrder, FiscalInvoice,
 * Interaction, SupportTicket, CrmOpportunity), nunca duplica dado.
 */
@Injectable()
export class Customer360Service {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeline(tenantId: string, customerId: string): Promise<Customer360Timeline[]> {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const [sales, quotes, salesOrders, serviceOrders, invoices, receivables, interactions, appointments, tickets, opportunities] = await Promise.all([
      this.prisma.sale.findMany({ where: { tenantId, customerId }, select: { id: true, code: true, totalAmount: true, status: true, createdAt: true } }),
      this.prisma.quote.findMany({ where: { tenantId, customerId }, select: { id: true, code: true, totalAmount: true, status: true, createdAt: true } }),
      this.prisma.salesOrder.findMany({ where: { tenantId, customerId }, select: { id: true, code: true, totalAmount: true, status: true, createdAt: true } }),
      this.prisma.serviceOrder.findMany({ where: { tenantId, customerId }, select: { id: true, code: true, totalAmount: true, status: true, createdAt: true } }),
      this.prisma.fiscalInvoice.findMany({ where: { tenantId, customerId }, select: { id: true, number: true, series: true, totalAmount: true, status: true, issueDate: true } }),
      this.prisma.accountsReceivable.findMany({ where: { tenantId, customerId }, select: { id: true, documentNumber: true, amount: true, status: true, dueDate: true, receivedAt: true } }),
      this.prisma.interaction.findMany({ where: { tenantId, customerId }, select: { id: true, channel: true, summary: true, createdAt: true } }),
      this.prisma.appointment.findMany({ where: { tenantId, customerId }, select: { id: true, title: true, status: true, scheduledAt: true } }),
      this.prisma.supportTicket.findMany({ where: { tenantId, customerId }, select: { id: true, subject: true, status: true, createdAt: true } }),
      this.prisma.crmOpportunity.findMany({ where: { tenantId, customerId }, select: { id: true, title: true, value: true, createdAt: true } }),
    ]);

    const timeline: Customer360Timeline[] = [
      ...sales.map((s) => ({ id: s.id, type: 'sale' as const, title: `Venda ${s.code}`, value: Number(s.totalAmount), status: s.status, occurredAt: s.createdAt })),
      ...quotes.map((q) => ({ id: q.id, type: 'quote' as const, title: `Orçamento ${q.code}`, value: Number(q.totalAmount), status: q.status, occurredAt: q.createdAt })),
      ...salesOrders.map((o) => ({ id: o.id, type: 'sales_order' as const, title: `Pedido ${o.code}`, value: Number(o.totalAmount), status: o.status, occurredAt: o.createdAt })),
      ...serviceOrders.map((o) => ({ id: o.id, type: 'service_order' as const, title: `OS ${o.code}`, value: Number(o.totalAmount), status: o.status, occurredAt: o.createdAt })),
      ...invoices.map((i) => ({ id: i.id, type: 'invoice' as const, title: `NF-e ${i.series}/${i.number}`, value: Number(i.totalAmount), status: i.status, occurredAt: i.issueDate })),
      ...receivables.filter((r) => r.receivedAt).map((r) => ({ id: r.id, type: 'payment' as const, title: `Pagamento ${r.documentNumber}`, value: Number(r.amount), status: r.status, occurredAt: r.receivedAt! })),
      ...interactions.map((i) => ({ id: i.id, type: 'interaction' as const, title: `${i.channel}: ${i.summary}`, occurredAt: i.createdAt })),
      ...appointments.map((a) => ({ id: a.id, type: 'appointment' as const, title: a.title, status: a.status, occurredAt: a.scheduledAt })),
      ...tickets.map((t) => ({ id: t.id, type: 'support_ticket' as const, title: `Chamado: ${t.subject}`, status: t.status, occurredAt: t.createdAt })),
      ...opportunities.map((o) => ({ id: o.id, type: 'opportunity' as const, title: `Oportunidade: ${o.title}`, value: Number(o.value), occurredAt: o.createdAt })),
    ];

    return timeline.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async getSummary(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const [salesCount, openTickets, pendingOpportunities, vehiclesCount] = await Promise.all([
      this.prisma.sale.count({ where: { tenantId, customerId, status: { not: 'cancelled' } } }),
      this.prisma.supportTicket.count({ where: { tenantId, customerId, status: { in: ['open', 'in_progress'] } } }),
      this.prisma.crmOpportunity.count({ where: { tenantId, customerId, closedAt: null } }),
      this.prisma.customerVehicle.count({ where: { tenantId, customerId, deletedAt: null } }),
    ]);

    return { customer, salesCount, openTickets, pendingOpportunities, vehiclesCount };
  }
}
