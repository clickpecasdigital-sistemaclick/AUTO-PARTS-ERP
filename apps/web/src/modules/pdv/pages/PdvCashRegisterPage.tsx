import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Lock, Unlock, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/masked-inputs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import {
  useAddCashMovement,
  useClosingSummary,
  useCloseRegister,
  useOpenRegister,
  useOpenRegisters,
  useReconcileRegister,
} from '../hooks/usePdv';

/** Caixa — abertura, fechamento, sangria, suprimento, conferência (briefing). */
export default function PdvCashRegisterPage() {
  const { can } = usePermissions();
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const { data: registers, isLoading } = useOpenRegisters(activeBranchId ?? undefined);
  const openRegister = useOpenRegister();
  const closeRegister = useCloseRegister();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: summary } = useClosingSummary(selectedId ?? undefined);
  const addMovement = useAddCashMovement(selectedId ?? '');
  const reconcile = useReconcileRegister(selectedId ?? '');

  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [openingAmountCents, setOpeningAmountCents] = useState(0);
  const [isMovementOpen, setIsMovementOpen] = useState<'reinforcement' | 'withdrawal' | null>(null);
  const [movementAmountCents, setMovementAmountCents] = useState(0);
  const [movementDescription, setMovementDescription] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closingAmountCents, setClosingAmountCents] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});

  return (
    <div>
      <PageHeader
        title="Caixa"
        description="Abertura, fechamento, sangria, suprimento e conferência por forma de pagamento."
        actions={
          can('sales', 'create') && (
            <Button onClick={() => setIsOpenDialog(true)}>
              <Unlock /> Abrir caixa
            </Button>
          )
        }
      />

      {isLoading ? null : !registers || registers.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhum caixa aberto" description="Abra um caixa para começar a registrar vendas." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {registers.map((register) => (
              <Card
                key={register.id}
                className={`cursor-pointer transition-shadow duration-base hover:shadow-md ${selectedId === register.id ? 'ring-1 ring-primary' : ''}`}
                onClick={() => setSelectedId(register.id)}
              >
                <CardContent className="p-4">
                  <p className="font-numeric font-medium">{formatCurrencyBRL(Number(register.openingAmount))} de abertura</p>
                  <p className="text-xs text-muted-foreground font-numeric">{formatDate(register.openedAt, true)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedId && summary && (
            <Card>
              <CardContent className="space-y-4 p-4">
                <p className="text-sm font-medium">Resumo esperado</p>
                {summary.byPaymentMethod.map((method) => (
                  <div key={method.paymentMethodId} className="flex items-center justify-between gap-2 text-sm">
                    <span>{method.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-numeric text-muted-foreground">{formatCurrencyBRL(method.expected)}</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Contado"
                        className="w-24 font-numeric"
                        onChange={(e) => setCounts((c) => ({ ...c, [method.paymentMethodId]: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-sm font-medium">
                  <span>Total esperado em dinheiro</span>
                  <span className="font-numeric">{formatCurrencyBRL(summary.estimatedCashExpected)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsMovementOpen('reinforcement')}>
                    <ArrowUpCircle /> Suprimento
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsMovementOpen('withdrawal')}>
                    <ArrowDownCircle /> Sangria
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reconcile.mutate(Object.entries(counts).map(([paymentMethodId, countedAmount]) => ({ paymentMethodId, countedAmount })))}
                    isLoading={reconcile.isPending}
                  >
                    Registrar conferência
                  </Button>
                  {can('sales', 'update') && (
                    <Button size="sm" onClick={() => setIsClosing(true)}>
                      <Lock /> Fechar caixa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caixa</DialogTitle>
          </DialogHeader>
          <FormField label="Valor de abertura">
            <MoneyInput valueInCents={openingAmountCents} onValueChange={setOpeningAmountCents} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!activeBranchId) return;
                await openRegister.mutateAsync({ branchId: activeBranchId, openingAmount: openingAmountCents / 100 });
                setIsOpenDialog(false);
              }}
              isLoading={openRegister.isPending}
            >
              Abrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!isMovementOpen} onOpenChange={(open) => !open && setIsMovementOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isMovementOpen === 'reinforcement' ? 'Suprimento' : 'Sangria'}</DialogTitle>
          </DialogHeader>
          <FormField label="Valor">
            <MoneyInput valueInCents={movementAmountCents} onValueChange={setMovementAmountCents} />
          </FormField>
          <FormField label="Descrição">
            <Input value={movementDescription} onChange={(e) => setMovementDescription(e.target.value)} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementOpen(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (isMovementOpen) await addMovement.mutateAsync({ type: isMovementOpen, amount: movementAmountCents / 100, description: movementDescription });
                setIsMovementOpen(null);
                setMovementAmountCents(0);
                setMovementDescription('');
              }}
              isLoading={addMovement.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isClosing} onOpenChange={setIsClosing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar caixa</DialogTitle>
          </DialogHeader>
          <FormField label="Valor contado em dinheiro">
            <MoneyInput valueInCents={closingAmountCents} onValueChange={setClosingAmountCents} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClosing(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (selectedId) await closeRegister.mutateAsync({ id: selectedId, closingAmount: closingAmountCents / 100 });
                setIsClosing(false);
                setSelectedId(null);
              }}
              isLoading={closeRegister.isPending}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
