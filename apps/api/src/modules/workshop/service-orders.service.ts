import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { ServiceOrdersRepository } from './service-orders.repository';
import { StockService } from '@/modules/inventory/stock.service';
import { StockRepository } from '@/modules/inventory/stock.repository';
import { AuditService } from '@/common/audit/audit.service';
import type { AddPartItemDto, AddServiceItemDto, CreateServiceOrderDto, QueryServiceOrderDto, UpdateDiagnosisDto } from './dto/service-order.dto';
import type { RequestContext } from '@/common/types/request-context';

const STATUS_FLOW: Record<string, string[]> = {
  open: ['diagnosing', 'cancelled'],
  diagnosing: ['awaiting_approval', 'cancelled'],
  awaiting_approval: ['approved', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  in_progress: ['awaiting_parts', 'completed', 'cancelled'],
  awaiting_parts: ['in_progress', 'cancelled'],
  completed: ['delivered'],
  delivered: [],
  cancelled: [],
};

/**
 * Ordens de Serviço — o núcleo do módulo Oficina. Cobre o ciclo
 * Agendamento(WorkshopAppointment)→Recepção→Check-in→Checklist→
 * Diagnóstico→Orçamento→Aprovação→Execução→Controle de
 * peças/mão-de-obra→Finalização→Entrega (briefing), com `STATUS_FLOW`
 * validando toda transição — nunca um pulo de status fora de ordem.
 * Controle de peças reaproveita `StockService.move()` (Sprint 06) e o
 * disponível considerando reserva, exatamente como o PDV (Sprint 09)
 * — nenhuma lógica de estoque duplicada aqui.
 */
@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: ServiceOrdersRepository,
    private readonly stockService: StockService,
    private readonly stockRepository: StockRepository,
    private readonly audit: AuditService,
  ) {}

  async findAll(ctx: RequestContext, query: QueryServiceOrderDto) {
    return this.repository.findMany(ctx.tenantId, query);
  }

  async findOne(ctx: RequestContext, id: string) {
    const order = await this.repository.findById(ctx.tenantId, id);
    if (!order) throw new NotFoundException('Ordem de Serviço não encontrada');
    return order;
  }

  async create(ctx: RequestContext, branchId: string, dto: CreateServiceOrderDto) {
    const count = await this.repository.countByTenant(ctx.tenantId);
    const code = `OS-${String(count + 1).padStart(6, '0')}`;

    const order = await this.repository.create({
      tenantId: ctx.tenantId,
      branchId,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      mechanicId: dto.mechanicId,
      consultantId: dto.consultantId,
      boxId: dto.boxId,
      appointmentId: dto.appointmentId,
      priority: dto.priority as never,
      complaint: dto.complaint,
      odometerKm: dto.odometerKm,
      code,
      createdBy: ctx.userId,
    });

    if (dto.appointmentId) {
      await this.prisma.workshopAppointment.update({ where: { id: dto.appointmentId }, data: { status: 'checked_in' } });
    }

    await this.repository.recordStatusChange(ctx.tenantId, order.id, null, 'open', ctx.userId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'ServiceOrder', entityId: order.id, after: { code, customerId: dto.customerId } });
    return order;
  }

  /** Transição de status — única porta de entrada para mudar `ServiceOrder.status`, valida o fluxo permitido. */
  async transitionStatus(ctx: RequestContext, id: string, toStatus: string, notes?: string) {
    const order = await this.findOne(ctx, id);
    const allowed = STATUS_FLOW[order.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(`Transição inválida: "${order.status}" não pode ir para "${toStatus}" (permitido: ${allowed.join(', ') || 'nenhuma'})`);
    }

    const extraData: Record<string, unknown> = {};
    if (toStatus === 'approved') extraData.approvedAt = new Date();
    if (toStatus === 'completed') extraData.completedAt = new Date();
    if (toStatus === 'cancelled') extraData.cancelledAt = new Date();

    const updated = await this.repository.update(id, { status: toStatus as never, ...extraData });
    await this.repository.recordStatusChange(ctx.tenantId, id, order.status, toStatus, ctx.userId, notes);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'ServiceOrder', entityId: id, before: { status: order.status }, after: { status: toStatus } });
    return updated;
  }

  async cancel(ctx: RequestContext, id: string, reason: string) {
    const order = await this.findOne(ctx, id);
    if (order.status === 'delivered') throw new BadRequestException('OS já entregue não pode ser cancelada');

    const updated = await this.repository.update(id, { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason });
    await this.repository.recordStatusChange(ctx.tenantId, id, order.status, 'cancelled', ctx.userId, reason);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'ServiceOrder', entityId: id, after: { reason } });
    return updated;
  }

  // --- Diagnóstico --------------------------------------------------------------

  async updateDiagnosis(ctx: RequestContext, id: string, dto: UpdateDiagnosisDto) {
    await this.findOne(ctx, id);
    const updated = await this.repository.update(id, dto as never);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'ServiceOrder', entityId: id, after: dto });
    return updated;
  }

  // --- Orçamento: itens de serviço (mão de obra) --------------------------------

  async addServiceItem(ctx: RequestContext, orderId: string, dto: AddServiceItemDto) {
    const service = await this.prisma.service.findFirst({ where: { id: dto.serviceId, tenantId: ctx.tenantId } });
    if (!service) throw new NotFoundException('Serviço não encontrado no catálogo');

    const quantity = dto.quantity ?? 1;
    const unitPrice = dto.unitPrice ?? Number(service.standardPrice);
    const item = await this.prisma.serviceOrderService.create({
      data: { tenantId: ctx.tenantId, serviceOrderId: orderId, serviceId: dto.serviceId, quantity, unitPrice, totalAmount: quantity * unitPrice },
    });

    await this.recalculateTotals(orderId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'ServiceOrderService', entityId: item.id, after: { serviceId: dto.serviceId, unitPrice } });
    return item;
  }

  async removeServiceItem(ctx: RequestContext, orderId: string, itemId: string) {
    await this.prisma.serviceOrderService.delete({ where: { id: itemId } });
    await this.recalculateTotals(orderId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'ServiceOrderService', entityId: itemId });
  }

  // --- Controle de peças (integração total com Estoque, briefing) ----------------------

  /** Adiciona a peça ao orçamento da OS — ainda não baixa estoque (isso só ocorre em `confirmPartsConsumption`, ao iniciar a execução). */
  async addPartItem(ctx: RequestContext, orderId: string, dto: AddPartItemDto) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, tenantId: ctx.tenantId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const unitPrice = dto.unitPrice ?? Number(product.salePrice);
    const item = await this.prisma.serviceOrderPart.create({
      data: { tenantId: ctx.tenantId, serviceOrderId: orderId, productId: dto.productId, quantity: dto.quantity, unitPrice, totalAmount: dto.quantity * unitPrice },
    });

    await this.recalculateTotals(orderId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'ServiceOrderPart', entityId: item.id, after: { productId: dto.productId, quantity: dto.quantity } });
    return item;
  }

  async removePartItem(ctx: RequestContext, orderId: string, itemId: string) {
    await this.prisma.serviceOrderPart.delete({ where: { id: itemId } });
    await this.recalculateTotals(orderId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'ServiceOrderPart', entityId: itemId });
  }

  /**
   * Confirma o consumo físico das peças (briefing: "Reservar, Baixar
   * estoque, Registrar movimentação, Atualizar custos, Registrar
   * auditoria") — chamado ao iniciar a execução (`in_progress`). Cada
   * peça gera um `StockMovement` tipo `service_order_out` via
   * `StockService.move()` (Sprint 06), que já cuida de validar
   * disponível e atualizar custo médio.
   */
  async confirmPartsConsumption(ctx: RequestContext, orderId: string, warehouseId: string) {
    const order = await this.findOne(ctx, orderId);
    if (order.parts.length === 0) return { consumed: 0 };

    for (const part of order.parts) {
      await this.stockService.move(ctx, {
        productId: part.productId,
        warehouseId,
        type: 'service_order_out' as never,
        quantity: Number(part.quantity),
        unitCost: Number(part.unitPrice),
        documentType: 'service_order',
        documentId: orderId,
        reason: `Consumo de peças — OS ${order.code}`,
      });
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'stock_adjustment', entity: 'ServiceOrder', entityId: orderId, after: { partsConsumed: order.parts.length } });
    return { consumed: order.parts.length };
  }

  /** Disponibilidade de uma peça antes de confirmar — mesma lógica do PDV (Sprint 09). */
  async checkPartAvailability(productId: string, warehouseId: string) {
    const stock = await this.stockRepository.getStockBalance(productId, warehouseId);
    const onHand = Number(stock?.quantityOnHand ?? 0);
    const reserved = Number(stock?.quantityReserved ?? 0);
    return { onHand, reserved, available: onHand - reserved };
  }

  /** Cria uma nova OS de retrabalho ligada à original (briefing: "Índice de retrabalho"). */
  async createRework(ctx: RequestContext, branchId: string, originalOrderId: string, complaint: string) {
    const original = await this.findOne(ctx, originalOrderId);
    const count = await this.repository.countByTenant(ctx.tenantId);
    const code = `OS-${String(count + 1).padStart(6, '0')}`;

    const rework = await this.repository.create({
      tenantId: ctx.tenantId,
      branchId,
      customerId: original.customerId,
      vehicleId: original.vehicleId,
      mechanicId: original.mechanicId,
      reworkOfId: originalOrderId,
      isRework: true,
      complaint,
      code,
      priority: 'high' as never,
      createdBy: ctx.userId,
    });

    await this.repository.recordStatusChange(ctx.tenantId, rework.id, null, 'open', ctx.userId, `Retrabalho da OS ${original.code}`);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'ServiceOrder', entityId: rework.id, after: { isRework: true, reworkOf: originalOrderId } });
    return rework;
  }

  private async recalculateTotals(orderId: string) {
    const [services, parts] = await Promise.all([
      this.prisma.serviceOrderService.findMany({ where: { serviceOrderId: orderId } }),
      this.prisma.serviceOrderPart.findMany({ where: { serviceOrderId: orderId } }),
    ]);
    const laborAmount = services.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const partsAmount = parts.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const order = await this.prisma.serviceOrder.findUnique({ where: { id: orderId } });
    const totalAmount = laborAmount + partsAmount - Number(order?.discountAmount ?? 0);

    return this.prisma.serviceOrder.update({ where: { id: orderId }, data: { laborAmount, partsAmount, totalAmount } });
  }
}
