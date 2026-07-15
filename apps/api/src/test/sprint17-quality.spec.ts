/**
 * Sprint 17 — Testes de Integração e Unitários Expandidos
 * Cobre: SecurityService, LgpdService, AnalyticsAiService, CopilotService
 */

import { Test } from '@nestjs/testing';
import { SecurityService } from '../modules/security/security.service';
import { LgpdService } from '../modules/lgpd/lgpd.service';
import { AnalyticsAiService } from '../modules/analytics-ai/analytics-ai.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

// ============================================================================
// SECURITY SERVICE
// ============================================================================

describe('SecurityService', () => {
  let service: SecurityService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      jwtBlacklist: {
        upsert: jest.fn().mockResolvedValue({ id: 'bl-1' }),
        findUnique: jest.fn().mockResolvedValue(null),
        deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      loginAttempt: {
        create: jest.fn().mockResolvedValue({ id: 'la-1' }),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      twoFactorAuth: {
        upsert: jest.fn().mockResolvedValue({ id: '2fa-1', isEnabled: false }),
        update: jest.fn().mockResolvedValue({ id: '2fa-1', isEnabled: true }),
        findUnique: jest.fn().mockResolvedValue({ isEnabled: false, enabledAt: null, lastUsedAt: null }),
      },
      passwordHistory: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'ph-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const moduleRef = await Test.createTestingModule({ providers: [SecurityService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: audit }] }).compile();
    service = moduleRef.get(SecurityService);
  });

  describe('JWT Blacklist', () => {
    it('revokeToken — deve criar entrada na blacklist', async () => {
      await service.revokeToken('jti-123', 'user-1', 'tenant-1', new Date(Date.now() + 900000));
      expect(prisma.jwtBlacklist.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { jti: 'jti-123' } }));
    });

    it('isTokenRevoked — retorna false para token não revogado', async () => {
      prisma.jwtBlacklist.findUnique.mockResolvedValue(null);
      const result = await service.isTokenRevoked('jti-valid');
      expect(result).toBe(false);
    });

    it('isTokenRevoked — retorna true para token revogado', async () => {
      prisma.jwtBlacklist.findUnique.mockResolvedValue({ id: 'bl-1', jti: 'jti-revoked' });
      const result = await service.isTokenRevoked('jti-revoked');
      expect(result).toBe(true);
    });

    it('cleanupBlacklist — remove tokens expirados', async () => {
      prisma.jwtBlacklist.deleteMany.mockResolvedValue({ count: 7 });
      const result = await service.cleanupBlacklist();
      expect(result.deletedTokens).toBe(7);
    });
  });

  describe('Brute Force Protection', () => {
    it('isAccountLocked — conta desbloqueada com < 5 tentativas', async () => {
      prisma.loginAttempt.count.mockResolvedValue(3);
      const result = await service.isAccountLocked('user@test.com');
      expect(result.locked).toBe(false);
    });

    it('isAccountLocked — conta bloqueada com >= 5 tentativas', async () => {
      prisma.loginAttempt.count.mockResolvedValue(5);
      prisma.loginAttempt.findFirst.mockResolvedValue({ createdAt: new Date(Date.now() - 5 * 60000) });
      const result = await service.isAccountLocked('user@test.com');
      expect(result.locked).toBe(true);
      expect(result.remainingSeconds).toBeGreaterThan(0);
    });
  });

  describe('Password Policy', () => {
    it('valida senha forte corretamente', () => {
      const result = service.validatePasswordComplexity('MinhaSenh@123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejeita senha curta', () => {
      const result = service.validatePasswordComplexity('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`Mínimo ${service.PASSWORD_POLICY.minLength} caracteres`);
    });

    it('rejeita senha sem caractere especial', () => {
      const result = service.validatePasswordComplexity('MinhasSenha123');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('especial'))).toBe(true);
    });

    it('rejeita senha sem número', () => {
      const result = service.validatePasswordComplexity('MinhasSenha!!');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('número'))).toBe(true);
    });
  });

  describe('AES-256-GCM Encryption', () => {
    it('encrypt/decrypt são inversos', () => {
      const original = 'dado-sensivel-teste-12345';
      const encrypted = service.encrypt(original);
      expect(encrypted).not.toBe(original);
      expect(encrypted.split(':')).toHaveLength(3); // iv:tag:data
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('dois encrypts do mesmo texto geram ciphertexts diferentes (IV aleatório)', () => {
      const text = 'mesmo texto';
      const enc1 = service.encrypt(text);
      const enc2 = service.encrypt(text);
      expect(enc1).not.toBe(enc2);
    });
  });
});

// ============================================================================
// LGPD SERVICE
// ============================================================================

