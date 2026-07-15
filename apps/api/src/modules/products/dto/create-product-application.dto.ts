import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Vincula o produto a uma `VehicleVersion` do catálogo global (Sprint 02:
 * VehicleMake -> VehicleModel -> VehicleVersion). A montadora/modelo/ano/
 * motor/combustível já estão embutidos na própria VehicleVersion
 * selecionada — o catálogo de veículos é centralizado, não duplicado por
 * produto (ver `GET /catalogs/vehicle-versions` para a busca em cascata).
 */
export class CreateProductApplicationDto {
  @ApiProperty() @IsUUID() vehicleVersionId!: string;
  @ApiPropertyOptional({ description: 'Ex: "dianteiro", "traseiro", "lado direito"' })
  @IsOptional()
  @IsString()
  position?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
