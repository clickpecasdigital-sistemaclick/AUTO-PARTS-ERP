import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Módulo de identidade/sessão (infraestrutura transversal, não um módulo
 * de negócio do ERP). Resolve o usuário autenticado a partir do JWT
 * do Supabase para que os módulos de negócio consumam @CurrentUser().
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
