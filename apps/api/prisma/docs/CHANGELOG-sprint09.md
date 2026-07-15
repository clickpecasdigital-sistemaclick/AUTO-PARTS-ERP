# Alterações de schema — Sprint 09 (PDV Enterprise)

Aditivas, sem remoção de nenhum campo/tabela existente. 5 modelos novos.

## Novos modelos
- **`PdvTerminal`** — identificação do terminal/caixa físico (auditoria exige "Terminal").
- **`DiscountRule`** — desconto máximo por escopo (usuário/perfil/cliente/produto/campanha), com limite que exige aprovação.
- **`SaleReturn`** / **`SaleReturnItem`** — devolução (parcial/total/troca), estrutura preparada.
- **`CashRegisterReconciliation`** — conferência de fechamento de caixa por forma de pagamento.

## Extensões
- **`Sale`**: `mode` (`SaleMode`: balcony/workshop/quick/future_sale/telesales/pre_sale), `customerVehicleId`, `terminalId`, `warehouseId`, `cancelledBy`/`cancelReason`, `refundedAt`/`refundedBy`.
- **`SaleItem`**: `discountPercent` (já existia `discountAmount`), `surchargeAmount` (acréscimo), `commissionAmount`, `notes`, `reservationId` (consome `StockReservation` da Sprint 06).
- **`SalePayment`**: `tefTransactionId`/`tefAuthorizationCode`/`tefNsu` — estrutura TEF.
- **`Quote`**: `approvedBy`/`approvedAt`/`rejectedReason`, `sentAt`/`sentTo` (envio por e-mail).
- **`SalesOrder`**: `approvedBy`/`approvedAt`, `separationStatus` (`SalesOrderSeparationStatus`), `separatedAt`/`shippedAt`.
- **`PaymentKind`**: + `in_house_installment` (Crediário). `store_credit` já cobria "Vale".
- **`FiscalInvoiceModel`**: + `sat` (estrutura, sem emissão real).

Migration: `prisma migrate dev --name sprint09_pdv_enterprise`.
