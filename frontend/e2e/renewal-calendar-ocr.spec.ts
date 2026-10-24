import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
const initial = { academic_year_id: 1, academic_year: '2026/2027', version: 0, status: 'draft', state: 'unconfigured', is_open: false, opens_on: null, closes_on: null, public_message: null, message: 'La scolarité doit publier le calendrier de réinscription.', timezone: 'Africa/Casablanca' }
async function admin(page: Page) {
  await mockApi(page); await seedSession(page, 'admin')
  await page.route(url => url.pathname === '/api/admin/reinscriptions/stats', r => r.fulfill(json({ data: { academic_year: '2026/2027', total_eligible: 0, total_pending: 0, total_physical_pending: 0, total_verified: 0, total_needs_review: 0, students: [], physical_requirements: {}, by_level: {}, meta: { total: 0, last_page: 1 } } })))
}
test.describe('Calendrier annuel et recette OCR', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Fixtures synthétiques uniquement.')
  for (const mobile of [false, true]) {
    const device = mobile ? 'mobile' : 'desktop'
    test(`publication et fermeture du calendrier — ${device}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await admin(page); let version = 0
      await page.route(url => url.pathname === '/api/admin/reinscriptions/campaign', async r => {
        if (r.request().method() === 'GET') return r.fulfill(json({ data: initial, can_manage: true }))
        const body = r.request().postDataJSON(); expect(body.version).toBe(version); version++
        return r.fulfill(json({ data: { ...initial, ...body, version, state: body.status, is_open: body.status === 'open', message: body.status === 'open' ? 'La campagne de réinscription est ouverte.' : 'La campagne de réinscription est fermée.' }, can_manage: true }))
      })
      await page.goto('/admin/reinscriptions')
      const panel = page.getByRole('region', { name: 'Calendrier des réinscriptions' })
      await panel.getByLabel('Ouverture', { exact: true }).fill('2026-10-24')
      await panel.getByLabel('Clôture', { exact: true }).fill('2026-10-30')
      await panel.getByLabel('Publication', { exact: true }).selectOption('open')
      await panel.getByLabel('Consignes publiques').fill('Guichet scolarité : présenter les originaux.')
      await panel.getByRole('button', { name: 'Enregistrer le calendrier' }).click()
      await expect(panel.getByText(/La campagne de réinscription est ouverte/)).toBeVisible()
      await panel.getByLabel('Publication', { exact: true }).selectOption('closed')
      await panel.getByRole('button', { name: 'Enregistrer le calendrier' }).click()
      await expect(panel.getByText(/La campagne de réinscription est fermée/)).toBeVisible()
      expect(version).toBe(2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
      await page.screenshot({ path: `test-results/renewal-calendar-${device}.png`, fullPage: true })
    })
    test(`étudiant hors délai : dates et consignes visibles — ${device}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await mockApi(page); await seedSession(page, 'student')
      await page.route(url => url.pathname === '/api/student-portal/reinscription/status', r => r.fulfill(json({ data: { student_name: 'Étudiant synthétique', academic_year: '2026/2027', cne: 'SYN-CALENDAR', current_filiere: 'Formation initiale', phone: '0612345678', address: 'Adresse synthétique', city: 'Fès', is_admis: true, is_confirmed: false, can_confirm: false, payment_required: false, target_semester: 3,
        blocking_reason: 'La date limite de réinscription est dépassée.', campaign: { ...initial, opens_on: '2026-10-01', closes_on: '2026-10-20', state: 'expired', message: 'La date limite de réinscription est dépassée.', public_message: 'Contactez la scolarité pour votre situation.' } } })))
      await page.goto('/student/reinscription')
      await expect(page.getByRole('heading', { name: 'Calendrier de ma réinscription' })).toBeVisible()
      await expect(page.getByText('Contactez la scolarité pour votre situation.')).toBeVisible()
      await page.getByRole('checkbox').check()
      await expect(page.getByRole('button', { name: 'Confirmer ma réinscription' })).toBeDisabled()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    })
    test(`OCR : consentement, comparaison et résultat agrégé — ${device}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await admin(page)
      await page.route(url => url.pathname === '/api/admissions/workflow/campaigns', r => r.fulfill(json({ data: [] })))
      await page.route(url => url.pathname === '/api/admissions/workflow/references', r => r.fulfill(json({ years: [], filieres: [] })))
      await page.route(url => url.pathname === '/api/admissions/workflow/ocr-settings', r => r.fulfill(json({ provider: 'local', cloud_enabled: false, configured: false, can_manage: true, local_available: true })))
      let calls = 0
      await page.route(url => url.pathname === '/api/admissions/workflow/ocr-evaluation', r => { calls++; expect(r.request().headers()['content-type']).toContain('multipart/form-data'); return r.fulfill(json({ data: { dataset_kind: 'synthetic', samples: 2, totals: { labeled: 4, exact: 2, missing: 1, mismatched: 1, critical_mismatches: 1 }, exact_match_percent: 50, by_document_type: { bac: { labeled: 2, exact: 2, missing: 0, mismatched: 0 } }, by_field: {}, notice: 'Aucun moteur OCR n’est appelé par cette comparaison.' } })) })
      await page.goto('/academic/enrollments'); await page.getByRole('button', { name: 'Campagnes & échéances', exact: true }).click()
      const panel = page.getByRole('region', { name: 'Recette OCR', exact: true })
      await panel.getByLabel(/Annotations attendues et extraites/).setInputFiles({ name: 'synthetic.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ dataset_kind: 'synthetic', samples: [] })) })
      await expect(panel.getByRole('button', { name: 'Comparer les annotations' })).toBeDisabled()
      await panel.getByRole('checkbox').check(); await panel.getByRole('button', { name: 'Comparer les annotations' }).click()
      await expect(panel.getByText('50 %', { exact: true })).toBeVisible(); expect(calls).toBe(1)
      await expect(panel.getByText(/Jeu synthétique/)).toBeVisible()
      const download = page.waitForEvent('download'); await panel.getByRole('button', { name: 'Télécharger le rapport agrégé' }).click(); expect(await (await download).failure()).toBeNull()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
      await page.screenshot({ path: `test-results/ocr-evaluation-${device}.png`, fullPage: true })
    })
  }
})
