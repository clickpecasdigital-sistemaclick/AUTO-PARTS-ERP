import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Plus, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/hooks/usePermissions';
import { httpClient } from '@/api/http.client';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { useBankSlips, useRegisterBankSlip, useSettleBankSlip, type BankSlipStatus } from '../services/bankslip.service';

const statusLabel: Record<BankSlipStatus, string> = { registered: 'Registrado', paid: 'Pago', overdue: 'Vencido', cancelled: 'Cancelado' };
const statusVariant: Record<BankSlipStatus, 'secondary' | 'success' | 'destructive' | 'warning'> = {
  registered: 'secondary',
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'warning',
};

/**
 * Emissão de Boletos — o registro interno (nosso número, vencimento,
 * status) já funciona de ponta a ponta. A geração do boleto real (código
 * de barras válido, linha digitável, envio pro banco) depende de
 * integração com o banco ou um gateway de cobrança — isso precisa de
 * credenciais reais que ainda não existem neste tenant, então fica como
 * o próximo passo natural depois que o financeiro configurar a conta
 * bancária (Configurações > Financeiro > Contas Bancárias).
 */
export default function BankSlipsPage() {
  const { can } = usePermissions();
  const { data: bankSlips, isLoading } = useBankSlips();
  const registerSlip = useRegisterBankSlip();
  const settleSlip = useSettleBankSlip();
  const { data: bankAccounts } = useQuery({
    queryKey: ['financial', 'bank-accounts'],
    queryFn: () => httpClient.get<{ id: string; bankName: string; alias?: string }[]>('/financial/banks/accounts'),
  });

  const [isOpen, setIsOpen] = useState(false);
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  async function handleRegister() {
    if (!bankAccountId || !amount || !dueDate) return;
    await registerSlip.mutateAsync({ bankAccountId, amount: Number(amount), dueDate });
    setIsOpen(false);
    setBankAccountId('');
    setAmount('');
    setDueDate('');
  }

  return (
    <div>
      <PageHeader
        title="Emissão de Boletos"
        description="Registro interno de boletos — vencimento, status e baixa manual. Emissão com código de barras real depende de configurar uma conta bancária com integração."
        actions={
          can('financial', 'create') && (
            <Button onClick={() => setIsOpen(true)} disabled={!bankAccounts?.length}>
              <Plus /> Registrar boleto
            </Button>
          )
        }
      />

      {!bankAccounts?.length && (
        <p className="mb-4 text-sm text-muted-foreground">
          Nenhuma conta bancária cadastrada ainda — configure uma em Financeiro antes de registrar boletos.
        </p>
      )}

      {isLoading ? null : !bankSlips || bankSlips.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhum boleto registrado" description="Registre um boleto vinculado a uma conta a receber ou avulso." />
      ) : (
        <div className="space-y-2">
          {bankSlips.map((slip) => (
            <Card key={slip.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-medium">{slip.ourNumber ?? '—'}</span>
                    <Badge variant={statusVariant[slip.status]}>{statusLabel[slip.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {slip.bankAccount.bankName} {slip.receivable?.customer && `· ${slip.receivable.customer.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-numeric text-sm">{formatCurrencyBRL(Number(slip.amount))}</span>
                  <span className="text-xs text-muted-foreground">Venc. {formatDate(slip.dueDate)}</span>
                  {slip.status === 'registered' && can('financial', 'update') && (
                    <Button size="sm" variant="outline" onClick={() => settleSlip.mutate(slip.id)}>
                      <CheckCircle2 className="size-4" /> Baixar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar boleto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Conta bancária" required>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.alias ?? acc.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Valor (R$)" required>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-numeric" />
            </FormField>
            <FormField label="Vencimento" required>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
          </div>
          <DialogFooter>
            <Button onClick={handleRegister} isLoading={registerSlip.isPending} disabled={!bankAccountId || !amount || !dueDate}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
