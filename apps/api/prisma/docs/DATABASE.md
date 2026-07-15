# AutoCore ERP — Engenharia de Banco de Dados (Sprint 02)

> Schema fonte da verdade: `apps/api/prisma/schema.prisma` (92 models, 46 enums).
> Este documento descreve a engenharia completa do banco: diagrama, tabelas,
> relacionamentos, índices, constraints, FKs e as estratégias de migration,
> seed, backup, performance e escala.

---

## 1. Diagrama textual completo do banco

```
Tenant (conta SaaS)
 ├─ Company (empresa/CNPJ)              [1:N]
 │   ├─ Branch (filial)                 [1:N]
 │   │   ├─ Warehouse (depósito)        [1:N]
 │   │   │   ├─ Aisle (corredor)        [1:N]
 │   │   │   │   └─ Shelf (prateleira)  [1:N]
 │   │   │   │       └─ StorageLocation [1:N]
 │   │   │   ├─ Stock (saldo)           [1:N]
 │   │   │   ├─ StockMovement (ledger)  [1:N]
 │   │   │   └─ Inventory → InventoryItem
 │   │   ├─ Employee (funcionário) ── Salesperson | Mechanic (1:1 especialização)
 │   │   ├─ CashRegister → CashMovement
 │   │   ├─ Quote → QuoteItem
 │   │   ├─ SalesOrder → SalesOrderItem
 │   │   ├─ Sale → SaleItem, SalePayment
 │   │   ├─ PurchaseOrder → PurchaseOrderItem → GoodsReceipt → GoodsReceiptItem
 │   │   ├─ ServiceOrder → ServiceOrderService, ServiceOrderPart,
 │   │   │                 ServiceOrderChecklist → ServiceOrderChecklistItem,
 │   │   │                 Warranty
 │   │   ├─ FiscalConfiguration (1:1) ── FiscalCertificate
 │   │   ├─ FiscalSeries → FiscalInvoice → FiscalInvoiceItem, FiscalInvoiceEvent
 │   │   └─ Appointment (agenda)
 │   ├─ Customer (cliente)               [1:N]
 │   │   ├─ CustomerAddress
 │   │   └─ CustomerVehicle ── VehicleVersion (catálogo global)
 │   ├─ Supplier (fornecedor)            [1:N]
 │   ├─ Carrier (transportadora)         [1:N]
 │   ├─ CostCenter, ChartOfAccount (hierárquico), BankAccount
 │   └─ AccountsPayable / AccountsReceivable (parceladas, self-FK parentId)
 ├─ User (login) ── UserBranch (N:N c/ Branch) ── Profile → ProfilePermission → Permission (global)
 ├─ Profile (perfil RBAC customizável)
 └─ AuditLog / SystemLog

Product (catálogo de peças, tenant-scoped)
 ├─ Brand, Manufacturer, Unit (catálogos globais)
 ├─ ProductGroup → ProductSubgroup (tenant-scoped)
 ├─ ProductPhoto, ProductSupplier (N:N c/ Supplier)
 ├─ ProductCrossReference (auto-relação N:N — peças similares)
 └─ ProductVehicleApplication (N:N c/ VehicleVersion — catálogo inteligente)

Catálogo global de veículos (compartilhado entre todos os tenants)
 VehicleMake → VehicleModel → VehicleVersion ── Engine, FuelType

Catálogo fiscal global (compartilhado entre todos os tenants)
 Ncm, Cest, Cfop, CstIcms, CsosnIcms

CRM
 Lead ── Interaction, Appointment
 Customer ── Interaction, Appointment

IA
 AiPromptTemplate → AiInteraction → AiFeedback (1:1)

Anexos genéricos (qualquer entidade)
 Attachment (entity, entity_id) — sem FK física, ver seção 6
```

### Domínios de escopo (quem tem `tenant_id` / `company_id` / `branch_id`)

