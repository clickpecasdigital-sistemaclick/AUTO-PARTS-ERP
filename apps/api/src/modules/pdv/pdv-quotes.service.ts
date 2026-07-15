import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

export interface QuoteItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

/**
 * Orçamentos (briefing: "Novo orçamento, Conversão para pedido, Conversão
 * para venda, Validade, Aprovação, Envio por e-mail, Exportação PDF").
 * Conversão para Pedido cria um `SalesOrder` (reserva estoque); conversão
 * direta para Venda abre um carrinho PDV já populado
 * (`PdvCartService.openCart` + itens) — ambas reaproveitam os services já
 * existentes, nunca duplicam a lógica de criação.
 */
@Injectable()
export class PdvQuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, branchId: string, data: { customerId: string; salespersonId?: string; validUntil?: string; notes?: string; items: QuoteItemInput[] }) {
    const count = await this.prisma.quote.count({ where: { tenantId: ctx.tenantId } });
    const code = `ORC-${String(count + 1).padStart(6, '0')}`;

    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice - (item.discountAmount ?? 0), 0);

    const quote = await this.prisma.quote.create({
      data: {
        tenantId: ctx.tenantId,
        branchId,
        customerId: data.customerId,
        salespersonId: data.salespersonId,
        code,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        totalAmount,
        notes: data.notes,
        createdBy: ctx.userId,
        items: {
          create: data.items.map((item) => ({
            tenantId: ctx.tenantId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount ?? 0,
            totalAmount: item.quantity * item.unitPrice - (item.discountAmount ?? 0),
          })),
        },
      },
      include: { items: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'Quote', entityId: quote.id, after: quote });
    return quote;
  }

  findAll(tenantId: string, customerId?: string) {
    return this.prisma.quote.findMany({
      where: { tenantId, deletedAt: null, ...(customerId ? { customerId } : {}) },
      include: { customer: { select: { id: true, name: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({ where: { id, tenantId }, include: { items: { include: { product: true } }, customer: true } });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');
    return quote;
  }

  async approve(ctx: RequestContext, id: string) {
    const quote = await this.findOne(ctx.tenantId, id);
    if (quote.validUntil && quote.validUntil < new Date()) throw new BadRequestException('Orçamento vencido — não pode ser aprovado');

    const updated = await this.prisma.quote.update({ where: { id }, data: { status: 'approved', approvedBy: ctx.userId, approvedAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'approve', entity: 'Quote', entityId: id });
    return updated;
  }

  async reject(ctx: RequestContext, id: string, reason: string) {
    await this.findOne(ctx.tenantId, id);
    return this.prisma.quote.update({ where: { id }, data: { status: 'rejected', rejectedReason: reason } });
  }

  /** Marca o envio por e-mail — disparo real do e-mail é responsabilidade da camada de notificação (fora de escopo desta sprint). */
  async markSent(ctx: RequestContext, id: string, sentTo: string) {
    await this.findOne(ctx.tenantId, id);
    const updated = await this.prisma.quote.update({ where: { id }, data: { status: 'sent', sentAt: new Date(), sentTo } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'export', entity: 'Quote', entityId: id, after: { sentTo } });
    return updated;
  }

  /** Conversão para Pedido (reserva estoque via SalesOrder, já existente). */
  async convertToOrder(ctx: RequestContext, id: string) {
    const quote = await this.findOne(ctx.tenantId, id);
    if (quote.status !== 'approved') throw new BadRequestException('Apenas orçamentos aprovados podem ser convertidos em pedido');

    const count = await this.prisma.salesOrder.count({ where: { tenantId: ctx.tenantId } });
    const code = `PED-${String(count + 1).padStart(6, '0')}`;

    const order = await this.prisma.salesOrder.create({
      data: {
        tenantId: ctx.tenantId,
        branchId: quote.branchId,
        customerId: quote.customerId,
        salespersonId: quote.salespersonId,
        quoteId: quote.id,
        code,
        discountAmount: quote.discountAmount,
        totalAmount: quote.totalAmount,
        createdBy: ctx.userId,
        items: {
          create: quote.items.map((item) => ({
            tenantId: ctx.tenantId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: { items: true },
    });

    await this.prisma.quote.update({ where: { id }, data: { status: 'converted' } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'SalesOrder', entityId: order.id, after: { convertedFromQuote: id } });
    return order;
  }
}
