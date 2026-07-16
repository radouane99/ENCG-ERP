import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Eye, Download, ArrowLeft, RefreshCw, Users, CheckCircle2, XCircle, BarChart3, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'

export default function AdminExamLiveAttendancePage() {
  const { id } = useParams()
  
  const { data: liveData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['live-attendance', id],
    queryFn: () => examsApi.getExamLiveStats(Number(id)),
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: !!id
  })

  const stats = liveData?.data || { total_students: 0, present: 0, absent: 0, latest_scans: [] }
  const scans = stats.latest_scans || []
  const progressPercentage = stats.total_students > 0 ? Math.round((stats.present / stats.total_students) * 100) : 0

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Dashboard Live Présences</h1>
            <p className="text-xs text-slate-500">
              Suivi en temps réel : {stats?.exam ? `${stats.exam.module_name} - ${stats.exam.filiere_name} - ${stats.exam.group_name}` : 'Chargement...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to={`/admin/exams/${id}/live-attendance/report`} className="h-10 px-4 rounded-xl bg-[#0f2863] hover:bg-[#1a387e] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> TÉLÉCHARGER RAPPORT PDF
          </Link>
          <Link to="/admin/exams" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4" /> RETOUR AUX EXAMENS
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <span className={cn("w-2 h-2 rounded-full", isFetching ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse")}></span>
            Actualisation en temps réel (toutes les 5s)
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
            <Users className="absolute right-4 bottom-4 w-16 h-16 text-slate-200 opacity-50" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">TOTAL ÉTUDIANTS</p>
            <p className="text-4xl font-black text-slate-800 relative z-10">{stats.total_students}</p>
          </div>
          
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden">
            <CheckCircle2 className="absolute right-4 bottom-4 w-16 h-16 text-emerald-200 opacity-50" />
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 relative z-10">PRÉSENTS</p>
            <p className="text-4xl font-black text-emerald-600 relative z-10">{stats.present}</p>
          </div>
          
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100 relative overflow-hidden">
            <XCircle className="absolute right-4 bottom-4 w-16 h-16 text-red-200 opacity-50" />
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-2 relative z-10">ABSENTS / EN ATTENTE</p>
            <p className="text-4xl font-black text-red-600 relative z-10">{stats.absent}</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden">
            <BarChart3 className="absolute right-4 bottom-4 w-16 h-16 text-blue-200 opacity-50" />
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2 relative z-10">TAUX DE PRÉSENCE</p>
            <p className="text-4xl font-black text-blue-600 relative z-10">{progressPercentage}%</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PROGRESSION DU CHECK-IN</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{progressPercentage}% complété</p>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0f2863]">Journal des scans (Flux en direct)</h2>
          <button className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline flex items-center gap-1">
            Rafraîchir la liste
          </button>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 font-bold">ÉTUDIANT</th>
              <th className="px-6 py-4 font-bold">STATUT</th>
              <th className="px-6 py-4 font-bold">HEURE DE SCAN</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                  Chargement des scans...
                </td>
              </tr>
            ) : scans.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Aucun scan enregistré pour le moment.
                </td>
              </tr>
            ) : (
              scans.map((scan: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <td className="px-6 py-4 font-bold text-slate-800">{scan.student_name}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full w-fit">
                      <CheckCircle2 className="w-3 h-3" /> Présent
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                    {new Date(scan.scan_time).toLocaleTimeString('fr-FR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
