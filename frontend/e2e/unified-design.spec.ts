import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'

async function prepare(page: Page, role: 'admin' | 'student' | 'professor', dark: boolean) {
  await mockApi(page); await seedSession(page, role === 'admin' ? 'admin' : 'student')
  await page.addInitScript(value => localStorage.setItem('encg-ui-theme', value), dark ? 'dark' : 'light')
  if (role === 'professor') {
    await page.route(url => url.pathname.endsWith('/auth/me'), route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 5, name: 'Enseignant synthétique', roles: ['professor'], institution_id: 1, permissions: [], locale: 'fr' } }) }))
    await page.route(url => url.pathname === '/api/professor-portal/student-rosters', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Données synthétiques indisponibles' }) }))
  }
}

test.describe('Design commun ENCG', () => {
  test.skip(!process.env.E2E_ROLE_AUDIT, 'Données synthétiques uniquement')
  for (const dark of [false, true]) for (const mobile of [false, true]) for (const role of ['admin', 'student', 'professor'] as const) {
    test(`${role} · ${dark ? 'sombre' : 'clair'} · ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      await prepare(page, role, dark)
      await page.goto(role === 'admin' ? '/admin/exams' : role === 'student' ? '/student/grades' : '/professor/student-rosters')
      const workspace = page.locator('[data-design-system="encg"]')
      await expect(workspace).toBeVisible()
      const title = workspace.locator('h1').first()
      await expect(title).toBeVisible()
      await expect(title).toHaveClass(/erp-page-title/)
      const typography = await title.evaluate(element => { const css = getComputedStyle(element); return { size: parseFloat(css.fontSize), weight: css.fontWeight, font: css.fontFamily } })
      expect(typography.size).toBeGreaterThanOrEqual(22)
      expect(typography.size).toBeLessThanOrEqual(28)
      expect(typography.weight).toBe('700')
      expect(typography.font).toContain('Inter')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (role === 'admin') await expect(workspace.locator('.erp-page-banner').first()).toBeVisible()
      await page.screenshot({ path: `test-results/design-${role}-${dark ? 'dark' : 'light'}-${mobile ? 'mobile' : 'desktop'}.png` })
    })
  }

  for (const dark of [false, true]) test(`contrastes des tokens · ${dark ? 'sombre' : 'clair'}`, async ({ page }) => {
    await prepare(page, 'admin', dark)
    await page.goto('/exams')
    await expect(page.locator('[data-design-system="encg"]')).toBeVisible()
    const ratios = await page.evaluate(() => {
      const sample = document.createElement('div'); document.body.append(sample)
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
      const context = canvas.getContext('2d')!
      function luminance(color: string) {
        context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1)
        const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
      }
      const results = ['primary', 'success', 'warning', 'destructive', 'accent'].map(name => {
        sample.style.backgroundColor = `var(--${name})`; sample.style.color = `var(--${name}-foreground)`
        const css = getComputedStyle(sample); const a = luminance(css.color); const b = luminance(css.backgroundColor)
        return { name, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
      })
      sample.remove(); return results
    })
    for (const pair of ratios) expect(pair.ratio, pair.name).toBeGreaterThanOrEqual(4.5)
  })

  test('les champs natifs gardent une géométrie commune en RTL', async ({ page }) => {
    await prepare(page, 'admin', false)
    await page.goto('/exams')
    await expect(page.locator('[data-design-system="encg"]')).toBeVisible()
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl'
      const wrapper = document.createElement('div'); wrapper.id = 'design-controls'
      wrapper.innerHTML = '<label>Champ<input type="text"></label><label>Choix<select><option>Option</option></select></label>'
      document.querySelector('[data-design-system="encg"]')!.append(wrapper)
    })
    const geometry = await page.locator('#design-controls').evaluate(element => [...element.querySelectorAll('input,select')].map(field => { const css = getComputedStyle(field); return { radius: css.borderRadius, height: parseFloat(css.minHeight), direction: css.direction } }))
    expect(geometry[0].radius).toBe(geometry[1].radius)
    for (const field of geometry) { expect(field.height).toBeGreaterThanOrEqual(44); expect(field.direction).toBe('rtl') }
  })
})
