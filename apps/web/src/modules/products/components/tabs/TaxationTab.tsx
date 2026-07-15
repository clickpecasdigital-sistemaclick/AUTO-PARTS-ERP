import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { NcmInput, CfopInput } from '@/components/ui/masked-inputs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductFormValues } from '../../schemas/product.schema';

const originOptions: { value: ProductFormValues['origin']; label: string }[] = [
  { value: 'nacional', label: '0 — Nacional' },
  { value: 'estrangeira_importacao_direta', label: '1 — Estrangeira, importação direta' },
  { value: 'estrangeira_mercado_interno', label: '2 — Estrangeira, mercado interno' },
  { value: 'nacional_importacao_acima_40', label: '3 — Nacional, conteúdo importado > 40%' },
  { value: 'nacional_processos_produtivos', label: '4 — Nacional, processos produtivos básicos' },
  { value: 'nacional_importacao_menor_40', label: '5 — Nacional, conteúdo importado ≤ 40%' },
  { value: 'estrangeira_sem_similar_nacional', label: '6 — Estrangeira, sem similar nacional' },
  { value: 'estrangeira_sem_similar_mercado', label: '7 — Estrangeira, sem similar, mercado interno' },
  { value: 'nacional_conteudo_importacao_70', label: '8 — Nacional, conteúdo importado > 70%' },
];

/** Aba 2 — Tributação: NCM, CEST, CFOP/CST/CSOSN padrão, origem e alíquotas. */
export function TaxationTab() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProductFormValues>();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField label="NCM" hint="Nomenclatura Comum do Mercosul">
        <NcmInput value={watch('ncmCode') ?? ''} onValueChange={(v) => setValue('ncmCode', v)} />
      </FormField>
      <FormField label="CEST">
        <Input {...register('cestCode')} placeholder="0000000" />
      </FormField>
      <FormField label="CFOP padrão">
        <CfopInput value={watch('defaultCfopCode') ?? ''} onValueChange={(v) => setValue('defaultCfopCode', v)} />
      </FormField>
      <FormField label="CST padrão" hint="Regime normal (Lucro Real/Presumido)">
        <Input {...register('defaultCstCode')} placeholder="00" />
      </FormField>
      <FormField label="CSOSN padrão" hint="Regime Simples Nacional">
        <Input {...register('defaultCsosnCode')} placeholder="101" />
      </FormField>
      <FormField label="Origem da mercadoria" required error={errors.origin?.message}>
        <Select onValueChange={(v) => setValue('origin', v as ProductFormValues['origin'])} value={watch('origin')}>
          <SelectTrigger error={!!errors.origin}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {originOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="IPI (%)">
        <Input type="number" step="0.0001" {...register('ipiRate')} className="font-numeric" />
      </FormField>
      <FormField label="ICMS (%)">
        <Input type="number" step="0.0001" {...register('icmsRate')} className="font-numeric" />
      </FormField>
      <FormField label="PIS (%)">
        <Input type="number" step="0.0001" {...register('pisRate')} className="font-numeric" />
      </FormField>
      <FormField label="COFINS (%)">
        <Input type="number" step="0.0001" {...register('cofinsRate')} className="font-numeric" />
      </FormField>
    </div>
  );
}
