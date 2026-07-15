import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Espelha o enum `ProductOrigin` do Prisma (Sprint 02 — tabela TIPI/Origem da Mercadoria). */
export enum ProductOriginDto {
  nacional = 'nacional',
  estrangeira_importacao_direta = 'estrangeira_importacao_direta',
  estrangeira_mercado_interno = 'estrangeira_mercado_interno',
  nacional_importacao_acima_40 = 'nacional_importacao_acima_40',
  nacional_processos_produtivos = 'nacional_processos_produtivos',
  nacional_importacao_menor_40 = 'nacional_importacao_menor_40',
  estrangeira_sem_similar_nacional = 'estrangeira_sem_similar_nacional',
  estrangeira_sem_similar_mercado = 'estrangeira_sem_similar_mercado',
  nacional_conteudo_importacao_70 = 'nacional_conteudo_importacao_70',
}

/**
 * Payload de criação de Produto. `internalCode` é opcional — quando
 * omitido, `ProductsService` gera automaticamente (ver `generateInternalCode`),
 * conforme exigido pelo briefing ("Código interno gerado automaticamente,
 * editável conforme permissão").
 */
export class CreateProductDto {
  @ApiPropertyOptional({ description: 'Gerado automaticamente quando omitido' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  internalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  manufacturerCode?: string;

  @ApiPropertyOptional({ description: 'Código original (OEM)' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  originalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  similarCode?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(180)
  shortDescription!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullDescription?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() manufacturerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() subgroupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiProperty() @IsUUID() unitId!: string;

  // Fiscal
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10) ncmCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10) cestCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10) defaultCfopCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5) defaultCstCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5) defaultCsosnCode?: string;

  @ApiPropertyOptional({ enum: ProductOriginDto, default: ProductOriginDto.nacional })
  @IsOptional()
  @IsEnum(ProductOriginDto)
  origin?: ProductOriginDto;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) @Max(100) ipiRate?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) @Max(100) icmsRate?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) @Max(100) pisRate?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) @Max(100) cofinsRate?: number;

  // Dimensões físicas
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) weightKg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) heightCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) widthCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) lengthCm?: number;

  // Estoque (parâmetros)
  @ApiPropertyOptional() @IsOptional() @IsUUID() defaultLocationId?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) minStock?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxStock?: number;

  // Preços
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) salePrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) wholesalePrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) workshopPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) distributorPrice?: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID() primarySupplierId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) warrantyDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}
