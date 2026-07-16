import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import type { QuerySupplierDto } from './dto/supplier.dto';

/** CRUD de Fornecedores — o cadastro em si nunca existiu, só uma tela de
 * análise (Supplier 360°) para fornecedores já cadastrados via outra rota
 * (importação/seed). O menu "Fornecedores" ficava sempre em "módulo em
 * construção" por causa disso. */
@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string) {
    return this.prisma.supplier.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  findByDocument(tenantId: string, companyId: string, document: string) {
    return this.prisma.supplier.findFirst({ where: { tenantId, companyId, document, deletedAt: null } });
  }

  async findMany(tenantId: string, query: QuerySupplierDto) {
    const where: any = { tenantId, deletedAt: null };
    if (query.status) where.status = query.status as never;
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
      this.prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.supplier.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  create(tenantId: string, userId: string | null, data: any) {
    return this.prisma.supplier.create({ data: { ...data, tenantId, createdBy: userId, updatedBy: userId } });
  }

  update(id: string, userId: string | null, data: any) {
    return this.prisma.supplier.update({ where: { id }, data: { ...data, updatedBy: userId } });
  }

  softDelete(id: string, userId: string | null) {
    return this.prisma.supplier.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId, status: 'inactive' } });
  }
}
