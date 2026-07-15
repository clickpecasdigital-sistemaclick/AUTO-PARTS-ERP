import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/masked-inputs';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useSupplierOptions } from '../../hooks/useCatalogs';
import { useAddProductSupplier, useRemoveProductSupplier } from '../../hooks/useProducts';
import { productSupplierSchema, type ProductSupplierFormValues } from '../../schemas/product.schema';
import type { Product } from '../../types/product.types';

interface SuppliersTabProps {
  product: Product;
}

/** Aba 5 — Fornecedores: fornecedor principal (definido na aba Preços) + fornecedores alternativos. */
export function SuppliersTab({ product }: SuppliersTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: supplierOptions } = useSupplierOptions();
  const addSupplier = useAddProductSupplier(product.id);
  const removeSupplier = useRemoveProductSupplier(product.id);

  const form = useForm<ProductSupplierFormValues>({
    resolver: zodResolver(productSupplierSchema),
    defaultValues: { isPreferred: false },
  });

  async function onSubmit(values: ProductSupplierFormValues) {
    await addSupplier.mutateAsync(values);
    form.reset({ isPreferred: false });
    setIsOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Fornecedor principal</p>
          <p className="text-sm text-muted-foreground">
            {product.primarySupplier?.tradeName ?? product.primarySupplier?.name ?? 'Defina na aba "Preços"'}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus /> Fornecedor alternativo
        </Button>
      </div>

      {product.suppliers.length === 0 ? (
        <EmptyState title="Nenhum fornecedor alternativo" description="Cadastre fornecedores alternativos com código, último custo e prazo de entrega." />
      ) : (
        <div className="space-y-2">
          {product.suppliers.map((link) => (
            <Card key={link.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    {link.supplier.tradeName ?? link.supplier.name}
                    {link.isPreferred && <Badge variant="warning"><Star className="size-3" /> Preferido</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {link.supplierSku && `Código: ${link.supplierSku} · `}
                    {link.lastPurchasePrice && `Último custo: R$ ${Number(link.lastPurchasePrice).toFixed(2)} · `}
                    {link.leadTimeDays !== null && link.leadTimeDays !== undefined && `Prazo: ${link.leadTimeDays} dia(s)`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeSupplier.mutate(link.id)} aria-label="Remover fornecedor">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular fornecedor alternativo</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Fornecedor" required error={form.formState.errors.supplierId?.message}>
              <Autocomplete
                value={form.watch('supplierId') || null}
                onChange={(value) => form.setValue('supplierId', value ?? '')}
                options={(supplierOptions ?? []).map((s) => ({ value: s.id, label: s.name ?? '' }))}
              />
            </FormField>
            <FormField label="Código no fornecedor">
              <Input {...form.register('supplierSku')} />
            </FormField>
            <FormField label="Último custo">
              <MoneyInput
                valueInCents={Math.round((form.watch('lastPurchasePrice') ?? 0) * 100)}
                onValueChange={(cents) => form.setValue('lastPurchasePrice', cents / 100)}
              />
            </FormField>
            <FormField label="Prazo de entrega (dias)">
              <Input type="number" {...form.register('leadTimeDays')} className="font-numeric" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={addSupplier.isPending}>
                Vincular
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