| Escopo | Exemplos de tabelas | Regra |
|---|---|---|
| **Global** (sem tenant_id) | `Ncm`, `Cfop`, `Cst*`, `Cest`, `VehicleMake/Model/Version`, `Engine`, `FuelType`, `Unit`, `Brand`, `Manufacturer`, `Permission` | Catálogos de referência (norma fiscal ou de mercado), mantidos pela plataforma, lidos por todos os tenants. |
| **Tenant** | `Company`, `User`, `Profile`, `Product`, `ProductGroup`... | Toda tabela operacional/cadastral carrega `tenant_id`, mesmo quando também carrega `company_id`/`branch_id` — denormalização proposital para simplificar políticas de RLS (ver seção 10). |
| **Company** | `Customer`, `Supplier`, `Carrier`, `Employee`, `CostCenter`, `ChartOfAccount`, `BankAccount` | Cadastro pode ser usado por qualquer filial da mesma empresa (CNPJ). |
| **Branch** | `Warehouse`, `CashRegister`, `Sale`, `SalesOrder`, `Quote`, `PurchaseOrder`, `ServiceOrder`, `FiscalSeries`, `FiscalInvoice`, `Appointment` | Operação ocorre fisicamente em uma filial. |

---

## 2. Lista de todas as tabelas (92)

**Tenancy / Segurança (10):** tenants, companies, branches, users, user_branches,
profiles, permissions, profile_permissions, audit_logs, system_logs

**Pessoas (10):** customers, customer_addresses, suppliers, employees,
salespersons, mechanics, carriers, customer_vehicles, leads, interactions

**Catálogo de veículos (5):** vehicle_makes, vehicle_models, engines,
fuel_types, vehicle_versions

**Produtos (9):** brands, manufacturers, units, product_groups,
product_subgroups, products, product_photos, product_suppliers,
product_cross_references, product_vehicle_applications *(9 listadas, ok)*

**Estoque (11):** warehouses, aisles, shelves, storage_locations, stocks,
stock_movements, inventories, inventory_items, stock_transfers,
stock_transfer_items

**Compras (4):** purchase_orders, purchase_order_items, goods_receipts,
goods_receipt_items

**Vendas / Caixa (10):** quotes, quote_items, sales_orders, sales_order_items,
sales, sale_items, payment_methods, sale_payments, cash_registers, cash_movements

**Financeiro (6):** cost_centers, chart_of_accounts, bank_accounts,
accounts_payable, accounts_receivable, commissions

**Oficina (10):** services, service_orders, service_order_services,
service_order_parts, checklist_templates, checklist_template_items,
service_order_checklists, service_order_checklist_items, warranties,
attachments

**CRM / Agenda (2):** appointments, *(leads/interactions já listados em Pessoas)*

**Notificações (1):** notifications

**IA (3):** ai_prompt_templates, ai_interactions, ai_feedback

**Fiscal (11):** ncms, cests, cfops, cst_icms, csosn_icms, tax_rules,
fiscal_configurations, fiscal_certificates, fiscal_series, fiscal_invoices,
fiscal_invoice_items, fiscal_invoice_events

> Lista normativa e sempre atualizada: `grep -oP '^model \K\w+' schema.prisma`.

---

## 3. Relacionamentos

Padrões aplicados:

- **1:N** é o padrão dominante (ex.: `Company 1:N Branch`, `Sale 1:N SaleItem`).
- **1:1**: `Employee ↔ Salesperson`, `Employee ↔ Mechanic`, `Employee ↔ User`,
  `Branch ↔ FiscalConfiguration`, `AiInteraction ↔ AiFeedback` — implementados
  com FK `@unique` no lado dependente.
- **N:N explícito (com tabela intermediária)**:
  - `Product ↔ Supplier` via `ProductSupplier` (com preço/prazo por fornecedor)
  - `Product ↔ VehicleVersion` via `ProductVehicleApplication` (catálogo
    inteligente de aplicação)
  - `Product ↔ Product` (similares) via `ProductCrossReference`
    (relação nomeada `ProductCrossRefSource`/`ProductCrossRefTarget`)
  - `User ↔ Branch` via `UserBranch` (controle de acesso multiloja)
  - `Profile ↔ Permission` via `ProfilePermission`
- **Auto-relacionamento (hierarquia)**:
  - `ChartOfAccount.parentId → ChartOfAccount` (plano de contas em árvore)
  - `AccountsPayable.parentId` / `AccountsReceivable.parentId` (parcelas de
    um mesmo título)
- **Relações nomeadas (para resolver ambiguidade de múltiplas FKs ao mesmo
  modelo)**: `StockTransferOrigin/Destination` (`StockTransfer → Warehouse`
  duas vezes), `ProductPrimarySupplier`.
- **Polimorfismo controlado (sem FK física)**: `AuditLog.entity/entityId` e
  `Attachment.entity/entityId` — ver racional na seção 6.

---

## 4. Índices

