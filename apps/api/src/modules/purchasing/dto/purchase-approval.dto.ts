import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum PurchaseApprovalDocumentTypeDto {
  purchase_request = 'purchase_request',
  purchase_order = 'purchase_order',
}

export class DecideApprovalDto {
  @ApiProperty({ enum: ['approved', 'rejected'] }) @IsEnum(['approved', 'rejected']) decision!: 'approved' | 'rejected';
  @ApiPropertyOptional() @IsOptional() @IsString() comments?: string;
}

export class CreateApprovalRuleDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiProperty({ default: 1 }) level!: number;
  @ApiProperty({ default: 0 }) minValue!: number;
  @ApiPropertyOptional() @IsOptional() maxValue?: number;
  @ApiProperty({ description: 'Papel exigido para aprovar este nível (espelha UserRole)' }) @IsString() approverRole!: string;
}
