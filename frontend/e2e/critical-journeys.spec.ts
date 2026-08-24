import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

async function open(page: Parameters<typeof mockApi>[0], path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
}

test.describe('P2 — 8 parcours critiques', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
  })

  test('1. login — formulaire et authentification mockée', async ({ page }) => {
    await open(page, '/login')
    await expect(page.getByTestId('login-page')).toBeVisible()
    await page.locator('#email').fill('student@encg-fes.ma')
    await page.locator('#password').fill('password')
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('2. notes étudiant', async ({ page }) => {
    await seedSession(page, 'student')
    await open(page, '/student/grades')
    await expect(page.getByTestId('student-grades-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Performance Académique')).toBeVisible()
  })

  test('2b. dashboard étudiant — CTA métier', async ({ page }) => {
    await seedSession(page, 'student')
    await open(page, '/dashboard')
    await expect(page.getByTestId('role-quick-actions')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('cta-student-grades')).toBeVisible()
    await expect(page.getByTestId('cta-student-documents')).toBeVisible()
  })

  test('3. PV public — vérification QR', async ({ page }) => {
    await open(page, '/verify/pv/1/1')
    await expect(page.getByTestId('verify-pv-page')).toBeVisible()
    await expect(page.getByText('PV Signé & Authentique')).toBeVisible({ timeout: 15000 })
  })

  test('4. guichet étudiant', async ({ page }) => {
    await seedSession(page, 'student')
    await open(page, '/student/documents')
    await expect(page.getByTestId('student-guichet-page')).toBeVisible({ timeout: 15000 })
  })

  test('5. TAFEM — préinscription publique', async ({ page }) => {
    await open(page, '/inscription')
    await expect(page.getByTestId('tafem-inscription-page')).toBeVisible({ timeout: 20000 })
  })

  test('6. TAFEM admin', async ({ page }) => {
    await seedSession(page, 'admin')
    await open(page, '/admin/tafem')
    await expect(page.getByTestId('admin-tafem-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /TAFEM 2026/ })).toBeVisible()
  })

  test('7. PV admin — cockpit délibération', async ({ page }) => {
    await seedSession(page, 'admin')
    await open(page, '/admin/grades/pv')
    await expect(page.getByTestId('admin-pv-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Procès-Verbaux de Notes Officiels')).toBeVisible()
  })

  test('8. guichet admin', async ({ page }) => {
    await seedSession(page, 'admin')
    await open(page, '/admin/guichet')
    await expect(page.getByTestId('admin-guichet-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /Guichet Unique/ })).toBeVisible()
  })
})
