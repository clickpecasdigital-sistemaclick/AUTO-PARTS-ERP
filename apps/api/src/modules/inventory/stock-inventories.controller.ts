import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { StockInventoriesService } from './stock-inventories.service';
import { CreateInventoryDto, CreateRecountDto, SubmitCountDto } from './dto/transfer-inventory-reservation.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/**
 * "Inventariar" (briefing) → mapeado para `create` (abrir/contar) e
 * `approve` (reconciliar — gera ajustes definitivos de saldo, ação que
 * exige o mesmo nível de confiança de uma aprovação).
 */
@ApiTags('inventory-counts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock/inventories')
export class StockInventoriesController {
  constructor(private readonly inventories: StockInventoriesService) {}

  @Get()
  @RequirePermission('stock', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('warehouseId') warehouseId?: string) {
    return this.inventories.list(user.tenantId, warehouseId);
  }

  @Get(':id')
  @RequirePermission('stock', 'view')
  getOne(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.inventories.getOne(toRequestContext(user, req), id);
  }

  @Get(':id/differences')
  @RequirePermission('stock', 'view')
  @ApiOperation({ summary: 'Diferenças (sistema x contado) antes de reconciliar' })
  getDifferences(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.inventories.getDifferences(toRequestContext(user, req), id);
  }

  @Post()
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Abre um inventário (Geral/Rotativo/por Local/por Grupo/por Fabricante)' })
  open(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateInventoryDto) {
    return this.inventories.open(toRequestContext(user, req), dto);
  }

  @Post(':id/count')
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Registra a contagem de um produto' })
  submitCount(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: SubmitCountDto) {
    return this.inventories.submitCount(toRequestContext(user, req), id, dto);
  }

  @Post(':id/reconcile')
  @RequirePermission('stock', 'approve')
  @ApiOperation({ summary: 'Reconcilia o inventário — gera ajustes de saldo definitivos para as diferenças' })
  reconcile(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.inventories.reconcile(toRequestContext(user, req), id);
  }

  @Post(':id/recount')
  @RequirePermission('stock', 'create')
  @ApiOperation({ summary: 'Abre uma recontagem para os produtos divergentes' })
  recount(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CreateRecountDto) {
    return this.inventories.createRecount(toRequestContext(user, req), id, dto);
  }
}
