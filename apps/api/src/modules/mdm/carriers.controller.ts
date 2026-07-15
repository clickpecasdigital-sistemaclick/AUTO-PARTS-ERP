import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CarriersService } from './carriers.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('mdm-carriers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/carriers')
export class CarriersController {
  constructor(private readonly service: CarriersService) {}

  @Get()
  @RequirePermission('carriers', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.findAll(user.tenantId);
  }

  @Get('quote-freight')
  @RequirePermission('carriers', 'view')
  @ApiOperation({ summary: 'Cotação simplificada de frete por região, comparando transportadoras cadastradas' })
  quoteFreight(@CurrentUser() user: AuthenticatedRequestUser, @Query('region') region: string, @Query('weightKg') weightKg?: number) {
    return this.service.quoteFreight(user.tenantId, region, weightKg ? Number(weightKg) : undefined);
  }

  @Get(':id')
  @RequirePermission('carriers', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermission('carriers', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('companyId') companyId: string, @Body() dto: Record<string, unknown>) {
    return this.service.create(toRequestContext(user, req), companyId, dto);
  }

  @Post(':id/freight-tables')
  @RequirePermission('carriers', 'update')
  addFreightTable(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() data: { region: string; pricePerKg?: number; flatRate?: number; leadTimeDays: number },
  ) {
    return this.service.addFreightTable(user.tenantId, id, data);
  }

  @Post(':id/vehicles')
  @RequirePermission('carriers', 'update')
  addVehicle(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() data: { plate: string; model?: string; capacityKg?: number }) {
    return this.service.addVehicle(user.tenantId, id, data);
  }

  @Post(':id/drivers')
  @RequirePermission('carriers', 'update')
  addDriver(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() data: { name: string; document?: string; licenseNumber?: string; phone?: string },
  ) {
    return this.service.addDriver(user.tenantId, id, data);
  }
}
