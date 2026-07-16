import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '@/modules/auth/auth.types';
import { MercadoLivreService } from './mercado-livre.service';

@ApiTags('integrations-mercado-livre')
@Controller('integrations/mercado-livre')
export class MercadoLivreController {
  constructor(private readonly service: MercadoLivreService) {}

  @Get('status')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('settings', 'view')
  status(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getStatus(user.tenantId);
  }

  @Post('connect')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('settings', 'update')
  @ApiOperation({ summary: 'Salva o Client ID/Secret do app criado em developers.mercadolivre.com.br e devolve a URL de autorização' })
  connect(@CurrentUser() user: AuthenticatedRequestUser, @Body() body: { clientId: string; clientSecret: string; redirectUri: string }) {
    return this.service.startConnection({ tenantId: user.tenantId, userId: user.id }, body);
  }

  @Post('disconnect')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('settings', 'update')
  disconnect(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.disconnect({ tenantId: user.tenantId, userId: user.id });
  }

  /**
   * Callback público (sem JwtAuthGuard) — é o Mercado Livre redirecionando
   * o navegador do usuário de volta pra cá, não uma chamada autenticada
   * do nosso próprio frontend. A identidade do tenant vem do `state`
   * (setado como o tenantId no passo `connect`), e a prova de legitimidade
   * é o `code` só ser trocável com o `client_secret` correto.
   */
  @Get('callback')
  @ApiOperation({ summary: 'Callback OAuth chamado pelo Mercado Livre — não chamar diretamente' })
  async callback(@Query('code') code: string, @Query('state') tenantId: string, @Res() res: Response) {
    const frontendUrl = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim();
    try {
      await this.service.handleCallback(tenantId, code);
      res.redirect(302, `${frontendUrl}/configuracoes?ml_connected=1`);
    } catch {
      res.redirect(302, `${frontendUrl}/configuracoes?ml_connected=0`);
    }
  }
}
