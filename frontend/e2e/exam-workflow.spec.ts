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

  test('la modification sauvegarde réellement et conserve le formulaire si le serveur refuse', async ({ page }) => {
    await admin(page)
    let allow = false; let saved = 0
    const exam = { id: 8, exam_session_id: 3, module: { name: 'Audit synthétique' }, group: { name: 'SYN-G1' }, room_id: 6, room: { name: 'Salle synthétique' }, exam_date: '2027-01-12', start_time: '08:30:00', duration_minutes: 120, planning_revision: 'a'.repeat(64) }
    await page.route(url => url.pathname === '/api/exam-planning/8/details', route => route.fulfill(json({ data: { exam, seatings: [], surveillances: [], incidents: [] } })))
    await page.route(url => url.pathname === '/api/rooms', route => route.fulfill(json({ data: [{ id: 6, name: 'Salle synthétique' }] })))
    await page.route(url => url.pathname === '/api/exam-planning/8/planning', route => {
      expect(route.request().method()).toBe('PUT')
      expect(route.request().postDataJSON()).toMatchObject({ exam_date: '2027-01-13', room_id: 6, planning_revision: 'a'.repeat(64) })
      if (!allow) return route.fulfill({ ...json({ message: 'Planning modifié ailleurs' }), status: 409 })
      saved++; exam.exam_date = '2027-01-13'; exam.planning_revision = 'b'.repeat(64)
      return route.fulfill(json({ success: true, exam }))
    })
    await page.goto('/admin/exams/8/edit')
    await page.getByLabel('Date de l’épreuve', { exact: true }).fill('2027-01-13')
    await page.getByRole('button', { name: 'Enregistrer le planning', exact: true }).click()
    await expect(page.getByText('Planning modifié ailleurs', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Date de l’épreuve', { exact: true })).toHaveValue('2027-01-13')
    expect(saved).toBe(0)
    allow = true
    await page.getByRole('button', { name: 'Enregistrer le planning', exact: true }).click()
    await expect(page.getByText('Planning enregistré.', { exact: true })).toBeVisible()
    expect(saved).toBe(1)
  })

  test('un ancien droit de rattrapage exige un choix explicite et une référence avant rattachement', async ({ page }) => {
    await admin(page)
    let reconciled = false
    await page.route(url => url.pathname === '/api/retakes', route => route.fulfill(json({ data: [] })))
    await page.route(url => url.pathname === '/api/academic-years', route => route.fulfill(json({ data: [{ id: 7, label: '2025/2026' }, { id: 8, label: '2026/2027' }] })))
    await page.route(url => url.pathname === '/api/retakes/legacy', route => route.fulfill(json({ count: reconciled ? 0 : 1, data: reconciled ? [] : [{ id: 51, student_name: 'Sara Synthetic', cne: 'SYN17', module_name: 'Audit synthétique', status: 'Refusé', reason: 'Dossier historique', created_at: '2026-06-10' }] })))
    await page.route(url => url.pathname === '/api/retakes/51/year', route => {
      expect(route.request().postDataJSON()).toMatchObject({ academic_year_id: 7, reason: 'PV historique vérifié par la scolarité.' })
      reconciled = true
      return route.fulfill(json({ success: true }))
    })
    await page.goto('/admin/retake')
    await page.getByText(/1 ancien\(s\) droit\(s\) de rattrapage sans année/).click()
    const button = page.getByRole('button', { name: 'Rattacher ce dossier', exact: true })
    await expect(button).toBeDisabled()
    await expect(page.getByLabel('Année confirmée par le dossier', { exact: true })).toHaveValue('')
    await page.getByLabel('Année confirmée par le dossier', { exact: true }).selectOption('7')
    await expect(button).toBeDisabled()
    await page.getByLabel('Élément justifiant le rattachement', { exact: true }).fill('PV historique vérifié par la scolarité.')
    await button.click()
    await expect(button).toHaveCount(0)
    expect(reconciled).toBe(true)
  })

  test('la diffusion portail est indépendante des emails et affiche un refus serveur', async ({ page }) => {
    await admin(page)
    await page.route(url => url.pathname === '/api/exam-sessions', route => route.fulfill(json({ data: [{ id: 8, name: 'Session synthétique', is_active: true }] })))
    let accepted = false; let emailCalls = 0
    page.on('request', request => { if (request.method() === 'POST' && /send.*email|send-session/.test(new URL(request.url()).pathname)) emailCalls++ })
    await page.route(url => url.pathname === '/api/convocations/publish-session', route => {
      expect(route.request().postDataJSON()).toEqual({ session_id: 8 })
      return route.fulfill(accepted ? json({ success: true, message: '3 convocations publiées. Aucun email envoyé.' }) : { ...json({ message: 'Placement incomplet' }), status: 422 })
    })
    await page.goto('/admin/convocations?session_id=8')
    const button = page.getByRole('button', { name: 'Publier sur le portail', exact: true })
    await button.click()
    await expect(page.getByText('Placement incomplet', { exact: true })).toBeVisible()
    accepted = true
    await button.click()
    await expect(page.getByText('3 convocations publiées. Aucun email envoyé.', { exact: true })).toBeVisible()
    expect(emailCalls).toBe(0)
  })
})
