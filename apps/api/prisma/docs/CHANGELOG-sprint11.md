# Alterações de schema — Sprint 11 (Oficina Enterprise)

Aditivas, sem remoção de nenhum campo/tabela existente. 7 modelos novos.

## Novos modelos
- **`ServiceBox`** — box/elevador físico (agendamento por box).
- **`WorkshopAppointment`** — agenda especializada de oficina (mecânico/box/serviço/lista de espera/reagendamento), distinta do `Appointment` genérico de CRM (Sprint 08).
- **`ServiceOrderStatusHistory`** — trilha tipada do ciclo de status da OS.
- **`ServiceOrderCheckIn`** — check-in (KM, combustível, objetos, danos, assinatura).
- **`ServiceOrderDelivery`** — entrega (assinatura, integração com Sale do PDV).
- **`CustomerSatisfactionSurvey`** — pesquisa de satisfação + NPS.
- **`ServiceFollowUp`** — pós-venda (lembrete de revisão, retorno programado).

## Extensões
- **`Service`**: `code`, `category` (`ServiceCategory`), `specialty`, `warrantyDays`.
- **`ServiceOrder`**: `consultantId`, `boxId`, `appointmentId`, `priority` (`ServiceOrderPriority`), `technicalDiagnosis`/`proposedSolution`/`estimatedMinutes` (diagnóstico completo), `expectedDeliveryAt`, `approvedAt`/`cancelledAt`/`cancelReason`, `isRework`/`reworkOfId` (índice de retrabalho).
- **`Warranty`**: `type` (peça/serviço), `productId`/`serviceId`, `claimedAt`/`claimCost`/`claimNotes` (acionamento).
- **`FiscalInvoice`**: `serviceOrderId` — ponto de integração para NFS-e (Sprint Fiscal).

Migration: `prisma migrate dev --name sprint11_workshop_enterprise`.
