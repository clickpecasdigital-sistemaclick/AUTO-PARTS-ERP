import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PersonTypeDto {
  individual = 'individual',
  business = 'business',
}

export enum SupplierStatusDto {
  active = 'active',
  inactive = 'inactive',
  blocked = 'blocked',
}

export class CreateSupplierDto {
  @IsEnum(PersonTypeDto) personType!: PersonTypeDto;
  @IsString() document!: string;
  @IsOptional() @IsString() stateRegistration?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() tradeName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() complement?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) paymentTermDays?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateSupplierDto extends CreateSupplierDto {
  @IsOptional() @IsEnum(SupplierStatusDto) status?: SupplierStatusDto;
}

export class QuerySupplierDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['active', 'inactive', 'blocked']) status?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) perPage?: number;
}
