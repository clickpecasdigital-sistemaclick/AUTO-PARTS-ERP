import { Body, Controller, Get, Param, ParseEnumPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PurchaseSuggestionStatus } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PurchaseSuggestionsService } from './purchase-suggestions.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('purchasing-suggestions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/suggestions')
export class PurchaseSuggestionsController {
  constructor(private readonly service: PurchaseSuggestionsService) {}

  @Get()
  @RequirePermission('purchases', 'view')
  list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('status', new ParseEnumPipe(PurchaseSuggestionStatus, { optional: true })) status?: PurchaseSuggestionStatus,
  ) {
    return this.service.list(user.tenantId, status);
  }

  @Post('generate')
  @RequirePermission('purchases', 'create')
  @ApiOperation({ summary: 'Roda o algoritmo de reposição automática para um depósito' })
  generate(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body('warehouseId') warehouseId: string) {
    return this.service.generateSuggestions(toRequestContext(user, req), warehouseId);
  }

  @Post(':id/dismiss')
  @RequirePermission('purchases', 'update')
  dismiss(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.dismiss(user.tenantId, id);
  }
}
