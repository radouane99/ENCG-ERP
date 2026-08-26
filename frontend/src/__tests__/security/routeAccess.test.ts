import { describe, it, expect } from 'vitest'
import { ADMIN_ROLES, TEACHING_ROLES, userCanAccessRoles } from '@shared/lib/routeAccess'

describe('routeAccess — ProtectedRoute RBAC', () => {
  it('blocks a student from admin routes', () => {
    expect(userCanAccessRoles(['student'], ADMIN_ROLES)).toBe(false)
  })

  it('allows an admin alias on admin routes', () => {
    expect(userCanAccessRoles(['institution_admin'], ADMIN_ROLES)).toBe(true)
  })

  it('allows a professor on teaching routes but not admin-only', () => {
    expect(userCanAccessRoles(['professor'], TEACHING_ROLES)).toBe(true)
    expect(userCanAccessRoles(['professor'], ADMIN_ROLES)).toBe(false)
  })
})
