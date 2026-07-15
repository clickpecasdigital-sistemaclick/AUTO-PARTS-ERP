import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBrands, useManufacturers, useProductCategories, useProductGroups, useProductSubgroups, useUnits } from '../../hooks/useCatalogs';
import type { ProductFormValues } from '../../schemas/product.schema';

/** Aba 1 — Dados Gerais: identificação, códigos, classificação e dimensões. */
export function GeneralTab() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProductFormValues>();
  const groupId = watch('groupId');

  const { data: brands } = useBrands();
  const { data: manufacturers } = useManufacturers();
  const { data: units } = useUnits();
  const { data: groups } = useProductGroups();
  const { data: subgroups } = useProductSubgroups(groupId || undefined);
  const { data: categories } = useProductCategories();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField label="Código interno" hint="Gerado automaticamente se deixado em branco" className="sm:col-span-1">
        <Input {...register('internalCode')} placeholder="PRD-000001" />
      </FormField>
      <FormField label="Código de barras (EAN/GTIN)">
        <Input {...register('barcode')} />
      </FormField>
      <FormField label="Código do fabricante">
        <Input {...register('manufacturerCode')} />
      </FormField>
      <FormField label="Código original (OEM)">
        <Input {...register('originalCode')} />
      </FormField>
      <FormField label="Código similar">
        <Input {...register('similarCode')} />
      </FormField>
      <FormField label="Unidade de medida" required error={errors.unitId?.message}>
        <Select onValueChange={(v) => setValue('unitId', v)} value={watch('unitId') || undefined}>
          <SelectTrigger error={!!errors.unitId}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {units?.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.code} — {unit.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Descrição curta" required error={errors.shortDescription?.message} className="sm:col-span-2 lg:col-span-3">
        <Input {...register('shortDescription')} error={!!errors.shortDescription} placeholder="Ex: Pastilha de freio dianteira" />
      </FormField>
      <FormField label="Descrição completa" className="sm:col-span-2 lg:col-span-3">
        <Textarea {...register('fullDescription')} rows={3} />
      </FormField>

      <FormField label="Marca">
        <Select onValueChange={(v) => setValue('brandId', v)} value={watch('brandId') || undefined}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {brands?.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Fabricante">
        <Select onValueChange={(v) => setValue('manufacturerId', v)} value={watch('manufacturerId') || undefined}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {manufacturers?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Categoria">
        <Select onValueChange={(v) => setValue('categoryId', v)} value={watch('categoryId') || undefined}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Grupo">
        <Select
          onValueChange={(v) => {
            setValue('groupId', v);
            setValue('subgroupId', '');
          }}
          value={watch('groupId') || undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {groups?.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Subgrupo" hint={!groupId ? 'Selecione um grupo primeiro' : undefined}>
        <Select onValueChange={(v) => setValue('subgroupId', v)} value={watch('subgroupId') || undefined} disabled={!groupId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {subgroups?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Peso (kg)">
        <Input type="number" step="0.001" {...register('weightKg')} className="font-numeric" />
      </FormField>
      <FormField label="Altura (cm)">
        <Input type="number" step="0.01" {...register('heightCm')} className="font-numeric" />
      </FormField>
      <FormField label="Largura (cm)">
        <Input type="number" step="0.01" {...register('widthCm')} className="font-numeric" />
      </FormField>
      <FormField label="Comprimento (cm)">
        <Input type="number" step="0.01" {...register('lengthCm')} className="font-numeric" />
      </FormField>
      <FormField label="Garantia (dias)">
        <Input type="number" {...register('warrantyDays')} className="font-numeric" />
      </FormField>

      <FormField label="Observações" className="sm:col-span-2 lg:col-span-3">
        <Textarea {...register('notes')} rows={2} />
      </FormField>
    </div>
  );
}
