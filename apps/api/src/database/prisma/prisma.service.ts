import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Instância única do Prisma Client, com gerenciamento explícito de ciclo
 * de vida (connect/disconnect) integrado ao ciclo de vida do NestJS.
 * Todo Repository de módulo de negócio injeta este serviço — nunca
 * instancia PrismaClient diretamente.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conexão com o banco de dados estabelecida');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
