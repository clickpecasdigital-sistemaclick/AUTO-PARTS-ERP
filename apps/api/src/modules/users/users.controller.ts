import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { UsersService } from './users.service';

class InviteUserDto {
  @IsEmail() email!: string;
  @IsString() fullName!: string;
  @IsEnum(UserRole) role!: UserRole;
}

class UpdateRoleDto {
  @IsEnum(UserRole) role!: UserRole;
}

function toCtx(user: AuthenticatedRequestUser) {
  return { tenantId: user.tenantId, userId: user.id };
}

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @RequirePermission('employees', 'view')
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.list(user.tenantId);
  }

  @Post('invite')
  @RequirePermission('employees', 'create')
  @ApiOperation({ summary: 'Convida um novo usuário por e-mail, já com empresa e papel definidos' })
  invite(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: InviteUserDto) {
    return this.service.invite(toCtx(user), dto);
  }

  @Put(':id/role')
  @RequirePermission('employees', 'update')
  updateRole(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.service.updateRole(toCtx(user), id, dto.role);
  }

  @Delete(':id')
  @RequirePermission('employees', 'delete')
  @ApiOperation({ summary: 'Desativa o acesso do usuário (não deleta o histórico)' })
  deactivate(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.deactivate(toCtx(user), id);
  }
}
