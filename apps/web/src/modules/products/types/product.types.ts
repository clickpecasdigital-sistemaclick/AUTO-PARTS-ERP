export type ProductOrigin =
  | 'nacional'
  | 'estrangeira_importacao_direta'
  | 'estrangeira_mercado_interno'
  | 'nacional_importacao_acima_40'
  | 'nacional_processos_produtivos'
  | 'nacional_importacao_menor_40'
  | 'estrangeira_sem_similar_nacional'
  | 'estrangeira_sem_similar_mercado'
  | 'nacional_conteudo_importacao_70';

export type ProductStatus = 'active' | 'inactive' | 'discontinued';
export type ProductRelationType = 'similar' | 'equivalent' | 'complementary' | 'substitute';

export interface CatalogRef {
  id: string;
  name: string;
}

export interface ProductPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  position: number;
}

export interface ProductSupplierLink {
  id: string;
  supplierId: string;
  supplierSku?: string | null;
  lastPurchasePrice?: string | null;
  leadTimeDays?: number | null;
  isPreferred: boolean;
  supplier: { id: string; name: string; tradeName?: string | null };
}

export interface ProductVehicleApplicationItem {
  id: string;
  vehicleVersionId: string;
  position?: string | null;
  notes?: string | null;
  vehicleVersion: {
    id: string;
    name: string;
    yearStart: number;
    yearEnd?: number | null;
    model: { name: string; make: { name: string } };
  };
}

export interface ProductCrossReferenceItem {
  id: string;
  relatedProductId: string;
  type: ProductRelationType;
  notes?: string | null;
  relatedProduct: { id: string; internalCode: string; shortDescription: string };
}

export interface ProductHistoryEntry {
  id: string;
  action: string;
  createdAt: string;
  before?: unknown;
  after?: unknown;
  user?: { id: string; fullName?: string | null; email: string } | null;
}

export interface Product {
  id: string;
  internalCode: string;
  barcode?: string | null;
  manufacturerCode?: string | null;
  originalCode?: string | null;
  similarCode?: string | null;
  shortDescription: string;
  fullDescription?: string | null;
  brandId?: string | null;
  manufacturerId?: string | null;
  groupId?: string | null;
  subgroupId?: string | null;
  categoryId?: string | null;
  unitId: string;
  ncmCode?: string | null;
  cestCode?: string | null;
  defaultCfopCode?: string | null;
  defaultCstCode?: string | null;
  defaultCsosnCode?: string | null;
  origin: ProductOrigin;
  ipiRate: string;
  icmsRate: string;
  pisRate: string;
  cofinsRate: string;
  weightKg?: string | null;
  heightCm?: string | null;
  widthCm?: string | null;
  lengthCm?: string | null;
  defaultLocationId?: string | null;
  minStock: string;
  maxStock?: string | null;
  costPrice: string;
  averageCostPrice: string;
  salePrice: string;
  wholesalePrice?: string | null;
  workshopPrice?: string | null;
  distributorPrice?: string | null;
  marginPercent?: string | null;
  primarySupplierId?: string | null;
  warrantyDays?: number | null;
  notes?: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;

  brand?: CatalogRef | null;
  manufacturer?: CatalogRef | null;
  group?: CatalogRef | null;
  subgroup?: CatalogRef | null;
  category?: CatalogRef | null;
  unit: { id: string; code: string; description: string };
  primarySupplier?: { id: string; name: string; tradeName?: string | null } | null;
  photos: ProductPhoto[];
  suppliers: ProductSupplierLink[];
  vehicleApplications: ProductVehicleApplicationItem[];
  crossReferencesFrom: ProductCrossReferenceItem[];
  computed?: { markupPercent?: number; marginPercent?: number };

  // Saldo de estoque — somente leitura neste módulo (Sprint 06 implementa o módulo de Estoque de fato)
  stocks?: { warehouseId: string; quantityOnHand: string; quantityReserved: string }[];
}
