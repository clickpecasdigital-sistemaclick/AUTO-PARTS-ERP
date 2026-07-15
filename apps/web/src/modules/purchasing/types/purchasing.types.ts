export type PurchasePriority = 'low' | 'normal' | 'high' | 'urgent';
export type PurchaseRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'quoting' | 'converted' | 'cancelled';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
export type PurchaseQuotationStatus = 'open' | 'comparing' | 'awarded' | 'cancelled';
export type GoodsReceiptStatus = 'pending' | 'confirmed' | 'cancelled';
export type GoodsReceiptItemDisposition = 'pending' | 'accepted' | 'partially_accepted' | 'rejected';

export const priorityLabels: Record<PurchasePriority, string> = { low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente' };

export const requestStatusLabels: Record<PurchaseRequestStatus, string> = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando aprovação',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  quoting: 'Em cotação',
  converted: 'Convertida em pedido',
  cancelled: 'Cancelada',
};

export const orderStatusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  partially_received: 'Parcialmente recebido',
  received: 'Recebido',
  cancelled: 'Cancelado',
};

export interface PurchaseRequestItem {
  id: string;
  productId: string;
  quantity: string;
  notes?: string | null;
  product: { id: string; internalCode: string; shortDescription: string };
}

export interface PurchaseRequest {
  id: string;
  code: string;
  priority: PurchasePriority;
  isUrgent: boolean;
  justification: string;
  status: PurchaseRequestStatus;
  requestedAt: string;
  items: PurchaseRequestItem[];
  department?: { id: string; name: string } | null;
  costCenter?: { id: string; name: string } | null;
}

export interface QuotationComparisonEntry {
  quotationSupplierId: string;
  supplierId: string;
  supplierName: string;
  itemsTotal: number;
  freightAmount: number;
  discountPercent: number;
  grandTotal: number;
  deliveryDays: number | null;
  warrantyDays: number | null;
  paymentTerms: string | null;
  historicalAvgLeadTimeDays: number | null;
  score: number;
  isBestOffer: boolean;
}

export interface PurchaseQuotationSupplier {
  id: string;
  supplierId: string;
  respondedAt?: string | null;
  isWinner: boolean;
  supplier: { id: string; name: string; tradeName?: string | null };
}

export interface PurchaseQuotation {
  id: string;
  code: string;
  status: PurchaseQuotationStatus;
  deadline?: string | null;
  suppliers: PurchaseQuotationSupplier[];
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantity: string;
  unitCost: string;
  receivedQuantity: string;
  totalAmount: string;
  product: { id: string; internalCode: string; shortDescription: string };
}

export interface PurchaseOrder {
  id: string;
  code: string;
  status: PurchaseOrderStatus;
  issueDate: string;
  expectedDate?: string | null;
  totalAmount: string;
  notes?: string | null;
  supplier: { id: string; name: string; tradeName?: string | null; document: string };
  items: PurchaseOrderItem[];
}

export interface GoodsReceiptItem {
  id: string;
  productId: string;
  quantity: string;
  unitCost: string;
  acceptedQuantity: string;
  rejectedQuantity: string;
  disposition: GoodsReceiptItemDisposition;
  occurrenceNotes?: string | null;
  product: { id: string; internalCode: string; shortDescription: string };
}

export interface GoodsReceipt {
  id: string;
  code: string;
  status: GoodsReceiptStatus;
  receivedAt: string;
  invoiceNumber?: string | null;
  items: GoodsReceiptItem[];
  purchaseOrder?: { code: string; supplierId: string };
}

export interface PurchasingKpis {
  totalToday: number;
  totalThisMonth: number;
  pendingOrders: number;
  approvedOrders: number;
  cancelledOrders: number;
  topSupplier: { supplierId: string; name: string; totalValue: number } | null;
  estimatedSavings: number;
  averageLeadTimeDays: number | null;
  productsAwaitingPurchase: number;
  urgentReplenishments: number;
}

export interface PurchaseSuggestion {
  id: string;
  suggestedQuantity: string;
  reason: string;
  status: string;
  product: { id: string; internalCode: string; shortDescription: string };
  warehouse: { id: string; name: string };
}

export interface Supplier360Panel {
  supplier: { id: string; name: string; tradeName: string | null; document: string; email: string | null; phone: string | null };
  totalOrders: number;
  totalPurchasedValue: number;
  averageOrderValue: number;
  averageLeadTimeDays: number | null;
  onTimeDeliveryRate: number | null;
  averagePriceByProduct: { productId: string; internalCode: string; shortDescription: string; averagePrice: number }[];
  ranking: { position: number; totalSuppliers: number };
  overdueAccountsPayable: number;
  recentOrders: { id: string; code: string; status: string; totalAmount: number; issueDate: string }[];
}
