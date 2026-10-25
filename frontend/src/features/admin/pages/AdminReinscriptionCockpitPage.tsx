import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import { Modal } from '@shared/components/ui/Modal'
import { errorMessage } from '@features/admissions/api/workflow'
import RenewalCampaignPanel from '../components/RenewalCampaignPanel'
import { useRenewalCampaign } from '@features/students/api/renewalCampaign'

type Row = {
  id: number
  name: string
  cne: string
  cin?: string
  origin_level?: string
  current_level: string
  level_code?: string
  filiere: string
  status: string
  receipt_ref: string | null
  physical_verified_at: string | null
  physical_verified_by: string | null
}

type Data = {
  academic_year: string
  total_eligible: number
  total_pending: number
  total_physical_pending: number
  total_verified: number
  total_needs_review: number
  students: Row[]
  physical_requirements: Record<string, string>
  meta: { total: number; last_page: number }
  by_level: Record<string, { total: number; confirmed: number; verified: number }>
}

const labels: Record<string, string> = {
  needs_review: 'Rapprochement nécessaire',
  academic_pending: 'Décision académique attendue',
  pending: 'Confirmation étudiante attendue',
  physical_pending: 'Contrôle physique attendu',
  verified: 'Dossier finalisé',
}

const field = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm'

export default function AdminReinscriptionCockpitPage() {
  const [level, setLevel] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Row | null>(null)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [observation, setObservation] = useState('')
  const [reminders, setReminders] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const cache = useQueryClient()
  const params = { level, status, search, page }

  const query = useQuery({
    queryKey: ['admin-reinscription-stats', params],
    queryFn: async () => (await api.get('/admin/reinscriptions/stats', { params })).data.data as Data,
  })

  const data = query.data
  const calendar = useRenewalCampaign()

  async function act(work: () => Promise<string>) {
    setBusy(true)
    setError('')
    try {
      const message = await work()
      toast.success(message)
      setSelected(null)
      setReminders(false)
      await cache.invalidateQueries({ queryKey: ['admin-reinscription-stats'] })
    } catch (e) {
      setError(errorMessage(e))
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function download() {
    setBusy(true)
    try {
      const r = await api.get('/admin/reinscriptions/export', { params, responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Reinscriptions_Annuelles_ENCG.csv'
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      toast.error('Export indisponible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 pb-24 font-sans">
      <PageHeader
        title="Réinscriptions annuelles • anciens étudiants"
        subtitle={`Année ${data?.academic_year || 'en cours'} · Décision académique, confirmation étudiante et contrôle physique`}
        actions={
          <>
            <Button variant="outline" disabled={busy} onClick={() => { void query.refetch(); void calendar.refetch() }}>
              Actualiser
            </Button>
            <Button variant="outline" disabled={busy || !data?.meta.total} onClick={download}>
              Exporter la liste filtrée
            </Button>
            <Button
              disabled={busy || !data?.total_pending || !calendar.data?.data.is_open}
              onClick={() => {
                setError('')
                setReminders(true)
              }}
            >
              Relancer les confirmations attendues
            </Button>
          </>
        }
      />

      <RenewalCampaignPanel />
      <p className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs md:text-sm text-blue-950 dark:border-primary dark:bg-blue-950 dark:text-blue-100">
        Le niveau provient de la délibération et du parcours préparé par la scolarité. Les étudiants admis direct ou
        avec module(s) en réserve (dette) sont habilités à confirmer leur réinscription dans leur espace étudiant. La
        confirmation en ligne et le contrôle physique au guichet sont deux étapes distinctes et traçables.
      </p>

      {query.isPending ? (
        <div className="p-12 text-center text-muted-foreground space-y-2">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Chargement des dossiers annuels de réinscription…</p>
        </div>
      ) : query.isError ? (
        <div role="alert" className="p-8 text-center space-y-3">
          <p className="text-sm text-red-600 font-semibold">Impossible de charger les réinscriptions.</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : (
        data && (
          <>
            {/* Cartes KPI */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Décision académique validée', data.total_eligible],
                ['Confirmation étudiante attendue', data.total_pending],
                ['Dossier physique à contrôler', data.total_physical_pending],
                ['Dossiers finalisés', data.total_verified],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground dark:text-white">{value}</p>
                </div>
              ))}
            </div>

            {data.total_needs_review > 0 && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 font-medium">
                {data.total_needs_review} dossier(s) attendent une décision académique ou un rapprochement. Ils sont
                exclus des relances automatiques de confirmation.
              </p>
            )}

            {/* Tableau et Filtres */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_200px_270px]">
                <label className="text-xs font-bold text-slate-700 dark:text-foreground">
                  Rechercher
                  <input
                    className={field}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Nom, CNE ou CIN"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 dark:text-foreground">
                  Niveau cible
                  <select
                    className={field}
                    value={level}
                    onChange={(e) => {
                      setLevel(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="all">Tous les niveaux</option>
                    {['1A', '2A', '3A', '4A', '5A'].map((l) => (
                      <option key={l} value={l}>
                        {l} · {data.by_level[l]?.total || 0} dossier(s)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700 dark:text-foreground">
                  État du dossier
                  <select
                    className={field}
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="all">Tous les états</option>
                    {Object.entries(labels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 font-bold uppercase text-[10px] text-muted-foreground">
                    <tr>
                      {['Étudiant', 'Passage & Filière', 'État du dossier', 'Confirmation', 'Contrôle guichet'].map(
                        (label) => (
                          <th key={label} className="p-4 text-start">
                            {label}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.students.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-semibold text-foreground dark:text-white">
                          <p>{s.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono font-normal">{s.cne}</p>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-primary dark:text-indigo-400">
                            {s.origin_level ? `${s.origin_level} ➔ ` : ''}
                            {s.current_level}
                          </span>
                          <p className="text-[10px] text-muted-foreground">{s.filiere}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted dark:bg-card text-slate-700 dark:text-foreground">
                            {labels[s.status] || s.status}
                          </span>
                        </td>
                        <td className="max-w-56 break-all p-4 font-mono text-[11px]">
                          {s.receipt_ref ? (
                            <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                              ✓ {s.receipt_ref}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">En attente</span>
                          )}
                        </td>
                        <td className="p-4">
                          {s.status === 'physical_pending' ? (
                            <Button
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => {
                                setSelected(s)
                                setChecks(
                                  Object.fromEntries(Object.keys(data.physical_requirements).map((key) => [key, false]))
                                )
                                setObservation('')
                                setError('')
                              }}
                            >
                              Contrôler le dossier
                            </Button>
                          ) : s.physical_verified_at ? (
                            <div className="space-y-0.5">
                              <p className="text-emerald-600 font-bold">✓ Contrôle validé</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(s.physical_verified_at).toLocaleDateString('fr-FR')} · {s.physical_verified_by}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!data.students.length && (
                  <div className="p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mx-auto text-xl font-bold">
                      🎓
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="font-bold text-sm text-foreground dark:text-foreground">
                        Aucun dossier ne correspond aux filtres
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Vérifiez les filtres et les décisions académiques pour {data.academic_year}.
                        Les inscriptions annuelles sont préparées après validation pédagogique. Les lauréats sont suivis dans leur registre dédié.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs">
                <p className="text-muted-foreground">
                  {data.meta.total} dossier(s) annuel(s) · Page {page} / {data.meta.last_page}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </section>
          </>
        )
      )}

      {/* Modal Contrôle Physique */}
      <Modal
        open={!!selected}
        onClose={() => !busy && setSelected(null)}
        title="Vérification physique du dossier annuel"
        preventBackdropClose={busy}
        preventEscapeClose={busy}
      >
        <p className="mb-4 text-sm font-semibold">
          {selected?.name} · {selected?.cne} · {selected?.current_level}
        </p>
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="space-y-3">
          {Object.entries(data?.physical_requirements || {}).map(([key, label]) => (
            <label className="flex items-start gap-3 text-xs md:text-sm font-medium cursor-pointer" key={key}>
              <input
                className="mt-0.5 rounded border-slate-300"
                type="checkbox"
                checked={!!checks[key]}
                onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
        <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-foreground">
          Observation de l’agent
          <textarea
            className={field}
            rows={3}
            maxLength={2000}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Remarques éventuelles sur les pièces physiques (quitus, assurance...)"
          />
        </label>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Votre identité administrative, l’horodatage et la liste de contrôle seront archivés.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>
            Annuler
          </Button>
          <Button
            isLoading={busy}
            disabled={!Object.keys(checks).length || !Object.values(checks).every(Boolean)}
            onClick={() =>
              act(async () => {
                const r = await api.post(`/admin/reinscriptions/${selected?.id}/physical-review`, {
                  checklist: checks,
                  observation,
                })
                return r.data.message
              })
            }
          >
            Valider le contrôle physique
          </Button>
        </div>
      </Modal>

      {/* Modal Relances */}
      <Modal
        open={reminders}
        onClose={() => !busy && setReminders(false)}
        title="Confirmer les relances annuelles"
        preventBackdropClose={busy}
      >
        <p className="text-xs md:text-sm leading-relaxed text-muted-foreground dark:text-foreground">
          Les filtres actuels seront appliqués. Seuls les étudiants avec une décision académique validée et sans
          confirmation recevront une notification portail et un email d’invitation. Une seule relance par jour et par
          étudiant est autorisée pour respecter les quotas de communication.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={() => setReminders(false)}>
            Annuler
          </Button>
          <Button
            isLoading={busy}
            onClick={() =>
              act(async () => {
                const r = await api.post('/admin/reinscriptions/send-reminders', params)
                return r.data.message
              })
            }
          >
            Confirmer les relances
          </Button>
        </div>
      </Modal>
    </div>
  )
}
