import { Module } from '@nestjs/common';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';
import { AnalyticsAiService } from '@/modules/analytics-ai/analytics-ai.service';
import { CommunicationService, SetupWizardService, ImporterService, SupportService } from '@/modules/communication/communication.service';

@Module({
  controllers: [CopilotController],
  providers: [CopilotService, AnalyticsAiService, CommunicationService, SetupWizardService, ImporterService, SupportService],
  exports: [CopilotService, CommunicationService, SetupWizardService],
})
export class CopilotModule {}
