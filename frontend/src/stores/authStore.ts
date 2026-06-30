import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@shared/lib/api'

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  avatar_path?: string | null
  name_ar?: string | null
  phone?: string | null
  roles: string[]
  permissions: string[]
  institution_id: number
  institution_name: string
  two_factor_enabled: boolean
  locale: 'fr' | 'ar'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  requiresTwoFactor: boolean
  twoFactorChallengeToken: string | null

  // Actions
  login: (email: string, password: string) => Promise<{ requiresTwoFactor: boolean }>
  verifyTwoFactor: (code: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  setUser: (user: User) => void
  updateUser: (user: Partial<User>) => void
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      requiresTwoFactor: false,
      twoFactorChallengeToken: null,

      login: async (email, password) => {
        const response = await api.post('/v1/auth/login', { email, password })
        const { token, user, requires_two_factor, two_factor_challenge_token } = response.data.data

        if (requires_two_factor) {
          set({ requiresTwoFactor: true, twoFactorChallengeToken: two_factor_challenge_token })
          return { requiresTwoFactor: true }
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        set({ token, user, isAuthenticated: true, requiresTwoFactor: false, twoFactorChallengeToken: null })
        return { requiresTwoFactor: false }
      },

      verifyTwoFactor: async (code) => {
        const challengeToken = get().twoFactorChallengeToken
        const response = await api.post('/v1/auth/two-factor/verify', { 
          code, 
          challenge_token: challengeToken 
        })
        const { token, user } = response.data.data
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        set({ token, user, isAuthenticated: true, requiresTwoFactor: false, twoFactorChallengeToken: null })
      },

      logout: async () => {
        try {
          if (get().token) {
            await api.post('/v1/auth/logout')
          }
        } finally {
          delete api.defaults.headers.common['Authorization']
          set({ user: null, token: null, isAuthenticated: false })
        }
      },

      fetchUser: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false })
          return
        }
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/v1/auth/me')
          set({ user: response.data.data, isAuthenticated: true, isLoading: false })
        } catch {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },

      setUser: (user) => set({ user }),

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : (userData as User),
        }))
      },

      hasRole: (role) => {
        return get().user?.roles.includes(role) ?? false
      },

      hasPermission: (permission) => {
        return get().user?.permissions.includes(permission) ?? false
      },

      hasAnyRole: (roles) => {
        const userRoles = get().user?.roles ?? []
        return roles.some(r => userRoles.includes(r))
      },
    }),
    {
      name: 'encg-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
