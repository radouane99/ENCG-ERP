import { test, expect } from '@playwright/test'

const live = !!process.env.E2E_LIVE

test.describe('P2 — parcours live (API réelle)', () => {
  test.skip(!live, 'Définir E2E_LIVE=1 et un backend joignable (VITE_API_URL).')

  test('login page is reachable without mocks', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 20000 })
  })

  test('real API authenticates, rejects student admin writes, and revokes the cookie on logout', async ({ request }) => {
    const apiURL = process.env.E2E_API_URL || 'http://127.0.0.1:8000/api'
    const login = await request.post(`${apiURL}/v1/auth/login`, {
      data: { email: 'e2e.student@example.test', password: 'TestOnlyPassword123!' },
    })
    expect(login.status()).toBe(200)
    expect(/httponly/i.test(login.headers()['set-cookie'] || '')).toBe(true)
    expect((await request.get(`${apiURL}/v1/auth/me`)).status()).toBe(200)
    expect((await request.post(`${apiURL}/timetable/dates-config`, {
      data: { cours_start: '16/09/2026', td_tp_start: '23/09/2026' },
    })).status()).toBe(403)
    expect((await request.post(`${apiURL}/v1/auth/logout`)).status()).toBe(200)
    expect((await request.get(`${apiURL}/v1/auth/me`)).status()).toBe(401)
  })
})
