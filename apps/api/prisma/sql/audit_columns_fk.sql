-- =============================================================================
-- AutoCore ERP — FKs complementares para colunas de auditoria (created_by/updated_by)
-- =============================================================================
-- Racional completo em DATABASE.md, seção 6 ("Exceção deliberada: colunas
-- de auditoria"). Este script adiciona a integridade referencial real no
-- banco para as colunas created_by/updated_by que, no Prisma, são mantidas
-- como colunas escalares (não como `@relation` nomeada) para não multiplicar
-- a quantidade de relações declaradas no schema.
--
-- Gerar a lista completa de tabelas/colunas via:
--   SELECT table_name FROM information_schema.columns
--   WHERE column_name IN ('created_by','updated_by') AND table_schema = 'public';
--
-- Exemplo (replicar o mesmo padrão para as demais tabelas listadas):

alter table public.products
  add constraint fk_products_created_by
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.products
  add constraint fk_products_updated_by
  foreign key (updated_by) references public.users(id) on delete set null;

alter table public.sales
  add constraint fk_sales_created_by
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.service_orders
  add constraint fk_service_orders_created_by
  foreign key (created_by) references public.users(id) on delete set null;

-- ... replicar para as demais ~89 tabelas com created_by/updated_by.
-- Recomenda-se gerar este script automaticamente (não manualmente) a partir
-- do information_schema, como parte do job de setup do banco na Sprint 03,
-- para garantir cobertura de 100% das tabelas sem erro humano de omissão.
