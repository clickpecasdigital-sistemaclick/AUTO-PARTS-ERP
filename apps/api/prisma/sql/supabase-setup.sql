-- =============================================================================
-- AutoCore ERP — Supabase Setup (executar no SQL Editor do Supabase)
-- =============================================================================
-- Execute este script UMA VEZ após criar o projeto Supabase,
-- ANTES de rodar `prisma migrate deploy`.
-- =============================================================================

-- ---- 1. EXTENSÕES NECESSÁRIAS -----------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- UUID v4
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Full-text search (LIKE %)
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- Busca sem acentos

-- ---- 2. CONFIGURAÇÕES DE PERFORMANCE ----------------------------------------

-- Aumentar work_mem para queries analíticas do DW
-- (ajustar conforme RAM disponível no plano)
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- ---- 3. BUCKETS DO STORAGE --------------------------------------------------
-- Executar via Supabase SDK ou painel → Storage → New Bucket

-- Os buckets abaixo devem ser criados no painel do Supabase:
-- product-photos    → público
-- documents         → privado
-- fiscal-certificates → privado
-- backups           → privado

-- ---- 4. STORAGE POLICIES ----------------------------------------------------

-- Política: usuários autenticados podem fazer upload de fotos de produtos
-- (executar após criar o bucket product-photos)
/*
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'product-photos-upload',
  'product-photos',
  'INSERT',
  '(auth.role() = ''authenticated'')'
);

INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'product-photos-public-read',
  'product-photos',
  'SELECT',
  'true'
);
*/

-- ---- 5. FUNÇÃO DE ATUALIZAÇÃO DE UPDATED_AT ---------------------------------

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---- 6. VERIFICAÇÃO ---------------------------------------------------------

SELECT version();
SELECT current_database();
SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;
