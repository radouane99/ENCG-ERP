import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
test.describe('État des formulaires et synchronisation', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Réponses synthétiques uniquement')
  test('un pointage refusé reste local puis peut être retransmis', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'admin')
    await page.addInitScript(() => sessionStorage.setItem('offline_scans_queue', JSON.stringify([{ qrToken: 'SYN-OK', status: 'present' }, { qrToken: 'SYN-RETRY', status: 'late' }])))
    let allowRetry = false; const calls: string[] = []
    await page.route(url => url.pathname.startsWith('/api/convocations/update-attendance/'), route => {
      const token = new URL(route.request().url()).pathname.split('/').at(-1)!; calls.push(token)
      return route.fulfill({ ...json({ success: token === 'SYN-OK' || allowRetry }), status: token === 'SYN-RETRY' && !allowRetry ? 409 : 200 })
    })
    await page.goto('/admin/exams/scan'); await expect(page.getByRole('heading').first()).toBeVisible()
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(() => calls.length).toBe(2)
    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('offline_scans_queue') || '[]'))).toEqual([{ qrToken: 'SYN-RETRY', status: 'late' }])
    await expect(page.getByText('1 pointage(s) non transmis : conservés pour une prochaine tentative.', { exact: true })).toBeVisible()
    allowRetry = true; await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('offline_scans_queue') || '[]'))).toEqual([])
    expect(calls).toEqual(['SYN-OK', 'SYN-RETRY', 'SYN-RETRY'])
  })
  test('le rafraîchissement du dossier ne remplace pas les coordonnées en cours de saisie', async ({ page }) => {
    await page.clock.install(); await mockApi(page); await seedSession(page, 'student')
    let reads = 0
    await page.route(url => url.pathname === '/api/student-portal/reinscription/status', route => {
      reads++
      return route.fulfill(json({ data: { student_name: 'Étudiant synthétique', cne: 'SYN-CONTACT', academic_year: '2026/2027', current_filiere: 'Formation initiale', phone: reads > 1 ? '0600000002' : '0600000001', city: 'Fès', address: 'Adresse synthétique', is_admis: true, can_confirm: true, is_confirmed: false, payment_required: false, target_semester: 3 } }))
    })
    await page.goto('/student/reinscription'); const phone = page.getByLabel('Téléphone', { exact: true })
    await expect(phone).toHaveValue('0600000001'); await phone.fill('0612345678')
    await page.clock.fastForward(6 * 60 * 1000)
    await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
    await expect.poll(() => reads).toBeGreaterThan(1)
    await expect(phone).toHaveValue('0612345678')
  })
})
