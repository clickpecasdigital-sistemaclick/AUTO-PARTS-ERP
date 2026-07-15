# AutoCore ERP — Checklist de Go Live Enterprise

> Versão: Sprint 14 | Atualizado: 2026

Marque cada item ✅ antes de ir para produção. Cada seção tem um
responsável sugerido e critério de aprovação.

---

## 1. INFRAESTRUTURA

### Banco de Dados
- [ ] Supabase Project criado na região correta (ex: sa-east-1 para Brasil)
- [ ] `DATABASE_URL` e `DIRECT_URL` configurados com Connection Pooler (port 6543)
- [ ] `prisma migrate deploy` executado em produção — 0 erros
- [ ] RLS habilitado nas tabelas sensíveis (verificar `/docs/SUPABASE_RLS.md`)
- [ ] Policies de RLS testadas para todos os papéis (`tenant_user`, `tenant_admin`, `superadmin`)
- [ ] Índices criados — verificar `EXPLAIN ANALYZE` nas queries críticas (vendas, estoque, financeiro)
- [ ] Connection pool configurado (Supabase pooler: Transaction mode para API, Session mode para workers)
- [ ] Backup automático habilitado no painel Supabase (PITR se disponível no plano)
- [ ] Backup manual pré-go-live executado e validado (SHA-256 confere)
- [ ] Restauração testada em ambiente de homologação

### Storage
- [ ] Buckets criados: `fiscal-certificates`, `backups`, `documents`, `avatars`
- [ ] Políticas de acesso dos buckets configuradas (sem acesso público para `backups`)
- [ ] Tamanho máximo de upload configurado (ex: 50MB para certificados)

### Redis
- [ ] Redis em produção com senha forte (`REDIS_PASSWORD`)
- [ ] `maxmemory 512mb` e `maxmemory-policy allkeys-lru` configurados
- [ ] Persistência habilitada (`appendonly yes`)
- [ ] Redis acessível apenas pela rede interna (não exposto publicamente)

---

## 2. SEGURANÇA

