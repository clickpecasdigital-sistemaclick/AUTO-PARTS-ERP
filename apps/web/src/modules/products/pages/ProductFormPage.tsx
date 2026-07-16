import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/utils/toast';
import { useCreateProduct, useProduct, useUpdateProduct } from '../hooks/useProducts';
import { productFormSchema, type ProductFormValues } from '../schemas/product.schema';
import { GeneralTab } from '../components/tabs/GeneralTab';
import { TaxationTab } from '../components/tabs/TaxationTab';
import { StockTab } from '../components/tabs/StockTab';
import { PricingTab } from '../components/tabs/PricingTab';
import { SuppliersTab } from '../components/tabs/SuppliersTab';
import { ApplicationsTab } from '../components/tabs/ApplicationsTab';
import { PhotosTab } from '../components/tabs/PhotosTab';
import { RelatedProductsTab } from '../components/tabs/RelatedProductsTab';
import { HistoryTab } from '../components/tabs/HistoryTab';

const DEFAULT_VALUES: Partial<ProductFormValues> = {
  origin: 'nacional',
  isActive: true,
  ipiRate: 0,
  icmsRate: 0,
  pisRate: 0,
  cofinsRate: 0,
  minStock: 0,
  costPrice: 0,
  salePrice: 0,
};

/**
 * Tela de Cadastro de Produto — as 9 abas do briefing. As 4 primeiras
 * (Dados Gerais, Tributação, Estoque, Preços) compõem um único formulário
 * React Hook Form, salvo de uma vez via "Salvar". As 5 últimas (Fornecedores,
 * Aplicações, Fotos, Produtos Relacionados, Histórico) são sub-recursos com
 * mutação própria e só ficam disponíveis depois que o produto existe —
 * por isso aparecem desabilitadas com um cadeado no modo "novo produto".
 */
export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'novo';
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: product, isLoading, isError, refetch } = useProduct(isNew ? undefined : id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(id ?? '');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        origin: product.origin ?? 'nacional',
        ipiRate: Number(product.ipiRate),
        icmsRate: Number(product.icmsRate),
        pisRate: Number(product.pisRate),
        cofinsRate: Number(product.cofinsRate),
        minStock: Number(product.minStock),
        maxStock: product.maxStock ? Number(product.maxStock) : undefined,
        costPrice: Number(product.costPrice),
        salePrice: Number(product.salePrice),
        wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined,
        workshopPrice: product.workshopPrice ? Number(product.workshopPrice) : undefined,
        distributorPrice: product.distributorPrice ? Number(product.distributorPrice) : undefined,
        weightKg: product.weightKg ? Number(product.weightKg) : undefined,
        heightCm: product.heightCm ? Number(product.heightCm) : undefined,
        widthCm: product.widthCm ? Number(product.widthCm) : undefined,
        lengthCm: product.lengthCm ? Number(product.lengthCm) : undefined,
        isActive: product.status === 'active',
      } as ProductFormValues);
    }
  }, [product]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: ProductFormValues) {
    if (isNew) {
      const created = await createProduct.mutateAsync(values);
      navigate(`/produtos/${created.id}`, { replace: true });
    } else {
      await updateProduct.mutateAsync(values);
    }
  }

  const FIELD_TO_TAB: Record<string, string> = {
    shortDescription: 'Dados Gerais', unitId: 'Dados Gerais', weightKg: 'Dados Gerais', heightCm: 'Dados Gerais', widthCm: 'Dados Gerais', lengthCm: 'Dados Gerais', warrantyDays: 'Dados Gerais',
    origin: 'Tributação', ipiRate: 'Tributação', icmsRate: 'Tributação', pisRate: 'Tributação', cofinsRate: 'Tributação',
    minStock: 'Estoque', maxStock: 'Estoque',
    costPrice: 'Preços', salePrice: 'Preços',
  };

  function onInvalid(errors: Record<string, unknown>) {
    const tabs = [...new Set(Object.keys(errors).map((field) => FIELD_TO_TAB[field] ?? 'Dados Gerais'))];
    toast.error(
      'Não foi possível salvar — falta preencher algo',
      tabs.length ? `Verifique a aba: ${tabs.join(', ')}` : undefined,
    );
  }

  if (!isNew && isLoading) return <LoadingScreen message="Carregando produto..." fullScreen={false} />;
  if (!isNew && isError) return <ErrorState onRetry={() => refetch()} />;

  const canEdit = isNew ? can('products', 'create') : can('products', 'update');

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <PageHeader
          title={isNew ? 'Novo produto' : product?.shortDescription ?? ''}
          description={isNew ? 'Cadastre um novo produto no catálogo comercial.' : `Código interno: ${product?.internalCode}`}
          actions={
            canEdit && (
              <Button type="submit" isLoading={createProduct.isPending || updateProduct.isPending}>
                <Save /> Salvar
              </Button>
            )
          }
        />

        <Tabs defaultValue="general">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general">Dados Gerais</TabsTrigger>
            <TabsTrigger value="taxation">Tributação</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
            <TabsTrigger value="suppliers" disabled={isNew}>
              {isNew && <Lock className="size-3" />} Fornecedores
            </TabsTrigger>
            <TabsTrigger value="applications" disabled={isNew}>
              {isNew && <Lock className="size-3" />} Aplicações
            </TabsTrigger>
            <TabsTrigger value="photos" disabled={isNew}>
              {isNew && <Lock className="size-3" />} Fotos
            </TabsTrigger>
            <TabsTrigger value="related" disabled={isNew}>
              {isNew && <Lock className="size-3" />} Relacionados
            </TabsTrigger>
            <TabsTrigger value="history" disabled={isNew}>
              {isNew && <Lock className="size-3" />} Histórico
            </TabsTrigger>
          </TabsList>

          <Card className="mt-4">
            <CardContent className="p-6">
              <TabsContent value="general">
                <GeneralTab />
              </TabsContent>
              <TabsContent value="taxation">
                <TaxationTab />
              </TabsContent>
              <TabsContent value="stock">
                <StockTab product={product} />
              </TabsContent>
              <TabsContent value="pricing">
                <PricingTab product={product} />
              </TabsContent>
              {product && (
                <>
                  <TabsContent value="suppliers">
                    <SuppliersTab product={product} />
                  </TabsContent>
                  <TabsContent value="applications">
                    <ApplicationsTab product={product} />
                  </TabsContent>
                  <TabsContent value="photos">
                    <PhotosTab product={product} />
                  </TabsContent>
                  <TabsContent value="related">
                    <RelatedProductsTab product={product} />
                  </TabsContent>
                  <TabsContent value="history">
                    <HistoryTab productId={product.id} />
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </form>
    </FormProvider>
  );
}
