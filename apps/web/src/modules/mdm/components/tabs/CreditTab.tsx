import { useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { MoneyInput } from '@/components/ui/masked-inputs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useCreditHistory, useCreditProfile, useRefreshCredit, useUpdateCreditLimit } from '../../hooks/useMdm';

interface CreditTabProps {
  customerId: string;
  creditLimit: number;
}

/** Aba Crédito — limite, saldo, dias de atraso, maior compra, ticket médio, score e histórico (briefing). */
export function CreditTab({ customerId, creditLimit }: CreditTabProps) {
  const { can } = usePermissions();
  const { data: profile, isLoading } = useCreditProfile(customerId);
  const { data: history } = useCreditHistory(customerId);
  const refresh = useRefreshCredit(customerId);
  const updateLimit = useUpdateCreditLimit(customerId);
  const [isOpen, setIsOpen] = useState(false);
  const [newLimitCents, setNewLimitCents] = useState(Math.round(creditLimit * 100));

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Score de crédito: <span className="font-numeric font-medium text-foreground">{profile?.creditScore ?? 0}/1000</span></p>
        {can('customers', 'update') && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refresh.mutate()} isLoading={refresh.isPending}>
              <RefreshCw /> Recalcular
            </Button>
            <Button size="sm" onClick={() => setIsOpen(true)}>
              <TrendingUp /> Alterar limite
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Limite de crédito</p>
            <p className="font-numeric text-h3">{formatCurrencyBRL(profile?.creditLimit ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo disponível</p>
            <p className="font-numeric text-h3">{formatCurrencyBRL(profile?.availableBalance ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Dias de atraso</p>
            <p className={`font-numeric text-h3 ${(profile?.overdueDays ?? 0) > 0 ? 'text-destructive' : ''}`}>{profile?.overdueDays ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Maior compra</p>
            <p className="font-numeric text-h3">{formatCurrencyBRL(profile?.largestPurchaseValue ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="font-numeric text-h3">{formatCurrencyBRL(profile?.averageTicketValue ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Qtd. de compras</p>
            <p className="font-numeric text-h3">{profile?.totalPurchasesCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Histórico de alterações de crédito</p>
        {!history || history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
        ) : (
          <div className="space-y-1">
            {history.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant={event.type === 'automatic_block' ? 'destructive' : 'secondary'}>{event.type}</Badge>
                  {event.reason}
                </span>
                <span className="font-numeric text-xs text-muted-foreground">{formatDate(event.createdAt, true)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar limite de crédito</DialogTitle>
          </DialogHeader>
          <FormField label="Novo limite">
            <MoneyInput valueInCents={newLimitCents} onValueChange={setNewLimitCents} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                await updateLimit.mutateAsync({ newLimit: newLimitCents / 100 });
                setIsOpen(false);
              }}
              isLoading={updateLimit.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
