import { describe, it, expect } from 'vitest'
import { withAuthQuery, protectedDocumentUrl } from '@shared/lib/documentAccess'

describe('documentAccess — cookie session, no query token', () => {
  it('leaves API PDF URLs unchanged', () => {
    expect(withAuthQuery('/api/exams/1/pv-pdf')).toBe('/api/exams/1/pv-pdf')
  })

  it('keeps HMAC signed public document URLs intact', () => {
    expect(protectedDocumentUrl('/api/public/serve-document/cnie/N1?sig=hmac')).toBe(
      '/api/public/serve-document/cnie/N1?sig=hmac',
    )
  })
})
