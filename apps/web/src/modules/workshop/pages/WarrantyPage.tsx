import { useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldOff, ShieldX } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate } from '@/utils/formatters';
import { useActiveWarranties, useClaimWarranty, useVoidWarranty, type Warranty } from '../services/warranty.service';

const statusLabel: Record<string, string> = { active: 'Ativa', expired: 'Vencida', claimed: 'Acionada', voided: 'Anulada' };
const statusVariant: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  active: 'success',
  expired: 'secondary',
  claimed: 'warning',
  voided: 'destructive',
};
const typeLabel: Record<string, string> = { part: 'Peça', service: 'Serviço' };

/** Garantias de peça/serviço vinculadas a Ordens de Serviço — acionar ou anular. Criar uma garantia nova acontece na própria OS (Oficina > Ordens de Serviço). */
export default function WarrantyPage() {
  const { can } = usePermissions();
  const { data: warranties, isLoading } = useActiveWarranties();
  const claimWarranty = useClaimWarranty();
  const voidWarranty = useVoidWarranty();

  const [claimTarget, setClaimTarget] = useState<Warranty | null>(null);
  const [voidTarget, setVoidTarget] = useState<Warranty | null>(null);
  const [claimCost, setClaimCost] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [voidReason, setVoidReason] = useState('');

  async function handleClaim() {
    if (!claimTarget) return;
    await claimWarranty.mutateAsync({ id: claimTarget.id, claimCost: claimCost ? Number(claimCost) : undefined, claimNotes: claimNotes || undefined });
    setClaimTarget(null);
    setClaimCost('');
    setClaimNotes('');
  }

  async function handleVoid() {
    if (!voidTarget || !voidReason) return;
    await voidWarranty.mutateAsync({ id: voidTarget.id, reason: voidReason });
    setVoidTarget(null);
    setVoidReason('');
  }

  const isExpiringSoon = (endDate: string) => {
    const daysLeft = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 7;
  };

  return (
    <div>
      <PageHeader
        title="Garantias"
        description="Garantias de peça/serviço ativas — acione quando o cliente retornar com o defeito coberto, ou anule se identificado uso indevido."
      />

      {isLoading ? null : !warranties || warranties.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nenhuma garantia ativa" description="Garantias são criadas ao concluir uma Ordem de Serviço." />
      ) : (
        <div className="space-y-2">
          {warranties.map((w) => (
            <Card key={w.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-medium">OS {w.serviceOrder.code}</span>
                    <Badge variant="outline">{typeLabel[w.type]}</Badge>
                    <Badge variant={statusVariant[w.status]}>{statusLabel[w.status]}</Badge>
                    {isExpiringSoon(w.endDate) && (
                      <Badge variant="warning">
                        <AlertTriangle className="mr-1 size-3" /> Vence em breve
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{w.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Válida até {formatDate(w.endDate)} ({w.termDays} dias)
                  </p>
                </div>
                {w.status === 'active' && can('workshop', 'update') && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setClaimTarget(w)}>
                      <ShieldX className="size-4" /> Acionar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setVoidTarget(w)}>
                      <ShieldOff className="size-4" /> Anular
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!claimTarget} onOpenChange={(open) => !open && setClaimTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acionar garantia — OS {claimTarget?.serviceOrder.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Custo do reparo em garantia (R$)">
              <Input type="number" step="0.01" value={claimCost} onChange={(e) => setClaimCost(e.target.value)} className="font-numeric" />
            </FormField>
            <FormField label="Observações">
              <Input value={claimNotes} onChange={(e) => setClaimNotes(e.target.value)} placeholder="Descreva o defeito relatado..." />
            </FormField>
          </div>
          <DialogFooter>
            <Button onClick={handleClaim} isLoading={claimWarranty.isPending}>
              Confirmar acionamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!voidTarget} onOpenChange={(open) => !open && setVoidTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular garantia — OS {voidTarget?.serviceOrder.code}</DialogTitle>
          </DialogHeader>
          <FormField label="Motivo da anulação" required>
            <Input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Ex: uso indevido, peça de terceiros..." />
          </FormField>
          <DialogFooter>
            <Button variant="destructive" onClick={handleVoid} isLoading={voidWarranty.isPending} disabled={!voidReason}>
              Confirmar anulação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
