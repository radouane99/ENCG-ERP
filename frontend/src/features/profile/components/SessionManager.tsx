import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Laptop, ShieldCheck, Clock, Globe, KeyRound, Trash2 } from 'lucide-react'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'

type Session = {
  id: number
  name?: string
  session_type?: 'remember_30d' | 'standard_8h' | string
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  is_current: boolean
}

type SecurityEvent = {
  id: string
  method: string
  device: string
  user_agent: string
  ip_address: string
  remember: boolean
  session_duration: string
  logged_in_at: string
}

const date = (value: string | null) => (value ? new Date(value).toLocaleString('fr-FR') : 'Non disponible')

const formatMethod = (method: string) => {
  if (method === 'email_otp') return 'Code OTP Email (Sans mot de passe)'
  if (method === 'two_factor') return 'Double Facteur (2FA TOTP)'
  if (method.startsWith('sso_')) return `SSO / OAuth (${method.replace('sso_', '').toUpperCase()})`
  return 'Mot de passe / Identifiant'
}

export function SessionManager() {
  const userId = useAuthStore((state) => state.user?.id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const { data: payload, isLoading, isError, refetch } = useQuery({
    queryKey: ['account-sessions', userId],
    queryFn: async () => {
      const res = await api.get('/v1/auth/sessions')
      return {
        sessions: (res.data?.data ?? []) as Session[],
        history: (res.data?.security_history ?? []) as SecurityEvent[],
      }
    },
    staleTime: 0,
  })

  const data = payload?.sessions
  const securityHistory = payload?.history ?? []

  const revoke = async (id: number | 'others') => {
    setBusy(true)
    setError('')
    try {
      await api.delete(`/v1/auth/sessions/${id}`)
      await refetch()
    } catch {
      setError('Impossible de fermer cette session. Réessayez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Laptop className="w-5 h-5 text-primary" />
              Sessions de votre compte
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Fermez les accès que vous ne reconnaissez pas. La session actuelle reste ouverte.
            </p>
          </div>
          <button
            disabled={busy || !data?.some((session) => !session.is_current)}
            onClick={() => revoke('others')}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            Déconnecter toutes les autres sessions
          </button>
        </div>

        {isLoading && <p role="status">Chargement des sessions…</p>}
        {(isError || error) && (
          <p role="alert" className="text-destructive">
            {error || 'Impossible de charger les sessions.'}
          </p>
        )}

        <div className="space-y-3">
          {data?.map((session) => {
            const isRemember = session.session_type === 'remember_30d' || session.name === 'auth-token-remember'
            return (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4 bg-background/50"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sm">
                      {session.is_current ? 'Session actuelle' : `Session #${session.id}`}
                    </h3>
                    {session.is_current && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Cet appareil
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {isRemember ? 'Se souvenir de moi • 30 Jours' : 'Standard • 8 Heures'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ouverte : {date(session.created_at)} · Dernier accès : {date(session.last_used_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expiration : {date(session.expires_at)}
                  </p>
                </div>
                {!session.is_current && (
                  <button
                    disabled={busy}
                    onClick={() => revoke(session.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Déconnecter
                  </button>
                )}
              </div>
            )
          })}
          {data?.length === 0 && <p className="text-sm text-muted-foreground">Aucune session active répertoriée.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Journal de Sécurité Personnel (Transparence CNDP Loi 09-08)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Historique de vos dernières authentifications (Mot de passe, Code OTP Email, Google, GitHub, Microsoft ou 2FA).
          </p>
        </div>

        {securityHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">
            Les prochains événements de connexion sur votre compte apparaîtront ici avec l&apos;adresse IP et la méthode utilisée.
          </p>
        ) : (
          <div className="space-y-2.5">
            {securityHistory.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border bg-muted/30 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    <span>{formatMethod(evt.method)}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {evt.session_duration}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" /> IP : {evt.ip_address}
                    </span>
                    <span>•</span>
                    <span>{evt.device}</span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {date(evt.logged_in_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
