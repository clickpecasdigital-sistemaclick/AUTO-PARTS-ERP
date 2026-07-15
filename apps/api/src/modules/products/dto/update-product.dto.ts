import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export enum ProductStatusDto {
  active = 'active',
  inactive = 'inactive',
  discontinued = 'discontinued',
}

/** Todos os campos de CreateProductDto se tornam opcionais (PATCH parcial). */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ enum: ProductStatusDto })
  @IsOptional()
  @IsEnum(ProductStatusDto)
  status?: ProductStatusDto;
}
