import React, { useState } from 'react'
import {
  GraduationCap, Loader2, RefreshCw, Sparkles, ChevronRight, User, UserCheck,
  BookOpen, CheckCircle2, Clock, Calendar, Filter, Search, AlertTriangle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

const STAGES = [
  { key: 'soumis', label: 'Soumis', icon: '📥', color: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700', dot: 'bg-slate-400', nextStatus: 'under_review', nextLabel: '→ Passer en revue' },
  { key: 'en_revue', label: 'En Revue', icon: '🔍', color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900', dot: 'bg-amber-400', nextStatus: 'validated', nextLabel: '→ Valider' },
  { key: 'valide', label: 'Validé', icon: '✅', color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900', dot: 'bg-emerald-500', nextStatus: 'assigned', nextLabel: '→ Affecter encadreur' },
  { key: 'encadreur_affecte', label: 'Encadreur Affecté', icon: '👨‍🏫', color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900', dot: 'bg-blue-500', nextStatus: 'completed', nextLabel: '→ Marquer soutenu' },
  { key: 'soutenance', label: 'Soutenu', icon: '🎓', color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900', dot: 'bg-purple-500', nextStatus: null, nextLabel: null },
]

export default function AdminPFEWorkflowPage() {
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['pfe-workflow'],
    queryFn: async () => {
      const res = await api.get('/admin/pfe/workflow')
      return res.data
    }
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/pfe/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Statut PFE mis à jour !')
      qc.invalidateQueries({ queryKey: ['pfe-workflow'] })
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  })

  const stages = data?.stages ?? {}
  const stats = data?.stats ?? {}

  const filterPfe = (list: any[]) => {
    if (!search) return list
    return list.filter(p =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.student_name?.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <div className="max-w-[1700px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-purple-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Workflow PFE — Données Temps Réel DB
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Cahier de Charges PFE Digital
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Suivi Kanban complet du cycle PFE : dépôt, revue direction, validation, affectation encadreur, soutenance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher PFE, étudiant..."
                className="pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl text-xs font-bold text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/30 w-64"
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 grid grid-cols-3 md:grid-cols-5 gap-3 pt-6 border-t border-white/10 mt-6">
          {[
            { label: 'TOTAL PFE', value: stats.total ?? 0 },
            { label: 'SOUMIS', value: stats.soumis ?? 0 },
            { label: 'EN REVUE', value: stats.en_revue ?? 0 },
            { label: 'VALIDÉS', value: stats.valides ?? 0 },
            { label: 'SOUTENUS', value: stats.soutenus ?? 0 },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-200 block">{s.label}</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <>
          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {STAGES.map(stage => {
              const items = filterPfe(stages[stage.key] ?? [])
              return (
                <div key={stage.key} className={cn('rounded-[1.5rem] border p-4 space-y-3', stage.color)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stage.icon}</span>
                      <span className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">{stage.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black">{items.length}</span>
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-8">Aucun PFE</p>
                    ) : items.map((pfe: any) => (
                      <div key={pfe.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
                        <p className="font-black text-xs text-slate-900 dark:text-white line-clamp-2">{pfe.title || 'Titre non défini'}</p>

                        <div className="space-y-1">
                          {pfe.student_name && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <User className="w-3 h-3" /> {pfe.student_name}
                            </div>
                          )}
                          {pfe.supervisor_name && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <UserCheck className="w-3 h-3 text-emerald-500" /> {pfe.supervisor_name}
                            </div>
                          )}
                          {pfe.soutenance_date && (
                            <div className="flex items-center gap-1.5 text-[10px] text-purple-500">
                              <Calendar className="w-3 h-3" /> {new Date(pfe.soutenance_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>

                        {stage.nextStatus && (
                          <button
                            onClick={() => moveMutation.mutate({ id: pfe.id, status: stage.nextStatus! })}
                            disabled={moveMutation.isPending}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition-colors flex items-center justify-center gap-1"
                          >
                            {moveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                            {stage.nextLabel}
                          </button>
                        )}
                        {!stage.nextStatus && (
                          <div className="w-full py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black text-center">
                            ✅ Complété
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {stats.total === 0 && (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <GraduationCap className="w-12 h-12 mx-auto opacity-30" />
              <p className="font-bold text-sm">Aucun PFE soumis pour le moment.</p>
              <p className="text-xs">Les étudiants soumettront leurs sujets via leur espace.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
