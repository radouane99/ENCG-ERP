import React, { useState, useEffect } from 'react';
import { Briefcase, Building2, TrendingUp, Search, Calendar, GraduationCap } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/shared/lib/api';

export default function AlumniDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/alumni/dashboard-stats');
        setStats(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#1F3A5F', '#A80A0B', '#F59E0B', '#10B981', '#6366F1'];

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Observatoire de l'Insertion Professionnelle
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivi des lauréats (Alumni), statistiques d'employabilité et cartographie des métiers.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-muted-foreground text-sm font-medium">Taux d'Insertion</div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.employment_rate}%</div>
          <div className="text-xs text-muted-foreground mt-1">+2% par rapport Ã  2025</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-muted-foreground text-sm font-medium">Salaire Moyen (Embauche)</div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.avg_starting_salary} DH</div>
          <div className="text-xs text-muted-foreground mt-1">Net Mensuel</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-muted-foreground text-sm font-medium">Délai d'Embauche</div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.avg_months_to_hire} Mois</div>
          <div className="text-xs text-muted-foreground mt-1">En moyenne après diplomation</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-muted-foreground text-sm font-medium">Répondants</div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.total_responses}</div>
          <div className="text-xs text-muted-foreground mt-1">Lauréats sondés</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-6">Répartition par Statut</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.status_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.status_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-6">Secteurs d'Activité</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.sector_distribution} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="value" fill="#1F3A5F" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats?.sector_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#A80A0B' : '#1F3A5F'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Companies List */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg">Top Recruteurs (Partenaires)</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher une entreprise..." 
              className="pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Entreprise</th>
                <th className="px-6 py-3 font-medium text-right">Nombre de Lauréats Recrutés</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats?.top_companies.map((company: any, idx: number) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {company.name.charAt(0)}
                    </div>
                    {company.name}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{company.count} lauréats</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:underline text-sm font-medium">Voir les profils</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
