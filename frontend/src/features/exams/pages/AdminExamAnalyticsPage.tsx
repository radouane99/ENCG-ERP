import { BarChart3, TrendingUp, Users, FileText, Target, Award, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export default function AdminExamAnalyticsPage() {
  const { data: analyticsData } = useQuery({
    queryKey: ['admin-exam-analytics'],
    queryFn: () => api.get('/exams/analytics').then(res => res.data.data)
  })

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(res => res.data.data)
  })

  const chartData = analyticsData?.chart ?? []
  const stats = analyticsData?.stats ?? null
  const criticalModules = analyticsData?.critical_modules || []

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] flex items-center gap-3">
            📈 Statistiques et Pilotage des Examens
          </h1>
          <p className="text-sm text-slate-500 mt-1">Analyse des performances, taux de réussite et présence aux épreuves</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 outline-none hover:bg-slate-50 transition-colors cursor-pointer shadow-sm">
            {academicYears?.map((ay: any) => (
              <option key={ay.id} value={ay.id}>{ay.name || ay.year}</option>
            ))}
          </select>
          <button className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
            EXPORTER RAPPORT
          </button>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-800 mb-1">{stats.success_rate}%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAUX DE RÉUSSITE GLOBAL</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-800 mb-1">{stats.attendance_rate}%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAUX DE PRÉSENCE</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-800 mb-1">{stats.overall_average} <span className="text-lg text-slate-400 font-medium">/ 20</span></p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MOYENNE GÉNÉRALE</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-800 mb-1">{stats.scheduled_exams}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ÉPREUVES PLANIFIÉES</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Chart Area */}
        <div className="col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Évolution des Moyennes par Département
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><div className="w-3 h-3 rounded-full bg-blue-500"></div> S6</span>
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><div className="w-3 h-3 rounded-full bg-indigo-200"></div> S7</span>
            </div>
          </div>
          
          {/* Dynamic Chart rendering */}
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {chartData.map((d: any, idx: number) => (
              <div key={idx} className="w-full flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center gap-1 h-48 relative">
                  <div className={`w-8 bg-blue-500 rounded-t-lg group-hover:opacity-80 transition-opacity`} style={{ height: `${d.s6}%` }}></div>
                  <div className={`w-8 bg-indigo-200 rounded-t-lg group-hover:opacity-80 transition-opacity`} style={{ height: `${d.s7}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-500">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modules critiques */}
        <div className="col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" /> Modules Critiques
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">Matières avec un taux d'échec supérieur à 40% nécessitant une attention pédagogique.</p>
          
          <div className="space-y-4 flex-1">
            {criticalModules.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400 font-medium">Aucun module critique détecté</div>
            ) : (
              criticalModules.map((cm: any) => (
                <div key={cm.id} className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-rose-900 text-sm truncate max-w-[200px]" title={cm.name}>{cm.name}</h4>
                    <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">{cm.failure_rate}% Échec</span>
                  </div>
                  <p className="text-xs font-medium text-rose-700 mb-2">{cm.context}</p>
                  <div className="w-full h-1.5 bg-rose-200 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${cm.failure_rate}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="w-full py-3 mt-4 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
            VOIR TOUS LES MODULES
          </button>
        </div>

      </div>

    </div>
  )
}
