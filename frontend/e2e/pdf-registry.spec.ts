import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mockApi, seedSession } from './helpers'

const bytes = Buffer.from('%PDF-1.4\nDOCUMENT SYNTHETIQUE\n%%EOF')
const identifier = '202610250000000123'
const token = 'DOC-demonstration-synthetique'
const record = { id: 123, registry_document: true, digital_identifier: identifier, verification_token: token, document_type: 'Attestation synthétique', document_label: 'Attestation synthétique', status: 'issued', issued_at: '2026-10-25T12:00:00Z', page_count: 1, file_sha256: createHash('sha256').update(bytes).digest('hex'), message: 'Référence enregistrée.' }
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })

test.describe('Registre PDF', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'API synthétique isolée')

  test('comparaison locale du fichier original puis modifié', async ({ page }) => {
    await mockApi(page)
    let uploads = 0
    page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/verify/')) uploads++ })
    await page.route(url => url.pathname === `/api/verify/document/${token}`, route => route.fulfill(json({ data: record })))
    await page.goto(`/verify/document/${token}`)
    await expect(page.getByText(identifier, { exact: true })).toBeVisible()
    const input = page.getByLabel('Comparer mon fichier PDF avec l’archive')
    await input.setInputFiles({ name: 'original.pdf', mimeType: 'application/pdf', buffer: bytes })
    await expect(page.getByText('Le fichier correspond exactement au PDF archivé.')).toBeVisible()
    await input.setInputFiles({ name: 'modifie.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([bytes, Buffer.from('MODIFICATION')]) })
    await expect(page.getByRole('alert')).toContainText('ne correspond pas')
    expect(uploads).toBe(0)
    await page.screenshot({ path: 'test-results/pdf-verification.png', fullPage: true })
  })

  test('référence retirée sans comparaison ni empreinte publique', async ({ page }) => {
    await mockApi(page)
    await page.route(url => url.pathname === `/api/verify/document/${token}`, route => route.fulfill(json({ data: { ...record, status: 'revoked', file_sha256: null, message: 'Référence retirée.' } })))
    await page.goto(`/verify/document/${token}`)
    await expect(page.getByRole('heading', { name: 'Document retiré' })).toBeVisible()
    await expect(page.locator('input[type=file]')).toHaveCount(0)
  })

  test('recherche précise et retrait confirmé après un refus serveur', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'admin')
    let searched = ''; let allow = false; let removed = false
    await page.route(url => url.pathname === '/api/documents/registry', route => {
      searched = new URL(route.request().url()).searchParams.get('identifier') || ''
      return route.fulfill(json({ data: [{ ...record, status: removed ? 'revoked' : 'issued' }], current_page: 1, last_page: 1, total: 1 }))
    })
    await page.route(url => url.pathname === '/api/documents/registry/123/revoke', route => {
      expect(route.request().postDataJSON().reason).toBe('Erreur dans la version émise.')
      if (!allow) return route.fulfill({ ...json({ message: 'Retrait refusé par le serveur.' }), status: 409 })
      removed = true
      return route.fulfill(json({ message: 'Retrait enregistré.' }))
    })
    await page.goto('/admin/document-registry')
    await page.getByLabel('Identifiant numérique', { exact: true }).fill(identifier)
    await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
    await expect.poll(() => searched).toBe(identifier)
    await page.getByRole('button', { name: 'Retirer', exact: true }).click()
    await page.getByLabel('Motif du retrait').fill('Erreur dans la version émise.')
    await page.getByRole('button', { name: 'Confirmer le retrait' }).click()
    await expect(page.getByText('Retrait refusé par le serveur.', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Motif du retrait')).toHaveValue('Erreur dans la version émise.')
    allow = true
    await page.getByRole('button', { name: 'Confirmer le retrait' }).click()
    await expect(page.getByRole('button', { name: 'Retirer', exact: true })).toHaveCount(0)
    expect(removed).toBe(true)
  })
})
