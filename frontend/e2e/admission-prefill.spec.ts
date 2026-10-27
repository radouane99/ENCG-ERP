import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
import type { OcrRun } from '../src/features/admissions/model/workflow'
const base = '/api/admissions/workflow'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
const campaign = { id: 7, name: 'TAFEM synthétique', entry_route: 'tafem', entry_semester: 1, close_date: '2027-01-01' }
test.describe('Préinscription assistée', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Scénarios synthétiques uniquement')
  for (const mobile of [false, true]) {
    test(`OCR remplit les champs vides et respecte la saisie — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await mockApi(page); await seedSession(page, 'student')
      let dossier = { id: 17, version: 1, first_name: 'Sara', last_name: 'Synthetic', cne: 'N123456789', cin: 'AB123456', reference_number: 'SYN-17', eligibility: 'main', dossier_status: 'draft', campaign, profile: {} as Record<string, unknown>, documents: {} as Record<string, unknown>, required_documents: ['bac', 'cnie', 'releve_notes', 'photo'], reviews: [], events: [], notifications: [], ocr_runs: [] as OcrRun[], cloud_available: false }
      await page.route(url => url.pathname === `${base}/dossier`, r => {
        if (r.request().method() === 'POST') { const { application_id: _id, version: _version, ...profile } = r.request().postDataJSON(); dossier = { ...dossier, version: dossier.version + 1, profile } }
        return r.fulfill(json({ candidate: dossier }))
      })
      await page.route(url => url.pathname === `${base}/slots`, r => r.fulfill(json({ data: [] })))
      await page.route(url => url.pathname === `${base}/documents`, r => { dossier = { ...dossier, version: dossier.version + 1, documents: { bac: { id: 91, type: 'bac', mime_type: 'application/pdf', version: 1, signed_url: '/synthetic.pdf' } }, ocr_runs: [{ id: 'synthetic-run', document_id: 91, status: 'queued', fields: {}, warnings: [] }] }; return r.fulfill(json({ candidate: dossier, document: { id: 91 } })) })
      let starts = 0
      await page.route(url => url.pathname === `${base}/ocr`, r => {
        expect(r.request().postDataJSON()).toMatchObject({ document_id: 91, consent: true, mode: 'local' }); starts++
        return r.fulfill({ ...json({ id: 'synthetic-run', status: 'queued' }), status: 202 })
      })
      await page.route(url => url.pathname === `${base}/ocr/synthetic-run`, r => r.fulfill(json({ id: 'synthetic-run', document_id: 91, status: 'needs_review', warnings: [], fields: {
        first_name_fr: { value: 'Autre prénom', conflict: false }, birth_date: { value: '2006-02-12', conflict: false }, bac_average: { value: 16.5, conflict: false }, cne: { value: 'WRONG', conflict: true },
      } })))
      await page.goto('/admissions/mon-dossier')
      await page.getByLabel('Téléphone personnel', { exact: true }).fill('0612345678')
      await page.getByLabel('Ajouter Baccalauréat', { exact: true }).setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 synthetic') })
      await expect(page.getByLabel('Date de naissance', { exact: true })).toHaveValue('2006-02-12')
      await expect(page.getByLabel('Moyenne du bac /20', { exact: true })).toHaveValue('16.5')
      await expect(page.getByLabel('Prénom', { exact: true })).toHaveValue('Sara')
      await expect(page.getByLabel('Téléphone personnel', { exact: true })).toHaveValue('0612345678')
      expect(starts).toBe(0)
      await expect(page.getByText('2 champ(s) prérempli(s).', { exact: false })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.getByRole('heading', { name: 'Mon dossier d’admission', exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: `test-results/admission-prefill-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
    })
  }
  for (const signedIn of [true, false]) test(`QR ouvre le dossier ${signedIn ? 'avec session' : 'après connexion'}`, async ({ page }) => {
    await mockApi(page); if (signedIn) await seedSession(page, 'admin')
    await page.route(url => url.pathname === `${base}/campaigns`, r => r.fulfill(json({ data: [campaign] })))
    await page.route(url => url.pathname === `${base}/applications`, r => r.fulfill(json({ data: [], total: 0, last_page: 1 })))
    await page.route(url => url.pathname === `${base}/stats`, r => r.fulfill(json({ stats: {} })))
    await page.route(url => url.pathname === `${base}/dossier`, r => {
      expect(new URL(r.request().url()).searchParams.get('application_id')).toBe('17')
      return r.fulfill(json({ candidate: { id: 17, campaign, version: 1, first_name: 'Sara', last_name: 'Synthetic', cne: 'N123456789', cin: 'AB123456', dossier_status: 'submitted', eligibility: 'main', profile: {}, documents: {}, reviews: [], events: [], notifications: [], ocr_runs: [] as OcrRun[], document_history: [] } }))
    })
    await page.goto('/academic/enrollments?campaign_id=7&application_id=17&cne=N123456789')
    if (!signedIn) {
      await expect(page).toHaveURL(/\/login/)
      await page.locator('input[type="email"]').fill('admin@example.test')
      await page.locator('input[type="password"]').fill('TestOnlyPassword123!')
      await page.locator('button[type="submit"]').click()
    }
    await expect(page.getByRole('heading', { name: 'Synthetic Sara', exact: true })).toBeVisible()
  })
})
