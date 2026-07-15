import { httpClient } from '@/api/http.client';
import type { Customer, Customer360Summary, Customer360Timeline, CreditProfile, CustomerCreditEvent, CustomerBirthday } from '../types/mdm.types';

export interface CustomerQueryParams {
  search?: string;
  customerType?: string;
  status?: string;
  creditStatus?: string;
  page?: number;
  perPage?: number;
}

/** Camada de serviço HTTP do MDM — espelha 1:1 as rotas de `apps/api/src/modules/mdm`. */
export const mdmService = {
  // Clientes
  listCustomers: (params: CustomerQueryParams) => httpClient.get<{ data: Customer[]; total: number; page: number; perPage: number }>('/mdm/customers', { params: params as never }),
  getCustomer: (id: string) => httpClient.get<Customer>(`/mdm/customers/${id}`),
  createCustomer: (companyId: string, payload: Record<string, unknown>) => httpClient.post<Customer>('/mdm/customers', { companyId, ...payload }),
  updateCustomer: (id: string, payload: Record<string, unknown>) => httpClient.put<Customer>(`/mdm/customers/${id}`, payload),
  removeCustomer: (id: string) => httpClient.delete(`/mdm/customers/${id}`),
  getBirthdays: (month?: number) => httpClient.get<CustomerBirthday[]>('/mdm/customers/birthdays', { params: { month } }),

  addContact: (customerId: string, payload: Record<string, unknown>) => httpClient.post(`/mdm/customers/${customerId}/contacts`, payload),
  removeContact: (customerId: string, contactId: string) => httpClient.delete(`/mdm/customers/${customerId}/contacts/${contactId}`),
  addAddress: (customerId: string, payload: Record<string, unknown>) => httpClient.post(`/mdm/customers/${customerId}/addresses`, payload),
  removeAddress: (addressId: string) => httpClient.delete(`/mdm/customers/addresses/${addressId}`),
  addVehicle: (customerId: string, payload: Record<string, unknown>) => httpClient.post(`/mdm/customers/${customerId}/vehicles`, payload),
  removeVehicle: (vehicleId: string) => httpClient.delete(`/mdm/customers/vehicles/${vehicleId}`),

  // Crédito
  getCreditProfile: (customerId: string) => httpClient.get<CreditProfile>(`/mdm/customers/${customerId}/credit`),
  getCreditHistory: (customerId: string) => httpClient.get<CustomerCreditEvent[]>(`/mdm/customers/${customerId}/credit/history`),
  refreshCredit: (customerId: string) => httpClient.post<CreditProfile>(`/mdm/customers/${customerId}/credit/refresh`),
  updateCreditLimit: (customerId: string, newLimit: number, reason?: string) => httpClient.post(`/mdm/customers/${customerId}/credit/limit`, { newLimit, reason }),

  // 360°
  getCustomer360Summary: (customerId: string) => httpClient.get<Customer360Summary>(`/mdm/customers/${customerId}/360/summary`),
  getCustomer360Timeline: (customerId: string) => httpClient.get<Customer360Timeline[]>(`/mdm/customers/${customerId}/360/timeline`),

  // LGPD
  getConsents: (customerId: string) => httpClient.get(`/mdm/lgpd/customers/${customerId}/consents`),
  giveConsent: (customerId: string, purpose: string, legalBasis: string) => httpClient.post(`/mdm/lgpd/customers/${customerId}/consents`, { purpose, legalBasis }),
  revokeConsent: (consentId: string) => httpClient.post(`/mdm/lgpd/consents/${consentId}/revoke`),
  exportCustomerData: (customerId: string) => httpClient.post(`/mdm/lgpd/customers/${customerId}/export`),
  anonymizeCustomer: (customerId: string) => httpClient.post(`/mdm/lgpd/customers/${customerId}/anonymize`),

  // Documentos
  listDocuments: (entity: string, entityId: string) => httpClient.get(`/mdm/documents`, { params: { entity, entityId, latestOnly: 'true' } }),
  uploadDocument: (entity: string, entityId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post(`/mdm/documents/upload?entity=${entity}&entityId=${entityId}`, formData);
  },

  // Funcionários / Vendedores / Mecânicos / Transportadoras
  listEmployees: (departmentId?: string) => httpClient.get('/mdm/employees', { params: { departmentId } }),
  listSalespersons: () => httpClient.get('/mdm/salespersons'),
  getSalespersonRanking: () => httpClient.get('/mdm/salespersons/ranking'),
  listMechanics: () => httpClient.get('/mdm/mechanics'),
  listCarriers: () => httpClient.get('/mdm/carriers'),
};
