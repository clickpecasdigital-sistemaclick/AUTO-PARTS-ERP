import { Module } from '@nestjs/common';
import { PlanService, SubscriptionService } from './subscriptions/subscription.service';
import { BillingService, LicensingService } from './billing/billing.service';
import { BrandingService, WebhookEngine } from './branding/branding.service';
import { ApiGatewayService, PortalService, MarketplaceService } from './api-gateway-portal-marketplace.service';
import { SaasController } from './saas.controller';

@Module({
  controllers: [SaasController],
  providers: [PlanService, SubscriptionService, BillingService, LicensingService, BrandingService, WebhookEngine, ApiGatewayService, PortalService, MarketplaceService],
  exports: [PlanService, SubscriptionService, LicensingService, BrandingService, WebhookEngine, PortalService],
})
export class SaasModule {}
