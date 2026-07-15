-- =============================================================================
-- AutoCore ERP — Políticas de RLS (Row Level Security) do Supabase
-- =============================================================================
-- Este arquivo é referência/template para a Sprint 03 (quando os módulos de
-- negócio forem implementados e o Supabase Auth estiver emitindo claims
-- customizadas no JWT). NÃO é executado automaticamente pelo Prisma Migrate
-- — Prisma não gerencia RLS nativamente. Deve ser aplicado via:
--   supabase db execute -f prisma/sql/rls_policies.sql
-- ou colado como uma migration SQL manual em prisma/migrations/<timestamp>_rls/migration.sql
--
-- Pré-requisito: o JWT emitido pelo Supabase Auth deve conter as claims
-- customizadas `tenant_id` (via custom access token hook / app_metadata),
-- definidas na sincronização de usuário (auth.module.ts da API).

-- -----------------------------------------------------------------------------
-- Funções auxiliares
-- -----------------------------------------------------------------------------

create or replace function auth.tenant_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid,
    null
  );
$$;

create or replace function auth.has_branch_access(target_branch_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.user_branches ub
    where ub.user_id = auth.uid()
      and ub.branch_id = target_branch_id
  );
$$;

-- -----------------------------------------------------------------------------
-- Padrão A — Tabelas tenant-scoped (sem granularidade de filial)
-- Exemplo de aplicação: customers, suppliers, products, profiles...
-- -----------------------------------------------------------------------------

alter table public.customers enable row level security;

create policy tenant_isolation_select on public.customers
  for select using (tenant_id = auth.tenant_id());

create policy tenant_isolation_write on public.customers
  for all using (tenant_id = auth.tenant_id())
  with check (tenant_id = auth.tenant_id());

-- Repetir o mesmo par de policies para: companies, suppliers, employees,
-- carriers, products, product_groups, product_subgroups, customer_vehicles,
-- profiles, leads, ai_interactions, tax_rules, notifications, etc.

-- -----------------------------------------------------------------------------
-- Padrão B — Tabelas branch-scoped (isolamento multiempresa + multiloja)
-- Exemplo de aplicação: sales, sales_orders, quotes, purchase_orders,
-- service_orders, cash_registers, fiscal_invoices, warehouses...
-- -----------------------------------------------------------------------------

alter table public.sales enable row level security;

create policy tenant_and_branch_isolation_select on public.sales
  for select using (
    tenant_id = auth.tenant_id()
    and auth.has_branch_access(branch_id)
  );

create policy tenant_and_branch_isolation_write on public.sales
  for all using (
    tenant_id = auth.tenant_id()
    and auth.has_branch_access(branch_id)
  )
  with check (
    tenant_id = auth.tenant_id()
    and auth.has_branch_access(branch_id)
  );

-- Repetir o mesmo par de policies para: sales_orders, quotes,
-- purchase_orders, goods_receipts, service_orders, cash_registers,
-- cash_movements, fiscal_invoices, warehouses, stock_movements,
-- appointments.

-- -----------------------------------------------------------------------------
-- Padrão C — Catálogos GLOBAIS (leitura pública autenticada, escrita
-- restrita ao service role da plataforma)
-- Exemplo de aplicação: ncms, cfops, cst_icms, csosn_icms, cests,
-- vehicle_makes, vehicle_models, vehicle_versions, engines, fuel_types,
-- brands, manufacturers, units, permissions.
-- -----------------------------------------------------------------------------

alter table public.ncms enable row level security;

create policy global_catalog_read on public.ncms
  for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- Nenhuma policy de INSERT/UPDATE/DELETE é criada para roles de aplicação:
-- por padrão, RLS nega tudo que não tem policy explícita — apenas a
-- service_role (usada por jobs administrativos de importação de catálogo)
-- ignora RLS por definição do Postgres/Supabase.

-- -----------------------------------------------------------------------------
-- Tabelas filhas (itens) — herdam o isolamento do documento pai através do
-- tenant_id denormalizado na própria linha (ver DATABASE.md, seção 1),
-- evitando JOIN dentro da policy por questão de performance.
-- -----------------------------------------------------------------------------

alter table public.sale_items enable row level security;

create policy tenant_isolation_select on public.sale_items
  for select using (tenant_id = auth.tenant_id());

create policy tenant_isolation_write on public.sale_items
  for all using (tenant_id = auth.tenant_id())
  with check (tenant_id = auth.tenant_id());

-- Repetir para: quote_items, sales_order_items, purchase_order_items,
-- goods_receipt_items, fiscal_invoice_items, stock_transfer_items,
-- inventory_items, service_order_services, service_order_parts.
