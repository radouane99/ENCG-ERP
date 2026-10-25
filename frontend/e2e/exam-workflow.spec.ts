import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
async function admin(page: Page) { await mockApi(page); await seedSession(page, 'admin') }
const live = { session_name: 'Session synthétique', students: { total: 3, present: 1, absent: 0, unrecorded: 2 }, professors: { total: 2, present: 0, absent: 0, confirmed: 1 } }

test.describe('Workflow complet des examens', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'API synthétiques uniquement')
  for (const mobile of [false, true]) test(`supervision globale accessible et pointages non saisis visibles — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await admin(page)
    await page.route(url => url.pathname === '/api/convocations/session/8/live-stats', route => route.fulfill(json({ data: live })))
    await page.goto('/admin/exams/sessions/8/live')
    await expect(page.getByRole('heading', { name: 'Supervision de la session', exact: true })).toBeVisible()
    await expect(page.getByText(/2 pointage\(s\) encore à saisir/)).toBeVisible()
    await expect(page.getByText('NaN%')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/exam-live-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })

  test('une erreur live est visible et ne ressemble pas à un bilan vide confirmé', async ({ page }) => {
    await admin(page)
    await page.route(url => url.pathname === '/api/convocations/session/8/live-stats', route => route.fulfill({ ...json({ message: 'Suivi temporairement indisponible' }), status: 503 }))
    await page.goto('/admin/exams/sessions/8/live')
    await expect(page.getByRole('alert').filter({ hasText: 'Suivi indisponible' })).toBeVisible()
  })

  test('le cockpit conserve la session entre planning, convocations et supervision', async ({ page }) => {
    await admin(page)
    await page.route(url => url.pathname === '/api/exam-sessions/8/readiness', route => route.fulfill(json({ data: { exams: 3, without_room: 1, without_candidates: 1, without_proctors: 2, candidates: 50, attendance_recorded: 0, signed_proctors: 0, total_proctors: 4, pending_incidents: 1, is_active: true } })))
    await page.goto('/admin/exams?session_id=8')
    const panel = page.getByRole('region', { name: 'Parcours des examens' })
    await expect(panel.getByText('3 épreuves · 1 sans salle disponible', { exact: true })).toBeVisible()
    await expect(panel.getByRole('link', { name: /Préparer les convocations/ })).toHaveAttribute('href', '/admin/convocations?session_id=8')
    await expect(panel.getByRole('link', { name: /Superviser en direct/ })).toHaveAttribute('href', '/admin/exams/sessions/8/live')
    await page.screenshot({ path: 'test-results/exam-workflow-cockpit.png', fullPage: true })
  })

  test('la création utilise les identifiants réels des semestres de l’année choisie', async ({ page }) => {
    await admin(page)
    await page.route(url => url.pathname === '/api/academic-years', route => route.fulfill(json({ data: [{ id: 8, label: '2026/2027' }] })))
    await page.route(url => url.pathname === '/api/semesters', route => route.fulfill(json({ data: [{ id: 41, name: 'Automne synthétique', academic_year_id: 8 }, { id: 99, name: 'Ancienne année', academic_year_id: 7 }] })))
    let saved = false
    await page.route(url => url.pathname === '/api/exam-sessions', route => {
      if (route.request().method() === 'POST') {
        expect(route.request().postDataJSON()).toMatchObject({ academic_year_id: 8, semester_id: 41, start_date: '2027-01-10', end_date: '2027-01-20' })
        saved = true
        return route.fulfill({ ...json({ success: true, data: { id: 8 } }), status: 201 })
      }
      return route.fulfill(json({ data: [] }))
    })
    await page.goto('/exams')
    await page.getByRole('button', { name: 'Nouvelle Session', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Nouvelle session', exact: true })
    await dialog.getByPlaceholder('Ex: Printemps 2026 - Session 1').fill('Session synthétique')
    await dialog.getByRole('combobox').nth(1).selectOption('8')
    await expect(dialog.getByRole('combobox').nth(2).locator('option')).toHaveCount(2)
    await dialog.getByRole('combobox').nth(2).selectOption('41')
    await dialog.locator('input[type=date]').nth(0).fill('2027-01-10')
    await dialog.locator('input[type=date]').nth(1).fill('2027-01-20')
    await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    expect(saved).toBe(true)
  })

  test('refus du pointage collectif et du scellement ne produit aucun faux succès', async ({ page }) => {
    await admin(page)
    const details = { exam: { id: 8, module: { name: 'Audit synthétique' }, exam_date: '2026-10-20', room: { name: 'Salle synthétique' }, principal_signature: 'DIGITAL_CERTIFIED_STAMP_ENCG', is_locked: false },
      seatings: [{ id: 31, student_id: 17, student: { cne: 'SYN17', user: { name: 'Sara Synthetic' } }, seat_number: 125, is_present: null }],
      surveillances: [{ id: 4, professor_id: 1, role: 'president_salle', professor: { id: 1, name: 'Admin Démo', user: { id: 1, name: 'Admin Démo' } } }], incidents: [] }
    await page.route(url => url.pathname === '/api/exam-planning/8/details', route => route.fulfill(json({ data: details })))
    await page.route(url => url.pathname === '/api/exam-incidents', route => route.fulfill(json({ data: [] })))
    await page.route(url => url.pathname === '/api/exam-planning/8/batch-update-attendance', route => route.fulfill({ ...json({ message: 'Pointage collectif refusé' }), status: 409 }))
    await page.route(url => url.pathname === '/api/exams/8/pv/lock', route => route.fulfill({ ...json({ message: 'Visa du second surveillant manquant' }), status: 422 }))
    await page.goto('/admin/exams/8/surveillance')
    await expect(page.getByText('N° 125').first()).toBeVisible()
    await page.getByRole('button', { name: 'Tout Marquer PRÉSENT', exact: true }).click()
    await expect(page.getByText('Pointage collectif refusé', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Clôturer le PV/ }).click()
    await expect(page.getByText('Visa du second surveillant manquant', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Clôturer le PV/ })).toBeEnabled()
    await expect(page.getByRole('button', { name: /PV Clôturé/ })).toHaveCount(0)
  })
})
