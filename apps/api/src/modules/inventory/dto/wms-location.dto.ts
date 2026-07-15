import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty() @IsString() @MaxLength(20) code!: string;
  @ApiProperty() @IsString() @MaxLength(120) name!: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class CreateAisleDto {
  @ApiProperty() @IsUUID() warehouseId!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateStreetDto {
  @ApiProperty() @IsUUID() aisleId!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateShelfDto {
  @ApiProperty() @IsUUID() streetId!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

/**
 * Cria a posição final do endereçamento WMS (Nível + Posição). O
 * `fullAddress` (ex: "A01-B05-P03-N02") é montado automaticamente pelo
 * `WmsLocationsService` a partir da cadeia Corredor-Rua-Prateleira-Nível,
 * nunca informado pelo cliente.
 */
export class CreateStorageLocationDto {
  @ApiProperty() @IsUUID() shelfId!: string;
  @ApiProperty({ description: 'Nível, ex: "N02"' }) @IsString() level!: string;
  @ApiProperty({ description: 'Posição, ex: "P03"' }) @IsString() position!: string;
}
