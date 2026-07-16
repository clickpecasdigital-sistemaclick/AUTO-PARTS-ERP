import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { WorkspaceService } from './workspace.service';

@ApiTags('workspace')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly service: WorkspaceService) {}

  @Get()
  @ApiOperation({ summary: 'Empresas e filiais do tenant logado — chamado uma vez após o login para popular o seletor de contexto' })
  get(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getWorkspace(user.tenantId);
  }
}
