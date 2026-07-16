import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Save, User, X } from 'lucide-react';
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
import { useAddCartItem, useCancelCart, useCart, useCheckout, useOpenCart, useSetCartCustomer } from '../hooks/usePdv';
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
  const checkout = useCheckout(cartId ?? '');
  const cancelCart = useCancelCart(cartId ?? '');

  useKeyboardShortcut('F2', () => document.getElementById('pdv-search-input')?.focus());
  useKeyboardShortcut('F4', () => {
    if (cart && cart.items.length > 0) setIsPaymentOpen(true);
  });
  useKeyboardShortcut('F6', () => {
    if (cartId) cancelCart.mutate('Cancelado pelo operador (Ctrl+F6)');
  });

  async function handleStart() {
    if (!activeBranchId || !warehouseId) return;
    const created = await openCart.mutateAsync({ branchId: activeBranchId, payload: { mode, warehouseId } });
    setCartId(created.id);
  }

  function handleSelectProduct(product: ProductSearchResult) {
    if (!cartId) return;
    addItem.mutate({ productId: product.id, quantity: 1 });
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
              <Badge variant={creditVariant[cart.customer.creditStatus] ?? 'secondary'}>{cart.customer.creditStatus}</Badge>
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
              <Button className="w-full" size="lg" onClick={() => setIsPaymentOpen(true)} disabled={cart.items.length === 0}>
                <Save /> Finalizar venda (Ctrl+F4)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PdvPaymentDialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen} total={Number(cart.totalAmount)} onConfirm={handleConfirmPayment} isLoading={checkout.isPending} />
    </div>
  );
}
