import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Activity, Users, GraduationCap, Building, TrendingUp, DollarSign, BrainCircuit, Target, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'

// Enhanced UI/UX Pro Max Color Palette
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b']

export default function AdminPilotage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const res = await api.get('/dashboard/pilotage/metrics')
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4 animate-in fade-in">
        <div className="w-12 h-12 border-4 border-[hsl(var(--color-primary))/20] border-t-[hsl(var(--color-primary))] rounded-full animate-spin"></div>
        <p className="text-[hsl(var(--muted-foreground))] font-bold">{isRtl ? 'جاري تحميل لوحة القيادة...' : 'Chargement du Centre de Commandement...'}</p>
      </div>
    )
  }

  const { kpis, charts } = data

  const KPI_CARDS = [
    { title: isRtl ? 'إجمالي الطلاب' : 'Effectif Étudiant', value: kpis.total_students || 0, icon: <Users size={24}/>, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: isRtl ? 'هيئة التدريس' : 'Corps Professoral', value: kpis.total_professors || 0, icon: <GraduationCap size={24}/>, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: isRtl ? 'نسبة النجاح' : 'Taux de Réussite', value: `${kpis.success_rate || 0}%`, icon: <Target size={24}/>, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: isRtl ? 'الميزانية المستهلكة' : 'Budget Consommé', value: `${(kpis.budget_used_percent || 0).toFixed(1)}%`, icon: <DollarSign size={24}/>, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Premium Header */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -end-10 w-40 h-40 bg-[hsl(var(--color-primary))/5] rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-[hsl(var(--color-primary))/10] rounded-2xl flex items-center justify-center border border-[hsl(var(--color-primary))/20]">
            <Activity className="w-8 h-8 text-[hsl(var(--color-primary))]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[hsl(var(--foreground))] mb-1 tracking-tight">
              {isRtl ? 'لوحة القيادة الإستراتيجية' : 'Centre de Commandement (BI)'}
            </h1>
            <p className="text-[hsl(var(--muted-foreground))] font-medium text-sm">
              {isRtl ? 'رؤية شاملة للموارد البشرية، الأكاديمية والمالية.' : 'Vue globale stratégique : Ressources Humaines, Académiques et Financières.'}
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-2 px-4 shadow-sm">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {isRtl ? 'بيانات حية' : 'Live Data'}
          </Badge>
          <Button variant="outline" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={fetchData}>
            {isRtl ? 'تحديث' : 'Rafraîchir'}
          </Button>
        </div>
      </div>

      {/* Primary KPIs - Glassmorphism Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {KPI_CARDS.map((kpi, i) => (
          <div key={i} className="p-6 rounded-[2rem] bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm flex items-center justify-between hover:shadow-md hover:border-[hsl(var(--color-primary))/30] transition-all group">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-widest">{kpi.title}</p>
              <p className="text-4xl font-black text-[hsl(var(--foreground))] tracking-tight">{kpi.value}</p>
            </div>
            <div className={cn("w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-transform group-hover:scale-110", kpi.bg, kpi.color)}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Répartition par Filière */}
        <div className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-[hsl(var(--foreground))]">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Building size={18} /></div>
            {isRtl ? 'توزيع الطلاب حسب الشعبة' : 'Répartition des étudiants par filière'}
          </h3>
          <div className="h-[300px] w-full">
            {charts.students_by_filiere?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.students_by_filiere} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted)/20)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} barSize={40}>
                    {charts.students_by_filiere.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-[hsl(var(--muted-foreground))] text-sm font-bold">{isRtl ? 'لا توجد بيانات كافية' : 'Données insuffisantes'}</div>
            )}
          </div>
        </div>

        {/* Chart 2: Admissions & Candidatures */}
        <div className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-[hsl(var(--foreground))]">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><TrendingUp size={18} /></div>
            {isRtl ? 'حالة القبول والترشيحات' : 'Statuts des Admissions'}
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {charts.admissions?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.admissions}
                    cx="50%" cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    stroke="none"
                  >
                    {charts.admissions.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[hsl(var(--muted-foreground))] text-sm font-bold">{isRtl ? 'لا توجد بيانات كافية' : 'Données insuffisantes'}</div>
            )}
          </div>
        </div>

        {/* Chart 3: Ressources Humaines (Dynamic CSS Progress) */}
        <div className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-[hsl(var(--foreground))]">
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><BrainCircuit size={18} /></div>
            {isRtl ? 'طاقة التأطير (أساتذة vs زائرون)' : 'Charge d\'Encadrement (Permanents vs Vacataires)'}
          </h3>
          
          <div className="space-y-6 mt-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="font-bold text-[hsl(var(--foreground))]">{isRtl ? 'الأساتذة الدائمون' : 'Professeurs Permanents'}</span>
                <span className="text-xl font-black text-purple-600">{charts.hr?.permanents || 0}</span>
              </div>
              <div className="h-4 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="font-bold text-[hsl(var(--foreground))]">{isRtl ? 'الأساتذة الزائرون (نشطون)' : 'Professeurs Vacataires (Actifs)'}</span>
                <span className="text-xl font-black text-blue-600">{charts.hr?.vacataires || 0}</span>
              </div>
              <div className="h-4 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Exécution Budgétaire */}
        <div className="p-6 bg-gradient-to-br from-[#1F3A5F] to-[#2A4D7C] border border-[#1F3A5F] rounded-[2rem] shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 end-0 opacity-10 pointer-events-none p-6">
            <DollarSign size={150} />
          </div>
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 relative z-10">
            <div className="p-2 bg-white/10 rounded-lg"><DollarSign size={18} /></div>
            {isRtl ? 'التنفيذ الميزانياتي للأساتذة الزائرين' : 'Exécution Budgétaire (Vacataires)'}
          </h3>
          
          <div className="mt-8 relative z-10">
            <div className="mb-4">
              <p className="text-white/70 text-sm font-bold uppercase tracking-wider mb-1">{isRtl ? 'الميزانية الإجمالية المخصصة' : 'Budget Global Alloué'}</p>
              <p className="text-4xl font-black">{new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(charts.finances?.budget_alloue || 0)}</p>
            </div>
            
            <div className="space-y-4 mt-8">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                  <span className="font-bold">{isRtl ? 'المدفوعات المنجزة' : 'Montant Consommé (Payé)'}</span>
                </div>
                <span className="font-black text-emerald-400">{new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(charts.finances?.budget_consomme || 0)}</span>
              </div>
              
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
                  <span className="font-bold">{isRtl ? 'في انتظار الدفع' : 'En attente de paiement'}</span>
                </div>
                <span className="font-black text-amber-400">{new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(charts.finances?.en_attente || 0)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
