import { QRCodeSVG } from 'qrcode.react';
import { colors } from '@/config/design-tokens';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * QR Code — usado em etiquetas de produto/localização de estoque (leitura
 * por coletor/celular) e em comprovantes (ex: chave de acesso de NF-e em
 * formato QR para NFC-e). Wrapper sobre `qrcode.react` (gera SVG real,
 * não uma simulação visual).
 */
function QrCode({ value, size = 128, className }: QrCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      className={className}
      fgColor={colors.graphite[900]}
      bgColor="transparent"
      level="M"
      includeMargin
    />
  );
}

export { QrCode };
