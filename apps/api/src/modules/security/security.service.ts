import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import * as crypto from 'crypto';
import { generateSecret, generateURI, verify as verifyOtp } from 'otplib';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Deriva uma chave AES-256 (32 bytes) a partir do segredo em `AES_256_KEY`,
 * independente do tamanho/encoding original da string de entrada.
 *
 * `Buffer.from(secret, 'utf8').slice(0, 32)` (implementação anterior) é
 * inseguro: se o segredo tiver menos de 32 bytes — como o valor real usado
 * em produção neste projeto, `autocoreerp2026key!!` (20 bytes) — a chave
 * fica curta e `crypto.createCipheriv('aes-256-gcm', ...)` lança
 * `Invalid key length` em runtime. Usar um KDF (scrypt) garante sempre
 * 32 bytes determinísticos, e falha explícita se o segredo não existir
 * em produção, em vez de cair silenciosamente num valor placeholder.
 */
function deriveAesKey(): Buffer {
  const secret = process.env.AES_256_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException('AES_256_KEY não configurada — obrigatória em produção.');
    }
    return crypto.scryptSync('dev-only-insecure-placeholder-key', 'autocore-erp-salt', 32);
  }
  return crypto.scryptSync(secret, 'autocore-erp-salt', 32);
}

/**
 * SecurityService — camada de segurança transversal (Sprint 14).
 *
 * Responsabilidades:
 *   — JWT Blacklist (revogação de tokens)
 *   — Refresh Token Rotation com detecção de reutilização
 *   — Brute Force Protection (janela deslizante 15 min / 5 tentativas)
 *   — 2FA estrutura (TOTP, geração de secret + backup codes)
 *   — Password Policy (histórico, complexidade, expiração)
 *   — Criptografia AES-256-GCM para dados sensíveis
 *
 * Integra-se ao AuthModule sem alterar nenhuma regra de negócio existente
 * (adições, não substituições — PROIBIDO alterar Sprints anteriores).
 */
@Injectable()
export class SecurityService {
  private readonly AES_KEY = deriveAesKey();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---- JWT BLACKLIST -------------------------------------------------------

  async revokeToken(jti: string, userId: string, tenantId: string, expiresAt: Date, reason = 'logout') {
    await this.prisma.jwtBlacklist.upsert({
      where: { jti },
      create: { jti, userId, tenantId, reason, expiresAt },
      update: { reason },
    });
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    const entry = await this.prisma.jwtBlacklist.findUnique({ where: { jti } });
    return !!entry;
  }

  /** Housekeeping — remove tokens expirados (rodar como cron diário). */
  async cleanupBlacklist() {
    const { count } = await this.prisma.jwtBlacklist.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return { deletedTokens: count };
  }

  // ---- REFRESH TOKEN ROTATION ---------------------------------------------

  async createRefreshToken(userId: string, tenantId: string, deviceInfo?: string, ipAddress?: string): Promise<{ token: string; expiresAt: Date }> {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 dias

    await this.prisma.refreshToken.create({ data: { tokenHash, userId, tenantId, familyId, deviceInfo, ipAddress, expiresAt } });
    return { token, expiresAt };
  }

