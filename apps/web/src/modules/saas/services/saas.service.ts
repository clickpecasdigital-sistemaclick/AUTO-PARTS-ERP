// ---- Types ------------------------------------------------------------------

export interface Plan {
  id: string;
  name: string;
  tier: 'starter' | 'pro' | 'business' | 'enterprise' | 'ultimate';
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  trialDays: number;
  limits?: PlanLimits;
  features?: { feature: string; enabled: boolean }[];
}

export interface PlanLimits {
  maxUsers?: number | null;
  maxBranches?: number | null;
  maxProducts?: number | null;
  maxMonthlyNfes?: number | null;
  maxStorageMb?: number | null;
  maxAiQueryMonth?: number | null;
}

export interface Subscription {
  id: string;
  tenantId: string;
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired';
  trialEndsAt?: string | null;
  currentPeriodEnd: string;
  plan: Plan;
}

export interface SubscriptionUsage {
  plan: string;
  status: string;
  trialEndsAt?: string | null;
  periodEnd: string;
  limits?: PlanLimits;
  current: Record<string, number>;
}

export interface TenantBranding {
  appName: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customDomain?: string | null;
  subdomain?: string | null;
  locale: string;
  timezone: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  description?: string | null;
  lastPingAt?: string | null;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

export interface Plugin {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  price?: number | null;
  isPaid: boolean;
  isVerified: boolean;
  avgRating?: number | null;
  totalInstalls: number;
  requiredPlan?: string | null;
}

// ---- Service ----------------------------------------------------------------

import { httpClient } from '@/api/http.client';

export const saasService = {
  getPlans: () => httpClient.get<Plan[]>('/saas/plans'),
  getSubscription: () => httpClient.get<Subscription>('/saas/subscription'),
  getUsage: () => httpClient.get<SubscriptionUsage>('/saas/subscription/usage'),
  upgrade: (planId: string) => httpClient.post('/saas/subscription/upgrade', { planId }),
  cancel: () => httpClient.post('/saas/subscription/cancel'),
  checkout: (planId: string, provider = 'stripe') => httpClient.post<{ checkoutUrl: string }>('/saas/billing/checkout', { planId, provider }),
  getBilling: () => httpClient.get('/saas/billing'),
  getLicense: () => httpClient.get('/saas/license'),
  validateLicense: () => httpClient.get('/saas/license/validate'),
  getBranding: () => httpClient.get<TenantBranding>('/saas/branding'),
  upsertBranding: (data: Partial<TenantBranding>) => httpClient.put('/saas/branding', data),
  listWebhooks: () => httpClient.get<WebhookEndpoint[]>('/saas/webhooks'),
  createWebhook: (url: string, events: string[], description?: string) => httpClient.post('/saas/webhooks', { url, events, description }),
  deleteWebhook: (id: string) => httpClient.delete(`/saas/webhooks/${id}`),
  pingWebhook: (id: string) => httpClient.post(`/saas/webhooks/${id}/ping`),
  listApiKeys: () => httpClient.get<ApiKey[]>('/saas/api-keys'),
  createApiKey: (name: string, scopes: string[]) => httpClient.post<{ key: string }>('/saas/api-keys', { name, scopes }),
  revokeApiKey: (id: string) => httpClient.delete(`/saas/api-keys/${id}`),
  getScopes: () => httpClient.get<Record<string, string[]>>('/saas/api-keys/scopes'),
  listPlugins: (category?: string) => httpClient.get<Plugin[]>('/saas/marketplace', { params: { category } }),
  getInstalledPlugins: () => httpClient.get('/saas/marketplace/installed'),
  installPlugin: (id: string) => httpClient.post(`/saas/marketplace/${id}/install`),
  uninstallPlugin: (id: string) => httpClient.delete(`/saas/marketplace/${id}/uninstall`),
};

// ---- Hooks ------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';

const KEY = 'saas';

export function usePlans() {
  return useQuery({ queryKey: [KEY, 'plans'], queryFn: saasService.getPlans });
}

export function useSubscription() {
  return useQuery({ queryKey: [KEY, 'subscription'], queryFn: saasService.getSubscription });
}

export function useSubscriptionUsage() {
  return useQuery({ queryKey: [KEY, 'usage'], queryFn: saasService.getUsage });
}

export function useBranding() {
  return useQuery({ queryKey: [KEY, 'branding'], queryFn: saasService.getBranding });
}

export function useUpsertBranding() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Partial<TenantBranding>) => saasService.upsertBranding(data), onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, 'branding'] }); toast.success('Configurações de branding salvas'); } });
}

export function useWebhooks() {
  return useQuery({ queryKey: [KEY, 'webhooks'], queryFn: saasService.listWebhooks });
}

export function useApiKeys() {
  return useQuery({ queryKey: [KEY, 'api-keys'], queryFn: saasService.listApiKeys });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, scopes }: { name: string; scopes: string[] }) => saasService.createApiKey(name, scopes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, 'api-keys'] }); toast.success('API Key criada'); },
    onError: (e: Error) => toast.error('Erro ao criar API Key', e.message),
  });
}

export function usePlugins(category?: string) {
  return useQuery({ queryKey: [KEY, 'plugins', category], queryFn: () => saasService.listPlugins(category) });
}
