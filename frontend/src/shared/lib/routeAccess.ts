export function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/_/g, '-').trim()
}

export const ADMIN_ROLES = [
  'super-admin',
  'super_admin',
  'admin',
  'institution-admin',
  'institution_admin',
  'director',
]

export const ACADEMIC_ROLES = [...ADMIN_ROLES, 'department-head', 'filiere-head']
export const TEACHING_ROLES = [...ACADEMIC_ROLES, 'professor', 'vacataire']
export const HR_ROLES = [...ADMIN_ROLES, 'hr-officer']
export const STAFF_ROLES = [...TEACHING_ROLES, 'finance-officer', 'hr-officer', 'library-manager', 'discipline-committee']

export function userCanAccessRoles(userRoles: string[] | undefined, requiredRoles: string[]): boolean {
  const requestedRoles = requiredRoles.map(normalizeRole)
  const currentRoles = (userRoles ?? []).map(normalizeRole)
  const adminAliases = new Set(ADMIN_ROLES.map(normalizeRole))

  return requestedRoles.some((role) => {
    if (currentRoles.includes(role)) {
      return true
    }
    if (adminAliases.has(role)) {
      return currentRoles.some((userRole) => adminAliases.has(userRole))
    }
    return false
  })
}
