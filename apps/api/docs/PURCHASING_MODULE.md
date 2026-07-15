# Módulo de Compras Enterprise (Sprint 07)

> Ciclo completo de abastecimento — Necessidade → Solicitação → Cotação →
> Comparativo → Aprovação → Pedido → Recebimento → Conferência → Entrada no
> Estoque → Atualização Financeira → (ponto de integração) Escrita Fiscal.
> Construído exclusivamente sobre a arquitetura, banco, Design System,
> Shell e módulos de Produtos/Estoque já aprovados (Sprints 01-06).

---

## ⚠️ Limitação de ambiente conhecida (igual às Sprints 02, 05 e 06)

`binaries.prisma.sh` continua bloqueado neste sandbox — `prisma generate`,
`tsc` e `jest` do backend dependem disso. Em qualquer ambiente com
internet: `cd apps/api && npm install && npx prisma generate && npm test`.

**Validado de fato neste ambiente:** ~110 nomes de modelo/campo novos
verificados programaticamente contra `schema.prisma` (100% de acerto).
`ESLint` do backend limpo. **Frontend completo** validado com `tsc
--noEmit`, `eslint` e `vite build` reais — 0 erros, **4015 módulos**.

---

## Mapa de permissões (briefing → RBAC já existente, Sprints 04/05/06)

| Briefing | Ação padrão | Onde |
|---|---|---|
| Visualizar | `view` | Toda consulta GET |
| Criar | `create` | Solicitação, Cotação, Pedido manual, Importação |
| Editar | `update` | Resposta de cotação, envio/reabertura de pedido, recebimento, conferência |
| Excluir | — | Não há exclusão física no ciclo de compras (apenas cancelamento, auditável) |
| Aprovar | `approve` | Decisão de aprovação, adjudicação de cotação, aprovação de pedido, finalização do recebimento |
| Cancelar | `cancel` | Cancelamento de pedido |
| Exportar | `export` | `GET /purchasing/orders/export` |
| Importar | `create` | `POST /purchasing/import/*` |
| Receber | `update` | `POST /purchasing/receipts` |
| Conferir | `update` | `POST /purchasing/receipts/:id/confer` |

**Chave do módulo**: `purchases` — não `purchasing` — para ficar consistente
com o catálogo de permissões já semeado na Sprint 02
(`prisma/seed.ts`) e com a entrada de navegação da Sprint 04
(`navigation/nav-items.ts`). Esse alinhamento foi corrigido durante esta
sprint (o código inicialmente usava `purchasing` em todos os
`@RequirePermission`/`can()` — ver histórico de correção).

---

## O que foi entregue

### Schema (aditivo — ver `prisma/docs/CHANGELOG-sprint07.md`)
9 modelos novos: `Department`, `PurchaseRequest`/`Item`, `PurchaseQuotation`/`Supplier`/`Item`, `PurchaseApprovalRule`/`Approval`, `PurchaseSuggestion`. Extensões em `PurchaseOrder` (vínculo solicitação/cotação/duplicação/aprovação), `GoodsReceipt`/`Item` (transportadora, volumes, conferência com aceite/recusa parcial), `FiscalInvoice` (ponto de integração). `AuditAction` ganhou `approve`/`reject`/`receive`/`confer`.

### Backend (`apps/api/src/modules/purchasing`)

| Serviço | Responsabilidade |
|---|---|
| `purchase-requests.service.ts` | Solicitação — a "Necessidade" |
| `purchase-quotations.service.ts` | Cotação multi-fornecedor + **comparativo automático** (score ponderado: 60% preço, 25% prazo, 15% histórico de lead time) — destaca a melhor proposta |
| `purchase-approvals.service.ts` | Motor de aprovação configurável, multi-nível, por valor/departamento |
| `purchase-orders.service.ts` + `.repository.ts` | Pedido — manual, a partir de cotação adjudicada, duplicação, reabertura, cancelamento |
| `goods-receipts.service.ts` | Recebimento + Conferência (manual/código de barras/QR Code) → **entra no estoque via `StockService.move()`** (Sprint 06, atualiza saldo e custo médio) → **gera `AccountsPayable`** (Sprint 02) |
| `purchase-suggestions.service.ts` | Reposição automática — reaproveita `StockRepository`/`StockAnalyticsService` (Sprint 06) |
| `supplier-360.service.ts` | Painel 360°: tudo calculado a partir do histórico real, nunca um campo de "nota" isolado |
| `purchasing-analytics.service.ts` | Dashboard: KPIs, linha do tempo, compras por fornecedor, economia obtida |
| `purchasing-import-export.service.ts` | Export CSV/Excel/PDF real; import de XML de NF-e e catálogos de fabricantes como estrutura preparada (briefing) |
| `test/*.spec.ts` | Motor de aprovação, comparativo de cotação (Pareto de score), fluxo de conferência → estoque → financeiro |

### Frontend (`apps/web/src/modules/purchasing`)
Dashboard, Solicitações, Cotações (com comparativo destacando a melhor proposta com troféu), Pedidos (enviar/aprovar/duplicar/reabrir/cancelar/PDF/exportar), Recebimento e Conferência (manual, preparado para código de barras/QR Code) — 100% sobre `StatsCard`/`Chart`/`AdvancedDataTable`/`Tabs`/`Alert` do Design System.

---

## Decisões de arquitetura

1. **Comparativo de cotação não armazena "nota"**: o score é sempre calculado on-demand a partir das condições comerciais reais da cotação + histórico de lead time real de `PurchaseOrder`/`GoodsReceipt` — nunca um campo de avaliação subjetiva isolado que poderia ficar desatualizado.
2. **Aprovação desacoplada do documento**: `PurchaseApprovalsService` não sabe se está aprovando uma Solicitação ou um Pedido — `PurchaseApproval.documentType` + `purchaseRequestId`/`purchaseOrderId` (mutuamente exclusivos) bastam. Qualquer documento futuro (ex: Cotação de valor alto) pode reaproveitar o mesmo motor sem alteração.
3. **Assinatura digital**: campo `signatureRef` em `PurchaseApproval` é a estrutura preparada (briefing) — a integração com um provedor real (ICP-Brasil, DocuSign etc.) é trabalho de produto, não de arquitetura.
4. **Financeiro**: `GoodsReceiptsService.finalize()` cria `AccountsPayable` diretamente via `PrismaService` (não existe ainda um módulo Financeiro dedicado) — quando esse módulo for implementado, a criação das parcelas deve migrar para um `AccountsPayableService` injetado aqui, mantendo a mesma assinatura de chamada.
5. **Fiscal**: `FiscalInvoice.purchaseOrderId` é o ponto de integração para a NF-e de entrada; `PurchasingImportExportService.importNfeXml()` tem a assinatura definitiva e retorna `not_implemented` — nenhum Controller precisará mudar quando a Sprint Fiscal implementar o parser de XML de fato.
6. **Ranking de fornecedor** (`Supplier360Service.computeRanking`): itera todos os fornecedores do tenant a cada chamada — aceitável para dezenas/centenas de fornecedores (escala normal de uma autopeças), mas deve migrar para um job noturno com cache se um tenant chegar a milhares de fornecedores.

## Fora de escopo (conforme briefing)
Escrita Fiscal e NF-e real — apenas os pontos de integração (`FiscalInvoice.purchaseOrderId`, `importNfeXml()`) ficam prontos para a Sprint Fiscal.
