// Resume only the explicitly allowed local dossier screens.
export function admissionReturnPath(state: unknown): string {
  const path = (state as { returnTo?: unknown } | null)?.returnTo
  if (path === '/admissions/mon-dossier') return path
  if (typeof path !== 'string' || !path.startsWith('/academic/enrollments?')) return '/dashboard'
  return path
}
