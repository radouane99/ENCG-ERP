import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  GraduationCap,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useActionCenter } from '../api/actionCenter'

export default function UserActionCenter({ actor }: { actor: 'student' | 'professor' }) {
  const query = useActionCenter(actor)
  const items = query.data?.items ?? []

  const quickLinks =
    actor === 'student'
      ? query.data?.has_student
        ? [
            { href: '/student/convocations', label: 'Convocations', icon: Calendar },
            { href: '/student/documents', label: 'Mes documents', icon: FileCheck2 },
          ]
        : []
      : [
          { href: '/professor/grades', label: 'Mes notes', icon: FileSpreadsheet },
          { href: '/professor/internships', label: 'Encadrements', icon: GraduationCap },
          { href: '/professor/schedule', label: 'Emploi du temps', icon: Calendar },
        ]

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card shadow-sm"
      aria-label={actor === 'student' ? 'Mes prochaines démarches' : 'Mes actions enseignant'}
    >
      {/* Top subtle accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#1a3673] via-indigo-600 to-amber-500" />

      <div className="p-5 sm:p-6">
        {/* Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1a3673] to-[#0c2459] text-amber-300 flex items-center justify-center shadow-sm shrink-0 border border-blue-800/40">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-[#1a3673] dark:text-white tracking-tight">
                  {actor === 'student' ? 'Que dois-je faire maintenant ?' : 'Mes actions'}
                </h2>
                {!query.isPending && !query.isError && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      items.length > 0
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {items.length > 0 ? `${items.length} à traiter` : 'À jour'}
                  </span>
                )}
                {query.data?.academic_year && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border border-primary/15">
                    Année {query.data.academic_year}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {actor === 'student'
                  ? 'Vos démarches et documents, depuis une seule vue.'
                  : 'Vos notes, PV et dossiers d’encadrement dans leur contexte.'}
              </p>
            </div>
          </div>

          <button
            aria-label="Actualiser mes actions"
            onClick={() => void query.refetch()}
            className="inline-flex items-center gap-1.5 h-9 shrink-0 rounded-xl border border-border bg-muted/40 hover:bg-muted px-3 text-xs font-bold text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${query.isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Body Content */}
        {query.isPending ? (
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            Chargement de vos démarches…
          </p>
        ) : query.isError ? (
          <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-400">
            Impossible de charger vos actions.{' '}
            <button className="underline font-semibold cursor-pointer" onClick={() => void query.refetch()}>
              Réessayer
            </button>
          </p>
        ) : (
          <>
            {items.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="group relative flex min-w-0 items-center justify-between gap-4 rounded-xl border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/[0.04] via-card to-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#1a3673] group-hover:text-amber-300 group-hover:border-[#1a3673] transition-colors">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm font-bold text-foreground group-hover:text-[#1a3673] dark:group-hover:text-amber-300 transition-colors">
                            {item.title}
                          </strong>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300">
                            Action requise
                          </span>
                        </span>
                        <span className="mt-1 block break-words text-xs font-medium text-muted-foreground">
                          {item.description}
                        </span>
                        {item.deadline && (
                          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            <Clock className="w-3 h-3" />
                            Échéance : {new Date(item.deadline + 'T12:00:00').toLocaleDateString('fr-MA')}
                          </span>
                        )}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-primary/10 group-hover:bg-[#1a3673] px-2.5 py-1.5 text-[11px] font-bold text-primary group-hover:text-white transition-all">
                      <span className="hidden sm:inline">Ouvrir</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p>{query.data?.message || 'Aucune action en attente identifiée dans vos dossiers.'}</p>
              </div>
            )}

            {query.data?.limited && (
              <p className="mt-3 text-xs text-muted-foreground">
                Vue limitée aux premières actions. Consultez vos modules pour le suivi complet.
              </p>
            )}
          </>
        )}

        {/* Quick Context Pills Footer */}
        {quickLinks.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Accès direct :
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 hover:bg-[#1a3673] hover:text-white hover:border-[#1a3673] px-3 py-1.5 text-xs font-bold text-foreground transition-all"
                >
                  <Icon className="w-3.5 h-3.5 text-primary group-hover:text-amber-300" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
