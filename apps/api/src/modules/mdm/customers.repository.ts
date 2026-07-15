import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { QueryCustomerDto } from './dto/customer.dto';

const CUSTOMER_INCLUDE = {
  addresses: true,
  contacts: true,
  vehicles: { where: { deletedAt: null } },
} satisfies any;

export type CustomerWithRelations = any;

/**
 * Repository Pattern (mesmo padrão de `ProductsRepository`/`StockRepository`/
 * `PurchaseOrdersRepository`). Cliente é o cadastro mestre de maior volume
 * do ERP ("preparar para milhões de clientes", briefing) — toda busca usa
 * índice (`name`/`document`/`email`/`phone` já indexados no schema) e
 * paginação real, nunca `findMany` sem `take`.
 */
@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string) {
    return this.prisma.customer.findFirst({ where: { id, tenantId, deletedAt: null }, include: CUSTOMER_INCLUDE });
  }

  findByDocument(tenantId: string, companyId: string, document: string) {
    return this.prisma.customer.findFirst({ where: { tenantId, companyId, document, deletedAt: null } });
  }

  async findMany(tenantId: string, query: QueryCustomerDto) {
    const where: any = { tenantId, deletedAt: null };
    if (query.customerType) where.customerType = query.customerType as never;
    if (query.status) where.status = query.status as never;
    if (query.creditStatus) where.creditStatus = query.creditStatus as never;
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { tradeName: { contains: term, mode: 'insensitive' } },
        { document: { contains: term } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
      ];
    }

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  create(tenantId: string, userId: string | null, data: any) {
    return this.prisma.customer.create({ data: { ...data, tenantId, createdBy: userId, updatedBy: userId }, include: CUSTOMER_INCLUDE });
  }

  update(id: string, userId: string | null, data: any) {
    return this.prisma.customer.update({ where: { id }, data: { ...data, updatedBy: userId }, include: CUSTOMER_INCLUDE });
  }

  softDelete(id: string, userId: string | null) {
    return this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId, status: 'inactive' } });
  }

  /** Aniversariantes do mês (Dashboard CRM). */
  findBirthdaysInMonth(tenantId: string, month: number) {
    return this.prisma.$queryRaw<{ id: string; name: string; birthDate: Date; phone: string | null; email: string | null }[]>`
      SELECT id, name, birth_date as "birthDate", phone, email FROM customers
      WHERE tenant_id = ${tenantId}::uuid AND deleted_at IS NULL
        AND birth_date IS NOT NULL AND EXTRACT(MONTH FROM birth_date) = ${month}
      ORDER BY EXTRACT(DAY FROM birth_date) ASC
    `;
  }
}
