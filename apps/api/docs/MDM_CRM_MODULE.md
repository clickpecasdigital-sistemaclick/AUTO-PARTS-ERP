# Master Data Management + CRM 360° (Sprint 08)

> Cadastro Mestre de Clientes/Fornecedores/Funcionários/Vendedores/
> Mecânicos/Transportadoras + CRM 360° (Pipeline, Tarefas, Campanhas,
> LGPD, Dashboard). Construído exclusivamente sobre a arquitetura, banco,
> Design System e módulos das Sprints 01-07.

---

## ⚠️ Limitação de ambiente conhecida (igual às Sprints 02, 05, 06, 07)

`binaries.prisma.sh` continua bloqueado neste sandbox. Em qualquer
ambiente com internet: `cd apps/api && npm install && npx prisma generate
&& npm test`.

**Validado de fato neste ambiente:** ~150 nomes de modelo/campo
verificados programaticamente contra `schema.prisma` (3 divergências reais
encontradas e corrigidas — `FiscalInvoice.invoiceNumber` não existe, é
`number`/`series`; `AccountsReceivable.paidAmount`/`paidAt` não existem,
são `receivedAmount`/`receivedAt`). `ESLint` do backend limpo. **Frontend
completo** validado com `tsc --noEmit`, `eslint` e `vite build` reais — 0
erros, **4029 módulos**.

---

## Bugs reais corrigidos durante esta sprint (não apenas do código novo)

1. **Seed de permissões inconsistente desde a Sprint 02**: `prisma/seed.ts`
   semeava as ações `['create', 'read', 'update', 'delete', 'approve']`,
   mas TODO `@RequirePermission`/`can()` do código real (Sprints 04-08)
   usa o catálogo `view/create/update/delete/export/print/approve/cancel`
   (`apps/web/src/navigation/nav-types.ts`). `read` nunca correspondia a
   nada checado de fato. Corrigido o seed para o catálogo real, e
   adicionados os módulos novos desta sprint (`customers`, `employees`,
   `carriers`) à lista.
2. Schema: 3 nomes de campo incorretos usados inicialmente no código novo
   (ver acima) — todos corrigidos antes da entrega.

---

## O que foi entregue

### Schema (aditivo — ver `prisma/docs/CHANGELOG-sprint08.md`)
16 modelos novos. Destaques: `CustomerContact`/`SupplierContact` (múltiplos contatos), `CustomerCreditEvent` (auditoria de crédito tipada), `EmployeeSalary` (estrutura protegida), `DataConsent`/`DataSubjectRequest` (LGPD), `CrmPipelineStage`/`CrmOpportunity`/`CrmTask`/`CrmTag`/`CrmCampaign` (Pipeline completo), `SupportTicket`. `Customer` ganhou snapshot de crédito/compra denormalizado e classificação comercial completa.

### Backend
- **`apps/api/src/modules/mdm`**: `CustomersService`/`Repository` (CRUD do cadastro mestre, MDM "sem duplicados" via unique companyId+document), `CustomerCreditService` (limite/saldo/score/**bloqueio automático após 30 dias de atraso**, testado), `Customer360Service` (histórico unificado — só leitura, sem tabela própria), `EmployeesService` (salário em tabela separada, nunca no payload padrão), `SalespersonsService`/`MechanicsService`/`CarriersService`, `DocumentsService` (Supabase Storage + versionamento real), `LgpdService` (consentimento/revogação/exportação/**anonimização testada — preserva histórico transacional**).
- **`apps/api/src/modules/crm`**: `OpportunitiesService` (Pipeline configurável, fecha a oportunidade automaticamente ao mover para etapa Ganha/Perdida — testado), Tarefas/Etiquetas/Campanhas/Chamados, `CrmAnalyticsService` (Dashboard CRM completo).

### Frontend
- **`apps/web/src/modules/mdm`**: listagem de Clientes + **Customer 360°** (a peça central: histórico unificado, crédito com recálculo e alteração de limite, contatos, endereços, veículos, exportação/anonimização LGPD).
- **`apps/web/src/modules/crm`**: Dashboard CRM (KPIs, top clientes/fornecedores, aniversariantes, follow-ups atrasados, linha do tempo) + Pipeline Kanban (drag-and-drop com atualização otimista e rollback em erro).

---

## Decisões de arquitetura

1. **Snapshot denormalizado em `Customer`** (`creditScore`, `totalPurchasesCount`, `averageTicketValue`...): nunca a fonte de verdade — recalculado por `CustomerCreditService.refreshProfile()` a partir de `Sale`/`AccountsReceivable` reais. Existe só para leitura O(1) em listagens de milhões de clientes.
2. **Histórico 360° sem tabela própria**: `Customer360Service` agrega 10 tabelas transacionais já existentes (Sale, Quote, ServiceOrder, FiscalInvoice, AccountsReceivable, Interaction, Appointment, SupportTicket, CrmOpportunity) — nenhum dado duplicado.
3. **Anonimização ≠ soft delete**: `deletedAt` (Sprint 02) já existia; `anonymize()` é uma ação ADICIONAL e irreversível (campos identificadores substituídos, histórico transacional preservado), com ação de auditoria própria (`anonymize`).
4. **Permissões "Bloquear"/"Liberar Crédito"/"Visualizar Financeiro"/"Visualizar Documentos"** (briefing) mapeadas para `update`/`view` do catálogo padrão — a granularidade real vem do log de auditoria dedicado (`credit_change`, `sensitive_data_view`, `document_upload`/`download`), não de uma ação de permissão nova, para não alterar o RBAC já aprovado.
5. **Salário do funcionário**: tabela própria (`EmployeeSalary`) com vigências, nunca incluída no payload padrão de listagem/detalhe — só acessível via endpoint dedicado, e cada leitura é auditada.

## Fora de escopo / simplificações documentadas
- Ranking de fornecedores (`Supplier360Service`, Sprint 07) itera todos os fornecedores a cada chamada — aceitável para dezenas/centenas; migrar para job com cache se passar de milhares.
- WhatsApp como canal de CRM é estrutura preparada (`InteractionChannel`/`CrmTask.type` já aceitam `whatsapp`); integração real com a API do WhatsApp Business é trabalho de uma sprint de integrações externas.
- Mapa de Clientes consome `Customer.latitude/longitude` já cadastrado; não há geocodificação automática de endereço sem coordenada (precisaria de uma API de geocoding paga).
