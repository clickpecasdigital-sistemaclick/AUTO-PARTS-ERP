import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogParams {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Serviço único de auditoria (tabela `audit_logs`, Sprint 02). Todo módulo
 * de negócio que cria/edita/exclui um registro deve chamar `log()` — nunca
 * escrever em `audit_logs` diretamente via Prisma, para manter o formato
 * (before/after, ação, entidade) consistente em todo o sistema.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId ?? null,
        action: params.action as AuditAction,
        entity: params.entity,
        entityId: params.entityId ?? null,
        before: params.before === undefined ? undefined : (params.before as object),
        after: params.after === undefined ? undefined : (params.after as object),
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }
}
