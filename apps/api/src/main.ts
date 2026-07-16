import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { configureSecurity } from './common/security/security.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Helmet (CSP/HSTS), CORS com validação de whitelist e compressão
  // GZIP/Brotli — antes definidos aqui de forma mais simples e duplicados
  // em common/security/security.config.ts sem nunca serem chamados de lá.
  // Consolidado nesta única chamada para não ter duas configurações
  // (potencialmente divergentes) de CORS/Helmet coexistindo.
  await configureSecurity(app);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Documentação OpenAPI/Swagger (Sprint 05) — cresce automaticamente conforme
  // novos módulos de negócio registram seus controllers/DTOs com decorators
  // @nestjs/swagger; nenhuma configuração adicional é necessária por módulo.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auto Parts ERP API')
    .setDescription('API REST do Auto Parts ERP — Gestão completa para Autopeças')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Auto Parts ERP API rodando em http://localhost:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`📚 Documentação Swagger em http://localhost:${port}/api/docs`);
}

bootstrap();
