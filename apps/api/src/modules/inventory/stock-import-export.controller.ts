import { Controller, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { StockImportExportService } from './stock-import-export.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/** "Importar"/"Exportar" (briefing) → mapeados para `create`/`export` do catálogo padrão. */
@ApiTags('inventory-import-export')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock')
export class StockImportExportController {
  constructor(private readonly importExport: StockImportExportService) {}

  @Post('import')
  @RequirePermission('stock', 'create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importa saldo inicial/inventário via CSV ou Excel (.xlsx)' })
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
  ) {
    const ctx = toRequestContext(user, req);
    return format === 'xlsx' ? this.importExport.importStockExcel(ctx, file.buffer) : this.importExport.importStockCsv(ctx, file.buffer);
  }

  @Post('export')
  @RequirePermission('stock', 'export')
  @ApiOperation({ summary: 'Exporta o relatório de estoque em CSV, Excel ou PDF' })
  async export(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('format') format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    @Query('warehouseId') warehouseId: string | undefined,
    @Res() res: Response,
  ) {
    const fileName = `estoque-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'xlsx') {
      const buffer = await this.importExport.exportExcel(user.tenantId, warehouseId);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${fileName}.xlsx"` });
      return res.send(buffer);
    }
    if (format === 'pdf') {
      const buffer = await this.importExport.exportPdf(user.tenantId, warehouseId);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}.pdf"` });
      return res.send(buffer);
    }
    const buffer = await this.importExport.exportCsv(user.tenantId, warehouseId);
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName}.csv"` });
    return res.send(buffer);
  }
}
