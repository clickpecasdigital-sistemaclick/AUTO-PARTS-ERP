import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export enum SaleModeDto {
  balcony = 'balcony',
  workshop = 'workshop',
  quick = 'quick',
  future_sale = 'future_sale',
  telesales = 'telesales',
  pre_sale = 'pre_sale',
}

export class CartItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantity!: number;
  @ApiPropertyOptional({ description: 'Se omitido, usa Product.salePrice' }) @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) @Max(100) discountPercent?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) surchargeAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class OpenCartDto {
  @ApiProperty({ enum: SaleModeDto, default: SaleModeDto.balcony }) @IsEnum(SaleModeDto) mode!: SaleModeDto;
  @ApiProperty() @IsUUID() warehouseId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() terminalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerVehicleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() salespersonId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() cashRegisterId?: string;
}

export class AddCartItemDto extends CartItemDto {}

export class UpdateCartItemDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0.0001) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) discountPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) surchargeAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class SetCartCustomerDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerVehicleId?: string;
}

export class SetCartDiscountDto {
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class CartPaymentDto {
  @ApiProperty() @IsUUID() paymentMethodId!: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount!: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsNumber() @Min(1) installments?: number;
}

export class CheckoutCartDto {
  @ApiProperty({ type: [CartPaymentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartPaymentDto)
  payments!: CartPaymentDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
