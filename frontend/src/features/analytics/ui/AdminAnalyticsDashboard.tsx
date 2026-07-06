import React from 'react';
import { useAdminAnalytics } from '../api/analyticsApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']; // Tailwind colors: blue, green, amber, red

export const AdminAnalyticsDashboard: React.FC = () => {
  const { data, isLoading, isError } = useAdminAnalytics();

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="text-xl text-gray-500 font-medium animate-pulse tracking-wide">Chargement des performances...</div></div>;
  if (isError || !data) return <div className="p-8 text-red-500 bg-red-50 rounded-xl m-6 border border-red-100">Erreur lors du chargement des analytiques.</div>;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vue d'ensemble ENCG-ERP</h1>
        <p className="text-gray-500 mt-2 font-medium">Métriques de performance en temps réel et tendances analytiques.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Demandes Documents</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
          </div>
          <div className="mt-4 text-4xl font-black text-gray-800">{data.kpis.total_requests.toLocaleString()}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Demandes en Attente</span>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
          </div>
          <div className="mt-4 text-4xl font-black text-amber-500">{data.kpis.pending_requests.toLocaleString()}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Étudiants Actifs</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
          </div>
          <div className="mt-4 text-4xl font-black text-emerald-600">{data.kpis.active_students.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Trends Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/60">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Tendances des Demandes (6 mois)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.document_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px'}} 
                  cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '13px', color: '#64748b'}}/>
                <Line type="monotone" dataKey="total" name="Reçues" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: 'white'}} activeDot={{r: 7, strokeWidth: 0}} />
                <Line type="monotone" dataKey="ready" name="Traitées" stroke="#10B981" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: 'white'}} activeDot={{r: 7, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/60">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Répartition Projets Académiques</h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.project_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="type"
                  stroke="none"
                >
                  {data.project_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  itemStyle={{color: '#1f2937'}}
                />
                <Legend 
                  iconType="circle" 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{fontSize: '14px', fontWeight: '500'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
