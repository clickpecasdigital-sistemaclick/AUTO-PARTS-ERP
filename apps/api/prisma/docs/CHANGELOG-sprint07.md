# Alterações de schema — Sprint 07 (Módulo de Compras Enterprise)

Aditivas, sem remoção de nenhum campo/tabela existente. 9 modelos novos.

## Novos modelos
- **`Department`** — usado por Solicitação de Compra e regras de aprovação.
- **`PurchaseRequest`** + **`PurchaseRequestItem`** — Solicitação de Compra ("Necessidade").
- **`PurchaseQuotation`** + **`PurchaseQuotationSupplier`** + **`PurchaseQuotationItem`** — Cotação multi-fornecedor com condições comerciais completas (frete, prazo, garantia, pagamento, desconto).
- **`PurchaseApprovalRule`** — regra de aprovação multi-nível (por valor/departamento/role).
- **`PurchaseApproval`** — histórico de aprovação (Solicitação ou Pedido), com `signatureRef` preparado para assinatura digital.
- **`PurchaseSuggestion`** — sugestão de reposição automática (auditável: pendente/convertida/descartada).

## Extensões
- **`PurchaseOrder`**: `purchaseRequestId`, `quotationSupplierId`, `parentOrderId` (duplicação), `approvedBy`/`approvedAt`.
- **`GoodsReceipt`**: `carrierId`, `volumes`, `weightKg`, `freightAmount`, `driverName`.
- **`GoodsReceiptItem`**: `acceptedQuantity`/`rejectedQuantity`/`disposition` (conferência), `conferredVia` ("manual"/"barcode"/"qrcode"), `occurrenceNotes`.
- **`FiscalInvoice`**: `purchaseOrderId` — ponto de integração para NF-e de entrada (Sprint Fiscal), sem processamento de XML nesta sprint.

Migration: `prisma migrate dev --name sprint07_purchasing_enterprise`.
