# ADR-001: Estratégia Multi-Tenant — tenantId por linha + RLS

**Data:** 2026-01-15  
**Status:** Aceito  
**Contexto:** Sprint 01 — Fundação

---

## Contexto

O AutoCore ERP é uma plataforma SaaS Enterprise com suporte a milhares de empresas (tenants) na mesma instância de banco de dados. Era necessário definir uma estratégia de isolamento de dados que balanceasse:
- Segurança absoluta (um tenant nunca acessa dados de outro)
- Performance (queries eficientes em escala de milhões de registros)
- Simplicidade operacional (um único banco Supabase, sem schemas separados)

## Decisão

Adotamos **Shared Database + Shared Schema com discriminador `tenantId`** em todas as tabelas, complementado por **Row Level Security (RLS) no Supabase** para garantia dupla de isolamento.

**Padrão aplicado em 207 modelos:** todo model que contém dados de negócio tem `tenantId: String @db.Uuid` como campo obrigatório + índice.

**Enforcement em 3 camadas:**
1. NestJS (`JwtAuthGuard` + `@CurrentUser()` extrai `tenantId` do JWT)
2. Prisma queries (`where: { tenantId: ctx.tenantId }` obrigatório em todos os serviços)
3. Supabase RLS (`apps/api/prisma/sql/rls_policies.sql`)

## Alternativas Consideradas

| Estratégia | Prós | Contras | Decisão |
|---|---|---|---|
| Schema por tenant | Isolamento máximo | N+1 conexões, migrações complexas | ❌ Rejeitado |
| Banco por tenant | Isolamento físico | Custo operacional alto | ❌ Rejeitado |
| Shared + tenantId | Simples, escalável | Requer disciplina no código | ✅ **Escolhido** |

## Consequências

**Positivas:**
- Zero overhead de conexão por tenant (pool compartilhado)
- Migration única para todos os tenants
- Supabase gerencia backup, escalabilidade e HA
- RLS como safety net contra bugs no application layer

**Negativas:**
- Desenvolvedores precisam sempre incluir `tenantId` nas queries (enforced por ESLint custom rule)
- Queries cruzadas de múltiplos tenants requerem bypass de RLS (apenas superadmin)

## Implementação de Referência

```sql
-- rls_policies.sql
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sales
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

```typescript
// Correto — sempre com tenantId
await prisma.sale.findMany({ where: { tenantId: ctx.tenantId } });

// Errado — NUNCA sem tenantId (ESLint rule)
await prisma.sale.findMany(); // ❌ bloqueado em PR
```
