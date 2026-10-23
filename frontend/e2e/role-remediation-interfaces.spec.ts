import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
const date = '2026-11-01'
async function prepare(page: Page, role: 'admin' | 'student') { await mockApi(page); await seedSession(page, role) }
test.describe('Interfaces des parcours corrigés', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Contrôles des interfaces avec données synthétiques.')
  for (const mobile of [false, true]) {
    const size = mobile ? 'mobile' : 'desktop'
    test(`régie : création de facture et formulaire accessible — ${size}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await prepare(page, 'admin')
      await page.route(url => url.pathname === '/api/finance/stats', route => route.fulfill(json({ data: { revenue_month: '400.00 MAD', unpaid_amount: '600.00 MAD', unpaid_count: 1, payments: [{ id: 1, name: 'Étudiant Synthétique', cne: 'SYNTH-01', type: 'Formation continue', amount: '1000.00 MAD', remaining_amount: 600, date, status: 'PENDING', receipt_number: 'FACT-SYNTH-01' }], meta: { current_page: 1, last_page: 1, total: 1 } } })))
      await page.route(url => url.pathname === '/api/admin/finance/options', route => route.fulfill(json({ students: [{ id: 1, name: 'Étudiant Synthétique', cne: 'SYNTH-01' }], years: [{ id: 1, label: '2026/2027' }], filieres: [{ id: 1, name: 'Formation continue' }] })))
      await page.route(url => url.pathname === '/api/admin/finance/invoices', async route => { expect(route.request().postDataJSON()).toMatchObject({ student_id: '1', amount: '1000' }); await route.fulfill({ status: 201, ...json({ success: true, invoice: { id: 2 } }) }) })
      await page.goto('/admin/finance'); await expect(page.getByRole('heading', { name: 'Régie & frais de formation' })).toBeVisible()
      await page.screenshot({ path: `test-results/remediation-finance-${size}.png`, fullPage: true })
      await page.getByRole('button', { name: 'Créer une facture', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Créer une facture de formation' })
      await dialog.getByRole('combobox', { name: 'Étudiant', exact: true }).selectOption('1')
      await dialog.getByRole('combobox', { name: 'Année universitaire' }).selectOption('1'); await dialog.getByRole('combobox', { name: 'Formation payante' }).selectOption('1')
      await dialog.getByLabel('Montant facturé (MAD)').fill('1000'); await dialog.getByLabel('Date d’échéance').fill(date)
      await dialog.getByRole('button', { name: 'Créer la facture', exact: true }).click(); await expect(dialog).toBeHidden()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
    test(`réinscription : état incomplet explicite — ${size}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await prepare(page, 'student')
      await page.route(url => url.pathname === '/api/student-portal/reinscription/status', route => route.fulfill(json({ data: { student_name: 'Étudiant Synthétique', cne: 'SYNTH-01', academic_year: '2026/2027', current_filiere: 'Grande École', current_semester: 3, target_semester: null, is_admis: false, is_confirmed: false, can_confirm: false, payment_required: false, blocking_reason: 'La scolarité doit valider votre inscription académique annuelle.' } })))
      await page.goto('/student/reinscription'); await expect(page.getByRole('heading', { name: 'Validation académique en attente' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Confirmer ma réinscription' })).toBeDisabled(); await expect(page.getByText('AJOURNÉ(E) • REDOUBLEMENT')).toHaveCount(0)
      await page.screenshot({ path: `test-results/remediation-renewal-${size}.png`, fullPage: true })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
    test(`spécialités : ordre et contrat des préférences — ${size}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await prepare(page, 'student')
      await page.route(url => url.pathname === '/api/student-portal/specialty-wishes', async route => {
        if (route.request().method() === 'POST') expect(route.request().postDataJSON()).toEqual({ wishes: [{ filiere_id: 2, preference_rank: 1 }, { filiere_id: 1, preference_rank: 2 }] })
        await route.fulfill(json({ data: { academic_year: '2026/2027', target_semester: 5, filieres: [{ id: 1, name: 'Finance', capacity: 20, min_score_required: 12 }, { id: 2, name: 'Marketing', capacity: 25, min_score_required: 12 }], existing_wishes: [], student_merit_score: 15, score_complete: true, is_campaign_open: true, deadline: '2026-11-30T23:59:00Z' } }))
      })
      await page.goto('/student/specialty-choices'); await page.getByRole('button', { name: 'Monter Marketing', exact: true }).click()
      await expect(page.getByText('Modifications non enregistrées')).toBeVisible(); await page.getByRole('button', { name: 'Enregistrer mes choix' }).click()
      await expect(page.getByText('Vos préférences ont été enregistrées.', { exact: true })).toBeVisible()
      await page.screenshot({ path: `test-results/remediation-choices-${size}.png`, fullPage: true })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }
  test('affectation : aperçu obligatoire avant enregistrement', async ({ page }) => {
    await prepare(page, 'admin')
    const data = { campaign: { revision: 1, source_year_id: 1, target_year_id: 1, target_semester: 5, is_open: false }, years: [{ id: 1, label: '2026/2027' }], filieres: [{ id: 1, name: 'Finance' }], quotas: [{ filiere_id: 1, capacity: 1, min_score_required: 12, is_open: true, allocated_count: 0 }], candidates: [{ student_id: 1, student_name: 'Étudiant Synthétique', cne: 'SYNTH-01', merit_score: 15, wishes: [{ id: 1, filiere_id: 1, preference_rank: 1, filiere: { name: 'Finance' } }] }] }
    await page.route(url => url.pathname === '/api/admin/specialty-allocation/simulation', route => route.fulfill(json({ data })))
    await page.route(url => url.pathname === '/api/admin/specialty-allocation/preview', route => route.fulfill(json({ plan: { id: 'synthetic-plan', assignments: [{ student_id: 1, filiere_id: 1, score: 15, status: 'assigned', waiting_rank: null }] } })))
    await page.route(url => url.pathname === '/api/admin/specialty-allocation/run', async route => { expect(route.request().postDataJSON()).toEqual({ plan_id: 'synthetic-plan' }); await route.fulfill(json({ success: true, data: { allocated_count: 1 } })) })
    await page.goto('/admin/specialty-allocation'); await expect(page.getByRole('button', { name: 'Enregistrer les affectations', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Calculer l’aperçu' }).click(); await page.getByRole('button', { name: 'Enregistrer les affectations', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmer les affectations' }).click(); await expect(page.getByRole('dialog')).toBeHidden()
    await page.screenshot({ path: 'test-results/remediation-allocation-desktop.png', fullPage: true })
  })
})
