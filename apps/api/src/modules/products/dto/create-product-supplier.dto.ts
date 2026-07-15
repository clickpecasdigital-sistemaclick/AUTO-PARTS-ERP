import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductSupplierDto {
  @ApiProperty() @IsUUID() supplierId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierSku?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) lastPurchasePrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPreferred?: boolean;
}

export class UpdateProductSupplierDto {
  @ApiPropertyOptional() @IsOptional() @IsString() supplierSku?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) lastPurchasePrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreferred?: boolean;
}
