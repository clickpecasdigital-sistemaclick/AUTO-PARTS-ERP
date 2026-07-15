import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/usePermissions';
import { useCancelOrder, useTransitionOrder } from '../hooks/useWorkshop';
import { serviceOrderStatusLabels, STATUS_FLOW, type ServiceOrder } from '../types/workshop.types';

interface StatusFlowBarProps {
  order: ServiceOrder;
}

/** Barra de transição de status — só mostra os próximos status válidos a partir do atual (mesmo STATUS_FLOW do backend). */
export function StatusFlowBar({ order }: StatusFlowBarProps) {
  const { can } = usePermissions();
  const transition = useTransitionOrder(order.id);
  const cancelOrder = useCancelOrder(order.id);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const nextOptions = STATUS_FLOW[order.status].filter((s) => s !== 'cancelled');
  const canTransition = can('workshop', order.status === 'awaiting_approval' ? 'approve' : 'update');

  if (!canTransition && order.status !== 'delivered' && order.status !== 'cancelled') return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Status atual: <strong>{serviceOrderStatusLabels[order.status]}</strong></span>
      {nextOptions.map((next) => (
        <Button key={next} size="sm" onClick={() => transition.mutate({ toStatus: next })} isLoading={transition.isPending}>
          {serviceOrderStatusLabels[next]} <ArrowRight className="size-3.5" />
        </Button>
      ))}
      {STATUS_FLOW[order.status].includes('cancelled') && can('workshop', 'cancel') && (
        <Button size="sm" variant="ghost" onClick={() => setIsCancelOpen(true)}>
          <X /> Cancelar OS
        </Button>
      )}

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Motivo do cancelamento" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await cancelOrder.mutateAsync(cancelReason);
                setIsCancelOpen(false);
              }}
              isLoading={cancelOrder.isPending}
              disabled={!cancelReason}
            >
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
