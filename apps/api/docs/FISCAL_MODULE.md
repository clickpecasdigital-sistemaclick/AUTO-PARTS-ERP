# Módulo Fiscal Engine Enterprise (Sprint 12)

> Motor Fiscal completo para NF-e (55) e NFC-e (65) com motor de
> tributação parametrizável, certificado A1, monitor fiscal, DANFE PDF,
> catálogo inteligente de rejeições, cancelamento, CC-e e inutilização.

---

## Limitação de ambiente conhecida

`binaries.prisma.sh` bloqueado (igual às Sprints 02, 05-11). Todos os
~230 nomes de modelo/campo verificados programaticamente contra
`schema.prisma` — 100% de acerto. ESLint backend 0 erros de primeira.
Frontend: `tsc --noEmit` + `eslint` + `vite build` reais — 0 erros,
**4063 módulos** (+6 vs Sprint 11).

---

## O que foi entregue

### Schema (154 models — ver `CHANGELOG-sprint12.md`)
`TaxRegime` (enum), `TaxCalculationRule` (motor parametrizável),
`FiscalRejectionLog` (catálogo inteligente), `FiscalVoidingRange`.
Extensões: `FiscalConfiguration` (regime/CRT/CSC/contingência),
`FiscalCertificate` (histórico de renovação), `FiscalInvoice`
(xmlContent/rejectionCode), `FiscalInvoiceItem` (todos os CST/rates/BC/
amounts tributários).

### Backend (`apps/api/src/modules/fiscal/`)

| Arquivo | Responsabilidade |
|---|---|
| `rejection-catalog.ts` | 20+ rejeições SEFAZ catalogadas com explanation/cause/fix/internalLink — exportado como constante mutável (sem redeployar para atualizar) |
| `tax-engine.service.ts` | Motor parametrizável: resolve regra mais específica por priority, calcula ICMS/ST/IPI/PIS/COFINS/FCP/DIFAL. Zero lógica hardcoded — 100% via `TaxCalculationRule` |
| `xml/nfe-xml-builder.service.ts` | Geração de XML NF-e (55) e NFC-e (65) conforme leiaute 4.00, XML de cancelamento, CC-e e inutilização. Assinatura digital = placeholder estruturado (requer xml-crypto + A1) |
| `fiscal-issuance.service.ts` | Fluxo completo: config→série→número→TaxEngine→XML→chave de acesso 44 dígitos→armazenamento pending_authorization. Confirmação de autorização por webhook. Registro de rejeição com catálogo |
| `fiscal-events-config-cert.service.ts` | Cancelamento (>= 15 chars, testado), CC-e (sequência incremental, max 20, testado), Inutilização. Configuração fiscal (upsert). Certificado A1 (upload, alerta vencimento, revogação) |
| `fiscal-monitor-danfe.service.ts` | Dashboard (totais + últimas rejeições + certificados expirando), listagem de notas com filtros, download XML, geração de DANFE PDF (pdfkit) |
| `test/fiscal.service.spec.ts` | TaxEngine (zeros sem regra, regra mais específica vence, ICMS-ST com MVA, DIFAL), catálogo de rejeições, chave de acesso 44 dígitos, XML armazenado |
| `test/fiscal-events.service.spec.ts` | Cancelamento (validação de min 15 chars, status authorized), CC-e (sequência incremental, limite de 20) |

### Frontend (`apps/web/src/modules/fiscal/`)
`FiscalMonitorPage` (dashboard com KPIs, alertas de certificado,
últimas rejeições com sugestão de correção clicável),
`FiscalInvoiceListPage` (lista com filtros por status/modelo, download
XML/DANFE), `FiscalConfigPage` (regime tributário, CRT, ambiente, UF,
CFOP padrão, natureza da operação, gerenciamento de certificados).

---

## Decisões de arquitetura

1. **Motor tributário sem lógica hardcoded** — toda regra vive em
   `TaxCalculationRule` (DB). Adicionar um novo estado ou NCM é um
   INSERT, não um deploy. Mesma resolução por `priority` do `DiscountRule`
   (Sprint 09) — sem inventar novo padrão.

2. **Transmissão SEFAZ = ponto de integração estruturado** — exatamente
   como o PIX (Sprint 10) e o CNAB (Sprint 10). O XML gerado está
   bem-formado com totais e chave de acesso corretos; a assinatura XAdES
   real precisaria de `xml-crypto` + certificado plugado. O fluxo de
   estado (`pending_authorization → authorized/rejected`) é o mesmo padrão
   de webhook já testado no Financeiro.

3. **Catálogo de rejeições como constante mutável** — exportado como
   `REJECTION_CATALOG: Record<string, RejectionEntry>` em vez de
   hardcoded no fluxo de negócio. Futuras atualizações = editar o objeto,
   não o motor. O catálogo também pode ser complementado via
   `FiscalRejectionLog` (histórico de ocorrências reais por tenant).

4. **Senha do certificado A1 nunca persiste** — o arquivo `.pfx`
   armazenado no Supabase Storage está criptografado. A senha é usada
   apenas em memória durante a assinatura (na integração real com
   `xml-crypto`). Mesma decisão documentada desde o briefing original.

5. **CSC para NFC-e armazenado criptografado (AES-256)** — campo
   `cscToken` em `FiscalConfiguration` nunca em texto puro; descriptografia
   ocorre na camada de aplicação ao montar o QR Code.

## Fora de escopo (conforme briefing)
Transmissão SEFAZ real (SOAP + XAdES), CT-e, MDF-e e NFS-e completos
(estruturas preparadas), EPEC/SVC completos, manifestação do destinatário
— todos com estrutura de banco pronta para a sprint de integração.