Estratégia geral: toda FK recebe índice (Postgres não cria automaticamente
em colunas de FK, diferente da PK); toda coluna usada em filtro de listagem
(status, datas de vencimento/emissão, código de busca) recebe índice
dedicado ou composto.

Destaques de índices compostos para as tabelas de maior volume:

| Tabela | Índice | Motivo |
|---|---|---|
| `products` | `(tenant_id, barcode)`, `(tenant_id, manufacturer_code)`, `(tenant_id, original_code)`, `(tenant_id, short_description)` | Busca de balcão precisa ser instantânea por qualquer um desses códigos. |
| `stock_movements` | `(product_id, warehouse_id)`, `(document_type, document_id)`, `created_at` | Recompor saldo histórico e auditar origem do movimento. |
| `sales` | `(tenant_id, branch_id)`, `(status)`, `(issued_at)` | Dashboards de vendas por período/filial. |
| `accounts_payable` / `accounts_receivable` | `(status, due_date)` | Relatório de vencidos/a vencer é a consulta mais frequente do financeiro. |
| `audit_logs` | `(tenant_id, entity, entity_id)`, `(tenant_id, created_at)` | Consultar histórico de um registro e auditoria por período. |
| `fiscal_invoices` | `(branch_id, model, series, number)` único, `access_key` único | Garantir não duplicidade de numeração fiscal e busca por chave de acesso. |

> Lista normativa: `grep -E '@@index|@@unique' schema.prisma`.

---

## 5. Constraints

- **NOT NULL** implícito em todo campo sem `?` no Prisma (ex.: `Product.shortDescription`, `Sale.totalAmount`).
- **UNIQUE simples**: `Tenant.document`, `Company.document`, `Permission.key`, `FiscalInvoice.accessKey`, `Ncm.code` (PK), etc.
- **UNIQUE composto** (a maioria dos cadastros, para permitir o mesmo código em tenants/escopos diferentes):
  - `Product (tenant_id, internal_code)`
  - `Customer (company_id, document)` / `Supplier (company_id, document)`
  - `Branch (company_id, code)` / `Warehouse (branch_id, code)`
  - `Sale (tenant_id, code)`, `PurchaseOrder (tenant_id, code)`, `Quote (tenant_id, code)`
  - `FiscalInvoice (branch_id, model, series, number)` — chave de negócio da NF-e
  - `FiscalSeries (branch_id, model, series)`
- **CHECK implícitos via enum**: todos os campos de status/tipo usam `enum` do Postgres
  (`SaleStatus`, `PurchaseOrderStatus`, `FiscalInvoiceStatus` etc.), o que
  o Postgres valida nativamente — impossível gravar um status fora do
  domínio permitido.
- **Precisão monetária/fiscal**: `Decimal(15,2)` para valores monetários e
  `Decimal(7,4)` para alíquotas/percentuais — evita os erros de
  arredondamento de `float`/`double`.
- **Soft delete** (`deletedAt`) em toda tabela cadastral/transacional — o
  `DELETE` físico é proibido por padrão da aplicação (enforced na camada de
  Repository, Sprint 03); apenas catálogos imutáveis (`Ncm`, `Cfop` etc.)
  não possuem `deletedAt` pois são geridos via *upsert* administrativo.

---

## 6. Chaves estrangeiras

Toda relação Prisma do schema gera uma `FOREIGN KEY` real no Postgres. Regras
de `onDelete` aplicadas por tipo de relação:

| Padrão | `onDelete` | Exemplo |
|---|---|---|
| Pai "dono" do filho (apaga tudo em cascata) | `Cascade` | `Tenant → Company`, `Sale → SaleItem`, `PurchaseOrder → PurchaseOrderItem` |
| Cadastro mestre referenciado por documento histórico | `Restrict` | `Product` referenciado por `SaleItem`/`PurchaseOrderItem` (não é possível excluir um produto com histórico) |
| Referência opcional/secundária | `SetNull` | `Sale.salespersonId`, `Product.brandId`, `AccountsPayable.bankAccountId` |

### Exceção deliberada: colunas de auditoria (`created_by`/`updated_by`)

