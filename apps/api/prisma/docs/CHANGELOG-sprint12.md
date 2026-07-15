# Alterações de schema — Sprint 12 (Fiscal Engine Enterprise)

Aditivas, sem remoção de nenhum campo/tabela existente. 3 novos models,
extensão de 3 existentes.

## Novo enum
- **`TaxRegime`** — simples_nacional / lucro_presumido / lucro_real / mei

## Novos models
- **`TaxCalculationRule`** — motor parametrizável: regras de ICMS/ST/IPI/
  PIS/COFINS/FCP/DIFAL/ISS por combinação NCM/UF/regime/operação/produto.
  Resolução por `priority` (maior vence), exatamente como `DiscountRule`
  (Sprint 09). Zero lógica fiscal hardcoded no motor.
- **`FiscalRejectionLog`** — catálogo inteligente de rejeições SEFAZ com
  explanation/possibleCause/suggestedFix/internalLink por ocorrência.
- **`FiscalVoidingRange`** — inutilização de intervalos de numeração.

## Extensões
- **`FiscalConfiguration`**: `taxRegime`, `crt`, `uf`, `ibgeCode`,
  `defaultNatureOfOperation`, `fiscalObservations`, `cscId`, `cscToken`
  (criptografado), `sefazToken`, `offlineNfceEnabled`, `contingencyReason`.
- **`FiscalCertificate`**: `serialNumber`, `subjectCN`, `renewedFromId`
  (histórico de renovação), `expiryAlertSentAt`, relação com `Company`.
- **`FiscalInvoice`**: `xmlContent`, `contingencyJustification`,
  `rejectionCode`, relação `rejectionLogs`.
- **`FiscalInvoiceItem`**: todos os campos tributários completos —
  CST/CSOSN/origin/rates/amounts para ICMS/ST/FCP/IPI/PIS/COFINS, NCM e
  CEST, freight, insurance.

## Relações inversas adicionadas
- `Branch.fiscalVoidingRanges`
- `Company.fiscalCertificates`

Migration: `prisma migrate dev --name sprint12_fiscal_engine`.
