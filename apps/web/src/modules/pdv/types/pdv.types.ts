export type SaleMode = 'balcony' | 'workshop' | 'quick' | 'future_sale' | 'telesales' | 'pre_sale';
export type SaleStatus = 'open' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded';

export const saleModeLabels: Record<SaleMode, string> = {
  balcony: 'Venda Balcão',
  workshop: 'Venda Oficina',
  quick: 'Venda Rápida',
  future_sale: 'Venda Futura',
  telesales: 'Televendas',
  pre_sale: 'Pré-venda',
};

export interface CartProduct {
  id: string;
  internalCode: string;
  shortDescription: string;
  averageCostPrice: string;
  unit: { code: string };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  discountAmount: string;
  surchargeAmount: string;
  totalAmount: string;
  notes?: string | null;
  product: CartProduct;
}

export interface CartPayment {
  id: string;
  paymentMethodId: string;
  amount: string;
  installments: number;
  paymentMethod: { id: string; name: string; kind: string };
}

export interface Cart {
  id: string;
  code: string;
  mode: SaleMode;
  status: SaleStatus;
  customerId: string;
  customerVehicleId?: string | null;
  warehouseId?: string | null;
  subtotalAmount: string;
  discountAmount: string;
  totalAmount: string;
  items: CartItem[];
  payments: CartPayment[];
  customer: { id: string; name: string; tradeName?: string | null; creditLimit: string; creditStatus: string; document: string };
  customerVehicle?: { id: string; plate?: string | null } | null;
}

export interface ProductSearchResult {
  id: string;
  internalCode: string;
  barcode?: string | null;
  shortDescription: string;
  salePrice: string;
  costPrice: string;
  averageCostPrice: string;
  brand?: { name: string } | null;
  unit: { code: string };
  category?: { name: string } | null;
  defaultLocation?: { fullAddress: string | null; level: string; position: string } | null;
  stocks: { warehouseId: string; quantityOnHand: string; quantityReserved: string }[];
}

export interface PaymentMethod {
  id: string;
  kind: string;
  name: string;
  feePercent: string;
  isActive: boolean;
}

export interface PdvDashboardKpis {
  totalSalesToday: number;
  salesCountToday: number;
  averageTicket: number;
  itemsSoldToday: number;
  cancellationsToday: number;
  discountsGrantedToday: number;
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted';

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  expired: 'Vencido',
  converted: 'Convertido',
};

export interface QuoteItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  totalAmount: string;
  product?: { internalCode: string; shortDescription: string };
}

export interface Quote {
  id: string;
  code: string;
  status: QuoteStatus;
  validUntil?: string | null;
  totalAmount: string;
  notes?: string | null;
  createdAt: string;
  customer: { id: string; name: string; tradeName?: string | null };
  items: QuoteItem[];
}

export type SalesOrderStatus = 'pending' | 'confirmed' | 'invoiced' | 'cancelled';
export type SeparationStatus = 'pending' | 'separating' | 'separated' | 'shipped';

export const orderStatusLabels: Record<SalesOrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  invoiced: 'Faturado',
  cancelled: 'Cancelado',
};

export const separationStatusLabels: Record<SeparationStatus, string> = {
  pending: 'Pendente',
  separating: 'Em separação',
  separated: 'Separado',
  shipped: 'Expedido',
};

export interface SalesOrderItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  product?: { internalCode: string; shortDescription: string };
}

export interface PdvSalesOrder {
  id: string;
  code: string;
  status: SalesOrderStatus;
  separationStatus: SeparationStatus;
  totalAmount: string;
  createdAt: string;
  customer: { id: string; name: string; tradeName?: string | null };
  items: SalesOrderItem[];
}

export interface CashRegister {
  id: string;
  status: 'open' | 'closed';
  openingAmount: string;
  closingAmount?: string | null;
  expectedAmount?: string | null;
  openedAt: string;
  closedAt?: string | null;
}

export interface ClosingSummaryItem {
  paymentMethodId: string;
  name: string;
  kind: string;
  expected: number;
}

export interface ClosingSummary {
  byPaymentMethod: ClosingSummaryItem[];
  reinforcements: number;
  withdrawals: number;
  openingAmount: number;
  estimatedCashExpected: number;
}

export type SaleReturnType = 'partial' | 'total' | 'exchange';
export type SaleReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export const returnTypeLabels: Record<SaleReturnType, string> = { partial: 'Parcial', total: 'Total', exchange: 'Troca' };
export const returnStatusLabels: Record<SaleReturnStatus, string> = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada', completed: 'Concluída' };

export interface SaleReturnItemView {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  product: { internalCode: string; shortDescription: string };
}

export interface SaleReturn {
  id: string;
  saleId: string;
  type: SaleReturnType;
  status: SaleReturnStatus;
  reason: string;
  creditIssued: boolean;
  creditAmount: string;
  createdAt: string;
  items: SaleReturnItemView[];
}
