# Changelog — Sprint 13: BI + IA Enterprise

## Schema (170 models — +16 vs Sprint 12)

### Novos models
- `DimTime` — dimensão tempo pré-populada (dateKey YYYYMMDD)
- `FactSale` — fato venda por item (revenue/profit/margin/discount)
- `FactPurchase` — fato compra por item (custo/leadTime)
- `FactStock` — snapshot diário de estoque por produto×armazém
- `FactFinancial` — fato financeiro (payable/receivable por vencimento)
- `FactWorkshop` — fato OS concluída (duração/retrabalho/NPS)
- `EtlSyncControl` — cursor ETL incremental por entidade
- `Alert` — instância de alerta gerada pelo motor
- `AlertRule` — regra parametrizável de alerta
- `Automation` + `AutomationLog` — motor IF/THEN
- `AiQuery` — log de auditoria de consultas à IA
- `CustomDashboard` + `DashboardWidget` — dashboards personalizáveis
- `ReportDefinition` + `ReportExecution` — relatórios e histórico

### Extended models
- `Notification` — adicionados `category` (string) e `channel` (string)

---

## Backend

### Módulo BI (`apps/api/src/modules/bi/`)
- `etl/etl.service.ts` — ETL incremental, cursor-based, idempotente
- `kpi/kpi.service.ts` — KpiService: sales/stock/financial/workshop/executive
- `ai/ai-assistant.service.ts` — Anthropic API, context injection, audit
- `bi-engine.service.ts` — AlertsEngine, Automations, Notifications, Reports
- `bi.controller.ts` — endpoints: /bi/etl, /bi/kpi, /bi/ai, /bi/alerts, /bi/automations, /bi/notifications, /bi/reports
- `bi.module.ts` — registrado em AppModule
- `test/bi.service.spec.ts` — testes: KPI calc, ABC curve, rework rate, alert dedup, toDateKey

---

## Frontend

### Módulo BI (`apps/web/src/modules/bi/`)
- `services/bi.service.ts` — types + HTTP service + todos os hooks TanStack
- `pages/ExecutiveDashboardPage.tsx` — KPIs + AreaChart + BarChart ABC + top produtos + filtro período
- `pages/AiAssistantPage.tsx` — chat IA, sugestões, histórico sidebar, latência
- `pages/AlertsCenterPage.tsx` — alertas agrupados, acknowledge/resolve, motor manual

### Rotas
- `/bi` → ExecutiveDashboardPage
- `/bi/ia` → AiAssistantPage
- `/bi/alertas` → AlertsCenterPage

### Navegação
- nav id `ia` expandido para `BI & IA` com 3 subitems: dashboard, ia, alertas
