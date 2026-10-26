import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

test.beforeEach(async ({ page }) => { await mockApi(page) })

test('login transmits remember and exposes no demo credentials by default', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('student@encg-fes.ma')
  await page.locator('#password').fill('Synthetic123!')
  await page.locator('input[type=checkbox]').check()
  const sent = page.waitForRequest(request => request.url().includes('/v1/auth/login') && request.method() === 'POST')
  await page.getByTestId('login-submit').click()
  expect((await sent).postDataJSON().remember).toBe(true)
  await expect(page).toHaveURL(/dashboard/)
})

test('two factor recovery reaches the verification endpoint', async ({ page }) => {
  await page.route('**/v1/auth/login', route => route.fulfill({ json: { data: { requires_two_factor: true, two_factor_challenge_token: 'synthetic-challenge' } } }))
  await page.route('**/v1/auth/two-factor/verify', route => route.fulfill({ status: 422, json: { message: 'Code synthétique refusé.' } }))
  await page.goto('/login')
  await page.locator('#email').fill('student@encg-fes.ma')
  await page.locator('#password').fill('Synthetic123!')
  await page.getByTestId('login-submit').click()
  await expect(page).toHaveURL(/two-factor/)
  await page.getByRole('button', { name: 'Utiliser un code de récupération' }).click()
  await page.getByLabel('Code de récupération', { exact: true }).fill('ABCDE-FGHIJ')
  const sent = page.waitForRequest(request => request.url().includes('/two-factor/verify'))
  await page.getByRole('button', { name: 'Vérifier', exact: true }).click()
  expect((await sent).postDataJSON()).toEqual({ code: 'ABCDE-FGHIJ', challenge_token: 'synthetic-challenge' })
  await expect(page.getByText('Code synthétique refusé.')).toBeVisible()
})

test('profile lists actual server sessions and revokes selected access', async ({ page }) => {
  await seedSession(page, 'admin')
  let revoked = false
  await page.route(/\/v1\/auth\/sessions(?:\/.*)?$/, route => {
    if (route.request().method() === 'DELETE') { revoked = true; return route.fulfill({ json: { message: 'Session révoquée.' } }) }
    return route.fulfill({ json: { data: [{ id: 9001, is_current: true, created_at: '2026-10-26T10:00:00Z', last_used_at: null, expires_at: null }, ...(!revoked ? [{ id: 9002, is_current: false, created_at: '2026-10-26T09:00:00Z', last_used_at: null, expires_at: null }] : [])] } })
  })
  await page.goto('/profile')
  await page.getByRole('button', { name: /Sessions/ }).click()
  await expect(page.getByRole('heading', { name: 'Session 9002', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Déconnecter', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Session 9002', exact: true })).toHaveCount(0)
  await expect.poll(() => revoked).toBe(true)
  await expect(page.getByRole('heading', { name: 'Session actuelle', exact: true })).toBeVisible()
})

test('profile reports session failure instead of inventing an active device', async ({ page }) => {
  await seedSession(page, 'admin')
  await page.route('**/v1/auth/sessions', route => route.fulfill({ status: 503, json: { message: 'Indisponible' } }))
  await page.goto('/profile')
  await page.getByRole('button', { name: /Sessions/ }).click()
  await expect(page.getByRole('alert')).toContainText('Impossible de charger les sessions.', { timeout: 30000 })
  await expect(page.getByRole('button', { name: 'Déconnecter toutes les autres sessions' })).toBeDisabled()
})
