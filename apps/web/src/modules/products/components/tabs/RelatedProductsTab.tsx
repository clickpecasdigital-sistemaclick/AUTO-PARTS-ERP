import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link2, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
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
import { useAddProductCrossReference, useProducts, useRemoveProductCrossReference } from '../../hooks/useProducts';
import { Autocomplete } from '@/components/ui/autocomplete';
import { productCrossReferenceSchema, type ProductCrossReferenceFormValues } from '../../schemas/product.schema';
import type { Product, ProductRelationType } from '../../types/product.types';

interface RelatedProductsTabProps {
  product: Product;
}

const typeLabels: Record<ProductRelationType, string> = {
  similar: 'Similar',
  equivalent: 'Equivalente',
  complementary: 'Complementar',
  substitute: 'Substituto',
};

const typeVariant: Record<ProductRelationType, 'secondary' | 'success' | 'default' | 'warning'> = {
  similar: 'secondary',
  equivalent: 'success',
  complementary: 'default',
  substitute: 'warning',
};

/**
 * Aba 8 — Produtos Relacionados: Similares, Equivalentes, Complementares e
 * Substitutos (`ProductCrossReference.type`, Sprint 05). A busca de produto
 * relacionado usa o código interno digitado diretamente (sem autocomplete
 * dedicado nesta sprint, para não introduzir um novo endpoint de busca
 * fora do já existente `GET /products`).
 */
export function RelatedProductsTab({ product }: RelatedProductsTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const addCrossReference = useAddProductCrossReference(product.id);
  const removeCrossReference = useRemoveProductCrossReference(product.id);

  const form = useForm<ProductCrossReferenceFormValues>({
    resolver: zodResolver(productCrossReferenceSchema),
    defaultValues: { type: 'similar' },
  });
  const { data: productOptions } = useProducts({ page: 1, perPage: 50 });

  async function onSubmit(values: ProductCrossReferenceFormValues) {
    await addCrossReference.mutateAsync(values);
    form.reset({ type: 'similar' });
    setIsOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{product.crossReferencesFrom.length} produto(s) relacionado(s).</p>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus /> Relacionar produto
        </Button>
      </div>

      {product.crossReferencesFrom.length === 0 ? (
        <EmptyState icon={Link2} title="Nenhum produto relacionado" description="Relacione produtos similares, equivalentes, complementares ou substitutos." />
      ) : (
        <div className="space-y-2">
          {product.crossReferencesFrom.map((ref) => (
            <Card key={ref.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={typeVariant[ref.type]}>{typeLabels[ref.type]}</Badge>
                    <Link to={`/produtos/${ref.relatedProductId}`} className="font-medium text-primary hover:underline">
                      {ref.relatedProduct.internalCode} — {ref.relatedProduct.shortDescription}
                    </Link>
                  </div>
                  {ref.notes && <p className="mt-1 text-sm text-muted-foreground">{ref.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCrossReference.mutate(ref.id)} aria-label="Remover relacionamento">
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
            <DialogTitle>Relacionar produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Produto relacionado" required error={form.formState.errors.relatedProductId?.message}>
              <Autocomplete
                value={form.watch('relatedProductId') ?? null}
                onChange={(v) => form.setValue('relatedProductId', v ?? '', { shouldValidate: true })}
                options={(productOptions?.data ?? []).filter((p) => p.id !== product.id).map((p) => ({ value: p.id, label: `${p.internalCode} — ${p.shortDescription}` }))}
                placeholder="Buscar produto..."
              />
            </FormField>
            <FormField label="Tipo de relação" required>
              <Select onValueChange={(v) => form.setValue('type', v as ProductRelationType)} value={form.watch('type')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Observações">
              <Input {...form.register('notes')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={addCrossReference.isPending}>
                Relacionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
