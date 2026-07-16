import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, GraduationCap, Percent,
  Wallet, Award, TrendingUp, BarChart3, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import api from '@/shared/lib/api';
import { useAuthStore } from '@/stores/authStore';

const trendData = [
  { year: '2020', rate: 85 },
  { year: '2021', rate: 86.5 },
  { year: '2022', rate: 89 },
  { year: '2023', rate: 93 },
  { year: '2024', rate: 96.4 },
];

export default function ExecutiveDashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['executive-stats'],
    queryFn: () => api.get('/dashboard/executive/stats').then(res => res.data.data),
  });

  if (isLoading || !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = stats.kpis || {};
  const charts = stats.charts || {};
  const finances = charts.finances || { budget_consomme: 0, budget_used_percent: 0 };
  const topFilieres = charts.students_by_filiere || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Direction / Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble stratégique de l'institution.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-primary/20 transition-all">
          <Building2 className="w-4 h-4" /> Rapport Mensuel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary to-[#7D0809] rounded-3xl p-6 text-foreground shadow-xl shadow-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-foreground/60 text-xs font-bold uppercase tracking-widest mb-1">Total Étudiants</p>
              <h3 className="text-4xl font-black">{kpis.total_students || 0}</h3>
            </div>
            <Users className="w-8 h-8 text-foreground/20" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Corps Professoral</p>
              <h3 className="text-3xl font-bold text-foreground">{kpis.total_professors || 0}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <GraduationCap className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-indigo-500">Global</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Taux de Réussite</p>
              <h3 className="text-3xl font-bold text-foreground">{kpis.success_rate || 0}%</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Percent className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Taux d'Abandon</p>
              <h3 className="text-3xl font-bold text-foreground">{kpis.dropout_rate || 0}%</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-foreground">Évolution de l'Insertion</h3>
              <p className="text-xs text-muted-foreground">Taux de diplômés en poste après 6 mois</p>
            </div>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A80A0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A80A0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} />
                <YAxis domain={[70, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#A80A0B" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-foreground">
              <Wallet className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-lg">Finances & Vacations</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Budget Utilisé</span>
                  <span className="font-bold text-foreground">{Math.round(kpis.budget_used_percent || 0)}%</span>
                </div>
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${kpis.budget_used_percent || 0}%` }} />
                </div>
              </div>

              <div className="p-4 bg-muted/50/50 rounded-2xl border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Coût des Vacations</p>
                <p className="text-2xl font-bold text-foreground">{Number(finances.budget_consomme || 0).toLocaleString('fr-MA')} <span className="text-sm font-medium text-muted-foreground">MAD</span></p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Répartition Étudiants
            </h3>
            <div className="space-y-3">
              {topFilieres.map((f: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50/30 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono font-bold text-xs">{idx + 1}.</span>
                    <span className="font-bold text-sm text-foreground">{f.name}</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-600 font-bold px-2 py-1 rounded text-xs">
                    {f.value} Étudiants
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
