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

export type OrdreDeServicePayload = {
  professor_id?: string
  department_id?: number
}

/** Secure URL — department id only, no PII in query string. */
export function departmentArreteNominationPdfUrl(departmentId: number): string {
  return `/api/v1/admin/departments/${departmentId}/arrete-nomination-pdf`
}

export function openDepartmentArreteNominationPdf(departmentId: number): void {
  openAuthenticatedUrl(departmentArreteNominationPdfUrl(departmentId))
}

/** Secure URL — professor id only, no PII in query string. */
export function professorOrdreDeServicePdfUrl(professorId: string | number): string {
  return `/api/v1/admin/professors/${professorId}/ordre-de-service-pdf`
}

/** Ordre de Service for the logged-in professor (no id in URL). */
export function myOrdreDeServicePdfUrl(): string {
  return '/api/v1/me/ordre-de-service-pdf'
}

export function openProfessorOrdreDeServicePdf(professorId: string | number): void {
  openAuthenticatedUrl(professorOrdreDeServicePdfUrl(professorId))
}

export function openMyOrdreDeServicePdf(): void {
  openAuthenticatedUrl(myOrdreDeServicePdfUrl())
}

/** Department head ordre de service — department_id sent in POST body, not URL. */
export async function openDepartmentOrdreDeServicePdf(departmentId: number): Promise<void> {
  const response = await api.post('/v1/admin/professor-assignments/ordre-de-service-pdf', {
    department_id: departmentId,
  }, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
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

/** Secure URL — exam id only, no PII in query string. */
export function examEmargementPdfUrl(examId: string | number): string {
  return `/api/v1/admin/exams/${examId}/emargement-pdf`
}

/** Secure URL — group id only, no PII in query string. */
export function groupEmargementPdfUrl(groupId: string | number): string {
  return `/api/v1/admin/groups/${groupId}/emargement-pdf`
}

async function openPdfBlob(apiPath: string): Promise<void> {
  const response = await api.get(apiPath.replace(/^\/api/, ''), {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

/** Open émargement PDF via authenticated blob — address bar shows blob:, not API params. */
export async function openExamEmargementPdf(examId: string | number): Promise<void> {
  await openPdfBlob(examEmargementPdfUrl(examId))
}

export async function openGroupEmargementPdf(groupId: string | number): Promise<void> {
  await openPdfBlob(groupEmargementPdfUrl(groupId))
}

/** Secure URL — exam id only. */
export function examDoorSignPdfUrl(examId: string | number): string {
  return `/api/v1/admin/exams/${examId}/door-sign-pdf`
}

export async function openExamDoorSignPdf(examId: string | number): Promise<void> {
  await openPdfBlob(examDoorSignPdfUrl(examId))
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
