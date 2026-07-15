import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomerCreditController } from './customer-credit.controller';
import { Customer360Controller } from './customer-360.controller';
import { EmployeesController } from './employees.controller';
import { SalespersonsController } from './salespersons.controller';
import { MechanicsController } from './mechanics.controller';
import { CarriersController } from './carriers.controller';
import { DocumentsController } from './documents.controller';
import { LgpdController } from './lgpd.controller';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';
import { CustomerCreditService } from './customer-credit.service';
import { Customer360Service } from './customer-360.service';
import { EmployeesService } from './employees.service';
import { SalespersonsService } from './salespersons.service';
import { MechanicsService } from './mechanics.service';
import { CarriersService } from './carriers.service';
import { DocumentsService } from './documents.service';
import { LgpdService } from './lgpd.service';

/**
 * Master Data Management (Sprint 08) — Cadastro Mestre de Clientes,
 * Fornecedores (contatos/LGPD estendidos aqui; CRUD completo de
 * Fornecedor já existe desde a Sprint 02/07), Funcionários, Vendedores,
 * Mecânicos, Transportadoras, Documentos e LGPD. Fonte oficial consumida
 * por Produtos/Estoque/Compras/Vendas/Oficina — nenhum desses módulos
 * duplica cadastro de Cliente/Fornecedor/Funcionário.
 */
@Module({
  controllers: [
    CustomersController,
    CustomerCreditController,
    Customer360Controller,
    EmployeesController,
    SalespersonsController,
    MechanicsController,
    CarriersController,
    DocumentsController,
    LgpdController,
  ],
  providers: [
    CustomersService,
    CustomersRepository,
    CustomerCreditService,
    Customer360Service,
    EmployeesService,
    SalespersonsService,
    MechanicsService,
    CarriersService,
    DocumentsService,
    LgpdService,
  ],
  exports: [CustomersService, CustomersRepository, CustomerCreditService, Customer360Service, DocumentsService],
})
export class MdmModule {}
