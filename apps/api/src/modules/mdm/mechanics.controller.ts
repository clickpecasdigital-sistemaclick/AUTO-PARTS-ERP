import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { MechanicsService } from './mechanics.service';

@ApiTags('mdm-mechanics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/mechanics')
export class MechanicsController {
  constructor(private readonly service: MechanicsService) {}

  @Get()
  @RequirePermission('employees', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermission('employees', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Get(':id/productivity')
  @RequirePermission('employees', 'view')
  getProductivity(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getProductivity(user.tenantId, id);
  }

  @Post(':id/certifications')
  @RequirePermission('employees', 'update')
  addCertification(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() data: { name: string; issuer?: string; issuedAt?: string; expiresAt?: string },
  ) {
    return this.service.addCertification(user.tenantId, id, data);
  }

  @Post(':id/clock-in')
  @RequirePermission('employees', 'update')
  clockIn(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body('serviceOrderId') serviceOrderId?: string) {
    return this.service.clockIn(user.tenantId, id, serviceOrderId);
  }

  @Post('time-entries/:timeEntryId/clock-out')
  @RequirePermission('employees', 'update')
  clockOut(@CurrentUser() user: AuthenticatedRequestUser, @Param('timeEntryId') timeEntryId: string) {
    return this.service.clockOut(user.tenantId, timeEntryId);
  }
}
