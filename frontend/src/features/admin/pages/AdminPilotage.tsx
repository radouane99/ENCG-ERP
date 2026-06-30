import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { Activity, Users, GraduationCap, Building, TrendingUp, DollarSign, BrainCircuit, Target } from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b']

export default function AdminPilotage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/pilotage/metrics')
        setData(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !data) {
    return <div className="flex h-[80vh] items-center justify-center text-muted-foreground animate-pulse font-medium">Chargement des données de pilotage...</div>
  }

  const { kpis, charts } = data

  const KPI_CARDS = [
    { title: 'Effectif Étudiant', value: kpis.total_students, icon: <Users className="w-5 h-5"/>, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { title: 'Corps Professoral', value: kpis.total_professors, icon: <GraduationCap className="w-5 h-5"/>, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { title: 'Taux de Réussite', value: `${kpis.success_rate}%`, icon: <Target className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { title: 'Budget Consommé', value: `${kpis.budget_used_percent.toFixed(1)}%`, icon: <DollarSign className="w-5 h-5"/>, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6 animate-in p-6 relative bg-muted/10 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Tableau de Bord de Pilotage
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Vue globale stratégique, ressources humaines, académiques et financières.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-card border px-4 py-2 rounded-lg shadow-sm">
           <span className="relative flex h-3 w-3 mr-1">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
           </span>
           Données en temps réel
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi, i) => (
          <div key={i} className="p-5 rounded-2xl bg-card border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">{kpi.title}</p>
              <p className="text-3xl font-black text-foreground">{kpi.value}</p>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", kpi.bg, kpi.color)}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Répartition par Filière */}
        <div className="p-5 bg-card border rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" /> Répartition des étudiants par filière
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.students_by_filiere} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40}>
                  {charts.students_by_filiere.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Admissions & Candidatures */}
        <div className="p-5 bg-card border rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Statuts des Admissions
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {charts.admissions.length === 0 ? (
              <span className="text-muted-foreground text-sm">Données insuffisantes</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.admissions}
                    cx="50%" cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    label={({ name, percent }) => {
                      const pct = typeof percent === 'number' ? percent : 0
                      return `${name} ${(pct * 100).toFixed(0)}%`
                    }}
                  >
                    {charts.admissions.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Ressources Humaines */}
        <div className="p-5 bg-card border rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-500" /> Charge d'Encadrement (Permanents vs Vacataires)
          </h3>
          <div className="h-[250px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={[
                { name: 'Permanents', count: charts.hr.permanents },
                { name: 'Vacataires (Actifs)', count: charts.hr.vacataires }
              ]} margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 13, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#f59e0b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Exécution Budgétaire */}
        <div className="p-5 bg-card border rounded-2xl shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Exécution Budgétaire (Vacations)
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 font-medium">Consommé (Payé)</span>
                <span className="font-bold text-emerald-400">{charts.finances.budget_consomme.toLocaleString('fr-FR')} MAD</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(charts.finances.budget_consomme / charts.finances.budget_alloue) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 font-medium">En Attente (Engagé)</span>
                <span className="font-bold text-amber-400">{charts.finances.en_attente.toLocaleString('fr-FR')} MAD</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3">
                <div className="bg-amber-500 h-3 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${(charts.finances.en_attente / charts.finances.budget_alloue) * 100}%` }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Budget Alloué</p>
                <p className="text-2xl font-black">{charts.finances.budget_alloue.toLocaleString('fr-FR')} MAD</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Reliquat</p>
                <p className="text-xl font-bold text-sky-400">{(charts.finances.budget_alloue - charts.finances.budget_consomme - charts.finances.en_attente).toLocaleString('fr-FR')} MAD</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
