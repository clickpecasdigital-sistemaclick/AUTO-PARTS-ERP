import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum LostSaleReasonDto {
  out_of_stock = 'out_of_stock',
  price_too_high = 'price_too_high',
  product_not_found = 'product_not_found',
  customer_gave_up = 'customer_gave_up',
  lost_to_competitor = 'lost_to_competitor',
  other = 'other',
}

export class CreateLostSaleDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productDescription?: string;
  @ApiProperty({ enum: LostSaleReasonDto }) @IsEnum(LostSaleReasonDto) reason!: LostSaleReasonDto;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) estimatedValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
