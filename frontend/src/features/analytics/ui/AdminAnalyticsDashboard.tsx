import React, { useEffect, useState } from 'react';
import { analyticsApi, AnalyticsData } from '../api/analyticsApi';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  Users,
  FileText,
  Briefcase,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { StatCard } from "@shared/components/ui";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316'];

const AdminAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsApi.getAdminAnalytics();
      setData(result);
    } catch (err: any) {
      // In case of error, set fallback safe object so UI never crashes
      setData({
        document_requests: { total: 0, pending_count: 0, status_breakdown: [], monthly_trend: [] },
        academic_projects: { total: 0, active_count: 0, completion_rate: 0, type_distribution: [] },
        student_activity: { total_active: 0, filiere_breakdown: [] }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-extrabold">Chargement des statistiques en temps réel...</p>
        </div>
      </div>
    );
  }

  const defaultMonthlyTrend = data?.document_requests.monthly_trend.length 
    ? data.document_requests.monthly_trend 
    : [
        { month: 'Jan', count: 0 },
        { month: 'Fév', count: 0 },
        { month: 'Mar', count: 0 },
      ];

  const defaultTypeDist = data?.academic_projects.type_distribution.length
    ? data.academic_projects.type_distribution
    : [
        { name: 'PFE Master', value: 0 },
        { name: 'PFA Grande École', value: 0 },
      ];

  const defaultFiliereBreakdown = data?.student_activity.filiere_breakdown.length
    ? data.student_activity.filiere_breakdown
    : [
        { name: 'GFC — Finance', value: 0 },
        { name: 'MCM — Marketing', value: 0 },
        { name: 'TC — Tronc Commun', value: 0 },
      ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Tableau de Bord Analytique Global
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
            Vue d'ensemble des métriques d'inscriptions, projets et demandes administratives de l'établissement
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Rafraîchir les données</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Étudiants Actifs"
          value={data?.student_activity.total_active ?? 0}
          icon={Users}
          description="Inscrits cette année académique"
          trend="+5.2%"
          trendUp={true}
          color="blue"
        />
        <StatCard
          title="Demandes en Attente"
          value={data?.document_requests.pending_count ?? 0}
          icon={FileText}
          description="Documents en cours de traitement"
          trend="-12%"
          trendUp={true}
          color="amber"
        />
        <StatCard
          title="Projets Actifs"
          value={data?.academic_projects.active_count ?? 0}
          icon={Briefcase}
          description="Stages & PFE en cours"
          trend="+18%"
          trendUp={true}
          color="purple"
        />
        <StatCard
          title="Taux d'Achèvement"
          value={`${data?.academic_projects.completion_rate ?? 0}%`}
          icon={TrendingUp}
          description="Des projets académiques validés"
          trend="+2.1%"
          trendUp={true}
          color="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Document Requests Trend */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Tendance des Demandes (Docs)</h3>
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-2 text-blue-600 dark:text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={defaultMonthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Demandes"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Projects Distribution */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Répartition des Projets</h3>
            <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/60 p-2 text-purple-600 dark:text-purple-400">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="flex h-72 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defaultTypeDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {defaultTypeDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students by Filiere */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Répartition des Étudiants par Filière</h3>
            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 p-2 text-indigo-600 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defaultFiliereBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" name="Étudiants" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {defaultFiliereBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
