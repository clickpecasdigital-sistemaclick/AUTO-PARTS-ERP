import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export const CART_INCLUDE = {
  customer: { select: { id: true, name: true, tradeName: true, creditLimit: true, creditStatus: true, document: true } },
  customerVehicle: true,
  salesperson: { include: { employee: { select: { name: true } } } },
  terminal: true,
  items: { include: { product: { select: { id: true, internalCode: true, shortDescription: true, unit: { select: { code: true } } } } } },
  payments: { include: { paymentMethod: true } },
} satisfies any;

export type CartWithRelations = any;

/**
 * Repository do carrinho do PDV. O "carrinho" É um `Sale` com
 * `status: 'open'` — sem tabela paralela (reuso total do schema de
 * Vendas, Sprint 02). `recalculateTotals` é chamado depois de toda
 * alteração de item, mantendo `Sale.subtotalAmount`/`discountAmount`/
 * `totalAmount` sempre consistentes com a soma dos itens.
 */
@Injectable()
export class PdvCartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string) {
    return this.prisma.sale.findFirst({ where: { id, tenantId }, include: CART_INCLUDE });
  }

  listOpenByTerminal(tenantId: string, terminalId: string) {
    return this.prisma.sale.findMany({ where: { tenantId, terminalId, status: 'open' }, include: CART_INCLUDE, orderBy: { createdAt: 'desc' } });
  }

  create(data: any) {
    return this.prisma.sale.create({ data, include: CART_INCLUDE });
  }

  async recalculateTotals(saleId: string) {
    const items = await this.prisma.saleItem.findMany({ where: { saleId } });
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
    const itemsDiscount = items.reduce((sum, item) => sum + Number(item.discountAmount), 0);
    const itemsSurcharge = items.reduce((sum, item) => sum + Number(item.surchargeAmount), 0);

    const sale = await this.prisma.sale.findUnique({ where: { id: saleId } });
    const saleLevelDiscount = sale ? Number(sale.discountAmount) : 0;
    // discountAmount no nível da venda é editável separadamente (setDiscount);
    // aqui só recompomos subtotal/total a partir dos itens + esse desconto adicional.
    const total = Math.max(0, subtotal - itemsDiscount - saleLevelDiscount + itemsSurcharge);

    return this.prisma.sale.update({
      where: { id: saleId },
      data: { subtotalAmount: subtotal, totalAmount: total },
      include: CART_INCLUDE,
    });
  }

  update(id: string, data: any) {
    return this.prisma.sale.update({ where: { id }, data, include: CART_INCLUDE });
  }

  addItem(data: any) {
    return this.prisma.saleItem.create({ data });
  }

  updateItem(id: string, data: any) {
    return this.prisma.saleItem.update({ where: { id }, data });
  }

  removeItem(id: string) {
    return this.prisma.saleItem.delete({ where: { id } });
  }

  findItem(tenantId: string, itemId: string) {
    return this.prisma.saleItem.findFirst({ where: { id: itemId, tenantId } });
  }

  countByTenant(tenantId: string) {
    return this.prisma.sale.count({ where: { tenantId } });
  }
}
