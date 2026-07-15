import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class CreatePayableDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() supplierId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() purchaseOrderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() costCenterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() chartOfAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() bankAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentNumber?: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount!: number;
  @ApiProperty() @IsDateString() dueDate!: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) installments?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateReceivableDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() saleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() costCenterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() chartOfAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() bankAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentNumber?: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount!: number;
  @ApiProperty() @IsDateString() dueDate!: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) installments?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class SettleDto {
  @ApiProperty({ description: 'Valor pago/recebido nesta baixa (pode ser parcial)' }) @IsNumber() @Min(0.01) amount!: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) interestAmount?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) fineAmount?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() bankAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() settledAt?: string;
}

export class RenegotiateDto {
  @ApiProperty() @IsDateString() newDueDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) newAmount?: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) installments?: number;
  @ApiProperty() @IsString() reason!: string;
}

export class ReverseDto {
  @ApiProperty() @IsString() reason!: string;
}

export class QueryFinancialDocumentDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() costCenterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() bankAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDateTo?: string;
}
