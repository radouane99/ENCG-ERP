import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'
import {
  Users, GraduationCap, BookOpen, Briefcase,
  TrendingUp, TrendingDown, UserCheck, RefreshCw,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react'
import api from '@shared/lib/api'

interface DashboardData {
  students: {
    total: number; active: number; new_this_month: number;
    graduated: number; suspended: number;
  };
  professors: { total: number; active: number; permanent: number; contractual: number; };
  vacataires: { total: number; pending: number; total_hours: number; };
  academic: { total_modules: number; total_filieres: number; };
  attendance_rate: number;
  enrollment_chart: { name: string; students: number }[];
  filiere_chart: { name: string; count: number }[];
  gradesCompletionRate: number;
  pendingComplaintsCount: number;
}

// Skeleton card for loading state
const SkeletonCard = () => (
  <div className="p-6 rounded-xl bg-card border shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-lg bg-muted" />
      <div className="w-16 h-5 rounded-full bg-muted" />
    </div>
    <div className="w-24 h-4 bg-muted rounded mb-2" />
    <div className="w-16 h-8 bg-muted rounded" />
  </div>
)

export default function AdminDashboard() {
  const { t } = useTranslation('common')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/dashboard/admin/stats')
      setData(res.data.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load dashboard stats', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const stats = data ? [
    {
      label: 'Total Étudiants',
      value: data.students.total.toLocaleString(),
      sub: `${data.students.active} actifs · ${data.students.new_this_month} ce mois`,
      icon: <Users className="w-6 h-6" />,
      trend: data.students.new_this_month > 0 ? `+${data.students.new_this_month} ce mois` : 'Stable',
      isUp: data.students.new_this_month > 0,
      color: 'text-blue-600 bg-blue-500/10',
    },
    {
      label: 'Professeurs',
      value: data.professors.total.toLocaleString(),
      sub: `${data.professors.active} actifs · ${data.professors.permanent} permanents`,
      icon: <GraduationCap className="w-6 h-6" />,
      trend: `${data.professors.permanent} permanents`,
      isUp: true,
      color: 'text-primary bg-primary/10',
    },
    {
      label: 'Modules & Matières',
      value: data.academic.total_modules.toLocaleString(),
      sub: `${data.academic.total_filieres} filières actives`,
      icon: <BookOpen className="w-6 h-6" />,
      trend: `${data.academic.total_filieres} filières`,
      isUp: true,
      color: 'text-purple-600 bg-purple-500/10',
    },
    {
      label: 'Vacataires',
      value: data.vacataires.total.toLocaleString(),
      sub: `${data.vacataires.pending} en attente de signature`,
      icon: <UserCheck className="w-6 h-6" />,
      trend: data.vacataires.pending > 0 ? `${data.vacataires.pending} en attente` : 'À jour',
      isUp: data.vacataires.pending === 0,
      alert: data.vacataires.pending > 0,
      color: 'text-amber-600 bg-amber-500/10',
    },
  ] : []

  const statusCards = data ? [
    { label: 'Actifs', value: data.students.active, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600 bg-green-500/10 border-green-500/20' },
    { label: 'Diplômés', value: data.students.graduated, icon: <GraduationCap className="w-5 h-5" />, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
    { label: 'Taux Complétion Notes', value: `${data.gradesCompletionRate}%`, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Réclamations (Attente)', value: data.pendingComplaintsCount, icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-500/10 border-red-500/20' },
  ] : []

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de Bord</h1>
          <p className="text-muted-foreground mt-1">
            {lastUpdated
              ? `Données mises à jour à ${lastUpdated.toLocaleTimeString('fr-MA')}`
              : 'Chargement des données en temps réel...'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat, i) => (
            <div key={i} className="p-6 rounded-xl bg-card border shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4 relative">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  stat.alert
                    ? 'text-destructive bg-destructive/10'
                    : stat.isUp
                      ? 'text-green-600 bg-green-500/10'
                      : 'text-red-600 bg-red-500/10'
                }`}>
                  {stat.alert ? <AlertCircle className="w-3 h-3 mr-1" /> : stat.isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </span>
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{stat.value}</h3>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Student Status mini-cards */}
      {!loading && data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statusCards.map((card, i) => (
            <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 ${card.color}`}>
              {card.icon}
              <div>
                <p className="text-xs font-medium opacity-70">{card.label}</p>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment Trend */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Évolution des Inscriptions</h3>
            <p className="text-sm text-muted-foreground">Nouvelles inscriptions sur les 6 derniers mois</p>
          </div>
          <div className="h-[260px] w-full">
            {loading ? (
              <div className="h-full bg-muted/30 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.enrollment_chart ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(value: any) => {
                      const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                      return [`${numericValue} étudiants`, 'Inscriptions'] as [string, string]
                    }}
                  />
                  <Area type="monotone" dataKey="students" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Students by Filière */}
        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Étudiants par Filière</h3>
            <p className="text-sm text-muted-foreground">Répartition des effectifs</p>
          </div>
          <div className="h-[260px] w-full">
            {loading ? (
              <div className="h-full bg-muted/30 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.filiere_chart ?? []} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} hide />
                  <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(value: any) => {
                      const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                      return [`${numericValue} étudiants`, 'Effectif'] as [string, string]
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Alerts and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professor breakdown */}
        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Corps Enseignant</h3>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Permanents', value: data?.professors.permanent ?? 0, icon: <Briefcase className="w-4 h-4" />, color: 'text-primary bg-primary/10' },
                { label: 'Contractuels', value: data?.professors.contractual ?? 0, icon: <GraduationCap className="w-4 h-4" />, color: 'text-amber-600 bg-amber-500/10' },
                { label: 'Vacataires (contrats)', value: data?.vacataires.total ?? 0, icon: <UserCheck className="w-4 h-4" />, color: 'text-purple-600 bg-purple-500/10' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.color}`}>{item.icon}</div>
                    <span className="font-medium text-foreground text-sm">{item.label}</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vacataire payment alerts */}
        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Alertes Vacataires</h3>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : data?.vacataires.pending === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <CheckCircle className="w-10 h-10 text-green-500 mb-2 opacity-70" />
              <p className="text-sm font-medium">Aucune alerte active</p>
              <p className="text-xs">Tous les contrats sont à jour</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10 text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{data?.vacataires.pending} contrat(s) en attente de signature</p>
                <p className="text-xs text-muted-foreground">Accédez à la page Vacataires pour traiter ces dossiers.</p>
              </div>
            </div>
          )}

          {/* Volume horaire total */}
          {!loading && data && (
            <div className="mt-4 p-4 rounded-xl bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg text-blue-600 bg-blue-500/10"><Clock className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Volume horaire total vacataires</p>
                  <p className="text-sm font-semibold text-foreground">{data.vacataires.total_hours}h prévues</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
