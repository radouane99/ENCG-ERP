import { describe, it, expect } from 'vitest'
import { validateUploadFile } from '@shared/lib/fileUpload'

describe('fileUpload — client allowlist', () => {
  it('rejects an executable disguised as an upload', () => {
    const file = new File(['mz'], 'payload.exe', { type: 'application/octet-stream' })
    expect(validateUploadFile(file)).toBe('Type de fichier non autorisé.')
  })

  it('accepts a PDF under the size limit', () => {
    const file = new File(['%PDF'], 'justificatif.pdf', { type: 'application/pdf' })
    expect(validateUploadFile(file)).toBeNull()
  })
})
