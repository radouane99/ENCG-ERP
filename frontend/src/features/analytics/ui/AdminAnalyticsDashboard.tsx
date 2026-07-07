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
  Activity
} from 'lucide-react';
import { StatCard } from "@shared/components/ui";

const COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316'];

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
      setError(err.response?.data?.message || 'Erreur lors du chargement des analytiques.');
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
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p>Chargement des statistiques en temps réel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-600 shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-bold">Erreur de chargement</h3>
          <p className="mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Analytique</h1>
          <p className="text-gray-500">Vue d'ensemble des métriques clés de l'établissement</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Étudiants Actifs"
          value={data.student_activity.total_active}
          icon={Users}
          description="Inscrits cette année"
          trend="+5.2%"
          trendUp={true}
          color="blue"
        />
        <StatCard
          title="Demandes en Attente"
          value={data.document_requests.pending_count}
          icon={FileText}
          description="Documents à traiter"
          trend="-12%"
          trendUp={true}
          color="amber"
        />
        <StatCard
          title="Projets Actifs"
          value={data.academic_projects.active_count}
          icon={Briefcase}
          description="Stages & PFE en cours"
          trend="+18%"
          trendUp={true}
          color="purple"
        />
        <StatCard
          title="Taux d'Achèvement"
          value={`${data.academic_projects.completion_rate}%`}
          icon={TrendingUp}
          description="Des projets académiques"
          trend="+2.1%"
          trendUp={true}
          color="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Document Requests Trend */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Tendance des Demandes (Docs)</h3>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.document_requests.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Répartition des Projets</h3>
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="flex h-72 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.academic_projects.type_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.academic_projects.type_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students by Filiere */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Répartition des Étudiants par Filière</h3>
            <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.student_activity.filiere_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" name="Étudiants" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {data.student_activity.filiere_breakdown.map((entry, index) => (
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
