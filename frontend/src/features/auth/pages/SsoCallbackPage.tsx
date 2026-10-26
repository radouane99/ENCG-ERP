import { useEffect,useState } from 'react'
import { useNavigate,useSearchParams } from 'react-router-dom'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'
import LoadingScreen from '@shared/components/ui/LoadingScreen'

const exchanges = new Map<string, Promise<any>>()

export default function SsoCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const completeSession = useAuthStore((s) => s.completeSession)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      navigate('/login?error=sso', { replace: true })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        if (!exchanges.has(code)) exchanges.set(code, api.post('/v1/auth/sso/exchange', { code }).finally(() => setTimeout(() => exchanges.delete(code), 0)))
        const response = await exchanges.get(code)!
        if (cancelled) return
        if (response.data?.data?.requires_two_factor) {
          useAuthStore.getState().beginTwoFactor(response.data.data.two_factor_challenge_token)
          navigate('/two-factor', { replace: true }); return
        }
        await completeSession()
        if (!cancelled) {
          navigate('/dashboard', { replace: true })
        }
      } catch {
        if (!cancelled) {
          setError('Connexion SSO impossible.')
          navigate('/login?error=sso', { replace: true })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, completeSession, navigate])

  if (error) {
    return null
  }

  return <LoadingScreen />
}
