import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateCheckInDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) odometerKm?: number;
  @ApiPropertyOptional({ minimum: 0, maximum: 100 }) @IsOptional() @IsInt() @Min(0) @Max(100) fuelLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() itemsLeftInVehicle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() existingDamages?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatureUrl?: string;
}

export enum ChecklistItemResultDto {
  ok = 'ok',
  attention = 'attention',
  not_applicable = 'not_applicable',
  not_checked = 'not_checked',
}

export class FillChecklistItemDto {
  @ApiProperty() @IsUUID() templateItemId!: string;
  @ApiProperty({ enum: ChecklistItemResultDto }) @IsEnum(ChecklistItemResultDto) result!: ChecklistItemResultDto;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export enum WorkshopAppointmentStatusDto {
  scheduled = 'scheduled',
  confirmed = 'confirmed',
  waitlisted = 'waitlisted',
  checked_in = 'checked_in',
  rescheduled = 'rescheduled',
  cancelled = 'cancelled',
  no_show = 'no_show',
}

export class CreateAppointmentDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() vehicleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() mechanicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() boxId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() serviceId?: string;
  @ApiProperty() @IsDateString() scheduledAt!: string;
  @ApiPropertyOptional({ default: 60 }) @IsOptional() @IsInt() @Min(15) durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty() @IsDateString() newScheduledAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(15) durationMinutes?: number;
}

export class CancelAppointmentDto {
  @ApiProperty() @IsString() reason!: string;
}

export enum WarrantyTypeDto {
  part = 'part',
  service = 'service',
}

export class CreateWarrantyDto {
  @ApiProperty({ enum: WarrantyTypeDto }) @IsEnum(WarrantyTypeDto) type!: WarrantyTypeDto;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() serviceId?: string;
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsInt() @Min(1) termDays!: number;
}

export class ClaimWarrantyDto {
  @ApiPropertyOptional() @IsOptional() claimCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() claimNotes?: string;
}

export class CreateDeliveryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() signatureUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
