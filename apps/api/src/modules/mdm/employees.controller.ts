import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { EmployeesService } from './employees.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('mdm-employees')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @RequirePermission('employees', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Param('departmentId') departmentId?: string) {
    return this.service.findAll(user.tenantId, departmentId);
  }

  @Get(':id')
  @RequirePermission('employees', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermission('employees', 'create')
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Body('companyId') companyId: string,
    @Body('branchId') branchId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.service.create(toRequestContext(user, req), companyId, branchId, dto);
  }

  @Put(':id')
  @RequirePermission('employees', 'update')
  update(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.service.update(toRequestContext(user, req), id, dto);
  }

  /**
   * "Salário (estrutura protegida)" — ação `view` aqui é deliberadamente a
   * MESMA usada para o resto do cadastro porque o RBAC desta arquitetura
   * (Sprints 04-07) não tem um nível "view_financial" próprio; a proteção
   * real está no fato de este endpoint NUNCA ser retornado por
   * `GET /mdm/employees/:id` — só por chamada explícita aqui, e cada
   * acesso grava `sensitive_data_view` no audit log (`EmployeesService`).
   */
  @Get(':id/salary')
  @RequirePermission('employees', 'view')
  @ApiOperation({ summary: 'Histórico de remuneração — estrutura protegida, cada acesso é auditado' })
  getSalary(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.getSalaryHistory(toRequestContext(user, req), id);
  }

  @Post(':id/salary')
  @RequirePermission('employees', 'update')
  setSalary(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Body('baseSalary') baseSalary: number,
    @Body('effectiveFrom') effectiveFrom: string,
    @Body('notes') notes?: string,
  ) {
    return this.service.setSalary(toRequestContext(user, req), id, baseSalary, effectiveFrom, notes);
  }
}