  async rotateRefreshToken(rawToken: string, ipAddress?: string): Promise<{ newToken: string; expiresAt: Date } | null> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) return null;

    // Detecção de reutilização — revoga toda a família
    if (stored.isRevoked) {
      await this.prisma.refreshToken.updateMany({ where: { familyId: stored.familyId }, data: { isRevoked: true } });
      await this.audit.log({ tenantId: stored.tenantId, userId: stored.userId, action: 'sensitive_data_view', entity: 'RefreshToken', entityId: stored.id, after: { event: 'token_reuse_detected_family_revoked' } });
      return null;
    }

    if (stored.expiresAt < new Date()) return null;

    // Revogar o token atual
    await this.prisma.refreshToken.update({ where: { tokenHash }, data: { isRevoked: true, lastUsedAt: new Date() } });

    // Emitir novo token na mesma família
    const newToken = crypto.randomBytes(64).toString('hex');
    const newHash = crypto.createHash('sha256').update(newToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    await this.prisma.refreshToken.create({ data: { tokenHash: newHash, userId: stored.userId, tenantId: stored.tenantId, familyId: stored.familyId, ipAddress, expiresAt } });
    return { newToken, expiresAt };
  }

  // ---- BRUTE FORCE PROTECTION ---------------------------------------------

  async recordLoginAttempt(identifier: string, ipAddress: string, success: boolean, reason?: string) {
    await this.prisma.loginAttempt.create({ data: { identifier, ipAddress, success, reason } });
  }

  async isAccountLocked(identifier: string): Promise<{ locked: boolean; remainingSeconds?: number }> {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000); // janela 15 min
    const failures = await this.prisma.loginAttempt.count({ where: { identifier, success: false, createdAt: { gte: windowStart } } });

    if (failures >= 5) {
      const oldestFailure = await this.prisma.loginAttempt.findFirst({ where: { identifier, success: false, createdAt: { gte: windowStart } }, orderBy: { createdAt: 'asc' } });
      const unlockAt = new Date((oldestFailure?.createdAt.getTime() ?? 0) + 15 * 60 * 1000);
      const remainingSeconds = Math.ceil((unlockAt.getTime() - Date.now()) / 1000);
      return { locked: true, remainingSeconds: Math.max(0, remainingSeconds) };
    }

    return { locked: false };
  }

  async getIpAttempts(ipAddress: string): Promise<number> {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);
    return this.prisma.loginAttempt.count({ where: { ipAddress, success: false, createdAt: { gte: windowStart } } });
  }

  // ---- 2FA STRUCTURE (TOTP) -----------------------------------------------

  async setup2FA(ctx: RequestContext): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    // otplib exige o secret em base32 — `randomBytes().toString('base64')` (implementação
    // anterior) gerava um secret em base64, incompatível com apps TOTP (Google Authenticator etc.).
    const secret = generateSecret();
    const encryptedSecret = this.encrypt(secret);
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
    const backupHashes = backupCodes.map((c) => crypto.createHash('sha256').update(c).digest('hex'));

    await this.prisma.twoFactorAuth.upsert({
      where: { userId: ctx.userId },
      create: { userId: ctx.userId, tenantId: ctx.tenantId, secret: encryptedSecret, backupCodes: backupHashes, isEnabled: false },
      update: { secret: encryptedSecret, backupCodes: backupHashes, isEnabled: false },
    });

    const qrCodeUrl = generateURI({ issuer: 'Auto Parts ERP', label: ctx.userId ?? 'usuario', secret });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'TwoFactorAuth', entityId: ctx.userId, after: { event: '2fa_setup_initiated' } });

    return { secret, qrCodeUrl, backupCodes };
  }

  async verify2FA(ctx: RequestContext, code: string): Promise<boolean> {
    const tfa = await this.prisma.twoFactorAuth.findUnique({ where: { userId: ctx.userId } });
    if (!tfa || !tfa.secret) throw new UnauthorizedException('2FA não configurado');

    const secret = this.decrypt(tfa.secret);
    const { valid: isValidTotp } = await verifyOtp({ secret, token: code });
    if (isValidTotp) return true;

    // Fallback: código de backup (uso único — remove o código da lista ao aceitar).
    const codeHash = crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
    const backupCodes = (tfa.backupCodes ?? []) as string[];
    const matchIndex = backupCodes.indexOf(codeHash);
    if (matchIndex === -1) return false;

    const remaining = [...backupCodes.slice(0, matchIndex), ...backupCodes.slice(matchIndex + 1)];
    await this.prisma.twoFactorAuth.update({ where: { userId: ctx.userId }, data: { backupCodes: remaining, lastUsedAt: new Date() } });
    return true;
  }

  async enable2FA(ctx: RequestContext) {
    await this.prisma.twoFactorAuth.update({ where: { userId: ctx.userId }, data: { isEnabled: true, enabledAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'TwoFactorAuth', entityId: ctx.userId, after: { event: '2fa_enabled' } });
  }

  get2FAStatus(userId: string) {
    return this.prisma.twoFactorAuth.findUnique({ where: { userId }, select: { isEnabled: true, enabledAt: true, lastUsedAt: true } });
  }

  // ---- PASSWORD POLICY -----------------------------------------------------

  readonly PASSWORD_POLICY = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
    historyCount: 10, // não pode reutilizar as últimas 10 senhas
    expiryDays: 90,   // expira em 90 dias
  };

  validatePasswordComplexity(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < this.PASSWORD_POLICY.minLength) errors.push(`Mínimo ${this.PASSWORD_POLICY.minLength} caracteres`);
    if (this.PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) errors.push('Pelo menos uma letra maiúscula');
    if (this.PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) errors.push('Pelo menos uma letra minúscula');
    if (this.PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) errors.push('Pelo menos um número');
    if (this.PASSWORD_POLICY.requireSpecial && !/[^A-Za-z0-9]/.test(password)) errors.push('Pelo menos um caractere especial');
    return { valid: errors.length === 0, errors };
  }

  async isPasswordInHistory(userId: string, tenantId: string, newPasswordHash: string): Promise<boolean> {
    const history = await this.prisma.passwordHistory.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: this.PASSWORD_POLICY.historyCount,
      select: { passwordHash: true },
    });
    return history.some((h: { passwordHash: string }) => h.passwordHash === newPasswordHash);
  }

  async addPasswordToHistory(userId: string, tenantId: string, passwordHash: string) {
    await this.prisma.passwordHistory.create({ data: { userId, tenantId, passwordHash } });
    // Mantém apenas os últimos N registros (limpeza)
    const old = await this.prisma.passwordHistory.findMany({ where: { userId, tenantId }, orderBy: { createdAt: 'desc' }, skip: this.PASSWORD_POLICY.historyCount });
    if (old.length > 0) {
      await this.prisma.passwordHistory.deleteMany({ where: { id: { in: old.map((o: { id: string }) => o.id) } } });
    }
  }

  // ---- CRIPTOGRAFIA AES-256-GCM -------------------------------------------

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.AES_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.AES_KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
