import api from '@shared/lib/api'

export type SsoProvider = {
  id: 'google' | 'github' | 'microsoft' | 'oidc' | string
  label: string
  redirect: string
  configured?: boolean
}

export const DEFAULT_SSO_PROVIDERS: SsoProvider[] = [
  {
    id: 'google',
    label: 'Google',
    redirect: '/api/v1/auth/sso/google/redirect',
    configured: false,
  },
  {
    id: 'github',
    label: 'GitHub',
    redirect: '/api/v1/auth/sso/github/redirect',
    configured: false,
  },
  {
    id: 'microsoft',
    label: 'Microsoft 365',
    redirect: '/api/v1/auth/sso/microsoft/redirect',
    configured: false,
  },
]

export async function fetchSsoProviders(): Promise<SsoProvider[]> {
  try {
    const res = await api.get('/v1/auth/sso/providers')
    const enabled: SsoProvider[] = res.data?.data?.providers ?? []
    const catalog: SsoProvider[] = res.data?.data?.catalog ?? []

    const enabledIds = new Set(enabled.map((p) => p.id))
    const mergedMap = new Map<string, SsoProvider>()

    for (const def of DEFAULT_SSO_PROVIDERS) {
      mergedMap.set(def.id, { ...def, configured: enabledIds.has(def.id) })
    }

    for (const item of catalog) {
      if (item.id === 'oidc' && !item.configured && !enabledIds.has('oidc')) {
        continue
      }
      const existing = mergedMap.get(item.id)
      mergedMap.set(item.id, {
        id: item.id,
        label: existing?.label || item.label,
        redirect: item.redirect || existing?.redirect || `/api/v1/auth/sso/${item.id}/redirect`,
        configured: Boolean(item.configured || enabledIds.has(item.id)),
      })
    }

    for (const item of enabled) {
      const existing = mergedMap.get(item.id)
      mergedMap.set(item.id, {
        id: item.id,
        label: existing?.label || item.label,
        redirect: item.redirect,
        configured: true,
      })
    }

    return Array.from(mergedMap.values())
  } catch {
    return DEFAULT_SSO_PROVIDERS
  }
}

export function buildSsoRedirectUrl(redirectPath: string, remember?: boolean): string {
  if (!remember) {
    return redirectPath
  }
  const separator = redirectPath.includes('?') ? '&' : '?'
  return `${redirectPath}${separator}remember=1`
}
