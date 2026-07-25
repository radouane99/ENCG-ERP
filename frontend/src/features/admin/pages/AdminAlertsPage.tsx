import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell, AlertTriangle, CheckCircle2, Clock, Users, BookOpen, Mail, FileText,
  Sparkles, Loader2, RefreshCw, ChevronRight, XCircle, TrendingDown, Zap, Eye
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

interface Alert {
  id: number
  type: 'CRITIQUE' | 'AVERTISSEMENT' | 'INFO'
  category: string
  title: string
  description: string
  count?: number
  link?: string
}

export default function AdminAlertsPage() {
  const { t } = useTranslation(['admin', 'common'])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/alerts')
        return res.data
      } catch {
        return null
      }
    },
    refetchInterval: 30000, // auto-refresh every 30s
  })

  const alerts: Alert[] = data?.alerts || []
  const stats = data?.stats || {}

  const critiques = alerts.filter(a => a.type === 'CRITIQUE')
  const avertissements = alerts.filter(a => a.type === 'AVERTISSEMENT')
  const infos = alerts.filter(a => a.type === 'INFO')

  const getBadgeColor = (type: string) => {
    if (type === 'CRITIQUE') return 'bg-rose-50 text-rose-600 border-rose-200'
    if (type === 'AVERTISSEMENT') return 'bg-amber-50 text-amber-600 border-amber-200'
    return 'bg-blue-50 text-blue-600 border-blue-200'
  }

  const getIcon = (type: string) => {
    if (type === 'CRITIQUE') return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
    if (type === 'AVERTISSEMENT') return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
    return <Bell className="w-5 h-5 text-blue-500 shrink-0" />
  }

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <Bell className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-rose-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Monitoring Temps Réel — Rafraîchissement 30s
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Tableau de Bord Alertes Centralisé
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-3xl">
                Hub de surveillance en temps réel : étudiants en décrochage, notes manquantes, documents en attente, convocations non envoyées.
              </p>
            </div>
          </div>

          <button
            onClick={() => { refetch(); toast.success('Alertes actualisées !') }}
            disabled={isFetching}
            className="shrink-0 flex items-center gap-3 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            Actualiser
          </button>
        </div>

        {/* KPI cards */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-400/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 block">ALERTES CRITIQUES</span>
            <span className="text-2xl font-black text-rose-300 font-mono mt-1 block">{stats.critiques ?? critiques.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">AVERTISSEMENTS</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">{stats.avertissements ?? avertissements.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">ÉTUDIANTS À RISQUE</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{stats.students_at_risk ?? '—'}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">DOCS EN ATTENTE</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">{stats.pending_documents ?? '—'}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-16 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-[2.5rem] border border-emerald-200 dark:border-emerald-900/50 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="font-black text-emerald-800 dark:text-emerald-200 text-xl">Aucune Alerte Active 🎉</h2>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium max-w-md mx-auto">
            Tous les systèmes fonctionnent normalement. Aucun étudiant en décrochage, aucune note manquante, aucun document en retard.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Critiques */}
          {critiques.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black text-rose-600 flex items-center gap-2 uppercase tracking-wider">
                <XCircle className="w-5 h-5" /> Alertes Critiques ({critiques.length})
              </h2>
              {critiques.map(alert => (
                <AlertCard key={alert.id} alert={alert} getIcon={getIcon} getBadgeColor={getBadgeColor} />
              ))}
            </div>
          )}

          {/* Avertissements */}
          {avertissements.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black text-amber-600 flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-5 h-5" /> Avertissements ({avertissements.length})
              </h2>
              {avertissements.map(alert => (
                <AlertCard key={alert.id} alert={alert} getIcon={getIcon} getBadgeColor={getBadgeColor} />
              ))}
            </div>
          )}

          {/* Infos */}
          {infos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black text-blue-600 flex items-center gap-2 uppercase tracking-wider">
                <Bell className="w-5 h-5" /> Notifications ({infos.length})
              </h2>
              {infos.map(alert => (
                <AlertCard key={alert.id} alert={alert} getIcon={getIcon} getBadgeColor={getBadgeColor} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertCard({ alert, getIcon, getBadgeColor }: any) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border rounded-[2rem] p-5 shadow-sm flex items-start gap-4 hover:shadow-md transition-all",
      alert.type === 'CRITIQUE'
        ? "border-rose-200 dark:border-rose-900/50"
        : alert.type === 'AVERTISSEMENT'
          ? "border-amber-200 dark:border-amber-900/50"
          : "border-slate-200 dark:border-slate-800"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
        alert.type === 'CRITIQUE' ? "bg-rose-50 dark:bg-rose-950/40" : alert.type === 'AVERTISSEMENT' ? "bg-amber-50 dark:bg-amber-950/40" : "bg-blue-50 dark:bg-blue-950/40"
      )}>
        {getIcon(alert.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border", getBadgeColor(alert.type))}>
            {alert.type}
          </span>
          <span className="text-[10px] font-bold text-slate-400">{alert.category}</span>
        </div>
        <h3 className="font-black text-sm text-slate-900 dark:text-white">{alert.title}</h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{alert.description}</p>
      </div>

      {alert.count !== undefined && (
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center shrink-0">
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono block">{alert.count}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase">cas</span>
        </div>
      )}
    </div>
  )
}
