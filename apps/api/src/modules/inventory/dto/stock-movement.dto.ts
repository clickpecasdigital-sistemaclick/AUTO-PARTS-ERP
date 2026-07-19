import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Espelha `StockMovementType` do Prisma (Sprint 02 + extensões da Sprint 06). */
export enum StockMovementTypeDto {
  purchase_in = 'purchase_in',
  sale_out = 'sale_out',
  transfer_in = 'transfer_in',
  transfer_out = 'transfer_out',
  adjustment_in = 'adjustment_in',
  adjustment_out = 'adjustment_out',
  inventory_in = 'inventory_in',
  inventory_out = 'inventory_out',
  service_order_out = 'service_order_out',
  return_in = 'return_in',
  loss_out = 'loss_out',
  breakage_out = 'breakage_out',
  internal_consumption_out = 'internal_consumption_out',
  bonus_in = 'bonus_in',
}

/** Tipos que exigem `reason` preenchido na validação do service (perda/quebra/ajuste/consumo interno). */
export const REASON_REQUIRED_TYPES: StockMovementTypeDto[] = [
  StockMovementTypeDto.loss_out,
  StockMovementTypeDto.breakage_out,
  StockMovementTypeDto.adjustment_in,
  StockMovementTypeDto.adjustment_out,
  StockMovementTypeDto.internal_consumption_out,
];

export class CreateStockMovementDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsUUID() warehouseId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() batchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() serialId?: string;
  @ApiProperty({ enum: StockMovementTypeDto }) @IsEnum(StockMovementTypeDto) type!: StockMovementTypeDto;
  @ApiProperty() @IsNumber() @Min(0.0001) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @ApiPropertyOptional({ description: 'Obrigatório para perda/quebra/ajuste/consumo interno' })
  @IsOptional()
  @IsString()
  reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() documentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class QueryStockMovementDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
  @ApiPropertyOptional({ enum: StockMovementTypeDto }) @IsOptional() @IsEnum(StockMovementTypeDto) type?: StockMovementTypeDto;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) perPage?: number = 20;
}
