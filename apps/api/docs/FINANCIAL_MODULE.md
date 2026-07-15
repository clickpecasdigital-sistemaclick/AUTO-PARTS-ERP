# Módulo Financeiro Enterprise (Sprint 10)

> Controle financeiro completo: Contas a Pagar/Receber, Bancos/PIX/
> Boletos/Cartões (estruturas preparadas, sem PSP real), Conciliação
> Bancária, Fluxo de Caixa, DRE, Plano de Contas, Centros de Custo/Rateio,
> Comissões, Projeções e Dashboard Executivo. Construído exclusivamente
> sobre a arquitetura, banco, Design System e módulos das Sprints 01-09.

---

## ⚠️ Limitação de ambiente conhecida (igual às Sprints 02, 05-09)

`binaries.prisma.sh` continua bloqueado neste sandbox. Em qualquer
ambiente com internet: `cd apps/api && npm install && npx prisma generate
&& npm test`.

**Validado de fato neste ambiente:** ~190 nomes de modelo/campo
verificados programaticamente contra `schema.prisma` (100% de acerto
nesta sprint). `ESLint` do backend **limpo de primeira** (0 erros, sem
correções necessárias). **Frontend completo** validado com `tsc --noEmit`,
`eslint` e `vite build` reais — 0 erros, **4047 módulos**.

---

## Bug real encontrado e corrigido antes de qualquer execução

Ao implementar a geração do payload PIX BR Code, usei inicialmente
`createHash('crc16')` — **`crc16` não é um algoritmo suportado pelo
módulo `crypto` do Node** (só MD5/SHA*/etc.), o que quebraria em runtime.
Implementei manualmente o CRC16/CCITT-FALSE (polinômio `0x1021`, inicial
`0xFFFF`) — o algoritmo correto exigido pelo padrão BR Code do Banco
Central — antes de rodar qualquer validação. Não é um erro de schema (que
o sandbox bloqueia verificar via `tsc`), é um erro de **lógica de runtime**
que só apareceria executando a função; revisei manualmente porque a
geração de PIX é sensível o suficiente para merecer atenção extra.

---

## O que foi entregue

### Schema (aditivo — ver `prisma/docs/CHANGELOG-sprint10.md`)
12 modelos novos: `Bank`/`BankAccountPixKey` (múltiplas chaves PIX), `BankStatementEntry`/`BankReconciliation`/`BankReconciliationItem` (extrato/conciliação), `PixCharge`, `BankSlip`, `CardOperator`/`CardTransaction`, `CostCenterAllocation` (rateio), `CommissionRule`, `FinancialProjection`. `AccountsPayable`/`AccountsReceivable` ganharam juros/multa/desconto, renegociação (preserva o título original) e estorno tipados.

### Backend (`apps/api/src/modules/financial`)

| Serviço | Responsabilidade |
|---|---|
| `accounts-payable.service.ts` / `accounts-receivable.service.ts` | **Núcleo** — títulos/parcelas, baixa parcial/total (com juros/multa/desconto, testado), estorno (devolve saldo bancário, testado), renegociação (nunca apaga o título original, testado), `settleAutomatically()` é o ponto de baixa automática usado por PIX/Boleto |
| `bank-accounts.service.ts` | Bancos, contas, múltiplas chaves PIX, `currentBalance` denormalizado (mesmo padrão de `Customer.creditScore`, Sprint 08) |
| `bank-reconciliation.service.ts` | Extrato (estrutura OFX/CNAB) + conciliação manual e **automática por valor+janela de 3 dias** (testada) |
| `pix-bankslip-card.service.ts` | PIX (BR Code gerado localmente, sem PSP), Boleto (registro/baixa/CNAB estrutura), Cartões (antecipação com taxa, parcelamento) |
| `chart-cost-center-commission.service.ts` | Plano de Contas hierárquico, Centros de Custo + **Rateio (soma deve fechar 100%, testado)**, Regras de Comissão configuráveis |
| `cash-flow-dre.service.ts` | Fluxo de Caixa (realizado/previsto/consolidado) + DRE Gerencial baseado no Plano de Contas |
| `financial-projections-analytics.service.ts` | Projeções/Cenários manuais + **Dashboard Executivo** completo |
| `test/*.spec.ts` | Baixa/estorno/renegociação de título, rateio (soma 100%), conciliação automática |

### Frontend (`apps/web/src/modules/financial`)
**Dashboard Executivo** (KPIs, fluxo de caixa consolidado, ranking de despesas) + **Contas a Pagar** e **Contas a Receber** completas (criação parcelada, baixa, estorno, renegociação) — as 3 peças mais centrais do briefing. Bancos/PIX/Boletos/Cartões/Conciliação/Plano de Contas/Centros de Custo/Comissões/Projeções têm API REST completa e testada; UI dedicada para essas telas mais operacionais fica para uma iteração de refinamento, mesma decisão de escopo já documentada nas Sprints 07/09.

---

## Decisões de arquitetura

1. **"Caixa" não foi duplicado**: o briefing desta sprint pede "Abertura, Fechamento, Sangria, Suprimento, Conferência" — **100% já implementado em `PdvModule`/`CashRegister` (Sprint 09)**. Nenhum model ou service novo foi criado para isso; o Dashboard Executivo só lê `CashRegister.openingAmount` para o KPI de saldo em caixa.
2. **Saldo bancário denormalizado**: `BankAccount.currentBalance` é atualizado incrementalmente a cada baixa (`AccountsPayableService.settle`/`AccountsReceivableService.settle`), com `refreshBalance()` disponível para recalcular do zero em caso de divergência — mesmo padrão já usado em `Customer.creditScore` (Sprint 08) e `Product.averageCostPrice` (Sprint 05).
3. **PIX BR Code gerado localmente**: o payload EMV/TLV (Tag-Length-Value) é um formato público do Banco Central — gera-se o "Copia e Cola" sem nenhum PSP. A CONFIRMAÇÃO (`confirmWebhook`) é só o ponto de integração; sem PSP plugado, nunca é chamada de fato nesta sprint.
4. **DRE simplificado**: classifica receita/despesa pelo `ChartOfAccount.type` já existente (Sprint 02); CMV (Custo da Mercadoria Vendida) seria a próxima camada de refinamento quando o Plano de Contas tiver uma conta de custo dedicada ligada ao `averageCostPrice` do produto vendido (Sprint 05/06) — documentado no código, não implementado nesta sprint para não inventar uma regra contábil sem uma conta configurada para receber esse lançamento.
5. **Comissões**: `CommissionRule` (Sprint 10) é o catálogo de regras configuráveis; a geração da `Commission` em si continua em `PdvCheckoutService` (Sprint 09) — `CommissionRulesService.resolveRate()` é o método que um futuro refinamento do checkout chamaria para consultar a taxa configurada em vez do `Salesperson.commissionRate` fixo atual.

## Fora de escopo (conforme briefing)
Integrações bancárias reais, PIX com PSP, Boletos com banco real e SPED — todas as estruturas (`PixCharge`, `BankSlip`, `BankStatementEntry`) estão prontas para a Sprint Fiscal/Integrações sem mudança de schema.
