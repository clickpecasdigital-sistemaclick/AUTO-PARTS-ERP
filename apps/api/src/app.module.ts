import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { StorageModule } from './common/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { MdmModule } from './modules/mdm/mdm.module';
import { CrmModule } from './modules/crm/crm.module';
import { PdvModule } from './modules/pdv/pdv.module';
import { FinancialModule } from './modules/financial/financial.module';
import { WorkshopModule } from './modules/workshop/workshop.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { BiModule } from './modules/bi/bi.module';
import { SecurityModule } from './modules/security/security.module';
import { LgpdModule } from './modules/lgpd/lgpd.module';
import { BackupModule } from './modules/backup/backup.module';
import { SaasModule } from './modules/saas/saas.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { UsersModule } from './modules/users/users.module';
import { SuperAdminModule } from './modules/superadmin/superadmin.module';
import { CopilotModule } from './modules/copilot/copilot.module';

/**
 * Módulo raiz. Próximos módulos de negócio (Estoque, Vendas, Clientes,
 * Financeiro, Compras, Oficina...) devem ser importados aqui, cada um
 * encapsulando seu próprio Controller/Service/Repository (Clean Architecture).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuditModule,
    StorageModule,
    HealthModule,
    AuthModule,
    ProductsModule,
    InventoryModule,
    PurchasingModule,
    MdmModule,
    CrmModule,
    PdvModule,
    FinancialModule,
    WorkshopModule,
    FiscalModule,
    BiModule,
    SecurityModule,
    LgpdModule,
    BackupModule,
    SaasModule,
    IntegrationsModule,
    WorkspaceModule,
    UsersModule,
    SuperAdminModule,
    CopilotModule,
  ],
})
export class AppModule {}
