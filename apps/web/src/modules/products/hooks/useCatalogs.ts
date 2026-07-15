import { useQuery } from '@tanstack/react-query';
import { catalogsService } from '../services/catalogs.service';

/**
 * Catálogos globais (marcas, fabricantes, unidades, montadoras) raramente
 * mudam — `staleTime` alto evita refetch repetido a cada abertura do
 * formulário de Produto.
 */
const CATALOG_STALE_TIME = 1000 * 60 * 10; // 10 minutos

export function useBrands() {
  return useQuery({ queryKey: ['catalogs', 'brands'], queryFn: catalogsService.brands, staleTime: CATALOG_STALE_TIME });
}

export function useManufacturers() {
  return useQuery({ queryKey: ['catalogs', 'manufacturers'], queryFn: catalogsService.manufacturers, staleTime: CATALOG_STALE_TIME });
}

export function useUnits() {
  return useQuery({ queryKey: ['catalogs', 'units'], queryFn: catalogsService.units, staleTime: CATALOG_STALE_TIME });
}

export function useProductGroups() {
  return useQuery({ queryKey: ['catalogs', 'product-groups'], queryFn: catalogsService.groups, staleTime: CATALOG_STALE_TIME });
}

export function useProductSubgroups(groupId?: string) {
  return useQuery({
    queryKey: ['catalogs', 'product-subgroups', groupId],
    queryFn: () => catalogsService.subgroups(groupId),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useProductCategories() {
  return useQuery({ queryKey: ['catalogs', 'product-categories'], queryFn: catalogsService.categories, staleTime: CATALOG_STALE_TIME });
}

export function useSupplierOptions(search?: string) {
  return useQuery({
    queryKey: ['catalogs', 'suppliers', search],
    queryFn: () => catalogsService.suppliers(search),
    staleTime: 1000 * 30,
  });
}

export function useVehicleMakes() {
  return useQuery({ queryKey: ['catalogs', 'vehicle-makes'], queryFn: catalogsService.vehicleMakes, staleTime: CATALOG_STALE_TIME });
}

export function useVehicleModels(makeId?: string) {
  return useQuery({
    queryKey: ['catalogs', 'vehicle-models', makeId],
    queryFn: () => catalogsService.vehicleModels(makeId!),
    enabled: !!makeId,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useVehicleVersions(modelId?: string, search?: string) {
  return useQuery({
    queryKey: ['catalogs', 'vehicle-versions', modelId, search],
    queryFn: () => catalogsService.vehicleVersions(modelId, search),
    enabled: !!modelId || !!search,
    staleTime: CATALOG_STALE_TIME,
  });
}
