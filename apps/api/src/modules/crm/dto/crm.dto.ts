import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreatePipelineStageDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() order?: number;
  @ApiPropertyOptional({ default: false }) @IsOptional() isWon?: boolean;
  @ApiPropertyOptional({ default: false }) @IsOptional() isLost?: boolean;
}

export class CreateOpportunityDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() leadId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiProperty() @IsUUID() pipelineStageId!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() value?: number;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @IsInt() @Min(0) @Max(100) probability?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expectedCloseDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedTo?: string;
}

export class MoveOpportunityStageDto {
  @ApiProperty() @IsUUID() pipelineStageId!: string;
}

export enum CrmTaskTypeDto {
  call = 'call',
  visit = 'visit',
  follow_up = 'follow_up',
  email = 'email',
  whatsapp = 'whatsapp',
  generic = 'generic',
}

export class CreateCrmTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() opportunityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() leadId?: string;
  @ApiPropertyOptional({ enum: CrmTaskTypeDto, default: CrmTaskTypeDto.generic }) @IsOptional() @IsEnum(CrmTaskTypeDto) type?: CrmTaskTypeDto;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateCrmTagDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
}

export class CreateCampaignDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateSupportTicketDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiProperty() @IsString() subject!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ default: 'normal' }) @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedTo?: string;
}