Em **todas** as 92 tabelas, `created_by`/`updated_by` existem como colunas
escalares `uuid` (não como relação Prisma nomeada para `User`). Decisão de
engenharia: modelar essas duas colunas como relação Prisma explícita em
92 tabelas exigiria ~180 nomes de relação únicos só para auditoria,
multiplicando o tamanho do schema sem ganho funcional (a navegação
"quem criou" é feita por uma consulta simples `users.id = created_by`).
A integridade referencial real é garantida por uma **FK adicionada via SQL
de migration complementar** (`prisma/sql/audit_columns_fk.sql`), com
`ON DELETE SET NULL` — assim o banco continua 100% íntegro, só não aparece
como relação navegável no client Prisma. Mantivemos como relação Prisma de
primeira classe apenas os vínculos de negócio reais (`Employee.userId`,
`Sale.salespersonId`, `ServiceOrder.mechanicId` etc.).

### Exceção deliberada: `entity`/`entity_id` (AuditLog, Attachment)

Essas duas tabelas precisam apontar para *qualquer* tabela do sistema
(uma trilha de auditoria não pode ter 92 colunas de FK opcionais, uma por
tabela possível). É o único ponto do schema sem FK física — mitigado por:
índice composto `(entity, entity_id)` para performance de consulta e
validação do conjunto de valores permitidos de `entity` na camada de
aplicação (enum de strings conhecidas, validado por DTO/Zod no backend).

---

## 7. Estrutura Prisma Schema

Arquivo completo: [`apps/api/prisma/schema.prisma`](../schema.prisma).
Organizado em 13 seções comentadas, na ordem:

1. Tenancy, Empresas, Filiais, Segurança (RBAC) e Auditoria
2. Pessoas e Parceiros (Clientes, Fornecedores, Equipe, Transporte)
3. Catálogo de Veículos (global)
4. Produtos
5. Estoque
6. Compras
7. Vendas (Orçamento → Pedido → Venda), Caixa e Pagamentos
8. Financeiro
9. Oficina (Ordens de Serviço)
10. CRM (Leads, Atendimentos, Agenda)
11. Notificações
12. Inteligência Artificial
13. Estrutura Fiscal (NF-e)

Validado estruturalmente (consistência de relações, ausência de relações
ambíguas e de modelos/tabelas duplicadas) via scripts internos de análise
estática do AST do schema — a geração do Prisma Client/`migrate dev` real
deve ser executada em ambiente com acesso à internet liberado para
`binaries.prisma.sh` (bloqueado neste sandbox de desenvolvimento).

---

## 8. Estratégia de Migrations

- **Ferramenta**: `prisma migrate dev` em ambiente local/CI, `prisma migrate
  deploy` em produção (nunca `db push` em produção — perde histórico).
- **Uma migration por sprint/feature coesa**, nunca uma migration gigante por
  sprint inteira: ao implementar os módulos de negócio (Sprint 03+), cada
  módulo gera sua própria migration incremental sobre este schema-base.
- **Naming convention**: `YYYYMMDDHHMMSS_modulo_descricao` (gerado
  automaticamente pelo Prisma a partir da pasta `prisma/migrations/`).
- **Migrations aditivas em produção com tabela grande**: para tabelas como
  `products`/`stock_movements` (potencialmente milhões de linhas):
  1. Adicionar coluna sempre como `NULL` ou com `DEFAULT` (evita lock de
     rewrite de tabela completa em versões antigas do Postgres; no Postgres
     11+ `ADD COLUMN ... DEFAULT` já é O(1) quando não há `NOT NULL`).
  2. Criar índice novo com `CREATE INDEX CONCURRENTLY` (fora da transação
     da migration Prisma — via migration "vazia" com SQL customizado,
     `prisma migrate dev --create-only`) para não bloquear escrita.
  3. Backfill de dados em lote (batches de 5–10k linhas) via script, nunca
     em uma única transação.
  4. Só então aplicar `NOT NULL`/constraint definitiva.
- **Shadow database**: Prisma usa uma shadow DB para calcular diffs em dev —
  manter um banco Supabase de "staging" dedicado para isso, nunca a shadow
  contra produção.
- **Rollback**: toda migration destrutiva (`DROP COLUMN`/`DROP TABLE`) é
  precedida de uma migration de *depreciação* (campo marcado `@deprecated`
  em comentário, removido somente 1+ sprint depois de confirmar que nenhum
  código ainda o utiliza).
- **CI**: pipeline executa `prisma migrate deploy` contra banco de teste +
  `prisma validate` em todo PR que toque `schema.prisma`.

---

## 9. Estratégia de Seeds

Três categorias de dados, com tratamento diferente (ver `prisma/seed.ts`):

