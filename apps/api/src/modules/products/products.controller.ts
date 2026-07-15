import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { ProductsService } from './products.service';
import { ProductsImportExportService } from './products-import-export.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductPhotoDto, ReorderProductPhotosDto } from './dto/create-product-photo.dto';
import { CreateProductSupplierDto, UpdateProductSupplierDto } from './dto/create-product-supplier.dto';
import { CreateProductApplicationDto } from './dto/create-product-application.dto';
import { CreateProductCrossReferenceDto } from './dto/create-product-cross-reference.dto';
import { CreateProductPromotionDto } from './dto/create-product-promotion.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return {
    tenantId: user.tenantId,
    userId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

/**
 * Módulo Comercial de Produtos — API REST completa (Sprint 05).
 * Toda rota exige `JwtAuthGuard` (sessão válida) + `PermissionsGuard`
 * (ação granular, ver `@RequirePermission`). `tenantId` SEMPRE vem do
 * usuário autenticado (`@CurrentUser()`), nunca do payload do cliente —
 * isolamento multi-tenant garantido na borda da API, não apenas no banco.
 */
@ApiTags('products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly importExport: ProductsImportExportService,
  ) {}

  @Get()
  @RequirePermission('products', 'view')
  @ApiOperation({ summary: 'Lista produtos com busca, filtros, paginação e ordenação' })
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Query() query: QueryProductDto) {
    return this.productsService.findAll(toRequestContext(user, req), query);
  }

  @Get('export')
  @RequirePermission('products', 'export')
  @ApiOperation({ summary: 'Exporta o catálogo filtrado em CSV, Excel (xlsx) ou PDF' })
  async export(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Query() query: QueryProductDto,
    @Query('format') format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    @Res() res: Response,
  ) {
    const ctx = toRequestContext(user, req);
    const fileName = `produtos-${new Date().toISOString().slice(0, 10)}`;

    if (format === 'xlsx') {
      const buffer = await this.importExport.exportExcel(ctx, query);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${fileName}.xlsx"` });
      return res.send(buffer);
    }
    if (format === 'pdf') {
      const buffer = await this.importExport.exportPdf(ctx, query);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}.pdf"` });
      return res.send(buffer);
    }
    const buffer = await this.importExport.exportCsv(ctx, query);
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName}.csv"` });
    return res.send(buffer);
  }

  @Post('import')
  @RequirePermission('products', 'create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importa produtos via CSV ou Excel (.xlsx) — relatório de erro por linha' })
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
  ) {
    const ctx = toRequestContext(user, req);
    return format === 'xlsx' ? this.importExport.importExcel(ctx, file.buffer) : this.importExport.importCsv(ctx, file.buffer);
  }

  @Get(':id')
  @RequirePermission('products', 'view')
  @ApiOperation({ summary: 'Detalha um produto (todas as abas do cadastro)' })
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.productsService.findOne(toRequestContext(user, req), id);
  }

  @Get(':id/history')
  @RequirePermission('products', 'view')
  @ApiOperation({ summary: 'Histórico de auditoria do produto (criação, alterações, mudanças de preço/fornecedor)' })
  getHistory(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.productsService.getHistory(toRequestContext(user, req), id);
  }

  @Post()
  @RequirePermission('products', 'create')
  @ApiOperation({ summary: 'Cria um produto' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateProductDto) {
    return this.productsService.create(toRequestContext(user, req), dto);
  }

  @Patch(':id')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Atualiza um produto (parcial)' })
  update(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(toRequestContext(user, req), id, dto);
  }

  @Delete(':id')
  @RequirePermission('products', 'delete')
  @ApiOperation({ summary: 'Remove um produto (soft delete)' })
  remove(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.productsService.remove(toRequestContext(user, req), id);
  }

  // --- Fotos -----------------------------------------------------------------

  @Post(':id/photos')
  @RequirePermission('products', 'update')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de foto do produto (Supabase Storage)' })
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateProductPhotoDto,
  ) {
    return this.productsService.uploadPhoto(toRequestContext(user, req), id, file, dto.isPrimary ?? false);
  }

  @Patch(':id/photos/reorder')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Reordena a galeria de fotos' })
  reorderPhotos(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: ReorderProductPhotosDto) {
    return this.productsService.reorderPhotos(toRequestContext(user, req), id, dto.photoIdsInOrder);
  }

  @Patch(':id/photos/:photoId/primary')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Define a foto principal' })
  setPrimaryPhoto(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Param('photoId') photoId: string) {
    return this.productsService.setPrimaryPhoto(toRequestContext(user, req), id, photoId);
  }

  @Delete(':id/photos/:photoId')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Exclui uma foto (Supabase Storage + banco)' })
  removePhoto(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Param('photoId') photoId: string) {
    return this.productsService.removePhoto(toRequestContext(user, req), id, photoId);
  }

  // --- Fornecedores ------------------------------------------------------------

  @Post(':id/suppliers')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Vincula um fornecedor alternativo ao produto' })
  addSupplier(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CreateProductSupplierDto) {
    return this.productsService.addSupplier(toRequestContext(user, req), id, dto);
  }

  @Patch(':id/suppliers/:productSupplierId')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Atualiza dados do vínculo produto x fornecedor (preço/prazo)' })
  updateSupplier(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Param('productSupplierId') productSupplierId: string,
    @Body() dto: UpdateProductSupplierDto,
  ) {
    return this.productsService.updateSupplier(toRequestContext(user, req), id, productSupplierId, dto);
  }

  @Delete(':id/suppliers/:productSupplierId')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Remove o vínculo com um fornecedor alternativo' })
  removeSupplier(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Param('productSupplierId') productSupplierId: string,
  ) {
    return this.productsService.removeSupplier(toRequestContext(user, req), id, productSupplierId);
  }

  // --- Catálogo de aplicações veiculares ------------------------------------------

  @Post(':id/applications')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Vincula o produto a uma versão de veículo' })
  addApplication(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CreateProductApplicationDto) {
    return this.productsService.addApplication(toRequestContext(user, req), id, dto);
  }

  @Delete(':id/applications/:applicationId')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Remove uma aplicação veicular' })
  removeApplication(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.productsService.removeApplication(toRequestContext(user, req), id, applicationId);
  }

  // --- Produtos relacionados -------------------------------------------------------

  @Post(':id/related')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Relaciona outro produto (similar/equivalente/complementar/substituto)' })
  addCrossReference(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CreateProductCrossReferenceDto) {
    return this.productsService.addCrossReference(toRequestContext(user, req), id, dto);
  }

  @Delete(':id/related/:crossReferenceId')
  @RequirePermission('products', 'update')
  @ApiOperation({ summary: 'Remove um relacionamento entre produtos' })
  removeCrossReference(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Param('crossReferenceId') crossReferenceId: string,
  ) {
    return this.productsService.removeCrossReference(toRequestContext(user, req), id, crossReferenceId);
  }

  // --- Promoções (estrutura) ---------------------------------------------------------

  @Post(':id/promotions')
  @RequirePermission('products', 'create')
  @ApiOperation({ summary: 'Cadastra uma promoção futura para o produto (estrutura — sem aplicação em vendas ainda)' })
  addPromotion(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CreateProductPromotionDto) {
    return this.productsService.addPromotion(toRequestContext(user, req), id, dto);
  }
}
