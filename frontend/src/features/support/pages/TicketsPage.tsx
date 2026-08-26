import { useMemo, useState } from 'react'
import { Search, Plus, Ticket, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { useAuthStore } from '@/stores/authStore'

type ComplaintRow = {
  id: number
  type?: string
  subject?: string
  message?: string
  status?: string
  created_at?: string
  student?: { user?: { name?: string }; first_name?: string; last_name?: string }
}

const STATUS_FILTERS: Array<{ label: string; value: string | null }> = [
  { label: 'Tous', value: null },
  { label: 'Ouverts', value: 'pending' },
  { label: 'En cours', value: 'investigating' },
  { label: 'Résolus', value: 'resolved' },
]

export default function TicketsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const roles = ((user as { roles?: Array<string | { name?: string }> } | null)?.roles ?? []).map((r) =>
    typeof r === 'string' ? r : r?.name ?? ''
  )
  const isStudent = roles.includes('student')
  const listPath = isStudent ? '/student-portal/complaints' : '/complaints'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('administrative')

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['complaints', listPath],
    queryFn: async () => {
      const res = await api.get(listPath)
      const payload = res.data?.data ?? res.data ?? []
      return Array.isArray(payload) ? (payload as ComplaintRow[]) : []
    },
  })

  const createTicket = useMutation({
    mutationFn: () =>
      api.post(listPath, {
        type,
        subject,
        message,
      }),
    onSuccess: () => {
      toast.success('Réclamation enregistrée.')
      setShowForm(false)
      setSubject('')
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
    },
    onError: () => {
      toast.error('Impossible d’enregistrer la réclamation.')
    },
  })

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) {
        return false
      }
      if (!search.trim()) {
        return true
      }
      const hay = `${t.subject ?? ''} ${t.message ?? ''} ${t.id}`.toLowerCase()
      return hay.includes(search.toLowerCase())
    })
  }, [tickets, search, statusFilter])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centre de Support (Tickets)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez les réclamations et requêtes des étudiants et professeurs.
          </p>
        </div>
        {isStudent && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau Ticket
          </button>
        )}
      </div>

      {showForm && isStudent && (
        <form
          className="bg-card border rounded-xl p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            createTicket.mutate()
          }}
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
          >
            <option value="administrative">Administratif</option>
            <option value="grade">Note</option>
            <option value="schedule">Emploi du temps</option>
            <option value="other">Autre</option>
            <option value="support">Support</option>
          </select>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
          />
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre demande"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background min-h-24"
          />
          <button
            type="submit"
            disabled={createTicket.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            Envoyer
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border rounded-xl shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-sm uppercase text-muted-foreground">Filtres</h3>
            <div className="space-y-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    statusFilter === f.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-xl shadow-sm p-2 flex gap-2">
            <Search className="w-5 h-5 text-muted-foreground ml-2 my-auto" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un ticket..."
              className="w-full bg-transparent outline-none text-sm py-1"
            />
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Ticket className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucun ticket pour le moment.</p>
                {isStudent && (
                  <button type="button" className="text-sm text-primary font-medium" onClick={() => setShowForm(true)}>
                    Créer une réclamation
                  </button>
                )}
              </div>
            ) : (
              filtered.map((t) => {
                const author =
                  t.student?.user?.name ??
                  `${t.student?.first_name ?? ''} ${t.student?.last_name ?? ''}`.trim() ??
                  'Étudiant'
                const uiStatus =
                  t.status === 'pending'
                    ? 'open'
                    : t.status === 'investigating'
                      ? 'in_progress'
                      : 'resolved'
                return (
                  <div key={t.id} className="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{t.id}</span>
                        <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded text-foreground">{t.type}</span>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1',
                          uiStatus === 'open'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : uiStatus === 'in_progress'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : 'bg-green-50 text-green-600 border-green-200'
                        )}
                      >
                        {uiStatus === 'open' ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : uiStatus === 'in_progress' ? (
                          <MessageSquare className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {uiStatus === 'open' ? 'Nouveau' : uiStatus === 'in_progress' ? 'En cours' : 'Résolu'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{t.subject}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Par {author}</span>
                      <span>•</span>
                      <span>{t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
