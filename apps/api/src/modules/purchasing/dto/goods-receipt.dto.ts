import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateGoodsReceiptDto {
  @ApiProperty() @IsUUID() purchaseOrderId!: string;
  @ApiProperty() @IsUUID() warehouseId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() carrierId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) volumes?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) weightKg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) freightAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() driverName?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() receivedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export enum ConferenceChannelDto {
  manual = 'manual',
  barcode = 'barcode',
  qrcode = 'qrcode',
}

/**
 * Conferência de um item recebido — `acceptedQuantity`/`rejectedQuantity`
 * juntas podem ser menores que a quantidade do pedido (conferência
 * parcial, conferência continua) ou somar o total (conferência concluída
 * para aquele item). `conferredVia` documenta o canal (briefing: manual,
 * código de barras, QR Code, coletor de dados — o coletor usa o mesmo
 * endpoint, só troca o `conferredVia` para "barcode"/"qrcode").
 */
export class ConferGoodsReceiptItemDto {
  @ApiProperty() @IsUUID() goodsReceiptItemId!: string;
  @ApiProperty() @IsNumber() @Min(0) acceptedQuantity!: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) rejectedQuantity?: number;
  @ApiPropertyOptional({ enum: ConferenceChannelDto, default: ConferenceChannelDto.manual })
  @IsOptional()
  conferredVia?: ConferenceChannelDto;
  @ApiPropertyOptional() @IsOptional() @IsString() occurrenceNotes?: string;
}

export class LookupByCodeDto {
  @ApiProperty({ description: 'Código de barras/QR Code lido pelo coletor' }) @IsString() code!: string;
}
