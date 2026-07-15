import { Module } from '@nestjs/common';
import { FiscalIssuanceController, FiscalEventsController, FiscalConfigController } from './fiscal.controller';
import { FiscalIssuanceService } from './fiscal-issuance.service';
import { FiscalEventsService, FiscalConfigService, FiscalCertificateService } from './fiscal-events-config-cert.service';
import { FiscalMonitorService, DanfeService } from './fiscal-monitor-danfe.service';
import { TaxEngineService } from './tax-engine.service';
import { NfeXmlBuilderService } from './xml/nfe-xml-builder.service';

@Module({
  controllers: [FiscalIssuanceController, FiscalEventsController, FiscalConfigController],
  providers: [FiscalIssuanceService, FiscalEventsService, FiscalConfigService, FiscalCertificateService, FiscalMonitorService, DanfeService, TaxEngineService, NfeXmlBuilderService],
  exports: [FiscalIssuanceService, TaxEngineService],
})
export class FiscalModule {}
