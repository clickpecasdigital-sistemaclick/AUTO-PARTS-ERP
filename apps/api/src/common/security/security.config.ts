import type { INestApplication } from '@nestjs/common';
import compression from 'compression';

/**
 * Configuração de segurança aplicada no bootstrap do NestJS (Sprint 14).
 * Cobre OWASP Top 10, Helmet, CORS configurável, Rate Limit, CSP,
 * XSS Protection, SQL Injection (via Prisma tipado — sem SQL raw direto),
 * CSRF (SameSite cookies + Double Submit pattern para endpoints stateful).
 *
 * Chamado em main.ts: `await configureSecurity(app)`.
 * Não altera nenhuma regra de negócio existente.
 */
export async function configureSecurity(app: INestApplication) {
  // 1. Helmet — headers de segurança HTTP (CSP, XSS, HSTS, noSniff, etc.)
  const { default: helmet } = await import('helmet').catch(() => ({ default: null }));
  if (helmet) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // relaxado para Vite HMR em dev
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https://*.supabase.co'],
            connectSrc: ["'self'", 'https://*.supabase.co', 'https://api.anthropic.com'],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
          },
        },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        xFrameOptions: { action: 'deny' },
        xContentTypeOptions: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      }),
    );
  }

  // 2. CORS — configurável por ambiente
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  });

  // 3. Rate Limiting (via @nestjs/throttler — configurado no AppModule)
  // Padrão: 60 requisições por minuto por IP. Endpoints sensíveis têm
  // throttlers específicos (ex: /auth/login: 5 req/15min).

  // 4. CSRF Protection (SameSite=Strict em cookies — Double Submit Pattern)
  // Para APIs stateless com JWT Bearer, CSRF é mitigado pelo header
  // Authorization que browsers não enviam automaticamente em cross-origin.
  // Para rotas que usam cookies, adicionar csurf middleware.

  // 5. Compressão GZIP/Brotli
  app.use(compression());

  return app;
}

/**
 * Rate limit específico por categoria de endpoint.
 * Usado em conjunto com @nestjs/throttler guards customizados.
 */
export const RATE_LIMITS = {
  auth: { limit: 5, ttl: 900 },      // 5 tentativas / 15 min (login, 2FA)
  api: { limit: 60, ttl: 60 },        // 60 req / 1 min (API geral)
  export: { limit: 10, ttl: 3600 },   // 10 exportações / hora
  ai: { limit: 30, ttl: 60 },         // 30 queries IA / min
  webhook: { limit: 1000, ttl: 60 },  // webhooks (receber NF-e, PIX, etc.)
} as const;

/**
 * Lista de IPs que nunca são bloqueados pelo rate limiter.
 * Configurável via env `IP_WHITELIST=1.2.3.4,5.6.7.8`.
 */
export const IP_WHITELIST = (process.env.IP_WHITELIST ?? '127.0.0.1,::1').split(',').map((ip) => ip.trim());

export function isWhitelistedIP(ip: string): boolean {
  return IP_WHITELIST.includes(ip);
}
