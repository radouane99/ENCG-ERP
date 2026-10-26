import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Users, AlertCircle, Building2,
  ChevronDown, ChevronUp, Scale, ArrowRight, Sparkles,
  ShieldCheck, AlertTriangle
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface SemesterReadiness {
  configured: boolean
  modules?: number
  groups?: number
  missing_assignments_count?: number
  operational_rooms?: number
  unavailable_rooms?: number
  issues: string[]
  missing_assignments?: { module_id: number; module_name: string; group_name: string }[]
  professor_loads?: { professor_id: number; name: string; assigned_hours: number; unknown_hours: number; assignments: number }[]
}

export default function SemesterReadinessPanel({ data }: { data: SemesterReadiness }) {
  const [showLoads, setShowLoads] = useState(false)
  const [showMissing, setShowMissing] = useState(false)

  const isReady = (data.missing_assignments_count ?? 0) === 0 && data.issues.length === 0

  return (
    <section aria-labelledby="semester-readiness" className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/40 space-y-5">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-indigo-500/5 blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#0f2863] to-blue-700 text-white shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </span>
            <h2 id="semester-readiness" className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Préparer le semestre
            </h2>
            <span className={cn(
              "ml-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider",
              isReady
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 ring-1 ring-emerald-400/30"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 ring-1 ring-amber-400/30"
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", isReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              {isReady ? 'Prérequis validés' : 'Vérification requise'}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Affectations, charges déclarées et disponibilité des salles avant le lancement du moteur IA.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/professor-assignments"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f2863] via-blue-700 to-indigo-800 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-300" />
            <span>Affecter les modules</span>
            <ArrowRight className="h-3.5 w-3.5 text-blue-200" />
          </Link>
          <Link
            to="/admin/rooms/availability"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
            <span>Disponibilité des salles</span>
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            label: 'Modules au semestre',
            value: data.modules ?? 0,
            icon: BookOpen,
            tone: 'from-blue-500 to-indigo-600',
            bg: 'bg-blue-50/70 dark:bg-blue-950/30',
            border: 'border-blue-100 dark:border-blue-900/50',
            textColor: 'text-blue-700 dark:text-blue-300'
          },
          {
            label: 'Groupes d\'étudiants',
            value: data.groups ?? 0,
            icon: Users,
            tone: 'from-indigo-500 to-purple-600',
            bg: 'bg-indigo-50/70 dark:bg-indigo-950/30',
            border: 'border-indigo-100 dark:border-indigo-900/50',
            textColor: 'text-indigo-700 dark:text-indigo-300'
          },
          {
            label: 'Affectations manquantes',
            value: data.missing_assignments_count ?? 0,
            icon: AlertCircle,
            tone: (data.missing_assignments_count ?? 0) > 0 ? 'from-amber-500 to-rose-600' : 'from-emerald-500 to-teal-600',
            bg: (data.missing_assignments_count ?? 0) > 0 ? 'bg-amber-50/70 dark:bg-amber-950/30' : 'bg-emerald-50/70 dark:bg-emerald-950/30',
            border: (data.missing_assignments_count ?? 0) > 0 ? 'border-amber-200 dark:border-amber-900/50' : 'border-emerald-100 dark:border-emerald-900/50',
            textColor: (data.missing_assignments_count ?? 0) > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'
          },
          {
            label: 'Salles opérationnelles',
            value: data.operational_rooms ?? 0,
            icon: Building2,
            tone: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
            border: 'border-emerald-100 dark:border-emerald-900/50',
            textColor: 'text-emerald-700 dark:text-emerald-300'
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-md",
              stat.bg, stat.border
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {stat.label}
              </span>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-xs", stat.tone)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className={cn("text-2xl font-black font-mono tracking-tight", stat.textColor)}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Diagnostic Message */}
      {data.issues.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Points d'attention avant planification
              </h4>
              <ul className="list-disc pl-4 text-xs font-medium text-amber-800 dark:text-amber-300 space-y-0.5">
                {data.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Tous les prérequis sont disponibles. Les volumes d'heures et les salles sont configurés pour l'optimisation.</span>
          </div>
        </div>
      )}

      {/* Collapsible: Missing Assignments List */}
      {!!data.missing_assignments?.length && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setShowMissing(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition hover:bg-slate-100/60 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <span className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <span>Voir les modules à affecter ({data.missing_assignments.length})</span>
            </span>
            {showMissing ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showMissing && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <ul className="grid sm:grid-cols-2 gap-2 mt-2">
                {data.missing_assignments.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-800 dark:text-white">{item.module_name}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">{item.group_name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Collapsible: Compare Professor Loads */}
      {!!data.professor_loads?.length && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setShowLoads(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition hover:bg-slate-100/60 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <span className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
              <Scale className="h-4 w-4 text-indigo-500" />
              <span>Comparer les charges des enseignants ({data.professor_loads.length})</span>
            </span>
            {showLoads ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showLoads && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Heures affectées pour cette période. Ce récapitulatif permet de vérifier l'équilibre global des obligations statutaires avant calcul.
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Enseignant</th>
                      <th className="py-2.5 px-3">Heures affectées</th>
                      <th className="py-2.5 px-3">Volume de cours</th>
                      <th className="py-2.5 px-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium bg-white dark:bg-slate-900">
                    {data.professor_loads.map((load) => (
                      <tr key={load.professor_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">
                          {load.name || `Enseignant #${load.professor_id}`}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-200">
                          {load.assigned_hours} h
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {load.assignments || 0} module(s)
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            load.assigned_hours >= 18
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : load.assigned_hours >= 14
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          )}>
                            {load.assigned_hours >= 18 ? 'Plein (18h)' : `${load.assigned_hours}h / 18h`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
