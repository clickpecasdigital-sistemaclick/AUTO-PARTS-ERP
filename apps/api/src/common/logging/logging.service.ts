import { Injectable, LoggerService } from '@nestjs/common';

export interface StructuredLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  service: string;
  version: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: { name: string; message: string; stack?: string };
  metadata?: Record<string, unknown>;
}

/**
 * StructuredLoggingService — logging estruturado (Sprint 17).
 * Formato JSON em produção para ingestão por Datadog/CloudWatch/Grafana.
 * Formato pretty em desenvolvimento para legibilidade.
 *
 * Campos obrigatórios em todo log:
 *   level, message, timestamp, service, version
 *
 * Campos de contexto (adicionados pelo interceptor de requisição):
 *   tenantId, userId, requestId, method, path, statusCode, duration
 */
@Injectable()
export class StructuredLoggingService implements LoggerService {
  private readonly isProd = process.env.NODE_ENV === 'production';
  private readonly service = 'autocore-api';
  private readonly version = process.env.APP_VERSION ?? '1.0.0';

  log(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.write({ level: 'info', message, metadata: { ...metadata, context } });
  }

  error(message: string, trace?: string, context?: string) {
    this.write({ level: 'error', message, error: trace ? { name: 'Error', message: trace } : undefined, metadata: { context } });
  }

  warn(message: string, context?: string) {
    this.write({ level: 'warn', message, metadata: { context } });
  }

  debug(message: string, context?: string) {
    if (this.isProd) return;
    this.write({ level: 'debug', message, metadata: { context } });
  }

  verbose(message: string, context?: string) {
    if (this.isProd) return;
    this.write({ level: 'debug', message, metadata: { context, verbose: true } });
  }

  /** Loga uma requisição HTTP completa com contexto de tenant/usuário. */
  logRequest(params: {
    tenantId?: string;
    userId?: string;
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    ip?: string;
    userAgent?: string;
    error?: Error;
  }) {
    const level = params.statusCode >= 500 ? 'error' : params.statusCode >= 400 ? 'warn' : 'info';
    this.write({
      level,
      message: `${params.method} ${params.path} ${params.statusCode} ${params.duration}ms`,
      tenantId: params.tenantId,
      userId: params.userId,
      requestId: params.requestId,
      method: params.method,
      path: params.path,
      statusCode: params.statusCode,
      duration: params.duration,
      error: params.error ? { name: params.error.name, message: params.error.message } : undefined,
      metadata: { ip: params.ip, userAgent: params.userAgent?.slice(0, 100) },
    });
  }

  /** Loga um evento de negócio (ex: NF-e emitida, pagamento confirmado). */
  logBusinessEvent(params: {
    tenantId: string;
    userId?: string;
    event: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    this.write({ level: 'info', message: `[${params.event}] ${params.entityType}${params.entityId ? `:${params.entityId.slice(0, 8)}` : ''}`, tenantId: params.tenantId, userId: params.userId, metadata: { event: params.event, entityType: params.entityType, entityId: params.entityId, ...params.metadata } });
  }

  /** Loga uma métrica de performance. */
  logMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'count' | 'pct', tags?: Record<string, string>) {
    this.write({ level: 'info', message: `metric:${name}=${value}${unit}`, metadata: { metric: name, value, unit, tags } });
  }

  private write(log: Partial<StructuredLog> & { level: string; message: string }) {
    const entry: StructuredLog = {
      level: log.level as StructuredLog['level'],
      message: log.message,
      timestamp: new Date().toISOString(),
      service: this.service,
      version: this.version,
      tenantId: log.tenantId,
      userId: log.userId,
      requestId: log.requestId,
      method: log.method,
      path: log.path,
      statusCode: log.statusCode,
      duration: log.duration,
      error: log.error,
      metadata: log.metadata,
    };

    // Remove undefined fields
    Object.keys(entry).forEach((k) => { if ((entry as any)[k] === undefined) delete (entry as any)[k]; });

    if (this.isProd) {
      // JSON estruturado para ingestão por sistemas de log
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      const { level, message, tenantId, userId, duration } = entry;
      const ctx = [tenantId ? `tenant=${tenantId.slice(0, 8)}` : '', userId ? `user=${userId.slice(0, 8)}` : '', duration ? `${duration}ms` : ''].filter(Boolean).join(' ');
      const levelColor = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' }[level] ?? '';
      console.log(`${levelColor}[${level.toUpperCase()}]\x1b[0m ${message}${ctx ? ` \x1b[90m(${ctx})\x1b[0m` : ''}`);
    }
  }
}

/**
 * NestJS interceptor para adicionar logging automático de todas as requisições.
 * Registra tenantId, userId, requestId, método, path, status e latência.
 */
import { NestInterceptor, ExecutionContext, CallHandler, Injectable as Inj } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import * as crypto from 'crypto';

@Inj()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const t0 = Date.now();
    const requestId = req.headers['x-request-id'] ?? crypto.randomUUID().slice(0, 8);

    return next.handle().pipe(
      tap(() => {
        this.logger.logRequest({ tenantId: req.user?.tenantId, userId: req.user?.id, requestId, method: req.method, path: req.path, statusCode: res.statusCode, duration: Date.now() - t0, ip: req.ip, userAgent: req.headers['user-agent'] });
      }),
      catchError((err) => {
        this.logger.logRequest({ tenantId: req.user?.tenantId, userId: req.user?.id, requestId, method: req.method, path: req.path, statusCode: err.status ?? 500, duration: Date.now() - t0, ip: req.ip, error: err });
        return throwError(() => err);
      }),
    );
  }
}
