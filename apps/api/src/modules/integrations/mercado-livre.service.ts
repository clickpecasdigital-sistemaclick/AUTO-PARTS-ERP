import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

const ML_AUTH_BASE = 'https://auth.mercadolivre.com.br/authorization';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const ML_API_BASE = 'https://api.mercadolibre.com';

/**
 * Integração com o Mercado Livre — fluxo OAuth2 Authorization Code
 * (documentação oficial: developers.mercadolivre.com.br). Esta primeira
 * entrega cobre a CONEXÃO (autorizar o app, guardar/renovar os tokens,
 * desconectar) — a base necessária para qualquer sincronização de
 * anúncios/pedidos que venha depois. Sincronização de catálogo não entra
 * aqui de propósito: cada categoria do Mercado Livre exige atributos
 * obrigatórios diferentes (ex: "Peças de carro" pede marca/modelo/ano
 * como atributos estruturados do ML, não só uma descrição livre) — mapear
 * isso direito exige testar contra o catálogo de categorias reais do ML,
 * o que só faz sentido depois que a conexão em si estiver validada.
 */
@Injectable()
export class MercadoLivreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private deriveKey(): Buffer {
    const secret = process.env.AES_256_KEY;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException('AES_256_KEY não configurada — obrigatória em produção.');
      }
      return crypto.scryptSync('dev-only-insecure-placeholder-key', 'autocore-erp-salt', 32);
    }
    return crypto.scryptSync(secret, 'autocore-erp-salt', 32);
  }

  private encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.deriveKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
  }

  private decrypt(encrypted: string): string {
    const raw = Buffer.from(encrypted, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.deriveKey(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  }

  async getStatus(tenantId: string) {
    const integration = await this.prisma.mercadoLivreIntegration.findUnique({ where: { tenantId } });
    if (!integration) return { connected: false };
    return {
      connected: integration.isActive,
      mlNickname: integration.mlNickname,
      tokenExpiresAt: integration.tokenExpiresAt,
      lastSyncAt: integration.lastSyncAt,
    };
  }

  /**
   * Passo 1: salva as credenciais do app (geradas em
   * developers.mercadolivre.com.br > Minhas aplicações) e devolve a URL
   * de autorização — o frontend deve redirecionar o usuário pra essa URL.
   */
  async startConnection(ctx: RequestContext, params: { clientId: string; clientSecret: string; redirectUri: string }) {
    await this.prisma.mercadoLivreIntegration.upsert({
      where: { tenantId: ctx.tenantId },
      create: {
        tenantId: ctx.tenantId,
        clientId: params.clientId,
        encryptedClientSecret: this.encrypt(params.clientSecret),
        redirectUri: params.redirectUri,
      },
      update: {
        clientId: params.clientId,
        encryptedClientSecret: this.encrypt(params.clientSecret),
        redirectUri: params.redirectUri,
        isActive: false, // credenciais trocadas invalidam a conexão anterior — precisa reautorizar
      },
    });

    const authUrl = new URL(ML_AUTH_BASE);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', params.clientId);
    authUrl.searchParams.set('redirect_uri', params.redirectUri);
    authUrl.searchParams.set('state', ctx.tenantId); // usado pelo callback pra identificar o tenant

    return { authUrl: authUrl.toString() };
  }

  /**
   * Passo 2: o Mercado Livre redireciona o navegador de volta pra
   * `redirectUri` com `?code=...&state=<tenantId>`. Este método troca o
   * código pelo token de acesso (chamado pelo controller, sem guard de
   * autenticação — quem prova a identidade aqui é o `code` + o
   * `client_secret`, não um JWT nosso, já que é o Mercado Livre chamando).
   */
  async handleCallback(tenantId: string, code: string) {
    const integration = await this.prisma.mercadoLivreIntegration.findUnique({ where: { tenantId } });
    if (!integration) throw new NotFoundException('Nenhuma tentativa de conexão encontrada para este tenant — inicie a conexão novamente.');

    const clientSecret = this.decrypt(integration.encryptedClientSecret);
    const tokens = await this.exchangeToken({
      grant_type: 'authorization_code',
      client_id: integration.clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: integration.redirectUri,
    });

    const me = await fetch(`${ML_API_BASE}/users/me`, { headers: { Authorization: `Bearer ${tokens.access_token}` } }).then((r) => r.json());

    await this.prisma.mercadoLivreIntegration.update({
      where: { tenantId },
      data: {
        encryptedAccessToken: this.encrypt(tokens.access_token),
        encryptedRefreshToken: this.encrypt(tokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
        mlUserId: String(tokens.user_id),
        mlNickname: me?.nickname ?? null,
        isActive: true,
      },
    });

    await this.audit.log({ tenantId, userId: null, action: 'update', entity: 'MercadoLivreIntegration', entityId: tenantId, after: { connected: true, mlNickname: me?.nickname } });
    return { connected: true, mlNickname: me?.nickname };
  }

  /** Garante um access_token válido, renovando via refresh_token se estiver vencido. Uso interno — chamado antes de qualquer chamada à API do ML. */
  async getValidAccessToken(tenantId: string): Promise<string> {
    const integration = await this.prisma.mercadoLivreIntegration.findUnique({ where: { tenantId } });
    if (!integration?.isActive || !integration.encryptedAccessToken) {
      throw new BadRequestException('Mercado Livre não conectado para este tenant.');
    }

    const expiresInMs = integration.tokenExpiresAt ? integration.tokenExpiresAt.getTime() - Date.now() : 0;
    if (expiresInMs > 60_000) {
      return this.decrypt(integration.encryptedAccessToken);
    }

    // Token vencido (ou perto de vencer) — renova antes de usar.
    const clientSecret = this.decrypt(integration.encryptedClientSecret);
    const refreshToken = this.decrypt(integration.encryptedRefreshToken!);
    const tokens = await this.exchangeToken({
      grant_type: 'refresh_token',
      client_id: integration.clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    await this.prisma.mercadoLivreIntegration.update({
      where: { tenantId },
      data: {
        encryptedAccessToken: this.encrypt(tokens.access_token),
        encryptedRefreshToken: this.encrypt(tokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  }

  private async exchangeToken(body: Record<string, string>): Promise<{ access_token: string; refresh_token: string; expires_in: number; scope: string; user_id: number }> {
    const response = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams(body),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new BadRequestException(`Mercado Livre recusou a autenticação: ${errorBody?.message ?? response.statusText}`);
    }
    return response.json();
  }

  async disconnect(ctx: RequestContext) {
    const integration = await this.prisma.mercadoLivreIntegration.findUnique({ where: { tenantId: ctx.tenantId } });
    if (!integration) throw new NotFoundException('Nenhuma conexão encontrada.');

    await this.prisma.mercadoLivreIntegration.update({
      where: { tenantId: ctx.tenantId },
      data: { isActive: false, encryptedAccessToken: null, encryptedRefreshToken: null, tokenExpiresAt: null },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'MercadoLivreIntegration', entityId: ctx.tenantId, after: { connected: false } });
    return { connected: false };
  }
}
