import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import { productsService, type ProductQueryParams } from '../services/products.service';
import type { ProductFormValues, ProductSupplierFormValues, ProductApplicationFormValues, ProductCrossReferenceFormValues } from '../schemas/product.schema';

const PRODUCTS_KEY = 'products';

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => productsService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => productsService.getById(id!),
    enabled: !!id,
  });
}

export function useProductHistory(id: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id, 'history'],
    queryFn: () => productsService.getHistory(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProductFormValues>) => productsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      toast.success('Produto criado com sucesso');
    },
    onError: (error: Error) => toast.error('Não foi possível criar o produto', error.message),
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProductFormValues>) => productsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      toast.success('Produto atualizado com sucesso');
    },
    onError: (error: Error) => toast.error('Não foi possível atualizar o produto', error.message),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      toast.success('Produto excluído');
    },
    onError: (error: Error) => toast.error('Não foi possível excluir o produto', error.message),
  });
}

// --- Fotos -------------------------------------------------------------------

export function useUploadProductPhoto(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, isPrimary }: { file: File; isPrimary: boolean }) => productsService.uploadPhoto(productId, file, isPrimary),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] }),
    onError: (error: Error) => toast.error('Falha no upload da foto', error.message),
  });
}

export function useRemoveProductPhoto(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => productsService.removePhoto(productId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] }),
    onError: (error: Error) => toast.error('Não foi possível excluir a foto', error.message),
  });
}

export function useReorderProductPhotos(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoIdsInOrder: string[]) => productsService.reorderPhotos(productId, photoIdsInOrder),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] }),
  });
}

export function useSetPrimaryProductPhoto(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => productsService.setPrimaryPhoto(productId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] }),
  });
}

// --- Fornecedores --------------------------------------------------------------

export function useAddProductSupplier(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductSupplierFormValues) => productsService.addSupplier(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] });
      toast.success('Fornecedor vinculado');
    },
    onError: (error: Error) => toast.error('Não foi possível vincular o fornecedor', error.message),
  });
}

export function useRemoveProductSupplier(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productSupplierId: string) => productsService.removeSupplier(productId, productSupplierId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] }),
  });
}

// --- Aplicações veiculares -------------------------------------------------------

export function useAddProductApplication(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductApplicationFormValues) => productsService.addApplication(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] });
      toast.success('Aplicação veicular adicionada');
    },
    onError: (error: Error) => toast.error('Não foi possível adicionar a aplicação', error.message),
  });
}

export function useRemoveProductApplication(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => productsService.removeApplication(productId, applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] }),
  });
}

// --- Produtos relacionados ----------------------------------------------------------

export function useAddProductCrossReference(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductCrossReferenceFormValues) => productsService.addCrossReference(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] });
      toast.success('Produto relacionado adicionado');
    },
    onError: (error: Error) => toast.error('Não foi possível relacionar o produto', error.message),
  });
}

export function useRemoveProductCrossReference(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (crossReferenceId: string) => productsService.removeCrossReference(productId, crossReferenceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] }),
  });
}

// --- Importação ---------------------------------------------------------------------

export function useImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, format }: { file: File; format: 'csv' | 'xlsx' }) => productsService.importFile(file, format),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      toast.success(`Importação concluída: ${report.created} criado(s), ${report.updated} atualizado(s), ${report.errors} erro(s)`);
    },
    onError: (error: Error) => toast.error('Falha na importação', error.message),
  });
}
