import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { AuditService } from '@/common/audit/audit.service';
import type { CreateSupplierDto, QuerySupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import type { RequestContext } from '@/common/types/request-context';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly repository: SuppliersRepository,
    private readonly audit: AuditService,
  ) {}

  findAll(ctx: RequestContext, query: QuerySupplierDto) {
    return this.repository.findMany(ctx.tenantId, query);
  }

  async findOne(ctx: RequestContext, id: string) {
    const supplier = await this.repository.findById(ctx.tenantId, id);
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
    return supplier;
  }

  async create(ctx: RequestContext, companyId: string, dto: CreateSupplierDto) {
    await this.assertNotDuplicate(ctx.tenantId, companyId, dto.document);
    const supplier = await this.repository.create(ctx.tenantId, ctx.userId, { companyId, ...dto });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'Supplier', entityId: supplier.id, after: supplier });
    return supplier;
  }

  async update(ctx: RequestContext, id: string, dto: UpdateSupplierDto) {
    const before = await this.findOne(ctx, id);
    if (dto.document && dto.document !== before.document) {
      await this.assertNotDuplicate(ctx.tenantId, before.companyId, dto.document);
    }
    const updated = await this.repository.update(id, ctx.userId, dto);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Supplier', entityId: id, before, after: updated });
    return updated;
  }

  async remove(ctx: RequestContext, id: string) {
    const before = await this.findOne(ctx, id);
    await this.repository.softDelete(id, ctx.userId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'Supplier', entityId: id, before });
  }

  private async assertNotDuplicate(tenantId: string, companyId: string, document: string) {
    const cleanDocument = document.replace(/\D/g, '');
    if (!cleanDocument) throw new BadRequestException('Documento inválido');
    const existing = await this.repository.findByDocument(tenantId, companyId, document);
    if (existing) throw new ConflictException(`Já existe um fornecedor cadastrado com o documento "${document}"`);
  }
}
