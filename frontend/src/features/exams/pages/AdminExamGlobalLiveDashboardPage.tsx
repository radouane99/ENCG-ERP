import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Eye, ArrowLeft, RefreshCw, Users, CheckCircle2, XCircle, BarChart3, AlertTriangle, MessageCircle } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery, useMutation } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'
import { toast } from 'sonner'

export default function AdminExamGlobalLiveDashboardPage() {
  const { sessionId } = useParams()
  
  const { data: liveData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['global-live-attendance', sessionId],
    queryFn: () => examsApi.getGlobalLiveStats(Number(sessionId)),
    refetchInterval: 5000,
    enabled: !!sessionId
  })

  const stats = liveData?.data || { 
    session_name: '', 
    students: { total: 0, present: 0, absent: 0, latest_scans: [] },
    professors: { total: 0, present: 0, confirmed: 0, absent: 0, latest_confirmations: [] }
  }

  const studentProgress = stats.students.total > 0 ? Math.round((stats.students.present / stats.students.total) * 100) : 0
  const profProgress = stats.professors.total > 0 ? Math.round((stats.professors.present / stats.professors.total) * 100) : 0
  const profConfirmProgress = stats.professors.total > 0 ? Math.round((stats.professors.confirmed / stats.professors.total) * 100) : 0

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Global Live Dashboard</h1>
            <p className="text-xs text-slate-500">
              Supervision en temps réel : {stats?.session_name || 'Chargement...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} /> ACTUALISER
          </button>
          <Link to="/admin/exams/sessions" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4" /> RETOUR
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Etudiants */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#0f2863] mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Présence Étudiants
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-sm text-slate-500 font-medium mb-1">Total Convoqués</div>
              <div className="text-3xl font-bold text-slate-800">{stats.students.total}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <div className="text-sm text-emerald-600 font-medium mb-1">Présents</div>
              <div className="text-3xl font-bold text-emerald-700">{stats.students.present}</div>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
              <div className="text-sm text-rose-600 font-medium mb-1">Absents</div>
              <div className="text-3xl font-bold text-rose-700">{stats.students.absent}</div>
            </div>
          </div>
          
          <div className="mb-2 flex justify-between text-sm font-medium">
            <span className="text-slate-600">Taux de présence</span>
            <span className="text-indigo-600">{studentProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
            <div className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${studentProgress}%` }}></div>
          </div>
        </div>

        {/* Professeurs */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#0f2863] mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-500" /> Surveillants (Professeurs)
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-sm text-slate-500 font-medium mb-1">Total Affectés</div>
              <div className="text-3xl font-bold text-slate-800">{stats.professors.total}</div>
            </div>
            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
              <div className="text-sm text-teal-600 font-medium mb-1">Réception Confirmée</div>
              <div className="text-3xl font-bold text-teal-700">{stats.professors.confirmed}</div>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
              <div className="text-sm text-rose-600 font-medium mb-1">Absents (Sur Place)</div>
              <div className="text-3xl font-bold text-rose-700">{stats.professors.absent}</div>
            </div>
          </div>

          <div className="mb-2 flex justify-between text-sm font-medium">
            <span className="text-slate-600">Taux de confirmation</span>
            <span className="text-teal-600">{profConfirmProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
            <div className="bg-teal-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${profConfirmProgress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
