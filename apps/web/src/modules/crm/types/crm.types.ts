export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  value: string;
  probability: number;
  expectedCloseDate?: string | null;
  pipelineStageId: string;
  closedAt?: string | null;
  customer?: { id: string; name: string } | null;
  lead?: { id: string; name: string } | null;
  tags: { tag: { id: string; name: string; color?: string | null } }[];
}

export interface PipelineStageWithOpportunities extends PipelineStage {
  opportunities: Opportunity[];
}

export interface CrmDashboardKpis {
  newCustomersThisMonth: number;
  activeCustomers: number;
  inactiveCustomers: number;
  leadConversionRate: number;
  followUpsPending: number;
  followUpsOverdue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  tradeName?: string | null;
  totalPurchasesCount: number;
  averageTicketValue: string;
  largestPurchaseValue: string;
  lastPurchaseAt?: string | null;
}

export interface TopSupplier {
  supplierId: string;
  name: string;
  totalPurchased: number;
  ordersCount: number;
}

export interface CrmTask {
  id: string;
  type: string;
  title: string;
  dueAt?: string | null;
  status: string;
}
