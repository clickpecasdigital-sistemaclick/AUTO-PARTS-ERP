import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { MoneyInput } from '@/components/ui/masked-inputs';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Card, CardContent } from '@/components/ui/card';
import { useSupplierOptions } from '../../hooks/useCatalogs';
import type { ProductFormValues } from '../../schemas/product.schema';
import type { Product } from '../../types/product.types';

interface PricingTabProps {
  product?: Product;
}

function toCents(value: number | undefined): number {
  return Math.round((value ?? 0) * 100);
}

/** Aba 4 — Preços: custo, custo médio (somente leitura), venda, atacado, oficina, distribuidor, margem/markup. */
export function PricingTab({ product }: PricingTabProps) {
  const { watch, setValue } = useFormContext<ProductFormValues>();
  const { data: suppliers } = useSupplierOptions();

  const costPrice = watch('costPrice');
  const salePrice = watch('salePrice');
  const margin = costPrice && salePrice ? (((salePrice - costPrice) / salePrice) * 100).toFixed(2) : '0.00';
  const markup = costPrice ? (((salePrice - costPrice) / costPrice) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Preço de custo">
          <MoneyInput valueInCents={toCents(costPrice)} onValueChange={(cents) => setValue('costPrice', cents / 100)} />
        </FormField>
        <FormField label="Custo médio" hint="Calculado automaticamente pelas entradas de compra (somente leitura)">
          <MoneyInput valueInCents={toCents(product ? Number(product.averageCostPrice) : costPrice)} onValueChange={() => {}} disabled />
        </FormField>
        <FormField label="Preço de venda">
          <MoneyInput valueInCents={toCents(salePrice)} onValueChange={(cents) => setValue('salePrice', cents / 100)} />
        </FormField>
        <FormField label="Preço atacado">
          <MoneyInput valueInCents={toCents(watch('wholesalePrice'))} onValueChange={(cents) => setValue('wholesalePrice', cents / 100)} />
        </FormField>
        <FormField label="Preço oficina">
          <MoneyInput valueInCents={toCents(watch('workshopPrice'))} onValueChange={(cents) => setValue('workshopPrice', cents / 100)} />
        </FormField>
        <FormField label="Preço distribuidor">
          <MoneyInput valueInCents={toCents(watch('distributorPrice'))} onValueChange={(cents) => setValue('distributorPrice', cents / 100)} />
        </FormField>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <p className="text-label text-muted-foreground">Margem de lucro</p>
            <p className="font-numeric text-h3">{margin}%</p>
            <p className="text-xs text-muted-foreground">(venda − custo) ÷ venda</p>
          </div>
          <div>
            <p className="text-label text-muted-foreground">Markup</p>
            <p className="font-numeric text-h3">{markup}%</p>
            <p className="text-xs text-muted-foreground">(venda − custo) ÷ custo</p>
          </div>
        </CardContent>
      </Card>

      <FormField label="Fornecedor principal" className="max-w-md">
        <Autocomplete
          value={watch('primarySupplierId') || null}
          onChange={(value) => setValue('primarySupplierId', value ?? '')}
          options={(suppliers ?? []).map((s) => ({ value: s.id, label: s.name ?? '' }))}
          placeholder="Selecione o fornecedor principal"
        />
      </FormField>
    </div>
  );
}
