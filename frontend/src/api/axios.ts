import axios, { AxiosError, type AxiosResponse } from 'axios';
import { useAuthStore } from '@stores/authStore';

// ── Instance ────────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// ── Request: Attach Bearer token ─────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const lng = localStorage.getItem('encg_lang') || 'fr';
    config.headers['Accept-Language'] = lng;

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response: Handle 401 / 422 ────────────────────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Token expired — force logout
      useAuthStore.getState().logout?.();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Types ────────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Extracts Laravel 422 validation errors into a flat map
 * suitable for React Hook Form `setError`.
 *
 * @example
 * catch (err) {
 *   const errors = extractValidationErrors(err);
 *   Object.entries(errors).forEach(([field, message]) => {
 *     setError(field as keyof FormData, { message });
 *   });
 * }
 */
export function extractValidationErrors(
  error: unknown
): Record<string, string> {
  if (!axios.isAxiosError(error)) return {};
  const data = (error as AxiosError<ApiErrorResponse>).response?.data;
  if (!data?.errors) return {};

  return Object.fromEntries(
    Object.entries(data.errors).map(([field, messages]) => [
      field,
      messages[0] ?? 'Erreur de validation',
    ])
  );
}

/**
 * Returns the top-level error message from an API error.
 */
export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError(error)) {
    return (error as AxiosError<ApiErrorResponse>).response?.data?.message ?? fallback;
  }
  return fallback;
}
