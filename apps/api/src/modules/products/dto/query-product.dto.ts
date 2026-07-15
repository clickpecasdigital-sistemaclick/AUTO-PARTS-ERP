import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

/**
 * Filtros avançados da listagem de Produtos, além de busca/paginação/
 * ordenação (herdados de PaginationQueryDto). `search` cobre código
 * interno, código de barras, código fabricante, código OEM e descrição —
 * ver `ProductsRepository.buildSearchClause`.
 */
export class QueryProductDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() manufacturerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() subgroupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() supplierId?: string;

  @ApiPropertyOptional({ description: 'Filtra por aplicação a uma versão de veículo específica' })
  @IsOptional()
  @IsUUID()
  vehicleVersionId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyActive?: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Filtra produtos com estoque abaixo do mínimo' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  belowMinStock?: boolean;
}
