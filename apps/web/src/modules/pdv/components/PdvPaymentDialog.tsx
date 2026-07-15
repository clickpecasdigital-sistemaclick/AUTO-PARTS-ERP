import { useState } from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { MoneyInput } from '@/components/ui/masked-inputs';
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
import { formatCurrencyBRL } from '@/utils/formatters';
import { usePaymentMethods } from '../hooks/usePdv';

interface PaymentLine {
  paymentMethodId: string;
  amount: number;
  installments: number;
}

interface PdvPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (payments: PaymentLine[]) => void;
  isLoading?: boolean;
}

/** Pagamento — dinheiro, PIX, débito, crédito, boleto, crediário, vale, múltiplas formas na mesma venda (briefing). Atalho: F4 abre este diálogo. */
export function PdvPaymentDialog({ open, onOpenChange, total, onConfirm, isLoading }: PdvPaymentDialogProps) {
  const { data: methods } = usePaymentMethods();
  const [lines, setLines] = useState<PaymentLine[]>([{ paymentMethodId: '', amount: total, installments: 1 }]);

  const paidSoFar = lines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const remaining = total - paidSoFar;

  function addLine() {
    setLines((prev) => [...prev, { paymentMethodId: '', amount: Math.max(0, remaining), installments: 1 }]);
  }

  function updateLine(index: number, patch: Partial<PaymentLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-4" /> Pagamento — Total {formatCurrencyBRL(total)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {lines.map((line, index) => {
            const method = methods?.find((m) => m.id === line.paymentMethodId);
            const showInstallments = method?.kind === 'credit_card' || method?.kind === 'in_house_installment' || method?.kind === 'bank_slip';
            return (
              <div key={index} className="grid grid-cols-[2fr_1fr_auto_auto] items-end gap-2">
                <FormField label="Forma">
                  <Select onValueChange={(v) => updateLine(index, { paymentMethodId: v })} value={line.paymentMethodId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {methods?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Valor">
                  <MoneyInput valueInCents={Math.round(line.amount * 100)} onValueChange={(cents) => updateLine(index, { amount: cents / 100 })} />
                </FormField>
                {showInstallments && (
                  <FormField label="Parcelas">
                    <Input type="number" min={1} className="w-16 font-numeric" value={line.installments} onChange={(e) => updateLine(index, { installments: Number(e.target.value) })} />
                  </FormField>
                )}
                {lines.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeLine(index)} aria-label="Remover forma de pagamento">
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}

          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus /> Adicionar forma de pagamento
          </Button>

          <div className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
            <span>Restante</span>
            <span className={`font-numeric font-medium ${remaining > 0.01 ? 'text-destructive' : 'text-success'}`}>{formatCurrencyBRL(remaining)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(lines.filter((l) => l.paymentMethodId && l.amount > 0))} isLoading={isLoading} disabled={remaining > 0.01 || lines.some((l) => !l.paymentMethodId)}>
            Finalizar venda (F4)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
