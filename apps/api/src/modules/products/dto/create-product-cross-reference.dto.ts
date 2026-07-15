import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ProductRelationTypeDto {
  similar = 'similar',
  equivalent = 'equivalent',
  complementary = 'complementary',
  substitute = 'substitute',
}

export class CreateProductCrossReferenceDto {
  @ApiProperty() @IsUUID() relatedProductId!: string;
  @ApiProperty({ enum: ProductRelationTypeDto }) @IsEnum(ProductRelationTypeDto) type!: ProductRelationTypeDto;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
