import { test, expect } from '@playwright/test'

const live = !!process.env.E2E_ADMISSIONS_LIVE
function syntheticPdf() {
  const text = 'BT /F1 16 Tf 50 740 Td (SYNTHETIC AUDIT DOCUMENT) Tj 0 -30 Td (CIN XY123456) Tj 0 -30 Td (CNE Z123456789) Tj ET'
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
  let pdf = '%PDF-1.4\n'; const offsets = [0]
  objects.forEach((o, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf)
}

test.describe('TAFEM — parcours réel sans API simulée', () => {
  test.skip(!live, 'E2E_ADMISSIONS_LIVE=1 et base dédiée requises.')
  test('un candidat dépose, soumet puis la scolarité examine et valide le dossier', async ({ page }) => {
    test.setTimeout(360_000)
    page.on('requestfailed', r => console.log('request_failed', new URL(r.url()).pathname, r.failure()?.errorText))
    page.on('response', r => { if (r.url().includes('/v1/auth/me')) console.log('session_response', r.status()) })
    await page.goto('/inscription')
    await expect(page.getByRole('heading', { name: 'Inscription TAFEM', exact: true })).toBeVisible()
    const login = await page.request.post('/api/v1/auth/login', { data: { email: 'e2e.candidate@example.test', password: 'TestOnlyPassword123!' } })
    expect(login.status()).toBe(200)
    expect((await page.request.get('/api/v1/auth/me')).status()).toBe(200)
    await page.goto('/admissions/mon-dossier')
    await expect(page.getByTestId('candidate-admission-workspace')).toBeVisible({ timeout: 90_000 })
    const photo = await page.screenshot({ clip: { x: 0, y: 0, width: 300, height: 400 } })
    for (const label of ['Baccalauréat', 'CNIE · recto et verso', 'Relevé de notes']) {
      await page.getByLabel(`Ajouter ${label}`, { exact: true }).setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: syntheticPdf() })
      await expect(page.getByRole('button', { name: 'Retirer', exact: true })).toHaveCount(label === 'Baccalauréat' ? 1 : label.startsWith('CNIE') ? 2 : 3)
    }
    await page.getByLabel('Ajouter Photo d’identité', { exact: true }).setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: photo })
    await page.getByRole('button', { name: 'Envoyer l’original', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Retirer', exact: true })).toHaveCount(4)
    await page.locator('#admission-phone').fill('0612345679')
    await page.getByRole('button', { name: 'Enregistrer le brouillon', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Enregistrer le brouillon', exact: true })).toBeDisabled()
    await page.screenshot({ path: 'test-results/tafem-candidate-desktop.png', fullPage: true })
    await page.getByRole('button', { name: 'Soumettre le dossier', exact: true }).click()
    await expect(page.getByText('Soumis', { exact: true })).toBeVisible()
    expect((await page.request.post('/api/v1/auth/logout')).status()).toBe(200)
    expect((await page.request.post('/api/v1/auth/login', { data: { email: 'e2e.admissions.admin@example.test', password: 'TestOnlyPassword123!' } })).status()).toBe(200)
    await page.goto('/admin/tafem')
    await expect(page.getByTestId('admin-tafem-page')).toBeVisible()
    await page.getByRole('button', { name: 'Ouvrir', exact: true }).first().click()
    await expect(page.getByRole('heading', { name: 'Candidate Synthetic', exact: true })).toBeVisible()
    for (const label of ['Baccalauréat', 'CNIE · recto et verso', 'Relevé de notes', 'Photo d’identité']) {
      await page.getByRole('button', { name: new RegExp(`^${label}`) }).click()
      await page.getByRole('button', { name: 'Vérifier cette version', exact: true }).click()
      await expect(page.getByRole('button', { name: `${label} · ✓`, exact: true })).toBeVisible()
    }
    await page.screenshot({ path: 'test-results/tafem-admin-desktop.png', fullPage: true })
    await page.getByText('Validation physique et inscription définitive', { exact: true }).click()
    for (const label of ['Bac original reçu', 'Relevé reçu', 'Copie CNIE reçue', 'Photos reçues']) await page.getByLabel(label, { exact: true }).check()
    await page.getByLabel('Numéro APOGEE officiel', { exact: true }).fill('E2E-OFFICIAL-001')
    await page.getByRole('button', { name: 'Valider l’inscription définitive', exact: true }).click()
    await expect(page.getByText(/Inscription validée/).last()).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: 'test-results/tafem-admin-mobile.png', fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  })
})
