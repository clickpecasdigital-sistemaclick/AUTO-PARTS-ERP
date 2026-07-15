import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateQuotationItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantity!: number;
}

export class CreateQuotationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() purchaseRequestId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [String], description: 'IDs dos fornecedores convidados a cotar' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all')
  supplierIds!: string[];
  @ApiProperty({ type: [CreateQuotationItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items!: CreateQuotationItemDto[];
}

export class SubmitQuotationResponseItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsNumber() @Min(0) unitPrice!: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) ipiRate?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) icmsRate?: number;
}

/** Resposta de UM fornecedor à cotação — condições comerciais completas usadas pelo comparativo automático. */
export class SubmitQuotationResponseDto {
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) freightAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentTerms?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) deliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) warrantyDays?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) discountPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [SubmitQuotationResponseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitQuotationResponseItemDto)
  items!: SubmitQuotationResponseItemDto[];
}

export class AwardQuotationDto {
  @ApiProperty({ description: 'ID do PurchaseQuotationSupplier vencedor' }) @IsUUID() quotationSupplierId!: string;
}
