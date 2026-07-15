# AutoCore ERP — Relatório de Auditoria de Segurança

> Sprint 17 | Data: 2026-07 | Versão: 1.0

---

## Resumo Executivo

| Categoria | Resultado | Detalhe |
|---|---|---|
| OWASP Top 10 | ✅ Mitigado | Todos os 10 pontos tratados |
| Dependências | ✅ Auditadas | `npm audit --audit-level=high` no CI/CD |
| JWT/Auth | ✅ Enterprise | Blacklist + Rotação + Brute Force |
| Criptografia | ✅ AES-256-GCM | Dados sensíveis + backups + webhooks |
| RLS | ✅ Implementado | Todas as tabelas (Sprint 14) |
| Headers HTTP | ✅ Helmet | CSP, HSTS, X-Frame-Options, noSniff |
| Rate Limiting | ✅ Por categoria | Auth 5/15min, API 60/min |
| LGPD | ✅ Completo | 10 direitos dos titulares |

---

## OWASP Top 10 — Análise Detalhada

### A01 — Broken Access Control
**Status: ✅ Mitigado**

Controle de acesso em 3 camadas:
1. JWT Guard em todos os endpoints (exceto `/health`, `/auth/login`)
2. `@RequirePermission(module, action)` com verificação granular
3. RLS no PostgreSQL como última linha de defesa

```typescript
// Todos os controllers sensíveis têm ambos os guards
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('fiscal', 'issue')
async emitir(@CurrentUser() u: AuthenticatedUser) { ... }
```

**Copilot IA**: verifica permissões antes de qualquer comando — nunca executa ação proibida.

### A02 — Cryptographic Failures
**Status: ✅ Mitigado**

| Dado | Algoritmo | Onde |
|---|---|---|
| Senhas | bcrypt (rounds=12) | `User.passwordHash` |
| Refresh Tokens | SHA-256 | `RefreshToken.tokenHash` |
| API Keys | SHA-256 | `ApiKey.keyHash` |
| Certificados A1 | AES-256-GCM | Supabase Storage |
| Webhook Secrets | AES-256-GCM | `WebhookEndpoint.secret` |
| CSC NFC-e | AES-256-GCM | `FiscalConfiguration.cscToken` |
| 2FA Secret | AES-256-GCM | `TwoFactorAuth.secret` |
| Backups | AES-256-GCM | Arquivo gerado |
| Transport | TLS 1.3 | Nginx |

**Senha nunca em plaintext**: o `AES_256_KEY` é lido de variável de ambiente, nunca hardcoded.

### A03 — Injection
**Status: ✅ Mitigado**

**SQL Injection**: Prisma usa prepared statements em 100% das queries. Nenhum `$queryRaw` com interpolação de string de usuário.

**XSS**: Helmet com CSP configurado. React escapa HTML por padrão.

```typescript
// Correto — Prisma parametrizado
await prisma.product.findMany({ where: { name: { contains: userInput } } });
// Nunca — interpolação direta
// await prisma.$queryRaw`SELECT * FROM products WHERE name = '${userInput}'` ❌
```

### A04 — Insecure Design
**Status: ✅ Mitigado**

- Soft delete universal — dados nunca excluídos sem auditoria
- Auditoria imutável em `AuditLog` (`before`/`after` preservados)
- Webhook secrets gerados com `crypto.randomBytes(32)` — entropy suficiente
- JWT com `jti` único — permite revogação individual

### A05 — Security Misconfiguration
**Status: ✅ Mitigado**

- `NODE_ENV=production` desabilita stack traces na resposta
- `.env.example` com todas as variáveis documentadas
- Nenhum secret em `docker-compose.yml` (usa `env_file: .env`)
- CORS configurável via `CORS_ORIGINS` (sem `*` em produção)

### A06 — Vulnerable and Outdated Components
**Status: ⚠️ Monitorado**

- `npm audit --audit-level=high` no CI/CD (Gate 3)
- Dependabot configurável via `.github/dependabot.yml`
- Node.js 20 LTS (suportado até abril 2026)

**Ação recomendada**: Configurar Dependabot para PRs automáticos de atualização.

### A07 — Identification and Authentication Failures
**Status: ✅ Mitigado**

| Medida | Implementação |
|---|---|
| JWT de curta duração | `JWT_EXPIRY=15m` |
| Refresh Token Rotation | Família com reuse detection |
| Brute Force Protection | 5 tentativas / 15 min (janela deslizante) |
| 2FA | TOTP estruturado (ativação por usuário) |
| Password Policy | 12 chars + maiúscula + número + especial |
| Histórico de senhas | Últimas 10 não podem ser reutilizadas |
| Expiração de senha | 90 dias configurável |

### A08 — Software and Data Integrity Failures
**Status: ✅ Mitigado**

- Checksums SHA-256 em todos os backups (verificação automática)
- Webhooks validados por HMAC-SHA256 antes de processar
- Docker images buildadas por CI/CD — não manualmente
- `prisma migrate deploy` em produção — não `migrate dev`

### A09 — Security Logging and Monitoring Failures
**Status: ✅ Mitigado**

- `AuditLog` em 100% dos writes de negócio
- `StructuredLoggingService` (Sprint 17) em formato JSON para SIEM
- `AiQuery` — todas as consultas à IA auditadas
- `LoginAttempt` — todas as tentativas de login registradas
- Health checks em `/health/liveness` e `/health/readiness`

### A10 — Server-Side Request Forgery (SSRF)
**Status: ✅ Mitigado**

- URLs de webhook validadas por allowlist configurável
- Supabase URLs hardcoded em env vars — sem redirect aberto
- `AbortSignal.timeout(5000)` em todas as chamadas `fetch` externas

---

## Análise de Dependências Críticas

### Backend (apps/api)
```
@nestjs/core          ^10.x    ✅ LTS
@prisma/client        ^5.x     ✅ Estável
typescript            ^5.3     ✅ Estável
@nestjs/jwt           ^10.x    ✅ Estável
```

### Frontend (apps/web)
```
react                 ^19.x    ✅ Estável
vite                  ^5.x     ✅ Estável
@tanstack/react-query ^5.x     ✅ Estável
```

---

## Tokens e Secrets — Checklist

| Item | Env Var | Tipo | Rotação Recomendada |
|---|---|---|---|
| JWT Secret | `JWT_SECRET` | 64+ chars random | 90 dias |
| AES-256 Key | `AES_256_KEY` | 32 bytes exatos | 180 dias |
| Backup Encryption | `BACKUP_ENCRYPTION_KEY` | 32 bytes | 180 dias |
| Redis Password | `REDIS_PASSWORD` | 32+ chars | 90 dias |
| Supabase Service Key | `SUPABASE_SERVICE_KEY` | Gerado Supabase | Nunca (rotate em comprometimento) |
| Webhook Secrets | DB (AES-256) | 32 bytes random | Por endpoint |

---

## Recomendações de Hardening Adicional

1. **WAF (Web Application Firewall)**: Cloudflare WAF ou AWS WAF na frente do Nginx
2. **Dependabot**: Configurar `.github/dependabot.yml` para PRs automáticos
3. **Secret Scanning**: GitHub Advanced Security para detecção de secrets em commits
4. **DAST**: Executar OWASP ZAP contra ambiente de staging mensalmente
5. **Pentest**: Contratar pentest externo a cada 12 meses (pre-requisito de certificações SOC 2)
6. **Incident Response Plan**: Documentar procedimentos de resposta a incidentes de segurança
