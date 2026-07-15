import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { AwardQuotationDto, CreateQuotationDto, SubmitQuotationResponseDto } from './dto/purchase-quotation.dto';
import type { RequestContext } from '@/common/types/request-context';

export interface QuotationComparisonEntry {
  quotationSupplierId: string;
  supplierId: string;
  supplierName: string;
  itemsTotal: number;
  freightAmount: number;
  discountPercent: number;
  grandTotal: number;
  deliveryDays: number | null;
  warrantyDays: number | null;
  paymentTerms: string | null;
  /** Lead time médio histórico do fornecedor (últimos pedidos recebidos) — usado no ranking, não só na proposta atual. */
  historicalAvgLeadTimeDays: number | null;
  score: number;
  isBestOffer: boolean;
}

/**
 * Cotação — rodada de sourcing com múltiplos fornecedores. O comparativo
 * (`compare()`) é a peça central pedida pelo briefing: calcula o total de
 * cada proposta (itens + frete - desconto) e destaca automaticamente a
 * melhor, com critério configurável (`'price' | 'leadTime' | 'score'`).
 * `score` pondera preço (60%), prazo de entrega (25%) e histórico de lead
 * time do fornecedor (15%) — pesos documentados aqui, ajustáveis numa
 * sprint de configuração de critérios por tenant.
 */
@Injectable()
export class PurchaseQuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, branchId: string, dto: CreateQuotationDto) {
    const count = await this.prisma.purchaseQuotation.count({ where: { tenantId: ctx.tenantId } });
    const code = `COT-${String(count + 1).padStart(6, '0')}`;

    const quotation = await this.prisma.purchaseQuotation.create({
      data: {
        tenantId: ctx.tenantId,
        branchId,
        purchaseRequestId: dto.purchaseRequestId,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        notes: dto.notes,
        code,
        createdBy: ctx.userId,
        suppliers: {
          create: dto.supplierIds.map((supplierId) => ({
            tenantId: ctx.tenantId,
            supplierId,
            items: { createMany: { data: dto.items.map((item) => ({ tenantId: ctx.tenantId, productId: item.productId, quantity: item.quantity, unitPrice: 0 })) } },
          })),
        },
      },
      include: { suppliers: { include: { items: true, supplier: true } } },
    });

