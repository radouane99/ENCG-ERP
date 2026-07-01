import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MoreHorizontal, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { analyticsApi } from '@shared/api/analytics'

export default function StudentsRiskPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchRisk = async () => {
      try {
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
    fetchRisk()
  }, [])

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-center mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic flex items-center gap-2">
          🚨 Étudiants à Risque <span className="text-blue-600 font-medium">(Predictive Monitoring)</span>
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL ÉTUDIANTS */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm text-center">
          <span className="text-3xl font-black text-slate-800 mb-1">{stats?.total_analyzed || 0}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL ANALYSÉS</span>
        </div>
        
        {/* NORMAL */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm text-center">
          <span className="text-3xl font-black text-emerald-600 mb-1">{stats ? stats.total_analyzed - stats.total_at_risk : 0}</span>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">NORMAL</span>
        </div>
        
        {/* À SURVEILLER */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm text-center">
          <span className="text-3xl font-black text-amber-600 mb-1">{stats ? stats.total_at_risk - stats.critical_count : 0}</span>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">WARNING</span>
        </div>
        
        {/* RISQUE PÉDAGOGIQUE */}
        <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm text-center">
          <span className="text-3xl font-black text-red-500 mb-1">{stats?.critical_count || 0}</span>
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">CRITICAL</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-6 overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FILTRER PAR RISQUE</label>
          <select className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-48 appearance-none bg-no-repeat bg-right" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65em auto', backgroundPosition: 'right 1rem center' }}>
            <option>Tous les risques</option>
          </select>
          <button className="px-6 py-2.5 bg-[#0f2863] text-white font-bold rounded-2xl hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wider shadow-sm">
            FILTRER
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-4">ETUDIANT</th>
                <th className="px-4 py-4">GROUPE & FILIERE</th>
                <th className="px-4 py-4 text-center">ABSENCES (NJ)</th>
                <th className="px-4 py-4 text-center">MOYENNE ACTIVE</th>
                <th className="px-4 py-4 text-center">NIVEAU DE RISQUE</th>
                <th className="px-4 py-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    Analyse des risques en cours par IA...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">Aucun étudiant à risque détecté.</td>
                </tr>
              ) : students.map((student) => (
                <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-800 text-sm">{student.first_name} {student.last_name}</div>
                    <div className="text-[10px] text-slate-400">N° {student.student_number}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-800 text-xs">Score IA: {student.risk_score}/100</div>
                    <div className="text-[10px] text-red-500">{student.risk_factors.join(' | ')}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={cn("font-bold", student.absences > 0 ? "text-red-500" : "text-slate-400")}>
                      {student.absences}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-slate-700">
                    {student.cc_average}/20
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", 
                      student.category === 'CRITICAL' ? "text-red-600 bg-red-50 border-red-200" : "text-amber-600 bg-amber-50 border-amber-200"
                    )}>
                      {student.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Link to={`/admin/students/${student.student_id}`} className="text-blue-500 hover:text-blue-700 transition-colors font-bold text-xs">
                      VOIR PROFIL
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
