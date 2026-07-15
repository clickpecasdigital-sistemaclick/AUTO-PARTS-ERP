import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useProductSearch } from '../hooks/usePdv';
import type { ProductSearchResult } from '../types/pdv.types';

interface PdvProductSearchProps {
  warehouseId?: string;
  onSelect: (product: ProductSearchResult) => void;
}

/**
 * Busca rápida do PDV (briefing: código interno/barras/OEM/fabricante/
 * descrição/marca, resposta <100ms via índice — `PdvSearchService`).
 * Atalho de teclado: `F2` foca este campo (ver `PdvSalePage`).
 */
export function PdvProductSearch({ warehouseId, onSelect }: PdvProductSearchProps) {
  const [term, setTerm] = useState('');
  const { data: results, isLoading } = useProductSearch(term);

  function handleSelect(product: ProductSearchResult) {
    onSelect(product);
    setTerm('');
  }

  return (
    <div className="relative">
      <Input
        id="pdv-search-input"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Código, código de barras, OEM, descrição ou marca... (F2)"
        leftIcon={<Search className="size-4" />}
        autoFocus
        className="font-numeric"
      />
      {term.trim().length >= 2 && (
        <Card className="absolute z-dropdown mt-1 max-h-80 w-full overflow-y-auto shadow-lg">
          {isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !results || results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          ) : (
            results.map((product) => {
              const stock = product.stocks.find((s) => s.warehouseId === warehouseId);
              const available = stock ? Number(stock.quantityOnHand) - Number(stock.quantityReserved) : null;
              return (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{product.shortDescription}</p>
                    <p className="font-numeric text-xs text-muted-foreground">
                      {product.internalCode} {product.brand && `· ${product.brand.name}`}
                      {available !== null && <span className={available <= 0 ? 'text-destructive' : ''}> · Disp: {available}</span>}
                    </p>
                  </div>
                  <span className="font-numeric font-medium">{formatCurrencyBRL(Number(product.salePrice))}</span>
                </button>
              );
            })
          )}
        </Card>
      )}
    </div>
  );
}
