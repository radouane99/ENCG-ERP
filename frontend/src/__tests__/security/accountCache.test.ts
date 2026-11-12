import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@shared/lib/queryClient'
vi.mock('@shared/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
import { useAuthStore, type User } from '@stores/authStore'

const account = (id: number, institution_id = 1) => ({ id, institution_id, roles: ['student'], permissions: [] }) as unknown as User

beforeEach(() => {
  useAuthStore.getState().clearSession()
  queryClient.clear()
})

describe('private cache account boundaries', () => {
  it('drops private records and sudo proof when clearing a session', () => {
    useAuthStore.getState().setUser(account(1))
    queryClient.setQueryData(['student-grades'], { privateMarker: 'A' })
    sessionStorage.setItem('encg_sudo_token', 'dummy-A')
    useAuthStore.getState().clearSession()
    expect(queryClient.getQueryData(['student-grades'])).toBeUndefined()
    expect(sessionStorage.getItem('encg_sudo_token')).toBeNull()
  })

  it('does not let a different account inherit a static private key', () => {
    useAuthStore.getState().setUser(account(1))
    queryClient.setQueryData(['studentInternships'], ['dummy-A'])
    useAuthStore.getState().setUser(account(2))
    expect(queryClient.getQueryData(['studentInternships'])).toBeUndefined()
  })

  it('isolates late callbacks still holding the previous query client', () => {
    useAuthStore.getState().setUser(account(1))
    const previousClient = queryClient
    useAuthStore.getState().setUser(account(2))
    previousClient.setQueryData(['private'], 'late-A')
    expect(queryClient.getQueryData(['private'])).toBeUndefined()
    expect(queryClient).not.toBe(previousClient)
    previousClient.clear()
  })

  it('also invalidates private state when institution or active role changes', () => {
    useAuthStore.getState().setUser(account(1))
    queryClient.setQueryData(['private'], 'A')
    useAuthStore.getState().setUser(account(1, 2))
    expect(queryClient.getQueryData(['private'])).toBeUndefined()
    queryClient.setQueryData(['private'], 'B')
    useAuthStore.getState().setActiveRole('professor')
    expect(queryClient.getQueryData(['private'])).toBeUndefined()
  })
})
