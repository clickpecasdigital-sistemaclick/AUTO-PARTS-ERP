import { Module } from '@nestjs/common';
import { MercadoLivreController } from './mercado-livre.controller';
import { MercadoLivreService } from './mercado-livre.service';

@Module({
  controllers: [MercadoLivreController],
  providers: [MercadoLivreService],
  exports: [MercadoLivreService],
})
export class IntegrationsModule {}
