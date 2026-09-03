import React, { useState } from 'react'
import {
  Bell, BarChart2, MessageSquare, AlertTriangle, Sparkles, CheckCircle2,
  Search, Award, Star, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

export default function AdminEvaluationsPage() {
  const queryClient = useQueryClient()

  const [selectedFiliere, setSelectedFiliere] = useState('all')
  const [search, setSearch] = useState('')

  // Fetch REAL Database Evaluations & Campaign metrics
  const { data: fetchRes, isLoading } = useQuery({
    queryKey: ['admin-course-evaluations-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/course-evaluations/stats')
        return res.data
      } catch {
        return null
      }
    }
  })

  const campaign = fetchRes?.campaign || { status: 'CLOSED', name: '' }
  const stats = fetchRes?.stats || { total_evaluations: 0, global_average: 0, participation_rate: '0%' }
  const evaluationsList = fetchRes?.evaluations || []
  const commentsList = fetchRes?.comments || []

  // Mutation to toggle campaign in DB
  const toggleCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/course-evaluations/toggle-campaign')
      return res.data
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Statut de la campagne d\'évaluation mis à jour dans la base de données !')
      queryClient.invalidateQueries({ queryKey: ['admin-course-evaluations-stats'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de la campagne.')
    }
  })

  const isCampaignOpen = campaign.status === 'OPEN'

  const filteredEvaluations = evaluationsList.filter((item: any) => {
    const matchesSearch =
      (item.module_name && item.module_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.professor_name && item.professor_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.module_code && item.module_code.toLowerCase().includes(search.toLowerCase()))

    const matchesFiliere = selectedFiliere === 'all' || (item.filiere_name && item.filiere_name === selectedFiliere)
    return matchesSearch && matchesFiliere
  })

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">

      {/* ── Deep Navy Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <Award className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Assurance Qualité Pédagogique — DB Live
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Évaluations & Qualité des Enseignements
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-3xl">
                Évaluation 360° anonyme des cours et professeurs par les étudiants, connectée en direct à la base de données MySQL.
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleCampaignMutation.mutate()}
            disabled={toggleCampaignMutation.isPending}
            className={cn(
              "shrink-0 flex items-center gap-3 px-6 py-3.5 font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-xl cursor-pointer disabled:opacity-50",
              isCampaignOpen
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            {toggleCampaignMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCampaignOpen ? (
              <>
                <ToggleRight className="w-5 h-5 text-rose-200" /> Clôturer la Campagne
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-emerald-200" /> Ouvrir la Campagne
              </>
            )}
          </button>
        </div>

        {/* KPI Cards (DB Metrics) */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">SCORE MOYEN GLOBAL (DB)</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block flex items-center gap-1">
              {stats.global_average} / 5 <Star className="w-5 h-5 text-amber-400 fill-amber-400 inline" />
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">TOTAL AVIS SOUMIS (DB)</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{stats.total_evaluations} Évaluations</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">STATUT EN BASE</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {isCampaignOpen ? 'OUVERTE 🟢' : 'FERMÉE 🔴'}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">ANONYMAT ÉTUDIANT</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">100% Garanti</span>
          </div>
        </div>
      </div>

      {/* ── Status Alert Box ── */}
      <div className={cn(
        "rounded-[2rem] p-6 border shadow-sm flex items-start gap-4 transition-all",
        isCampaignOpen
          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60"
          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm",
          isCampaignOpen ? "bg-amber-500/20 text-amber-600" : "bg-slate-200 text-slate-500"
        )}>
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">STATUT BASE DE DONNÉES</span>
            <span className={cn(
              "px-3 py-0.5 rounded-full text-[10px] font-black uppercase",
              isCampaignOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
            )}>
              {campaign.name}
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
            {isCampaignOpen
              ? 'La campagne d\'évaluation est actuellement OUVERTE aux étudiants.'
              : 'La campagne d\'évaluation est actuellement CLÔTURÉE.'}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Les étudiants enregistrent leurs évaluations anonymement en base de données SQL. Les statistiques sont agrégées en temps réel.
          </p>
        </div>
      </div>

      {/* ── Main Section: Evaluation Results Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm space-y-6">

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" /> Résultats Agrégés de la Base de Données
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Moyenne calculée depuis les enregistrements `course_evaluations` en base</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Filter */}
            <select
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-[#0f2863] dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Toutes les Filières</option>
              <option value="Audit & Contrôle">Audit & Contrôle</option>
              <option value="Marketing & Action Co">Marketing & Action Co</option>
              <option value="Gestion Financière">Gestion Financière</option>
              <option value="Management RH">Management RH</option>
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher professeur, module..."
                className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Module & Enseignant</th>
                  <th className="py-3 px-4 text-center">Avis DB</th>
                  <th className="py-3 px-4 text-center">Q1 (Organisation)</th>
                  <th className="py-3 px-4 text-center">Q2 (Clarté)</th>
                  <th className="py-3 px-4 text-center">Q3 (Dispo Prof)</th>
                  <th className="py-3 px-4 text-center">Q4 (LMS)</th>
                  <th className="py-3 px-4 text-center">Score Global</th>
                  <th className="py-3 px-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredEvaluations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 font-bold text-xs">
                      Aucune donnée d'évaluation enregistrée en base pour le moment.
                    </td>
                  </tr>
                ) : (
                  filteredEvaluations.map((item: any) => (
                    <tr key={item.module_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                            {item.module_code || 'MOD'}
                          </div>
                          <div>
                            <p className="font-black text-xs text-slate-900 dark:text-white">{item.module_name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{item.professor_name} · <span className="text-indigo-600 dark:text-indigo-400">{item.filiere_name || 'ENCG'}</span></p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-xs text-slate-600 dark:text-slate-300">
                        {item.count} avis
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-black text-xs text-slate-800 dark:text-slate-200">
                        {item.q1} / 5
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-black text-xs text-slate-800 dark:text-slate-200">
                        {item.q2} / 5
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-black text-xs text-slate-800 dark:text-slate-200">
                        {item.q3} / 5
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-black text-xs text-slate-800 dark:text-slate-200">
                        {item.q4} / 5
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-black text-xs rounded-xl border border-amber-400/30 inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {item.score}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {item.score >= 4.5 ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> EXCELLENT
                          </span>
                        ) : item.score >= 4.0 ? (
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                            SATISFAISANT
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> À AMÉLIORER
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Qualitative Anonymous Feedback Feed (Real DB Comments) ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" /> Retours Qualitatifs & Commentaires Anonymes (Base SQL)
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Commentaires enregistrés en base de données par les étudiants</p>
        </div>

        {commentsList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200">
            Aucun commentaire qualitatif rédigé pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {commentsList.map((comm: any) => (
              <div key={comm.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200/80 dark:border-slate-700 space-y-3 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">{comm.created_at ? new Date(comm.created_at).toLocaleDateString() : 'Récemment'}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-700">
                      AVIS ÉTUDIANT
                    </span>
                  </div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white">{comm.module_name}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{comm.professor_name}</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 italic pt-1 leading-relaxed">
                    "{comm.comment}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
