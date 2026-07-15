export type PersonType = 'individual' | 'business';
export type CustomerType = 'final_consumer' | 'workshop' | 'wholesale' | 'retail';
export type CustomerStatus = 'active' | 'inactive' | 'blocked';
export type CreditStatus = 'not_analyzed' | 'approved' | 'under_review' | 'restricted' | 'blocked';
export type ContactKind = 'primary' | 'financial' | 'purchasing' | 'workshop' | 'fiscal';
export type AddressKind = 'billing' | 'shipping' | 'fiscal' | 'residential' | 'commercial' | 'other';

export const customerTypeLabels: Record<CustomerType, string> = {
  final_consumer: 'Consumidor Final',
  workshop: 'Cliente Oficina',
  wholesale: 'Cliente Atacado',
  retail: 'Cliente Varejo',
};

export const creditStatusLabels: Record<CreditStatus, string> = {
  not_analyzed: 'Não analisado',
  approved: 'Aprovado',
  under_review: 'Em análise',
  restricted: 'Restrito',
  blocked: 'Bloqueado',
};

export const contactKindLabels: Record<ContactKind, string> = {
  primary: 'Principal',
  financial: 'Financeiro',
  purchasing: 'Compras',
  workshop: 'Oficina',
  fiscal: 'Fiscal',
};

export const addressKindLabels: Record<AddressKind, string> = {
  billing: 'Cobrança',
  shipping: 'Entrega',
  fiscal: 'Fiscal',
  residential: 'Residencial',
  commercial: 'Comercial',
  other: 'Outro',
};

export interface CustomerContact {
  id: string;
  kind: ContactKind;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface CustomerAddress {
  id: string;
  kind: AddressKind;
  label?: string | null;
  zipCode: string;
  street: string;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export interface CustomerVehicle {
  id: string;
  plate?: string | null;
  chassis?: string | null;
  renavam?: string | null;
  color?: string | null;
  modelYear?: number | null;
  manufactureYear?: number | null;
  currentKm?: number | null;
  notes?: string | null;
}

export interface Customer {
  id: string;
  companyId: string;
  personType: PersonType;
  customerType: CustomerType;
  document: string;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  rg?: string | null;
  name: string;
  tradeName?: string | null;
  classification?: string | null;
  category?: string | null;
  segment?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  birthDate?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  creditLimit: string;
  creditScore?: number | null;
  creditStatus: CreditStatus;
  lastPurchaseAt?: string | null;
  totalPurchasesCount: number;
  averageTicketValue: string;
  largestPurchaseValue: string;
  status: CustomerStatus;
  notes?: string | null;
  contacts: CustomerContact[];
  addresses: CustomerAddress[];
  vehicles: CustomerVehicle[];
}

export interface CreditProfile {
  creditLimit: number;
  usedBalance: number;
  availableBalance: number;
  overdueDays: number;
  largestPurchaseValue: number;
  averageTicketValue: number;
  totalPurchasesCount: number;
  lastPurchaseAt: string | null;
  creditScore: number;
  creditStatus: CreditStatus;
}

export interface Customer360Timeline {
  id: string;
  type: 'sale' | 'quote' | 'sales_order' | 'service_order' | 'invoice' | 'payment' | 'interaction' | 'appointment' | 'support_ticket' | 'opportunity';
  title: string;
  value?: number;
  status?: string;
  occurredAt: string;
}

export interface Customer360Summary {
  customer: Customer;
  salesCount: number;
  openTickets: number;
  pendingOpportunities: number;
  vehiclesCount: number;
}

export interface CustomerBirthday {
  id: string;
  name: string;
  birthDate: string;
  phone: string | null;
  email: string | null;
}

export interface CustomerCreditEvent {
  id: string;
  type: 'limit_change' | 'status_change' | 'manual_review' | 'automatic_block' | 'automatic_unblock';
  previousLimit?: string | null;
  newLimit?: string | null;
  previousStatus?: CreditStatus | null;
  newStatus?: CreditStatus | null;
  reason?: string | null;
  createdAt: string;
}
