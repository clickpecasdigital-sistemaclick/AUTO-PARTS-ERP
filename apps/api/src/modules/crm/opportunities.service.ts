import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { CreateOpportunityDto, CreatePipelineStageDto } from './dto/crm.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Pipeline de CRM — etapas configuráveis (`CrmPipelineStage`) e
 * Oportunidades (`CrmOpportunity`) movidas entre elas (kanban). Mover para
 * uma etapa `isWon`/`isLost` fecha a oportunidade (`closedAt`) — não exclui,
 * fica visível no histórico/relatório de conversão do Dashboard CRM.
 */
@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Etapas -------------------------------------------------------------------

  listStages(tenantId: string) {
    return this.prisma.crmPipelineStage.findMany({ where: { tenantId }, orderBy: { order: 'asc' } });
  }

  createStage(tenantId: string, dto: CreatePipelineStageDto) {
    return this.prisma.crmPipelineStage.create({ data: { tenantId, ...dto } });
  }

  // --- Oportunidades --------------------------------------------------------------

  /** Quadro kanban: etapas com suas oportunidades já agrupadas. */
  async getBoard(tenantId: string) {
    const stages = await this.prisma.crmPipelineStage.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
      include: {
        opportunities: {
          where: { closedAt: null },
          include: { customer: { select: { id: true, name: true } }, lead: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return stages;
  }

  async findOne(tenantId: string, id: string) {
    const opportunity = await this.prisma.crmOpportunity.findFirst({
      where: { id, tenantId },
      include: { customer: true, lead: true, pipelineStage: true, tasks: true, tags: { include: { tag: true } } },
    });
    if (!opportunity) throw new NotFoundException('Oportunidade não encontrada');
    return opportunity;
  }

  async create(ctx: RequestContext, dto: CreateOpportunityDto) {
    const opportunity = await this.prisma.crmOpportunity.create({
      data: { tenantId: ctx.tenantId, createdBy: ctx.userId, ...dto, expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'CrmOpportunity', entityId: opportunity.id, after: opportunity });
    return opportunity;
  }

  async moveStage(ctx: RequestContext, opportunityId: string, pipelineStageId: string) {
    const opportunity = await this.findOne(ctx.tenantId, opportunityId);
    const stage = await this.prisma.crmPipelineStage.findFirst({ where: { id: pipelineStageId, tenantId: ctx.tenantId } });
    if (!stage) throw new NotFoundException('Etapa do funil não encontrada');

    const isClosing = stage.isWon || stage.isLost;
    const updated = await this.prisma.crmOpportunity.update({
      where: { id: opportunityId },
      data: { pipelineStageId, closedAt: isClosing ? new Date() : null },
    });

    await this.audit.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'update',
      entity: 'CrmOpportunity',
      entityId: opportunityId,
      before: { pipelineStageId: opportunity.pipelineStageId },
      after: { pipelineStageId, won: stage.isWon, lost: stage.isLost },
    });

    return updated;
  }

  // --- Etiquetas -----------------------------------------------------------------

  async assignTag(tenantId: string, opportunityId: string, tagId: string) {
    return this.prisma.crmTagAssignment.create({ data: { tenantId, opportunityId, tagId } });
  }

  async removeTag(opportunityId: string, tagId: string) {
    return this.prisma.crmTagAssignment.deleteMany({ where: { opportunityId, tagId } });
  }
}
