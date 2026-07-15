import { Module } from '@nestjs/common';
import { StockMovementsController } from './stock-movements.controller';
import { WmsLocationsController } from './wms-locations.controller';
import { StockTransfersController } from './stock-transfers.controller';
import { StockInventoriesController } from './stock-inventories.controller';
import { StockReservationsController } from './stock-reservations.controller';
import { StockAnalyticsController } from './stock-analytics.controller';
import { StockImportExportController } from './stock-import-export.controller';
import { StockRepository } from './stock.repository';
import { StockService } from './stock.service';
import { WmsLocationsService } from './wms-locations.service';
import { StockTransfersService } from './stock-transfers.service';
import { StockInventoriesService } from './stock-inventories.service';
import { StockReservationsService } from './stock-reservations.service';
import { StockAnalyticsService } from './stock-analytics.service';
import { StockImportExportService } from './stock-import-export.service';

/**
 * Módulo de Estoque Enterprise (Sprint 06) — o "coração operacional do
 * ERP" (briefing). `StockService` é exportado para ser consumido
 * diretamente pelos módulos de Compras/Vendas/PDV/OS (Sprint 07+) — cada
 * um chama `StockService.move()` com o `StockMovementType` apropriado
 * (`purchase_in`, `sale_out`, `service_order_out`...) em vez de duplicar
 * lógica de atualização de saldo. `StockReservationsService` é o ponto de
 * integração equivalente para reservas.
 */
@Module({
  controllers: [
    StockMovementsController,
    WmsLocationsController,
    StockTransfersController,
    StockInventoriesController,
    StockReservationsController,
    StockAnalyticsController,
    StockImportExportController,
  ],
  providers: [
    StockRepository,
    StockService,
    WmsLocationsService,
    StockTransfersService,
    StockInventoriesService,
    StockReservationsService,
    StockAnalyticsService,
    StockImportExportService,
  ],
  exports: [StockRepository, StockService, StockReservationsService, StockAnalyticsService],
})
export class InventoryModule {}
