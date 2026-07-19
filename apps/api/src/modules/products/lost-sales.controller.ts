import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { LostSalesService } from './lost-sales.service';
import { CreateLostSaleDto } from './dto/lost-sale.dto';

/** Vendas Perdidas — registro rápido do que o cliente queria e não conseguimos vender. */
@ApiTags('lost-sales')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products/lost-sales')
export class LostSalesController {
  constructor(private readonly service: LostSalesService) {}

  @Get()
  @RequirePermission('sales', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.list(user.tenantId);
  }

  @Get('summary')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Resumo por motivo — pra decisão de compra' })
  getSummary(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getSummary(user.tenantId);
  }

  @Post()
  @RequirePermission('sales', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Query('branchId') branchId: string, @Body() dto: CreateLostSaleDto) {
    return this.service.create({ tenantId: user.tenantId, userId: user.id }, branchId, dto);
  }
}
