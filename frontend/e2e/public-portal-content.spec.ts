import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

const portal = {
  revision: 0, timezone: 'Africa/Casablanca', contact: { name: 'ENCG Synthetic', email: 'official@example.test', phone: '0000000000', address: 'Synthetic official address', hours: 'Synthetic reception hours' },
  guides: { tafem: { instructions: 'TAFEM official instructions', documents: ['bac', 'cnie', 'releve_notes', 'photo'], physical_checklist: ['Baccalauréat original contrôlé'] }, cnaem: { instructions: 'CNAEM official instructions', documents: ['bac', 'cnie', 'photo', 'attestation_admission', 'releve_parcours'], physical_checklist: ['Attestation officielle d’admission CNAEM contrôlée'] } },
  announcements: [] as { id: string; title: string; body: string; status: string; starts_on: string; ends_on: string; attachment_id?: string | null }[], attachments: [],
}
const manager = { id: 1, name: 'Synthetic Manager', email: 'manager@example.test', roles: ['institution-admin'], permissions: ['system.settings'], institution_id: 1, two_factor_enabled: false }

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await page.route('**/public/admissions/calendar', route => route.fulfill({ json: { data: { state: 'closed', campaigns: [], timezone: 'Africa/Casablanca', server_now: new Date().toISOString() } } }))
  await page.route('**/public/admissions/portal', route => route.fulfill({ json: { data: portal } }))
})

test('candidate guide distinguishes CNAEM, keeps closed calendar and links protected tracking', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Comment s’inscrire ?' })).toBeVisible()
  await page.getByRole('tab', { name: 'CNAEM', exact: true }).click()
  await expect(page.getByText('CNAEM official instructions', { exact: true })).toBeVisible()
  await expect(page.getByText('Attestation officielle d’admission CNAEM', { exact: true })).toBeVisible()
  await expect(page.getByTestId('public-admission-calendar').getByRole('status')).toHaveText('Inscriptions fermées')
  await page.locator('#guide-inscription').screenshot({ path: 'test-results/public-design-guide-desktop.png' })
  await page.getByRole('link', { name: 'Suivre mon dossier', exact: true }).click()
  await expect(page).toHaveURL(/login/)
})

test('public support records a reference and uses institution contact data', async ({ page }) => {
  let sent: any = null
  await page.route('**/api/contact', route => { sent = route.request().postDataJSON(); return route.fulfill({ json: { success: true, reference: 'DEM-000042', department: 'admissions' } }) })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Synthetic reception hours')).toBeVisible()
  await page.locator('#public-contact-name').fill('Synthetic Candidate')
  await page.locator('#public-contact-email').fill('person@example.test')
  await page.locator('#public-contact-subject').selectOption('documents')
  await page.locator('#public-contact-message').fill('Synthetic document issue')
  await page.getByRole('button', { name: 'Envoyer le message', exact: true }).click()
  await expect(page.getByText('DEM-000042', { exact: true })).toBeVisible()
  expect(sent.subject).toBe('documents')
})

test('admin can save a scheduled official notice and clear error is shown on conflict', async ({ page }) => {
  await seedSession(page, 'admin')
  await page.route('**/v1/auth/me', route => route.fulfill({ json: { data: manager } }))
  await page.route('**/admin/institution-settings', route => route.fulfill({ json: { institution: { institutionName: 'ENCG Synthetic' }, academic_year: null, runtime: { mailer: 'array', mail_from: 'test@example.test', maintenance_mode: false, token_expiration_minutes: 480 }, academic_rules: { validation_threshold: 10, eliminatory_threshold: 6, paid_filiere_types: [] } } }))
  await page.route('**/admin/public-support*', route => route.fulfill({ json: { data: [], last_page: 1 } }))
  let saved: any = null; let conflict = false
  await page.route('**/admin/public-portal', route => {
    if (route.request().method() === 'PUT') { saved = route.request().postDataJSON(); return route.fulfill(conflict ? { status: 409, json: { message: 'La page a été modifiée.' } } : { json: { data: { ...portal, ...saved, revision: 1 } } }) }
    return route.fulfill({ json: { data: portal } })
  })
  await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' })
  const panel = page.locator('#public-portal')
  await panel.getByRole('button', { name: 'Ajouter une annonce' }).click()
  await panel.getByLabel('Titre', { exact: true }).fill('Official synthetic notice')
  await panel.getByLabel('Contenu', { exact: true }).fill('Administrative announcement text')
  await panel.getByLabel('Début de publication').fill('2026-11-01')
  await panel.getByLabel('Fin de publication').fill('2026-11-10')
  await panel.getByRole('combobox', { name: 'État annonce 1', exact: true }).selectOption('published')
  await panel.getByRole('button', { name: 'Enregistrer le contenu public' }).click()
  await expect(panel.getByRole('status')).toHaveText('Contenu public enregistré.')
  await page.setViewportSize({ width: 1280, height: 2400 })
  await panel.screenshot({ path: 'test-results/public-design-admin-editor.png' })
  expect(saved.announcements[0].status).toBe('published')
  conflict = true
  await panel.getByLabel('Titre', { exact: true }).fill('Draft preserved')
  await panel.getByRole('button', { name: 'Enregistrer le contenu public' }).click()
  await expect(panel.getByRole('alert')).toContainText('La page a été modifiée.')
  await expect(panel.getByLabel('Titre', { exact: true })).toHaveValue('Draft preserved')
})

test('published notice and official PDF stay usable on a mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const attachment = 'd970b8d5-d586-4d13-9838-09b73f711192'
  await page.route('**/public/admissions/portal', route => route.fulfill({ json: { data: { ...portal, announcements: [{ id: 'notice', title: 'Communiqué officiel de l’établissement', body: 'Présentation des pièces selon le calendrier officiel.', status: 'published', starts_on: '2026-10-01', ends_on: '2026-12-31', attachment_id: attachment }] } } }))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Communiqué officiel de l’établissement', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Télécharger le communiqué officiel' })).toHaveAttribute('href', new RegExp(`/announcements/${attachment}/pdf$`))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.screenshot({ path: 'test-results/public-portal-notice-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 3200 })
  await page.locator('#guide-inscription').screenshot({ path: 'test-results/public-design-guide-mobile.png' })
})


test('public guide supports dark mode with visible controls and consistent surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Comment s’inscrire ?' })).toBeVisible()
  await page.getByRole('button', { name: 'Activer le mode sombre' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: 'Activer le mode clair' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'TAFEM', exact: true })).toHaveAttribute('aria-selected', 'true')
  expect(await page.locator('#guide-inscription .portal-surface').first().evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgb(255, 255, 255)')
  await page.locator('#guide-inscription').screenshot({ path: 'test-results/public-design-guide-dark.png' })
})

test('tablet and mobile navigation keep the registration guide reachable', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1000 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Comment s’inscrire ?' })).toBeVisible()
  await page.getByRole('button', { name: 'Ouvrir la navigation' }).click()
  await page.locator('#public-mobile-navigation').getByRole('link', { name: 'Comment s’inscrire ?', exact: true }).click()
  await expect(page).toHaveURL(/#guide-inscription$/)
  await expect(page.getByRole('button', { name: 'Ouvrir la navigation' })).toHaveAttribute('aria-expanded', 'false')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Ouvrir la navigation' }).click()
  await expect(page.locator('#public-mobile-navigation')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connexion', exact: true })).toBeVisible()
  expect(await page.locator('nav').first().evaluate(element => element.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.locator('nav').first().screenshot({ path: 'test-results/public-design-mobile-navigation.png' })
})
