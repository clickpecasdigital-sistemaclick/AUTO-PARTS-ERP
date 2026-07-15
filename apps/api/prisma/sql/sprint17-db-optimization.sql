-- =============================================================================
-- AutoCore ERP — Database Audit & Optimization (Sprint 17)
-- PostgreSQL 15 / Supabase
-- Executar em ambiente de desenvolvimento/staging — revisar antes de produção
-- =============================================================================

-- ---- 1. ÍNDICES COMPOSTOS CRÍTICOS (Performance) ----------------------------

-- Consultas frequentes de tenant + status + data
-- Padrão: WHERE tenantId = $1 AND status = $2 AND createdAt >= $3

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_tenant_created
  ON sales(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_tenant_salesperson
  ON sales(tenant_id, salesperson_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_items_tenant_product
  ON sale_items(tenant_id, product_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_receivable_tenant_status_due
  ON accounts_receivable(tenant_id, status, due_date)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_payable_tenant_status_due
  ON accounts_payable(tenant_id, status, due_date)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fiscal_invoices_tenant_status
  ON fiscal_invoices(tenant_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fiscal_invoices_customer
  ON fiscal_invoices(tenant_id, customer_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_orders_tenant_status
  ON service_orders(tenant_id, status, opened_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_orders_mechanic
  ON service_orders(tenant_id, mechanic_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_status
  ON products(tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tenant_name
  ON customers(tenant_id, name)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_orders_tenant_status
  ON purchase_orders(tenant_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_entity
  ON audit_logs(tenant_id, entity, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user
  ON audit_logs(tenant_id, user_id, created_at DESC);

-- ---- Data Warehouse — índices para queries analíticas ----------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_sales_tenant_datekey
  ON fact_sales(tenant_id, date_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_sales_product
  ON fact_sales(tenant_id, product_id, date_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_purchases_tenant_datekey
  ON fact_purchases(tenant_id, date_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_stock_tenant_datekey
  ON fact_stock(tenant_id, date_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_financial_tenant_type
  ON fact_financial(tenant_id, type, status, date_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_workshop_mechanic
  ON fact_workshop(tenant_id, mechanic_id, date_key);

-- ---- JWT Blacklist — TTL index (housekeeping automático) -------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jwt_blacklist_expires
  ON jwt_blacklist(expires_at)
  WHERE expires_at IS NOT NULL;

-- ---- Refresh Tokens --------------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_family
  ON refresh_tokens(family_id)
  WHERE is_revoked = false;

-- ---- 2. CONSTRAINTS DE INTEGRIDADE ADICIONAL --------------------------------

-- Garantir que amounts monetários nunca sejam negativos onde não faz sentido
ALTER TABLE sale_items
  ADD CONSTRAINT IF NOT EXISTS chk_sale_items_qty_positive
  CHECK (quantity > 0);

ALTER TABLE stock
  ADD CONSTRAINT IF NOT EXISTS chk_stock_qty_non_negative
  CHECK (quantity_on_hand >= 0);

ALTER TABLE subscriptions
  ADD CONSTRAINT IF NOT EXISTS chk_subscription_period
  CHECK (current_period_end > current_period_start);

-- ---- 3. VIEWS MATERIALIZADAS (Performance para queries complexas) ----------

-- MV: Saldo de estoque atual por produto e tenant (atualizada via trigger)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stock_current AS
SELECT
  s.tenant_id,
  s.product_id,
  p.internal_code,
  p.short_description,
  SUM(s.quantity_on_hand) AS total_qty,
  SUM(s.quantity_on_hand * s.average_cost) AS total_value,
  COUNT(DISTINCT s.warehouse_id) AS warehouse_count
FROM stock s
INNER JOIN products p ON p.id = s.product_id
WHERE s.deleted_at IS NULL AND p.deleted_at IS NULL
GROUP BY s.tenant_id, s.product_id, p.internal_code, p.short_description
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stock_current
  ON mv_stock_current(tenant_id, product_id);

-- MV: KPIs mensais de vendas (atualizada pelo ETL)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_sales AS
SELECT
  tenant_id,
  date_key / 100 AS year_month,  -- YYYYMM
  COUNT(DISTINCT sale_id) AS order_count,
  SUM(net_revenue) AS net_revenue,
  SUM(gross_profit) AS gross_profit,
  AVG(margin) AS avg_margin,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM fact_sales
GROUP BY tenant_id, date_key / 100
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_sales
  ON mv_monthly_sales(tenant_id, year_month);

-- Função para refresh das MVs (chamada pelo ETL após sincronização)
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stock_current;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_sales;
END;
$$ LANGUAGE plpgsql;

-- ---- 4. ROW LEVEL SECURITY — Políticas completas ---------------------------

-- Habilitar RLS em todas as tabelas de negócio
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('_prisma_migrations', 'dim_time', 'i18n_keys', 'plans', 'plan_limits', 'plan_features')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Política para usuários autenticados do Supabase
    EXECUTE format($fmt$
      CREATE POLICY IF NOT EXISTS tenant_isolation_select ON %I
        FOR SELECT USING (
          tenant_id::text = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')
          OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role'
        )
    $fmt$, tbl);

    EXECUTE format($fmt$
      CREATE POLICY IF NOT EXISTS tenant_isolation_modify ON %I
        FOR ALL USING (
          tenant_id::text = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')
          OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role'
        )
    $fmt$, tbl);
  END LOOP;
END $$;

-- ---- 5. FUNCTIONS DE HOUSEKEEPING ------------------------------------------

-- Limpar JWT blacklist expirada (chamar via pg_cron diariamente)
CREATE OR REPLACE FUNCTION housekeeping_jwt_blacklist()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM jwt_blacklist WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Limpar refresh tokens expirados
CREATE OR REPLACE FUNCTION housekeeping_refresh_tokens()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM refresh_tokens WHERE expires_at < NOW() AND is_revoked = true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Limpar telemetria antiga (> 90 dias)
CREATE OR REPLACE FUNCTION housekeeping_telemetry(retention_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM telemetry_events WHERE created_at < NOW() - (retention_days || ' days')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ---- 6. AUDIT REPORT QUERY --------------------------------------------------

-- Query de diagnóstico: tabelas sem índice em tenant_id
-- Executar para validar cobertura de índices
SELECT
  t.tablename,
  CASE WHEN i.indexname IS NULL THEN 'SEM ÍNDICE tenant_id ⚠️' ELSE 'OK ✓' END AS status
FROM pg_tables t
LEFT JOIN pg_indexes i
  ON i.tablename = t.tablename
  AND i.indexdef LIKE '%tenant_id%'
WHERE t.schemaname = 'public'
  AND t.tablename NOT IN ('_prisma_migrations', 'dim_time', 'i18n_keys', 'plans', 'plan_limits', 'plan_features', 'jwt_blacklist')
ORDER BY status DESC, t.tablename;

-- Query de diagnóstico: tabelas com mais registros
SELECT
  schemaname,
  relname AS tablename,
  n_live_tup AS estimated_rows,
  n_dead_tup AS dead_tuples,
  pg_size_pretty(pg_relation_size(quote_ident(relname))) AS table_size
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 20;
