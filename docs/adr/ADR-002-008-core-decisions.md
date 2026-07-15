# ADR-002: ORM — Prisma com Repository Pattern

**Data:** 2026-01-15 | **Status:** Aceito | **Contexto:** Sprint 01

## Decisão
Prisma ORM com **Repository Pattern** entre Service e Prisma Client.  
`Service → Repository → PrismaService` — nunca `Service → PrismaService` diretamente em módulos complexos.

## Razão
- Prisma gera tipos TypeScript completos do schema (zero type drift)
- Repository isola queries complexas e facilita testes unitários (mock do Repository, não do Prisma)
- Migrations incrementais (`prisma migrate dev`) garantem rastreabilidade de mudanças de schema
- `UncheckedCreateInput` para FKs escalares (padrão aplicado em 207 models)

## Exceção Aceita
Módulos simples (CRUD direto) usam `PrismaService` no Service para evitar boilerplate desnecessário.  
Módulos com queries complexas (Products, Customers, Workshop, PDV) têm `.repository.ts` dedicado.

---

# ADR-003: Autenticação — Supabase Auth + JWT customizado

**Data:** 2026-01-20 | **Status:** Aceito | **Contexto:** Sprint 01

## Decisão
Supabase Auth para gerenciamento de sessões + JWT customizado com claims `tenantId`, `userId`, `permissions[]`.

## Razão
- Supabase Auth fornece MFA, OAuth, magic links "de graça"
- Claims customizados permitem verificação de permissões sem round-trip ao banco em cada request
- `JwtAuthGuard` + `PermissionsGuard` como guards compostos na camada NestJS

## Consequência: Refresh Token Rotation (Sprint 14)
`RefreshToken` com hash SHA-256, detecção de reuso por família de tokens, revogação automática.

---

# ADR-004: Motor de Permissões — RBAC granular

**Data:** 2026-01-22 | **Status:** Aceito | **Contexto:** Sprint 01

## Decisão
RBAC com permissões no formato `module:action` (ex: `products:create`, `fiscal:issue`).  
`@RequirePermission('module', 'action')` decorator em todos os endpoints protegidos.

## Módulos e Actions canônicas
`products`, `stock`, `purchases`, `sales`, `customers`, `employees`, `carriers`, `crm`, `financial`, `workshop`, `fiscal`, `settings`, `bi`  
Actions: `view`, `create`, `update`, `delete`, `export`, `print`, `approve`, `cancel`  
Fiscais extra: `issue`, `void`, `manage_config`, `manage_certs`

## Consequência
Copilot IA (Sprint 16) verificou permissões antes de qualquer comando — princípio zero trust dentro da plataforma.

---

# ADR-005: Motor Fiscal — Zero lógica hardcoded

**Data:** 2026-03-10 | **Status:** Aceito | **Contexto:** Sprint 12

## Decisão
`TaxCalculationRule` parametrizável no banco. O motor de tributação nunca contém regras fiscais hardcoded — toda alíquota, CST, CSOSN e regime é uma linha no banco.

## Razão
Legislação fiscal brasileira muda constantemente. Uma regra nova = um INSERT, não um deploy.  
Mesma estratégia do `DiscountRule` (Sprint 09).

## Implementação
`TaxEngineService.resolve(product, dest, operation)` → busca regras por prioridade → calcula ICMS/ST/IPI/PIS/COFINS/FCP/DIFAL.

---

# ADR-006: Data Warehouse — DW interno (PostgreSQL)

**Data:** 2026-04-05 | **Status:** Aceito | **Contexto:** Sprint 13

## Decisão
DW interno no mesmo PostgreSQL (Supabase), não um sistema externo (BigQuery/Snowflake/Redshift).

## Razão
- Zero custo adicional de infraestrutura
- JOIN direto entre fatos e tabelas operacionais para drill-down
- ETL incremental por cursor `lastSyncAt` — idempotente e seguro para re-execução
- Em escala Enterprise (100M+ registros), índices em `dateKey` (YYYYMMDD como INT) garantem performance de particionamento

## Trade-off Aceito
Para tenants com > 500M de registros históricos, migrar `FactSale` para uma tabela particionada por `dateKey / 10000` (ano).

---

# ADR-007: IA Copilot — Arquitetura desacoplada

**Data:** 2026-05-20 | **Status:** Aceito | **Contexto:** Sprint 16

## Decisão
`AiProvider` desacoplada da lógica de negócio.  
Trocar `claude-sonnet-4-6` por qualquer outro modelo = mudar `ANTHROPIC_MODEL` em `.env`.  
O `CopilotService` nunca acessa a API de IA sem antes (a) detectar intenção, (b) verificar permissões, (c) buscar contexto real.

## Princípio: IA com contexto real, nunca alucinação
O Copilot injeta dados reais (KPIs do DW) no system prompt antes de cada chamada. A IA nunca inventa dados do tenant.

---

# ADR-008: Segurança em camadas (Defense in Depth)

**Data:** 2026-05-25 | **Status:** Aceito | **Contexto:** Sprint 14

## Decisão
5 camadas de segurança, cada uma independente:

1. **Perímetro:** Nginx (rate limiting, headers CSP/HSTS/XSS)
2. **Transporte:** HTTPS (TLS 1.3), HSTS preload
3. **Aplicação:** Helmet, CORS configurável, Rate Limiting por categoria
4. **Autenticação:** JWT (15min) + Refresh Rotation, 2FA TOTP, Brute Force Protection
5. **Dados:** RLS no Supabase, AES-256-GCM para campos sensíveis, SHA-256 para hashes

## Princípio: Nunca depender de uma única camada
Um bug no application layer → RLS bloqueia no banco.  
Um token comprometido → Blacklist + Rotação de família impede reutilização.
