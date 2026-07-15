import { env } from '@/config/env';
import { supabase } from '@/api/supabaseClient';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `Erro HTTP ${status}`);
    this.name = 'HttpError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

/**
 * Cliente HTTP central para a API NestJS (apps/api).
 * Injeta automaticamente o token de sessão do Supabase Auth no header
 * Authorization, evitando repetição em cada chamada de serviço/módulo.
 */
async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { params, body, headers, ...rest } = options;

  const url = new URL(path, env.apiUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  // FormData (upload de arquivos) não deve ser serializado em JSON nem
  // receber Content-Type manual — o navegador define o boundary multipart
  // automaticamente. Qualquer módulo que precise enviar arquivo (fotos de
  // produto, importação de planilha) passa `body: formData` normalmente;
  // o cliente HTTP detecta o tipo aqui, sem precisar de uma função separada.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(url.toString(), {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new HttpError(response.status, errorBody, errorBody?.message);
  }

  if (response.status === 204) return undefined as TResponse;
  return (await response.json()) as TResponse;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
