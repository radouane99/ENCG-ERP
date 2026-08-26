import type { Page, Route } from '@playwright/test'

const studentUser = {
  id: 2,
  name: 'Étudiant Démo',
  email: 'student@encg-fes.ma',
  roles: ['student'],
  permissions: [],
  institution_id: 1,
  institution_name: 'ENCG Fès',
  two_factor_enabled: false,
  locale: 'fr',
}

const adminUser = {
  ...studentUser,
  id: 1,
  name: 'Admin Démo',
  email: 'admin@encg-fes.ma',
  roles: ['institution-admin'],
}

export async function mockApi(page: Page) {
  await page.route((url) => {
    const href = url.href
    if (href.includes('/src/') || href.includes('node_modules') || /\.(tsx?|jsx?|css|map)(\?|$)/.test(href)) {
      return false
    }
    return href.includes('/api/') || href.includes('/v1/auth')
  }, async (route: Route) => {
    const request = route.request()
    const resourceType = request.resourceType()
    if (resourceType === 'script' || resourceType === 'stylesheet' || resourceType === 'image' || resourceType === 'font') {
      return route.continue()
    }
    const url = request.url()
    const method = request.method()

    if (url.includes('/v1/auth/login') && method === 'POST') {
      const body = request.postDataJSON() as { email?: string }
      const user = body?.email?.includes('admin') ? adminUser : studentUser
      const token = user.roles.includes('institution-admin') ? 'e2e-token-admin' : 'e2e-token-student'
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Set-Cookie': `encg_auth_token=${token}; Path=/; SameSite=Lax`,
        },
        body: JSON.stringify({ success: true, data: { token, user, requires_two_factor: false } }),
      })
    }

    if (url.includes('/auth/me')) {
      const cookie = request.headers()['cookie'] ?? ''
      const auth = request.headers()['authorization'] ?? ''
      const hasSession = cookie.includes('encg_auth_token') || auth.includes('e2e-token')
      if (!hasSession) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthenticated' }),
        })
      }
      const user = cookie.includes('admin') || auth.includes('admin') ? adminUser : studentUser
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: user }),
      })
    }

    if (url.includes('/dashboard/student/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            gpa: 12.5,
            classes_today: 0,
            absences: { total: 0, justified: 0, unjustified: 0 },
            upcoming_exams: 0,
            upcoming_classes: [],
            recent_documents: [],
          },
        }),
      })
    }

    if (url.includes('/student-portal/grades')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall_average: 14.5,
          data: [{ module_name: 'Comptabilité Générale', module_code: 'CG-S1', moyenne_finale: 14.5, decision_finale: 'V' }],
        }),
      })
    }

    if (url.includes('/verify/pv/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            document_type: 'PV de délibération',
            module: 'Comptabilité Générale',
            group: 'G1',
            filiere: 'Finance',
            signed_by: 'Chef de filière',
            ip_address: '127.0.0.1',
          },
        }),
      })
    }

    if (url.includes('/student-portal/document-requests') || url.includes('/dashboard/document-types') || url.includes('/admin/document-requests')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], stats: { pending: 0, approved: 0, rejected: 0 } }),
      })
    }

    if (url.includes('/admin/admissions/tafem-stats') || url.includes('/admin/tafem')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stats: { total_candidates: '12', total_capacity: '100', repartition_percentage: '12%' }, amphis: [] }),
      })
    }

    if (url.includes('/v1/privacy/')) {
      return route.fulfill({
        status: method === 'POST' ? 202 : 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: method === 'POST' ? { id: 1, status: 'pending' } : [] }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    })
  })
}

export async function seedSession(page: Page, role: 'student' | 'admin') {
  const token = role === 'admin' ? 'e2e-token-admin' : 'e2e-token-student'
  const cookie = {
    name: 'encg_auth_token',
    value: token,
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax' as const,
  }
  await page.context().addCookies([
    { ...cookie, domain: '127.0.0.1' },
    { ...cookie, domain: 'localhost' },
  ])
}
