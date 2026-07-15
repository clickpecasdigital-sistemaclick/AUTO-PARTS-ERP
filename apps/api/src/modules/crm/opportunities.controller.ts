import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto, CreatePipelineStageDto, MoveOpportunityStageDto } from './dto/crm.dto';

function toRequestContext(user: AuthenticatedRequestUser, req: Request) {
  return { tenantId: user.tenantId, userId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('crm-opportunities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm')
export class OpportunitiesController {
  constructor(private readonly service: OpportunitiesService) {}

  @Get('pipeline-stages')
  @RequirePermission('crm', 'view')
  listStages(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listStages(user.tenantId);
  }

  @Post('pipeline-stages')
  @RequirePermission('crm', 'update')
  @ApiOperation({ summary: 'Cria uma etapa do funil (Pipeline configurável)' })
  createStage(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CreatePipelineStageDto) {
    return this.service.createStage(user.tenantId, dto);
  }

  @Get('board')
  @RequirePermission('crm', 'view')
  @ApiOperation({ summary: 'Quadro kanban: etapas com suas oportunidades' })
  getBoard(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getBoard(user.tenantId);
  }

  @Get('opportunities/:id')
  @RequirePermission('crm', 'view')
  findOne(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post('opportunities')
  @RequirePermission('crm', 'create')
  create(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Body() dto: CreateOpportunityDto) {
    return this.service.create(toRequestContext(user, req), dto);
  }

  @Post('opportunities/:id/move')
  @RequirePermission('crm', 'update')
  @ApiOperation({ summary: 'Move a oportunidade entre etapas do funil (drag-and-drop do kanban)' })
  move(@CurrentUser() user: AuthenticatedRequestUser, @Req() req: Request, @Param('id') id: string, @Body() dto: MoveOpportunityStageDto) {
    return this.service.moveStage(toRequestContext(user, req), id, dto.pipelineStageId);
  }

  @Post('opportunities/:id/tags/:tagId')
  @RequirePermission('crm', 'update')
  assignTag(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Param('tagId') tagId: string) {
    return this.service.assignTag(user.tenantId, id, tagId);
  }
}
