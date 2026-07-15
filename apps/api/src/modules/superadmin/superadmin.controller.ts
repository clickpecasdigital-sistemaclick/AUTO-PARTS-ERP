import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { SuperAdminService } from './superadmin.service';

@ApiTags('super-admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('superadmin')
export class SuperAdminController {
  constructor(private readonly sa: SuperAdminService) {}

  @Get('dashboard') @RequirePermission('settings', 'view') @ApiOperation({ summary: 'Dashboard global — tenants, usuários, MRR, assinaturas' }) dashboard() { return this.sa.getDashboard(); }
  @Get('tenants') @RequirePermission('settings', 'view') list(@Query('page') p?: number, @Query('search') s?: string) { return this.sa.listTenants(p ? Number(p) : 1, 20, s); }
  @Get('tenants/:id') @RequirePermission('settings', 'view') getTenant(@Param('id') id: string) { return this.sa.getTenant(id); }
  @Post('tenants/:id/suspend') @RequirePermission('settings', 'update') suspend(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('reason') reason: string) { return this.sa.suspendTenant({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip }, id, reason); }
  @Post('tenants/:id/reactivate') @RequirePermission('settings', 'update') reactivate(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) { return this.sa.reactivateTenant({ tenantId: u.tenantId, userId: u.id, ipAddress: req.ip }, id); }
  @Get('usage') @RequirePermission('settings', 'view') usageReport() { return this.sa.getUsageReport(); }
  @Get('storage') @RequirePermission('settings', 'view') storageReport() { return this.sa.getStorageReport(); }
  @Get('logs') @RequirePermission('settings', 'view') logs(@Query('page') p?: number, @Query('tenantId') t?: string) { return this.sa.getGlobalAuditLog(p ? Number(p) : 1, 50, t); }
  @Get('plans') @RequirePermission('settings', 'view') plans() { return this.sa.listPlans(); }
  @Put('plans') @RequirePermission('settings', 'update') upsertPlan(@Body() data: Record<string, unknown>) { return this.sa.createOrUpdatePlan(data); }
  @Post('marketplace/publish') @RequirePermission('settings', 'create') publishPlugin(@Body() data: Record<string, unknown>) { return this.sa.publishPlugin(data); }
  @Put('marketplace/:id') @RequirePermission('settings', 'update') updatePlugin(@Param('id') id: string, @Body() data: Record<string, unknown>) { return this.sa.updatePlugin(id, data); }
}
