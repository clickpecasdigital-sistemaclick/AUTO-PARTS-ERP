import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { PdvCartRepository } from './pdv-cart.repository';
import { PdvDiscountService } from './pdv-discount.service';
import { StockRepository } from '@/modules/inventory/stock.repository';
import { AuditService } from '@/common/audit/audit.service';
import type { AddCartItemDto, OpenCartDto, SetCartCustomerDto, SetCartDiscountDto, UpdateCartItemDto } from './dto/cart.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Motor central do PDV. O carrinho É um `Sale` com `status: 'open'`
 * (nenhuma tabela paralela — reuso total do schema de Vendas da Sprint
 * 02). Cada modo de operação (`SaleMode`) usa exatamente este mesmo
 * fluxo; a única regra específica por modo hoje é `workshop` exigir
 * `customerVehicleId` — as demais diferenças (Venda Futura não baixar
 * estoque imediatamente, etc.) são responsabilidade de
 * `PdvCheckoutService` quando o modo for `future_sale`.
 *
 * Toda alteração relevante (inclusão de item, alteração de preço,
 * desconto, exclusão de item) é auditada individualmente — não apenas no
 * fechamento da venda — porque o briefing pede rastreabilidade desses
 * eventos específicos, não só do resultado final.
 */
@Injectable()
export class PdvCartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PdvCartRepository,
    private readonly discountService: PdvDiscountService,
    private readonly stockRepository: StockRepository,
    private readonly audit: AuditService,
  ) {}

  async openCart(ctx: RequestContext, branchId: string, dto: OpenCartDto) {
    if (dto.mode === 'workshop' && !dto.customerVehicleId) {
      throw new BadRequestException('Venda Oficina exige um veículo vinculado');
    }

    const count = await this.repository.countByTenant(ctx.tenantId);
    const code = `PDV-${String(count + 1).padStart(8, '0')}`;

    const sale = await this.repository.create({
      tenantId: ctx.tenantId,
      branchId,
      customerId: dto.customerId ?? (await this.getOrCreateWalkInCustomer(ctx, branchId)),
      customerVehicleId: dto.customerVehicleId,
      salespersonId: dto.salespersonId,
      cashRegisterId: dto.cashRegisterId,
      terminalId: dto.terminalId,
      warehouseId: dto.warehouseId,
      mode: dto.mode as never,
      code,
      status: 'open',
      createdBy: ctx.userId,
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'Sale', entityId: sale.id, after: { mode: dto.mode, code } });
    return sale;
  }

  async getCart(ctx: RequestContext, id: string) {
    const cart = await this.repository.findById(ctx.tenantId, id);
    if (!cart) throw new NotFoundException('Carrinho/venda não encontrado');
    return cart;
  }

  async addItem(ctx: RequestContext, saleId: string, dto: AddCartItemDto) {
    const cart = await this.getOpenCartOrThrow(ctx, saleId);

    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, tenantId: ctx.tenantId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const unitPrice = dto.unitPrice ?? Number(product.salePrice);
    const discountPercent = dto.discountPercent ?? 0;
    const discountAmount = dto.discountAmount ?? Number((unitPrice * dto.quantity * (discountPercent / 100)).toFixed(2));

    if (discountPercent > 0 || discountAmount > 0) {
      const effectivePercent = discountPercent || (discountAmount / (unitPrice * dto.quantity)) * 100;
      const check = await this.discountService.check({ tenantId: ctx.tenantId, userId: ctx.userId, customerId: cart.customerId, productId: dto.productId });
      if (effectivePercent > check.maxPercent) {
        throw new BadRequestException(`Desconto de ${effectivePercent.toFixed(1)}% excede o máximo permitido (${check.maxPercent}%) para este contexto`);
      }
    }

    const totalAmount = unitPrice * dto.quantity - discountAmount + (dto.surchargeAmount ?? 0);

    const item = await this.repository.addItem({
      tenantId: ctx.tenantId,
      saleId,
      productId: dto.productId,
      quantity: dto.quantity,
      unitPrice,
      unitCost: product.averageCostPrice,
      discountPercent,
      discountAmount,
      surchargeAmount: dto.surchargeAmount ?? 0,
      totalAmount,
      notes: dto.notes,
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'SaleItem', entityId: item.id, after: { productId: dto.productId, quantity: dto.quantity, unitPrice, discountAmount } });

    return this.repository.recalculateTotals(saleId);
  }

  async updateItem(ctx: RequestContext, saleId: string, itemId: string, dto: UpdateCartItemDto) {
    await this.getOpenCartOrThrow(ctx, saleId);
    const before = await this.repository.findItem(ctx.tenantId, itemId);
    if (!before) throw new NotFoundException('Item não encontrado');

    const quantity = dto.quantity ?? Number(before.quantity);
    const unitPrice = dto.unitPrice ?? Number(before.unitPrice);
    const discountPercent = dto.discountPercent ?? Number(before.discountPercent);
    const discountAmount = dto.discountAmount ?? (discountPercent ? Number((unitPrice * quantity * (discountPercent / 100)).toFixed(2)) : Number(before.discountAmount));
    const surchargeAmount = dto.surchargeAmount ?? Number(before.surchargeAmount);
    const totalAmount = unitPrice * quantity - discountAmount + surchargeAmount;

    const updated = await this.repository.updateItem(itemId, { quantity, unitPrice, discountPercent, discountAmount, surchargeAmount, totalAmount, notes: dto.notes });

    const priceChanged = dto.unitPrice !== undefined && dto.unitPrice !== Number(before.unitPrice);
    await this.audit.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: priceChanged ? 'price_change' : 'update',
      entity: 'SaleItem',
      entityId: itemId,
      before: { quantity: before.quantity, unitPrice: before.unitPrice, discountAmount: before.discountAmount },
      after: { quantity, unitPrice, discountAmount },
    });

    await this.repository.recalculateTotals(saleId);
    return updated;
  }

  async removeItem(ctx: RequestContext, saleId: string, itemId: string) {
    await this.getOpenCartOrThrow(ctx, saleId);
    const item = await this.repository.findItem(ctx.tenantId, itemId);
    if (!item) throw new NotFoundException('Item não encontrado');

    await this.repository.removeItem(itemId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'SaleItem', entityId: itemId, before: item });

    return this.repository.recalculateTotals(saleId);
  }

  async setCustomer(ctx: RequestContext, saleId: string, dto: SetCartCustomerDto) {
    await this.getOpenCartOrThrow(ctx, saleId);
    return this.repository.update(saleId, { customerId: dto.customerId, customerVehicleId: dto.customerVehicleId });
  }

  async setDiscount(ctx: RequestContext, saleId: string, dto: SetCartDiscountDto) {
    const cart = await this.getOpenCartOrThrow(ctx, saleId);
    const check = await this.discountService.check({ tenantId: ctx.tenantId, userId: ctx.userId, customerId: cart.customerId });
    const subtotal = Number(cart.subtotalAmount);
    const effectivePercent = subtotal > 0 ? ((dto.discountAmount ?? 0) / subtotal) * 100 : 0;
    if (effectivePercent > check.maxPercent) {
      throw new BadRequestException(`Desconto de ${effectivePercent.toFixed(1)}% excede o máximo permitido (${check.maxPercent}%)`);
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Sale', entityId: saleId, before: { discountAmount: cart.discountAmount }, after: { discountAmount: dto.discountAmount, reason: dto.reason } });

    await this.repository.update(saleId, { discountAmount: dto.discountAmount ?? 0 });
    return this.repository.recalculateTotals(saleId);
  }

  /** Disponibilidade em tempo real do item — exibida no carrinho antes de confirmar a venda (briefing). */
  async checkAvailability(productId: string, warehouseId: string) {
    const stock = await this.stockRepository.getStockBalance(productId, warehouseId);
    const onHand = Number(stock?.quantityOnHand ?? 0);
    const reserved = Number(stock?.quantityReserved ?? 0);
    return { onHand, reserved, available: onHand - reserved };
  }

  /** Formas de pagamento ativas — usado pela tela de checkout para montar a lista de opções. */
  listPaymentMethods(tenantId: string) {
    return this.prisma.paymentMethod.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });
  }

  private async getOpenCartOrThrow(ctx: RequestContext, saleId: string) {
    const cart = await this.repository.findById(ctx.tenantId, saleId);
    if (!cart) throw new NotFoundException('Carrinho/venda não encontrado');
    if (cart.status !== 'open') throw new BadRequestException('Esta venda já foi finalizada/cancelada e não pode mais ser editada');
    return cart;
  }

  /** "Criar cliente rápido" mínimo (Consumidor Final genérico) quando nenhum cliente é selecionado — briefing permite venda sem cadastro completo no Balcão/Venda Rápida. */
  private async getOrCreateWalkInCustomer(ctx: RequestContext, branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    const existing = await this.prisma.customer.findFirst({ where: { tenantId: ctx.tenantId, companyId: branch!.companyId, document: '00000000000' } });
    if (existing) return existing.id;

    const created = await this.prisma.customer.create({
      data: {
        tenantId: ctx.tenantId,
        companyId: branch!.companyId,
        personType: 'individual',
        customerType: 'final_consumer',
        document: '00000000000',
        name: 'Consumidor Final',
        status: 'active',
      },
    });
    return created.id;
  }
}
