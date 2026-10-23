import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify({ data }) })
test.describe('Gratuité formation initiale et cursus payants', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Contrats synthétiques de scolarité.')
  for (const mobile of [false, true]) {
    const device = mobile ? 'mobile' : 'desktop'
    test(`TAFEM / CNAEM : confirmation sans étape financière — ${device}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await mockApi(page); await seedSession(page, 'student')
      let confirmed = false
      const data = () => ({ student_name: 'Étudiant synthétique CNAEM', cne: 'SYN-INITIAL', academic_year: '2026/2027', current_filiere: 'Formation initiale Grande École', target_semester: 5, is_admis: true, is_confirmed: confirmed, can_confirm: true, payment_required: false, payment_status: 'not_applicable', invoice_reference: null, invoice_remaining: null, receipt_reference: confirmed ? 'SYN-RENEWAL' : null, phone: '0612345678', address: 'Adresse synthétique', city: 'Fès' })
      await page.route(url => url.pathname === '/api/student-portal/reinscription/status', route => route.fulfill(json(data())))
      await page.route(url => url.pathname === '/api/student-portal/reinscription/confirm', async route => {
        expect(route.request().postDataJSON()).toEqual({ phone: '0612345678', address: 'Adresse synthétique', city: 'Fès' })
        confirmed = true; await route.fulfill(json({ receipt_reference: 'SYN-RENEWAL' }))
      })
      await page.goto('/student/reinscription')
      await expect(page.getByRole('heading', { name: 'Inscription académique validée' })).toBeVisible()
      await expect(page.getByRole('list', { name: 'Étapes de la réinscription' }).getByRole('listitem')).toHaveCount(2)
      await expect(page.getByText(/situation financière|règlement|facture|frais|exonéré/i)).toHaveCount(0)
      await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Confirmer ma réinscription' }).click()
      await expect(page.getByRole('heading', { name: 'Réinscription confirmée' })).toBeVisible()
      await expect(page.getByText('SYN-RENEWAL', { exact: true })).toBeVisible()
      await expect(page.getByText(/situation financière|règlement|facture|frais|exonéré/i)).toHaveCount(0)
      await page.screenshot({ path: `test-results/initial-education-${device}.png`, fullPage: true })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.keyboard.press('Control+k')
      await expect(page.getByPlaceholder(/Rechercher étudiant/)).toBeVisible()
      await expect(page.getByText('Régie & Formations Continues (Masters/MBA)', { exact: true })).toHaveCount(0)
    })
    test(`master à temps aménagé : situation financière conservée — ${device}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await mockApi(page); await seedSession(page, 'student')
      await page.route(url => url.pathname === '/api/student-portal/reinscription/status', route => route.fulfill(json({ student_name: 'Étudiant synthétique master', cne: 'SYN-PAID', academic_year: '2026/2027', current_filiere: 'Master à temps aménagé', target_semester: 1, is_admis: true, is_confirmed: false, can_confirm: false, payment_required: true, payment_status: 'pending', invoice_reference: 'SYN-INVOICE', invoice_remaining: 1000 })))
      await page.goto('/student/reinscription')
      await expect(page.getByRole('list', { name: 'Étapes de la réinscription' }).getByRole('listitem')).toHaveCount(3)
      await expect(page.getByText('2. Situation financière')).toBeVisible()
      await expect(page.getByText('Règlement à vérifier par la régie')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Confirmer ma réinscription' })).toBeDisabled()
    })
  }
})
