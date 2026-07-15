# Changelog — Sprint 14: Hardening Enterprise + DevOps + Produção

## Schema (178 models — +8 vs Sprint 13)

### Novos models (segurança e compliance)
- `JwtBlacklist` — revogação de tokens (logout, rotação, comprometimento)
- `RefreshToken` — refresh token com rotação obrigatória + detecção de reuso por família
- `TwoFactorAuth` — estrutura TOTP por usuário (secret criptografado AES-256, backup codes hashed)
- `PasswordHistory` — histórico das últimas N senhas (evita reutilização)
- `LoginAttempt` — janela deslizante de falhas para brute-force protection
- `LgpdConsent` — consentimentos LGPD imutáveis (histórico por tipo/versão)
- `LgpdRequest` — requisições dos titulares (acesso/export/erasure/portabilidade)
- `BackupJob` — registro de jobs de backup (type/status/checksum/encryption)

---

## Backend

### Módulo Security (`apps/api/src/modules/security/`)
- JWT Blacklist (revogação, cleanup de expirados)
- Refresh Token Rotation com detecção de reuso e revogação em família
- Brute Force Protection (janela 15min / 5 tentativas, por IP e por conta)
- 2FA TOTP (setup, verify, enable, backup codes — integração speakeasy na sprint de auth)
- Password Policy (12 chars, maiúscula, número, especial, histórico 10, expiração 90 dias)
- Criptografia AES-256-GCM (encrypt/decrypt de dados sensíveis)

### Módulo LGPD (`apps/api/src/modules/lgpd/`)
- Consentimentos (grant/revoke/history, versão por documento)
- Requisições LGPD (10 direitos dos titulares da Lei 13.709/2018)
- Exportação de dados (portabilidade — todos os dados do usuário)
- Anonimização irreversível (Customer + Employee, FKs preservadas)
- Relatório de retenção (dados elegíveis para anonimização por idade)

### Módulo Backup (`apps/api/src/modules/backup/`)
- Full / incremental / schema-only
- Criptografia AES-256-GCM do arquivo de backup
- Validação de checksum SHA-256 automática
- Armazenamento no Supabase Storage com expiração por tipo
- Agendamento configurável (cron expressions em env)

### Módulo Health (`apps/api/src/modules/health/`)
- `/health` — status de todos os serviços (banco, Supabase, Redis, Storage)
- `/health/liveness` — Kubernetes/Docker liveness probe
- `/health/readiness` — readiness probe (banco OK = ready)
- `/health/metrics` — métricas operacionais + negócio (tenants, users, audit events/h)

### Segurança Transversal
- `security.config.ts` — Helmet (CSP, HSTS, XSS, noSniff), CORS configurável, compressão
- Rate limits por categoria (auth: 5/15min, API: 60/min, export: 10/h, IA: 30/min)
- IP Whitelist configurável via env

---

## Infraestrutura

### Docker
- `docker/Dockerfile.api` — multi-stage, Node 20 Alpine, usuário não-root, HEALTHCHECK
- `docker/Dockerfile.web` — Vite build + Nginx Alpine, SPA routing, headers de segurança
- `docker/nginx.conf` — Gzip, cache-control correto (assets vs index.html), CSP headers
- `docker/docker-compose.yml` — api + web + redis + worker, resource limits, logging

### CI/CD
- `.github/workflows/ci-cd.yml` — lint → test (backend/frontend) → security scan → Docker build → deploy staging/production → rollback
- Branch protection em `main`, environment protection para produção
- Release automática no deploy de produção

### Ambientes
- `.env.example` — todas as variáveis documentadas com descrição e como gerar valores seguros

---

## Frontend
- `ErrorBoundary.tsx` — `WidgetErrorBoundary` adicionado para widgets de dashboard
- `manifest.json` — PWA manifest (ícones, shortcuts para Dashboard/PDV/IA, screenshots)
- `pwa.config.ts` — estrutura documentada para integração vite-plugin-pwa (Workbox)

---

## Documentação
- `docs/GO_LIVE_CHECKLIST.md` — 9 seções, 50+ itens, assinatura Go/No-Go
- `docs/DISASTER_RECOVERY.md` — RPO < 1h, RTO < 4h, procedimentos P0/P1, scripts, contatos

---

## Validação
- Backend ESLint: **0 erros** (1 warning pré-existente)
- Frontend `tsc --noEmit`: **0 erros**
- Frontend `vite build`: **4067 módulos**, 0 erros
- Schema Python AST: **178 models**, 0 duplicatas
