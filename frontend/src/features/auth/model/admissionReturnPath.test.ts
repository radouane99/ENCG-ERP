import { expect, it } from 'vitest'
import { admissionReturnPath } from './admissionReturnPath'
it('resumes the protected dossier and rejects arbitrary redirects', () => {
  expect(admissionReturnPath({ returnTo: '/academic/enrollments?application_id=7' })).toBe('/academic/enrollments?application_id=7')
  for (const returnTo of ['https://external.test', '//external.test', '/admin/roles', null]) expect(admissionReturnPath({ returnTo })).toBe('/dashboard')
})
