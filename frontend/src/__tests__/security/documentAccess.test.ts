import { describe, it, expect, beforeEach } from 'vitest'
import { withAuthQuery } from '@shared/lib/documentAccess'
import { useAuthStore } from '@/stores/authStore'

describe('documentAccess — query token helper', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'staff-token' })
  })

  it('appends a token query param to API PDF URLs', () => {
    expect(withAuthQuery('/api/exams/1/pv-pdf')).toBe('/api/exams/1/pv-pdf?token=staff-token')
  })

  it('does not duplicate an existing token or HMAC signature', () => {
    expect(withAuthQuery('/api/docs?token=abc')).toBe('/api/docs?token=abc')
    expect(withAuthQuery('/api/docs?sig=hmac')).toBe('/api/docs?sig=hmac')
  })
})
