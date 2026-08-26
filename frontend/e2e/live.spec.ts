import { test, expect } from '@playwright/test'

const live = !!process.env.E2E_LIVE

test.describe('P2 — parcours live (API réelle)', () => {
  test.skip(!live, 'Définir E2E_LIVE=1 et un backend joignable (VITE_API_URL).')

  test('login page is reachable without mocks', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 20000 })
  })
})
