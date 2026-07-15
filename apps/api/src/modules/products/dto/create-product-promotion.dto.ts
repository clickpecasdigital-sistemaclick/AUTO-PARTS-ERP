import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum PromotionTypeDto {
  percentage_discount = 'percentage_discount',
  fixed_discount = 'fixed_discount',
  fixed_price = 'fixed_price',
}

/** Estrutura de promoções (sem regra de aplicação em vendas ainda — ver schema Sprint 05). */
export class CreateProductPromotionDto {
  @ApiProperty({ enum: PromotionTypeDto }) @IsEnum(PromotionTypeDto) type!: PromotionTypeDto;
  @ApiProperty() @IsNumber() @Min(0) value!: number;
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiProperty() @IsDateString() endDate!: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}
