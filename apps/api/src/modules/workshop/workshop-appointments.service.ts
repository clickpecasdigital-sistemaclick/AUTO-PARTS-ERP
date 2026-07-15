import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';
import type { CreateAppointmentDto } from './dto/workshop-support.dto';

/**
 * Agenda da Oficina (briefing: "Agendamento por mecânico/box/serviço,
 * Reagendamento, Cancelamento, Confirmação, Lista de espera, Agenda
 * diária/semanal/mensal"). `create()` detecta conflito de horário (mesmo
 * mecânico OU mesmo box sobrepondo o intervalo) e, se houver, marca como
 * `waitlisted` em vez de rejeitar — a lista de espera nasce automática do
 * conflito de agenda, não é um modo separado escolhido manualmente.
 */
@Injectable()
export class WorkshopAppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(ctx: RequestContext, branchId: string, dto: CreateAppointmentDto) {
    const duration = dto.durationMinutes ?? 60;
    const start = new Date(dto.scheduledAt);
    const end = new Date(start.getTime() + duration * 60_000);

    const hasConflict = await this.hasConflict(ctx.tenantId, dto.mechanicId, dto.boxId, start, end);

    const appointment = await this.prisma.workshopAppointment.create({
      data: {
        tenantId: ctx.tenantId,
        branchId,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        mechanicId: dto.mechanicId,
        boxId: dto.boxId,
        serviceId: dto.serviceId,
        scheduledAt: start,
        durationMinutes: duration,
        status: hasConflict ? 'waitlisted' : 'scheduled',
        notes: dto.notes,
        createdBy: ctx.userId,
      },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'WorkshopAppointment', entityId: appointment.id, after: { scheduledAt: dto.scheduledAt, waitlisted: hasConflict } });
    return appointment;
  }

  /** Agenda diária/semanal/mensal (briefing) — um único método parametrizado por intervalo de datas, a granularidade é decisão do chamador (frontend escolhe o range). */
  async getAgenda(tenantId: string, startDate: Date, endDate: Date, mechanicId?: string, boxId?: string) {
    return this.prisma.workshopAppointment.findMany({
      where: { tenantId, scheduledAt: { gte: startDate, lte: endDate }, ...(mechanicId ? { mechanicId } : {}), ...(boxId ? { boxId } : {}) },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, plate: true } },
        mechanic: { include: { employee: { select: { name: true } } } },
        box: true,
        service: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  listWaitlist(tenantId: string) {
    return this.prisma.workshopAppointment.findMany({ where: { tenantId, status: 'waitlisted' }, include: { customer: { select: { name: true } } }, orderBy: { createdAt: 'asc' } });
  }

  async confirm(ctx: RequestContext, id: string) {
    const appointment = await this.getOrThrow(ctx.tenantId, id);
    if (appointment.status !== 'scheduled') throw new BadRequestException('Apenas agendamentos com status "scheduled" podem ser confirmados');
    return this.prisma.workshopAppointment.update({ where: { id }, data: { status: 'confirmed' } });
  }

  async reschedule(ctx: RequestContext, id: string, newScheduledAt: string, durationMinutes?: number) {
    const appointment = await this.getOrThrow(ctx.tenantId, id);
    const duration = durationMinutes ?? appointment.durationMinutes;
    const start = new Date(newScheduledAt);
    const end = new Date(start.getTime() + duration * 60_000);

    const hasConflict = await this.hasConflict(ctx.tenantId, appointment.mechanicId, appointment.boxId, start, end, id);

    const rescheduled = await this.prisma.workshopAppointment.create({
      data: {
        tenantId: ctx.tenantId,
        branchId: appointment.branchId,
        customerId: appointment.customerId,
        vehicleId: appointment.vehicleId,
        mechanicId: appointment.mechanicId,
        boxId: appointment.boxId,
        serviceId: appointment.serviceId,
        scheduledAt: start,
        durationMinutes: duration,
        status: hasConflict ? 'waitlisted' : 'scheduled',
        rescheduledFromId: id,
        createdBy: ctx.userId,
      },
    });

    await this.prisma.workshopAppointment.update({ where: { id }, data: { status: 'rescheduled' } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'WorkshopAppointment', entityId: id, after: { rescheduledTo: rescheduled.id } });
    return rescheduled;
  }

  async cancel(ctx: RequestContext, id: string, reason: string) {
    await this.getOrThrow(ctx.tenantId, id);
    const updated = await this.prisma.workshopAppointment.update({ where: { id }, data: { status: 'cancelled', cancelReason: reason } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'WorkshopAppointment', entityId: id, after: { reason } });
    return updated;
  }

  async markNoShow(ctx: RequestContext, id: string) {
    await this.getOrThrow(ctx.tenantId, id);
    return this.prisma.workshopAppointment.update({ where: { id }, data: { status: 'no_show' } });
  }

  private async hasConflict(tenantId: string, mechanicId: string | null | undefined, boxId: string | null | undefined, start: Date, end: Date, excludeId?: string): Promise<boolean> {
    if (!mechanicId && !boxId) return false;

    const overlapping = await this.prisma.workshopAppointment.findMany({
      where: {
        tenantId,
        status: { in: ['scheduled', 'confirmed'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [...(mechanicId ? [{ mechanicId }] : []), ...(boxId ? [{ boxId }] : [])],
      },
    });

    return overlapping.some((appt) => {
      const apptEnd = new Date(appt.scheduledAt.getTime() + appt.durationMinutes * 60_000);
      return start < apptEnd && end > appt.scheduledAt;
    });
  }

  private async getOrThrow(tenantId: string, id: string) {
    const appointment = await this.prisma.workshopAppointment.findFirst({ where: { id, tenantId } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }
}
