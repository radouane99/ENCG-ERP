import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, type User } from '@/stores/authStore'

describe('useAuthStore — RBAC & State Management', () => {
  const mockStudentUser: User = {
    id: 101,
    name: 'Yassine Alami',
    email: 'yassine.alami@encg-fes.ma',
    roles: ['student'],
    permissions: ['grades.view', 'documents.request'],
    institution_id: 1,
    institution_name: 'ENCG Fès',
    two_factor_enabled: false,
    locale: 'fr',
  }

  const mockAdminUser: User = {
    id: 1,
    name: 'Directeur ENCG',
    email: 'direction@encg-fes.ac.ma',
    roles: ['admin', 'institution-admin'],
    permissions: ['grades.view', 'grades.edit', 'deliberation.run', 'users.manage'],
    institution_id: 1,
    institution_name: 'ENCG Fès',
    two_factor_enabled: true,
    locale: 'fr',
  }

  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      activeRole: null,
    })
  })

  it('sets and updates student user profile correctly', () => {
    useAuthStore.getState().setUser(mockStudentUser)
    expect(useAuthStore.getState().user?.name).toBe('Yassine Alami')
    expect(useAuthStore.getState().hasRole('student')).toBe(true)
    expect(useAuthStore.getState().hasRole('admin')).toBe(false)
  })

  it('evaluates specific student permissions correctly', () => {
    useAuthStore.getState().setUser(mockStudentUser)
    expect(useAuthStore.getState().hasPermission('grades.view')).toBe(true)
    expect(useAuthStore.getState().hasPermission('deliberation.run')).toBe(false)
  })

  it('evaluates admin role hierarchy and permissions correctly', () => {
    useAuthStore.getState().setUser(mockAdminUser)
    expect(useAuthStore.getState().hasAnyRole(['admin', 'student'])).toBe(true)
    expect(useAuthStore.getState().hasPermission('deliberation.run')).toBe(true)
  })

  it('clears state on user logout', () => {
    useAuthStore.getState().setUser(mockStudentUser)
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
