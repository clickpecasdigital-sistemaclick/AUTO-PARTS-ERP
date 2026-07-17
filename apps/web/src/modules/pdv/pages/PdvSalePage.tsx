import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, History, Save, Sparkles, User, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useWarehouses } from '@/modules/inventory/hooks/useInventory';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useCustomers } from '@/modules/mdm/hooks/useMdm';
import { PdvProductSearch } from '../components/PdvProductSearch';
import { PdvCartTable } from '../components/PdvCartTable';
import { PdvPaymentDialog } from '../components/PdvPaymentDialog';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAddCartItem, useCancelCart, useCart, useCheckout, useOpenCart, useSetCartCustomer, useSetCartDiscount, useRelatedProducts, useFrequentlyBoughtTogether, useCustomerRecentPurchases } from '../hooks/usePdv';
import { saleModeLabels, type ProductSearchResult, type SaleMode } from '../types/pdv.types';

const creditVariant: Record<string, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  not_analyzed: 'secondary',
  approved: 'success',
  under_review: 'warning',
  restricted: 'warning',
  blocked: 'destructive',
};

/**
 * Tela do PDV — Balcão/Oficina/Rápida/Futura/Televendas/Pré-venda
 * (briefing). Layout: pesquisa → carrinho → dados do cliente/veículo →
 * resumo financeiro/totalizadores, na ordem pedida no briefing.
 *
 * Atalhos de teclado: `Ctrl+F2` foca a busca, `Ctrl+F4` abre o
 * pagamento, `Ctrl+F6` cancela a venda em aberto. Usam Ctrl como
 * modificador (infraestrutura `useKeyboardShortcut`, Sprint 04, exige
 * Ctrl/Cmd) — o que também evita colidir com atalhos nativos do navegador
 * (F5 recarrega, F6 foca a barra de endereço em alguns navegadores, etc.),
 * mais robusto que tecla F sozinha em um PDV web.
 */
