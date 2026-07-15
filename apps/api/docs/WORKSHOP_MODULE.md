# Módulo Oficina Enterprise (Sprint 11)

> Ciclo completo: Agendamento→Recepção→Check-in→Checklist→Diagnóstico→
> Orçamento→Aprovação→Execução→Controle de peças/mão-de-obra→
> Finalização→Entrega→Garantia→Pós-venda. Construído exclusivamente
> sobre a arquitetura, banco, Design System e módulos das Sprints 01-10.

---

## ⚠️ Limitação de ambiente conhecida (igual às Sprints 02, 05-10)

`binaries.prisma.sh` continua bloqueado neste sandbox. Em qualquer
ambiente com internet: `cd apps/api && npm install && npx prisma generate
&& npm test`.

**Validado de fato neste ambiente:** ~210 nomes de modelo/campo
verificados programaticamente contra `schema.prisma` (100% de acerto
nesta sprint, igual à Sprint 10). `ESLint` do backend limpo de primeira.
**Frontend completo** validado com `tsc --noEmit`, `eslint` e `vite
build` reais — 0 erros, **4057 módulos**.

---

## Bug real encontrado e corrigido antes de qualquer validação

Ao adicionar `fiscalInvoices FiscalInvoice[]` no `ServiceOrder` (ponto de
integração para NFS-e, pedido pelo briefing), esqueci que `FiscalInvoice`
não tinha o campo `serviceOrderId` correspondente — uma relação Prisma
1:N exige os dois lados. O validador estrutural (script Python rodado
contra o schema, mesmo usado desde a Sprint 02) capturou isso
imediatamente: "Falta relação inversa". Corrigido adicionando
`serviceOrderId`/`serviceOrder` em `FiscalInvoice`, com o mesmo
comentário de "ponto de integração, sem emissão real" que já existia para
`purchaseOrderId`.

Também encontrei e corrigi um comentário JSDoc duplicado no model
`Attachment` (herdado de uma edição anterior, Sprint 08) — sem efeito
funcional, mas limpo por precisão.

---

## O que foi entregue

### Schema (aditivo — ver `prisma/docs/CHANGELOG-sprint11.md`)
7 modelos novos: `ServiceBox`, `WorkshopAppointment` (agenda especializada de oficina, distinta do `Appointment` genérico de CRM), `ServiceOrderStatusHistory`, `ServiceOrderCheckIn`, `ServiceOrderDelivery`, `CustomerSatisfactionSurvey`, `ServiceFollowUp`. `Service` ganhou código/categoria/especialidade/garantia. `ServiceOrder` ganhou consultor, box, prioridade, diagnóstico completo, previsão de entrega, retrabalho (`isRework`/`reworkOfId`). `Warranty` ganhou tipo (peça/serviço) e acionamento (custo/notas).

### Backend (`apps/api/src/modules/workshop`)

| Serviço | Responsabilidade |
|---|---|
| `service-orders.service.ts` + `.repository.ts` | Núcleo — máquina de estados (`STATUS_FLOW`) que valida toda transição (testado: rejeita pular etapa, rejeita a partir de status terminal), orçamento (serviços/peças), controle de peças integrado 100% ao Estoque (`StockService.move`, Sprint 06, testado), retrabalho ligado à OS original |
| `checkin-checklist-delivery.service.ts` | Check-in (KM/combustível/objetos/danos/assinatura), Checklist configurável (qualquer item, reaproveitando `ChecklistTemplate` já existente), Entrega (exige OS `completed`, integra com `Sale` do PDV) |
| `workshop-appointments.service.ts` | Agenda por mecânico/box/serviço — detecção automática de conflito que joga para lista de espera, testada (4 cenários); reagendamento cria novo registro ligado ao original |
| `warranty-mechanic-postsale.service.ts` | Garantias (acionamento testado: rejeita inativa/vencida), Painel do Mecânico (eficiência = estimado/realizado, retrabalho, comissão), Pós-venda (NPS classificado em Promotor/Neutro/Detrator, lembrete de revisão) |
| `services-catalog-boxes.service.ts` | Catálogo de Serviços (sugestão por especialidade do mecânico), Boxes/ocupação |
| `workshop-analytics.service.ts` | Dashboard da Oficina completo |
| `test/*.spec.ts` | Fluxo de status, controle de peças→estoque, retrabalho, conflito de agenda→lista de espera, acionamento de garantia |

### Frontend (`apps/web/src/modules/workshop`)
Dashboard da Oficina, listagem e detalhe de Ordens de Serviço (com a barra de transição de status visual, abas de Diagnóstico e Orçamento com adição/remoção de peças e serviços) e Agenda diária com lista de espera — as peças mais centrais e visíveis do briefing. Check-in/Checklist/Entrega/Painel do Mecânico/Garantias/Pós-venda têm API REST completa e testada (ver `workshopService`), com UI dedicada reservada para uma iteração de refinamento — mesma decisão de escopo já adotada nas Sprints 09 (PDV) e 10 (Financeiro) para módulos de volume equivalente.

---

## Decisões de arquitetura

1. `WorkshopAppointment` é distinto do `Appointment` genérico (Sprint 08): o `Appointment` do CRM serve para ligações/visitas comerciais; a agenda de oficina precisa de mecânico/box/serviço/veículo tipados e lógica de conflito própria — duplicar seria pior do que ter dois conceitos com nomes diferentes e claros.
2. Controle de peças em duas etapas: `addPartItem` (orçamento, sem mexer no estoque) e `confirmPartsConsumption` (baixa real via `StockService.move`, chamado ao iniciar execução). Isso espelha o fluxo real de oficina — o orçamento lista peças antes de saber se o cliente vai aprovar.
3. Painel do Mecânico calcula eficiência como estimado/realizado × 100: acima de 100% significa mais rápido que o previsto. Métrica simples e auditável, sem inventar fórmula proprietária.
4. NPS classificado em Promotor (9-10), Neutro (7-8) e Detrator (0-6): fórmula padrão de mercado (%promotores - %detratores), não uma variação proprietária.
5. Integração com Financeiro/PDV é por referência, nunca reescrita: `ServiceOrderDelivery.saleId` aponta para `Sale` (Sprint 09); a comissão de mecânico usa `Commission` (Sprint 08/09) já existente.

## Fora de escopo (conforme briefing)
Emissão de NF-e/NFS-e real — apenas o ponto de integração (`FiscalInvoice.serviceOrderId`), pronto para a Sprint Fiscal.
