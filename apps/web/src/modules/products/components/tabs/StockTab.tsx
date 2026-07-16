import { useFormContext } from 'react-hook-form';
import { Package } from 'lucide-react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { StatsCard } from '@/components/ui/stats-card';
import type { ProductFormValues } from '../../schemas/product.schema';
import type { Product } from '../../types/product.types';

interface StockTabProps {
  product?: Product;
}

/**
 * Aba 3 — Estoque: parâmetros (mínimo/máximo/localização) são editáveis
 * aqui. O SALDO ATUAL é somente leitura nesta sprint (o Módulo de Estoque,
 * com depósitos/corredores/prateleiras e movimentações, é entrega de uma
 * sprint futura) — exibido a partir de `product.stocks`, quando existir.
 */
export function StockTab({ product }: StockTabProps) {
  const { register, formState: { errors } } = useFormContext<ProductFormValues>();
  const totalOnHand = product?.stocks?.reduce((sum, s) => sum + Number(s.quantityOnHand), 0) ?? 0;

  return (
    <div className="space-y-6">
      {product && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Estoque atual (todos os depósitos)" value={String(totalOnHand)} icon={Package} />
        </div>
      )}

      <Alert variant="info" title="Saldo somente leitura aqui">
        Estoque mínimo/máximo são parâmetros deste cadastro. O endereço logístico (depósito, corredor, prateleira) e
        as movimentações de entrada/saída são feitos no módulo Estoque, na aba correspondente do menu principal.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Estoque mínimo" error={errors.minStock?.message}>
          <Input type="number" step="0.0001" {...register('minStock')} className="font-numeric" />
        </FormField>
        <FormField label="Estoque máximo" error={errors.maxStock?.message}>
          <Input type="number" step="0.0001" {...register('maxStock')} className="font-numeric" />
        </FormField>
      </div>
    </div>
  );
}
