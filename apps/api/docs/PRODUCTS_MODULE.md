# Módulo Comercial de Produtos (Sprint 05)

> Primeiro módulo de negócio completo do AutoCore ERP. Construído
> exclusivamente sobre a arquitetura (Sprint 01), banco de dados (Sprint 02),
> Design System (Sprint 03) e Application Shell (Sprint 04) já aprovados —
> nenhum componente/layout/estrutura foi recriado.

---

## ⚠️ Limitação de ambiente conhecida (leia antes de rodar)

Este sandbox de desenvolvimento **não tem acesso de rede a
`binaries.prisma.sh`** (mesma restrição já documentada na Sprint 02). Isso
impede `npx prisma generate`, `prisma validate` e, por consequência,
`tsc`/`jest` no backend — eles dependem dos tipos `Prisma.*` gerados a
partir do `schema.prisma`.

**Em qualquer ambiente com acesso normal à internet, antes de rodar o
backend ou os testes:**
```bash
cd apps/api
npm install
npx prisma generate
npm run test       # roda a suíte de testes (mocks de Prisma, sem precisar de DB)
npm run start:dev  # API real (precisa de DATABASE_URL configurado)
```

**O que FOI validado de fato neste ambiente, sem ambiguidade:**
- Todos os nomes de modelo/campo usados no Repository/Service foram
  verificados programaticamente contra `schema.prisma` (script Python,
  100% de acerto — ver histórico desta sprint).
- `ESLint` do backend roda limpo (não depende de tipos gerados).
- O **frontend completo** (incluindo todo o módulo de Produtos) foi
  validado com `tsc --noEmit`, `eslint` e `vite build` reais — 0 erros,
  build de produção gerado com sucesso.

---

## O que foi entregue

### Backend (`apps/api/src/modules/products`)

| Arquivo | Responsabilidade |
|---|---|
| `products.controller.ts` | API REST completa, Swagger, upload multipart, export streaming |
| `products.service.ts` | Regras de negócio: código interno automático, margem/markup, orquestração de auditoria |
| `products.repository.ts` | Repository Pattern — único ponto de acesso Prisma a Produto |
| `products-import-export.service.ts` | Import CSV/Excel real (linha a linha, relatório de erro) + Export CSV/Excel/PDF real |
| `catalogs.controller.ts` / `.service.ts` | Lookups (marcas, fabricantes, unidades, grupos, veículos) para os formulários |
| `dto/*.ts` | DTOs com `class-validator`, decorados com `@nestjs/swagger` |
| `test/*.spec.ts` | Testes unitários (`ProductsService`) e de integração (`ProductsController`, módulo Nest real com Prisma mockado) |

**Infraestrutura nova, reutilizável por TODO módulo futuro:**
`common/guards/permissions.guard.ts` (+`@RequirePermission`), `common/audit/audit.service.ts`, `common/storage/supabase-storage.service.ts`.

### Schema (aditivo — ver `prisma/docs/CHANGELOG-sprint05.md`)
`ProductCategory`, `Product.categoryId/defaultCfopCode/defaultCstCode/defaultCsosnCode/distributorPrice`, `ProductCrossReference.type` (similar/equivalent/complementary/substitute), `ProductPromotion`.

### Frontend (`apps/web/src/modules/products`)
Listagem (`AdvancedDataTable` real, busca server-side debounced, export, import, exclusão em massa) + Cadastro em 9 abas (Dados Gerais, Tributação, Estoque, Preços, Fornecedores, Aplicações, Fotos, Relacionados, Histórico), 100% sobre componentes do Design System — nenhum Button/Input/Card/Table novo.

---

## Decisões de arquitetura

1. **`Unchecked*Input` do Prisma** em vez de `connect`/`disconnect` aninhado — DTOs mapeiam 1:1 para colunas escalares (`brandId: string`), reduzindo a área de superfície de erro de tipos.
2. **RBAC idêntico front/back**: `PermissionsGuard` (backend) e `usePermissions` (frontend, Sprint 04) implementam a MESMA política de bootstrap (ação `view` liberada até o Profile ter permissões explícitas; demais ações sempre exigem grant) — nunca divergem.
3. **Soft delete sempre**: `remove()` nunca executa `DELETE` físico (padrão definido na Sprint 02).
4. **Auditoria automática**: toda escrita do `ProductsService` chama `AuditService.log()` — criação, atualização, exclusão e, com a ação dedicada `price_change`, toda alteração de custo/preço de venda.
5. **Busca preparada para escala**: `ProductsRepository.findMany` usa `ILIKE` (funcional hoje); `prisma/sql/products_fulltext_search.sql` documenta o índice `tsvector`/GIN + função `search_products()` que a substituirá sem mudar a API.
6. **Fotos via Supabase Storage real**: upload/exclusão passam por `SupabaseStorageService`, nunca por um client Supabase ad-hoc.
7. **`httpClient` evoluído** (Sprint 01) para suportar `FormData` nativamente — necessário para upload de fotos e importação de planilha; bug real corrigido nesta sprint (antes, `JSON.stringify(FormData)` quebraria silenciosamente qualquer upload futuro).

## Fora de escopo (conforme briefing)
Movimentação de estoque e vendas — `StockTab` exibe saldo somente leitura; o módulo de Estoque (Sprint 06+) é quem escreve em `Stock`/`StockMovement`.
