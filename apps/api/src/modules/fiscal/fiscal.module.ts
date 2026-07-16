import { Module } from '@nestjs/common';
import { FiscalIssuanceController, FiscalEventsController, FiscalConfigController } from './fiscal.controller';
import { FiscalIssuanceService } from './fiscal-issuance.service';
import { FiscalEventsService, FiscalConfigService, FiscalCertificateService } from './fiscal-events-config-cert.service';
import { FiscalSignatureService } from './fiscal-signature.service';
import { FiscalMonitorService, DanfeService } from './fiscal-monitor-danfe.service';
import { TaxEngineService } from './tax-engine.service';
import { NfeXmlBuilderService } from './xml/nfe-xml-builder.service';
import { StorageModule } from '@/common/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [FiscalIssuanceController, FiscalEventsController, FiscalConfigController],
  providers: [FiscalIssuanceService, FiscalEventsService, FiscalConfigService, FiscalCertificateService, FiscalSignatureService, FiscalMonitorService, DanfeService, TaxEngineService, NfeXmlBuilderService],
  exports: [FiscalIssuanceService, TaxEngineService, FiscalSignatureService],
})
export class FiscalModule {}
