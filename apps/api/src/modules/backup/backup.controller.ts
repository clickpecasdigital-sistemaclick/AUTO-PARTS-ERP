import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { BackupService } from './backup.service';

@ApiTags('backup')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('backup')
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  @Post('run')
  @RequirePermission('settings', 'create')
  @ApiOperation({ summary: 'Executar backup manual (full | incremental | schema_only)' })
  run(@Body('type') type: 'full' | 'incremental' | 'schema_only' = 'full') {
    return this.backup.runBackup(type);
  }

  @Get()
  @RequirePermission('settings', 'view')
  list(@Body('type') type?: string) { return this.backup.listBackups(type); }

  @Post(':id/validate')
  @RequirePermission('settings', 'view')
  validate(@Param('id') id: string) { return this.backup.validateBackup(id); }

  @Post('schedule')
  @RequirePermission('settings', 'update')
  schedule(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.backup.scheduleBackups({ tenantId: u.tenantId, userId: u.id });
  }
}