1. **Estrutural/técnico** (idempotente, roda em qualquer ambiente):
   tenant de desenvolvimento, permissões base (`Permission`), combustíveis
   (`FuelType`, enum fechado por norma).
2. **Catálogos oficiais de grande volume** (não vivem no `seed.ts`, são
   importados por *job* dedicado, fora do ciclo de deploy):
   - `Ncm` (~10.000 códigos) — importação a partir do arquivo oficial da
     Receita Federal (tabela TIPI/NCM), atualizado anualmente.
   - `Cest`, `CstIcms`, `CsosnIcms`, `Cfop` (completo) — tabelas SEFAZ.
   - `VehicleMake` / `VehicleModel` / `VehicleVersion` — importação a partir
     de provedor de catálogo veicular (ex: FIPE/Mercado Livre/base própria
     licenciada), script `scripts/import-vehicle-catalog.ts` (a implementar
     na sprint do módulo de Veículos).
   Esses scripts usam `upsert` em lote (`createMany` com `skipDuplicates`
   quando não há necessidade de update) para serem reexecutáveis.
3. **Dados de demonstração para QA/onboarding de novo tenant** (explicitamente
   **fora de escopo desta sprint**, conforme instrução de não usar dados
   fictícios): quando implementados, vivem em `prisma/seed-demo.ts`,
   separado do seed de produção, e só executam sob flag explícita
   `SEED_DEMO_DATA=true`.

---

## 10. Estratégia de Backup

- **Supabase managed backups**: ativar *Point-in-Time Recovery* (PITR) no
  plano Pro+ do Supabase desde o primeiro dia de produção — permite restaurar
  para qualquer segundo dos últimos N dias (não apenas snapshots diários).
- **Snapshots diários automáticos** (retenção mínima 30 dias) como segunda
  camada, independentes do PITR.
- **Backup lógico semanal** (`pg_dump --format=custom`) exportado para um
  bucket de storage fora da infraestrutura do Supabase (ex: Supabase Storage
  de outro projeto, ou S3-compatível), mitigando o risco de
  "single point of failure de provedor".
- **Teste de restauração trimestral obrigatório**: um backup que nunca foi
  restaurado em ambiente de teste não é um backup confiável — agendar
  restauração completa em banco de staging a cada 3 meses e validar
  contagem de linhas das tabelas críticas (`sales`, `products`, `stock_movements`).
- **Tabelas fiscais (`fiscal_invoices`, `fiscal_invoice_events`)** têm
  exigência legal de retenção de 5 anos (Brasil) — política de retenção do
  backup lógico nunca deve ser menor que isso, mesmo que o backup
  operacional padrão tenha retenção menor.
- **RLS não substitui backup**: isolamento multi-tenant protege contra
  acesso indevido entre clientes, não contra perda de dados — ambas as
  camadas são necessárias.

---

## 11. Estratégia de Performance

- **Connection pooling obrigatório**: usar o *connection pooler* do Supabase
  (PgBouncer, modo `transaction`) na `DATABASE_URL` da aplicação (porta 6543)
  e a conexão direta (porta 5432) apenas em `DIRECT_URL`, usada só pelo
  Prisma Migrate — essencial para suportar "milhares de usuários
  simultâneos" sem esgotar conexões do Postgres.
- **Decimal em vez de float**: já aplicado em todo o schema — evita CPU
  extra de coerção e elimina bugs de arredondamento monetário.
- **Saldo de estoque desnormalizado (`Stock`)**: consulta de "quanto tem em
  estoque" é O(1) por `(productId, warehouseId)` em vez de somar milhões de
  linhas de `StockMovement` em tempo real. O ledger (`StockMovement`)
  permanece como fonte de verdade para auditoria/recomposição, mas não é
  consultado no caminho crítico de leitura.
- **Índices parciais** (a aplicar via migration SQL customizada quando o
  volume justificar, ex.: `CREATE INDEX ... WHERE deleted_at IS NULL` em
  `products`/`customers`) — reduz o tamanho do índice e acelera consultas
  que (na enorme maioria dos casos) ignoram registros deletados.
- **Cache de leitura no backend** (Redis, a introduzir no módulo de API):
  catálogos globais (`Ncm`, `Cfop`, `VehicleMake/Model`) e configurações de
  tenant raramente mudam — candidatos ideais a cache com invalidação por
  evento, tirando carga de leitura repetitiva do Postgres.
- **TanStack Query no frontend** (já configurado na Sprint 01) com
  `staleTime` de 30s reduz radicalmente o número de requisições repetidas
  por usuário simultâneo.
