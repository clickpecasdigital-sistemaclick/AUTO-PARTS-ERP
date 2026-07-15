import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PdvCartService } from './pdv-cart.service';
import { PdvCheckoutService } from './pdv-checkout.service';
import { PdvPrintService } from './pdv-print.service';
import {
  AddCartItemDto,
  CheckoutCartDto,
  OpenCartDto,
  SetCartCustomerDto,
  SetCartDiscountDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

/**
 * Carrinho/Venda do PDV. "Alterar preço" (briefing) → ação `update`;
 * "Conceder desconto" → `update` (a regra de limite vem de
 * `DiscountRule`, checada em `PdvDiscountService`, não do RBAC); "Cancelar
 * venda" → `cancel`; "Estornar venda" → `approve` (decisão sensível,
 * mesmo nível de confiança de uma aprovação).
 */
@ApiTags('pdv-cart')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pdv/carts')
export class PdvCartController {
  constructor(
    private readonly cartService: PdvCartService,
    private readonly checkoutService: PdvCheckoutService,
    private readonly printService: PdvPrintService,
  ) {}

  @Get('payment-methods')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Lista as formas de pagamento ativas (dinheiro, PIX, cartões, crediário, vale...)' })
  listPaymentMethods(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.cartService.listPaymentMethods(user.tenantId);
  }

  @Get(':id')
  @RequirePermission('sales', 'view')
  getCart(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.cartService.getCart(toRequestContext(user, req), id);
  }

  @Get('availability/:productId/:warehouseId')
  @RequirePermission('sales', 'view')
  @ApiOperation({ summary: 'Disponibilidade em tempo real do produto no depósito informado' })
  checkAvailability(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string) {
    return this.cartService.checkAvailability(productId, warehouseId);
  }

  @Post()
  @RequirePermission('sales', 'create')
  @ApiOperation({ summary: 'Abre um carrinho (= Sale com status open) no modo de operação escolhido' })
  openCart(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('branchId') branchId: string, @Body() dto: OpenCartDto) {
    return this.cartService.openCart(toRequestContext(user, req), branchId, dto);
  }

  @Post(':id/items')
  @RequirePermission('sales', 'update')
  addItem(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(toRequestContext(user, req), id, dto);
  }

  @Put(':id/items/:itemId')
  @RequirePermission('sales', 'update')
  updateItem(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(toRequestContext(user, req), id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @RequirePermission('sales', 'update')
  removeItem(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(toRequestContext(user, req), id, itemId);
  }

  @Put(':id/customer')
  @RequirePermission('sales', 'update')
  setCustomer(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: SetCartCustomerDto) {
    return this.cartService.setCustomer(toRequestContext(user, req), id, dto);
  }

  @Put(':id/discount')
  @RequirePermission('sales', 'update')
  @ApiOperation({ summary: 'Desconto no nível da venda — validado contra DiscountRule' })
  setDiscount(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: SetCartDiscountDto) {
    return this.cartService.setDiscount(toRequestContext(user, req), id, dto);
  }

  @Post(':id/checkout')
  @RequirePermission('sales', 'update')
  @ApiOperation({ summary: 'Finaliza a venda: pagamento(s), baixa de estoque, financeiro e comissão' })
  checkout(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: CheckoutCartDto) {
    return this.checkoutService.checkout(toRequestContext(user, req), id, dto);
  }

  @Post(':id/cancel')
  @RequirePermission('sales', 'cancel')
  cancel(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('reason') reason: string) {
    return this.checkoutService.cancel(toRequestContext(user, req), id, reason);
  }

  @Post(':id/refund')
  @RequirePermission('sales', 'approve')
  @ApiOperation({ summary: 'Estorna uma venda já paga (devolve estoque integralmente)' })
  refund(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('reason') reason: string) {
    return this.checkoutService.refund(toRequestContext(user, req), id, reason);
  }

  @Get(':id/print')
  @RequirePermission('sales', 'print')
  @ApiOperation({ summary: 'Gera o cupom não fiscal (térmico ou A4) em PDF' })
  async print(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Query('format') format: 'thermal' | 'a4' = 'thermal', @Res() res: Response) {
    const buffer = await this.printService.generateReceipt(user.tenantId, id, format);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="cupom-${id}.pdf"` });
    return res.send(buffer);
  }
}
