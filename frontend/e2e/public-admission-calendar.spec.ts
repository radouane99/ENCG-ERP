import { test, expect } from '@playwright/test'
import { mockApi } from './helpers'

const campaign = { id: 71, name: 'TAFEM — Campagne officielle', entry_route: 'tafem', entry_semester: 1, open_date: '2026-11-01', close_date: '2026-11-10', state: 'open' }
test.beforeEach(async ({ page }) => { await mockApi(page) })

test('closed landing has no permanent open-session popup and keeps existing dossier access', async ({ page }) => {
  await page.route('**/public/admissions/calendar', route => route.fulfill({ json: { data: { state: 'closed', campaigns: [], timezone: 'Africa/Casablanca', server_now: '2026-10-26T12:00:00Z' } } }))
  await page.goto('/')
  const calendar = page.getByTestId('public-admission-calendar')
  await expect(calendar.getByText('Inscriptions fermées', { exact: true })).toBeVisible()
  await expect(page.getByText('Session ouverte', { exact: true })).toHaveCount(0)
  await expect(calendar.getByRole('link', { name: 'Accéder à cette session' })).toHaveCount(0)
  await expect(calendar.getByRole('link', { name: 'Suivre mon dossier existant' })).toHaveAttribute('href', '/login')
  await page.screenshot({ path: 'test-results/public-calendar-closed.png', fullPage: true })
})

test('upcoming session shows official dates without accepting new registrations', async ({ page }) => {
  await page.route('**/public/admissions/calendar', route => route.fulfill({ json: { data: { state: 'upcoming', campaigns: [{ ...campaign, state: 'upcoming' }], timezone: 'Africa/Casablanca', server_now: '2026-10-26T12:00:00Z' } } }))
  await page.goto('/inscription')
  await expect(page.getByTestId('public-admission-calendar').getByRole('status')).toHaveText('Prochaine ouverture')
  await expect(page.getByRole('tab', { name: 'Créer un compte' })).toHaveCount(0)
  await expect(page.getByText(/1 novembre 2026/)).toBeVisible()
})

test('open session carries its campaign to registration and reacts to administrative closure', async ({ page }) => {
  let open = true
  await page.route('**/public/admissions/calendar', route => route.fulfill({ json: { data: { state: open ? 'open' : 'closed', campaigns: open ? [campaign] : [], timezone: 'Africa/Casablanca', server_now: new Date().toISOString() } } }))
  await page.goto('/')
  await page.getByRole('link', { name: 'Accéder à cette session', exact: true }).click()
  await expect(page).toHaveURL(/inscription\?campaign_id=71/)
  await expect(page.getByLabel('Session d’inscription', { exact: true })).toHaveValue('71')
  await expect(page.getByRole('tab', { name: 'Créer un compte' })).toBeVisible()
  open = false
  await page.reload()
  await expect(page.getByTestId('public-admission-calendar').getByRole('status')).toHaveText('Inscriptions fermées')
  await expect(page.getByRole('tab', { name: 'Créer un compte' })).toHaveCount(0)
})

test('network failure never announces open or closed as a known fact', async ({ page }) => {
  await page.route('**/public/admissions/calendar', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.goto('/')
  const calendar = page.getByTestId('public-admission-calendar')
  await expect(calendar.getByRole('alert')).toContainText('Calendrier momentanément indisponible')
  await expect(calendar.getByRole('link', { name: 'Accéder à cette session' })).toHaveCount(0)
})

test('mobile registration keeps the scheduled campaign and fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/public/admissions/calendar', route => route.fulfill({ json: { data: { state: 'open', campaigns: [campaign], timezone: 'Africa/Casablanca', server_now: new Date().toISOString() } } }))
  await page.goto('/inscription?campaign_id=71')
  await expect(page.getByTestId('public-admission-calendar').getByRole('status')).toHaveText('Inscriptions ouvertes')
  await expect(page.getByRole('tab', { name: 'Créer un compte' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.screenshot({ path: 'test-results/public-calendar-mobile.png', fullPage: true })
})
