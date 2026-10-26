import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
async function planning(page: Page) {
  await mockApi(page); await seedSession(page, 'admin')
  await page.route(url => url.pathname === '/api/admin/smart-scheduling/workspace', route => route.fulfill(json({ data: {
    campaign: 'AUTUMN', campaign_label: 'Automne 2026/2027', campaign_open: true,
    filieres: [{ filiere_id: 2, filiere_name: 'Filière synthétique', filiere_code: 'SYN', version_id: 8, status: 'DRAFT', confirmations: { confirmed: 0, total: 1, sessions: 1 } }],
    readiness: { configured: true, modules: 2, groups: 1, missing_assignments_count: 1, operational_rooms: 3, unavailable_rooms: 1,
      issues: ['1 couple module/groupe sans affectation.'], missing_assignments: [{ module_id: 7, module_name: 'Audit synthétique', group_name: 'SYN-G1' }],
      professor_loads: [{ professor_id: 5, name: 'Enseignant synthétique', assigned_hours: 30, unknown_hours: 0, assignments: 1 }] },
  } })))
}
test.describe('Préparation du semestre', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Données synthétiques uniquement')
  test('publication directe du brouillon sans étape de confirmation enseignant', async ({ page }) => {
    await planning(page)
    let published = false; let proposals = 0
    page.on('request', request => { if (request.url().endsWith('/propose')) proposals++ })
    await page.route(url => url.pathname === '/api/admin/smart-scheduling/versions/8/publish', route => { published = true; return route.fulfill(json({ success: true })) })
    await page.goto('/admin/timetable/engine')
    await expect(page.getByRole('button', { name: 'Aux profs', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Publier', exact: true }).click()
    await page.getByRole('button', { name: 'Confirmer', exact: true }).click()
    await expect(page.getByText('Emploi du temps publié pour les étudiants.', { exact: true })).toBeVisible()
    expect(published).toBe(true); expect(proposals).toBe(0)
  })
  test('la décision administrative conserve le motif si le contrôle refuse le changement', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'admin')
    let approved = false; let allow = false
    const row = { id: 51, professor_name: 'Enseignant synthétique', department: 'Gestion', module_name: 'Audit synthétique', request_type: 'timetable_change', status: 'pending', old_date: 'Lundi', old_start_time: '08:30', proposed_date: 'Mardi', proposed_start_time: '08:30', reason: 'Réunion pédagogique exceptionnelle.' }
    await page.route(url => url.pathname === '/api/timetable/change-requests', route => route.fulfill(json({ data: [row] })))
    await page.route(url => url.pathname === '/api/timetable/change-requests/51/status', route => {
      expect(route.request().postDataJSON()).toMatchObject({ status: 'approved', review_note: 'Créneau vérifié par la scolarité.' })
      if (!allow) return route.fulfill({ ...json({ message: 'Conflit de salle : changement impossible.' }), status: 422 })
      approved = true; return route.fulfill(json({ success: true, message: 'Changement contrôlé et appliqué au planning.' }))
    })
    await page.goto('/admin/schedule-change-requests')
    await page.getByRole('button', { name: 'Approuver', exact: true }).click()
    const modal = page.getByRole('dialog')
    await modal.getByLabel('Motif de la décision').fill('Créneau vérifié par la scolarité.')
    await modal.getByRole('button', { name: 'Valider la Requête' }).click()
    await expect(page.getByText('Conflit de salle : changement impossible.', { exact: true })).toBeVisible()
    await expect(modal.getByLabel('Motif de la décision')).toHaveValue('Créneau vérifié par la scolarité.')
    expect(approved).toBe(false); allow = true
    await modal.getByRole('button', { name: 'Valider la Requête' }).click()
    await expect(modal).not.toBeVisible()
    await expect(page.getByText('Changement contrôlé et appliqué au planning.', { exact: true })).toBeVisible()
    expect(approved).toBe(true)
    await page.screenshot({ path: 'test-results/timetable-change-reviewed.png', fullPage: true })
  })
  for (const mobile of [false, true]) test(`préparation visible depuis la route officielle — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await planning(page); await page.goto('/admin/timetable/engine')
    await expect(page.getByRole('heading', { name: 'Préparer le semestre' })).toBeVisible()
    await expect(page.getByText('1 couple module/groupe sans affectation.', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Affecter les modules' })).toHaveAttribute('href', '/admin/professor-assignments')
    await page.getByRole('button', { name: /Comparer les charges des enseignants/ }).click()
    await expect(page.getByText('Enseignant synthétique', { exact: true })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Semaines d’enseignement prévues' })).toHaveText('15 sem.')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy()
    await page.screenshot({ path: `test-results/preparation-semestre-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })
  test('une publication refusée conserve la proposition et affiche le motif serveur', async ({ page }) => {
    await planning(page)
    await page.route(url => url.pathname === '/api/admin/smart-scheduling/versions/8/publish', route => route.fulfill({ ...json({ success: false, data: { message: 'Conflit de salle détecté.' } }), status: 422 }))
    await page.goto('/admin/timetable/engine'); await page.getByRole('button', { name: 'Publier', exact: true }).click(); await page.getByRole('button', { name: 'Confirmer', exact: true }).click()
    await expect(page.getByText('Conflit de salle détecté.', { exact: true })).toBeVisible()
    await expect(page.getByText('Brouillon', { exact: true }).first()).toBeVisible()
  })
  test('reconduction prévisualisée puis appliquée par une requête distincte', async ({ page }) => {
    await planning(page)
    await page.route(url => url.pathname === '/api/academic-years', route => route.fulfill(json({ data: [{ id: 3, label: '2026/2027', is_current: true }, { id: 2, label: '2025/2026', is_current: false }] })))
    const calls: boolean[] = []
    await page.route(url => url.pathname === '/api/professor-assignments/carry-forward', route => {
      const body = route.request().postDataJSON(); expect(body.source_year_id).toBe(2); calls.push(body.apply)
      return route.fulfill(json({ data: { source_year: '2025/2026', target_year: '2026/2027', created: body.apply ? 1 : 0, candidates: body.apply ? [] : [{ module: 'Audit synthétique', group: 'SYN-G1', hours: 30, session_type: 'td' }], skipped: [] } }))
    })
    await page.goto('/admin/professor-assignments'); await page.getByLabel('Année source').selectOption('2'); await page.getByRole('button', { name: 'Prévisualiser la reconduction' }).click()
    await expect(page.getByText('2025/2026 vers 2026/2027', { exact: false })).toBeVisible(); expect(calls).toEqual([false])
    await page.getByRole('button', { name: 'Appliquer les affectations compatibles' }).click(); await expect.poll(() => calls).toEqual([false, true])
    await expect(page.getByText('1 affectations reconduites. Les affectations existantes sont conservées.', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Appliquer les affectations compatibles' })).toBeDisabled()
    await page.screenshot({ path: 'test-results/semester-carry-forward-confirmed.png', fullPage: true })
  })
  test('le professeur demande un changement sans confirmation obligatoire', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname.endsWith('/auth/me'), route => route.fulfill(json({ success: true, data: { id: 5, name: 'Enseignant synthétique', institution_id: 1, roles: ['professor'], permissions: [], locale: 'fr' } })))
    await page.route(url => url.pathname === '/api/professor-portal/schedule', route => route.fulfill(json({ professor_id: 9, data: [{ id: 31, module_id: 7, group_id: 4, module_name: 'Audit publié', group_code: 'SYN-G1', room: 'Salle A', day_name: 'Lundi', day_of_week: 1, time: '08:30 - 10:30', start_time: '08:30:00', end_time: '10:30:00', lifecycle: 'PUBLISHED' }] })))
    let saved = false; let allowed = false
    await page.route(url => url.pathname === '/api/timetable/change-requests', route => {
      if (route.request().method() === 'POST') {
        expect(route.request().postDataJSON()).toMatchObject({ schedule_id: 31, day_of_week: 2, reason: 'Réunion pédagogique exceptionnelle.' })
        if (!allowed) return route.fulfill({ ...json({ message: 'Demande temporairement indisponible.' }), status: 503 })
        saved = true; return route.fulfill({ ...json({ success: true }), status: 201 })
      }
      return route.fulfill(json({ data: saved ? [{ id: 1, request_type: 'timetable_change', module_name: 'Audit publié', status: 'pending', reason: 'Réunion pédagogique exceptionnelle.' }] : [] }))
    })
    await page.goto('/professor/schedule')
    await expect(page.getByRole('button', { name: 'Confirmer ce créneau' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Demander un changement' }).click()
    await page.getByLabel('Séance concernée').selectOption('31')
    await page.getByLabel('Jour souhaité').selectOption('2')
    await page.getByLabel('Motif de la demande').fill('Réunion pédagogique exceptionnelle.')
    await page.getByRole('button', { name: 'Transmettre la demande' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Demande temporairement indisponible.' })).toBeVisible()
    await expect(page.getByLabel('Motif de la demande')).toHaveValue('Réunion pédagogique exceptionnelle.')
    expect(saved).toBe(false); allowed = true
    await page.getByRole('button', { name: 'Transmettre la demande' }).click()
    await expect(page.getByText(/En attente de décision/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Transmettre la demande' })).toHaveCount(0)
    await page.screenshot({ path: 'test-results/timetable-change-pending.png', fullPage: true })
  })
  test('ouvrir l’appel utilise un identifiant de présence retourné par le serveur', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname.endsWith('/auth/me'), route => route.fulfill(json({ success: true, data: { id: 5, name: 'Enseignant synthétique', institution_id: 1, roles: ['professor'], permissions: [], locale: 'fr' } })))
    await page.route(url => url.pathname === '/api/professor-portal/schedule', route => route.fulfill(json({ professor_id: 9, data: [{ id: 31, module_id: 7, group_id: 4, module_name: 'Audit publié', group_code: 'SYN-G1', room: 'Salle A', day_name: 'Lundi', day_of_week: 1, session_type: 'td', time: '08:30 - 10:30', start_time: '08:30:00', end_time: '10:30:00', lifecycle: 'PUBLISHED' }] })))
    let started = false; let rosterForAttendance = false
    await page.route(url => url.pathname === '/api/professor/attendance/start', route => { expect(route.request().postDataJSON()).toMatchObject({ module_id: 7, group_id: 4, room_name: 'Salle A' }); started = true; return route.fulfill(json({ session: { id: 47 } })) })
    await page.route(url => url.pathname === '/api/professor/attendance/students', route => { rosterForAttendance = new URL(route.request().url()).searchParams.get('attendance_session_id') === '47'; return route.fulfill(json({ data: [] })) })
    await page.goto('/professor/schedule'); await page.getByRole('button', { name: /Faire l.Appel/ }).first().click()
    await expect.poll(() => started && rosterForAttendance).toBeTruthy()
  })
})
