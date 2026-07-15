import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    supabase: ServiceHealth;
    redis: ServiceHealth;
    storage: ServiceHealth;
  };
  metrics: {
    memoryUsageMb: number;
    memoryUsagePct: number;
    heapUsedMb: number;
    cpuUser: number;
    cpuSystem: number;
  };
}

/**
 * HealthService — health checks completos (briefing: Status do Banco,
 * API, Supabase, Storage, Redis, Filas). Usado pelo endpoint público
 * `/health` (monitoramento externo) e pelo painel operacional interno.
 */
@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<SystemHealth> {
    const [database, supabase, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkSupabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    const services = { database, supabase, redis, storage };
    const anyDown = Object.values(services).some((s) => s.status === 'down');
    const anyDegraded = Object.values(services).some((s) => s.status === 'degraded');

    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      status: anyDown ? 'down' : anyDegraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? '1.0.0',
      uptime: Math.round((Date.now() - this.startedAt) / 1000),
      services,
      metrics: {
        memoryUsageMb: Math.round(memUsage.rss / 1048576),
        memoryUsagePct: Math.round((memUsage.rss / (os_totalmem())) * 100),
        heapUsedMb: Math.round(memUsage.heapUsed / 1048576),
        cpuUser: cpuUsage.user,
        cpuSystem: cpuUsage.system,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const t0 = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - t0 };
    } catch (e) {
      return { status: 'down', message: e instanceof Error ? e.message : 'Database unreachable' };
    }
  }

  private async checkSupabase(): Promise<ServiceHealth> {
    const url = process.env.SUPABASE_URL;
    if (!url) return { status: 'degraded', message: 'SUPABASE_URL not configured' };
    const t0 = Date.now();
    try {
      const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: process.env.SUPABASE_SERVICE_KEY ?? '' }, signal: AbortSignal.timeout(5000) });
      return { status: response.ok ? 'ok' : 'degraded', latencyMs: Date.now() - t0 };
    } catch {
      return { status: 'degraded', message: 'Supabase unreachable', latencyMs: Date.now() - t0 };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return { status: 'degraded', message: 'REDIS_URL not configured — cache disabled' };
    // Verificação real requer ioredis — estrutura pronta, conexão na integração
    return { status: 'degraded', message: 'Redis connection requires ioredis package in production' };
  }

  private async checkStorage(): Promise<ServiceHealth> {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) return { status: 'degraded', message: 'Storage credentials not configured' };
    const t0 = Date.now();
    try {
      const response = await fetch(`${url}/storage/v1/bucket`, { headers: { Authorization: `Bearer ${key}`, apikey: key }, signal: AbortSignal.timeout(5000) });
      return { status: response.ok ? 'ok' : 'degraded', latencyMs: Date.now() - t0 };
    } catch {
      return { status: 'degraded', message: 'Storage unreachable', latencyMs: Date.now() - t0 };
    }
  }

  async getLiveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async getReadiness() {
    const db = await this.checkDatabase();
    return { status: db.status === 'ok' ? 'ok' : 'not_ready', database: db.status };
  }

  async getMetrics() {
    const health = await this.getHealth();
    const [tenantCount, userCount, auditLastHour] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 3600000) } } }),
    ]);
    return { ...health, business: { tenants: tenantCount, users: userCount, auditEventsLastHour: auditLastHour } };
  }
}

import { totalmem } from 'os';

function os_totalmem() {
  try { return totalmem(); } catch { return 4 * 1024 * 1024 * 1024; }
}