export default function PdvSalePage() {
  const navigate = useNavigate();
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const [cartId, setCartId] = useState<string | null>(null);
  const [mode, setMode] = useState<SaleMode>('balcony');
  const [warehouseId, setWarehouseId] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const { data: warehouses } = useWarehouses();
  const { data: customerOptions } = useCustomers({ page: 1, perPage: 50 });
  const { data: cart, isLoading } = useCart(cartId ?? undefined);

  useEffect(() => {
    if (warehouseId || !warehouses?.length) return;
    const defaultWarehouse = warehouses.find((w) => w.isDefault) ?? warehouses[0];
    setWarehouseId(defaultWarehouse.id);
  }, [warehouses, warehouseId]);
  const openCart = useOpenCart();
  const addItem = useAddCartItem(cartId ?? '');
  const setCustomer = useSetCartCustomer(cartId ?? '');
  const setDiscount = useSetCartDiscount(cartId ?? '');
  const checkout = useCheckout(cartId ?? '');
  const cancelCart = useCancelCart(cartId ?? '');
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [lastAddedProductId, setLastAddedProductId] = useState<string | undefined>();
  const { data: relatedProducts } = useRelatedProducts(lastAddedProductId, cart?.warehouseId ?? undefined);
  const { data: frequentlyBought } = useFrequentlyBoughtTogether(lastAddedProductId);
  const { data: recentPurchases } = useCustomerRecentPurchases(cart?.customerId);

  useKeyboardShortcut('F2', () => document.getElementById('pdv-search-input')?.focus());
  useKeyboardShortcut('F4', () => {
    if (cart && cart.items.length > 0) setIsPaymentOpen(true);
  });
  useKeyboardShortcut('F5', () => {
    if (cart && cart.items.length > 0) setIsDiscountOpen(true);
  });
  useKeyboardShortcut('F6', () => {
    if (cartId) cancelCart.mutate('Cancelado pelo operador (Ctrl+F6)');
  });
  useKeyboardShortcut('Escape', () => setIsDiscountOpen(false), { meta: false, ctrl: false });

  async function handleApplyDiscount() {
    if (!discountValue) return;
    await setDiscount.mutateAsync({ discountAmount: Number(discountValue), reason: discountReason || undefined });
    setIsDiscountOpen(false);
    setDiscountValue('');
    setDiscountReason('');
  }

  async function handleStart() {
    if (!activeBranchId || !warehouseId) return;
    const created = await openCart.mutateAsync({ branchId: activeBranchId, payload: { mode, warehouseId } });
    setCartId(created.id);
  }

  function handleSelectProduct(product: ProductSearchResult) {
    if (!cartId) return;
    addItem.mutate({ productId: product.id, quantity: 1 });
    setLastAddedProductId(product.id);
  }

  async function handleConfirmPayment(payments: { paymentMethodId: string; amount: number; installments: number }[]) {
    await checkout.mutateAsync({ payments });
    setIsPaymentOpen(false);
    setCartId(null);
    navigate('/pdv', { replace: true });
  }

  if (!cartId) {
    return (
      <div>
        <PageHeader title="PDV — Nova Venda" description="Selecione o modo de operação e o depósito para iniciar." />
        <Card className="max-w-md">
          <CardContent className="space-y-4 p-6">
            <FormField label="Modo de operação" required>
              <Select onValueChange={(v) => setMode(v as SaleMode)} value={mode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(saleModeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Depósito" required>
              <Select onValueChange={setWarehouseId} value={warehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o depósito" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <Button className="w-full" onClick={handleStart} isLoading={openCart.isPending} disabled={!warehouseId}>
              Iniciar venda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !cart) return <LoadingScreen message="Carregando venda..." fullScreen={false} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${saleModeLabels[cart.mode]} — ${cart.code}`}
        actions={
          <Button variant="ghost" onClick={() => cancelCart.mutate('Cancelado pelo operador')}>
            <X /> Cancelar (Ctrl+F6)
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <PdvProductSearch warehouseId={cart.warehouseId ?? undefined} onSelect={handleSelectProduct} />
          <Card>
            <CardContent className="p-0">
              <PdvCartTable cart={cart} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <User className="size-4" /> Cliente
              </p>
              <p className="text-sm">{cart.customer.tradeName ?? cart.customer.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant={creditVariant[cart.customer.creditStatus] ?? 'secondary'}>{cart.customer.creditStatus}</Badge>
                <span className="text-xs text-muted-foreground">Limite: {formatCurrencyBRL(Number(cart.customer.creditLimit))}</span>
              </div>
              <Autocomplete
                value={null}
                onChange={(v) => v && setCustomer.mutate({ customerId: v })}
                options={(customerOptions?.data ?? []).map((c) => ({ value: c.id, label: c.tradeName ?? c.name }))}
                placeholder="Trocar cliente..."
              />
              {cart.customerVehicle && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Car className="size-3" /> {cart.customerVehicle.plate}
                </p>
              )}
            </CardContent>
          </Card>

          {!!recentPurchases?.length && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <History className="size-4" /> Últimas compras do cliente
                </p>
                {recentPurchases.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => cartId && addItem.mutate({ productId: item.product.id, quantity: 1 })}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    <span>{item.product.shortDescription}</span>
                    <span className="font-numeric text-muted-foreground">{formatCurrencyBRL(Number(item.product.salePrice))}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {(!!relatedProducts?.length || !!frequentlyBought?.length) && (
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="size-4" /> Sugestões pra esse item
                </p>
                {!!relatedProducts?.length && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Similares / equivalentes / substitutos</p>
                    {relatedProducts.map((r) => {
                      const onHand = r.product.stocks.reduce((sum, s) => sum + Number(s.quantityOnHand) - Number(s.quantityReserved), 0);
                      return (
                        <button
                          key={r.product.id}
                          onClick={() => cartId && addItem.mutate({ productId: r.product.id, quantity: 1 })}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
                        >
                          <span>{r.product.shortDescription}</span>
                          <span className={`font-numeric ${onHand > 0 ? 'text-muted-foreground' : 'text-destructive'}`}>{onHand > 0 ? `${onHand} disp.` : 'sem estoque'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {!!frequentlyBought?.length && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Vendidos junto com esse item</p>
                    {frequentlyBought.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => cartId && addItem.mutate({ productId: p.id, quantity: 1 })}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>{p.shortDescription}</span>
                        <span className="font-numeric text-muted-foreground">{formatCurrencyBRL(Number(p.salePrice))}</span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium">Resumo financeiro</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-numeric">{formatCurrencyBRL(Number(cart.subtotalAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="font-numeric">{formatCurrencyBRL(Number(cart.discountAmount))}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="font-numeric">{formatCurrencyBRL(Number(cart.totalAmount))}</span>
              </div>
              {(() => {
                const totalCost = cart.items.reduce((sum, i) => sum + Number(i.product.averageCostPrice ?? 0) * Number(i.quantity), 0);
                const profit = Number(cart.totalAmount) - totalCost;
                const margin = Number(cart.totalAmount) > 0 ? (profit / Number(cart.totalAmount)) * 100 : 0;
                return cart.items.length > 0 ? (
                  <div className="flex justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                    <span>Lucro estimado</span>
                    <span className="font-numeric">
                      {formatCurrencyBRL(profit)} ({margin.toFixed(1)}%)
                    </span>
                  </div>
                ) : null;
              })()}
              <Button variant="outline" className="w-full" onClick={() => setIsDiscountOpen(true)} disabled={cart.items.length === 0}>
                Aplicar desconto (Ctrl+F5)
              </Button>
              <Button className="w-full" size="lg" onClick={() => setIsPaymentOpen(true)} disabled={cart.items.length === 0}>
                <Save /> Finalizar venda (Ctrl+F4)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PdvPaymentDialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen} total={Number(cart.totalAmount)} onConfirm={handleConfirmPayment} isLoading={checkout.isPending} />

      <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar desconto na venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Valor do desconto (R$)" required>
              <Input type="number" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="font-numeric" autoFocus />
            </FormField>
            <FormField label="Motivo">
              <Input value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="Ex: cliente fidelidade, negociação..." />
            </FormField>
          </div>
          <DialogFooter>
            <Button onClick={handleApplyDiscount} isLoading={setDiscount.isPending} disabled={!discountValue}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
