import { Module } from '@nestjs/common';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { FiscalModule } from '@/modules/fiscal/fiscal.module';
import { PdvCartController } from './pdv-cart.controller';
import { PdvSearchController } from './pdv-search.controller';
import { PdvQuotesController } from './pdv-quotes.controller';
import { PdvSalesOrdersController } from './pdv-sales-orders.controller';
import { PdvCashRegisterController } from './pdv-cash-register.controller';
import { PdvReturnsController } from './pdv-returns.controller';
import { PdvAnalyticsController, PdvDiscountRulesController } from './pdv-analytics.controller';
import { PdvCartService } from './pdv-cart.service';
import { PdvCartRepository } from './pdv-cart.repository';
import { PdvCheckoutService } from './pdv-checkout.service';
import { PdvDiscountService } from './pdv-discount.service';
import { PdvSearchService } from './pdv-search.service';
import { PdvQuotesService } from './pdv-quotes.service';
import { PdvSalesOrdersService } from './pdv-sales-orders.service';
import { PdvCashRegisterService } from './pdv-cash-register.service';
import { PdvReturnsService } from './pdv-returns.service';
import { PdvAnalyticsService } from './pdv-analytics.service';
import { PdvPrintService } from './pdv-print.service';

/**
 * PDV Enterprise (Sprint 09) — Balcão, Oficina, Televendas, Orçamentos,
 * Pedidos, Pré-vendas. O carrinho É um `Sale` com `status: open` (Sprint
 * 02) — zero tabela paralela. Importa `InventoryModule` para
 * `StockService`/`StockRepository`/`StockReservationsService` (Sprint 06)
 * — toda baixa/reserva de estoque do PDV passa por eles, nunca duplicada.
 */
@Module({
  imports: [InventoryModule, FiscalModule],
  controllers: [
    PdvCartController,
    PdvSearchController,
    PdvQuotesController,
    PdvSalesOrdersController,
    PdvCashRegisterController,
    PdvReturnsController,
    PdvAnalyticsController,
    PdvDiscountRulesController,
  ],
  providers: [
    PdvCartService,
    PdvCartRepository,
    PdvCheckoutService,
    PdvDiscountService,
    PdvSearchService,
    PdvQuotesService,
    PdvSalesOrdersService,
    PdvCashRegisterService,
    PdvReturnsService,
    PdvAnalyticsService,
    PdvPrintService,
  ],
  exports: [PdvCartService, PdvCheckoutService],
})
export class PdvModule {}
