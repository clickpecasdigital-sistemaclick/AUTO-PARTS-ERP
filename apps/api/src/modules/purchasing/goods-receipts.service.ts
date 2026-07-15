import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import { StockService } from '@/modules/inventory/stock.service';
import type { ConferGoodsReceiptItemDto, CreateGoodsReceiptDto } from './dto/goods-receipt.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Recebimento e Conferência — etapa que fecha o ciclo físico da compra.
 * Fluxo: `create()` registra o recebimento (transportadora, volumes,
 * peso, frete, NF do fornecedor) → `conferItem()` confere cada item
 * (manual, código de barras, QR Code ou coletor — `conferredVia`) com
 * aceite/recusa parcial → `finalize()` SÓ então entra no estoque
 * (`StockService.move`, Sprint 06 — atualiza saldo E custo médio
 * automaticamente), audita e gera o ponto de integração financeira
 * (`AccountsPayable`, Sprint 02).
 */
@Injectable()
export class GoodsReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, dto: CreateGoodsReceiptDto) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, tenantId: ctx.tenantId },
      include: { items: true },
    });
    if (!purchaseOrder) throw new NotFoundException('Pedido de compra não encontrado');
    if (purchaseOrder.status === 'cancelled') throw new BadRequestException('Pedido cancelado não pode receber mercadoria');

    const count = await this.prisma.goodsReceipt.count({ where: { tenantId: ctx.tenantId } });
    const code = `REC-${String(count + 1).padStart(6, '0')}`;

    const receipt = await this.prisma.goodsReceipt.create({
      data: {
        tenantId: ctx.tenantId,
        purchaseOrderId: dto.purchaseOrderId,
        warehouseId: dto.warehouseId,
        carrierId: dto.carrierId,
        invoiceNumber: dto.invoiceNumber,
        volumes: dto.volumes,
        weightKg: dto.weightKg,
        freightAmount: dto.freightAmount,
        driverName: dto.driverName,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        notes: dto.notes,
        code,
        createdBy: ctx.userId,
        items: {
          create: purchaseOrder.items
            .filter((item) => Number(item.quantity) > Number(item.receivedQuantity))
            .map((item) => ({
              tenantId: ctx.tenantId,
              purchaseOrderItemId: item.id,
              productId: item.productId,
              quantity: Number(item.quantity) - Number(item.receivedQuantity),
              unitCost: item.unitCost,
            })),
        },
      },
      include: { items: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'receive', entity: 'GoodsReceipt', entityId: receipt.id, after: receipt });
    return receipt;
  }

  /** Confere um item — manual, código de barras, QR Code ou coletor de dados (briefing). */
  async conferItem(ctx: RequestContext, receiptId: string, dto: ConferGoodsReceiptItemDto) {
    const item = await this.prisma.goodsReceiptItem.findFirst({ where: { id: dto.goodsReceiptItemId, goodsReceiptId: receiptId, tenantId: ctx.tenantId } });
    if (!item) throw new NotFoundException('Item de recebimento não encontrado');

    const total = dto.acceptedQuantity + (dto.rejectedQuantity ?? 0);
    if (total > Number(item.quantity)) {
      throw new BadRequestException(`Quantidade conferida (${total}) maior que a quantidade do recebimento (${Number(item.quantity)})`);
    }

    const disposition =
      dto.rejectedQuantity && dto.rejectedQuantity > 0
        ? total < Number(item.quantity)
          ? 'partially_accepted'
          : dto.acceptedQuantity === 0
            ? 'rejected'
            : 'partially_accepted'
        : 'accepted';

    const updated = await this.prisma.goodsReceiptItem.update({
      where: { id: dto.goodsReceiptItemId },
      data: {
        acceptedQuantity: dto.acceptedQuantity,
        rejectedQuantity: dto.rejectedQuantity ?? 0,
        disposition,
        conferredVia: dto.conferredVia ?? 'manual',
        occurrenceNotes: dto.occurrenceNotes,
        conferredAt: new Date(),
        conferredBy: ctx.userId,
      },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'confer', entity: 'GoodsReceiptItem', entityId: item.id, after: { acceptedQuantity: dto.acceptedQuantity, rejectedQuantity: dto.rejectedQuantity, disposition } });
    return updated;
  }

  /** Busca produto/item por código de barras ou QR Code lido pelo coletor — usado pela tela de conferência. */
  async lookupItemByCode(ctx: RequestContext, receiptId: string, code: string) {
    const product = await this.prisma.product.findFirst({ where: { tenantId: ctx.tenantId, OR: [{ barcode: code }, { internalCode: code }] } });
    if (!product) throw new NotFoundException('Nenhum produto encontrado para este código');

    const item = await this.prisma.goodsReceiptItem.findFirst({ where: { goodsReceiptId: receiptId, productId: product.id } });
    if (!item) throw new NotFoundException('Este produto não faz parte deste recebimento');
    return item;
  }

  /**
   * Finaliza o recebimento: para cada item conferido, gera `StockMovement`
   * (`purchase_in`, via `StockService.move()` — atualiza saldo e custo
   * médio automaticamente, Sprint 06), atualiza `receivedQuantity`/
   * `lastPurchasePrice` no pedido/fornecedor, e cria as parcelas de
   * `AccountsPayable` (Sprint 02) — o ponto de integração financeira
   * pedido pelo briefing.
   */
  async finalize(ctx: RequestContext, receiptId: string, installments = 1) {
    const receipt = await this.prisma.goodsReceipt.findFirst({
      where: { id: receiptId, tenantId: ctx.tenantId },
      include: { items: true, purchaseOrder: { include: { branch: { select: { companyId: true } } } } },
    });
    if (!receipt) throw new NotFoundException('Recebimento não encontrado');
    if (receipt.status === 'confirmed') throw new BadRequestException('Recebimento já finalizado');

    const conferred = receipt.items.filter((item) => item.disposition !== 'pending');
    if (conferred.length === 0) throw new BadRequestException('Nenhum item foi conferido ainda');

    for (const item of conferred) {
      if (Number(item.acceptedQuantity) <= 0) continue;
      await this.stockService.move(ctx, {
        productId: item.productId,
        warehouseId: receipt.warehouseId,
        type: 'purchase_in' as never,
        quantity: Number(item.acceptedQuantity),
        unitCost: Number(item.unitCost),
        documentType: 'goods_receipt',
        documentId: receipt.id,
        reason: `Recebimento ${receipt.code} — Pedido ${receipt.purchaseOrderId}`,
      });

      await this.prisma.purchaseOrderItem.update({
        where: { id: item.purchaseOrderItemId },
        data: { receivedQuantity: { increment: Number(item.acceptedQuantity) } },
      });
    }

    const order = await this.prisma.purchaseOrder.findUnique({ where: { id: receipt.purchaseOrderId }, include: { items: true } });
    const fullyReceived = order!.items.every((item) => Number(item.receivedQuantity) >= Number(item.quantity));
    await this.prisma.purchaseOrder.update({ where: { id: receipt.purchaseOrderId }, data: { status: fullyReceived ? 'received' : 'partially_received' } });

    const totalValue = conferred.reduce((sum, item) => sum + Number(item.acceptedQuantity) * Number(item.unitCost), 0);
    await this.createAccountsPayable(ctx, receipt, totalValue, installments);

    const confirmed = await this.prisma.goodsReceipt.update({ where: { id: receiptId }, data: { status: 'confirmed' } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'confer', entity: 'GoodsReceipt', entityId: receiptId, after: { status: 'confirmed', totalValue } });
    return confirmed;
  }

  list(tenantId: string, purchaseOrderId?: string) {
    return this.prisma.goodsReceipt.findMany({
      where: { tenantId, ...(purchaseOrderId ? { purchaseOrderId } : {}) },
      include: { items: { include: { product: { select: { id: true, internalCode: true, shortDescription: true } } } }, carrier: true },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const receipt = await this.prisma.goodsReceipt.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: { select: { id: true, internalCode: true, shortDescription: true } } } }, carrier: true, purchaseOrder: { select: { code: true, supplierId: true } } },
    });
    if (!receipt) throw new NotFoundException('Recebimento não encontrado');
    return receipt;
  }

  /** Ponto de integração financeira (briefing: "Gerar automaticamente Contas a Pagar / Parcelas / Centro de custo / Fluxo de caixa previsto"). */
  private async createAccountsPayable(ctx: RequestContext, receipt: { purchaseOrderId: string; purchaseOrder: { branch: { companyId: string } } }, totalValue: number, installments: number) {
    const order = await this.prisma.purchaseOrder.findUnique({ where: { id: receipt.purchaseOrderId } });
    if (!order) return;

    const installmentValue = Number((totalValue / installments).toFixed(2));
    const parent = await this.prisma.accountsPayable.create({
      data: {
        tenantId: ctx.tenantId,
        companyId: receipt.purchaseOrder.branch.companyId,
        supplierId: order.supplierId,
        purchaseOrderId: order.id,
        documentNumber: order.code,
        installmentNumber: 1,
        totalInstallments: installments,
        amount: installmentValue,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        createdBy: ctx.userId,
      },
    });

    for (let i = 2; i <= installments; i++) {
      await this.prisma.accountsPayable.create({
        data: {
          tenantId: ctx.tenantId,
          companyId: receipt.purchaseOrder.branch.companyId,
          supplierId: order.supplierId,
          purchaseOrderId: order.id,
          parentId: parent.id,
          documentNumber: order.code,
          installmentNumber: i,
          totalInstallments: installments,
          amount: installmentValue,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * i),
          createdBy: ctx.userId,
        },
      });
    }
  }
}
