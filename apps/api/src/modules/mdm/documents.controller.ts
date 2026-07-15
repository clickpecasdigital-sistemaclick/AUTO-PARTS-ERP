import { Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { DocumentsService } from './documents.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/** "Visualizar Documentos" (briefing) → ação `view` do catálogo padrão. */
@ApiTags('mdm-documents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mdm/documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  @RequirePermission('customers', 'view')
  @ApiOperation({ summary: 'Lista documentos de uma entidade (cliente, fornecedor, funcionário, veículo...)' })
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('entity') entity: string, @Query('entityId') entityId: string, @Query('latestOnly') latestOnly?: string) {
    return latestOnly === 'true'
      ? this.service.listLatestVersions(user.tenantId, entity, entityId)
      : this.service.list(user.tenantId, entity, entityId);
  }

  @Get(':id/versions')
  @RequirePermission('customers', 'view')
  getVersions(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getVersionHistory(user.tenantId, id);
  }

  @Post('upload')
  @RequirePermission('customers', 'update')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de documento (PDF/imagem/XML/DOCX/XLSX) — cria nova versão se já existir arquivo com o mesmo nome' })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.upload(toRequestContext(user, req), entity, entityId, file);
  }

  @Get(':id/download')
  @RequirePermission('customers', 'view')
  @ApiOperation({ summary: 'Registra o download (auditoria) e retorna a URL do arquivo' })
  download(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.recordDownload(toRequestContext(user, req), id);
  }

  @Delete(':id')
  @RequirePermission('customers', 'delete')
  remove(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.remove(toRequestContext(user, req), id);
  }
}
