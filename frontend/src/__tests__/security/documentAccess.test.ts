import { describe, it, expect } from 'vitest'
import {
  withAuthQuery,
  protectedDocumentUrl,
  examEmargementPdfUrl,
  groupEmargementPdfUrl,
} from '@shared/lib/documentAccess'

describe('documentAccess — cookie session, no query token', () => {
  it('leaves API PDF URLs unchanged', () => {
    expect(withAuthQuery('/api/exams/1/pv-pdf')).toBe('/api/exams/1/pv-pdf')
  })

  it('keeps HMAC signed public document URLs intact', () => {
    expect(protectedDocumentUrl('/api/public/serve-document/cnie/N1?sig=hmac')).toBe(
      '/api/public/serve-document/cnie/N1?sig=hmac',
    )
  })

  it('builds emargement URLs with id only — no PII query params', () => {
    expect(examEmargementPdfUrl(197)).toBe('/api/v1/admin/exams/197/emargement-pdf')
    expect(groupEmargementPdfUrl(12)).toBe('/api/v1/admin/groups/12/emargement-pdf')
    expect(examEmargementPdfUrl(197)).not.toMatch(/filiere|code|semester|cne|cin/i)
  })
})
