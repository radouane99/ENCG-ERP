import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'

type Session = { id: number; created_at: string; last_used_at: string | null; expires_at: string | null; is_current: boolean }
const date = (value: string | null) => value ? new Date(value).toLocaleString('fr-FR') : 'Non disponible'

export function SessionManager() {
  const userId = useAuthStore(state => state.user?.id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['account-sessions', userId], queryFn: async () => (await api.get('/v1/auth/sessions')).data.data as Session[], staleTime: 0 })
  const revoke = async (id: number | 'others') => {
    setBusy(true); setError('')
    try { await api.delete(`/v1/auth/sessions/${id}`); await refetch() }
    catch { setError('Impossible de fermer cette session. Réessayez.') }
    finally { setBusy(false) }
  }
  return <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
    <h2 className="text-xl font-semibold">Sessions de votre compte</h2>
    <p className="text-sm text-muted-foreground">Fermez les accès que vous ne reconnaissez pas. La session actuelle reste ouverte.</p>
    {isLoading && <p role="status">Chargement des sessions…</p>}
    {(isError || error) && <p role="alert" className="text-destructive">{error || 'Impossible de charger les sessions.'}</p>}
    {data?.map(session => <div key={session.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
      <div><h3 className="font-medium">{session.is_current ? 'Session actuelle' : `Session ${session.id}`}</h3><p className="text-sm text-muted-foreground">Ouverte : {date(session.created_at)} · Dernier accès : {date(session.last_used_at)}</p><p className="text-sm text-muted-foreground">Expiration : {date(session.expires_at)}</p></div>
      {!session.is_current && <button disabled={busy} onClick={() => revoke(session.id)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50">Déconnecter</button>}
    </div>)}
    {data?.length === 0 && <p>Aucune session active répertoriée.</p>}
    <button disabled={busy || !data?.some(session => !session.is_current)} onClick={() => revoke('others')} className="rounded-xl bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Déconnecter toutes les autres sessions</button>
  </section>
}
