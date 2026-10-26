import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

const manager = { id: 1, name: 'Synthetic Manager', email: 'manager@example.test', roles: ['institution-admin'], permissions: ['users.manage', 'users.view'], institution_id: 1, two_factor_enabled: false }
const target = { id: 42, name: 'Synthetic Professor', email: 'target@example.test', roles: ['professor'], permissions: [], is_active: true, two_factor_enabled: false }

test.beforeEach(async ({ page }) => {
  await mockApi(page); await seedSession(page, 'admin')
  await page.route('**/v1/auth/me', route => route.fulfill({ json: { data: manager } }))
  await page.route('**/api/users/42', route => route.fulfill({ json: { data: target } }))
})

test('administrator can request selective 2FA with a reason and own password', async ({ page }) => {
  let submitted: any = null
  await page.route('**/users/42/security', route => {
    if (route.request().method() === 'POST') { submitted = route.request().postDataJSON(); return route.fulfill({ json: { message: 'Applied' } }) }
    return route.fulfill({ json: { data: [] } })
  })
  await page.goto('/admin/users/42')
  await page.getByRole('button', { name: /Sécurité/ }).click()
  await page.getByRole('combobox', { name: 'Action', exact: true }).selectOption('require_2fa')
  await page.getByLabel('Motif et référence du contrôle').fill('Synthetic request TEST-001')
  await page.getByLabel('Votre mot de passe actuel').fill('Synthetic123!')
  await page.getByRole('button', { name: 'Appliquer la mesure de sécurité' }).click()
  await expect(page.getByRole('status')).toContainText('Opération enregistrée')
  expect(submitted.operation).toBe('require_2fa'); expect(submitted.reason).toContain('TEST-001')
})

test('failed intervention is visible and never reported as successful', async ({ page }) => {
  await page.route('**/users/42/security', route => route.fulfill(route.request().method() === 'POST' ? { status: 422, json: { message: 'Mot de passe actuel incorrect.' } } : { json: { data: [] } }))
  await page.goto('/admin/users/42')
  await page.getByRole('button', { name: /Sécurité/ }).click()
  await page.getByLabel('Motif et référence du contrôle').fill('Synthetic request TEST-002')
  await page.getByLabel('Votre mot de passe actuel').fill('WrongPassword')
  await page.getByRole('button', { name: 'Appliquer la mesure de sécurité' }).click()
  await expect(page.getByRole('alert')).toContainText('Mot de passe actuel incorrect.')
  await expect(page.getByText('Opération enregistrée', { exact: false })).toHaveCount(0)
})
