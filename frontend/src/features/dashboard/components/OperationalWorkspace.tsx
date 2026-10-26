import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import { useAuthStore } from '@/stores/authStore'
import {
  Bell, Clock, AlertTriangle, Database, CheckCircle2,
  ChevronDown, RefreshCw, UserCheck, Inbox, FileCheck, ArrowUpRight,
  AlertCircle, Send, ShieldAlert,
} from 'lucide-react'
import { cn } from '@shared/lib/utils'

interface FollowupRequest {
  id: number
  label: string
  person: string
  status: string
  due_at: string | null
  assigned_to: number | null
  revision: number
  overdue: boolean
  email_state?: 'accepted' | 'failed' | 'unknown'
}

interface Agent {
  id: number
  name: string
}

function RetryDocumentEmail({ id }: { id: number }) {
  const client = useQueryClient()
  const retry = useMutation({
    mutationFn: () => api.post(`/admin/document-requests/${id}/send-email-notification`),
    onSuccess: response => {
      toast.success(response.data.message)
      void client.invalidateQueries({ queryKey: ['operational-workspace'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Nouvelle tentative refusée.')
  })

  return (
    <button
      type="button"
      disabled={retry.isPending}
      onClick={() => retry.mutate()}
      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer disabled:opacity-50"
    >
      <RefreshCw className={cn("w-3.5 h-3.5", retry.isPending && "animate-spin")} />
      <span>{retry.isPending ? 'Envoi en cours…' : `Réessayer l'email (#${id})`}</span>
    </button>
  )
}

interface Workspace {
  staff: boolean
  tasks: { label: string; count: number; url: string }[]
  requests: FollowupRequest[]
  agents?: Agent[]
  quality?: {
    duplicate_cne_groups: number
    missing_cne: number
    registrations_without_group: number | null
    academic_year: string | null
    modules_without_assignment?: number | null
    duplicate_cne_samples?: { cne: string; count: number }[]
    missing_cne_ids?: number[]
  }
  backup?: {
    created_at?: string
    restore_verified?: boolean
    restored_at?: string
    error?: string
  } | null
  notification_activity?: {
    id: string
    notifiable_id: number
    data: { title?: string }
    read_at: string | null
  }[]
  transport_logs?: {
    id: number
    type: string
    recipient: string
    status: string
  }[]
}

function FollowupForm({ row, agents }: { row: FollowupRequest; agents: Agent[] }) {
  const client = useQueryClient()
  const [agent, setAgent] = useState(String(row.assigned_to || ''))
  const [due, setDue] = useState('')
  const [reason, setReason] = useState('')

  const save = useMutation({
    mutationFn: () => api.patch(`/workspace/requests/${row.id}/followup`, {
      assigned_to: agent ? Number(agent) : null,
      due_at: due ? new Date(due).toISOString() : null,
      revision: row.revision,
      reason
    }),
    onSuccess: () => {
      toast.success('Suivi enregistré.')
      void client.invalidateQueries({ queryKey: ['operational-workspace'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Suivi non enregistré.')
  })

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        if (!save.isPending) save.mutate()
      }}
      className="grid gap-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 sm:grid-cols-2 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
            #{row.id}
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{row.person}</span>
          <span className="text-xs text-slate-500 font-medium">· {row.label}</span>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
          row.overdue
            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
        )}>
          <Clock className="w-3 h-3" />
          <span>{row.status}</span>
          {row.overdue && " · En retard"}
        </span>
      </div>

      <p className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">
        Échéance actuelle : <strong className="text-slate-700 dark:text-slate-200">{row.due_at ? new Date(row.due_at).toLocaleString('fr-FR') : 'Non définie'}</strong>
        {row.overdue ? ' · Dépassée' : ''}. Vous pouvez assigner un responsable ou définir une nouvelle échéance.
      </p>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Agent Responsable
        </label>
        <select
          aria-label={`Responsable demande ${row.id}`}
          value={agent}
          onChange={event => setAgent(event.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Non affectée</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Nouvelle Échéance
        </label>
        <input
          aria-label={`Échéance demande ${row.id}`}
          type="datetime-local"
          value={due}
          onChange={event => setDue(event.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Motif du changement (requis, min. 10 car.)
        </label>
        <input
          aria-label={`Motif demande ${row.id}`}
          required
          minLength={10}
          maxLength={1000}
          placeholder="Justification administrative du report ou de la réaffectation..."
          value={reason}
          onChange={event => setReason(event.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="sm:col-span-2 flex justify-end pt-1">
        <button
          disabled={save.isPending || reason.trim().length < 10}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black text-white shadow-md shadow-blue-950/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #0f2863 0%, #2563eb 100%)' }}
        >
          {save.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{save.isPending ? 'Enregistrement…' : 'Enregistrer le suivi'}</span>
        </button>
      </div>
    </form>
  )
}

export default function OperationalWorkspace() {
  const user = useAuthStore(state => state.user)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    requests: false,
    quality: false,
    backup: false,
    notifications: false,
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['operational-workspace', user?.id],
    queryFn: async () => {
      const payload = (await api.get<{ data: Workspace }>('/workspace/today')).data.data
      if (!payload || !Array.isArray(payload.tasks) || !Array.isArray(payload.requests)) {
        throw new Error('Réponse du suivi indisponible.')
      }
      return payload
    },
    refetchInterval: 60000,
    enabled: !!user
  })

  if (data && !data.staff && data.requests.length === 0) return null

  const getTaskStyle = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('délai') || l.includes('retard')) {
      return {
        icon: AlertTriangle,
        gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
        border: 'border-rose-200/80 dark:border-rose-900/30 hover:border-rose-300',
        iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
        textColor: 'text-rose-700 dark:text-rose-300',
      }
    }
    if (l.includes('traiter') || l.includes('attente') || l.includes('demande')) {
      return {
        icon: Inbox,
        gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
        border: 'border-amber-200/80 dark:border-amber-900/30 hover:border-amber-300',
        iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
        textColor: 'text-amber-700 dark:text-amber-300',
      }
    }
    return {
      icon: Bell,
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      border: 'border-blue-200/80 dark:border-blue-900/30 hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      textColor: 'text-blue-700 dark:text-blue-300',
    }
  }

  return (
    <section
      aria-label="Mon travail à suivre"
      className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-7 shadow-sm mb-6 space-y-6 backdrop-blur-sm"
    >
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-700 text-white shadow-md shadow-blue-950/20">
            <UserCheck className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{data && !data.staff ? 'Suivi de mes demandes' : 'Mon travail à suivre'}</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Espace Opérationnel
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Demandes, échéances et alertes administratives de votre espace.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-blue-600 dark:text-blue-400", isPending && "animate-spin")} />
          <span>Actualiser les tâches</span>
        </button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center p-8 text-xs font-bold text-slate-500">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin text-blue-600" />
          <span>Chargement des tâches opérationnelles…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>Le suivi est momentanément indisponible. Cliquez sur « Actualiser les tâches ».</span>
        </div>
      )}

      {data && (
        <>
          {/* ── Task Metric Cards ──────────────────────────────────── */}
          {data.staff && (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {data.tasks.map(task => {
                const style = getTaskStyle(task.label)
                const Icon = style.icon
                return (
                  <Link
                    key={task.label}
                    to={task.url}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-gradient-to-br",
                      style.border,
                      style.gradient
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block truncate">
                          {task.label}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <strong className={cn("text-3xl font-black tracking-tight", style.textColor)}>
                            {task.count}
                          </strong>
                          {task.count > 0 && (
                            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                              à vérifier
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110", style.iconBg)}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-black text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <span>Accéder au traitement</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* ── Collapsible Sections ───────────────────────────────── */}
          <div className="space-y-3 pt-2">
            {/* Section 1: Demandes prioritaires */}
            {data.requests.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection('requests')}
                  className="w-full flex items-center justify-between p-4.5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Suivi des demandes
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                      {data.requests.length} prioritaires
                    </span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", openSections.requests && "rotate-180")} />
                </button>

                {openSections.requests && (
                  <div className="p-4.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    {data.requests.map(row => (
                      data.staff && ['pending', 'processing'].includes(row.status) ? (
                        <FollowupForm key={`${row.id}:${row.revision}`} row={row} agents={data.agents || []} />
                      ) : (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-xs font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">#{row.id}</span>
                            <span className="text-slate-500">· {row.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase">
                              {row.status}
                            </span>
                            {row.due_at && (
                              <span className="text-slate-500 text-[11px]">
                                Échéance : {new Date(row.due_at).toLocaleString('fr-FR')}
                              </span>
                            )}
                            {row.overdue && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                En retard
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section 2: Qualité des données */}
            {data.quality && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection('quality')}
                  className="w-full flex items-center justify-between p-4.5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Qualité des données
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      · {data.quality.academic_year || 'Aucune année courante'}
                    </span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", openSections.quality && "rotate-180")} />
                </button>

                {openSections.quality && (
                  <div className="p-4.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5">
                    <div className="grid gap-2 sm:grid-cols-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span><strong>{data.quality.duplicate_cne_groups}</strong> groupes de CNE potentiellement dupliqués</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span><strong>{data.quality.missing_cne}</strong> profils sans CNE</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span><strong>{data.quality.registrations_without_group ?? 'Non calculable'}</strong> inscriptions validées sans groupe</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span><strong>{data.quality.modules_without_assignment ?? 'Non calculable'}</strong> modules sans affectation annuelle</span>
                      </div>
                    </div>

                    {Boolean(data.quality.missing_cne_ids?.length) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs font-bold text-slate-500 mr-1">Dossiers sans CNE :</span>
                        {data.quality.missing_cne_ids?.map(id => (
                          <Link
                            key={id}
                            to={`/students/${id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                          >
                            <span>Dossier #{id}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        to="/students"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Vérifier les dossiers étudiants</span>
                      </Link>
                      <span className="text-[11px] text-slate-400 italic">
                        Détection d'aide uniquement. Vérifier le dossier avant toute modification.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 3: Sauvegarde et restauration */}
            {data.staff && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection('backup')}
                  className="w-full flex items-center justify-between p-4.5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      <Database className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Sauvegarde et restauration
                    </span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", openSections.backup && "rotate-180")} />
                </button>

                {openSections.backup && (
                  <div className="p-4.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {data.backup?.error ? (
                      <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                        {data.backup.error}
                      </div>
                    ) : data.backup?.created_at ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Dernière archive : <strong>{new Date(data.backup.created_at).toLocaleString('fr-FR')}</strong>
                          {data.backup.restore_verified ? ' · Restauration certifiée sur base isolée' : ' · Restauration à vérifier'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">Aucune archive vérifiée disponible dans le stockage privé.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Centre de suivi des notifications */}
            {data.staff && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection('notifications')}
                  className="w-full flex items-center justify-between p-4.5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Centre de suivi des notifications
                    </span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", openSections.notifications && "rotate-180")} />
                </button>

                {openSections.notifications && (
                  <div className="p-4.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <p className="text-xs text-slate-500">
                      30 dernières notifications système de l'établissement. « Lu » concerne la consultation sur le portail.
                    </p>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {data.notification_activity?.map(row => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            Compte #{row.notifiable_id} · {row.data.title || 'Notification'}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            row.read_at
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          )}>
                            {row.read_at ? 'Lu' : 'Non lu'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {Boolean(data.requests.filter(row => row.email_state === 'failed').length) && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {data.requests
                          .filter(row => row.email_state === 'failed')
                          .map(row => <RetryDocumentEmail key={row.id} id={row.id} />)}
                      </div>
                    )}

                    <div className="pt-2">
                      <Link
                        to="/admin/guichet"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Traiter les demandes et leurs envois au Guichet Unique</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
