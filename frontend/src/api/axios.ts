import axios, { AxiosError } from 'axios';

export { default as api } from '@shared/lib/api';
export { default } from '@shared/lib/api';

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
