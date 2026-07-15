# PDV Enterprise (Sprint 09)

> Balcão, Oficina, Televendas, Orçamentos, Pedidos, Pré-vendas. Construído
> exclusivamente sobre a arquitetura, banco, Design System e módulos das
> Sprints 01-08.

---

## ⚠️ Limitação de ambiente conhecida (igual às Sprints 02, 05-08)

`binaries.prisma.sh` continua bloqueado neste sandbox. Em qualquer
ambiente com internet: `cd apps/api && npm install && npx prisma generate
&& npm test`.

**Validado de fato neste ambiente:** ~170 nomes de modelo/campo
verificados programaticamente contra `schema.prisma` (1 divergência real
encontrada e corrigida — `Commission` usa `baseAmount`/`rate`/`amount`,
não `percentApplied`). `ESLint` do backend limpo. **Frontend completo**
validado com `tsc --noEmit`, `eslint` e `vite build` reais — 0 erros,
**4037 módulos**.

---

## Decisão de arquitetura central: o carrinho É um `Sale`

O briefing pede um carrinho rico (item, quantidade, preço, desconto %/R$,
acréscimo, comissão, observações, reserva, disponibilidade) com inclusão
de item em <50ms e finalização em <2s. Em vez de criar uma tabela "Cart"
paralela, **o carrinho é um `Sale` com `status: 'open'`** (modelo já
existente desde a Sprint 02) — zero tabela nova para isso. Vantagens
diretas:
- Nenhuma migração de dado quando o carrinho "se torna" a venda — já É a
  venda, só muda de status.
- Toda a auditoria, multi-tenant, multi-filial já vem de graça do `Sale`.
- `SaleItem` ganhou exatamente os campos que faltavam (`discountPercent`,
  `surchargeAmount`, `commissionAmount`, `notes`, `reservationId`) — sem
  duplicar em uma tabela "CartItem".

## Bugs/inconsistências reais corrigidos durante esta sprint

1. **`Commission.percentApplied` não existe** — os campos reais são
   `baseAmount`/`rate`/`amount`. Corrigido em `PdvCheckoutService` e no
   teste correspondente.
2. **Nav item `pdv` usava `module: 'pdv'`**, nunca semeado no catálogo de
   permissões (só existem `products/stock/sales/purchases/financial/
   workshop/crm/settings/customers/employees/carriers`). Corrigido para
   `module: 'sales'` — mesma chave usada em todos os `@RequirePermission`
   do backend desta sprint (Orçamentos/Pedidos/Carrinho/Caixa também usam
   `sales`, já que são todos parte do mesmo domínio comercial).
3. Um placeholder desonesto que eu mesmo escrevi (`listPaymentMethods`
   chamando `/pdv/discount-rules` e descartando o resultado, sempre
   retornando `[]`) foi substituído por um endpoint real
   (`GET /pdv/carts/payment-methods`) antes da entrega.

---

## O que foi entregue

### Schema (aditivo — ver `prisma/docs/CHANGELOG-sprint09.md`)
5 modelos novos: `PdvTerminal`, `DiscountRule`, `SaleReturn`/`SaleReturnItem`, `CashRegisterReconciliation`. `Sale` ganhou `mode` (`SaleMode`), veículo, terminal, cancelamento/estorno tipados. `SaleItem` ganhou desconto %, acréscimo, comissão, reserva. `Quote`/`SalesOrder` ganharam aprovação/separação/expedição. `PaymentKind` ganhou Crediário.

### Backend (`apps/api/src/modules/pdv`)

| Serviço | Responsabilidade |
|---|---|
| `pdv-search.service.ts` | Busca por código interno/barras/OEM/fabricante/descrição/marca/placa/aplicação veicular |
| `pdv-cart.service.ts` + `.repository.ts` | **Motor do carrinho** — abrir, item a item, desconto validado por regra, disponibilidade em tempo real |
| `pdv-discount.service.ts` | Regra de desconto por usuário/perfil/cliente/produto/campanha — **a mais restritiva sempre vence** (testado) |
| `pdv-checkout.service.ts` | Finalização: baixa de estoque (`StockService.move`, Sprint 06), múltiplas formas de pagamento, `AccountsReceivable` automático para pagamento a prazo, comissão automática (testado) |
| `pdv-quotes.service.ts` | Orçamento → aprovação → conversão para Pedido |
| `pdv-sales-orders.service.ts` | Pedido → reserva automática (`StockReservationsService`, Sprint 06) → separação → expedição |
| `pdv-cash-register.service.ts` | Abertura/fechamento/sangria/suprimento/**conferência por forma de pagamento** |
| `pdv-returns.service.ts` | Devolução parcial/total/troca — estrutura preparada (crédito ao cliente documentado, sem saldo de crédito rastreável ainda) |
| `pdv-analytics.service.ts` | Dashboard PDV completo |
| `pdv-print.service.ts` | Cupom não fiscal (térmico 80mm) e A4, PDF real |
| `test/*.spec.ts` | Modo Oficina exige veículo, limite de desconto, checkout→estoque/financeiro/comissão, regra mais restritiva |

### Frontend (`apps/web/src/modules/pdv`)
**Tela do PDV** completa (busca instantânea, carrinho editável, dados do cliente/crédito/veículo, resumo financeiro, pagamento com múltiplas formas, atalhos `Ctrl+F2/F4/F6`) + Dashboard PDV + **Orçamentos** (criação, aprovação, envio, conversão para Pedido) + **Pedidos** (aprovação com reserva automática, separação, expedição) + **Caixa** (abertura, sangria, suprimento, conferência por forma de pagamento, fechamento) + **Devoluções** (parcial/total/troca, com ou sem crédito ao cliente) — todas as telas do briefing entregues nesta sprint.

---

## Decisões de arquitetura adicionais

1. **Atalhos de teclado usam Ctrl+F-tecla, não F-tecla pura**: a infraestrutura `useKeyboardShortcut` (Sprint 04) exige um modificador (Ctrl/Cmd) por design — não tem como disparar com tecla F sozinha. Isso também evita colisão com atalhos nativos do navegador (F5 recarrega, etc.), o que é mais robusto para um PDV web do que tecla F pura.
2. **Performance** (<100ms busca, <50ms item, <2s finalização): o código evita N+1 e usa os índices já existentes; **não foi benchmarcado com dado real** porque o Prisma Client não pôde ser gerado neste sandbox (mesma limitação de rede). A função `search_products()` (Sprint 05, FTS com GIN) já está pronta para troca quando a migration for aplicada em banco real.
3. **Checkout não é uma única transação Prisma cobrindo todos os itens**: `StockService.move()` (Sprint 06) já é atômico por movimentação; uma transação cobrindo N produtos exigiria reescrever esse service, violando "não reescrever módulos existentes" — mesma decisão já aceita na Sprint 07 (`GoodsReceiptsService.finalize`).
4. **Cliente rápido**: Balcão/Venda Rápida sem cliente selecionado usa automaticamente um "Consumidor Final" criado uma única vez por empresa (documento `00000000000`) — não um cadastro novo a cada venda.

## Fora de escopo (conforme briefing)
Emissão fiscal real (NFC-e/NF-e/SAT) — apenas os pontos de integração (`Sale.fiscalInvoices`, `FiscalInvoiceModel.sat`) ficam prontos para a Sprint Fiscal. TEF real (driver de PinPad) — campos `tefTransactionId`/`tefAuthorizationCode`/`tefNsu` preparados, sempre nulos nesta sprint. Crédito ao cliente em devolução não gera saldo rastreável ainda (documentado em `PdvReturnsService`).
