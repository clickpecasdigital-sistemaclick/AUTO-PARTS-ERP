import { httpClient } from '@/api/http.client';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Product, ProductCrossReferenceItem, ProductHistoryEntry, ProductSupplierLink, ProductVehicleApplicationItem } from '../types/product.types';
import type {
  ProductApplicationFormValues,
  ProductCrossReferenceFormValues,
  ProductFormValues,
  ProductSupplierFormValues,
} from '../schemas/product.schema';

export interface ProductQueryParams extends PaginationParams {
  brandId?: string;
  manufacturerId?: string;
  groupId?: string;
  subgroupId?: string;
  categoryId?: string;
  supplierId?: string;
  vehicleVersionId?: string;
  onlyActive?: boolean;
}

/**
 * Camada de serviço HTTP do módulo de Produtos — único lugar que conhece
 * as rotas REST do backend (`/products`). Hooks (`hooks/`) chamam estas
 * funções; componentes nunca chamam `httpClient` diretamente.
 */
export const productsService = {
  list(params: ProductQueryParams) {
    return httpClient.get<PaginatedResponse<Product>>('/products', { params: params as Record<string, string | number | boolean | undefined> });
  },

  getById(id: string) {
    return httpClient.get<Product>(`/products/${id}`);
  },

  create(payload: Partial<ProductFormValues>) {
    return httpClient.post<Product>('/products', payload);
  },

  update(id: string, payload: Partial<ProductFormValues>) {
    return httpClient.patch<Product>(`/products/${id}`, payload);
  },

  remove(id: string) {
    return httpClient.delete<void>(`/products/${id}`);
  },

  getHistory(id: string) {
    return httpClient.get<ProductHistoryEntry[]>(`/products/${id}/history`);
  },

  // --- Fotos ---------------------------------------------------------------

  async uploadPhoto(productId: string, file: File, isPrimary: boolean) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', String(isPrimary));
    // FormData exige headers/Content-Type multipart definidos pelo navegador — não usar o httpClient JSON padrão.
    return httpClient.post<{ id: string; url: string }>(`/products/${productId}/photos`, formData);
  },

  removePhoto(productId: string, photoId: string) {
    return httpClient.delete<void>(`/products/${productId}/photos/${photoId}`);
  },

  reorderPhotos(productId: string, photoIdsInOrder: string[]) {
    return httpClient.patch<void>(`/products/${productId}/photos/reorder`, { photoIdsInOrder });
  },

  setPrimaryPhoto(productId: string, photoId: string) {
    return httpClient.patch<void>(`/products/${productId}/photos/${photoId}/primary`);
  },

  // --- Fornecedores ----------------------------------------------------------

  addSupplier(productId: string, payload: ProductSupplierFormValues) {
    return httpClient.post<ProductSupplierLink>(`/products/${productId}/suppliers`, payload);
  },

  removeSupplier(productId: string, productSupplierId: string) {
    return httpClient.delete<void>(`/products/${productId}/suppliers/${productSupplierId}`);
  },

  // --- Aplicações veiculares ---------------------------------------------------

  addApplication(productId: string, payload: ProductApplicationFormValues) {
    return httpClient.post<ProductVehicleApplicationItem>(`/products/${productId}/applications`, payload);
  },

  removeApplication(productId: string, applicationId: string) {
    return httpClient.delete<void>(`/products/${productId}/applications/${applicationId}`);
  },

  // --- Produtos relacionados -----------------------------------------------------

  addCrossReference(productId: string, payload: ProductCrossReferenceFormValues) {
    return httpClient.post<ProductCrossReferenceItem>(`/products/${productId}/related`, payload);
  },

  removeCrossReference(productId: string, crossReferenceId: string) {
    return httpClient.delete<void>(`/products/${productId}/related/${crossReferenceId}`);
  },

  // --- Importação / Exportação -----------------------------------------------------

  async importFile(file: File, format: 'csv' | 'xlsx') {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<{ totalRows: number; created: number; updated: number; errors: number }>(
      `/products/import?format=${format}`,
      formData,
    );
  },

  exportUrl(format: 'csv' | 'xlsx' | 'pdf', params: ProductQueryParams) {
    const search = new URLSearchParams({ format, ...(params as Record<string, string>) }).toString();
    return `/products/export?${search}`;
  },
};
