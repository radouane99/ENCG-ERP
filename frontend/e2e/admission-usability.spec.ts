import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const base = '/api/admissions/workflow'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
const initial = () => ({ id: 17, version: 1, first_name: 'Sara', last_name: 'Synthetic', cne: 'N123456789', cin: 'AB123456', reference_number: 'SYN-17', eligibility: 'main', dossier_status: 'draft', campaign: { id: 7, name: 'TAFEM synthétique', close_date: '2027-01-01' }, profile: { phone: '0612345678', gender: 'female', address: 'Adresse synthétique', birth_date: '2006-02-12', bac_average: 16, bac_year: 2026 }, documents: Object.fromEntries(['bac', 'cnie', 'releve_notes', 'photo'].map((type, i) => [type, { id: 90 + i, type, status: 'pending', version: 1, signed_url: '/synthetic.pdf' }])), required_documents: ['bac', 'cnie', 'releve_notes', 'photo'], reviews: [], events: [], notifications: [], ocr_runs: [], cloud_available: false })
test.describe('Admission pratique', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Données synthétiques uniquement')
  test('autosave conserve la saisie pendant une requête lente et reprend après rechargement', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student'); let dossier = initial(); let started = false; let release: (() => void) | undefined
    const gate = new Promise<void>(resolve => { release = resolve }); let saves = 0
    await page.route(url => url.pathname === `${base}/dossier`, async route => {
      if (route.request().method() === 'POST') {
        const data = route.request().postDataJSON(); saves++; if (saves === 1) { started = true; await gate }
        dossier = { ...dossier, version: dossier.version + 1, profile: { ...dossier.profile, phone: data.phone } }
      }
      return route.fulfill(json({ candidate: dossier }))
    })
    await page.goto('/admissions/mon-dossier'); await page.getByLabel('Téléphone personnel', { exact: true }).fill('0611111111')
    await expect.poll(() => started).toBe(true)
    await page.getByLabel('Téléphone personnel', { exact: true }).fill('0622222222'); release?.()
    await expect.poll(() => dossier.profile.phone).toBe('0622222222')
    await expect(page.getByLabel('Téléphone personnel', { exact: true })).toHaveValue('0622222222')
    await page.reload(); await expect(page.getByLabel('Téléphone personnel', { exact: true })).toHaveValue('0622222222')
  })
  test('conflit bloque les nouvelles sauvegardes jusqu’au rechargement explicite', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student'); let posts = 0
    await page.route(url => url.pathname === `${base}/dossier`, route => { if (route.request().method() === 'POST') { posts++; return route.fulfill({ ...json({ message: 'Version modifiée' }), status: 409 }) } return route.fulfill(json({ candidate: initial() })) })
    await page.goto('/admissions/mon-dossier'); await page.getByLabel('Téléphone personnel', { exact: true }).fill('0611111111')
    await expect(page.getByRole('button', { name: 'Charger la version enregistrée' })).toBeVisible()
    await page.getByLabel('Téléphone personnel', { exact: true }).fill('0622222222'); await page.waitForTimeout(2000); expect(posts).toBe(1)
    await page.getByRole('button', { name: 'Charger la version enregistrée' }).click(); await expect(page.getByLabel('Téléphone personnel', { exact: true })).toHaveValue('0612345678')
  })
  for (const mobile of [false, true]) test(`revue finale et langues ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await mockApi(page); await seedSession(page, 'student'); let dossier = initial(); let submissions = 0
    await page.route(url => url.pathname === `${base}/dossier`, route => route.fulfill(json({ candidate: dossier })))
    await page.route(url => url.pathname === `${base}/submit`, route => { submissions++; expect(route.request().postDataJSON().version).toBe(1); dossier = { ...dossier, dossier_status: 'submitted' }; return route.fulfill(json({ candidate: dossier })) })
    await page.goto('/admissions/mon-dossier'); await page.getByRole('button', { name: 'العربية', exact: true }).click()
    await expect(page.getByTestId('candidate-admission-workspace')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByLabel('رقم الهاتف الشخصي', { exact: true })).toHaveValue('0612345678')
    await page.getByRole('button', { name: 'Français', exact: true }).click()
    await page.getByRole('button', { name: 'Vérifier avant envoi', exact: true }).click()
    const dialog = page.getByRole('dialog'); await expect(dialog.getByText('SYN-17', { exact: false })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Confirmer et soumettre' })).toBeDisabled(); expect(submissions).toBe(0)
    await dialog.getByRole('checkbox').check(); await dialog.getByRole('button', { name: 'Confirmer et soumettre' }).click(); await expect(dialog).not.toBeVisible(); expect(submissions).toBe(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/admission-pratique-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })
  test('image faible qualité exige une vérification avant tout envoi', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student'); let uploads = 0
    await page.route(url => url.pathname === `${base}/dossier`, route => route.fulfill(json({ candidate: initial() })))
    await page.route(url => url.pathname === `${base}/documents`, route => { uploads++; return route.fulfill(json({ candidate: initial(), document: { id: 93 } })) })
    await page.goto('/admissions/mon-dossier')
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a99sAAAAASUVORK5CYII=', 'base64')
    await page.getByLabel('Remplacer Photo d’identité récente', { exact: true }).setInputFiles({ name: 'tiny.png', mimeType: 'image/png', buffer: png })
    const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('alert')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Envoyer l’original', exact: true })).toBeDisabled(); expect(uploads).toBe(0)
    await dialog.getByRole('checkbox').check(); await dialog.getByRole('button', { name: 'Envoyer l’original', exact: true }).click(); await expect.poll(() => uploads).toBe(1)
  })
  test('une correction conserve les pièces validées et empêche un envoi incomplet', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student'); const dossier = initial(); dossier.dossier_status = 'needs_correction'; dossier.documents.bac.status = 'verified'; dossier.documents.cnie.status = 'rejected'
    await page.route(url => url.pathname === `${base}/dossier`, route => route.fulfill(json({ candidate: dossier })))
    await page.goto('/admissions/mon-dossier')
    await expect(page.getByLabel('Remplacer Baccalauréat', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Pièce déjà validée · conservée pendant la correction.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Vérifier avant envoi', exact: true }).click()
    await page.getByRole('dialog').getByRole('checkbox').check()
    await expect(page.getByRole('button', { name: 'Confirmer et soumettre', exact: true })).toBeDisabled()
  })
})