### Certificados e HTTPS
- [ ] Domínio registrado e DNS configurado (A record para IP do servidor)
- [ ] Certificado TLS/SSL obtido (Let's Encrypt ou comercial)
- [ ] HTTPS funcionando na API (`https://api.dominio.com`)
- [ ] HTTPS funcionando no frontend (`https://app.dominio.com`)
- [ ] HTTP redireciona para HTTPS (301)
- [ ] HSTS habilitado (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`)

### Variáveis de Ambiente
- [ ] Todas as variáveis do `.env.example` preenchidas em produção
- [ ] `JWT_SECRET` >= 64 caracteres aleatórios (`openssl rand -hex 64`)
- [ ] `AES_256_KEY` exatamente 32 bytes (`openssl rand -hex 32 | head -c 32`)
- [ ] `BCRYPT_ROUNDS=12` (mínimo para produção)
- [ ] `NODE_ENV=production`
- [ ] Nenhum secret hardcoded no código — verificar com `git grep -r "sk-ant\|password=\|secret="`

### Autenticação
- [ ] JWT expiry em 15 minutos (`JWT_EXPIRY=15m`)
- [ ] Refresh token expiry em 30 dias
- [ ] JWT Blacklist funcionando (teste: logout → token não funciona mais)
- [ ] Refresh Token Rotation testado (reuso detectado → família revogada)
- [ ] Brute force protection testado (6 tentativas → bloqueio 15min)
- [ ] Password policy aplicada (12 chars, maiúscula, número, especial)
- [ ] Histórico de senhas (não reutilizar últimas 10)

### Headers e CORS
- [ ] `CORS_ORIGINS` contém apenas os domínios autorizados (sem `*`)
- [ ] Helmet aplicado — verificar headers em `https://securityheaders.com`
- [ ] `X-Frame-Options: DENY`
- [ ] `Content-Security-Policy` configurado
- [ ] `X-Content-Type-Options: nosniff`

### Rate Limiting
- [ ] Rate limit global: 60 req/min por IP
- [ ] Rate limit de login: 5 tentativas/15min
- [ ] Rate limit de exportação: 10/hora
- [ ] `IP_WHITELIST` configurado para IPs de monitoramento/CI

---

## 3. LGPD

- [ ] Política de Privacidade publicada e versão configurada no sistema
- [ ] Termos de Uso publicados e versão configurada
- [ ] Consentimento coletado no primeiro login (tela de aceite)
- [ ] Endpoint de exportação de dados testado (`POST /lgpd/export`)
- [ ] Endpoint de esquecimento testado (`POST /lgpd/erasure`)
- [ ] DPO configurado (`LGPD_DPO_EMAIL`)
- [ ] Política de retenção configurada (padrão: 5 anos)
- [ ] Anonimização testada — verificar que FKs permanecem intactas

---

## 4. BACKUP E DISASTER RECOVERY

- [ ] Backup incremental agendado (a cada hora)
- [ ] Backup full agendado (diariamente às 03:00 UTC)
- [ ] Schema-only backup agendado (semanalmente)
- [ ] Validação automática de checksum após cada backup
- [ ] Restauração de backup testada em ambiente de homologação (último full backup)
- [ ] RPO documentado: meta `< 1 hora` (incremental a cada hora)
- [ ] RTO documentado: meta `< 4 horas` (restauração + verificação)
- [ ] Runbook de DR documentado e testado (`docs/DISASTER_RECOVERY.md`)
- [ ] Backup criptografado com `BACKUP_ENCRYPTION_KEY` (diferente da AES_256_KEY)
- [ ] Alertas configurados para falha de backup

---

## 5. OBSERVABILIDADE

### Logs
- [ ] `LOG_FORMAT=json` em produção
- [ ] `LOG_LEVEL=info` em produção (não `debug`)
- [ ] Logs enviados para sistema centralizado (ex: Supabase Logs, Datadog, CloudWatch)
- [ ] Rotação de logs configurada (Docker: `max-size=50m, max-file=5`)

### Health Checks
- [ ] `GET /health` retorna `200 OK` em produção
- [ ] `GET /health/liveness` configurado no Docker HEALTHCHECK
- [ ] `GET /health/readiness` monitorado pelo load balancer
- [ ] Alerta configurado para `/health` retornar non-200

### Métricas
- [ ] Uso de CPU monitorado — alerta em > 80%
- [ ] RAM monitorada — alerta em > 85%
- [ ] Conexões de banco monitoradas — alerta em > 80% do pool
- [ ] Tempo de resposta da API monitorado — alerta P99 > 2s
- [ ] Fila Redis monitorada — alerta se > 1000 jobs pendentes

---

## 6. CI/CD

- [ ] GitHub Actions pipeline executando sem erros
- [ ] Branch protection em `main` (require PR + 1 review + CI verde)
- [ ] Secrets configurados no GitHub: `STAGING_HOST`, `STAGING_SSH_KEY`, `VITE_API_URL`, `GITHUB_TOKEN`
- [ ] Deploy automático em `develop` → staging funcionando
- [ ] Deploy manual aprovado para produção (environment protection)
- [ ] Rollback testado (deploy de versão anterior funciona)
- [ ] Release notes automáticas geradas

---

## 7. PERFORMANCE

### Frontend
- [ ] Bundle size < 500KB (gzip) para chunk principal
- [ ] Lighthouse score > 90 em Performance
- [ ] Lazy loading funcionando para todos os módulos
- [ ] Code splitting por rota verificado no Network tab
- [ ] Nginx gzip habilitado e funcionando

### Backend
- [ ] `EXPLAIN ANALYZE` executado nas queries mais frequentes (vendas, estoque)
- [ ] Índices críticos verificados (ver `CHANGELOG-sprint*.md`)
- [ ] Cache Redis configurado para dashboards e configurações
- [ ] Compression habilitado (`compression` middleware)

---

## 8. TESTES PRÉ-PRODUÇÃO

- [ ] Smoke test completo no ambiente de staging
- [ ] Login / logout testado
- [ ] Criar venda → gerar NF-e → verificar monitor fiscal
- [ ] ETL BI executado e dados aparecem no dashboard
- [ ] Assistente IA responde com dados corretos
- [ ] Alerta automático gerado após inserir produto com estoque zerado
- [ ] Backup executado e validado em staging
- [ ] Export LGPD testado

---

## 9. COMUNICAÇÃO E ROLLOUT

- [ ] Janela de manutenção comunicada aos clientes (>= 48h de antecedência)
- [ ] Plano de rollback documentado e aprovado
- [ ] Equipe de suporte treinada
- [ ] Documentação do usuário atualizada
- [ ] Contato de emergência definido (DBA, DevOps, Suporte)

---

## ASSINATURA GO/NO-GO

| Papel | Nome | Aprovação | Data |
|---|---|---|---|
| Tech Lead | | ☐ Go ☐ No-Go | |
| DevOps | | ☐ Go ☐ No-Go | |
| QA | | ☐ Go ☐ No-Go | |
| DPO (LGPD) | | ☐ Go ☐ No-Go | |
| Produto | | ☐ Go ☐ No-Go | |

**Só fazer deploy com TODOS os itens desta seção como "Go".**
