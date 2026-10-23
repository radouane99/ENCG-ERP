import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

test.describe('Audit rôles — erreurs serveur et faux succès', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Sondes d’audit opt-in, assertions protectrices volontairement rouges.')
  test('un échec de sauvegarde des paramètres ne doit pas afficher un succès', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'admin')
    await page.route(url => url.pathname === '/api/settings', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Synthetic audit failure' }) }))
    await page.goto('/settings')
    await expect(page.getByRole('button', { name: 'Enregistrer les paramètres' })).toBeVisible()
    const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/settings' && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Enregistrer les paramètres' }).click()
    expect((await response).status()).toBe(500)
    await expect(page.locator('[data-sonner-toast][data-type="error"]').first()).toBeVisible()
    await page.screenshot({ path: 'test-results/roles-settings-false-success.png', fullPage: true })
    await expect(page.getByText('Paramètres enregistrés.', { exact: true })).toHaveCount(0, { timeout: 1000 })
  })

  test('un paiement refusé par le serveur ne doit pas être annoncé validé', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'admin')
    await page.route(url => url.pathname === '/api/finance/stats', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { payments: [{ id: 999, name: 'Synthetic Audit', type: 'Formation Continue', tranche: 'T1', method: 'CMI', amount: '1000 MAD', date: '2026-10-23', status: 'PENDING' }] } }) }))
    await page.route(url => url.pathname === '/api/admin/finance/payments/999/validate', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Synthetic audit failure' }) }))
    await page.goto('/admin/finance')
    await expect(page.getByRole('button', { name: 'Valider', exact: true })).toBeVisible()
    const response = page.waitForResponse(r => r.url().endsWith('/api/admin/finance/payments/999/validate'))
    await page.getByRole('button', { name: 'Valider', exact: true }).click()
    expect((await response).status()).toBe(500)
    const success = page.getByText('Paiement de Synthetic Audit validé avec succès !', { exact: true })
    await expect(page.locator('[data-sonner-toast][data-type="error"]').first()).toBeVisible()
    await page.screenshot({ path: 'test-results/roles-payment-false-success.png', fullPage: true })
    await expect(success).toHaveCount(0, { timeout: 1000 })
  })
})