- **EXPLAIN ANALYZE como rotina**: qualquer query de relatório (ex: "vendas
  por filial no mês") deve ser validada com `EXPLAIN ANALYZE` antes de ir
  para produção; metas de p95 documentadas por endpoint no momento da
  implementação de cada módulo.

---

## 12. Estratégia para milhões de registros

Tabelas com expectativa de crescimento para a casa de milhões/dezenas de
milhões de linhas: `products`, `stock_movements`, `sale_items`, `sales`,
`fiscal_invoice_items`, `audit_logs`.

- **Particionamento por intervalo de tempo (`PARTITION BY RANGE`)** —
  candidatas naturais: `stock_movements`, `audit_logs`, `sales`/`sale_items`
  e `fiscal_invoices`/`fiscal_invoice_items`, particionadas por mês ou
  trimestre de `created_at`/`issued_at`. Particionamento é aplicado via
  migration SQL customizada (Prisma não gerencia partições nativamente,
  mas o Postgres trata a tabela particionada como uma tabela só — o
  `schema.prisma` não precisa mudar). Permite:
  - `DROP PARTITION` (instantâneo) em vez de `DELETE` em massa ao arquivar
    dados antigos para storage frio;
  - planejador do Postgres ignora partições fora do range do filtro
    (*partition pruning*), acelerando relatórios por período.
- **Arquivamento ("data tiering")**: dados fiscais/auditoria com mais de
  2 anos migram para uma tabela/partição "fria" (mesmo schema, storage mais
  barato) ou para um data warehouse analítico, mantendo o banco
  transacional magro e rápido para a operação do dia a dia.
- **`internal_code`/`barcode` como índice B-Tree padrão** é suficiente até
  a casa de dezenas de milhões de produtos; se a busca textual (ex: por
  parte da descrição) se tornar um requisito de produto, migrar para
  índice `GIN` com `pg_trgm` (busca fuzzy) ou extrair para um motor de busca
  dedicado (ex: Meilisearch/Typesense) alimentado por *change data capture*
  do Postgres — decisão a ser tomada com dados reais de uso, não
  prematuramente.
- **Paginação sempre por cursor (keyset pagination)** nas listagens de
  alto volume (`products`, `stock_movements`), não por `OFFSET` — `OFFSET`
  degrada linearmente com o tamanho da tabela; cursor por `(created_at, id)`
  mantém performance constante independente da página.
- **Agregações pré-calculadas**: relatórios pesados (ex: "produtos mais
  vendidos do mês", "ranking de comissão por vendedor") não devem rodar
  `GROUP BY` em tabelas de fato no horário de pico — um *materialized view*
  Postgres (`REFRESH MATERIALIZED VIEW CONCURRENTLY`, agendado) ou uma
  tabela de agregação alimentada por job assíncrono resolve sem competir
  com a carga transacional.
- **Multi-tenant em escala**: com `tenant_id` em praticamente toda tabela e
  índices compostos liderados por `tenant_id`, o Postgres consegue manter
  performance estável mesmo com milhares de tenants, pois cada consulta de
  aplicação naturalmente filtra por tenant (reforçado pela política de RLS
  da seção 13) — o índice composto `(tenant_id, ...)` garante que o
  planejador nunca precise varrer dados de outros tenants.

---

## 13. RLS (Row Level Security) — Política Multiempresa/Multiloja

Estratégia completa e exemplos de policy SQL documentados em
[`apps/api/prisma/sql/rls_policies.sql`](../sql/rls_policies.sql). Resumo:

- RLS **habilitado em toda tabela com `tenant_id`** (todas, exceto os
  catálogos globais explicitamente listados na seção 1).
- Toda policy usa a função `auth.tenant_id()` (wrapper sobre
  `current_setting('request.jwt.claims', true)::json->>'tenant_id'`,
  populado pelo Supabase a partir do JWT do usuário autenticado).
- Tabelas com `branch_id` recebem uma segunda policy combinando
  `tenant_id` **e** verificação de que o usuário possui acesso àquela
  filial (`EXISTS (SELECT 1 FROM user_branches WHERE user_id = auth.uid()
  AND branch_id = <tabela>.branch_id)`), implementando o isolamento
  multiloja além do multiempresa.
- Catálogos globais recebem policy de **leitura pública autenticada,
  escrita restrita** (apenas service role / job administrativo da
  plataforma).
