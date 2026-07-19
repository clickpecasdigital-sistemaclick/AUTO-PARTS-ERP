import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { CatalogsController } from './catalogs.controller';
import { LostSalesController } from './lost-sales.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { ProductsImportExportService } from './products-import-export.service';
import { CatalogsService } from './catalogs.service';
import { LostSalesService } from './lost-sales.service';

/**
 * Módulo Comercial de Produtos (Sprint 05) — o primeiro módulo de negócio
 * completo do AutoCore ERP. Estrutura em camadas (Controller → Service →
 * Repository) replicável por todo módulo futuro (Estoque, Compras, PDV,
 * NF-e consomem `ProductsRepository`/`ProductsService` diretamente via
 * import deste módulo, em vez de duplicar acesso a Produto).
 */
@Module({
  controllers: [ProductsController, CatalogsController, LostSalesController],
  providers: [ProductsService, ProductsRepository, ProductsImportExportService, CatalogsService, LostSalesService],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
