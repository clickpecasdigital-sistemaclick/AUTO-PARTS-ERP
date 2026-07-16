import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export enum PersonTypeDto {
  individual = 'individual',
  business = 'business',
}

export enum CustomerTypeDto {
  final_consumer = 'final_consumer',
  workshop = 'workshop',
  wholesale = 'wholesale',
  retail = 'retail',
}

export enum CustomerStatusDto {
  active = 'active',
  inactive = 'inactive',
  blocked = 'blocked',
}

export class CreateCustomerDto {
  @ApiProperty({ enum: PersonTypeDto }) @IsEnum(PersonTypeDto) personType!: PersonTypeDto;
  @ApiPropertyOptional({ enum: CustomerTypeDto, default: CustomerTypeDto.retail }) @IsOptional() @IsEnum(CustomerTypeDto) customerType?: CustomerTypeDto;
  @ApiProperty() @IsString() document!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stateRegistration?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() municipalRegistration?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rg?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() suframaCode?: string;
  @ApiProperty() @IsString() @MaxLength(180) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tradeName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() classification?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() segment?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatsapp?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() instagram?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() facebook?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zipCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() street?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() number?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() complement?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() latitude?: number;
  @ApiPropertyOptional() @IsOptional() longitude?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() creditLimit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateCustomerDto extends CreateCustomerDto {
  @ApiPropertyOptional({ enum: CustomerStatusDto }) @IsOptional() @IsEnum(CustomerStatusDto) status?: CustomerStatusDto;
}

export class QueryCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: CustomerTypeDto }) @IsOptional() @IsEnum(CustomerTypeDto) customerType?: CustomerTypeDto;
  @ApiPropertyOptional({ enum: CustomerStatusDto }) @IsOptional() @IsEnum(CustomerStatusDto) status?: CustomerStatusDto;
  @ApiPropertyOptional() @IsOptional() @IsString() creditStatus?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() perPage?: number = 20;
}

export enum ContactKindDto {
  primary = 'primary',
  financial = 'financial',
  purchasing = 'purchasing',
  workshop = 'workshop',
  fiscal = 'fiscal',
}

export class CreateContactDto {
  @ApiPropertyOptional({ enum: ContactKindDto, default: ContactKindDto.primary }) @IsOptional() @IsEnum(ContactKindDto) kind?: ContactKindDto;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatsapp?: string;
  @ApiPropertyOptional() @Transform(emptyToUndefined) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export enum AddressKindDto {
  billing = 'billing',
  shipping = 'shipping',
  fiscal = 'fiscal',
  residential = 'residential',
  commercial = 'commercial',
  other = 'other',
}

export class CreateCustomerAddressDto {
  @ApiPropertyOptional({ enum: AddressKindDto }) @IsOptional() @IsEnum(AddressKindDto) kind?: AddressKindDto;
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
  @ApiProperty() @IsString() zipCode!: string;
  @ApiProperty() @IsString() street!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() number?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() complement?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() state!: string;
  @ApiPropertyOptional() @IsOptional() latitude?: number;
  @ApiPropertyOptional() @IsOptional() longitude?: number;
  @ApiPropertyOptional({ default: false }) @IsOptional() isDefault?: boolean;
}

export class CreateCustomerVehicleDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() vehicleVersionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() plate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() chassis?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() renavam?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() modelYear?: number;
  @ApiPropertyOptional() @IsOptional() manufactureYear?: number;
  @ApiPropertyOptional() @IsOptional() currentKm?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
