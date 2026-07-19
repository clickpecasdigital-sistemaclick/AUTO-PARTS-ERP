import { Module } from '@nestjs/common';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { ServiceOrdersController } from './service-orders.controller';
import { CheckInController, ChecklistController, DeliveryController, PortariaController } from './checkin-checklist-delivery.controller';
import { WorkshopAppointmentsController } from './workshop-appointments.controller';
import { WarrantiesController, MechanicPanelController, PostSaleController } from './warranty-mechanic-postsale.controller';
import { ServicesCatalogController, ServiceBoxesController, WorkshopAnalyticsController } from './services-catalog-boxes-analytics.controller';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersRepository } from './service-orders.repository';
import { CheckInService, ChecklistService, DeliveryService } from './checkin-checklist-delivery.service';
import { WorkshopAppointmentsService } from './workshop-appointments.service';
import { WarrantiesService, MechanicPanelService, PostSaleService } from './warranty-mechanic-postsale.service';
import { ServicesCatalogService, ServiceBoxesService } from './services-catalog-boxes.service';
import { WorkshopAnalyticsService } from './workshop-analytics.service';

/**
 * Oficina Enterprise (Sprint 11) — ciclo completo Agendamento→Recepção→
 * Check-in→Checklist→Diagnóstico→Orçamento→Aprovação→Execução→Controle
 * de peças/mão-de-obra→Finalização→Entrega→Garantia→Pós-venda. Importa
 * `InventoryModule` para `StockService`/`StockRepository` (Sprint 06) —
 * controle de peças nunca duplica a lógica de estoque. Integra também
 * com CRM (Customer/CustomerVehicle, Sprint 08), Financeiro
 * (AccountsReceivable apontado a partir do PDV) e PDV (Sale via
 * `ServiceOrderDelivery.saleId`, Sprint 09) — todos pontos de integração
 * por referência, nenhuma lógica desses módulos reescrita aqui.
 */
@Module({
  imports: [InventoryModule],
  controllers: [
    ServiceOrdersController,
    CheckInController,
    PortariaController,
    ChecklistController,
    DeliveryController,
    WorkshopAppointmentsController,
    WarrantiesController,
    MechanicPanelController,
    PostSaleController,
    ServicesCatalogController,
    ServiceBoxesController,
    WorkshopAnalyticsController,
  ],
  providers: [
    ServiceOrdersService,
    ServiceOrdersRepository,
    CheckInService,
    ChecklistService,
    DeliveryService,
    WorkshopAppointmentsService,
    WarrantiesService,
    MechanicPanelService,
    PostSaleService,
    ServicesCatalogService,
    ServiceBoxesService,
    WorkshopAnalyticsService,
  ],
  exports: [ServiceOrdersService, WarrantiesService],
})
export class WorkshopModule {}
