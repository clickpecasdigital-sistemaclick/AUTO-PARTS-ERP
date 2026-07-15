import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import { PurchaseApprovalsService } from './purchase-approvals.service';
import type { CreatePurchaseRequestDto, QueryPurchaseRequestDto } from './dto/purchase-request.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Solicitação de Compra — a "Necessidade" que inicia o ciclo (briefing:
 * Necessidade → Solicitação → Cotação → ... ). Ao submeter para aprovação,
 * delega a `PurchaseApprovalsService` a decisão de quantos níveis e quais
 * aprovadores são exigidos (`PurchaseApprovalRule`), sem conhecer a regra
 * em si — apenas o resultado (aprovado/pendente/rejeitado).
 */
@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: PurchaseApprovalsService,
  ) {}

  async create(ctx: RequestContext, branchId: string, dto: CreatePurchaseRequestDto) {
    const count = await this.prisma.purchaseRequest.count({ where: { tenantId: ctx.tenantId } });
    const code = `SC-${String(count + 1).padStart(6, '0')}`;

    const request = await this.prisma.purchaseRequest.create({
      data: {
        tenantId: ctx.tenantId,
        branchId,
        requesterId: ctx.userId!,
        costCenterId: dto.costCenterId,
        departmentId: dto.departmentId,
        priority: dto.priority as never,
        isUrgent: dto.isUrgent,
        justification: dto.justification,
        code,
        createdBy: ctx.userId,
        items: { createMany: { data: dto.items.map((item) => ({ tenantId: ctx.tenantId, ...item })) } },
      },
      include: { items: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'PurchaseRequest', entityId: request.id, after: request });
    return request;
  }

  async submitForApproval(ctx: RequestContext, id: string, estimatedValue: number) {
    const request = await this.getOrThrow(ctx.tenantId, id);
    if (request.status !== 'draft') throw new BadRequestException('Apenas solicitações em rascunho podem ser submetidas');

    const result = await this.approvals.requestApprovals(ctx, {
      documentType: 'purchase_request',
      purchaseRequestId: id,
      departmentId: request.departmentId,
      value: estimatedValue,
    });

    const status = result.autoApproved ? 'approved' : 'pending_approval';
    const updated = await this.prisma.purchaseRequest.update({ where: { id }, data: { status } });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'PurchaseRequest', entityId: id, after: { status } });
    return updated;
  }

  findAll(tenantId: string, query: QueryPurchaseRequestDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    return this.prisma.$transaction([
      this.prisma.purchaseRequest.findMany({
        where: { tenantId, ...(query.status ? { status: query.status as never } : {}), ...(query.departmentId ? { departmentId: query.departmentId } : {}) },
        include: { items: { include: { product: { select: { id: true, internalCode: true, shortDescription: true } } } }, department: true, costCenter: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.purchaseRequest.count({ where: { tenantId } }),
    ]);
  }

  async findOne(ctx: RequestContext, id: string) {
    return this.getOrThrow(ctx.tenantId, id);
  }

  private async getOrThrow(tenantId: string, id: string) {
    const request = await this.prisma.purchaseRequest.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: { select: { id: true, internalCode: true, shortDescription: true } } } }, approvals: true },
    });
    if (!request) throw new NotFoundException('Solicitação de compra não encontrada');
    return request;
  }
}
