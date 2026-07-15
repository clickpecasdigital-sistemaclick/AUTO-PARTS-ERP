import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PlanService, SubscriptionService } from './subscriptions/subscription.service';
import { BillingService, LicensingService } from './billing/billing.service';
import { BrandingService, WebhookEngine } from './branding/branding.service';
import { ApiGatewayService, PortalService, MarketplaceService } from './api-gateway-portal-marketplace.service';

function ctx(u: AuthenticatedRequestUser, req: Request) {
  return { tenantId: u.tenantId, userId: u.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('saas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('saas')
export class SaasController {
  constructor(
    private readonly plans: PlanService,
    private readonly subs: SubscriptionService,
    private readonly billing: BillingService,
    private readonly licensing: LicensingService,
    private readonly branding: BrandingService,
    private readonly webhooks: WebhookEngine,
    private readonly apiGateway: ApiGatewayService,
    private readonly portals: PortalService,
    private readonly marketplace: MarketplaceService,
  ) {}

  // ---- PLANOS
  @Get('plans') listPlans() { return this.plans.listPlans(); }

  // ---- ASSINATURA
  @Get('subscription') @RequirePermission('settings', 'view') subscription(@CurrentUser() u: AuthenticatedRequestUser) { return this.subs.getSubscription(u.tenantId); }
  @Get('subscription/usage') @RequirePermission('settings', 'view') usage(@CurrentUser() u: AuthenticatedRequestUser) { return this.subs.getUsage(u.tenantId); }
  @Get('subscription/history') @RequirePermission('settings', 'view') subHistory(@CurrentUser() u: AuthenticatedRequestUser) { return this.subs.getHistory(u.tenantId); }
  @Post('subscription/upgrade') @RequirePermission('settings', 'update') upgrade(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('planId') planId: string) { return this.subs.upgrade(ctx(u, req), planId); }
  @Post('subscription/cancel') @RequirePermission('settings', 'update') cancel(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request) { return this.subs.cancel(ctx(u, req)); }

  // ---- COBRANÇA
  @Get('billing') @RequirePermission('settings', 'view') billingHistory(@CurrentUser() u: AuthenticatedRequestUser) { return this.billing.getBillingHistory(u.tenantId); }
  @Post('billing/checkout') @RequirePermission('settings', 'update') checkout(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('planId') planId: string, @Body('provider') provider: string) { return this.billing.createCheckoutSession(ctx(u, req), planId, provider ?? 'stripe'); }

  // ---- LICENÇA
  @Get('license') @RequirePermission('settings', 'view') license(@CurrentUser() u: AuthenticatedRequestUser) { return this.licensing.getLicense(u.tenantId); }
  @Post('license/generate-key') @RequirePermission('settings', 'update') genKey(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request) { return this.licensing.generateKey(ctx(u, req)); }
  @Get('license/validate') @RequirePermission('settings', 'view') validateLicense(@CurrentUser() u: AuthenticatedRequestUser) { return this.licensing.validateLicense(u.tenantId); }

  // ---- BRANDING
  @Get('branding') @RequirePermission('settings', 'view') getBranding(@CurrentUser() u: AuthenticatedRequestUser) { return this.branding.getBranding(u.tenantId); }
  @Put('branding') @RequirePermission('settings', 'update') upsertBranding(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body() data: Record<string, unknown>) { return this.branding.upsertBranding(ctx(u, req), data); }
  @Get('branding/css') getBrandingCss(@CurrentUser() u: AuthenticatedRequestUser) { return this.branding.getBranding(u.tenantId).then((b) => ({ css: b ? this.branding.generateCss(b) : '' })); }

  // ---- WEBHOOKS
  @Get('webhooks') @RequirePermission('settings', 'view') listWebhooks(@CurrentUser() u: AuthenticatedRequestUser) { return this.webhooks.listEndpoints(u.tenantId); }
  @Post('webhooks') @RequirePermission('settings', 'create') createWebhook(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('url') url: string, @Body('events') events: string[], @Body('description') description?: string) { return this.webhooks.createEndpoint(ctx(u, req), url, events, description); }
  @Post('webhooks/:id/ping') @RequirePermission('settings', 'update') pingWebhook(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) { return this.webhooks.ping(ctx(u, req), id); }
  @Delete('webhooks/:id') @RequirePermission('settings', 'delete') deleteWebhook(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) { return this.webhooks.deleteEndpoint(u.tenantId, id); }
  @Get('webhooks/:id/deliveries') @RequirePermission('settings', 'view') deliveries(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) { return this.webhooks.getDeliveries(u.tenantId, id); }

  // ---- API KEYS
  @Get('api-keys') @RequirePermission('settings', 'view') listApiKeys(@CurrentUser() u: AuthenticatedRequestUser) { return this.apiGateway.listApiKeys(u.tenantId); }
  @Get('api-keys/scopes') getScopes() { return this.apiGateway.getScopes(); }
  @Post('api-keys') @RequirePermission('settings', 'create') createApiKey(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('name') name: string, @Body('scopes') scopes: string[], @Body('expiresAt') expiresAt?: string) { return this.apiGateway.createApiKey(ctx(u, req), name, scopes, expiresAt ? new Date(expiresAt) : undefined); }
  @Delete('api-keys/:id') @RequirePermission('settings', 'delete') revokeKey(@CurrentUser() u: AuthenticatedRequestUser, @Param('id') id: string) { return this.apiGateway.revokeApiKey(u.tenantId, id); }

  // ---- PORTAIS
  @Post('portals/token') @RequirePermission('customers', 'create') genPortalToken(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('type') type: string, @Body('entityId') entityId: string, @Body('email') email?: string) { return this.portals.generatePortalToken(ctx(u, req), type, entityId, email).then((t) => ({ token: t })); }
  @Get('portals/customer/:entityId') @RequirePermission('customers', 'view') customerPortal(@CurrentUser() u: AuthenticatedRequestUser, @Param('entityId') entityId: string) { return this.portals.getCustomerPortalData(u.tenantId, entityId); }
  @Get('portals/supplier/:entityId') @RequirePermission('purchases', 'view') supplierPortal(@CurrentUser() u: AuthenticatedRequestUser, @Param('entityId') entityId: string) { return this.portals.getSupplierPortalData(u.tenantId, entityId); }
  @Get('portals/accountant') @RequirePermission('financial', 'view') accountantPortal(@CurrentUser() u: AuthenticatedRequestUser) { return this.portals.getAccountantPortalData(u.tenantId); }

  // ---- MARKETPLACE
  @Get('marketplace') listPlugins(@Query('category') category?: string) { return this.marketplace.listPlugins(category); }
  @Get('marketplace/installed') @RequirePermission('settings', 'view') installedPlugins(@CurrentUser() u: AuthenticatedRequestUser) { return this.marketplace.getInstalledPlugins(u.tenantId); }
  @Get('marketplace/:slug') getPlugin(@Param('slug') slug: string) { return this.marketplace.getPlugin(slug); }
  @Post('marketplace/:id/install') @RequirePermission('settings', 'create') installPlugin(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('config') config?: Record<string, unknown>) { return this.marketplace.installPlugin(ctx(u, req), id, config); }
  @Delete('marketplace/:id/uninstall') @RequirePermission('settings', 'delete') uninstall(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) { return this.marketplace.uninstallPlugin(ctx(u, req), id); }

  // ---- WEBHOOK BILLING (público)
  @Post('billing/webhook') @ApiOperation({ summary: 'Receber webhook de cobrança (Stripe/Asaas)' }) billingWebhook(@Body() payload: Record<string, unknown>, @Req() req: Request) {
    const sig = req.headers['x-webhook-signature'] as string ?? req.headers['stripe-signature'] as string ?? '';
    return this.billing.handleWebhook(String(payload.provider ?? 'stripe'), payload, sig);
  }
}
