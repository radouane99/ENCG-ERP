import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'
import LoadingScreen from '@shared/components/ui/LoadingScreen'

export default function GoogleAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const completeSession = useAuthStore((s) => s.completeSession)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      navigate('/login?error=google', { replace: true })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await api.post('/v1/auth/google/exchange', { code })
        const token = res.data?.data?.token as string | undefined
        if (!token) {
          throw new Error('missing token')
        }
        await completeSession(token)
        if (!cancelled) {
          navigate('/dashboard', { replace: true })
        }
      } catch {
        if (!cancelled) {
          setError('Connexion Google impossible.')
          navigate('/login?error=google', { replace: true })
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
