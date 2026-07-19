import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { StockService } from '@/modules/inventory/stock.service';
import { AuditService } from '@/common/audit/audit.service';
import { FiscalIssuanceService } from '@/modules/fiscal/fiscal-issuance.service';
import { CART_INCLUDE } from './pdv-cart.repository';
import type { CheckoutCartDto } from './dto/cart.dto';
import type { RequestContext } from '@/common/types/request-context';
import { StockMovementTypeDto } from '@/modules/inventory/dto/stock-movement.dto';

const CREDIT_PAYMENT_KINDS = ['bank_slip', 'in_house_installment'];

/**
 * Checkout — fecha o carrinho (`Sale.status: open -> paid/partially_paid`).
 * Objetivo de performance do briefing ("Finalização <2s, atualização de
 * estoque em transação única"): a baixa de estoque usa `StockService.move()`
 * (Sprint 06) por item — mesma estratégia já aceita na Sprint 07
 * (`GoodsReceiptsService.finalize`), já que cada `move()` é atômico
 * isoladamente (movimento + saldo na mesma transação Prisma); uma
 * transação ÚNICA cobrindo N produtos diferentes exigiria reescrever
 * `StockService`, o que violaria "não reescrever módulos existentes".
 * Para o caso comum do PDV (poucos itens), o tempo total fica bem abaixo
 * de 2s mesmo com N transações pequenas sequenciais.
 */
@Injectable()
export class PdvCheckoutService {
  private readonly logger = new Logger(PdvCheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly audit: AuditService,
    private readonly fiscalIssuance: FiscalIssuanceService,
  ) {}

  async checkout(ctx: RequestContext, saleId: string, dto: CheckoutCartDto) {
    const cart = await this.prisma.sale.findFirst({ where: { id: saleId, tenantId: ctx.tenantId }, include: CART_INCLUDE });
    if (!cart) throw new NotFoundException('Carrinho/venda não encontrado');
    if (cart.status !== 'open') throw new BadRequestException('Esta venda já foi finalizada/cancelada');
    if (cart.items.length === 0) throw new BadRequestException('Carrinho vazio');
    if (!cart.warehouseId) throw new BadRequestException('Depósito não definido para esta venda');

    const paymentTotal = dto.payments.reduce((sum, p) => sum + p.amount, 0);
    const total = Number(cart.totalAmount);
    if (paymentTotal < total - 0.01) {
      throw new BadRequestException(`Pagamentos (R$ ${paymentTotal.toFixed(2)}) não cobrem o total da venda (R$ ${total.toFixed(2)})`);
    }

    const paymentMethods: { id: string; kind: string }[] = await this.prisma.paymentMethod.findMany({ where: { id: { in: dto.payments.map((p) => p.paymentMethodId) }, tenantId: ctx.tenantId } });
    const methodById = new Map(paymentMethods.map((m) => [m.id, m] as const));

    // Venda Futura não baixa estoque imediatamente — apenas registra a
    // intenção; a baixa real ocorre quando o pedido futuro for
    // efetivamente entregue (fluxo de Pedido/Reserva, já existente).
    if (cart.mode !== 'future_sale') {
      for (const item of cart.items) {
        await this.stockService.move(ctx, {
          productId: item.productId,
          warehouseId: cart.warehouseId,
          type: StockMovementTypeDto.sale_out,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          documentType: 'sale',
          documentId: cart.id,
          reason: `Venda ${cart.code}`,
        });
      }
    }

    for (const payment of dto.payments) {
      await this.prisma.salePayment.create({
        data: { tenantId: ctx.tenantId, saleId, paymentMethodId: payment.paymentMethodId, amount: payment.amount, installments: payment.installments ?? 1 },
      });
    }

    const creditPortion = dto.payments
      .filter((p) => CREDIT_PAYMENT_KINDS.includes(methodById.get(p.paymentMethodId)?.kind ?? ''))
      .reduce((sum, p) => sum + p.amount, 0);

    if (creditPortion > 0) {
      const creditPayment = dto.payments.find((p) => CREDIT_PAYMENT_KINDS.includes(methodById.get(p.paymentMethodId)?.kind ?? ''));
      await this.createReceivable(ctx, cart, creditPortion, creditPayment?.installments ?? 1);
    }

    if (cart.salespersonId) {
      await this.generateCommission(ctx, cart);
    }

    const status = paymentTotal < total - 0.01 ? 'partially_paid' : 'paid';
    const finalized = await this.prisma.sale.update({ where: { id: saleId }, data: { status, notes: dto.notes }, include: CART_INCLUDE });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Sale', entityId: saleId, after: { status, totalAmount: total, paymentTotal } });

    // NFC-e automática (briefing: "quando finalizar uma venda, gerar
    // automaticamente NF-e/DANFE"). Só roda se o branch já tiver
    // Configuração Fiscal — sem isso, `getFiscalConfig` lançaria e
    // quebraria TODA venda; como a maioria dos tenants ainda não
    // configurou o fiscal, isso precisa ser silencioso (loga e segue).
    if (cart.mode !== 'future_sale') {
      try {
        await this.fiscalIssuance.issueNfce(
          ctx,
          cart.branchId,
          saleId,
          cart.items.map((item) => ({
            productId: item.productId,
            cfopCode: '5102',
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discountAmount: Number(item.discountAmount ?? 0),
          })),
        );
      } catch (error) {
        this.logger.warn(`NFC-e automática não gerada para a venda ${cart.code}: ${error instanceof Error ? error.message : error}`);
      }
    }

    return finalized;
  }

