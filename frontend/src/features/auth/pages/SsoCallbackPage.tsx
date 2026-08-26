import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'
import LoadingScreen from '@shared/components/ui/LoadingScreen'

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
        await api.post('/v1/auth/sso/exchange', { code })
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
