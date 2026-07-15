# Alterações de schema — Sprint 08 (MDM + CRM 360°)

Aditivas, sem remoção de nenhum campo/tabela existente. 16 modelos novos.

## Novos modelos
- **`CustomerContact`** / **`SupplierContact`** — múltiplos contatos por tipo (`ContactKind`).
- **`CustomerCreditEvent`** — auditoria tipada de alteração de crédito.
- **`EmployeeSalary`** — estrutura protegida de remuneração (histórico por vigência, nunca no cadastro padrão do funcionário).
- **`MechanicCertification`** / **`MechanicTimeEntry`** — certificações e apontamento de horas.
- **`CarrierFreightTable`** / **`CarrierVehicle`** / **`CarrierDriver`** — tabela de frete por região, frota e motoristas.
- **`DataConsent`** / **`DataSubjectRequest`** — LGPD (consentimento por finalidade, solicitação do titular).
- **`CrmPipelineStage`** / **`CrmOpportunity`** / **`CrmTask`** / **`CrmTag`** / **`CrmTagAssignment`** / **`CrmCampaign`** / **`CrmCampaignMember`** — Pipeline de CRM completo.
- **`SupportTicket`** — Chamados (parte da Visão 360° do Cliente).

## Extensões
- **`Customer`**: `customerType` (Consumidor Final/Oficina/Atacado/Varejo), `rg`/`municipalRegistration`/`suframaCode`, `classification`/`category`/`segment`, `website`/`instagram`/`facebook`, `latitude`/`longitude`, e o **snapshot de crédito/compra denormalizado** (`creditScore`, `creditStatus`, `lastPurchaseAt`, `totalPurchasesCount`, `averageTicketValue`, `largestPurchaseValue`) — recalculado por serviço, nunca a fonte de verdade isolada.
- **`CustomerAddress`**: `latitude`/`longitude`. **`AddressKind`**: + `fiscal`/`residential`/`commercial`.
- **`Employee`**: `departmentId`, `rg`, `photoUrl`, `signatureUrl`. Salário migrado para `EmployeeSalary` (nunca neste model).
- **`Attachment`**: `version`/`previousVersionId` (versionamento).
- **`AuditAction`**: + `credit_change`, `consent_change`, `anonymize`, `document_upload`, `document_download`, `sensitive_data_view`.

Migration: `prisma migrate dev --name sprint08_mdm_crm360`.
