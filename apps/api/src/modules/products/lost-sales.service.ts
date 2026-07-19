import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { CreateLostSaleDto } from './dto/lost-sale.dto';
import type { RequestContext } from '@/common/types/request-context';

/** Vendas Perdidas — o que o cliente queria e não conseguimos vender, e por quê. Alimenta decisão de compra. */
@Injectable()
export class LostSalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string) {
    return this.prisma.lostSale.findMany({
      where: { tenantId },
      include: {
        customer: { select: { name: true } },
        product: { select: { internalCode: true, shortDescription: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async create(ctx: RequestContext, branchId: string, dto: CreateLostSaleDto) {
    const lostSale = await this.prisma.lostSale.create({
      data: { ...dto, tenantId: ctx.tenantId, branchId, createdBy: ctx.userId },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'LostSale', entityId: lostSale.id, after: lostSale });
    return lostSale;
  }

  /** Resumo por motivo — pra dashboard/decisão de compra. */
  async getSummary(tenantId: string) {
    const grouped = await this.prisma.lostSale.groupBy({
      by: ['reason'],
      where: { tenantId },
      _count: { id: true },
    });
    return grouped.map((g) => ({ reason: g.reason, count: g._count.id }));
  }
}
