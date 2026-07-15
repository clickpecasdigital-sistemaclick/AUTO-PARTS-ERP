import { Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PurchasingImportExportService } from './purchasing-import-export.service';

/** Importação de XML de NF-e e catálogos de fabricantes — estrutura preparada (briefing), implementação real fica para a Sprint Fiscal/Catálogos. */
@ApiTags('purchasing-import')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/import')
export class PurchasingImportController {
  constructor(private readonly importExport: PurchasingImportExportService) {}

  @Post('nfe-xml')
  @RequirePermission('purchases', 'create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importa XML de NF-e de compra (estrutura preparada — Sprint Fiscal)' })
  @UseInterceptors(FileInterceptor('file'))
  importNfeXml(@CurrentUser() user: AuthenticatedRequestUser, @UploadedFile() file: Express.Multer.File) {
    return this.importExport.importNfeXml(user.tenantId, file.buffer);
  }

  @Post('manufacturer-catalog/:manufacturerKey')
  @RequirePermission('purchases', 'create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importa catálogo de um fabricante (estrutura preparada)' })
  @UseInterceptors(FileInterceptor('file'))
  importManufacturerCatalog(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('manufacturerKey') manufacturerKey: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importExport.importManufacturerCatalog(user.tenantId, file.buffer, manufacturerKey);
  }
}
