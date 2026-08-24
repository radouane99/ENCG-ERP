import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
})

// ── Request Interceptor ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Language header for server-side localization
  const lang = localStorage.getItem('encg_lang') || 'fr'
  config.headers['Accept-Language'] = lang

  return config
})

// ── Response Interceptor ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) {
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }

    if (status === 403) {
      if (error.response?.data?.requires_2fa_setup) {
        toast.error('La double authentification (2FA) est obligatoire pour les administrateurs. Veuillez la configurer.')
        // Redirect to profile or 2FA setup page
        setTimeout(() => {
          window.location.href = '/profile'
        }, 2000)
        return Promise.reject(error)
      }
      if (!(error.config as any)?.suppressToast) {
        toast.error('Accès Refusé : Vous n\'avez pas les permissions nécessaires.')
      }
      return Promise.reject(error)
    }

    if (status === 422) {
      // Validation errors — let the form handle them
      return Promise.reject(error)
    }

    if (status === 429) {
      toast.error('Trop de tentatives. Veuillez réessayer plus tard.')
      return Promise.reject(error)
    }

    if (status >= 500) {
      toast.error(message || 'Erreur serveur. Veuillez réessayer.')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api

export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
}

export function extractValidationErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {}
  const data = error.response?.data as ApiErrorResponse | undefined
  if (!data?.errors) return {}

  return Object.fromEntries(
    Object.entries(data.errors).map(([field, messages]) => [
      field,
      messages[0] ?? 'Erreur de validation',
    ]),
  )
}

export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiErrorResponse | undefined)?.message ?? fallback
  }
  return fallback
}

// ── Typed API helpers ──────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}
