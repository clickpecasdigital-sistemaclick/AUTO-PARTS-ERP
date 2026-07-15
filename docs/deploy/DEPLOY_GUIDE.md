# AutoCore ERP — Guia de Deploy Completo

> Supabase + Railway (API) + Netlify (Frontend)

---

## Arquitetura de Deploy

```
Browser → Netlify (Frontend React)
            ↓
         Railway / Render (API NestJS)  
            ↓
         Supabase (PostgreSQL + Auth + Storage)
```

---

## PASSO 1 — Supabase (Banco de Dados)

### 1.1 Criar projeto
1. Acesse https://supabase.com → **New Project**
2. Escolha nome: `autocore-erp`
3. Escolha região: **South America (São Paulo)** `sa-east-1`
4. Defina uma senha forte para o banco → **anote esta senha**
5. Aguarde criação (~2 min)

### 1.2 Pegar as credenciais
No painel do projeto → **Settings → Database**:

```
Connection String → URI (com pgbouncer):
postgresql://postgres.PROJECTID:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
→ use como DATABASE_URL

Connection String → Direct (sem pgbouncer):  
postgresql://postgres.PROJECTID:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
→ use como DIRECT_URL
```

No painel → **Settings → API**:
```
Project URL          → SUPABASE_URL
anon (public)        → SUPABASE_ANON_KEY (frontend + backend)
service_role (secret)→ SUPABASE_SERVICE_KEY (backend only — nunca expor)
JWT Secret           → SUPABASE_JWT_SECRET
```

### 1.3 Criar buckets no Storage
No painel → **Storage → New Bucket**:

| Bucket | Público? | Uso |
|---|---|---|
| `product-photos` | ✅ Sim | Fotos de produtos |
| `documents` | ❌ Não | Documentos de clientes |
| `fiscal-certificates` | ❌ Não | Certificados A1 |
| `backups` | ❌ Não | Backups criptografados |

### 1.4 Configurar Auth
**Settings → Auth → URL Configuration:**
```
Site URL: https://SEU-APP.netlify.app
Redirect URLs: https://SEU-APP.netlify.app/**
```

---

## PASSO 2 — API NestJS (Railway)

### 2.1 Deploy na Railway
1. Acesse https://railway.app → **New Project → Deploy from GitHub**
2. Selecione seu repositório `autocore-erp`
3. Em **Settings → Build**:
   ```
   Root Directory: apps/api
   Build Command:  npm install && npm run build && npx prisma generate
   Start Command:  npx prisma migrate deploy && node dist/main
   ```

### 2.2 Variáveis de ambiente na Railway
Em **Variables**, adicione todas do `apps/api/.env.example`:

```bash
DATABASE_URL=postgresql://postgres.SEU-ID:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.SEU-ID:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://SEU-ID.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_JWT_SECRET=...
JWT_SECRET=...  # 64 chars random
AES_256_KEY=... # EXATAMENTE 32 chars
CORS_ORIGIN=https://SEU-APP.netlify.app
NODE_ENV=production
PORT=3333
```

### 2.3 Alternativa: Render.com
1. https://render.com → **New Web Service**
2. Root Directory: `apps/api`
3. Build: `npm install && npm run build`
4. Start: `npx prisma migrate deploy && node dist/main`
5. Mesmas variáveis de ambiente

### 2.4 Verificar deploy da API
```bash
# Após deploy, testar o health check:
curl https://sua-api.railway.app/api/v1/health
# Resposta esperada: {"status":"ok","timestamp":"..."}
```

**Copie a URL gerada** (ex: `https://autocore-erp-api.up.railway.app`) → vai precisar no próximo passo.

---

## PASSO 3 — Frontend React (Netlify)

### 3.1 Conectar repositório
1. https://app.netlify.com → **Add new site → Import from Git**
2. Selecione o repositório `autocore-erp`
3. Netlify detecta o `netlify.toml` automaticamente

### 3.2 Variáveis de ambiente no Netlify
**Site settings → Environment variables → Add variable:**

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://SEU-ID.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...anon-key` |
| `VITE_API_URL` | `https://sua-api.railway.app/api/v1` |
| `VITE_APP_NAME` | `AutoCore ERP` |
| `VITE_APP_ENV` | `production` |

### 3.3 Fazer o deploy
Clique em **Deploy site** → aguarda ~3 minutos.

**URL gerada**: `https://autocore-erp-XXXX.netlify.app`

### 3.4 Domínio customizado (opcional)
**Domain settings → Add custom domain:**
```
app.seudominio.com
```
Netlify gera HTTPS automaticamente (Let's Encrypt).

---

## PASSO 4 — Seed inicial (dados de demo)

Após o deploy da API, executar o seed via Railway Shell:

```bash
# No painel Railway → sua app → Shell:
cd apps/api
npx ts-node prisma/seed.ts
```

Isso cria:
- Tenant demo
- Usuário admin (`admin@autocore.com` / senha: `Admin@123456`)
- Permissões base
- Planos SaaS (Starter, Pro, Business, Enterprise, Ultimate)

---

## PASSO 5 — Verificação final

```bash
# 1. API saudável
curl https://sua-api.railway.app/api/v1/health
# → {"status":"ok","services":{"database":"ok",...}}

# 2. Frontend carregando
# Abrir https://autocore-erp-XXXX.netlify.app

# 3. Login funcionando
# admin@autocore.com / Admin@123456

# 4. Setup Wizard
# /setup-wizard → completar as etapas de configuração
```

---

## Resumo de Custos (estimativa)

| Serviço | Plano Grátis | Produção |
|---|---|---|
| Supabase | 500MB banco, 1GB storage | Pro $25/mês |
| Railway | $5 crédito/mês | Starter $5/mês |
| Netlify | 100GB banda, 300 min build | Pro $19/mês |
| **Total mínimo** | **Grátis** | **~$49/mês** |

Para começar: **tudo grátis** nos planos free tier.
