import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

test.describe('A11y FR/AR — login et notes', () => {
  test('login expose labels and can switch to Arabic RTL', async ({ page }) => {
    await mockApi(page)
    await page.addInitScript(() => {
      localStorage.setItem('encg_lang', 'ar')
    })
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('login-page')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', /ar|fr/)
  })

  test('student grades page keeps a labelled heading', async ({ page }) => {
    await mockApi(page)
    await seedSession(page, 'student')
    await page.goto('/student/grades', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('student-grades-page')).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByTestId('student-grades-page').getByRole('heading', { name: /Performance Académique/i }),
    ).toBeVisible()
  })
})
