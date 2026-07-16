import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, QuerySupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

function toCtx(user: AuthenticatedRequestUser) {
  return { tenantId: user.tenantId, userId: user.id };
}

@ApiTags('purchasing-suppliers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Get()
  @RequirePermission('purchases', 'view')
  @ApiOperation({ summary: 'Lista fornecedores com busca e paginação' })
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Query() query: QuerySupplierDto) {
    return this.service.findAll(toCtx(user), query);
  }

  @Get(':id')
  @RequirePermission('purchases', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(toCtx(user), id);
  }

  @Post()
  @RequirePermission('purchases', 'create')
  @ApiOperation({ summary: 'Cadastra um novo fornecedor' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Query('companyId') companyId: string, @Body() dto: CreateSupplierDto) {
    return this.service.create(toCtx(user), companyId, dto);
  }

  @Put(':id')
  @RequirePermission('purchases', 'update')
  update(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.update(toCtx(user), id, dto);
  }

  @Delete(':id')
  @RequirePermission('purchases', 'delete')
  @ApiOperation({ summary: 'Inativa o fornecedor (soft delete)' })
  remove(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.remove(toCtx(user), id);
  }
}
