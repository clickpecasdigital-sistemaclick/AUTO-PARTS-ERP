import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';
import type { CreateCheckInDto, CreateDeliveryDto, FillChecklistItemDto } from './dto/workshop-support.dto';

/** Check-in da OS (briefing: cliente/veículo já vêm da OS; aqui ficam KM, combustível, objetos, danos, assinatura, fotos/vídeos via Attachment). */
@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, serviceOrderId: string, dto: CreateCheckInDto) {
    const existing = await this.prisma.serviceOrderCheckIn.findUnique({ where: { serviceOrderId } });
    if (existing) throw new BadRequestException('Esta OS já possui check-in registrado');

    const checkIn = await this.prisma.serviceOrderCheckIn.create({
      data: { tenantId: ctx.tenantId, serviceOrderId, ...dto, checkedInBy: ctx.userId },
    });

    if (dto.odometerKm) {
      await this.prisma.serviceOrder.update({ where: { id: serviceOrderId }, data: { odometerKm: dto.odometerKm } });
    }

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'ServiceOrderCheckIn', entityId: checkIn.id, after: dto });
    return checkIn;
  }

  get(tenantId: string, serviceOrderId: string) {
    return this.prisma.serviceOrderCheckIn.findFirst({ where: { serviceOrderId, tenantId } });
  }

  /** Portaria — todos os check-ins recentes, independente da OS, pra monitorar entrada/saída de veículos na oficina. */
  listRecent(tenantId: string, limit = 50) {
    return this.prisma.serviceOrderCheckIn.findMany({
      where: { tenantId },
      include: {
        serviceOrder: {
          select: {
            code: true,
            status: true,
            customer: { select: { name: true } },
            vehicle: { select: { plate: true } },
          },
        },
      },
      orderBy: { checkedInAt: 'desc' },
      take: limit,
    });
  }

  /** Anexa foto/vídeo do check-in — reaproveita `Attachment` genérico (Sprint 08), entity="service_order_checkin". */
  listAttachments(tenantId: string, serviceOrderId: string) {
    return this.prisma.attachment.findMany({ where: { tenantId, entity: 'service_order_checkin', entityId: serviceOrderId }, orderBy: { createdAt: 'desc' } });
  }
}

/** Checklist Digital configurável (briefing: pneus/freios/suspensão/óleo/luzes/bateria/arrefecimento/ar-condicionado/limpadores/itens personalizados). */
@Injectable()
export class ChecklistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listTemplates(tenantId: string) {
    return this.prisma.checklistTemplate.findMany({ where: { tenantId, isActive: true }, include: { items: { orderBy: { position: 'asc' } } } });
  }

  createTemplate(tenantId: string, name: string, items: { label: string; position?: number }[]) {
    return this.prisma.checklistTemplate.create({
      data: { tenantId, name, items: { create: items.map((item, index) => ({ tenantId, label: item.label, position: item.position ?? index })) } },
      include: { items: true },
    });
  }

  async applyToServiceOrder(ctx: RequestContext, serviceOrderId: string, templateId: string) {
    const template = await this.prisma.checklistTemplate.findFirst({ where: { id: templateId, tenantId: ctx.tenantId }, include: { items: true } });
    if (!template) throw new NotFoundException('Modelo de checklist não encontrado');

    const checklist = await this.prisma.serviceOrderChecklist.create({
      data: {
        tenantId: ctx.tenantId,
        serviceOrderId,
        templateId,
        filledBy: ctx.userId,
        items: { create: template.items.map((item) => ({ tenantId: ctx.tenantId, templateItemId: item.id })) },
      },
      include: { items: { include: { templateItem: true } } },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'ServiceOrderChecklist', entityId: checklist.id, after: { templateId } });
    return checklist;
  }

  async fillItem(ctx: RequestContext, checklistId: string, dto: FillChecklistItemDto) {
    const item = await this.prisma.serviceOrderChecklistItem.findFirst({ where: { checklistId, templateItemId: dto.templateItemId, tenantId: ctx.tenantId } });
    if (!item) throw new NotFoundException('Item do checklist não encontrado');

    const updated = await this.prisma.serviceOrderChecklistItem.update({ where: { id: item.id }, data: { result: dto.result as never, notes: dto.notes } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'ServiceOrderChecklistItem', entityId: item.id, after: { result: dto.result } });
    return updated;
  }

  getByServiceOrder(tenantId: string, serviceOrderId: string) {
    return this.prisma.serviceOrderChecklist.findMany({ where: { tenantId, serviceOrderId }, include: { items: { include: { templateItem: true } } } });
  }
}

/** Entrega (briefing: Data, Hora, Responsável, Assinatura digital, Fotos, Pagamento). */
@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, serviceOrderId: string, dto: CreateDeliveryDto) {
    const order = await this.prisma.serviceOrder.findFirst({ where: { id: serviceOrderId, tenantId: ctx.tenantId } });
    if (!order) throw new NotFoundException('OS não encontrada');
    if (order.status !== 'completed') throw new BadRequestException('Apenas OS finalizadas (completed) podem ser entregues');

    const delivery = await this.prisma.serviceOrderDelivery.create({
      data: { tenantId: ctx.tenantId, serviceOrderId, ...dto, deliveredBy: ctx.userId },
    });

    await this.prisma.serviceOrder.update({ where: { id: serviceOrderId }, data: { status: 'delivered', deliveredAt: new Date() } });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'ServiceOrder', entityId: serviceOrderId, after: { status: 'delivered' } });
    return delivery;
  }

  /** Vincula a venda/cobrança gerada no PDV (Sprint 09) à entrega — ponto de integração financeira (briefing: "Pagamento (integração)"). */
  async linkSale(ctx: RequestContext, deliveryId: string, saleId: string) {
    const updated = await this.prisma.serviceOrderDelivery.update({ where: { id: deliveryId }, data: { saleId } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'ServiceOrderDelivery', entityId: deliveryId, after: { saleId } });
    return updated;
  }

  get(tenantId: string, serviceOrderId: string) {
    return this.prisma.serviceOrderDelivery.findFirst({ where: { serviceOrderId, tenantId } });
  }
}
