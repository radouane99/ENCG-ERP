import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

test.describe('A11y FR/AR — login et notes', () => {
  test('login expose labels and can switch to Arabic RTL', async ({ page }) => {
    await mockApi(page)
    await page.addInitScript(() => {
      localStorage.setItem('encg_lang', 'ar')
    })
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'ar')
    await expect(html).toHaveAttribute('dir', 'rtl')
  })

  test('student grades page keeps a labelled heading', async ({ page }) => {
    await mockApi(page)
    await seedSession(page, 'student')
    await page.goto('/student/grades', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('student-grades-page')).toBeVisible({ timeout: 30_000 })
    await expect(
      page.getByTestId('student-grades-page').getByRole('heading', { name: /Performance Académique/i }),
    ).toBeVisible()
  })

  test('student can switch the page and mobile navigation from French to Arabic', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockApi(page)
    await seedSession(page, 'student')
    await page.goto('/student/gamification')
    await expect(page.getByRole('heading', { name: 'Missions et récompenses', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Langue', exact: true }).click()
    await page.getByRole('button', { name: /العربية/ }).click()
    await expect(page.getByRole('heading', { name: 'المهام والمكافآت', exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'التنقل على الهاتف' }).getByRole('link', { name: 'النقاط', exact: true })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page).toHaveTitle(/المهام والمكافآت/)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.getByRole('heading', { name: 'المهام والمكافآت', exact: true })).toBeVisible()
    expect(await page.locator('main').evaluate(main => main.scrollWidth - main.clientWidth)).toBeLessThanOrEqual(1)
  })

  test('Arabic administration shows translated document controls and notifications', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockApi(page)
    await seedSession(page, 'admin')
    await page.addInitScript(() => localStorage.setItem('encg_lang', 'ar'))
    await page.goto('/academic/documents')
    await expect(page.getByRole('heading', { name: 'مركز الوثائق الآمنة', exact: true })).toBeVisible()
    await expect(page.getByLabel('معرّف الطالب', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'مركز الإشعارات', exact: true }).click()
    await expect(page.getByTestId('notification-panel').getByText('الإشعارات', { exact: true })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })
})
