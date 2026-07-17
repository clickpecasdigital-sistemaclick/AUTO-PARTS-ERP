import { useMemo, useState } from 'react';
import { CheckCircle2, PackageCheck, PackageSearch, Search, ShoppingBag, Truck, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import {
  useApproveOrder,
  useCancelOrder,
  useCompleteSeparation,
  usePdvOrders,
  useShipOrder,
  useStartSeparation,
} from '../hooks/usePdv';
import { orderStatusLabels, separationStatusLabels, type SalesOrderStatus, type SeparationStatus } from '../types/pdv.types';

const statusVariant: Record<SalesOrderStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  pending: 'secondary',
  confirmed: 'warning',
  invoiced: 'success',
  cancelled: 'destructive',
};

const separationVariant: Record<SeparationStatus, 'secondary' | 'warning' | 'success'> = {
  pending: 'secondary',
  separating: 'warning',
  separated: 'success',
  shipped: 'success',
};

/** Pedidos — reserva automática de estoque, aprovação, separação, expedição (briefing). */
export default function PdvOrdersPage() {
  const { can } = usePermissions();
  const { data: orders, isLoading } = usePdvOrders();
  const approveOrder = useApproveOrder();
  const startSeparation = useStartSeparation();
  const completeSeparation = useCompleteSeparation();
  const shipOrder = useShipOrder();
  const cancelOrder = useCancelOrder();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    if (!orders) return orders;
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch =
        !term ||
        order.code.toLowerCase().includes(term) ||
        (order.customer.tradeName ?? order.customer.name).toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  return (
    <div>
      <PageHeader title="Pedidos de Venda" description="Reserva automática de estoque ao aprovar — separação e expedição rastreadas." />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número ou cliente..."
          leftIcon={<Search className="size-4" />}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(orderStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? null : !filteredOrders || filteredOrders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nenhum pedido encontrado" description="Ajuste os filtros ou aguarde novos pedidos aparecerem aqui." />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-medium">{order.code}</span>
                    <Badge variant={statusVariant[order.status]}>{orderStatusLabels[order.status]}</Badge>
                    <Badge variant={separationVariant[order.separationStatus]}>{separationStatusLabels[order.separationStatus]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{order.customer.tradeName ?? order.customer.name}</p>
                  <p className="text-xs text-muted-foreground font-numeric">{formatDate(order.createdAt)} · {formatCurrencyBRL(Number(order.totalAmount))}</p>
                </div>
                <div className="flex gap-2">
                  {order.status === 'pending' && can('sales', 'approve') && (
                    <Button size="sm" variant="outline" onClick={() => setApprovingId(order.id)}>
                      <CheckCircle2 /> Aprovar
                    </Button>
                  )}
                  {order.status === 'confirmed' && order.separationStatus === 'pending' && can('sales', 'update') && (
                    <Button size="sm" variant="outline" onClick={() => startSeparation.mutate(order.id)}>
                      <PackageSearch /> Iniciar separação
                    </Button>
                  )}
                  {order.separationStatus === 'separating' && can('sales', 'update') && (
                    <Button size="sm" variant="outline" onClick={() => completeSeparation.mutate(order.id)}>
                      <PackageCheck /> Concluir separação
                    </Button>
                  )}
                  {order.separationStatus === 'separated' && can('sales', 'update') && (
                    <Button size="sm" onClick={() => shipOrder.mutate(order.id)}>
                      <Truck /> Expedir
                    </Button>
                  )}
                  {order.status !== 'invoiced' && order.status !== 'cancelled' && can('sales', 'cancel') && (
                    <Button size="sm" variant="ghost" onClick={() => cancelOrder.mutate(order.id)}>
                      <X /> Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!approvingId} onOpenChange={(open) => !open && setApprovingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar pedido</DialogTitle>
          </DialogHeader>
          <Input value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} placeholder="Depósito (ID) para reserva de estoque" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (approvingId) await approveOrder.mutateAsync({ id: approvingId, warehouseId });
                setApprovingId(null);
                setWarehouseId('');
              }}
              isLoading={approveOrder.isPending}
              disabled={!warehouseId}
            >
              Aprovar e reservar estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
