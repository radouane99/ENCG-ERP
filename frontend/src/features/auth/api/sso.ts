import api from '@shared/lib/api'

export type SsoProvider = {
  id: 'google' | 'microsoft' | 'oidc' | string
  label: string
  redirect: string
}

export async function fetchSsoProviders(): Promise<SsoProvider[]> {
  const res = await api.get('/v1/auth/sso/providers')
  return res.data?.data?.providers ?? []
}
