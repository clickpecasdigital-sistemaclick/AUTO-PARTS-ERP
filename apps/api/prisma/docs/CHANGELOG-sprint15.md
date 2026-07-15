# Changelog — Sprint 15: SaaS Enterprise + Licenciamento + Multiempresa

## Schema (195 models — +17 vs Sprint 14)

### Novos models
- `Plan` + `PlanLimits` + `PlanFeature` — planos Starter/Pro/Business/Enterprise/Ultimate com limites por recurso e feature flags
- `Subscription` + `SubscriptionHistory` + `SubscriptionUsage` — ciclo de vida completo de assinaturas com histórico e rastreamento de uso
- `BillingRecord` — registro de cobranças multi-provider (Stripe/Asaas/MercadoPago/PagSeguro/manual)
- `License` + `LicenseKey` — licenciamento online/offline com chaves de ativação (hardware ID estruturado)
- `TenantBranding` — white label completo (nome, logo, cores, domínio, subdomain, email, CSS custom)
- `Plugin` + `PluginInstallation` — marketplace com dependências, versões, avaliações
- `WebhookEndpoint` + `WebhookDelivery` — motor de webhooks com retry automático
- `ApiKey` — API Gateway com scopes, IP whitelist, rate limit por key
- `PortalToken` — acesso a portais externos (cliente/fornecedor/contador)
- `I18nKey` — traduções pt-BR/en-US/es-ES

---

## Backend

### SaasModule (`apps/api/src/modules/saas/`)
- `PlanService` — CRUD de planos com limites e feature flags
- `SubscriptionService` — trial→active→suspended→cancelled, upgrade/downgrade, quota enforcement (ForbiddenException quando limite atingido), rastreamento de uso por recurso
- `BillingService` — checkout session por provider (Stripe/Asaas/MercadoPago), webhook de confirmação com HMAC-SHA256
- `LicensingService` — emissão de licença, geração de chave (plaintext retornado uma vez, SHA-256 armazenado), ativação offline com hardware ID, validação
- `BrandingService` — white label upsert, geração de CSS dinâmico por cores, template de email com branding
- `WebhookEngine` — dispatch por evento, assinatura HMAC-SHA256 no header, retry exponencial, log de entregas
- `ApiGatewayService` — criação de API Key (SHA-256, prefix para exibição), validação com scope check e IP whitelist
- `PortalService` — geração de token de portal, dados do Portal do Cliente (notas/OS/boletos/veículos), Portal do Fornecedor, Portal do Contador
- `MarketplaceService` — listar/instalar/desinstalar plugins com verificação de dependências e plano mínimo

### SuperAdminModule (`apps/api/src/modules/superadmin/`)
- Dashboard global (tenants, usuários, MRR 30d, assinaturas ativas, trials)
- Gestão de tenants (listar, ver detalhe, suspender, reativar)
- Relatório de uso por tenant (todos os recursos)
- Relatório de storage
- Logs globais de auditoria
- Gestão de planos (criar/atualizar com limites)
- Gestão do marketplace (publicar/atualizar plugins)

---

## Frontend

### SaaS (`apps/web/src/modules/saas/`)
- `saas.service.ts` — tipos, HTTP service e hooks TanStack para todos os endpoints
- `PlansPage.tsx` — cards de planos com limites, barra de uso do plano atual, botão de upgrade
- `SuperAdminDashboardPage.tsx` — dashboard global com KPIs e lista de tenants recentes

### Rotas
- `/planos` → PlansPage
- `/superadmin` → SuperAdminDashboardPage

### Navegação
- Entradas "Planos & Assinatura" e "Super Admin" adicionadas na categoria 'sistema'

---

## Validação
- Backend ESLint: **0 erros**
- Frontend `tsc --noEmit`: **0 erros**
- Frontend `vite build`: **4070 módulos**, 0 erros
- Schema: **195 models**, 0 duplicatas
