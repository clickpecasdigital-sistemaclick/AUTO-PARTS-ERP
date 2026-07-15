import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { AuditService } from '@/common/audit/audit.service';
import type {
  CreateContactDto,
  CreateCustomerAddressDto,
  CreateCustomerDto,
  CreateCustomerVehicleDto,
  QueryCustomerDto,
  UpdateCustomerDto,
} from './dto/customer.dto';
import type { RequestContext } from '@/common/types/request-context';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Cadastro Mestre de Clientes (Sprint 08, MDM) — fonte oficial de dados de
 * cliente para TODO o ERP (briefing: "Não poderão existir cadastros
 * duplicados"). `companyId` + `document` é UNIQUE no schema (Sprint 02) —
 * a checagem aqui (`assertNotDuplicate`) só antecipa o erro 409 amigável
 * antes do banco rejeitar via constraint.
 */
@Injectable()
export class CustomersService {
  constructor(
    private readonly repository: CustomersRepository,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(ctx: RequestContext, query: QueryCustomerDto) {
    return this.repository.findMany(ctx.tenantId, query);
  }

  async findOne(ctx: RequestContext, id: string) {
    const customer = await this.repository.findById(ctx.tenantId, id);
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async create(ctx: RequestContext, companyId: string, dto: CreateCustomerDto) {
    await this.assertNotDuplicate(ctx.tenantId, companyId, dto.document);

    const data: any = { tenantId: ctx.tenantId, companyId, ...dto };
    const customer = await this.repository.create(ctx.tenantId, ctx.userId, data);

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'Customer', entityId: customer.id, after: customer });
    return customer;
  }

  async update(ctx: RequestContext, id: string, dto: UpdateCustomerDto) {
    const before = await this.findOne(ctx, id);
    if (dto.document && dto.document !== before.document) {
      await this.assertNotDuplicate(ctx.tenantId, before.companyId, dto.document);
    }

    const updated = await this.repository.update(id, ctx.userId, dto as any);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Customer', entityId: id, before, after: updated });
    return updated;
  }

  async remove(ctx: RequestContext, id: string) {
    const before = await this.findOne(ctx, id);
    await this.repository.softDelete(id, ctx.userId);
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: 'Customer', entityId: id, before });
  }

  // --- Contatos -----------------------------------------------------------------

  async addContact(ctx: RequestContext, customerId: string, dto: CreateContactDto) {
    await this.findOne(ctx, customerId);
    const contact = await this.prisma.customerContact.create({ data: { tenantId: ctx.tenantId, customerId, ...dto } as never });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Customer', entityId: customerId, after: { contactAdded: contact.id } });
    return contact;
  }

  async removeContact(ctx: RequestContext, customerId: string, contactId: string) {
    await this.prisma.customerContact.delete({ where: { id: contactId } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Customer', entityId: customerId, before: { contactRemoved: contactId } });
  }

  // --- Endereços ----------------------------------------------------------------

  async addAddress(ctx: RequestContext, customerId: string, dto: CreateCustomerAddressDto) {
    await this.findOne(ctx, customerId);
    return this.prisma.customerAddress.create({ data: { tenantId: ctx.tenantId, customerId, ...dto } as never });
  }

  async removeAddress(_ctx: RequestContext, addressId: string) {
    return this.prisma.customerAddress.delete({ where: { id: addressId } });
  }

  // --- Veículos -----------------------------------------------------------------

  async addVehicle(ctx: RequestContext, customerId: string, dto: CreateCustomerVehicleDto) {
    await this.findOne(ctx, customerId);
    const vehicle = await this.prisma.customerVehicle.create({ data: { tenantId: ctx.tenantId, customerId, ...dto } as never });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'CustomerVehicle', entityId: vehicle.id, after: vehicle });
    return vehicle;
  }

  async removeVehicle(ctx: RequestContext, vehicleId: string) {
    return this.prisma.customerVehicle.update({ where: { id: vehicleId }, data: { deletedAt: new Date() } });
  }

  /** Aniversariantes do mês atual (ou informado) — Dashboard CRM. */
  getBirthdays(tenantId: string, month?: number) {
    return this.repository.findBirthdaysInMonth(tenantId, month ?? new Date().getMonth() + 1);
  }

  private async assertNotDuplicate(tenantId: string, companyId: string, document: string) {
    const cleanDocument = document.replace(/\D/g, '');
    if (!cleanDocument) throw new BadRequestException('Documento inválido');
    const existing = await this.repository.findByDocument(tenantId, companyId, document);
    if (existing) throw new ConflictException(`Já existe um cliente cadastrado com o documento "${document}" — MDM não permite cadastros duplicados`);
  }
}