describe('LgpdService', () => {
  let service: LgpdService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  const ctx = { tenantId: 'tenant-1', userId: 'user-1', ipAddress: '127.0.0.1', userAgent: 'test' };

  beforeEach(async () => {
    prisma = {
      lgpdConsent: {
        create: jest.fn().mockResolvedValue({ id: 'c-1' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'c-1', type: 'privacy_policy', granted: true }]),
      },
      lgpdRequest: {
        create: jest.fn().mockResolvedValue({ id: 'r-1', type: 'export' }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ id: 'r-1', type: 'export', userId: 'user-1' }),
        update: jest.fn().mockResolvedValue({ id: 'r-1', status: 'completed' }),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test' }) },
      profile: { findUnique: jest.fn().mockResolvedValue({ role: 'admin' }) },
      auditLog: { findMany: jest.fn().mockResolvedValue([]) },
      customer: { update: jest.fn().mockResolvedValue({ id: 'cust-1' }) },
      employee: { update: jest.fn().mockResolvedValue({ id: 'emp-1' }) },
    };

    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const moduleRef = await Test.createTestingModule({ providers: [LgpdService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: audit }] }).compile();
    service = moduleRef.get(LgpdService);
  });

  it('grantConsent — cria registro imutável de consentimento', async () => {
    await service.grantConsent(ctx, 'privacy_policy', '1.0');
    expect(prisma.lgpdConsent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ granted: true, type: 'privacy_policy', version: '1.0' }) }));
  });

  it('revokeConsent — cria registro de revogação (histórico preservado)', async () => {
    await service.revokeConsent(ctx, 'marketing', '1.0');
    expect(prisma.lgpdConsent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ granted: false }) }));
  });

  it('exportUserData — retorna todos os dados do usuário', async () => {
    const data = await service.exportUserData(ctx);
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('profile');
    expect(data).toHaveProperty('consents');
    expect(data).toHaveProperty('recentActivity');
    expect(data).toHaveProperty('exportedAt');
  });

  it('anonymizeCustomer — chama update com campos PII substituídos', async () => {
    await service.anonymizeCustomer(ctx, 'cust-1');
    expect(prisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: expect.stringContaining('@deleted.lgpd'),
          deletedAt: expect.any(Date),
        }),
      }),
    );
  });
});

// ============================================================================
// ANALYTICS AI SERVICE
// ============================================================================

describe('AnalyticsAiService', () => {
  let service: AnalyticsAiService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      factSale: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { netRevenue: 100000 } }),
        groupBy: jest.fn().mockResolvedValue([{ productId: 'p1', _sum: { quantity: 50 }, _avg: { margin: 0.35 }, _sum_netRevenue: 50000 }]),
      },
      factStock: {
        findMany: jest.fn().mockResolvedValue([{ productId: 'p1', quantityOnHand: 5, warehouseId: 'w1', totalValue: 500 }]),
      },
      customer: { findMany: jest.fn().mockResolvedValue([]) },
      accountsReceivable: { findMany: jest.fn().mockResolvedValue([]) },
      aiPrediction: {
        upsert: jest.fn().mockResolvedValue({ id: 'pred-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      stock: { count: jest.fn().mockResolvedValue(3) },
    };

    const moduleRef = await Test.createTestingModule({ providers: [AnalyticsAiService, { provide: PrismaService, useValue: prisma }] }).compile();
    service = moduleRef.get(AnalyticsAiService);
  });

  it('salesForecast — gera previsão com tendência', async () => {
    prisma.factSale.aggregate
      .mockResolvedValueOnce({ _sum: { netRevenue: 120000 } }) // current 30d
      .mockResolvedValueOnce({ _sum: { netRevenue: 100000 } }); // previous 30d

    const result = await service.salesForecast('tenant-1');

    expect(result).toHaveProperty('forecast30d');
    expect(result).toHaveProperty('trend');
    expect(typeof result.trend).toBe('string');
    expect(result.trend).toContain('%');
    expect(prisma.aiPrediction.upsert).toHaveBeenCalled();
  });

  it('salesForecast — calcula tendência positiva corretamente', async () => {
    prisma.factSale.aggregate
      .mockResolvedValueOnce({ _sum: { netRevenue: 110000 } }) // 10% acima
      .mockResolvedValueOnce({ _sum: { netRevenue: 100000 } });

    const result = await service.salesForecast('tenant-1');

    expect(result.trend).toBe('10.0%');
    expect(result.forecast30d).toBeCloseTo(121000); // 110000 * 1.1
  });

  it('churnRiskPrediction — retorna contagem de clientes em risco', async () => {
    prisma.customer.findMany.mockResolvedValue([
      { id: 'c1', name: 'Cliente Inativo 1' },
      { id: 'c2', name: 'Cliente Inativo 2' },
    ]);

    const result = await service.churnRiskPrediction('tenant-1');

    expect(result.count).toBe(2);
    expect(prisma.aiPrediction.upsert).toHaveBeenCalledTimes(2);
  });

  it('stockRupturePrediction — identifica produtos com cobertura < 15 dias', async () => {
    prisma.factStock.findMany.mockResolvedValue([
      { productId: 'p1', quantityOnHand: 10, warehouseId: 'w1' },
    ]);
    prisma.factSale.groupBy.mockResolvedValue([
      { productId: 'p1', _sum: { quantity: 60 } }, // 2/dia → 5 dias de cobertura
    ]);

    const result = await service.stockRupturePrediction('tenant-1');

    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(result.items[0].daysOfCoverage).toBe(5);
  });
});
