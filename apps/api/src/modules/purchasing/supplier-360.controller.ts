import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { Supplier360Service } from './supplier-360.service';

@ApiTags('purchasing-supplier-360')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/suppliers')
export class Supplier360Controller {
  constructor(private readonly service: Supplier360Service) {}

  @Get(':id/panel')
  @RequirePermission('purchases', 'view')
  @ApiOperation({ summary: 'Painel 360°: histórico, lead time, pontualidade, preço médio, ranking, inadimplência' })
  getPanel(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getPanel(user.tenantId, id);
  }
}
