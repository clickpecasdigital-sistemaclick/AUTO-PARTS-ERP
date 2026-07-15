# AutoCore ERP — Arquitetura Enterprise

> Versão 1.0 | Sprint 17 | Revisão de Arquitetura

---

## Visão Geral

O AutoCore ERP é uma plataforma SaaS Enterprise para oficinas mecânicas e distribuidoras de autopeças. Construído sobre um monorepo React + NestJS com PostgreSQL gerenciado pelo Supabase.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                   │
│  Browser/PWA    Mobile Flutter    Integrações (API Key)          │
└─────────────────┬───────────────┬──────────────────────────────┘
                  │               │
┌─────────────────▼───────────────▼──────────────────────────────┐
│                      FRONTEND (Vite/React)                        │
│  apps/web — React 19, TypeScript, Tailwind, TanStack, Zustand   │
│  4072 modules | Lazy Loading | Code Splitting | PWA              │
└─────────────────────────────────────────────┬───────────────────┘
                                              │ HTTPS / REST
┌─────────────────────────────────────────────▼───────────────────┐
│                    API GATEWAY (NestJS 10)                        │
│  apps/api — JWT Auth, RBAC, Rate Limit, Helmet, Compression      │
│  20 módulos de negócio | Repository Pattern | AuditService       │
└───────┬──────────────┬──────────────┬──────────────┬────────────┘
        │              │              │              │
┌───────▼──┐    ┌──────▼──┐   ┌──────▼──┐   ┌──────▼──────────┐
│ Supabase │    │  Redis  │   │ Storage │   │  Anthropic API  │
│ PostgreSQL│   │  Cache  │   │ S3/Supa │   │ claude-sonnet   │
│  207 models│  │  Filas  │   │ Backups │   │ Copilot + BI IA │
│  RLS Policies│ │        │   │  Certs  │   └─────────────────┘
└──────────┘    └─────────┘   └─────────┘
```

---

## Estrutura do Monorepo

```
autocore-erp/
├── apps/
│   ├── web/                    # Frontend React/Vite
│   │   ├── src/
│   │   │   ├── app/           # Router, Guards, Providers
│   │   │   ├── components/    # Design System (UI + Common)
│   │   │   ├── layouts/       # MainLayout (+ CopilotWidget)
│   │   │   ├── modules/       # 18 módulos de negócio
│   │   │   ├── navigation/    # nav-items.ts (estrutura de menu)
│   │   │   └── hooks/         # Hooks globais
│   └── api/                   # Backend NestJS
│       ├── src/
│       │   ├── app.module.ts  # Raiz — registra 20 módulos
│       │   ├── common/        # Guards, Decorators, Audit, Storage
│       │   ├── database/      # PrismaService
│       │   └── modules/       # 20 módulos de negócio
│       └── prisma/
│           ├── schema.prisma  # 207 models, 17 seções
│           ├── seed.ts        # Dados iniciais + permissões
│           └── sql/           # RLS, índices, full-text search
├── docker/                    # Dockerfiles + Nginx + Compose
├── docs/                      # ADRs, Arquitetura, Security, Perf
└── .github/workflows/         # CI/CD pipeline
```

---

## Módulos de Negócio (20)

| Módulo | Sprint | Responsabilidade |
|---|---|---|
| `auth` | 01 | JWT, Refresh Token, login/logout |
| `products` | 02 | Catálogo, preços, fotos, aplicações |
| `inventory` | 03 | Estoque, WMS, transferências, inventário |
| `mdm` | 04 | Clientes, Fornecedores, Funcionários, 360° |
| `purchasing` | 05 | Cotações, Pedidos, Recebimento |
| `financial` | 06+10 | Contas a Pagar/Receber, DRE, PIX, CNAB |
| `pdv` | 07 | Ponto de Venda, Carrinho, Caixa |
| `crm` | 08 | Pipeline, Oportunidades, Chamados |
| _(pricing)_ | 09 | Motor de Preços / Descontos (no mdm/products) |
| `workshop` | 11 | Ordens de Serviço, Garantias, Oficina |
| `fiscal` | 12 | Motor NF-e/NFC-e, Certificado A1, Monitor |
| `bi` | 13 | Data Warehouse, ETL, KPIs, Alertas |
| `security` | 14 | JWT Blacklist, 2FA, Password Policy |
| `lgpd` | 14 | Consentimentos, Exportação, Anonimização |
| `backup` | 14 | Backup criptografado, Validação |
| `health` | 14 | Health Checks, Métricas |
| `saas` | 15 | Planos, Assinaturas, Billing, API Keys |
| `superadmin` | 15 | Painel global da plataforma |
| `copilot` | 16 | IA Copilot, IA Analítica, Comunicação, Setup |

---

## Padrões Arquiteturais Aplicados

### Repository Pattern
```
Controller → Service → Repository → PrismaService
                     ↘ AuditService
