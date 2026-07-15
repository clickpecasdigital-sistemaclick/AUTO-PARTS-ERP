import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/** Metadados do upload — o arquivo em si chega via multipart/form-data (FileInterceptor). */
export class CreateProductPhotoDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ReorderProductPhotosDto {
  photoIdsInOrder!: string[];
}
