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
      toast.error('Accès Refusé : Vous n\'avez pas les permissions nécessaires.')
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
