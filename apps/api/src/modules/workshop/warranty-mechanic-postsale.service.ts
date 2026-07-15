import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';
import type { ClaimWarrantyDto, CreateWarrantyDto } from './dto/workshop-support.dto';

/** Garantias (briefing: garantia de peças/serviços, prazo, histórico, acionamentos, custos). */
@Injectable()
export class WarrantiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, serviceOrderId: string, dto: CreateWarrantyDto) {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + dto.termDays);

    const warranty = await this.prisma.warranty.create({
      data: { tenantId: ctx.tenantId, serviceOrderId, ...dto, startDate, endDate },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'Warranty', entityId: warranty.id, after: dto });
    return warranty;
  }

  listByServiceOrder(tenantId: string, serviceOrderId: string) {
    return this.prisma.warranty.findMany({ where: { tenantId, serviceOrderId } });
  }

  listActive(tenantId: string) {
    return this.prisma.warranty.findMany({ where: { tenantId, status: 'active', endDate: { gte: new Date() } }, include: { serviceOrder: { select: { code: true, customerId: true } } } });
  }

  async claim(ctx: RequestContext, id: string, dto: ClaimWarrantyDto) {
    const warranty = await this.prisma.warranty.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!warranty) throw new NotFoundException('Garantia não encontrada');
    if (warranty.status !== 'active') throw new BadRequestException('Apenas garantias ativas podem ser acionadas');
    if (warranty.endDate < new Date()) throw new BadRequestException('Garantia vencida');

    const updated = await this.prisma.warranty.update({
      where: { id },
      data: { status: 'claimed', claimedAt: new Date(), claimCost: dto.claimCost, claimNotes: dto.claimNotes },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Warranty', entityId: id, after: { status: 'claimed', claimCost: dto.claimCost } });
    return updated;
  }

  async void(ctx: RequestContext, id: string, reason: string) {
    const updated = await this.prisma.warranty.update({ where: { id }, data: { status: 'voided', claimNotes: reason } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Warranty', entityId: id, after: { status: 'voided', reason } });
    return updated;
  }
}

/** Painel do Mecânico (briefing: agenda, serviços, horas, eficiência, retrabalho, comissões). */
@Injectable()
export class MechanicPanelService {
  constructor(private readonly prisma: PrismaService) {}

  async getPanel(tenantId: string, mechanicId: string, sinceDays = 30) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * sinceDays);

    const [orders, timeEntries, commissions, reworkCount] = await Promise.all([
      this.prisma.serviceOrder.findMany({ where: { tenantId, mechanicId, createdAt: { gte: since } }, select: { id: true, status: true, estimatedMinutes: true, isRework: true } }),
      this.prisma.mechanicTimeEntry.findMany({ where: { tenantId, mechanicId, startedAt: { gte: since } } }),
      this.prisma.commission.aggregate({ where: { tenantId, mechanicId, createdAt: { gte: since } }, _sum: { amount: true } }),
      this.prisma.serviceOrder.count({ where: { tenantId, mechanicId, isRework: true, createdAt: { gte: since } } }),
    ]);

    const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'delivered');
    const totalEstimatedMinutes = completedOrders.reduce((sum, o) => sum + (o.estimatedMinutes ?? 0), 0);
    const totalWorkedHours = timeEntries
      .filter((e) => e.endedAt)
      .reduce((sum, e) => sum + (e.endedAt!.getTime() - e.startedAt.getTime()) / (1000 * 60 * 60), 0);

    // Eficiência: horas estimadas / horas realmente trabalhadas — >100% significa mais rápido que o previsto.
    const efficiency = totalWorkedHours > 0 ? Number(((totalEstimatedMinutes / 60 / totalWorkedHours) * 100).toFixed(1)) : null;
    const reworkRate = orders.length > 0 ? Number(((reworkCount / orders.length) * 100).toFixed(1)) : 0;

    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalWorkedHours: Number(totalWorkedHours.toFixed(1)),
      efficiency,
      reworkCount,
      reworkRate,
      commissionAccrued: Number(commissions._sum.amount ?? 0),
    };
  }

  getAgenda(tenantId: string, mechanicId: string, startDate: Date, endDate: Date) {
    return this.prisma.workshopAppointment.findMany({
      where: { tenantId, mechanicId, scheduledAt: { gte: startDate, lte: endDate } },
      include: { customer: { select: { name: true } }, service: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}

/** Pós-venda (briefing: pesquisa de satisfação, NPS, retorno programado, lembrete de revisão, histórico). */
@Injectable()
export class PostSaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async sendSurvey(ctx: RequestContext, serviceOrderId: string) {
    return this.prisma.customerSatisfactionSurvey.create({ data: { tenantId: ctx.tenantId, serviceOrderId } });
  }

  async respondSurvey(ctx: RequestContext, surveyId: string, npsScore: number, satisfactionScore: number, comments?: string) {
    const updated = await this.prisma.customerSatisfactionSurvey.update({
      where: { id: surveyId },
      data: { npsScore, satisfactionScore, comments, respondedAt: new Date() },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'CustomerSatisfactionSurvey', entityId: surveyId, after: { npsScore, satisfactionScore } });
    return updated;
  }

  /** Classifica NPS em Detrator(0-6)/Neutro(7-8)/Promotor(9-10) e calcula o score agregado (% promotores - % detratores). */
  async getNpsSummary(tenantId: string, sinceDays = 90) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * sinceDays);
    const surveys = await this.prisma.customerSatisfactionSurvey.findMany({ where: { tenantId, respondedAt: { gte: since }, npsScore: { not: null } } });

    const promoters = surveys.filter((s) => s.npsScore! >= 9).length;
    const detractors = surveys.filter((s) => s.npsScore! <= 6).length;
    const total = surveys.length;

    return {
      totalResponses: total,
      promoters,
      neutrals: total - promoters - detractors,
      detractors,
      npsScore: total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null,
    };
  }

  /** Agenda lembrete de revisão — chamado ao finalizar uma OS de manutenção (ex: troca de óleo a cada 6 meses). */
  async scheduleRevisionReminder(ctx: RequestContext, serviceOrderId: string, customerId: string, monthsAhead = 6) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + monthsAhead);

    return this.prisma.serviceFollowUp.create({
      data: { tenantId: ctx.tenantId, serviceOrderId, customerId, type: 'revision_reminder', dueDate },
    });
  }

  listPending(tenantId: string) {
    return this.prisma.serviceFollowUp.findMany({ where: { tenantId, status: 'pending' }, include: { customer: { select: { name: true, phone: true } } }, orderBy: { dueDate: 'asc' } });
  }

  async complete(ctx: RequestContext, id: string, notes?: string) {
    const updated = await this.prisma.serviceFollowUp.update({ where: { id }, data: { status: 'completed', completedAt: new Date(), notes } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'ServiceFollowUp', entityId: id, after: { status: 'completed' } });
    return updated;
  }

  getCustomerHistory(tenantId: string, customerId: string) {
    return this.prisma.serviceFollowUp.findMany({ where: { tenantId, customerId }, orderBy: { dueDate: 'desc' } });
  }
}
