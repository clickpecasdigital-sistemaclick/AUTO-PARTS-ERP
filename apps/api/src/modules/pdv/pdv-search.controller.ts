import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PdvSearchService } from './pdv-search.service';

@ApiTags('pdv-search')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pdv/search')
export class PdvSearchController {
  constructor(private readonly service: PdvSearchService) {}

  @Get('products')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Busca por código interno/barras/OEM/fabricante/descrição/marca' })
  searchProducts(@CurrentUser() user: AuthenticatedRequestUser, @Query('term') term: string, @Query('limit') limit?: number) {
    return this.service.searchProducts(user.tenantId, term, limit ? Number(limit) : undefined);
  }

  @Get('sales')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Busca vendas concluídas por código ou cliente, com itens (para devoluções)' })
  searchSales(@CurrentUser() user: AuthenticatedRequestUser, @Query('term') term: string, @Query('limit') limit?: number) {
    return this.service.searchSales(user.tenantId, term, limit ? Number(limit) : undefined);
  }

  @Get('by-plate')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Resolve o veículo pela placa e retorna as peças compatíveis' })
  searchByPlate(@CurrentUser() user: AuthenticatedRequestUser, @Query('plate') plate: string) {
    return this.service.searchByPlate(user.tenantId, plate);
  }

  @Get('by-chassis')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Resolve o veículo pelo chassi e retorna as peças compatíveis' })
  searchByChassis(@CurrentUser() user: AuthenticatedRequestUser, @Query('chassis') chassis: string) {
    return this.service.searchByChassis(user.tenantId, chassis);
  }

  @Get('related/:productId')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Produtos similares/equivalentes/substitutos, prontos pra vender' })
  getRelatedProducts(@CurrentUser() user: AuthenticatedRequestUser, @Param('productId') productId: string, @Query('warehouseId') warehouseId?: string) {
    return this.service.getRelatedProducts(user.tenantId, productId, warehouseId);
  }

  @Get('frequently-bought/:productId')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Produtos historicamente vendidos junto com este (venda cruzada)' })
  getFrequentlyBoughtTogether(@CurrentUser() user: AuthenticatedRequestUser, @Param('productId') productId: string) {
    return this.service.getFrequentlyBoughtTogether(user.tenantId, productId);
  }

  @Get('customer-recent-purchases/:customerId')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Últimas compras do cliente (pra sugerir recompra rápida)' })
  getCustomerRecentPurchases(@CurrentUser() user: AuthenticatedRequestUser, @Param('customerId') customerId: string) {
    return this.service.getCustomerRecentPurchases(user.tenantId, customerId);
  }

  @Get('by-vehicle')
  @RequirePermission('sales', 'view')
  searchByVehicle(@CurrentUser() user: AuthenticatedRequestUser, @Query('vehicleVersionId') vehicleVersionId: string) {
    return this.service.searchByVehicleApplication(user.tenantId, vehicleVersionId);
  }
}
