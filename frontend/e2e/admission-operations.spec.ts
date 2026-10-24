import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
const base = '/api/admissions/workflow'
const campaign = { id: 7, name: 'TAFEM synthétique', entry_route: 'tafem', entry_semester: 1, status: 'open', close_date: '2027-01-01' }
const dossier = { id: 17, version: 1, reference_number: 'SYN-17', cne: 'N123456789', cin: 'AB123456', first_name: 'Sara', last_name: 'Synthetic', email: 'synthetic@example.test', eligibility: 'main', dossier_status: 'submitted', campaign, profile: {}, documents: {}, required_documents: ['bac', 'cnie', 'releve_notes', 'photo'], reviews: [], events: [], notifications: [], ocr_runs: [], document_history: [] }
const alerts = [{ field: 'cne', severity: 'identity', sources: [{ source: 'dossier', value: 'N123456789', document_id: null }, { source: 'bac', value: 'Z999999999', document_id: 91 }] }]
async function admin(page: Page) {
  await mockApi(page); await seedSession(page, 'admin')
  await page.route(url => url.pathname === `${base}/campaigns`, r => r.fulfill(json({ data: [campaign] })))
  await page.route(url => url.pathname === `${base}/stats`, r => r.fulfill(json({ stats: {} })))
  await page.route(url => url.pathname === `${base}/applications`, r => r.fulfill(json({ data: [], total: 0, last_page: 1 })))
  await page.route(url => url.pathname === `${base}/dossier`, r => r.fulfill(json({ candidate: dossier })))
}
test.describe('Outils quotidiens admissions et actions', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Jeux synthétiques uniquement')
  for (const mobile of [false, true]) test(`prise en charge du guichet — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 }); await admin(page)
    const ticket = { id: 12, application_id: 17, number: 1, desk: 'Guichet A', status: 'waiting', version: 1, served_by: null as number | null, agent: null as string | null, first_name: 'Sara', last_name: 'Synthetic', cne: 'N123456789' }
    await page.route(url => url.pathname === `${base}/operations/queue`, r => r.fulfill(json({ data: [], total: 0, last_page: 1 })))
    await page.route(url => url.pathname === `${base}/operations/monitor`, r => r.fulfill(json({ ocr: [], notifications: [] })))
    await page.route(url => url.pathname === `${base}/operations/desk`, r => r.fulfill(json({ tickets: { data: [ticket], last_page: 1 }, counts: { [ticket.status]: 1 }, current_user_id: 1 })))
    const events: string[] = []
    await page.route(url => url.pathname === `${base}/operations/desk/12`, r => {
      const data = r.request().postDataJSON(); expect(data.version).toBe(ticket.version); events.push(data.event); ticket.version++
      ticket.status = data.event === 'claim' ? 'serving' : data.event === 'release' ? 'waiting' : 'done'; ticket.served_by = ticket.status === 'serving' ? 1 : null; ticket.agent = ticket.served_by ? 'Agent synthétique' : null
      return r.fulfill(json(ticket))
    })
    await page.goto('/academic/enrollments'); await page.getByRole('button', { name: 'Suivi & incidents', exact: true }).click()
    await page.getByRole('button', { name: 'Appeler et prendre en charge', exact: true }).click(); await expect(page.getByRole('button', { name: 'Clôturer le passage', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Libérer le dossier', exact: true }).click(); await expect(page.getByRole('button', { name: 'Appeler et prendre en charge', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Appeler et prendre en charge', exact: true }).click(); await page.getByRole('button', { name: 'Clôturer le passage', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Clôturer le passage', exact: true })).toHaveCount(0); expect(events).toEqual(['claim', 'release', 'claim', 'complete'])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/admission-guichet-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })
  for (const mobile of [false, true]) {
    const device = mobile ? 'mobile' : 'desktop'
    test(`file de travail, affectation et journal des originaux — ${device}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 }); await admin(page)
      let work: null | { assigned_to: number; next_action: string; due_on: string; version: number } = null
      const originals: { id: number; document_type: string; event: string; storage_location: string; note: string; agent: string; created_at: string }[] = []
      await page.route(url => url.pathname === `${base}/operations/context`, r => r.fulfill(json({ work, originals, alerts, agents: [{ id: 1, name: 'Agent synthétique' }] })))
      await page.route(url => url.pathname === `${base}/operations/queue`, r => r.fulfill(json({ data: [{ id: 17, name: 'Sara Synthetic', cne: 'N123456789', status: 'submitted', missing: ['bac'], corrections: [], next_action: work?.next_action ?? null, assigned_to: work?.assigned_to ?? null, assigned_name: work ? 'Agent synthétique' : null, due_on: work?.due_on ?? null, alerts_count: 1 }], total: 1, last_page: 1 })))
      await page.route(url => url.pathname === `${base}/operations/monitor`, r => r.fulfill(json({ ocr: [], notifications: [], limit: 50 })))
      await page.route(url => url.pathname === `${base}/operations/work`, async r => {
        expect(r.request().postDataJSON()).toMatchObject({ application_id: 17, assigned_to: 1, version: 0, next_action: 'Contrôler les originaux' })
        work = { assigned_to: 1, next_action: 'Contrôler les originaux', due_on: '2026-12-01', version: 1 }
        await r.fulfill(json({ work, originals, alerts, agents: [{ id: 1, name: 'Agent synthétique' }] }))
      })
      await page.route(url => url.pathname === `${base}/operations/originals`, async r => {
        const data = r.request().postDataJSON(); expect(data.application_id).toBe(17); expect(data.document_type).toBe('bac'); expect(data.operation_id).toMatch(/^[0-9a-f-]{36}$/)
        originals.unshift({ id: originals.length + 1, document_type: 'bac', event: data.event, storage_location: data.storage_location ?? '', note: data.note, agent: 'Agent synthétique', created_at: '2026-10-24T12:00:00Z' })
        await r.fulfill(json({ id: originals[0].id }))
      })
      await page.goto('/academic/enrollments'); await page.getByRole('button', { name: 'Suivi & incidents', exact: true }).click()
      await expect(page.getByText('1 différence(s) documentaire(s) à examiner')).toBeVisible()
      await page.getByRole('button', { name: 'Examiner et organiser' }).click()
      await expect(page.getByRole('heading', { name: 'Différences entre les pièces et le dossier' })).toBeVisible()
      await page.getByText('Responsable, prochaine action et échéance', { exact: true }).click()
      await page.getByLabel('Responsable du dossier').selectOption('1'); await page.getByLabel('Prochaine action', { exact: true }).fill('Contrôler les originaux'); await page.getByLabel('Échéance de traitement').fill('2026-12-01')
      await page.getByRole('button', { name: 'Enregistrer le suivi' }).click(); await expect.poll(() => work?.version).toBe(1)
      await expect(page.getByText('Suivi du dossier enregistré.', { exact: true })).toBeVisible()
      await page.getByText('Conservation des originaux', { exact: true }).click()
      await page.getByLabel('Emplacement de rangement').fill('Armoire A / Boîte 7'); await page.getByLabel('Observation / contrôle du titulaire').fill('Original reçu du titulaire')
      await page.getByRole('button', { name: 'Enregistrer le mouvement' }).click()
      await expect(page.getByRole('link', { name: 'Télécharger le reçu ORI-1' })).toBeVisible()
      await page.getByLabel('Mouvement', { exact: true }).selectOption('returned'); await page.getByLabel('Observation / contrôle du titulaire').fill('Identité vérifiée et original rendu')
      await page.getByRole('button', { name: 'Enregistrer le mouvement' }).click(); await expect(page.getByRole('link', { name: 'Télécharger le reçu ORI-2' })).toBeVisible()
      expect(originals.map(e => e.event)).toEqual(['returned', 'received'])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.getByRole('heading', { name: 'Différences entre les pièces et le dossier' }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: `test-results/admission-operations-${device}.png`, fullPage: true })
    })
    test(`centre des actions étudiant et confidentialité du rangement — ${device}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 }); await mockApi(page); await seedSession(page, 'student')
      await page.route(url => url.pathname === '/api/student-portal/actions', r => r.fulfill(json({ academic_year: '2026/2027', has_student: true, items: [{ id: 'renewal', title: 'Confirmer ma réinscription', description: 'Campagne ouverte', href: '/student/reinscription', deadline: '2026-12-01' }] })))
      await page.goto('/student/dashboard'); await expect(page.getByRole('heading', { name: 'Que dois-je faire maintenant ?' })).toBeVisible()
      await expect(page.getByRole('link', { name: /Confirmer ma réinscription/ })).toHaveAttribute('href', '/student/reinscription')
      await page.route(url => url.pathname === `${base}/dossier`, r => r.fulfill(json({ candidate: dossier })))
      await page.route(url => url.pathname === `${base}/slots`, r => r.fulfill(json({ data: [] })))
      await page.route(url => url.pathname === `${base}/operations/context`, r => r.fulfill(json({ alerts, work: null, agents: [], originals: [{ id: 1, document_type: 'bac', event: 'received', created_at: '2026-10-24T12:00:00Z', agent: 'Agent synthétique' }] })))
      await page.goto('/admissions/mon-dossier'); await expect(page.getByRole('heading', { name: 'Différences entre les pièces et le dossier' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Reçu ORI-1' })).toBeVisible()
      await expect(page.getByText('Armoire A / Boîte 7')).toHaveCount(0)
    })
  }
  test('relance ciblée OCR et notification sans double action', async ({ page }) => {
    await admin(page); let ocrRetries = 0; let mailRetries = 0
    await page.route(url => url.pathname === `${base}/operations/queue`, r => r.fulfill(json({ data: [], total: 0, last_page: 1 })))
    await page.route(url => url.pathname === `${base}/operations/monitor`, r => r.fulfill(json({ ocr: ocrRetries ? [] : [{ id: 'run-1', application_id: 17, document_id: 91, status: 'failed' }], notifications: mailRetries ? [] : [{ id: 3, application_id: 17, status: 'failed', attempts: 3 }], limit: 50 })))
    await page.route(url => url.pathname === `${base}/operations/ocr/run-1/retry`, r => { ocrRetries++; return r.fulfill({ ...json({ id: 'new-run', status: 'queued' }), status: 202 }) })
    await page.route(url => url.pathname === `${base}/notifications/3/retry`, r => { mailRetries++; return r.fulfill(json({ message: 'Envoi remis en file' })) })
    await page.goto('/academic/enrollments'); await page.getByRole('button', { name: 'Suivi & incidents', exact: true }).click()
    await page.getByRole('button', { name: 'Relancer localement' }).click(); await expect(page.getByRole('button', { name: 'Relancer localement' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Relancer cet envoi' }).click(); await expect(page.getByRole('button', { name: 'Relancer cet envoi' })).toHaveCount(0)
    expect([ocrRetries, mailRetries]).toEqual([1, 1])
  })
  for (const mobile of [false, true]) test(`actions enseignant avec contexte exact — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname.endsWith('/auth/me'), r => r.fulfill(json({ success: true, data: { id: 5, name: 'Professeur synthétique', email: 'prof@example.test', roles: ['professor'], institution_id: 1, permissions: [], locale: 'fr' } })))
    await page.route(url => url.pathname === '/api/professor-portal/actions', r => r.fulfill(json({ academic_year: '2026/2027', items: [{ id: 'grade-7-4', title: '2 note(s) à compléter', description: 'Management · Groupe 4', href: '/admin/grades/edit?module_id=7&group_id=4&filiere_id=2&semester=5', deadline: null }] })))
    await page.goto('/professor/dashboard'); await expect(page.getByRole('heading', { name: 'Mes actions', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /2 note\(s\) à compléter/ })).toHaveAttribute('href', /module_id=7&group_id=4/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('heading', { name: 'Mes actions', exact: true }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: `test-results/professor-actions-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })
  test('le lien enseignant ouvre uniquement le stage présent dans ses affectations', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname.endsWith('/auth/me'), r => r.fulfill(json({ success: true, data: { id: 5, name: 'Professeur synthétique', email: 'prof@example.test', roles: ['professor'], institution_id: 1, permissions: [], locale: 'fr' } })))
    await page.route(url => url.pathname === '/api/professor/internships/supervised', r => r.fulfill(json({ internships: [{ id: 9, company_name: 'Entreprise synthétique', status: 'active', student: { user: { name: 'Étudiante synthétique' }, cne: 'SYN-STAGE' }, internship_documents: [], can_review_documents: true, can_evaluate: false }] })))
    await page.goto('/professor/internships?internship_id=9')
    await expect(page.getByRole('dialog', { name: 'Suivi du stage' })).toBeVisible()
    await page.goto('/professor/internships?internship_id=999')
    await expect(page.getByRole('heading', { name: 'Mes encadrements & jurys' })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
