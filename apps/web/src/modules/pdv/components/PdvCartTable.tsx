import { ShoppingCart, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useRemoveCartItem, useUpdateCartItem } from '../hooks/usePdv';
import type { Cart } from '../types/pdv.types';

interface PdvCartTableProps {
  cart: Cart;
}

/** Carrinho — cada item com produto, quantidade, unidade, preço, desconto, acréscimo (briefing). */
export function PdvCartTable({ cart }: PdvCartTableProps) {
  const updateItem = useUpdateCartItem(cart.id);
  const removeItem = useRemoveCartItem(cart.id);

  if (cart.items.length === 0) {
    return <EmptyState icon={ShoppingCart} title="Carrinho vazio" description="Busque um produto acima para iniciar a venda." />;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/50">
        <tr>
          <th className="p-2 text-left font-medium text-muted-foreground">Produto</th>
          <th className="p-2 text-left font-medium text-muted-foreground">Qtd</th>
          <th className="p-2 text-left font-medium text-muted-foreground">Preço</th>
          <th className="p-2 text-left font-medium text-muted-foreground">Desc. %</th>
          <th className="p-2 text-left font-medium text-muted-foreground">Total</th>
          <th className="p-2" />
        </tr>
      </thead>
      <tbody>
        {cart.items.map((item) => (
          <tr key={item.id} className="border-t border-border">
            <td className="p-2">
              <p className="font-medium">{item.product.shortDescription}</p>
              <p className="text-xs text-muted-foreground font-numeric">{item.product.internalCode} · {item.product.unit.code}</p>
            </td>
            <td className="p-2">
              <Input
                type="number"
                step="0.0001"
                defaultValue={Number(item.quantity)}
                className="w-20 font-numeric"
                onBlur={(e) => updateItem.mutate({ itemId: item.id, payload: { quantity: Number(e.target.value) } })}
              />
            </td>
            <td className="p-2">
              <Input
                type="number"
                step="0.01"
                defaultValue={Number(item.unitPrice)}
                className="w-24 font-numeric"
                onBlur={(e) => updateItem.mutate({ itemId: item.id, payload: { unitPrice: Number(e.target.value) } })}
              />
            </td>
            <td className="p-2">
              <Input
                type="number"
                step="0.1"
                defaultValue={Number(item.discountPercent)}
                className="w-16 font-numeric"
                onBlur={(e) => updateItem.mutate({ itemId: item.id, payload: { discountPercent: Number(e.target.value) } })}
              />
            </td>
            <td className="p-2 font-numeric font-medium">{formatCurrencyBRL(Number(item.totalAmount))}</td>
            <td className="p-2">
              <Button variant="ghost" size="icon-sm" onClick={() => removeItem.mutate(item.id)} aria-label="Remover item">
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
