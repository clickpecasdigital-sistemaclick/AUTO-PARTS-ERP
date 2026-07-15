import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Funcionários — cadastro completo (briefing). Salário (`EmployeeSalary`)
 * NUNCA é incluído no `findAll`/`findOne` padrão — só `getSalaryHistory()`
 * o expõe, atrás da permissão dedicada `employees.view_financial`
 * aplicada no Controller (`@RequirePermission('employees', 'view_financial')`
 * — ação extra documentada no módulo, não pertence ao catálogo padrão de
 * 8 ações porque é deliberadamente mais restrita que um `view` comum).
 */
@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(tenantId: string, departmentId?: string) {
    return this.prisma.employee.findMany({
      where: { tenantId, deletedAt: null, ...(departmentId ? { departmentId } : {}) },
      include: { department: true, salesperson: true, mechanic: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null }, include: { department: true, salesperson: true, mechanic: true } });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');
    return employee;
  }

  async create(ctx: RequestContext, companyId: string, branchId: string, dto: Record<string, unknown>) {
    const employee = await this.prisma.employee.create({ data: { tenantId: ctx.tenantId, companyId, branchId, ...dto } as never });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'Employee', entityId: employee.id, after: employee });
    return employee;
  }

  async update(ctx: RequestContext, id: string, dto: Record<string, unknown>) {
    const before = await this.findOne(ctx.tenantId, id);
    const updated = await this.prisma.employee.update({ where: { id }, data: dto as never });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Employee', entityId: id, before, after: updated });
    return updated;
  }

  async remove(ctx: RequestContext, id: string) {
    await this.findOne(ctx.tenantId, id);
    await this.prisma.employee.update({ where: { id }, data: { deletedAt: new Date(), status: 'terminated' } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'Employee', entityId: id });
  }

  /** Estrutura protegida — ver nota da classe. */
  async getSalaryHistory(ctx: RequestContext, employeeId: string) {
    await this.findOne(ctx.tenantId, employeeId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'sensitive_data_view', entity: 'EmployeeSalary', entityId: employeeId });
    return this.prisma.employeeSalary.findMany({ where: { tenantId: ctx.tenantId, employeeId }, orderBy: { effectiveFrom: 'desc' } });
  }

  async setSalary(ctx: RequestContext, employeeId: string, baseSalary: number, effectiveFrom: string, notes?: string) {
    await this.findOne(ctx.tenantId, employeeId);
    // Encerra a vigência anterior (se houver) antes de criar a nova.
    await this.prisma.employeeSalary.updateMany({ where: { tenantId: ctx.tenantId, employeeId, effectiveTo: null }, data: { effectiveTo: new Date(effectiveFrom) } });
    const salary = await this.prisma.employeeSalary.create({
      data: { tenantId: ctx.tenantId, employeeId, baseSalary, effectiveFrom: new Date(effectiveFrom), notes, createdBy: ctx.userId },
    });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'EmployeeSalary', entityId: salary.id, after: { baseSalary, effectiveFrom } });
    return salary;
  }
}
