import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { QueryAuditLogDto } from './dto/query-audit-log.dto';
import type { Prisma } from '@prisma/client';

/**
 * Lado de LEITURA da auditoria — o `AuditService` (common/audit) só
 * escreve; até esta revisão não existia nenhum jeito de VER o que foi
 * gravado, mesmo com dezenas de módulos já chamando `audit.log()` em
 * toda alteração. Este serviço não duplica a gravação, só consulta.
 */
@Injectable()
export class AuditQueryService {
  constructor(private readonly prisma: PrismaService) {}

  private looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
  }

  private buildWhere(tenantId: string, query: QueryAuditLogDto): Prisma.AuditLogWhereInput {
    return {
      tenantId,
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.action ? { action: query.action as never } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { entity: { contains: query.search, mode: 'insensitive' } },
              ...(this.looksLikeUuid(query.search) ? [{ entityId: query.search }] : []),
            ],
          }
        : {}),
    };
  }

  async findAll(tenantId: string, query: QueryAuditLogDto) {
    const where = this.buildWhere(tenantId, query);
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 50;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  /** Lista de entidades distintas já auditadas — alimenta o filtro "Módulo" na tela. */
  async listEntities(tenantId: string) {
    const rows = await this.prisma.auditLog.findMany({ where: { tenantId }, select: { entity: true }, distinct: ['entity'] });
    return rows.map((r) => r.entity).sort();
  }

  /** Exportação CSV — mesmos filtros da listagem, sem paginação (limitado a 5000 linhas por chamada). */
  async exportCsv(tenantId: string, query: QueryAuditLogDto): Promise<string> {
    const where = this.buildWhere(tenantId, query);
    const rows = await this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const header = 'Data,Usuário,Ação,Módulo,ID do registro,IP\n';
    const lines = rows.map((r) =>
      [
        r.createdAt.toISOString(),
        (r.user?.fullName ?? r.user?.email ?? 'Sistema').replace(/,/g, ' '),
        r.action,
        r.entity,
        r.entityId ?? '',
        r.ipAddress ?? '',
      ].join(','),
    );
    return header + lines.join('\n');
  }
}
