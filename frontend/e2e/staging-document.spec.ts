import { expect, test } from '@playwright/test'

test('staging recovers when a lazy chunk from a previous release is unavailable', async ({ page }) => {
  test.skip(process.env.E2E_STAGING !== '1', 'Runs only against the isolated staging stack')
  let interrupted = false
  await page.route('**/assets/LoginPage-*.js', async route => {
    if (!interrupted) {
      interrupted = true
      await route.abort('failed')
    } else {
      await route.continue()
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Connexion', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible()
  expect(interrupted).toBe(true)
})

test('staging administrator generates and downloads a registered document', async ({ page }) => {
  test.skip(process.env.E2E_STAGING !== '1', 'Runs only against the isolated staging stack')
  const password = process.env.STAGING_SMOKE_PASSWORD
  const studentId = process.env.STAGING_SMOKE_STUDENT_ID
  if (!password || !studentId) throw new Error('Synthetic staging credentials and student ID are required')

  await page.goto('/login')
  await page.getByRole('textbox', { name: /Adresse email/ }).fill('institution-admin@staging.example.test')
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
  await page.goto('/academic/documents')
  await expect(page.getByRole('heading', { name: 'Centre de Documents Sécurisés' })).toBeVisible()
  await page.getByRole('combobox').selectOption({ label: 'Attestation de scolarité' })
  await page.getByRole('spinbutton').fill(studentId)
  await page.getByRole('button', { name: 'Générer avec QR Cryptographique' }).click()
  await expect(page.getByText('Document Sécurisé Prêt')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger PDF' }).click()
  expect((await download).suggestedFilename()).toMatch(/^document-\d+\.pdf$/)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Télécharger PDF' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
