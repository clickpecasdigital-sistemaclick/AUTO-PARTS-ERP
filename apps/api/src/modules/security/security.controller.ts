import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { SecurityService } from './security.service';

function toCtx(u: AuthenticatedRequestUser, req: Request) {
  return { tenantId: u.tenantId, userId: u.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('security')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly security: SecurityService) {}

  @Get('policy')
  @ApiOperation({ summary: 'Password policy da plataforma' })
  getPolicy() { return this.security.PASSWORD_POLICY; }

  @Post('2fa/setup')
  @ApiOperation({ summary: 'Iniciar configuração 2FA (TOTP)' })
  setup2FA(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request) {
    return this.security.setup2FA(toCtx(u, req));
  }

  @Post('2fa/enable')
  @ApiOperation({ summary: 'Habilitar 2FA após verificar código TOTP' })
  enable2FA(@CurrentUser() u: AuthenticatedRequestUser, @Req() req: Request, @Body('code') code: string) {
    return this.security.verify2FA(toCtx(u, req), code).then(async (ok) => { if (ok) return this.security.enable2FA(toCtx(u, req)); return { error: 'Código inválido' }; });
  }

  @Get('2fa/status')
  get2FAStatus(@CurrentUser() u: AuthenticatedRequestUser) {
    return this.security.get2FAStatus(u.id);
  }

  @Post('validate-password')
  @ApiOperation({ summary: 'Validar complexidade de senha (sem autenticação)' })
  validatePassword(@Body('password') password: string) {
    return this.security.validatePasswordComplexity(password ?? '');
  }
}
