# Changelog — Sprint 16: Enterprise Ultimate + IA Copilot + Go Live

## Schema (207 models — +12 vs Sprint 15)

### Novos models
- `CopilotSession` — sessão do IA Copilot com contexto e histórico de mensagens
- `AiPrediction` — previsões da IA Analítica (vendas, ruptura, churn, compras) com confiança e validade
- `WorkflowDefinition` + `WorkflowExecution` — Workflow Builder visual (SE/ENTÃO/SENÃO/AGENDAR/LOOP)
- `MessageTemplate` + `MessageHistory` — sistema completo de mensagens (Email/WhatsApp/SMS/Push)
- `HelpTicket` + `HelpMessage` — helpdesk interno (distinto do SupportTicket do CRM)
- `TelemetryEvent` — telemetria com consentimento LGPD
- `SetupWizardProgress` — progresso do assistente de implantação por tenant
- `ImportJob` + `ExportJob` — importações/exportações universais (CSV/Excel/XML/JSON/Bling/Tiny/Omie)

---

## Backend

### CopilotModule (`apps/api/src/modules/copilot/`)
- `CopilotService` — processamento de comandos em linguagem natural:
  - Detecção de intenção por regex (navegação, criação, consulta, ações fiscais/financeiras)
  - Verificação de permissão ANTES de qualquer ação ou consulta de dados
  - Contexto real injetado na chamada à Anthropic API (não inventa dados)
  - Ações de navegação automática após resposta (após 1.2s)
  - Histórico de sessão por usuário (últimas 20 trocas)
- `AnalyticsAiService` — 8 tipos de previsão:
  - Previsão de vendas (média móvel 30d + tendência linear)
  - Risco de ruptura de estoque (cobertura atual vs giro diário)
  - Risco de abandono de cliente (churn: sem compra 90-180 dias)
  - Risco de inadimplência (contas vencidas)
  - Sugestão automática de compras (cobertura < 15 dias)
  - Produtos com maior margem (top 10 do DW)
  - Produtos parados (sem venda em 90 dias com estoque)
  - Detecção de anomalias de receita (desvio > 50% da média)
- `CommunicationService` — Email (Resend/SendGrid/SMTP), WhatsApp Business (Meta Cloud API), templates com variáveis `{{nome}}`, histórico de envios
- `SetupWizardService` — 12 etapas, detecção automática de progresso, marcar etapas concluídas
- `ImporterService` — jobs de importação CSV/Excel/XML/JSON, mapeamento automático por origem (Bling/Tiny/Omie), importação de Produtos/Clientes/Fornecedores
- `SupportService` — HelpDesk com tickets categorizados e chat interno

---

## Frontend

### CopilotWidget (`apps/web/src/modules/copilot/components/`)
- Widget flutuante em TODAS as telas (registrado no MainLayout)
- Sugestões contextuais por rota (/produtos, /clientes, /financeiro, /fiscal, /oficina, /bi)
- Navega automaticamente quando o comando indica rota específica
- Histórico visual da conversa com indicador de loading

### SetupWizardPage (`apps/web/src/modules/setup-wizard/pages/`)
- 12 etapas com barra de progresso
- Detecção automática do que já foi configurado
- Link para cada seção do sistema
- Marcar etapa como concluída manualmente

### Rotas novas
- `/setup-wizard` → SetupWizardPage

---

## Validação Final
- Backend ESLint: **0 erros**
- Frontend `tsc --noEmit`: **0 erros**
- Frontend `vite build`: **4072 módulos**, 0 erros
- Schema: **207 models**, 0 duplicatas

---

## Estado Final do Projeto AutoCore ERP

| Sprint | Módulo | Models | Status |
|---|---|---|---|
| 01 | Fundação + Auth | 20 | ✅ |
| 02 | Produtos | +18 | ✅ |
| 03 | Estoque + WMS | +14 | ✅ |
| 04 | MDM (Clientes/Fornecedores) | +22 | ✅ |
| 05 | Compras | +12 | ✅ |
| 06 | Financeiro | +16 | ✅ |
| 07 | PDV | +14 | ✅ |
| 08 | CRM | +12 | ✅ |
| 09 | Motor de Preços | +8 | ✅ |
| 10 | Financeiro II (PIX/CNAB) | +10 | ✅ |
| 11 | Oficina Enterprise | +7 | ✅ |
| 12 | Motor Fiscal NF-e | +6 | ✅ |
| 13 | BI + IA Analítica | +16 | ✅ |
| 14 | Hardening + DevOps | +8 | ✅ |
| 15 | SaaS + Licenciamento | +17 | ✅ |
| 16 | Copilot + Go Live | +12 | ✅ |
| **TOTAL** | | **207 models** | **16/16 ✅** |
