import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { CreateApprovalRuleDto, DecideApprovalDto } from './dto/purchase-approval.dto';
import type { RequestContext } from '@/common/types/request-context';

interface RequestApprovalsParams {
  documentType: 'purchase_request' | 'purchase_order';
  purchaseRequestId?: string;
  purchaseOrderId?: string;
  departmentId?: string | null;
  value: number;
}

/**
 * Motor de aprovação — fluxo configurável, multi-nível, por valor e/ou
 * departamento (`PurchaseApprovalRule`). `requestApprovals()` é chamado
 * por `PurchaseRequestsService`/`PurchaseOrdersService` ao submeter um
 * documento: resolve quais regras se aplicam (valor dentro da faixa,
 * departamento compatível ou regra genérica), cria um `PurchaseApproval`
 * pendente por nível, e retorna `autoApproved: true` quando nenhuma regra
 * se aplica (documento de baixo valor, sem necessidade de aprovação).
 */
@Injectable()
export class PurchaseApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async requestApprovals(ctx: RequestContext, params: RequestApprovalsParams) {
    const rules = await this.prisma.purchaseApprovalRule.findMany({
      where: {
        tenantId: ctx.tenantId,
        isActive: true,
        minValue: { lte: params.value },
        OR: [{ maxValue: null }, { maxValue: { gte: params.value } }],
        AND: [{ OR: [{ departmentId: null }, { departmentId: params.departmentId ?? undefined }] }],
      },
      orderBy: { level: 'asc' },
    });

    if (rules.length === 0) {
      return { autoApproved: true, approvals: [] };
    }

    const approvals = await this.prisma.$transaction(
      rules.map((rule) =>
        this.prisma.purchaseApproval.create({
          data: {
            tenantId: ctx.tenantId,
            documentType: params.documentType as never,
            purchaseRequestId: params.purchaseRequestId,
            purchaseOrderId: params.purchaseOrderId,
            level: rule.level,
            approverId: ctx.userId!, // placeholder — atribuição real de aprovador específico por usuário/fila é refinamento de produto; hoje qualquer usuário com o `approverRole` da regra pode decidir (ver `decide()`)
            status: 'pending',
          },
        }),
      ),
    );

    return { autoApproved: false, approvals };
  }

  async decide(ctx: RequestContext, approvalId: string, approverRole: string, dto: DecideApprovalDto) {
    const approval = await this.prisma.purchaseApproval.findFirst({ where: { id: approvalId, tenantId: ctx.tenantId } });
    if (!approval) throw new NotFoundException('Aprovação não encontrada');
    if (approval.status !== 'pending') throw new BadRequestException('Esta etapa de aprovação já foi decidida');

    const rule = await this.prisma.purchaseApprovalRule.findFirst({
      where: { tenantId: ctx.tenantId, level: approval.level },
    });
    if (rule && rule.approverRole !== approverRole && approverRole !== 'admin' && approverRole !== 'super_admin') {
      throw new ForbiddenException(`Esta etapa exige o papel "${rule.approverRole}"`);
    }

    const updated = await this.prisma.purchaseApproval.update({
      where: { id: approvalId },
      data: { status: dto.decision, comments: dto.comments, decidedAt: new Date(), approverId: ctx.userId! },
    });

    await this.audit.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: dto.decision === 'approved' ? 'approve' : 'reject',
      entity: 'PurchaseApproval',
      entityId: approvalId,
      after: { decision: dto.decision, comments: dto.comments },
    });

    // Se foi a última etapa pendente e todas aprovaram, o documento pai é
    // promovido a "aprovado" pelo respectivo service (Request/Order) — ver
    // `isFullyApproved()`, chamado por quem orquestra o documento.
    return updated;
  }

  async isFullyApproved(tenantId: string, params: { purchaseRequestId?: string; purchaseOrderId?: string }) {
    const approvals = await this.prisma.purchaseApproval.findMany({
      where: { tenantId, ...params },
    });
    if (approvals.length === 0) return true;
    return approvals.every((a) => a.status === 'approved');
  }

  async wasRejected(tenantId: string, params: { purchaseRequestId?: string; purchaseOrderId?: string }) {
    const approvals = await this.prisma.purchaseApproval.findMany({ where: { tenantId, ...params } });
    return approvals.some((a) => a.status === 'rejected');
  }

  getHistory(tenantId: string, params: { purchaseRequestId?: string; purchaseOrderId?: string }) {
    return this.prisma.purchaseApproval.findMany({ where: { tenantId, ...params }, orderBy: { level: 'asc' } });
  }

  // --- Configuração de regras --------------------------------------------------

  listRules(tenantId: string) {
    return this.prisma.purchaseApprovalRule.findMany({ where: { tenantId }, orderBy: { level: 'asc' } });
  }

  createRule(tenantId: string, dto: CreateApprovalRuleDto) {
    return this.prisma.purchaseApprovalRule.create({ data: { tenantId, ...dto } });
  }
}
