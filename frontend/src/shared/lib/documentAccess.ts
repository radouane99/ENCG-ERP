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

/** Helper to create an instant tab with an institutional loader, bypassing popup blockers */
function createPendingPdfWindow(): Window | null {
  try {
    const win = window.open('about:blank', '_blank')
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Chargement du Document Officiel...</title>
          <style>
            body {
              margin: 0;
              background-color: #0b132b;
              color: #f8fafc;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            .card {
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              padding: 32px 40px;
              text-align: center;
              max-width: 440px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            }
            .spinner {
              width: 42px;
              height: 42px;
              border: 3.5px solid rgba(255,255,255,0.15);
              border-top-color: #38bdf8;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 20px auto;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            h2 { margin: 0 0 8px 0; font-size: 17px; font-weight: 700; letter-spacing: 0.3px; color: #ffffff; }
            p { margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h2>Génération du Document Officiel...</h2>
            <p>École Nationale de Commerce et de Gestion de Fès<br><span style="color:#38bdf8;font-size:12px;">Chargement du PDF sécurisé...</span></p>
          </div>
        </body>
        </html>
      `)
    }
    return win
  } catch {
    return null
  }
}

/** Safely present or download a generated PDF blob */
function presentPdfBlob(blobData: any, targetWindow: Window | null, fallbackFilename = 'document_officiel_encg.pdf'): void {
  const blob = new Blob([blobData], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)

  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = objectUrl
  } else {
    // If popup was blocked or window closed, trigger direct download/open fallback
    const link = document.createElement('a')
    link.href = objectUrl
    link.target = '_blank'
    link.download = fallbackFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000)
}

/** Department head ordre de service — department_id sent in POST body, not URL. */
export async function openDepartmentOrdreDeServicePdf(departmentId: number): Promise<void> {
  const targetWindow = createPendingPdfWindow()
  try {
    const response = await api.post('/v1/admin/professor-assignments/ordre-de-service-pdf', {
      department_id: departmentId,
    }, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
    presentPdfBlob(response.data, targetWindow, `Ordre_Service_Dept_${departmentId}.pdf`)
  } catch (err) {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.close()
    }
    throw err
  }
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

async function openPdfBlob(apiPath: string, fallbackFilename?: string): Promise<void> {
  const targetWindow = createPendingPdfWindow()
  try {
    const response = await api.get(apiPath.replace(/^\/api/, ''), {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
    presentPdfBlob(response.data, targetWindow, fallbackFilename)
  } catch (err) {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.close()
    }
    throw err
  }
}

/** Open émargement PDF via authenticated blob — address bar shows blob:, not API params. */
export async function openExamEmargementPdf(examId: string | number): Promise<void> {
  await openPdfBlob(examEmargementPdfUrl(examId), `Liste_Emargement_Examen_${examId}.pdf`)
}

export async function openGroupEmargementPdf(groupId: string | number): Promise<void> {
  await openPdfBlob(groupEmargementPdfUrl(groupId), `Liste_Emargement_Groupe_${groupId}.pdf`)
}

/** Secure URL — exam id only. */
export function examDoorSignPdfUrl(examId: string | number): string {
  return `/api/v1/admin/exams/${examId}/door-sign-pdf`
}

export async function openExamDoorSignPdf(examId: string | number): Promise<void> {
  await openPdfBlob(examDoorSignPdfUrl(examId), `Affiche_Porte_Examen_${examId}.pdf`)
}

/** Preview / custom attestation — sensitive fields sent in POST body, not URL. */
export async function openCustomAttestationPdf(payload: CustomAttestationPayload): Promise<void> {
  const targetWindow = createPendingPdfWindow()
  try {
    const response = await api.post('/v1/enrollments/attestation-pdf', payload, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
    presentPdfBlob(response.data, targetWindow, 'Attestation_Officielle.pdf')
  } catch (err) {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.close()
    }
    throw err
  }
}
