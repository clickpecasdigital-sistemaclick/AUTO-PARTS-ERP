# Alterações de schema — Sprint 10 (Financeiro Enterprise)

Aditivas, sem remoção de nenhum campo/tabela existente. 12 modelos novos.

## Novos modelos
- **`Bank`** (catálogo FEBRABAN) / **`BankAccountPixKey`** (múltiplas chaves PIX).
- **`BankStatementEntry`** / **`BankReconciliation`** / **`BankReconciliationItem`** — extrato e conciliação bancária (estrutura).
- **`PixCharge`** — cobrança PIX (QR Code/Copia-e-Cola gerados localmente, confirmação via webhook é estrutura).
- **`BankSlip`** — boleto (registro/baixa; remessa/retorno CNAB é estrutura).
- **`CardOperator`** / **`CardTransaction`** — operadoras, taxas, antecipação, recebimentos futuros.
- **`CostCenterAllocation`** — rateio entre centros de custo.
- **`CommissionRule`** — regra de comissão configurável por escopo (vendedor/mecânico/produto/serviço/campanha), mesmo padrão de `DiscountRule` (Sprint 09).
- **`FinancialProjection`** — projeção/cenário manual (distinto do fluxo previsto calculado a partir de títulos reais).

## Extensões
- **`Company`**: `baseCurrency` (estrutura multi-moeda).
- **`BankAccount`**: `bankId`, `accountType`, `currency`, `currentBalance` (snapshot denormalizado), `creditLimit`.
- **`AccountsPayable`/`AccountsReceivable`**: `interestAmount`/`fineAmount`/`discountAmount` (juros/multa/desconto), `renegotiatedFromId` (renegociação preserva o título original), `reversedAt`/`reversedBy` (estorno de baixa), `currency`, `scheduledAt` (agendamento, só em Payable).

Migration: `prisma migrate dev --name sprint10_financial_enterprise`.
