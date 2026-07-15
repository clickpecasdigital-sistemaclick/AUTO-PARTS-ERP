import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { CustomersService } from './customers.service';
import {
  CreateContactDto,
  CreateCustomerAddressDto,
  CreateCustomerDto,
  CreateCustomerVehicleDto,
  QueryCustomerDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/**
 * Clientes — Cadastro Mestre (MDM). Fonte oficial consumida por Vendas/
 * PDV/Oficina/Financeiro/CRM — nenhum desses módulos duplica o cadastro,
 * todos referenciam `customerId`.
 */
@ApiTags('mdm-customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  @RequirePermission('customers', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Query() query: QueryCustomerDto) {
    return this.service.findAll(toRequestContext(user, req), query);
  }

  @Get('birthdays')
  @RequirePermission('customers', 'view')
  @ApiOperation({ summary: 'Aniversariantes do mês (Dashboard CRM)' })
  getBirthdays(@CurrentUser() user: AuthenticatedRequestUser, @Query('month') month?: number) {
    return this.service.getBirthdays(user.tenantId, month ? Number(month) : undefined);
  }

  @Get(':id')
  @RequirePermission('customers', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.findOne(toRequestContext(user, req), id);
  }

  @Post()
  @RequirePermission('customers', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('companyId') companyId: string, @Body() dto: CreateCustomerDto) {
    return this.service.create(toRequestContext(user, req), companyId, dto);
  }

  @Put(':id')
  @RequirePermission('customers', 'update')
  update(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(toRequestContext(user, req), id, dto);
  }

  @Delete(':id')
  @RequirePermission('customers', 'delete')
  remove(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.remove(toRequestContext(user, req), id);
  }

  // --- Contatos -----------------------------------------------------------------

  @Post(':id/contacts')
  @RequirePermission('customers', 'update')
  addContact(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CreateContactDto) {
    return this.service.addContact(toRequestContext(user, req), id, dto);
  }

  @Delete(':id/contacts/:contactId')
  @RequirePermission('customers', 'update')
  removeContact(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Param('contactId') contactId: string) {
    return this.service.removeContact(toRequestContext(user, req), id, contactId);
  }

  // --- Endereços ----------------------------------------------------------------

  @Post(':id/addresses')
  @RequirePermission('customers', 'update')
  addAddress(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CreateCustomerAddressDto) {
    return this.service.addAddress(toRequestContext(user, req), id, dto);
  }

  @Delete('addresses/:addressId')
  @RequirePermission('customers', 'update')
  removeAddress(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('addressId') addressId: string) {
    return this.service.removeAddress(toRequestContext(user, req), addressId);
  }

  // --- Veículos -----------------------------------------------------------------

  @Post(':id/vehicles')
  @RequirePermission('customers', 'update')
  addVehicle(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CreateCustomerVehicleDto) {
    return this.service.addVehicle(toRequestContext(user, req), id, dto);
  }

  @Delete('vehicles/:vehicleId')
  @RequirePermission('customers', 'update')
  removeVehicle(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('vehicleId') vehicleId: string) {
    return this.service.removeVehicle(toRequestContext(user, req), vehicleId);
  }
}
