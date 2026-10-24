// A scanned registration sheet may resume only this local protected screen.
export function admissionReturnPath(state: unknown): string {
  const path = (state as { returnTo?: unknown } | null)?.returnTo
  if (typeof path !== 'string' || !path.startsWith('/academic/enrollments?')) return '/dashboard'
  return path
}
