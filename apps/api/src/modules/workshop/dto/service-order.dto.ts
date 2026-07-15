import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export enum ServiceOrderPriorityDto {
  low = 'low',
  normal = 'normal',
  high = 'high',
  urgent = 'urgent',
}

export class CreateServiceOrderDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiProperty() @IsUUID() vehicleId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() mechanicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() consultantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() boxId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() appointmentId?: string;
  @ApiPropertyOptional({ enum: ServiceOrderPriorityDto, default: ServiceOrderPriorityDto.normal }) @IsOptional() @IsEnum(ServiceOrderPriorityDto) priority?: ServiceOrderPriorityDto;
  @ApiPropertyOptional() @IsOptional() @IsString() complaint?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) odometerKm?: number;
}

export class UpdateDiagnosisDto {
  @ApiPropertyOptional() @IsOptional() @IsString() technicalDiagnosis?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() proposedSolution?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) estimatedMinutes?: number;
}

export class AddServiceItemDto {
  @ApiProperty() @IsUUID() serviceId!: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
}

export class AddPartItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
}

export class CancelServiceOrderDto {
  @ApiProperty() @IsString() reason!: string;
}

export class QueryServiceOrderDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() mechanicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() boxId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
}
