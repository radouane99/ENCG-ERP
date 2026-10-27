import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
import type { AdmissionDossier, OcrRun } from '../src/features/admissions/model/workflow'

test('deux faces CNIE puis bac : extraction automatique de chaque document sans choix ni perte de résultat', async ({ page }) => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Données synthétiques uniquement')
  await mockApi(page); await seedSession(page, 'student')
  let dossier = { id: 17, version: 1, first_name: 'Sara', last_name: 'Synthetic', cne: 'N123456789', cin: 'AB123456',
    reference_number: 'SYN-17', eligibility: 'main', dossier_status: 'draft', campaign: { id: 7, name: 'Campagne test', entry_route: 'tafem', open_date: '2026-01-01', close_date: '2027-01-01' },
    profile: {}, documents: {}, required_documents: ['bac', 'cnie', 'releve_notes', 'photo'], reviews: [], events: [], notifications: [], ocr_runs: [], cloud_available: false } as unknown as AdmissionDossier
  let uploads = 0; let explicitStarts = 0
  const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
  await page.route(url => url.pathname === '/api/admissions/workflow/dossier', route => {
    if (route.request().method() === 'POST') {
      const { application_id: _id, version: _version, ...profile } = route.request().postDataJSON()
      dossier = { ...dossier, version: dossier.version + 1, profile }
    }
    return route.fulfill(json({ candidate: dossier }))
  })
  await page.route(url => url.pathname === '/api/admissions/workflow/ocr', route => { explicitStarts++; return route.fulfill({ ...json({}), status: 500 }) })
  await page.route(url => url.pathname === '/api/admissions/workflow/documents', route => {
    uploads++
    const type = uploads === 1 ? 'cnie' : 'bac'
    if (type === 'cnie') expect(route.request().postDataBuffer()?.toString()).toContain('name="file_verso"')
    const doc = { id: uploads + 90, type, version: 1, status: 'pending', mime_type: 'application/pdf', signed_url: '/synthetic.pdf' }
    const run = { id: `run-${type}`, document_id: doc.id, status: 'queued', fields: {}, warnings: [] } as OcrRun
    dossier = { ...dossier, version: dossier.version + 1, documents: { ...dossier.documents, [type]: doc }, ocr_runs: [...(dossier.ocr_runs ?? []), run] }
    return route.fulfill(json({ candidate: dossier, document: doc }))
  })
  for (const type of ['cnie', 'bac']) await page.route(url => url.pathname === `/api/admissions/workflow/ocr/run-${type}`, route => {
    const values = type === 'cnie' ? { address: '12 RUE TEST', address_ar: 'عنوان تجريبي', birth_city: 'MEKNES', birth_city_ar: 'مكناس', cin: 'WRONG' } : { bac_average: 16.5, bac_mention: 'Très Bien', bac_province: 'FES' }
    return route.fulfill(json({ id: `run-${type}`, document_id: type === 'cnie' ? 91 : 92, status: uploads < 2 ? 'processing' : 'needs_review', warnings: [], fields: uploads < 2 ? {} : Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value, conflict: key === 'cin', requires_confirmation: true }])) }))
  })
  await page.goto('/admissions/mon-dossier')
  await expect(page.getByText('Mode de traitement', { exact: true })).toHaveCount(0)
  const image = { name: 'face.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a99sAAAAASUVORK5CYII=', 'base64') }
  await page.getByLabel('CNIE recto', { exact: true }).setInputFiles(image)
  expect(uploads).toBe(0)
  await page.getByLabel('CNIE verso', { exact: true }).setInputFiles(image)
  await expect.poll(() => uploads).toBe(1)
  await page.getByLabel('Ajouter Baccalauréat', { exact: true }).setInputFiles({ name: 'bac.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 SYNTHETIC') })
  await expect(page.locator('#admission-address_ar')).toHaveValue('عنوان تجريبي')
  await expect(page.locator('#admission-birth_city')).toHaveValue('MEKNES')
  await expect(page.locator('#admission-bac_average')).toHaveValue('16.5')
  await expect(page.locator('#admission-bac_province')).toHaveValue('FES')
  await expect.poll(() => dossier.profile.address).toBe('12 RUE TEST')
  expect(explicitStarts).toBe(0)
  expect(dossier.cin).toBe('AB123456')
})
