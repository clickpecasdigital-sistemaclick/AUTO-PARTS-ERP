import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { PurchaseApprovalsService } from './purchase-approvals.service';
import { AuditService } from '@/common/audit/audit.service';
import type { CreatePurchaseOrderDto, QueryPurchaseOrderDto } from './dto/purchase-order.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Pedido de Compra — peça central do ciclo. Pode nascer (a) manualmente
 * (`create`), (b) a partir de uma Cotação adjudicada
 * (`createFromQuotation`) ou (c) a partir de uma Sugestão de reposição
 * automática (consumido por `PurchaseSuggestionsService`). Sempre exige
 * aprovação conforme `PurchaseApprovalRule` antes de poder ser enviado ao
 * fornecedor (`send()`).
 */
@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PurchaseOrdersRepository,
    private readonly approvals: PurchaseApprovalsService,
    private readonly audit: AuditService,
  ) {}

  async findAll(ctx: RequestContext, query: QueryPurchaseOrderDto) {
    return this.repository.findMany(ctx.tenantId, query);
  }

  async findOne(ctx: RequestContext, id: string) {
    const order = await this.repository.findById(ctx.tenantId, id);
    if (!order) throw new NotFoundException('Pedido de compra não encontrado');
    return order;
  }

  async create(ctx: RequestContext, branchId: string, dto: CreatePurchaseOrderDto) {
    const code = await this.generateCode(ctx.tenantId);
    const totals = this.computeTotals(dto.items, dto.freightAmount, dto.discountAmount);

    const data: any = {
      tenantId: ctx.tenantId,
      branchId,
      supplierId: dto.supplierId,
      purchaseRequestId: dto.purchaseRequestId,
      quotationSupplierId: dto.quotationSupplierId,
      code,
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      freightAmount: dto.freightAmount ?? 0,
      discountAmount: dto.discountAmount ?? 0,
      totalAmount: totals.grandTotal,
      notes: dto.notes,
      items: {
        create: dto.items.map((item) => ({
          tenantId: ctx.tenantId,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          discountAmount: item.discountAmount ?? 0,
          totalAmount: item.quantity * item.unitCost - (item.discountAmount ?? 0),
        })),
      },
    };

    const order = await this.repository.create(ctx.tenantId, ctx.userId, data);

    if (dto.purchaseRequestId) {
      await this.prisma.purchaseRequest.update({ where: { id: dto.purchaseRequestId }, data: { status: 'converted' } });
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'PurchaseOrder', entityId: order.id, after: order });
    return order;
  }

  /** Gera o Pedido automaticamente a partir da Cotação adjudicada (briefing: "Gerar automaticamente a partir da cotação aprovada"). */
  async createFromQuotation(ctx: RequestContext, quotationSupplierId: string) {
    const quotationSupplier = await this.prisma.purchaseQuotationSupplier.findFirst({
      where: { id: quotationSupplierId, tenantId: ctx.tenantId },
      include: { items: true, quotation: true },
    });
    if (!quotationSupplier) throw new NotFoundException('Cotação/fornecedor não encontrada');
    if (!quotationSupplier.isWinner) throw new BadRequestException('Apenas a proposta vencedora pode gerar um Pedido de Compra');

    return this.create(ctx, quotationSupplier.quotation.branchId, {
      supplierId: quotationSupplier.supplierId,
      purchaseRequestId: quotationSupplier.quotation.purchaseRequestId ?? undefined,
      quotationSupplierId: quotationSupplier.id,
      freightAmount: Number(quotationSupplier.freightAmount),
      items: quotationSupplier.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitPrice) * (1 + Number(item.ipiRate) / 100),
      })),
    });
  }

  async send(ctx: RequestContext, id: string, estimatedValue: number) {
    const order = await this.findOne(ctx, id);
    if (order.status !== 'draft') throw new BadRequestException('Apenas pedidos em rascunho podem ser enviados');

    const result = await this.approvals.requestApprovals(ctx, { documentType: 'purchase_order', purchaseOrderId: id, value: estimatedValue });
    const status = result.autoApproved ? 'sent' : 'draft';

    return this.repository.update(id, ctx.userId, { status, approvedBy: result.autoApproved ? ctx.userId : undefined, approvedAt: result.autoApproved ? new Date() : undefined });
  }

  async approve(ctx: RequestContext, id: string) {
    const order = await this.findOne(ctx, id);
    const fullyApproved = await this.approvals.isFullyApproved(ctx.tenantId, { purchaseOrderId: id });
    if (!fullyApproved) throw new BadRequestException('Ainda há etapas de aprovação pendentes');

    const updated = await this.repository.update(id, ctx.userId, { status: 'sent', approvedBy: ctx.userId, approvedAt: new Date() });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'approve', entity: 'PurchaseOrder', entityId: id, before: { status: order.status }, after: { status: 'sent' } });
    return updated;
  }

  /** Duplicação — cria um novo Pedido (rascunho) com os mesmos itens/fornecedor, referenciando o original. */
  async duplicate(ctx: RequestContext, id: string) {
    const original = await this.findOne(ctx, id);
    const code = await this.generateCode(ctx.tenantId);

    const data: any = {
      tenantId: ctx.tenantId,
      branchId: original.branchId,
      supplierId: original.supplierId,
      parentOrderId: original.id,
      code,
      freightAmount: original.freightAmount,
      discountAmount: original.discountAmount,
      totalAmount: original.totalAmount,
      notes: original.notes,
      items: {
        create: original.items.map((item) => ({
          tenantId: ctx.tenantId,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          discountAmount: item.discountAmount,
          totalAmount: item.totalAmount,
        })),
      },
    };

    const duplicated = await this.repository.create(ctx.tenantId, ctx.userId, data);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'PurchaseOrder', entityId: duplicated.id, after: { duplicatedFrom: id } });
    return duplicated;
  }

  /** Reabertura — volta um pedido cancelado para rascunho. */
  async reopen(ctx: RequestContext, id: string) {
    const order = await this.findOne(ctx, id);
    if (order.status !== 'cancelled') throw new BadRequestException('Apenas pedidos cancelados podem ser reabertos');
    const updated = await this.repository.update(id, ctx.userId, { status: 'draft' });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'PurchaseOrder', entityId: id, after: { status: 'draft' } });
    return updated;
  }

  async cancel(ctx: RequestContext, id: string) {
    const order = await this.findOne(ctx, id);
    if (order.status === 'received') throw new BadRequestException('Pedido já totalmente recebido não pode ser cancelado');
    const updated = await this.repository.update(id, ctx.userId, { status: 'cancelled' });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'PurchaseOrder', entityId: id, before: { status: order.status }, after: { status: 'cancelled' } });
    return updated;
  }

  private async generateCode(tenantId: string): Promise<string> {
    const count = await this.repository.countByTenant(tenantId);
    return `PC-${String(count + 1).padStart(6, '0')}`;
  }

  private computeTotals(items: CreatePurchaseOrderDto['items'], freight = 0, discount = 0) {
    const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost - (item.discountAmount ?? 0), 0);
    return { itemsTotal, grandTotal: itemsTotal + freight - discount };
  }
}
