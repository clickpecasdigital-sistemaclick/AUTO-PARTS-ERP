// ---- Types -------------------------------------------------------------------

export type FiscalInvoiceStatus = 'draft' | 'pending_authorization' | 'authorized' | 'rejected' | 'cancelled' | 'denied' | 'contingency';
export type FiscalInvoiceModel = 'nfe' | 'nfce' | 'sat';

export const invoiceStatusLabels: Record<FiscalInvoiceStatus, string> = {
  draft: 'Rascunho',
  pending_authorization: 'Pendente',
  authorized: 'Autorizada',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  denied: 'Denegada',
  contingency: 'Contingência',
};

export interface FiscalInvoice {
  id: string;
  number: number;
  series: number;
  model: FiscalInvoiceModel;
  accessKey?: string | null;
  status: FiscalInvoiceStatus;
  totalAmount: string;
  issueDate: string;
  authorizedAt?: string | null;
  protocolNumber?: string | null;
  rejectionCode?: string | null;
  rejectionReason?: string | null;
  customer?: { name: string } | null;
  supplier?: { name: string } | null;
}

export interface FiscalDashboard {
  totals: { emitted: number; pending: number; rejected: number; cancelled: number; authorized: number; voidedRanges: number };
  recentRejections: { rejectionCode: string; rejectionMessage: string; explanation?: string | null; suggestedFix?: string | null; internalLink?: string | null; occurredAt: string }[];
  expiringCertificates: { id: string; alias: string; validUntil: string }[];
}

export interface FiscalConfig {
  id: string;
  taxRegime: string;
  crt: number;
  environment: 'production' | 'homologation';
  uf: string;
  ibgeCode?: string | null;
  defaultCfopInState?: string | null;
  defaultCfopOutState?: string | null;
  defaultNatureOfOperation?: string | null;
}

export interface TaxRule {
  id: string;
  name: string;
  priority: number;
  ncmCode?: string | null;
  cfopCode?: string | null;
  originState?: string | null;
  destState?: string | null;
  icmsRate?: string | null;
  pisRate?: string | null;
  cofinsRate?: string | null;
  isActive: boolean;
}
