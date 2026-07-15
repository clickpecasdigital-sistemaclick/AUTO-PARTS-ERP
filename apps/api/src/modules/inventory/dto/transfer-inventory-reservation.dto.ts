import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

// --- Transferências --------------------------------------------------------------

export class CreateStockTransferItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() originLocationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() destinationLocationId?: string;
}

export class CreateStockTransferDto {
  @ApiProperty() @IsUUID() originWarehouseId!: string;
  @ApiProperty() @IsUUID() destinationWarehouseId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [CreateStockTransferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferItemDto)
  items!: CreateStockTransferItemDto[];
}

// --- Inventário -------------------------------------------------------------------

export enum InventoryTypeDto {
  general = 'general',
  cycle = 'cycle',
  by_location = 'by_location',
  by_group = 'by_group',
  by_manufacturer = 'by_manufacturer',
}

export class CreateInventoryDto {
  @ApiProperty() @IsUUID() warehouseId!: string;
  @ApiProperty({ enum: InventoryTypeDto, default: InventoryTypeDto.general }) @IsEnum(InventoryTypeDto) type!: InventoryTypeDto;
  @ApiPropertyOptional({ default: false, description: 'Contagem cega — oculta o saldo de sistema do operador durante a contagem' })
  @IsOptional()
  @IsBoolean()
  isBlind?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() manufacturerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class SubmitCountDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsNumber() @Min(0) countedQuantity!: number;
}

export class CreateRecountDto {
  @ApiProperty({ type: [String], description: 'IDs de produto a recontar (apenas os divergentes, em geral)' })
  @IsArray()
  @IsUUID('all')
  productIds!: string[];
}

// --- Reservas -----------------------------------------------------------------------

export enum StockReservationSourceTypeDto {
  sales_order = 'sales_order',
  quote = 'quote',
  service_order = 'service_order',
  purchase_order = 'purchase_order',
}

export class CreateStockReservationDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsUUID() warehouseId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantity!: number;
  @ApiProperty({ enum: StockReservationSourceTypeDto }) @IsEnum(StockReservationSourceTypeDto) sourceType!: StockReservationSourceTypeDto;
  @ApiProperty() @IsUUID() sourceId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() expiresAt?: string;
}
