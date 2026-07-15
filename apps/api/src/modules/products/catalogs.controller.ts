import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CatalogsService } from './catalogs.service';

/** Lookups read-only que alimentam os formulários do módulo de Produtos. */
@ApiTags('catalogs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogs: CatalogsService) {}

  @Get('brands')
  @ApiOperation({ summary: 'Lista marcas (catálogo global)' })
  brands() {
    return this.catalogs.brands();
  }

  @Get('manufacturers')
  @ApiOperation({ summary: 'Lista fabricantes (catálogo global)' })
  manufacturers() {
    return this.catalogs.manufacturers();
  }

  @Get('units')
  @ApiOperation({ summary: 'Lista unidades de medida (catálogo global)' })
  units() {
    return this.catalogs.units();
  }

  @Get('product-groups')
  @ApiOperation({ summary: 'Lista grupos de produto do tenant' })
  groups(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.catalogs.groups(user.tenantId);
  }

  @Get('product-subgroups')
  @ApiOperation({ summary: 'Lista subgrupos de produto do tenant (opcionalmente filtrado por grupo)' })
  subgroups(@CurrentUser() user: AuthenticatedRequestUser, @Query('groupId') groupId?: string) {
    return this.catalogs.subgroups(user.tenantId, groupId);
  }

  @Get('product-categories')
  @ApiOperation({ summary: 'Lista categorias de produto do tenant' })
  categories(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.catalogs.categories(user.tenantId);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Busca fornecedores do tenant (autocomplete)' })
  suppliers(@CurrentUser() user: AuthenticatedRequestUser, @Query('search') search?: string) {
    return this.catalogs.suppliers(user.tenantId, search);
  }

  @Get('vehicle-makes')
  @ApiOperation({ summary: 'Lista montadoras (catálogo global)' })
  vehicleMakes() {
    return this.catalogs.vehicleMakes();
  }

  @Get('vehicle-models')
  @ApiOperation({ summary: 'Lista modelos de uma montadora' })
  vehicleModels(@Query('makeId') makeId: string) {
    return this.catalogs.vehicleModels(makeId);
  }

  @Get('vehicle-versions')
  @ApiOperation({ summary: 'Lista versões de um modelo, ou busca livre quando `search` é informado' })
  vehicleVersions(@Query('modelId') modelId?: string, @Query('search') search?: string) {
    if (search) return this.catalogs.searchVehicleVersions(search);
    return modelId ? this.catalogs.vehicleVersions(modelId) : [];
  }
}
