import api from './api'

export type AttestationPdfType = 'scolarite' | 'inscription' | 'recepisse'

export type CustomAttestationPayload = {
  name: string
  cne: string
  cin?: string
  filiere?: string
  group?: string
  type?: AttestationPdfType
  student_id?: string
}

/** Secure URL — student id only, no PII in query string. */
export function studentAttestationPdfUrl(
  studentId: string | number,
  type: AttestationPdfType = 'scolarite',
  extra?: Record<string, string | number | boolean>,
): string {
  const params = new URLSearchParams({ type })
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => params.set(key, String(value)))
  }
  return `/api/v1/admin/students/${studentId}/attestation-pdf?${params.toString()}`
}

/** Same-origin PDFs use the HttpOnly auth cookie — never put the Sanctum token in the URL. */
export function withAuthQuery(url: string): string {
  return url || ''
}

export function protectedDocumentUrl(url: string | undefined | null): string {
  return url || ''
}

export function openAuthenticatedUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function openStudentAttestationPdf(
  studentId: string | number,
  type: AttestationPdfType = 'scolarite',
  extra?: Record<string, string | number | boolean>,
): void {
  openAuthenticatedUrl(studentAttestationPdfUrl(studentId, type, extra))
}

/** Preview / custom attestation — sensitive fields sent in POST body, not URL. */
export async function openCustomAttestationPdf(payload: CustomAttestationPayload): Promise<void> {
  const response = await api.post('/v1/enrollments/attestation-pdf', payload, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}
