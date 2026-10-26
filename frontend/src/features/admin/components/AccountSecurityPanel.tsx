import { useState } from 'react'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'
import { useQuery } from '@tanstack/react-query'

const operationLabels: Record<string, string> = { suspend: 'Suspension du compte', reactivate: 'Réactivation du compte', revoke_sessions: 'Fermeture des sessions', require_2fa: 'Activation de la politique 2FA', recover_2fa: 'Récupération du second facteur', password_reset_link: 'Envoi du lien de réinitialisation' }

export function AccountSecurityPanel({ userId, initialOperation = 'revoke_sessions', onChanged }: { userId: string | number; initialOperation?: string; onChanged: () => void }) {
  const actor = useAuthStore(state => state.user)
  const [operation, setOperation] = useState(initialOperation)
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const allowed = actor?.permissions.includes('users.manage') || actor?.roles.some(role => ['super-admin', 'super_admin'].includes(role))
  const history = useQuery({ queryKey: ['account-security-history', userId], enabled: !!allowed, queryFn: async () => (await api.get(`/users/${userId}/security`)).data.data as { id: number; created_at: string; actor_id: number; details: { operation: string; reason: string; revoked_sessions: number } }[] })
  if (!allowed || String(actor?.id) === String(userId)) return null
  return <form className="rounded-2xl border border-border bg-card p-6 space-y-4" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      await api.post(`/users/${userId}/security`, { operation, reason, password, code: code || undefined, identity_verified: verified })
      setPassword(''); setCode(''); setVerified(false); setMessage('Opération enregistrée ; les sessions du compte sont fermées.'); void history.refetch(); onChanged()
    } catch (failure: any) { setError(failure.response?.data?.message || 'Opération indisponible. Aucune réussite confirmée.') }
    finally { setBusy(false) }
  }}>
    <h3 className="text-lg font-semibold">Intervention de sécurité</h3>
    <p className="text-sm text-muted-foreground">Chaque intervention ferme les sessions du compte et conserve son motif dans le journal d’audit. Confirmez avec votre propre mot de passe.</p>
    <label className="block text-sm">Action<select value={operation} onChange={event => { setOperation(event.target.value); setVerified(false); setMessage('') }} className="block w-full rounded-xl border border-input bg-background p-3">
      <option value="revoke_sessions">Fermer toutes les sessions</option><option value="suspend">Suspendre le compte</option><option value="reactivate">Réactiver le compte</option><option value="require_2fa">Exiger la 2FA à la prochaine connexion</option><option value="recover_2fa">Récupérer l’accès après perte du second facteur</option><option value="password_reset_link">Envoyer un lien de réinitialisation du mot de passe</option>
    </select></label>
    {operation === 'recover_2fa' && <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3"><p className="text-sm">Vérifiez l’identité selon la procédure de l’établissement. L’ancien second facteur sera supprimé ; le compte devra changer de mot de passe et configurer à nouveau la 2FA.</p><label className="flex gap-2 text-sm"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} required />Identité vérifiée ; référence du contrôle précisée dans le motif.</label></div>}
    <label className="block text-sm">Motif et référence du contrôle<textarea required minLength={10} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} className="block w-full rounded-xl border border-input bg-background p-3" /></label>
    <label className="block text-sm">Votre mot de passe actuel<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="block w-full rounded-xl border border-input bg-background p-3" /></label>
    {actor?.two_factor_enabled && <label className="block text-sm">Votre code 2FA<input required autoComplete="one-time-code" maxLength={32} value={code} onChange={event => setCode(event.target.value)} className="block w-full rounded-xl border border-input bg-background p-3" /></label>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    <button disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Application…' : 'Appliquer la mesure de sécurité'}</button>
    <div className="border-t border-border pt-4 space-y-3"><h4 className="font-semibold">Dernières interventions</h4>{history.isError && <p className="text-sm text-destructive">Historique indisponible.</p>}{history.data?.map(event => <div key={event.id} className="rounded-xl border border-border p-3 text-sm"><p className="font-medium">{operationLabels[event.details.operation] || 'Intervention de sécurité'} · {new Date(event.created_at).toLocaleString('fr-FR')}</p><p>{event.details.reason}</p><p className="text-muted-foreground">Agent #{event.actor_id} · {event.details.revoked_sessions} session(s) fermée(s)</p></div>)}{history.data?.length === 0 && <p className="text-sm text-muted-foreground">Aucune intervention enregistrée.</p>}</div>
  </form>
}
