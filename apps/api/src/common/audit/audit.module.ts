import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Módulo global de auditoria — importado uma única vez em AppModule,
 * disponível em qualquer módulo de negócio via injeção de `AuditService`.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
