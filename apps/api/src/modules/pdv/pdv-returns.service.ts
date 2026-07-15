import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { StockService } from '@/modules/inventory/stock.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

export interface ReturnItemInput {
  saleItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Devoluções (briefing: "Devolução parcial, Devolução total, Troca,
 * Crédito ao cliente" — "estrutura preparada"). O fluxo de ponta a ponta
 * já funciona (cria o documento, e ao aprovar devolve o estoque via
 * `StockService.move('return_in')`, já existente desde a Sprint 06); o
 * que é "estrutura preparada" é o CRÉDITO AO CLIENTE — hoje só fica
 * registrado em `SaleReturn.creditAmount`, sem gerar automaticamente um
 * `PaymentMethod` do tipo `store_credit` utilizável numa venda futura
 * (isso exigiria um "saldo de crédito do cliente" rastreável, que é
 * trabalho de uma sprint de Financeiro do Cliente).
 */
@Injectable()
export class PdvReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, saleId: string, data: { type: 'partial' | 'total' | 'exchange'; reason: string; items: ReturnItemInput[] }) {
    const sale = await this.prisma.sale.findFirst({ where: { id: saleId, tenantId: ctx.tenantId } });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    if (sale.status !== 'paid' && sale.status !== 'partially_paid') throw new BadRequestException('Apenas vendas pagas podem ter devolução');

    const saleReturn = await this.prisma.saleReturn.create({
      data: {
        tenantId: ctx.tenantId,
        saleId,
        type: data.type as never,
        reason: data.reason,
        createdBy: ctx.userId,
        items: { create: data.items.map((item) => ({ tenantId: ctx.tenantId, ...item })) },
      },
      include: { items: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'SaleReturn', entityId: saleReturn.id, after: { type: data.type, reason: data.reason } });
    return saleReturn;
  }

  findAll(tenantId: string, saleId?: string) {
    return this.prisma.saleReturn.findMany({
      where: { tenantId, ...(saleId ? { saleId } : {}) },
      include: { items: { include: { product: { select: { internalCode: true, shortDescription: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Aprova a devolução: estoque volta (`return_in`) e, se houver crédito, registra `creditAmount` na devolução. */
  async approve(ctx: RequestContext, id: string, issueCredit: boolean) {
    const saleReturn = await this.prisma.saleReturn.findFirst({ where: { id, tenantId: ctx.tenantId }, include: { items: true, sale: { select: { warehouseId: true, code: true } } } });
    if (!saleReturn) throw new NotFoundException('Devolução não encontrada');
    if (saleReturn.status !== 'pending') throw new BadRequestException('Devolução já decidida');
    if (!saleReturn.sale.warehouseId) throw new BadRequestException('Venda original sem depósito definido');

    for (const item of saleReturn.items) {
      await this.stockService.move(ctx, {
        productId: item.productId,
        warehouseId: saleReturn.sale.warehouseId,
        type: 'return_in' as never,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitPrice),
        documentType: 'sale_return',
        documentId: saleReturn.id,
        reason: `Devolução da venda ${saleReturn.sale.code}`,
      });
    }

    const creditAmount = issueCredit ? saleReturn.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0) : 0;

    const updated = await this.prisma.saleReturn.update({
      where: { id },
      data: { status: 'completed', approvedBy: ctx.userId, approvedAt: new Date(), creditIssued: issueCredit, creditAmount },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'approve', entity: 'SaleReturn', entityId: id, after: { creditIssued: issueCredit, creditAmount } });
    return updated;
  }

  async reject(ctx: RequestContext, id: string, reason: string) {
    const saleReturn = await this.prisma.saleReturn.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!saleReturn) throw new NotFoundException('Devolução não encontrada');
    return this.prisma.saleReturn.update({ where: { id }, data: { status: 'rejected', reason: `${saleReturn.reason} | Rejeitada: ${reason}` } });
  }
}
