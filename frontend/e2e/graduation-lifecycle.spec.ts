import { test, expect } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

test.describe('Registre des lauréats', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Jeux synthétiques uniquement.')
  for (const mobile of [false, true]) test(`PV annuel vers registre — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await mockApi(page); await seedSession(page, 'admin')
    let graduated = false
    const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(data) })
    await page.route(url => url.pathname === '/api/alumni/dashboard-stats', r => r.fulfill(json({ data: { employment_rate: 0, avg_starting_salary: 0, avg_months_to_hire: 0, total_responses: 0, status_distribution: [], sector_distribution: [], top_companies: [] } })))
    await page.route(url => url.pathname === '/api/alumni/graduation-candidates', r => r.fulfill(json({ data: graduated ? [] : [{ decision_id: 9, name: 'Lauréat synthétique', filiere: 'Master université', academic_year: '2026/2027', decision: 'admitted' }], last_page: 1 })))
    await page.route(url => url.pathname === '/api/alumni/graduates', r => r.fulfill(json({ data: graduated ? [{ id: 2, name: 'Lauréat synthétique', cne: 'SYN-MASTER', filiere: 'Master université', academic_year: '2026/2027' }] : [], total: graduated ? 1 : 0, last_page: 1 })))
    await page.route(url => url.pathname === '/api/alumni/graduates/finalize', r => { expect(r.request().postDataJSON()).toEqual({ decision_id: 9 }); graduated = true; return r.fulfill(json({ message: 'Diplomation enregistrée' })) })
    await page.goto('/alumni/dashboard')
    await expect(page.getByRole('heading', { name: 'Registre des lauréats' })).toBeVisible()
    await page.getByText('Diplomations à finaliser après le jury', { exact: true }).click()
    await page.getByRole('button', { name: 'Finaliser la diplomation', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(graduated).toBe(false)
    await page.getByRole('button', { name: 'Confirmer la diplomation', exact: true }).click()
    await expect(page.getByText('SYN-MASTER', { exact: true })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    await page.screenshot({ path: `test-results/graduation-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })
  test('le lauréat voit son cursus terminé sans formulaire de réinscription', async ({ page }) => {
    await mockApi(page); await seedSession(page, 'student')
    await page.route(url => url.pathname === '/api/student-portal/reinscription/status', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {
      student_name: 'Lauréat synthétique', academic_year: '2026/2027', cne: 'SYN-MASTER', current_filiere: 'Master université',
      is_graduated: true, is_admis: false, is_confirmed: false, can_confirm: false, payment_required: false,
      blocking_reason: 'Votre cursus est terminé. Vous figurez parmi les lauréats.',
    } }) }))
    await page.goto('/student/reinscription')
    await expect(page.getByRole('heading', { name: 'Mon parcours diplômé' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmer ma réinscription' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Votre parcours est conservé' })).toBeVisible()
  })
})
