export type PayableStatus = 'open' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
export type ReceivableStatus = 'open' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export const payableStatusLabels: Record<PayableStatus, string> = {
  open: 'Aberto',
  paid: 'Pago',
  partially_paid: 'Parcialmente pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

export const receivableStatusLabels: Record<ReceivableStatus, string> = {
  open: 'Aberto',
  paid: 'Recebido',
  partially_paid: 'Parcialmente recebido',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

export interface FinancialDocument {
  id: string;
  documentNumber?: string | null;
  installmentNumber: number;
  totalInstallments: number;
  amount: string;
  interestAmount: string;
  fineAmount: string;
  discountAmount: string;
  dueDate: string;
  notes?: string | null;
  costCenter?: { id: string; name: string } | null;
  chartOfAccount?: { id: string; name: string } | null;
  bankAccount?: { id: string; bankName: string; accountNumber: string } | null;
}

export interface Payable extends FinancialDocument {
  paidAmount: string;
  paidAt?: string | null;
  scheduledAt?: string | null;
  status: PayableStatus;
  supplier?: { id: string; name: string; tradeName?: string | null } | null;
}

export interface Receivable extends FinancialDocument {
  receivedAmount: string;
  receivedAt?: string | null;
  status: ReceivableStatus;
  customer?: { id: string; name: string; tradeName?: string | null } | null;
}

export interface BankAccount {
  id: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  currentBalance: string;
  creditLimit: string;
  pixKey?: string | null;
  isActive: boolean;
}

export interface ExecutiveDashboardKpis {
  cashBalance: number;
  bankBalance: number;
  revenueThisMonth: number;
  expenseThisMonth: number;
  operatingProfit: number;
  delinquencyRate: number;
  overdueReceivables: { count: number; total: number };
  upcomingReceivables: { count: number; total: number };
  overduePayables: { count: number; total: number };
  upcomingPayables: { count: number; total: number };
}

export interface CashFlowDay {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface DreReport {
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  costs: number;
  expenses: number;
  ebitda: number;
  operatingProfit: number;
  netProfit: number;
}

export interface ExpenseRankingItem {
  costCenterId: string | null;
  name: string;
  total: number;
}
