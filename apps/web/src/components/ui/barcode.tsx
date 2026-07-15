import Barcode from 'react-barcode';
import { colors } from '@/config/design-tokens';

interface BarcodeDisplayProps {
  value: string;
  /** Formato do código (Code128 cobre a esmagadora maioria dos casos de etiqueta interna; EAN13 para GTIN/EAN do produto). */
  format?: 'CODE128' | 'EAN13';
  height?: number;
  className?: string;
}

/**
 * Código de barras — impressão de etiqueta de produto (código interno ou
 * EAN/GTIN). Wrapper sobre `react-barcode` (gera SVG real seguindo o
 * padrão do formato escolhido).
 */
function BarcodeDisplay({ value, format = 'CODE128', height = 60, className }: BarcodeDisplayProps) {
  return (
    <div className={className}>
      <Barcode
        value={value}
        format={format}
        height={height}
        width={1.6}
        fontSize={12}
        lineColor={colors.graphite[900]}
        background="transparent"
      />
    </div>
  );
}

export { BarcodeDisplay };
