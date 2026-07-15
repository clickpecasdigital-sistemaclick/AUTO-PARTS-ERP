import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller';
import { CrmTasksController, CrmTagsController, CrmCampaignsController, SupportTicketsController } from './crm-support.controller';
import { CrmAnalyticsController } from './crm-analytics.controller';
import { OpportunitiesService } from './opportunities.service';
import { CrmTasksService, CrmTagsService, CrmCampaignsService, SupportTicketsService } from './crm-support.service';
import { CrmAnalyticsService } from './crm-analytics.service';

/**
 * CRM 360° (Sprint 08) — Pipeline (etapas configuráveis + oportunidades),
 * Tarefas (ligações/visitas/follow-up), Etiquetas, Campanhas, Chamados e
 * Dashboard CRM. Consome `Customer`/`Lead` do MDM (`MdmModule`) sem
 * duplicar cadastro — toda Oportunidade referencia `customerId`/`leadId`.
 */
@Module({
  controllers: [OpportunitiesController, CrmTasksController, CrmTagsController, CrmCampaignsController, SupportTicketsController, CrmAnalyticsController],
  providers: [OpportunitiesService, CrmTasksService, CrmTagsService, CrmCampaignsService, SupportTicketsService, CrmAnalyticsService],
  exports: [OpportunitiesService, CrmAnalyticsService],
})
export class CrmModule {}
