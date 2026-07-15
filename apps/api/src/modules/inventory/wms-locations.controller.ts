import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { WmsLocationsService } from './wms-locations.service';
import { CreateAisleDto, CreateShelfDto, CreateStorageLocationDto, CreateStreetDto, CreateWarehouseDto } from './dto/wms-location.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/** Hierarquia WMS completa: Depósito > Corredor > Rua > Prateleira > Posição (Nível + Posição). */
@ApiTags('inventory-wms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock')
export class WmsLocationsController {
  constructor(private readonly wms: WmsLocationsService) {}

  @Get('warehouses')
  @RequirePermission('stock', 'view')
  listWarehouses(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.wms.listWarehouses(user.tenantId);
  }

  @Post('warehouses')
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Cria um Depósito' })
  createWarehouse(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateWarehouseDto) {
    return this.wms.createWarehouse(toRequestContext(user, req), dto);
  }

  @Get('warehouses/:warehouseId/tree')
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'Árvore completa do depósito: Corredores > Ruas > Prateleiras > Posições' })
  getTree(@CurrentUser() user: AuthenticatedRequestUser, @Param('warehouseId') warehouseId: string) {
    return this.wms.getWarehouseTree(user.tenantId, warehouseId);
  }

  @Delete('warehouses/:id')
  @RequirePermission('stock', 'delete')
  @ApiOperation({ summary: 'Inativa um Depósito (soft delete — nunca remove o histórico de movimentações)' })
  async deleteWarehouse(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.wms.softDeleteWarehouse(user.tenantId, id);
  }

  @Get('aisles')
  @RequirePermission('stock', 'view')
  listAisles(@CurrentUser() user: AuthenticatedRequestUser, @Query('warehouseId') warehouseId: string) {
    return this.wms.listAisles(user.tenantId, warehouseId);
  }

  @Post('aisles')
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Cria um Corredor' })
  createAisle(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateAisleDto) {
    return this.wms.createAisle(toRequestContext(user, req), dto);
  }

  @Get('streets')
  @RequirePermission('stock', 'view')
  listStreets(@CurrentUser() user: AuthenticatedRequestUser, @Query('aisleId') aisleId: string) {
    return this.wms.listStreets(user.tenantId, aisleId);
  }

  @Post('streets')
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Cria uma Rua' })
  createStreet(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateStreetDto) {
    return this.wms.createStreet(toRequestContext(user, req), dto);
  }

  @Get('shelves')
  @RequirePermission('stock', 'view')
  listShelves(@CurrentUser() user: AuthenticatedRequestUser, @Query('streetId') streetId: string) {
    return this.wms.listShelves(user.tenantId, streetId);
  }

  @Post('shelves')
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Cria uma Prateleira' })
  createShelf(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateShelfDto) {
    return this.wms.createShelf(toRequestContext(user, req), dto);
  }

  @Get('locations')
  @RequirePermission('stock', 'view')
  listLocations(@CurrentUser() user: AuthenticatedRequestUser, @Query('shelfId') shelfId: string) {
    return this.wms.listLocations(user.tenantId, shelfId);
  }

  @Get('locations/by-address')
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'Busca uma posição pelo endereço completo (ex: leitura de etiqueta com código de barras/QR Code)' })
  findByAddress(@CurrentUser() user: AuthenticatedRequestUser, @Query('fullAddress') fullAddress: string) {
    return this.wms.findByFullAddress(user.tenantId, fullAddress);
  }

  @Post('locations')
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Cria uma posição (Nível + Posição) — monta o endereço completo automaticamente' })
  createLocation(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateStorageLocationDto) {
    return this.wms.createLocation(toRequestContext(user, req), dto);
  }
}
