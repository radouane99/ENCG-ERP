import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

test.describe('P2 — 8 parcours critiques', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
  })

  test('1. login — formulaire et authentification mockée', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByTestId('login-page')).toBeVisible()
    await page.locator('#email').fill('student@encg-fes.ma')
    await page.locator('#password').fill('password')
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('2. notes étudiant', async ({ page }) => {
    await seedSession(page, 'student')
    await page.goto('/student/grades')
    await expect(page.getByTestId('student-grades-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Performance Académique')).toBeVisible()
  })

  test('3. PV public — vérification QR', async ({ page }) => {
    await page.goto('/verify/pv/1/1')
    await expect(page.getByTestId('verify-pv-page')).toBeVisible()
    await expect(page.getByText('PV Signé & Authentique')).toBeVisible({ timeout: 15000 })
  })

  test('4. guichet étudiant', async ({ page }) => {
    await seedSession(page, 'student')
    await page.goto('/student/documents')
    await expect(page.getByTestId('student-guichet-page')).toBeVisible({ timeout: 15000 })
  })

  test('5. TAFEM — préinscription publique', async ({ page }) => {
    await page.goto('/inscription')
    await expect(page.getByTestId('tafem-inscription-page')).toBeVisible({ timeout: 20000 })
  })

  test('6. TAFEM admin', async ({ page }) => {
    await seedSession(page, 'admin')
    await page.goto('/admin/tafem')
    await expect(page.getByTestId('admin-tafem-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/TAFEM 2026/)).toBeVisible()
  })

  test('7. PV admin — cockpit délibération', async ({ page }) => {
    await seedSession(page, 'admin')
    await page.goto('/admin/grades/pv')
    await expect(page.getByTestId('admin-pv-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Procès-Verbaux de Notes Officiels')).toBeVisible()
  })

  test('8. guichet admin', async ({ page }) => {
    await seedSession(page, 'admin')
    await page.goto('/admin/guichet')
    await expect(page.getByTestId('admin-guichet-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Guichet Unique/)).toBeVisible()
  })
})
