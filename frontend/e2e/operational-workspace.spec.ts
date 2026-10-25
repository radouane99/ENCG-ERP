import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
const requestRow = { id: 41, label: 'Attestation synthétique', person: 'Sara Synthetic', status: 'pending', due_at: null, assigned_to: null, revision: 0, overdue: false }
const workspace = () => ({ staff: true, tasks: [{ label: 'Demandes à traiter', count: 1, url: '/admin/guichet' }], requests: [{ ...requestRow }], agents: [{ id: 1, name: 'Agent de test' }], quality: { duplicate_cne_groups: 0, missing_cne: 1, registrations_without_group: 0, academic_year: '2026/2027', missing_cne_ids: [17] }, notification_activity: [], transport_logs: [], backup: { created_at: '2026-10-25T12:00:00Z', restore_verified: true } })

test.describe('Suivi opérationnel', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Scénarios avec API synthétiques')
  for (const mobile of [false, true]) test(`affectation avec refus visible et confirmation réelle — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await mockApi(page); await seedSession(page, 'admin')
    const data = workspace(); let allow = false; let saved = 0
    await page.route(url => url.pathname === '/api/workspace/today', route => route.fulfill(json({ data })))
    await page.route(url => url.pathname === '/api/workspace/requests/41/followup', route => {
      expect(route.request().postDataJSON()).toMatchObject({ assigned_to: 1, revision: 0, reason: 'Dossier confié au service scolarité.' })
      if (!allow) return route.fulfill({ ...json({ message: 'Le suivi a changé. Rechargez la liste.' }), status: 409 })
      saved++; data.requests[0].revision = 1
      return route.fulfill(json({ message: 'Suivi enregistré.' }))
    })
    await page.goto('/dashboard')
    const panel = page.getByRole('region', { name: 'Mon travail à suivre' })
    await panel.getByText(/Suivi des demandes/).click()
    const submit = panel.getByRole('button', { name: 'Enregistrer le suivi', exact: true })
    await expect(submit).toBeDisabled()
    await panel.getByLabel('Responsable demande 41').selectOption('1')
    await panel.getByLabel('Motif demande 41').fill('Dossier confié au service scolarité.')
    await submit.click()
    await expect(page.getByText('Le suivi a changé. Rechargez la liste.', { exact: true })).toBeVisible()
    expect(saved).toBe(0)
    allow = true
    await submit.click()
    await expect(page.getByText('Suivi enregistré.', { exact: true })).toBeVisible()
    expect(saved).toBe(1)
    await panel.getByText(/Sauvegarde et restauration/).click()
    await expect(panel.getByText(/Restauration vérifiée sur une base isolée/)).toBeVisible()
    const bounds = await panel.boundingBox()
    expect(bounds!.width).toBeLessThanOrEqual(mobile ? 390 : 1280)
    await panel.screenshot({ path: `test-results/operational-workspace-${mobile ? 'mobile' : 'desktop'}.png` })
  })

  test('étudiant voit son échéance sans accès aux outils de gestion', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname === '/api/workspace/today', route => route.fulfill(json({ data: { staff: false, tasks: [], requests: [{ ...requestRow, due_at: '2030-01-01T10:00:00Z' }] } })))
    await page.goto('/dashboard')
    const panel = page.getByRole('region', { name: 'Mon travail à suivre' })
    await panel.getByText(/Suivi des demandes/).click()
    await expect(panel.getByText(/Échéance/)).toBeVisible()
    await expect(panel.getByLabel('Responsable demande 41')).toHaveCount(0)
    await expect(panel.getByText('Centre de suivi des notifications')).toHaveCount(0)
  })

  test('échec du suivi affiché comme indisponibilité', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'admin')
    await page.route(url => url.pathname === '/api/workspace/today', route => route.fulfill({ ...json({ message: 'Indisponible' }), status: 503 }))
    await page.goto('/dashboard')
    await expect(page.getByRole('alert').filter({ hasText: 'Le suivi est indisponible.' })).toBeVisible()
  })

  test('les notifications au-delà de la première page sont accessibles', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname === '/api/notifications', route => {
      const number = new URL(route.request().url()).searchParams.get('page') || '1'
      return route.fulfill(json({ data: [{ id: number, data: { title: `Notification page ${number}` }, read_at: null, created_at: '2026-10-25T12:00:00Z' }], meta: { last_page: 2 } }))
    })
    await page.goto('/notifications')
    await expect(page.getByText('Notification page 1', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Page suivante', exact: true }).click()
    await expect(page.getByText('Notification page 2', { exact: true })).toBeVisible()
  })
})
