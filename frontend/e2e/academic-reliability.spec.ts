import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
async function teacher(page: Page) {
  await mockApi(page); await seedSession(page, 'student')
  await page.route(url => url.pathname.endsWith('/auth/me'), route => route.fulfill(json({ success: true, data: { id: 5, name: 'Enseignant synthétique', email: 'synthetic@example.test', institution_id: 1, roles: ['professor'], permissions: [], locale: 'fr' } })))
}
async function pv(page: Page) {
  await mockApi(page); await seedSession(page, 'admin')
  await page.route(url => url.pathname === '/api/filieres', route => route.fulfill(json({ data: [{ id: 2, name: 'Filière synthétique', code: 'SYN' }] })))
  await page.route(url => url.pathname === '/api/academic-years', route => route.fulfill(json({ data: [{ id: 3, label: '2026/2027', is_current: true }] })))
  await page.route(url => url.pathname === '/api/groups', route => route.fulfill(json({ data: [{ id: 4, name: 'G1', filiere_id: 2, semester_number: 1 }] })))
  await page.route(url => url.pathname === '/api/modules', route => route.fulfill(json({ data: [{ id: 7, name: 'Management synthétique', code: 'SYN-M', filiere_id: 2, semester_number: 1 }] })))
  await page.route(url => url.pathname === '/api/semester-pv', route => route.fulfill(json({ filiere: { id: 2, name: 'Filière synthétique' }, semester: 1, modules: [{ id: 7, name: 'Management synthétique', code: 'SYN-M' }], students: [{ student_id: 17, first_name: 'Sara', last_name: 'Synthetic', cne: 'SYN-17', module_grades: { 7: { note: 14, decision: 'V' } }, moyenne_semestrielle: 14, decision_global: 'V', credits: 1 }], stats: { total_students: 1, success_rate: 100 } })))
}
test.describe('Fiabilité académique', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Données synthétiques uniquement')
  for (const mobile of [false, true]) test(`appel professeur refuse le faux succès et envoie le bon format — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 }); await teacher(page)
    await page.route(url => url.pathname === '/api/professor/attendance/students', route => route.fulfill(json({ data: [{ id: 17, name: 'Sara Synthetic', cne: 'SYN-17', status: 'absent', version: 3 }] })))
    let sent = 0
    await page.route(url => url.pathname === '/api/professor/attendance/save', route => { sent++; expect(route.request().postDataJSON()).toMatchObject({ session_id: 12, records: [{ student_id: 17, status: 'present', version: 3 }] }); return route.fulfill({ ...json({ message: 'Refus synthétique : session modifiée' }), status: 409 }) })
    await page.goto('/professor/absences/call/12'); await page.getByRole('button', { name: 'Tous Présents', exact: true }).click(); await page.getByRole('button', { name: 'Valider la Présence de la Séance' }).click()
    await expect(page.getByText('Refus synthétique : session modifiée', { exact: true })).toBeVisible(); expect(sent).toBe(1)
    await expect(page.getByText("Feuille d'émargement enregistrée avec succès !", { exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/appel-professeur-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })
  test('orientation en échec ne montre aucun profil de démonstration', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname === '/api/student/orientation/profile', route => route.fulfill({ ...json({ message: 'Profil non lié' }), status: 404 }))
    await page.goto('/student/orientation'); await expect(page.getByRole('alert').filter({ hasText: 'Impossible de charger votre orientation' })).toBeVisible()
    await expect(page.getByText('GFC', { exact: true })).toHaveCount(0)
  })
  test('PV scellé récupère son état serveur après rechargement et le lien reste interne', async ({ page }) => {
    await pv(page); let sealed = false
    await page.route(url => url.pathname === '/api/academic/deliberations/jury-status', route => route.fulfill(json({ members: [], total_members: 0, signed_count: 0 })))
    await page.route(url => url.pathname === '/api/academic/pv-workflow/context', route => route.fulfill(json({ deliberation: { id: 9, is_sealed: sealed, seal_hash: sealed ? 'a'.repeat(64) : null, sealed_at: sealed ? '2026-10-25T09:00:00Z' : null, status: sealed ? 'sealed' : 'completed' }, meeting: null, members: [], rooms: [], agents: [] })))
    await page.route(url => url.pathname === '/api/academic/deliberations/9/seal', route => { expect(route.request().postDataJSON().reason).toBeTruthy(); sealed = true; return route.fulfill(json({ success: true, seal_hash: 'a'.repeat(64) })) })
    await page.goto('/admin/grades/pv?filiere_id=2&semester=1'); await page.getByRole('button', { name: 'Sceller & Verrouiller', exact: true }).click()
    await page.getByRole('button', { name: 'Confirmer le scellé serveur', exact: true }).click(); await expect(page.getByRole('button', { name: 'Verrouillé', exact: true })).toBeDisabled()
    await page.reload(); await expect(page.getByRole('button', { name: 'Verrouillé', exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Lien interne', exact: true }).click(); const address = await page.getByLabel('Adresse du PV').inputValue(); expect(address).not.toContain('shared_token'); expect(address).toContain('academic_year_id=3')
  })
  test('signature du jury est confirmée par API et survit au rechargement', async ({ page }) => {
    await pv(page); let signed = false; let posts = 0
    await page.route(url => url.pathname === '/api/academic/pv-workflow/context', route => route.fulfill(json({ deliberation: null, meeting: null, members: [], rooms: [], agents: [] })))
    await page.route(url => url.pathname === '/api/academic/deliberations/jury-status', route => route.fulfill(json({ total_members: 1, signed_count: signed ? 1 : 0, members: [{ id: 31, user_id: 1, user_name: 'Admin Démo', module_id: null, module_name: 'Présidence', role: 'chef_filiere', status: signed ? 'signed' : 'pending', signed_at: signed ? '2026-10-25T09:00:00Z' : null, digital_seal: signed ? 'b'.repeat(64) : null }] })))
    await page.route(url => url.pathname === '/api/academic/deliberations/sign-jury', route => { const data = route.request().postDataJSON(); expect(data.jury_id).toBe(31); expect(data.signature_data).toMatch(/^data:image\/png;base64,/); signed = true; posts++; return route.fulfill(json({ digital_seal: 'b'.repeat(64), signed_at: '2026-10-25T09:00:00Z' })) })
    await page.goto('/admin/grades/pv?filiere_id=2&semester=1'); await page.getByRole('button', { name: 'Signer le PV (Jury)', exact: true }).click()
    const dialog = page.getByRole('dialog'); const canvas = dialog.locator('canvas'); const rect = await canvas.boundingBox(); if (!rect) throw new Error('Canvas absent')
    await page.mouse.move(rect.x + 30, rect.y + 40); await page.mouse.down(); await page.mouse.move(rect.x + 140, rect.y + 75, { steps: 10 }); await page.mouse.up()
    await dialog.getByRole('button', { name: 'Enregistrer mon visa', exact: true }).click(); await expect(dialog).not.toBeVisible(); expect(posts).toBe(1)
    await page.reload(); await expect(page.getByText(/PV Officiel Signé par le/)).toBeVisible()
  })
})
