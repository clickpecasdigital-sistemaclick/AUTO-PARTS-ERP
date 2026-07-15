-- =============================================================================
-- AutoCore ERP — Full Text Search de Produtos (Sprint 05)
-- =============================================================================
-- Aplicar via migration SQL manual (Prisma não gerencia colunas geradas/
-- tsvector nativamente). Não substitui a busca ILIKE já funcional em
-- ProductsRepository.findMany — é o upgrade de performance para catálogos
-- de milhões de linhas (ver Sprint 02, "Estratégia para milhões de
-- registros"): troque o ILIKE pela chamada à função `search_products()`
-- abaixo quando este índice existir, sem qualquer mudança de contrato na
-- API (mesma assinatura de busca por texto).

alter table products add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('portuguese', coalesce(internal_code, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(barcode, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(manufacturer_code, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(original_code, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(full_description, '')), 'C')
  ) stored;

create index if not exists idx_products_search_vector on products using gin (search_vector);

create or replace function search_products(p_tenant_id uuid, p_query text, p_limit int default 50)
returns setof products
language sql
stable
as $$
  select *
  from products
  where tenant_id = p_tenant_id
    and deleted_at is null
    and search_vector @@ websearch_to_tsquery('portuguese', p_query)
  order by ts_rank(search_vector, websearch_to_tsquery('portuguese', p_query)) desc
  limit p_limit;
$$;
