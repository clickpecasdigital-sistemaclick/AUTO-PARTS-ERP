import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { AuditQueryService } from './audit-query.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

/** Auditoria — histórico de tudo que foi criado/alterado/excluído no sistema, com filtro e exportação. */
@ApiTags('audit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditQueryService) {}

  @Get()
  @RequirePermission('settings', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Query() query: QueryAuditLogDto) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get('entities')
  @RequirePermission('settings', 'view')
  @ApiOperation({ summary: 'Módulos distintos já auditados — alimenta o filtro da tela' })
  listEntities(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listEntities(user.tenantId);
  }

  @Get('export')
  @RequirePermission('settings', 'export')
  async export(@CurrentUser() user: AuthenticatedRequestUser, @Query() query: QueryAuditLogDto, @Res() res: Response) {
    const csv = await this.service.exportCsv(user.tenantId, query);
    const fileName = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName}"` });
    res.send('\uFEFF' + csv); // BOM — abre certo em Excel PT-BR
  }
}
