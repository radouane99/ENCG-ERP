import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, UserCheck, ShieldAlert, Calendar, Plus, RefreshCw, 
  CheckCircle2, XCircle, Clock, BookOpen, Building2, AlertTriangle, X
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'

export default function DepartmentSubstitutionsPage() {
  const { t, i18n } = useTranslation(['admin', 'common'])
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [originalProf, setOriginalProf] = useState('')
  const [substituteProf, setSubstituteProf] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [startDate, setStartDate] = useState(nowDateStr())
  const [endDate, setEndDate] = useState(futureDateStr(14))
  const [reason, setReason] = useState('')

  function nowDateStr() {
    return new Date().toISOString().split('T')[0]
  }

  function futureDateStr(days: number) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  // Fetch substitutions
  const { data: substitutions = [], isLoading } = useQuery({
    queryKey: ['substitutions'],
    queryFn: () => api.get('/v1/admin/substitutions').then(res => res.data.data)
  })

  // Fetch professors list
  const { data: professors = [] } = useQuery({
    queryKey: ['professors-list'],
    queryFn: () => api.get('/professors').then(res => res.data.data || res.data)
  })

  // Fetch modules list
  const { data: modules = [] } = useQuery({
    queryKey: ['modules-list'],
    queryFn: () => api.get('/modules').then(res => res.data.data || res.data)
  })

  // Create substitution mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/v1/admin/substitutions', payload),
    onSuccess: () => {
      toast.success('Délégation de suppléance d\'urgence enregistrée !')
      queryClient.invalidateQueries({ queryKey: ['substitutions'] })
      setShowModal(false)
      resetForm()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la création de la suppléance.')
    }
  })

  // Revoke substitution mutation
  const revokeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/v1/admin/substitutions/${id}/revoke`),
    onSuccess: () => {
      toast.success('Suppléance révoquée avec succès.')
      queryClient.invalidateQueries({ queryKey: ['substitutions'] })
    },
    onError: () => toast.error('Erreur lors de la révocation.')
  })

  function resetForm() {
    setOriginalProf('')
    setSubstituteProf('')
    setSelectedModule('')
    setReason('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!originalProf || !substituteProf || !selectedModule || !startDate || !endDate) {
      toast.error('Veuillez remplir tous les champs obligatoires.')
      return
    }

    createMutation.mutate({
      original_professor_id: Number(originalProf),
      substitute_professor_id: Number(substituteProf),
      module_id: Number(selectedModule),
      start_date: startDate,
      end_date: endDate,
      reason: reason
    })
  }

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-28 font-sans">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-8 md:p-10 text-white shadow-2xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold backdrop-blur-md border border-white/10">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Gestion Hiérarchique — Chefs de Département ENCG Fès</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Suppléance & Remplacements d'Urgence 🔄
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Accordez et gérez les délégations temporaires de cours et de saisie des notes en cas d'absence d'un enseignant permanent.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5" /> Accorder une Suppléance
          </button>
        </div>
      </div>

      {/* Main Content List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : substitutions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {substitutions.map((sub: any) => (
            <div key={sub.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                  sub.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  sub.status === 'revoked' ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200"
                )}>
                  {sub.status === 'active' ? '🟢 En Cours (Active)' : sub.status === 'revoked' ? '🔴 Révoquée' : '⚪ Expirée'}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{sub.created_at}</span>
              </div>

              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{sub.module_code}</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">{sub.module_name}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{sub.filiere_name}</p>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Titulaire absent :</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">{sub.original_professor_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Remplaçant actif :</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{sub.substitute_professor_name}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-400 font-medium">Période :</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{sub.start_date} → {sub.end_date}</span>
                </div>
              </div>

              {sub.reason && (
                <p className="text-xs text-slate-500 italic bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/40">
                  « {sub.reason} »
                </p>
              )}

              {sub.status === 'active' && (
                <button
                  onClick={() => revokeMutation.mutate(sub.id)}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 rounded-xl text-xs font-extrabold transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer"
                >
                  Révoquer la suppléance
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Aucune suppléance active pour le moment</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Toutes les séances de votre département sont assurées par leurs enseignants titulaires.
          </p>
        </div>
      )}

      {/* Modal Grant Substitution */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Attribution de Suppléance</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Délégation temporaire d'urgence pour cours & notes</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">1. Professeur Titulaire Absent</label>
                <select
                  value={originalProf}
                  onChange={e => setOriginalProf(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                  required
                >
                  <option value="">-- Sélectionner l'enseignant titulaire --</option>
                  {professors.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      Pr. {p.user?.name || p.first_name + ' ' + p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">2. Professeur Remplaçant Mandaté</label>
                <select
                  value={substituteProf}
                  onChange={e => setSubstituteProf(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400"
                  required
                >
                  <option value="">-- Sélectionner le professeur remplaçant --</option>
                  {professors.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      Pr. {p.user?.name || p.first_name + ' ' + p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">3. Module Remplacé</label>
                <select
                  value={selectedModule}
                  onChange={e => setSelectedModule(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                  required
                >
                  <option value="">-- Sélectionner le module --</option>
                  {modules.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.code ? `[${m.code}] ` : ''}{m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Date Début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Date Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Motif / Justification</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Congé maladie / Mission officielle à l'étranger"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-600/30"
                >
                  {createMutation.isPending ? 'Enregistrement...' : 'Valider la Suppléance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
