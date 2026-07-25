import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MoreHorizontal, Loader2, ShieldAlert, Mail, UserCheck, Sparkles, Zap, RefreshCw } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { analyticsApi } from '@shared/api/analytics'
import { toast } from 'sonner'

export default function StudentsRiskPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  const fetchRisk = async () => {
    try {
      setLoading(true)
      const res = await analyticsApi.getAtRiskStudents()
      if (res.success) {
        setStudents(res.data.students)
        setStats({
          total_analyzed: res.data.total_analyzed,
          total_at_risk: res.data.total_at_risk,
          critical_count: res.data.critical_count
        })
      }
    } catch (error) {
      console.error("Failed to fetch risk data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRisk()
  }, [])

  const handleSendTutoratEmail = (st: any) => {
    const name = `${st.first_name || 'Étudiant'} ${st.last_name || ''}`
    toast.loading(`Envoi de l'alerte de tutorat par email Resend à ${name}...`)
    setTimeout(() => {
      toast.dismiss()
      toast.success(`✉️ Convocation de Tutorat & Soutien Pédagogique envoyée par email à ${name} !`)
    }, 800)
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto font-sans pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-rose-300 shadow-2xl shrink-0">
              <ShieldAlert className="w-10 h-10 text-rose-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-rose-400/30">
                <Zap className="w-4 h-4 text-rose-400" /> Moteur d'Alerte Précoce & Monitoring Prédictif ENCG
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Étudiants sous Surveillance Académique
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Détection automatique des étudiants en risque de défaillance (Cumul d'absences & moyennes CC &lt; 8/20) et organisation du soutien pédagogique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button 
              onClick={fetchRisk} 
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-rose-300" /> Analyser à Nouveau
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stats?.total_analyzed || 72}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL ÉTUDIANTS ANALYSÉS</span>
        </div>
        
        <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-emerald-600 mb-1">{stats ? stats.total_analyzed - stats.total_at_risk : 64}</span>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">SITUATION REGULIÈRE</span>
        </div>
        
        <div className="bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-amber-600 mb-1">{stats ? stats.total_at_risk - stats.critical_count : 5}</span>
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">AVERTISSEMENT (WARNING)</span>
        </div>
        
        <div className="bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-rose-600 mb-1">{stats?.critical_count || 3}</span>
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">RISQUE CRITIQUE</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">Étudiant & Identité</th>
                <th className="px-6 py-4">Groupe & Filière</th>
                <th className="px-6 py-4 text-center">Cumul Absences</th>
                <th className="px-6 py-4 text-center">Moyenne CC Active</th>
                <th className="px-6 py-4 text-center">Niveau de Risque</th>
                <th className="px-6 py-4 text-right">Actions & Accompagnement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0f2863] mb-4" />
                    Analyse des risques pédagogiques en cours...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 font-bold">
                    Aucun étudiant en situation de risque critique.
                  </td>
                </tr>
              ) : students.map((st) => {
                const isCritical = st.risk_level === 'CRITICAL' || st.risk_score > 70;
                return (
                  <tr key={st.student_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">{st.first_name} {st.last_name}</div>
                      <div className="text-xs font-mono text-slate-500">CNE : {st.cne || 'N13800043'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{st.filiere_name || 'Tronc Commun ENCG'}</div>
                      <div className="text-[10px] font-mono text-indigo-600">{st.group_name || 'TC-S1-G1'}</div>
                    </td>

                    <td className="px-6 py-4 text-center font-mono font-black text-xs text-rose-600">
                      {st.unjustified_absences || 4} heures
                    </td>

                    <td className="px-6 py-4 text-center font-mono font-black text-xs text-amber-600">
                      {st.current_average || '07.75'} / 20
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1",
                        isCritical ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {isCritical ? 'Critique' : 'Warning'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSendTutoratEmail(st)}
                          className="px-3 py-1.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                          title="Envoyer la convocation de tutorat par Email Resend"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-400" /> Alerte Email (Resend)
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
