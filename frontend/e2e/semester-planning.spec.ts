import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
async function planning(page: Page) {
  await mockApi(page); await seedSession(page, 'admin')
  await page.route(url => url.pathname === '/api/admin/smart-scheduling/workspace', route => route.fulfill(json({ data: {
    campaign: 'AUTUMN', campaign_label: 'Automne 2026/2027', campaign_open: true,
    filieres: [{ filiere_id: 2, filiere_name: 'Filière synthétique', filiere_code: 'SYN', version_id: 8, status: 'PROPOSED', confirmations: { confirmed: 0, total: 1, sessions: 1 } }],
    readiness: { configured: true, modules: 2, groups: 1, missing_assignments_count: 1, operational_rooms: 3, unavailable_rooms: 1,
      issues: ['1 couple module/groupe sans affectation.'], missing_assignments: [{ module_id: 7, module_name: 'Audit synthétique', group_name: 'SYN-G1' }],
      professor_loads: [{ professor_id: 5, name: 'Enseignant synthétique', assigned_hours: 30, unknown_hours: 0, assignments: 1 }] },
  } })))
}
test.describe('Préparation du semestre', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Données synthétiques uniquement')
  for (const mobile of [false, true]) test(`préparation visible depuis la route officielle — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await planning(page); await page.goto('/admin/timetable/engine')
    await expect(page.getByRole('heading', { name: 'Préparer le semestre' })).toBeVisible()
    await expect(page.getByText('1 couple module/groupe sans affectation.', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Affecter les modules' })).toHaveAttribute('href', '/admin/professor-assignments')
    await page.getByText('Comparer les charges des enseignants', { exact: true }).click()
    await expect(page.getByText('Enseignant synthétique', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Semaines d’enseignement prévues')).toHaveValue('15')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy()
    await page.screenshot({ path: `test-results/preparation-semestre-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })
  test('une publication refusée conserve la proposition et affiche le motif serveur', async ({ page }) => {
    await planning(page)
    await page.route(url => url.pathname === '/api/admin/smart-scheduling/versions/8/publish', route => route.fulfill({ ...json({ success: false, data: { message: 'Confirmation enseignant manquante.' } }), status: 422 }))
    await page.goto('/admin/timetable/engine'); await page.getByRole('button', { name: 'Publier', exact: true }).click(); await page.getByRole('button', { name: 'Confirmer', exact: true }).click()
    await expect(page.getByText('Confirmation enseignant manquante.', { exact: true })).toBeVisible()
    await expect(page.getByText('Chez les profs', { exact: true }).first()).toBeVisible()
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
  test('le professeur voit sa proposition et confirme depuis son propre portail', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname.endsWith('/auth/me'), route => route.fulfill(json({ success: true, data: { id: 5, name: 'Enseignant synthétique', institution_id: 1, roles: ['professor'], permissions: [], locale: 'fr' } })))
    let confirmed = false
    await page.route(url => url.pathname === '/api/professor-portal/schedule', route => route.fulfill(json({ professor_id: 9, data: [{ id: 31, module_id: 7, group_id: 4, module_name: 'Audit proposé', group_code: 'SYN-G1', room: 'Salle A', day_name: 'Lundi', day_of_week: 1, time: '08:30 - 10:30', start_time: '08:30:00', end_time: '10:30:00', lifecycle: 'PROPOSED', confirmation_status: confirmed ? 'confirmed' : 'pending' }] })))
    await page.route(url => url.pathname === '/api/professor-portal/schedules/31/confirm', route => { expect(route.request().postDataJSON().decision).toBe('confirmed'); confirmed = true; return route.fulfill(json({ success: true })) })
    await page.goto('/professor/schedule')
    await expect(page.getByRole('heading', { name: 'Planning proposé : votre avis est attendu' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmer ce créneau' }).click()
    await expect(page.getByRole('button', { name: 'Confirmer ce créneau' })).toBeDisabled()
    await expect(page.getByText('Réponse : Confirmée', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Génération des Emplois du Temps' })).toHaveCount(0)
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
