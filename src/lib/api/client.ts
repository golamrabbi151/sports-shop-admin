import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api';
import { ApiError } from './errors';
import { tokenStore } from './token-store';

/**
 * Adapt this to your backend's response envelope.
 * Supports `{ data: T }` / `{ success, data, message }` envelopes and raw `T`.
 */
export function unwrapResponse<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && Object.keys(body).length <= 4) {
    return (body as { data: T }).data;
  }
  return body as T;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retryCount?: number };

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: true, // HttpOnly admin session cookie
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    // Retry idempotent GETs once on network errors / 5xx.
    if (config && config.method === 'get' && (!status || status >= 500) && (config._retryCount ?? 0) < 1) {
      config._retryCount = 1;
      await new Promise((r) => setTimeout(r, 400));
      return apiClient(config);
    }

    // Session expired or revoked → force sign-in (admin sessions are not silently refreshed).
    if (status === 401 && typeof window !== 'undefined' && !config?.url?.includes('/auth/login')) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('admin:session-expired'));
    }
    return Promise.reject(ApiError.from(error));
  },
);

export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig) => unwrapResponse<T>((await apiClient.get(url, config)).data),
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrapResponse<T>((await apiClient.post(url, body, config)).data),
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrapResponse<T>((await apiClient.put(url, body, config)).data),
  patch: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrapResponse<T>((await apiClient.patch(url, body, config)).data),
  delete: async <T>(url: string, config?: AxiosRequestConfig) =>
    unwrapResponse<T>((await apiClient.delete(url, config)).data),
};
