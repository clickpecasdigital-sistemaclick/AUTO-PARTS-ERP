import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { PurchaseApprovalsService } from './purchase-approvals.service';
import { CreateApprovalRuleDto, DecideApprovalDto } from './dto/purchase-approval.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('purchasing-approvals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing/approvals')
export class PurchaseApprovalsController {
  constructor(private readonly service: PurchaseApprovalsService) {}

  @Get('history')
  @RequirePermission('purchases', 'view')
  getHistory(@CurrentUser() user: AuthenticatedRequestUser, @Query('purchaseRequestId') purchaseRequestId?: string, @Query('purchaseOrderId') purchaseOrderId?: string) {
    return this.service.getHistory(user.tenantId, { purchaseRequestId, purchaseOrderId });
  }

  @Post(':id/decide')
  @RequirePermission('purchases', 'approve')
  @ApiOperation({ summary: 'Aprova ou rejeita uma etapa do fluxo' })
  decide(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: DecideApprovalDto) {
    return this.service.decide(toRequestContext(user, req), id, user.role, dto);
  }

  @Get('rules')
  @RequirePermission('purchases', 'view')
  listRules(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listRules(user.tenantId);
  }

  @Post('rules')
  @RequirePermission('purchases', 'update')
  @ApiOperation({ summary: 'Configura uma regra de aprovação (por valor e/ou departamento)' })
  createRule(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CreateApprovalRuleDto) {
    return this.service.createRule(user.tenantId, dto);
  }
}
