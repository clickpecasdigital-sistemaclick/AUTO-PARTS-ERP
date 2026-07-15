import { Module } from '@nestjs/common';
import { BiController } from './bi.controller';
import { EtlService } from './etl/etl.service';
import { KpiService } from './kpi/kpi.service';
import { AiAssistantService } from './ai/ai-assistant.service';
import { AlertsEngineService, AutomationsService, NotificationsService, ReportService } from './bi-engine.service';

@Module({
  controllers: [BiController],
  providers: [EtlService, KpiService, AiAssistantService, AlertsEngineService, AutomationsService, NotificationsService, ReportService],
  exports: [KpiService, AlertsEngineService, NotificationsService],
})
export class BiModule {}
