import { Module } from '@nestjs/common';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PurchaseQuotationsController } from './purchase-quotations.controller';
import { PurchaseApprovalsController } from './purchase-approvals.controller';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { PurchaseSuggestionsController } from './purchase-suggestions.controller';
import { Supplier360Controller } from './supplier-360.controller';
import { PurchasingAnalyticsController } from './purchasing-analytics.controller';
import { PurchasingImportController } from './purchasing-import.controller';
import { PurchaseRequestsService } from './purchase-requests.service';
import { PurchaseQuotationsService } from './purchase-quotations.service';
import { PurchaseApprovalsService } from './purchase-approvals.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { GoodsReceiptsService } from './goods-receipts.service';
import { PurchaseSuggestionsService } from './purchase-suggestions.service';
import { Supplier360Service } from './supplier-360.service';
import { PurchasingAnalyticsService } from './purchasing-analytics.service';
import { PurchasingImportExportService } from './purchasing-import-export.service';

/**
 * Módulo de Compras Enterprise (Sprint 07) — ciclo completo Necessidade →
 * Solicitação → Cotação → Comparativo → Aprovação → Pedido → Recebimento →
 * Conferência → Entrada no Estoque → Atualização Financeira → (ponto de
 * integração) Escrita Fiscal. Importa `InventoryModule` para consumir
 * `StockService`/`StockRepository`/`StockAnalyticsService` (Sprint 06)
 * diretamente — nunca duplica lógica de saldo/giro/ABC.
 */
@Module({
  imports: [InventoryModule],
  controllers: [
    PurchaseRequestsController,
    PurchaseQuotationsController,
    PurchaseApprovalsController,
    PurchaseOrdersController,
    GoodsReceiptsController,
    PurchaseSuggestionsController,
    Supplier360Controller,
    PurchasingAnalyticsController,
    PurchasingImportController,
  ],
  providers: [
    PurchaseRequestsService,
    PurchaseQuotationsService,
    PurchaseApprovalsService,
    PurchaseOrdersService,
    PurchaseOrdersRepository,
    GoodsReceiptsService,
    PurchaseSuggestionsService,
    Supplier360Service,
    PurchasingAnalyticsService,
    PurchasingImportExportService,
  ],
  exports: [PurchaseOrdersService, GoodsReceiptsService],
})
export class PurchasingModule {}