  async cancel(ctx: RequestContext, saleId: string, reason: string) {
    const cart = await this.prisma.sale.findFirst({ where: { id: saleId, tenantId: ctx.tenantId } });
    if (!cart) throw new NotFoundException('Venda não encontrada');
    if (cart.status !== 'open') throw new BadRequestException('Apenas vendas em aberto (carrinho) podem ser canceladas diretamente — vendas pagas exigem estorno');

    const updated = await this.prisma.sale.update({ where: { id: saleId }, data: { status: 'cancelled', cancelledAt: new Date(), cancelledBy: ctx.userId, cancelReason: reason } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'Sale', entityId: saleId, after: { status: 'cancelled', reason } });
    return updated;
  }

  /** Estorno de venda já paga — devolve estoque (StockMovement de entrada) e marca a venda como refunded. */
  async refund(ctx: RequestContext, saleId: string, reason: string) {
    const cart = await this.prisma.sale.findFirst({ where: { id: saleId, tenantId: ctx.tenantId }, include: { items: true } });
    if (!cart) throw new NotFoundException('Venda não encontrada');
    if (cart.status !== 'paid' && cart.status !== 'partially_paid') throw new BadRequestException('Apenas vendas pagas podem ser estornadas');
    if (!cart.warehouseId) throw new BadRequestException('Depósito não definido para esta venda');

    for (const item of cart.items) {
      await this.stockService.move(ctx, {
        productId: item.productId,
        warehouseId: cart.warehouseId,
        type: StockMovementTypeDto.return_in,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        documentType: 'sale_refund',
        documentId: cart.id,
        reason: `Estorno da venda ${cart.code} — ${reason}`,
      });
    }

    const updated = await this.prisma.sale.update({ where: { id: saleId }, data: { status: 'refunded', refundedAt: new Date(), refundedBy: ctx.userId } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'Sale', entityId: saleId, after: { status: 'refunded', reason } });
    return updated;
  }

  private async createReceivable(ctx: RequestContext, cart: { id: string; code: string; customerId: string; branchId: string }, amount: number, installments: number) {
    const branch = await this.prisma.branch.findUnique({ where: { id: cart.branchId } });
    const installmentValue = Number((amount / installments).toFixed(2));

    for (let i = 1; i <= installments; i++) {
      await this.prisma.accountsReceivable.create({
        data: {
          tenantId: ctx.tenantId,
          companyId: branch!.companyId,
          customerId: cart.customerId,
          saleId: cart.id,
          documentNumber: cart.code,
          installmentNumber: i,
          totalInstallments: installments,
          amount: installmentValue,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * i),
        },
      });
    }
  }

  private async generateCommission(ctx: RequestContext, cart: { id: string; salespersonId: string | null; totalAmount: unknown }) {
    if (!cart.salespersonId) return;
    const salesperson = await this.prisma.salesperson.findUnique({ where: { id: cart.salespersonId } });
    if (!salesperson) return;

    const baseAmount = Number(cart.totalAmount);
    const rate = Number(salesperson.commissionRate);
    const amount = baseAmount * (rate / 100);
    if (amount <= 0) return;

    await this.prisma.commission.create({
      data: { tenantId: ctx.tenantId, salespersonId: cart.salespersonId, saleId: cart.id, baseAmount, rate, amount },
    });
  }
}
