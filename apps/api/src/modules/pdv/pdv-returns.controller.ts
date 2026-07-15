import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PdvReturnsService, type ReturnItemInput } from './pdv-returns.service';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('pdv-returns')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pdv/returns')
export class PdvReturnsController {
  constructor(private readonly service: PdvReturnsService) {}

  @Get()
  @RequirePermission('sales', 'view')
  findAll(@CurrentUser() user: AuthenticatedRequestUser, @Query('saleId') saleId?: string) {
    return this.service.findAll(user.tenantId, saleId);
  }

  @Post('sales/:saleId')
  @RequirePermission('sales', 'create')
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Param('saleId') saleId: string,
    @Body() data: { type: 'partial' | 'total' | 'exchange'; reason: string; items: ReturnItemInput[] },
  ) {
    return this.service.create(toRequestContext(user, req), saleId, data);
  }

  @Post(':id/approve')
  @RequirePermission('sales', 'approve')
  approve(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('issueCredit') issueCredit: boolean) {
    return this.service.approve(toRequestContext(user, req), id, !!issueCredit);
  }

  @Post(':id/reject')
  @RequirePermission('sales', 'update')
  reject(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body('reason') reason: string) {
    return this.service.reject(toRequestContext(user, req), id, reason);
  }
}
