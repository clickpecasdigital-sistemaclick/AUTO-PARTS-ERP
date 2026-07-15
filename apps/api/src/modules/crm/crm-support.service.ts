import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { CreateCampaignDto, CreateCrmTagDto, CreateCrmTaskDto, CreateSupportTicketDto } from './dto/crm.dto';

/** Tarefas do CRM (briefing: "Follow-up, Ligações, Tarefas, Visitas"). */
@Injectable()
export class CrmTasksService {
  constructor(private readonly prisma: PrismaService) {}

  listPending(tenantId: string, assignedTo?: string) {
    return this.prisma.crmTask.findMany({
      where: { tenantId, status: 'pending', ...(assignedTo ? { assignedTo } : {}) },
      orderBy: { dueAt: 'asc' },
    });
  }

  listOverdue(tenantId: string) {
    return this.prisma.crmTask.findMany({ where: { tenantId, status: 'pending', dueAt: { lt: new Date() } }, orderBy: { dueAt: 'asc' } });
  }

  create(tenantId: string, dto: CreateCrmTaskDto) {
    return this.prisma.crmTask.create({ data: { tenantId, ...dto, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined } });
  }

  complete(taskId: string) {
    return this.prisma.crmTask.update({ where: { id: taskId }, data: { status: 'completed', completedAt: new Date() } });
  }

  cancel(taskId: string) {
    return this.prisma.crmTask.update({ where: { id: taskId }, data: { status: 'cancelled' } });
  }
}

/** Etiquetas (briefing: "Etiquetas"). */
@Injectable()
export class CrmTagsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.crmTag.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  create(tenantId: string, dto: CreateCrmTagDto) {
    return this.prisma.crmTag.create({ data: { tenantId, ...dto } });
  }
}

/** Campanhas (briefing: "Campanhas"). */
@Injectable()
export class CrmCampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.crmCampaign.findMany({ where: { tenantId }, include: { _count: { select: { members: true } } }, orderBy: { createdAt: 'desc' } });
  }

  create(tenantId: string, dto: CreateCampaignDto) {
    return this.prisma.crmCampaign.create({
      data: { tenantId, ...dto, startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined },
    });
  }

  addMember(tenantId: string, campaignId: string, data: { customerId?: string; leadId?: string }) {
    return this.prisma.crmCampaignMember.create({ data: { tenantId, campaignId, ...data } });
  }

  activate(campaignId: string) {
    return this.prisma.crmCampaign.update({ where: { id: campaignId }, data: { status: 'active' } });
  }

  finish(campaignId: string) {
    return this.prisma.crmCampaign.update({ where: { id: campaignId }, data: { status: 'finished' } });
  }
}

/** Chamados (briefing: "Chamados") — parte da Visão 360° do Cliente (Sprint MDM). */
@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, status?: string) {
    return this.prisma.supportTicket.findMany({
      where: { tenantId, ...(status ? { status: status as never } : {}) },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, dto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({ data: { tenantId, ...dto } as never });
  }

  resolve(ticketId: string) {
    return this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'resolved', resolvedAt: new Date() } });
  }

  close(ticketId: string) {
    return this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'closed' } });
  }
}