```
Aplicado em: `products`, `customers`, `purchasing`, `pdv`, `workshop`.

### Soft Delete Universal
Todo registro deletável tem `deletedAt: DateTime?`. Nenhum dado é deletado fisicamente (exceto anonimização LGPD).

### Audit Log Universal
`AuditService.log(ctx, action, entity, entityId, changes)` chamado em todo write. `AuditLog` preserva `before`/`after` para compliance.

### Multi-Tenant com tenantId
```typescript
// Padrão obrigatório em 100% dos services
const result = await this.prisma.product.findMany({
  where: { tenantId: ctx.tenantId, deletedAt: null },
});
```

### Event-Driven (Webhooks + BI)
Sprint 15: `WebhookEngine.dispatch(tenantId, event, payload)` dispara eventos de negócio.  
Sprint 13: `EtlService` consome eventos e atualiza o DW.

---

## Decisões de Segurança

Ver `/docs/adr/ADR-001-multi-tenant-strategy.md` e `ADR-002-008-core-decisions.md`.

**Resumo das 5 camadas:**
1. Nginx — rate limit, CSP, HSTS, X-Frame-Options
2. TLS 1.3 — todo tráfego criptografado
3. Helmet + CORS — headers de segurança HTTP
4. JWT (15min) + Refresh Rotation — detecção de reuso
5. RLS Supabase — isolamento no banco de dados

---

## Performance: Decisões de Design

**Banco de dados:**
- `dateKey: Int` (YYYYMMDD) para fatos do DW — queries de período sem `EXTRACT()` ou `DATE_TRUNC()`
- Índices compostos `(tenantId, dateKey)` em todas as tabelas de fato
- `averageCost` materializado no `Stock` — evita JOIN com `StockMovement` para custo médio

**Frontend:**
- Code splitting por rota (`lazy()` + `withSuspense` em todas as páginas)
- TanStack Query com `staleTime` configurado por tipo de dado
- Zustand para estado UI (carrinho PDV, sidebar) — sem Context re-render global

**API:**
- `@nestjs/throttler` com TTLs por categoria (auth 5/15min, api 60/min)
- Compressão gzip via `compression` middleware
- Cursor-based pagination em listagens grandes

---

## Dependências Críticas e Versões

```json
{
  "backend": {
    "@nestjs/core": "^10",
    "@prisma/client": "^5",
    "typescript": "^5.3"
  },
  "frontend": {
    "react": "^19",
    "vite": "^5",
    "@tanstack/react-query": "^5",
    "recharts": "^3",
    "tailwindcss": "^3"
  }
}
```

---

## Pontos de Integração (Externos)

| Serviço | Módulo | Protocolo | Estrutura |
|---|---|---|---|
| Supabase | Todos | PostgreSQL / REST | Ativo (produção) |
| Anthropic API | copilot, bi | HTTPS/REST | Ativo |
| SEFAZ | fiscal | SOAP + XAdES | Estrutura pronta |
| Stripe/Asaas | saas/billing | HTTPS/Webhook | Estrutura pronta |
| WhatsApp Meta | copilot/comm | Graph API | Estrutura pronta |
| Email (Resend/SG) | copilot/comm | HTTPS/REST | Estrutura pronta |
| PIX (PSP) | financial | HTTPS/Webhook | Estrutura pronta |
