import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

test('calendrier, recette OCR et réinscription via le vrai backend', async ({ page }) => {
  test.skip(!process.env.E2E_RENEWALS_LIVE, 'Base synthétique dédiée requise.')
  test.setTimeout(600_000)
  const login = async (role: string) => {
    const response = await page.request.post('/api/v1/auth/login', { data: { email: `e2e.renewal.${role}@example.test`, password: 'TestOnlyPassword123!' } })
    expect(response.status()).toBe(200)
  }
  await login('scolarite'); await page.goto('/admin/reinscriptions')
  const calendar = page.getByRole('region', { name: 'Calendrier des réinscriptions' })
  const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  await calendar.getByLabel('Ouverture', { exact: true }).fill(today)
  await calendar.getByLabel('Clôture', { exact: true }).fill(today)
  await calendar.getByLabel('Publication', { exact: true }).selectOption('open')
  await calendar.getByLabel('Consignes publiques').fill('Pièces originales à présenter au guichet synthétique.')
  await calendar.getByRole('button', { name: 'Enregistrer le calendrier' }).click()
  await expect(calendar.getByText(/La campagne de réinscription est ouverte/)).toBeVisible()

  await page.goto('/academic/enrollments'); await page.getByRole('button', { name: 'Campagnes & échéances', exact: true }).click()
  const evaluation = page.getByRole('region', { name: 'Recette OCR', exact: true })
  await evaluation.getByLabel(/Annotations attendues et extraites/).setInputFiles({ name: 'synthetic.json', mimeType: 'application/json', buffer: readFileSync('public/templates/ocr-evaluation.json') })
  await evaluation.getByRole('checkbox').check(); await evaluation.getByRole('button', { name: 'Comparer les annotations' }).click()
  await expect(evaluation.getByText('50 %', { exact: true })).toBeVisible()

  await page.request.post('/api/v1/auth/logout'); await login('student'); await page.goto('/student/reinscription')
  await expect(page.getByText('Pièces originales à présenter au guichet synthétique.')).toBeVisible()
  await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Confirmer ma réinscription', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Récépissé de confirmation', exact: true })).toBeVisible()

  await page.request.post('/api/v1/auth/logout'); await login('scolarite'); await page.goto('/admin/reinscriptions')
  await calendar.getByLabel('Publication', { exact: true }).selectOption('closed')
  await calendar.getByRole('button', { name: 'Enregistrer le calendrier' }).click()
  await expect(calendar.getByText(/La campagne de réinscription est fermée/)).toBeVisible()
  await page.getByRole('button', { name: 'Contrôler le dossier', exact: true }).click()
  const dialog = page.getByRole('dialog'); for (const checkbox of await dialog.getByRole('checkbox').all()) await checkbox.check()
  await dialog.getByRole('button', { name: 'Valider le contrôle physique' }).click()
  await expect(page.getByText('Contrôle validé', { exact: false })).toBeVisible()

  await page.request.post('/api/v1/auth/logout'); await login('student'); await page.goto('/student/reinscription')
  await expect(page.getByRole('heading', { name: 'Récépissé de confirmation', exact: true })).toBeVisible()
  const status = (await (await page.request.get('/api/student-portal/reinscription/status')).json()).data
  expect(status.campaign.state).toBe('closed'); expect(status.can_confirm).toBe(false); expect(status.physical_verified_at).toBeTruthy()
})
