export type PersonType = 'individual' | 'business';
export type SupplierStatus = 'active' | 'inactive' | 'blocked';

export interface Supplier {
  id: string;
  companyId: string;
  personType: PersonType;
  document: string;
  stateRegistration?: string | null;
  name: string;
  tradeName?: string | null;
  email?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  paymentTermDays?: number | null;
  status: SupplierStatus;
  notes?: string | null;
  createdAt: string;
}

export interface CreateSupplierPayload {
  personType: PersonType;
  document: string;
  name: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  paymentTermDays?: number;
}
