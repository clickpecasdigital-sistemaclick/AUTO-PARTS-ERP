import { httpClient } from '@/api/http.client';

export interface CatalogOption {
  id: string;
  name?: string;
  code?: string;
  description?: string;
}

export interface VehicleVersionOption {
  id: string;
  name: string;
  yearStart: number;
  yearEnd?: number | null;
  model: { name: string; make: { name: string } };
}

export interface CompatibleProduct {
  id: string;
  internalCode: string;
  shortDescription: string;
  barcode?: string | null;
  salePrice: string;
  brand?: { name: string } | null;
  unit?: { code: string } | null;
  stocks: { quantityOnHand: string }[];
  vehicleApplications: { position: string | null; notes: string | null }[];
}

/** Lookups read-only que alimentam os Selects/Autocomplete do cadastro de Produto. */
export const catalogsService = {
  brands: () => httpClient.get<CatalogOption[]>('/catalogs/brands'),
  manufacturers: () => httpClient.get<CatalogOption[]>('/catalogs/manufacturers'),
  units: () => httpClient.get<CatalogOption[]>('/catalogs/units'),
  groups: () => httpClient.get<CatalogOption[]>('/catalogs/product-groups'),
  subgroups: (groupId?: string) => httpClient.get<CatalogOption[]>('/catalogs/product-subgroups', { params: { groupId } }),
  categories: () => httpClient.get<CatalogOption[]>('/catalogs/product-categories'),
  suppliers: (search?: string) => httpClient.get<CatalogOption[]>('/catalogs/suppliers', { params: { search } }),
  vehicleMakes: () => httpClient.get<CatalogOption[]>('/catalogs/vehicle-makes'),
  vehicleModels: (makeId: string) => httpClient.get<CatalogOption[]>('/catalogs/vehicle-models', { params: { makeId } }),
  vehicleVersions: (modelId?: string, search?: string) =>
    httpClient.get<VehicleVersionOption[]>('/catalogs/vehicle-versions', { params: { modelId, search } }),
  vehicleApplications: (vehicleVersionId: string) =>
    httpClient.get<CompatibleProduct[]>('/catalogs/vehicle-applications', { params: { vehicleVersionId } }),
};