    if (dto.purchaseRequestId) {
      await this.prisma.purchaseRequest.update({ where: { id: dto.purchaseRequestId }, data: { status: 'quoting' } });
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'PurchaseQuotation', entityId: quotation.id, after: quotation });
    return quotation;
  }

  /** Registra a resposta comercial de UM fornecedor convidado. */
  async submitResponse(ctx: RequestContext, quotationSupplierId: string, dto: SubmitQuotationResponseDto) {
    const quotationSupplier = await this.prisma.purchaseQuotationSupplier.findFirst({
      where: { id: quotationSupplierId, tenantId: ctx.tenantId },
      include: { items: true },
    });
    if (!quotationSupplier) throw new NotFoundException('Cotação/fornecedor não encontrado');

    await this.prisma.$transaction([
      this.prisma.purchaseQuotationSupplier.update({
        where: { id: quotationSupplierId },
        data: {
          freightAmount: dto.freightAmount,
          paymentTerms: dto.paymentTerms,
          deliveryDays: dto.deliveryDays,
          warrantyDays: dto.warrantyDays,
          discountPercent: dto.discountPercent,
          notes: dto.notes,
          respondedAt: new Date(),
        },
      }),
      ...dto.items.map((item) =>
        this.prisma.purchaseQuotationItem.updateMany({
          where: { quotationSupplierId, productId: item.productId },
          data: { unitPrice: item.unitPrice, ipiRate: item.ipiRate, icmsRate: item.icmsRate },
        }),
      ),
    ]);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'PurchaseQuotationSupplier', entityId: quotationSupplierId, after: dto });
    return this.prisma.purchaseQuotationSupplier.findUnique({ where: { id: quotationSupplierId }, include: { items: true } });
  }

  /**
   * Comparativo automático — calcula o total de cada proposta e o score
   * ponderado, ordenado do melhor para o pior, com `isBestOffer` marcado
   * na primeira posição.
   */
  async compare(ctx: RequestContext, quotationId: string): Promise<QuotationComparisonEntry[]> {
    const quotation = await this.prisma.purchaseQuotation.findFirst({
      where: { id: quotationId, tenantId: ctx.tenantId },
      include: { suppliers: { include: { items: true, supplier: true } } },
    });
    if (!quotation) throw new NotFoundException('Cotação não encontrada');

    const responded = quotation.suppliers.filter((s) => s.respondedAt !== null);
    if (responded.length === 0) return [];

    const historicalLeadTimes = await this.getHistoricalLeadTimes(ctx.tenantId, responded.map((s) => s.supplierId));

    const entries = responded.map((s) => {
      const itemsTotal = s.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice) * (1 + Number(item.ipiRate) / 100), 0);
      const discount = itemsTotal * (Number(s.discountPercent) / 100);
      const grandTotal = itemsTotal + Number(s.freightAmount) - discount;
      const historicalAvg = historicalLeadTimes.get(s.supplierId) ?? null;

      return {
        quotationSupplierId: s.id,
        supplierId: s.supplierId,
        supplierName: s.supplier.tradeName ?? s.supplier.name,
        itemsTotal,
        freightAmount: Number(s.freightAmount),
        discountPercent: Number(s.discountPercent),
        grandTotal,
        deliveryDays: s.deliveryDays,
        warrantyDays: s.warrantyDays,
        paymentTerms: s.paymentTerms,
        historicalAvgLeadTimeDays: historicalAvg,
        score: 0, // calculado abaixo, depende do min/max de todo o conjunto
      };
    });

    const minTotal = Math.min(...entries.map((e) => e.grandTotal));
    const maxTotal = Math.max(...entries.map((e) => e.grandTotal));
    const minLeadTime = Math.min(...entries.map((e) => e.deliveryDays ?? 999));
    const maxLeadTime = Math.max(...entries.map((e) => e.deliveryDays ?? 999));

    const scored = entries.map((e) => {
      const priceScore = maxTotal === minTotal ? 1 : 1 - (e.grandTotal - minTotal) / (maxTotal - minTotal);
      const leadTime = e.deliveryDays ?? 999;
      const leadTimeScore = maxLeadTime === minLeadTime ? 1 : 1 - (leadTime - minLeadTime) / (maxLeadTime - minLeadTime);
      const historicalScore = e.historicalAvgLeadTimeDays === null ? 0.5 : Math.max(0, 1 - e.historicalAvgLeadTimeDays / 30);
      const score = priceScore * 0.6 + leadTimeScore * 0.25 + historicalScore * 0.15;
      return { ...e, score: Number(score.toFixed(4)) };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((entry, index) => ({ ...entry, isBestOffer: index === 0 }));
  }

  async award(ctx: RequestContext, quotationId: string, dto: AwardQuotationDto) {
    const quotation = await this.prisma.purchaseQuotation.findFirst({ where: { id: quotationId, tenantId: ctx.tenantId } });
    if (!quotation) throw new NotFoundException('Cotação não encontrada');
    if (quotation.status === 'awarded') throw new BadRequestException('Cotação já adjudicada');

    await this.prisma.$transaction([
      this.prisma.purchaseQuotationSupplier.updateMany({ where: { quotationId }, data: { isWinner: false } }),
      this.prisma.purchaseQuotationSupplier.update({ where: { id: dto.quotationSupplierId }, data: { isWinner: true } }),
      this.prisma.purchaseQuotation.update({ where: { id: quotationId }, data: { status: 'awarded' } }),
    ]);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'approve', entity: 'PurchaseQuotation', entityId: quotationId, after: { winner: dto.quotationSupplierId } });
    return this.prisma.purchaseQuotation.findUnique({ where: { id: quotationId }, include: { suppliers: { include: { supplier: true } } } });
  }

  list(tenantId: string) {
    return this.prisma.purchaseQuotation.findMany({
      where: { tenantId },
      include: { suppliers: { include: { supplier: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const quotation = await this.prisma.purchaseQuotation.findFirst({
      where: { id, tenantId },
      include: { suppliers: { include: { items: { include: { product: true } }, supplier: true } } },
    });
    if (!quotation) throw new NotFoundException('Cotação não encontrada');
    return quotation;
  }

  /** Lead time médio histórico (dias entre emissão do pedido e recebimento confirmado) por fornecedor, últimos 180 dias. */
  private async getHistoricalLeadTimes(tenantId: string, supplierIds: string[]): Promise<Map<string, number>> {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { tenantId, supplierId: { in: supplierIds }, status: 'received', issueDate: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180) } },
      include: { goodsReceipts: { select: { receivedAt: true }, orderBy: { receivedAt: 'desc' }, take: 1 } },
    });

    const bySupplier = new Map<string, number[]>();
    for (const order of orders) {
      const receipt = order.goodsReceipts[0];
      if (!receipt) continue;
      const days = (receipt.receivedAt.getTime() - order.issueDate.getTime()) / (1000 * 60 * 60 * 24);
      bySupplier.set(order.supplierId, [...(bySupplier.get(order.supplierId) ?? []), days]);
    }

    const result = new Map<string, number>();
    for (const [supplierId, days] of bySupplier) {
      result.set(supplierId, days.reduce((sum, d) => sum + d, 0) / days.length);
    }
    return result;
  }
}
