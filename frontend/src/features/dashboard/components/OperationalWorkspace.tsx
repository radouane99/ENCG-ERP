import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import { useAuthStore } from '@/stores/authStore'

interface FollowupRequest { id: number; label: string; person: string; status: string; due_at: string | null; assigned_to: number | null; revision: number; overdue: boolean }
interface Agent { id: number; name: string }
interface Workspace { staff: boolean; tasks: { label: string; count: number; url: string }[]; requests: FollowupRequest[]; agents?: Agent[]; quality?: { duplicate_cne_groups: number; missing_cne: number; registrations_without_group: number | null; academic_year: string | null; duplicate_cne_samples?: { cne: string; count: number }[]; missing_cne_ids?: number[] }; backup?: { created_at?: string; restore_verified?: boolean; restored_at?: string; error?: string } | null; notification_activity?: { id: string; notifiable_id: number; data: { title?: string }; read_at: string | null }[]; transport_logs?: { id: number; type: string; recipient: string; status: string }[] }

function FollowupForm({ row, agents }: { row: FollowupRequest; agents: Agent[] }) {
  const client = useQueryClient()
  const [agent, setAgent] = useState(String(row.assigned_to || ''))
  const [due, setDue] = useState('')
  const [reason, setReason] = useState('')
  const save = useMutation({ mutationFn: () => api.patch(`/workspace/requests/${row.id}/followup`, { assigned_to: agent ? Number(agent) : null, due_at: due ? new Date(due).toISOString() : null, revision: row.revision, reason }),
    onSuccess: () => { toast.success('Suivi enregistré.'); void client.invalidateQueries({ queryKey: ['operational-workspace'] }) },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Suivi non enregistré.') })
  return <form onSubmit={event => { event.preventDefault(); if (!save.isPending) save.mutate() }} className="grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-2">
    <p className="sm:col-span-2 font-medium">Demande #{row.id} · {row.person} · {row.label}</p>
    <p className="sm:col-span-2 text-sm text-muted-foreground">Échéance actuelle : {row.due_at ? new Date(row.due_at).toLocaleString('fr-FR') : 'Non définie'}{row.overdue ? ' · En retard' : ''}. Choisir une nouvelle échéance ou laisser vide pour la retirer.</p>
    <label className="text-sm">Responsable<select aria-label={`Responsable demande ${row.id}`} value={agent} onChange={event => setAgent(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2"><option value="">Non affectée</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
    <label className="text-sm">Nouvelle échéance<input aria-label={`Échéance demande ${row.id}`} type="datetime-local" value={due} onChange={event => setDue(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2" /></label>
    <label className="sm:col-span-2 text-sm">Motif du changement<input aria-label={`Motif demande ${row.id}`} required minLength={10} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2" /></label>
    <button disabled={save.isPending || reason.trim().length < 10} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{save.isPending ? 'Enregistrement…' : 'Enregistrer le suivi'}</button>
  </form>
}

export default function OperationalWorkspace() {
  const user = useAuthStore(state => state.user)
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['operational-workspace', user?.id], queryFn: async () => (await api.get<{ data: Workspace }>('/workspace/today')).data.data, refetchInterval: 60000, enabled: !!user })
  if (data && !data.staff && data.requests.length === 0) return null
  return <section aria-label="Mon travail à suivre" className="m-4 space-y-4 rounded-2xl border bg-card p-4 md:m-6 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">{data && !data.staff ? 'Suivi de mes demandes' : 'Mon travail à suivre'}</h2><p className="text-sm text-muted-foreground">Demandes, échéances et alertes de votre espace.</p></div><button type="button" onClick={() => void refetch()} className="rounded-lg border px-3 py-2 text-sm">Actualiser les tâches</button></div>
    {isPending && <p role="status">Chargement des tâches…</p>}
    {isError && <p role="alert">Le suivi est indisponible. Réessayez avec Actualiser les tâches.</p>}
    {data && <>
      {data.staff && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{data.tasks.map(task => <Link key={task.label} to={task.url} className="rounded-xl border p-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"><span className="block text-sm text-muted-foreground">{task.label}</span><strong className="text-2xl">{task.count}</strong></Link>)}</div>}
      {data.requests.length > 0 && <details><summary className="cursor-pointer py-2 font-medium">Suivi des demandes · {data.requests.length} dernières</summary><div className="mt-3 space-y-3">{data.requests.map(row => data.staff && ['pending', 'processing'].includes(row.status) ? <FollowupForm key={`${row.id}:${row.revision}`} row={row} agents={data.agents || []} /> : <div key={row.id} className="rounded-xl border p-3 text-sm">#{row.id} · {row.label} · {row.status}{row.due_at && <> · Échéance : {new Date(row.due_at).toLocaleString('fr-FR')}</>}{row.overdue && ' · En retard'}</div>)}</div></details>}
      {data.quality && <details><summary className="cursor-pointer py-2 font-medium">Qualité des données · {data.quality.academic_year || 'Aucune année courante'}</summary><ul className="list-disc space-y-1 pl-5 text-sm"><li>{data.quality.duplicate_cne_groups} groupes de CNE potentiellement dupliqués</li><li>{data.quality.missing_cne} profils sans CNE</li><li>{data.quality.registrations_without_group ?? 'Non calculable sans année courante'} inscriptions validées sans groupe</li></ul><div className="mt-2 flex flex-wrap gap-2">{data.quality.missing_cne_ids?.map(id => <Link key={id} to={`/students/${id}`} className="text-sm text-primary underline">Dossier #{id}</Link>)}</div>{data.quality.duplicate_cne_samples?.map(row => <p key={row.cne} className="text-sm">CNE {row.cne} · {row.count} profils à vérifier</p>)}<Link to="/students" className="mt-2 inline-block text-sm text-primary underline">Vérifier les dossiers étudiants</Link><p className="text-xs text-muted-foreground">Détection uniquement. Vérifier le dossier avant toute correction; aucune fusion automatique.</p></details>}
      {data.staff && <details><summary className="cursor-pointer py-2 font-medium">Sauvegarde et restauration</summary>{data.backup?.error ? <p role="alert">{data.backup.error}</p> : data.backup?.created_at ? <p className="text-sm">Dernière archive : {new Date(data.backup.created_at).toLocaleString('fr-FR')} · {data.backup.restore_verified ? 'Restauration vérifiée sur une base isolée' : 'Restauration de cette archive à vérifier'}</p> : <p className="text-sm">Aucune archive vérifiée disponible dans le stockage privé.</p>}</details>}
      {data.staff && <details><summary className="cursor-pointer py-2 font-medium">Centre de suivi des notifications</summary><p className="text-sm text-muted-foreground">30 dernières notifications système de votre établissement. « Lu » concerne le portail; un statut de transport ne prouve pas la réception d’un email.</p><ul className="mt-3 space-y-2 text-sm">{data.notification_activity?.map(row => <li key={row.id} className="rounded-lg border p-2">Compte #{row.notifiable_id} · {row.data.title || 'Notification'} · {row.read_at ? 'Lu sur le portail' : 'Non lu sur le portail'}</li>)}</ul><ul className="mt-3 space-y-2 text-sm">{data.transport_logs?.map(row => <li key={row.id}>{row.type} · {row.recipient} · Statut enregistré : {row.status}</li>)}</ul><Link to="/admin/guichet" className="mt-2 inline-block text-sm text-primary underline">Traiter les demandes et leurs envois</Link></details>}
    </>}
  </section>
}
