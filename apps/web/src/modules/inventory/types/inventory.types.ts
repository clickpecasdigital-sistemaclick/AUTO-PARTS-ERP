export type StockMovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'inventory_in'
  | 'inventory_out'
  | 'service_order_out'
  | 'return_in'
  | 'loss_out'
  | 'breakage_out'
  | 'internal_consumption_out'
  | 'bonus_in';

export const stockMovementTypeLabels: Record<StockMovementType, string> = {
  purchase_in: 'Entrada (Compra)',
  sale_out: 'Saída (Venda)',
  transfer_in: 'Entrada (Transferência)',
  transfer_out: 'Saída (Transferência)',
  adjustment_in: 'Ajuste (Entrada)',
  adjustment_out: 'Ajuste (Saída)',
  inventory_in: 'Inventário (Entrada)',
  inventory_out: 'Inventário (Saída)',
  service_order_out: 'Saída (Ordem de Serviço)',
  return_in: 'Devolução',
  loss_out: 'Perda',
  breakage_out: 'Quebra',
  internal_consumption_out: 'Consumo Interno',
  bonus_in: 'Bonificação',
};

export interface Warehouse {
  id: string;
  branchId: string;
  code: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: string;
  unitCost?: string | null;
  totalValue?: string | null;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  product: { id: string; internalCode: string; shortDescription: string };
  warehouse: { id: string; name: string };
}

export interface StockKpis {
  totalStockValue: number;
  totalItems: number;
  outOfStockCount: number;
  belowMinCount: number;
  aboveMaxCount: number;
  staleProducts: { days30: number; days60: number; days90: number; days180: number; days365: number };
}

export type AbcClass = 'A' | 'B' | 'C';
export type AbcCriteria = 'value' | 'quantity' | 'movement' | 'profit';

export interface AbcCurveEntry {
  productId: string;
  internalCode: string;
  shortDescription: string;
  value: number;
  percentOfTotal: number;
  cumulativePercent: number;
  class: AbcClass;
}

export interface TurnoverEntry {
  productId: string;
  internalCode: string;
  shortDescription: string;
  quantityOnHand: number;
  outboundQuantity: number;
  turnoverRate: number;
  coverageDays: number | null;
  idleDays: number | null;
}

export interface StockAlerts {
  belowMin: { productId: string; internalCode: string; shortDescription: string; quantityOnHand: number; minStock: number }[];
  aboveMax: { productId: string; internalCode: string; shortDescription: string; quantityOnHand: number; maxStock: number }[];
  negative: { productId: string; internalCode: string; quantityOnHand: number }[];
  expiringBatches: { batchId: string; productId: string; internalCode: string; batchNumber: string; expiresAt: string }[];
}

export type StockTransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled';

export interface StockTransferItem {
  id: string;
  productId: string;
  quantity: string;
}

export interface StockTransfer {
  id: string;
  code: string;
  status: StockTransferStatus;
  reason?: string | null;
  notes?: string | null;
  shippedAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  originWarehouse: { id: string; name: string };
  destinationWarehouse: { id: string; name: string };
  items: StockTransferItem[];
}

export type InventoryType = 'general' | 'cycle' | 'by_location' | 'by_group' | 'by_manufacturer';
export type InventoryStatus = 'open' | 'counting' | 'reconciled' | 'cancelled';

export interface InventoryItem {
  id: string;
  productId: string;
  systemQuantity: string;
  countedQuantity?: string | null;
  recountedQuantity?: string | null;
  countedAt?: string | null;
  product: { id: string; internalCode: string; shortDescription: string };
}

export interface StockInventory {
  id: string;
  code: string;
  type: InventoryType;
  status: InventoryStatus;
  isBlind: boolean;
  warehouseId: string;
  startedAt: string;
  closedAt?: string | null;
  items: InventoryItem[];
  _count?: { items: number };
}

export const inventoryTypeLabels: Record<InventoryType, string> = {
  general: 'Geral',
  cycle: 'Rotativo',
  by_location: 'Por Local',
  by_group: 'Por Grupo',
  by_manufacturer: 'Por Fabricante',
};
