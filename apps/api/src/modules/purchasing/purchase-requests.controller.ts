import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PurchaseRequestsService } from './purchase-requests.service';
import { CreatePurchaseRequestDto, QueryPurchaseRequestDto } from './dto/purchase-request.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('purchasing-requests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/requests')
export class PurchaseRequestsController {
  constructor(private readonly service: PurchaseRequestsService) {}

  @Get()
  @RequirePermission('purchases', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Query() query: QueryPurchaseRequestDto) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermission('purchases', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string) {
    return this.service.findOne(toRequestContext(user, req), id);
  }

  @Post()
  @RequirePermission('purchases', 'create')
  @ApiOperation({ summary: 'Cria uma Solicitação de Compra (a "Necessidade" que inicia o ciclo)' })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('branchId') branchId: string, @Body() dto: CreatePurchaseRequestDto) {
    return this.service.create(toRequestContext(user, req), branchId, dto);
  }

  @Post(':id/submit')
  @RequirePermission('purchases', 'create')
  @ApiOperation({ summary: 'Submete a solicitação para aprovação (ou aprova automaticamente se nenhuma regra se aplicar)' })
  submit(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('estimatedValue') estimatedValue: number) {
    return this.service.submitForApproval(toRequestContext(user, req), id, estimatedValue);
  }
}
