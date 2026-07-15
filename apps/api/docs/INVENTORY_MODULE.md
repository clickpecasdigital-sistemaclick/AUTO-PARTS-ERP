# Módulo de Estoque Enterprise (Sprint 06)

> WMS completo, integrado de ponta a ponta ao Módulo de Produtos (Sprint
> 05), construído exclusivamente sobre a arquitetura, banco, Design System
> e Shell já aprovados (Sprints 01-04). Nenhum componente/layout foi
> recriado.

---

## ⚠️ Limitação de ambiente conhecida (igual às Sprints 02 e 05)

Este sandbox não tem acesso de rede a `binaries.prisma.sh`, o que impede
`npx prisma generate` e, por consequência, `tsc`/`jest` no backend. Em
qualquer ambiente com internet:
```bash
cd apps/api && npm install && npx prisma generate && npm run test
```
**Validado de fato neste ambiente:** todos os ~80 nomes de modelo/campo
novos usados no Repository/Service foram verificados programaticamente
contra `schema.prisma` (script Python, 100% de acerto). `ESLint` do
backend roda limpo. O **frontend completo** (incluindo o módulo de
Estoque) foi validado com `tsc --noEmit`, `eslint` e `vite build` reais —
0 erros, build de produção com 4007 módulos.

---

## Mapa de permissões (briefing → arquitetura de RBAC já existente)

A Sprint 06 pede ações específicas de domínio (Visualizar, Movimentar,
Inventariar, Transferir, Exportar, Importar, Excluir). Para **não alterar
a arquitetura de RBAC** (8 ações padrão definidas nas Sprints 04/05), elas
foram mapeadas assim — aplicado consistentemente em todo controller deste
módulo:

| Briefing | Ação padrão usada | Onde |
|---|---|---|
| Visualizar | `view` | Toda consulta GET |
| Movimentar | `create` | `POST /stock/movements` |
| Inventariar (abrir/contar) | `create` | `POST /stock/inventories`, `.../count` |
| Inventariar (reconciliar) | `approve` | `POST /stock/inventories/:id/reconcile` — gera ajuste definitivo de saldo |
| Transferir (criar) | `create` | `POST /stock/transfers` |
| Transferir (expedir/receber) | `update` | `.../ship`, `.../receive` |
| Transferir (cancelar) | `cancel` | `.../cancel` |
| Exportar | `export` | `GET /stock/export` |
| Importar | `create` | `POST /stock/import` |
| Excluir | `delete` | `DELETE /stock/warehouses/:id` (soft delete) |

---

## O que foi entregue

### Schema (aditivo — ver `prisma/docs/CHANGELOG-sprint06.md`)
5 modelos novos (`Street`, `StockByLocation`, `ProductBatch`, `ProductSerial`, `StockReservation`), hierarquia WMS de 8 níveis completa, 4 novos tipos de movimentação, auditoria completa em `StockMovement` (IP, motivo, valor total), `Inventory` com tipo/contagem cega/recontagem, `StockTransfer` com motivo, `Company.costingMethod`.

### Backend (`apps/api/src/modules/inventory`)

| Arquivo | Responsabilidade |
|---|---|
| `stock.repository.ts` / `stock.service.ts` | **Motor central** — toda alteração de saldo do ERP passa por `StockService.move()`, atômico (movimento + saldo na mesma transação), com validação de disponível (onHand - reserved) e custo médio recalculado automaticamente |
| `wms-locations.service.ts` | Hierarquia WMS completa, monta `fullAddress` (ex: "A01-B05-P03-N02") automaticamente |
| `stock-transfers.service.ts` | Fluxo create → ship → receive, sempre via `StockService.move()` |
| `stock-inventories.service.ts` | Geral/Rotativo/por Local/Grupo/Fabricante, contagem cega, recontagem, reconciliação gera ajustes reais |
| `stock-reservations.service.ts` | Reserva — ponto de integração pronto para Pedidos/Orçamentos/OS/Compras |
| `stock-analytics.service.ts` | KPIs, Curva ABC (Pareto 80/15/5), Giro/Cobertura/Tempo parado, Alertas — tudo via agregação SQL, nunca em memória |
| `stock-import-export.service.ts` | Import CSV/Excel real, Export CSV/Excel/PDF real |
| `test/*.spec.ts` | Motor de movimentações, fluxo de transferência, classificação ABC |

### Frontend (`apps/web/src/modules/inventory`)
Dashboard (KPIs em tempo real, Curva ABC, Giro, Alertas), Movimentações (ledger + registro manual), Transferências (fluxo completo com ações), Inventário (lista + tela de contagem/reconciliação) — 100% sobre `StatsCard`/`Chart`/`AdvancedDataTable`/`Tabs`/`Alert` do Design System.

---

## Decisões de arquitetura

1. **Saldo em 2 camadas** (igual ao padrão `Stock`/`StockMovement` da Sprint 02): `StockByLocation` é a granularidade fina (posição WMS), `Stock` continua a "foto" rápida por Depósito — nunca a soma de `StockByLocation` substitui `Stock` como fonte de leitura padrão.
2. **Custeio**: Custo Médio Ponderado implementado de ponta a ponta (recalculado em toda entrada com custo, dentro da mesma transação do movimento). PEPS/UEPS são **estrutura** (enum `CostingMethod` em `Company`, pronto para seleção) — o motor de consumo por lote de custo específico é trabalho do módulo de Compras (Sprint 07+), quando lotes de custo reais existirem.
3. **Lote/Série**: cadastro e referência em `StockMovement` funcionam hoje; saldo granular por lote/série (ex: "tenho 3 do lote X e 7 do lote Y") é explicitamente **fora de escopo** desta sprint, documentado no schema.
4. **Inventário Rotativo**: nesta sprint, mesmo escopo de produtos que o Geral (sem amostragem automática) — apenas marcado com `type: cycle` para fins de relatório. Lógica de seleção de amostra (ex: "10% dos itens classe A, mensalmente") é refinamento de produto, não estrutural.
5. **Leitor de código de barras/QR Code/coletor**: a Sprint 03 já criou os componentes `QrCode`/`BarcodeDisplay` (geração); esta sprint adiciona o lado de **leitura/busca** (`GET /stock/locations/by-address`, busca de produto por `barcode` já existente desde a Sprint 05) — a integração com hardware físico de coletor/leitor Bluetooth specific (Web Bluetooth API, drivers) é trabalho de UI dedicado quando o primeiro dispositivo-alvo for escolhido.

## Fora de escopo (conforme briefing)
Compras, Vendas e PDV não foram implementados — `StockService.move()` e `StockReservationsService` são os pontos de integração prontos para essas sprints.
