import { create } from 'zustand'
import api from '@shared/lib/api'

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  avatar_path?: string | null
  name_ar?: string | null
  phone?: string | null
  cin?: string | null
  cne?: string | null
  roles: string[]
  permissions: string[]
  institution_id: number
  institution_name: string
  two_factor_enabled: boolean
  locale: 'fr' | 'ar'
  must_change_password?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  requiresTwoFactor: boolean
  twoFactorChallengeToken: string | null
  activeRole: string | null

  completeSession: (user?: User) => Promise<void>
  login: (email: string, password: string) => Promise<{ requiresTwoFactor: boolean }>
  verifyTwoFactor: (code: string) => Promise<void>
  logout: () => Promise<void>
  clearSession: () => void
  fetchUser: () => Promise<void>
  setUser: (user: User) => void
  updateUser: (user: Partial<User>) => void
  setActiveRole: (role: string | null) => void
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  requiresTwoFactor: false,
  twoFactorChallengeToken: null,
  activeRole: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('encg_active_role') : null,

  completeSession: async (user) => {
    if (user) {
      set({ user, isAuthenticated: true, isLoading: false })
      return
    }
    await get().fetchUser()
  },

  login: async (email, password) => {
    const response = await api.post('/v1/auth/login', { email, password })
    const { user, requires_two_factor, two_factor_challenge_token } = response.data.data

    if (requires_two_factor) {
      set({ requiresTwoFactor: true, twoFactorChallengeToken: two_factor_challenge_token })
      return { requiresTwoFactor: true }
    }

    set({ user, isAuthenticated: true, requiresTwoFactor: false, twoFactorChallengeToken: null, isLoading: false })
    return { requiresTwoFactor: false }
  },

  verifyTwoFactor: async (code) => {
    const challengeToken = get().twoFactorChallengeToken
    const response = await api.post('/v1/auth/two-factor/verify', {
      code,
      challenge_token: challengeToken,
    })
    const { user } = response.data.data
    set({ user, isAuthenticated: true, requiresTwoFactor: false, twoFactorChallengeToken: null, isLoading: false })
  },

  logout: async () => {
    try {
      await api.post('/v1/auth/logout')
    } finally {
      get().clearSession()
    }
  },

  clearSession: () => {
    set({ user: null, isAuthenticated: false, isLoading: false, requiresTwoFactor: false, twoFactorChallengeToken: null })
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/v1/auth/me')
      set({ user: response.data.data, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user) => set({ user }),

  updateUser: (userData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : (userData as User),
    }))
  },

  setActiveRole: (role) => {
    if (role) {
      sessionStorage.setItem('encg_active_role', role)
    } else {
      sessionStorage.removeItem('encg_active_role')
    }
    set({ activeRole: role })
  },

  hasRole: (role) => {
    return get().user?.roles.includes(role) ?? false
  },

  hasPermission: (permission) => {
    return get().user?.permissions.includes(permission) ?? false
  },

  hasAnyRole: (roles) => {
    const userRoles = get().user?.roles ?? []
    if (userRoles.some(r => ['super-admin', 'super_admin', 'admin', 'institution-admin', 'institution_admin', 'director'].includes(r))) {
      const isAdminRoleRequested = roles.some(r => ['super-admin', 'super_admin', 'admin', 'institution-admin', 'institution_admin', 'director'].includes(r))
      if (isAdminRoleRequested) return true
    }
    return roles.some(r => userRoles.includes(r) || userRoles.includes(r.replace('-', '_')) || userRoles.includes(r.replace('_', '-')))
  },
}))
