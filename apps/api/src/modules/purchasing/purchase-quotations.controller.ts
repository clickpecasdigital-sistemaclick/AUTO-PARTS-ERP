import { Body, Controller, Get, Param, Post, Req, UseGuards, Query} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PurchaseQuotationsService } from './purchase-quotations.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import { AwardQuotationDto, CreateQuotationDto, SubmitQuotationResponseDto } from './dto/purchase-quotation.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('purchasing-quotations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/quotations')
export class PurchaseQuotationsController {
  constructor(
    private readonly service: PurchaseQuotationsService,
    private readonly ordersService: PurchaseOrdersService,
  ) {}

  @Get()
  @RequirePermission('purchases', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.list(user.tenantId);
  }

  @Get(':id')
  @RequirePermission('purchases', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Get(':id/compare')
  @RequirePermission('purchases', 'view')
  @ApiOperation({ summary: 'Comparativo automático entre as propostas — destaca a melhor conforme critério ponderado' })
  compare(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.compare(toRequestContext(user, req), id);
  }

  @Post()
  @RequirePermission('purchases', 'create')
  @ApiOperation({ summary: 'Abre uma cotação com um ou mais fornecedores' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Query('branchId') branchId: string, @Body() dto: CreateQuotationDto) {
    return this.service.create(toRequestContext(user, req), branchId, dto);
  }

  @Post('suppliers/:quotationSupplierId/response')
  @RequirePermission('purchases', 'update')
  @ApiOperation({ summary: 'Registra a resposta comercial de um fornecedor convidado' })
  submitResponse(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('quotationSupplierId') quotationSupplierId: string,
    @Body() dto: SubmitQuotationResponseDto,
  ) {
    return this.service.submitResponse(toRequestContext(user, req), quotationSupplierId, dto);
  }

  @Post(':id/award')
  @RequirePermission('purchases', 'approve')
  @ApiOperation({ summary: 'Adjudica a cotação à proposta vencedora' })
  award(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: AwardQuotationDto) {
    return this.service.award(toRequestContext(user, req), id, dto);
  }

  @Post(':id/generate-order')
  @RequirePermission('purchases', 'create')
  @ApiOperation({ summary: 'Gera automaticamente o Pedido de Compra a partir da cotação adjudicada' })
  generateOrder(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('quotationSupplierId') quotationSupplierId: string) {
    return this.ordersService.createFromQuotation(toRequestContext(user, req), quotationSupplierId);
  }
}
