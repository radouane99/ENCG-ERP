import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

test('dossier structuré : sauvegarde privée, documents conditionnels et historique en lecture seule', async ({ page }) => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Données synthétiques uniquement')
  await mockApi(page)
  await seedSession(page, 'student')
  let dossier = {
    id: 17, version: 1, first_name: 'Sara', last_name: 'Synthetic', email: 'synthetic@example.test',
    cne: 'N123456789', cin: 'AB123456', reference_number: 'SYN-17', eligibility: 'main', dossier_status: 'draft',
    campaign: { id: 7, name: 'TAFEM synthétique', entry_route: 'tafem', entry_semester: 1, close_date: '2027-01-01' },
    profile: { gender: 'female' } as Record<string, unknown>, documents: {}, required_documents: ['bac', 'cnie', 'releve_notes', 'photo'],
    reviews: [], events: [], notifications: [], ocr_runs: [], cloud_available: false,
    administrative_context: { entry_route: 'tafem', planned_entry_semester: 1, academic_year: '2026/2027', university: 'Université test',
      filiere: 'Tronc commun', cycle: 'grande_ecole', registration_status: 'draft', registration_date: null, registration_semesters: [],
      renewals: [], created_at: '2026-10-26T09:00:00Z', updated_at: '2026-10-26T09:00:00Z' },
  }
  await page.route(url => url.pathname === '/api/admissions/workflow/dossier', route => {
    if (route.request().method() === 'POST') {
      const { application_id: _id, version: _version, ...profile } = route.request().postDataJSON()
      dossier = { ...dossier, version: dossier.version + 1, profile }
    }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ candidate: dossier }) })
  })
  await page.goto('/admissions/mon-dossier')
  await expect(page.getByRole('heading', { name: 'Informations du père', exact: true })).toBeVisible()
  await page.locator('#admission-father_first_name').fill('Parent test')
  await page.locator('#admission-address_ar').fill('عنوان تجريبي')
  await page.getByLabel('J’ai déjà été inscrit dans l’enseignement supérieur').check()
  await page.locator('#admission-previous_university').fill('Université antérieure test')
  await expect(page.getByLabel('Ajouter Diplôme de licence', { exact: true })).toHaveCount(1)
  await expect.poll(() => dossier.profile.previous_university).toBe('Université antérieure test')
  await page.reload()
  await expect(page.locator('#admission-father_first_name')).toHaveValue('Parent test')
  await expect(page.locator('#admission-address_ar')).toHaveValue('عنوان تجريبي')
  await expect(page.getByRole('region', { name: 'Parcours administratif' })).toContainText('Aucune réinscription enregistrée.')
  await expect(page.getByRole('region', { name: 'Parcours administratif' }).locator('input, select')).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
