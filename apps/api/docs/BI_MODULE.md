# Módulo BI + IA Enterprise (Sprint 13)

> Data Warehouse interno, KPIs, Assistente IA (Anthropic API), motor de
> alertas automáticos, motor de automações, central de notificações,
> gerador de relatórios, dashboards executivos com Recharts.

---

## Ambiente (mesma limitação das Sprints 02-12)

`binaries.prisma.sh` bloqueado. 100% dos campos/modelos verificados
programaticamente. Backend ESLint 0 erros. Frontend `tsc --noEmit` +
`eslint` + `vite build` reais — 0 erros, **4067 módulos**.

---

## Schema (170 models — +16 novos)

`DimTime`, `FactSale`, `FactPurchase`, `FactStock`, `FactFinancial`,
`FactWorkshop` — fatos do DW com chave `dateKey: YYYYMMDD` e cursor
`EtlSyncControl` para processamento incremental.

`Alert` / `AlertRule` — motor de alertas parametrizável.

`Automation` / `AutomationLog` — motor SE→ENTÃO.

`Notification` (extended) — central de notificações com `category` e
`channel` (`in_app` / `email` / `whatsapp` / `push`).

`AiQuery` — log de auditoria de todas as consultas à IA.

`CustomDashboard` / `DashboardWidget` — dashboards personalizáveis.

`ReportDefinition` / `ReportExecution` — histórico de relatórios.

---

## Backend (`apps/api/src/modules/bi/`)

| Serviço | O que faz |
|---|---|
| `EtlService` | ETL incremental (5 entidades, cursor `lastSyncAt`, upsert idempotente) |
| `KpiService` | Receita, margem, ticket médio, curva ABC (A/B/C por acumulado de faturamento), top produtos/clientes, workshop KPIs, resumo executivo |
| `AiAssistantService` | Integração Anthropic API (`claude-sonnet-4-6`), contexto real dos KPIs, detecção de intenção, log de auditoria |
| `AlertsEngineService` | 4 checks automáticos (estoque zerado, inadimplência, certificado vencendo, NF-e rejeitada), sem duplicatas, severidade adaptativa |
| `AutomationsService` | Motor SE→ENTÃO, ações: criar sugestão de compra, enviar notificação, criar alerta; log de execução |
| `NotificationsService` | CRUD de notificações por usuário, contador de não lidas, marcar lidas |
| `ReportService` | Definições salvas, histórico de execuções, dados do DW por categoria |

---

## Frontend (`apps/web/src/modules/bi/`)

`ExecutiveDashboardPage` — KPIs em tempo real (receita, margem, caixa,
NPS), gráfico de receita diária (Recharts AreaChart), curva ABC
(BarChart horizontal), top produtos, filtro por período.

`AiAssistantPage` — chat de linguagem natural com o ERP, sugestões de
perguntas pré-definidas (briefing), histórico lateral, latência exibida.

`AlertsCenterPage` — alertas agrupados por severidade (crítico/atenção/
info), reconhecer / resolver, link para config interna, botão de execução
manual do motor.

---

## Decisões de arquitetura

1. **DW interno** — fatos em tabelas Postgres, não um sistema externo
   como BigQuery/Snowflake. Mantém o monorepo Supabase e permite JOIN
   com tabelas operacionais para drill-down sem ETL adicional.

2. **ETL incremental por cursor** — `EtlSyncControl.lastSyncAt` é o
   único cursor; `upsert` por chave natural garante idempotência. Carga
   histórica = setar `lastSyncAt = epoch` e rodar.

3. **IA com contexto real** — a pergunta é roteada para os KPIs
   relevantes (detecção de intenção por regex) antes de chamar a
   Anthropic API. O modelo não inventa dados — responde com base em
   números reais do tenant.

4. **Motor de alertas sem SQL raw** — todas as verificações usam
   queries Prisma tipadas. Adicionar um novo check = adicionar um método
   `checkXxx` e chamar em `runChecks`. Zero hardcoded.

5. **Notificações em tempo real** — WebSocket via Supabase Realtime
   (subscrição na tabela `notifications`) é o passo seguinte; o modelo
   e as APIs já estão prontos, basta adicionar o listener no frontend.
