import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, BookOpen, Clock, FileEdit, CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/shared/lib/api';
import { useAuthStore } from '@/stores/authStore';

const attendanceData = [
  { module: 'Marketing', presence: 85 },
  { module: 'Comptabilitï¿½', presence: 92 },
  { module: 'Finance', presence: 78 },
];

const ProfessorDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-professor-stats'],
    queryFn: () => api.get('/dashboard/professor/stats').then(r => r.data.data),
    placeholderData: {
      modules_taught: 3,
      total_students: 120,
      pending_grades: 45,
      next_class: {
        module: 'Marketing Stratï¿½gique',
        time: '14:00 - 16:00',
        room: 'Salle 12'
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Espace Professeur ðŸ‘‹</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Bienvenue, Prof. {user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-muted/50 border border-border p-5 relative overflow-hidden">
          <p className="text-muted-foreground text-xs font-medium uppercase">Modules Assignï¿½s</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats?.modules_taught}</p>
          <BookOpen className="absolute right-[-10px] bottom-[-10px] text-blue-500/10" size={80} />
        </div>
        <div className="rounded-2xl bg-muted/50 border border-border p-5 relative overflow-hidden">
          <p className="text-muted-foreground text-xs font-medium uppercase">ï¿½tudiants</p>
          <p className="text-3xl font-bold text-indigo-400 mt-1">{stats?.total_students}</p>
          <Users className="absolute right-[-10px] bottom-[-10px] text-indigo-500/10" size={80} />
        </div>
        <div className="rounded-2xl bg-muted/50 border border-border p-5 relative overflow-hidden">
          <p className="text-muted-foreground text-xs font-medium uppercase">Notes en attente</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">{stats?.pending_grades}</p>
          <FileEdit className="absolute right-[-10px] bottom-[-10px] text-amber-500/10" size={80} />
        </div>
        <div className="rounded-2xl bg-muted/50 border border-border p-5 relative overflow-hidden">
          <p className="text-muted-foreground text-xs font-medium uppercase">Sï¿½ances Validï¿½es</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">12</p>
          <CheckCircle className="absolute right-[-10px] bottom-[-10px] text-emerald-500/10" size={80} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-muted/50 border border-border p-5">
          <h3 className="text-foreground font-semibold mb-4">Assiduitï¿½ par Module</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} />
              <YAxis dataKey="module" type="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} width={100} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="presence" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-muted/50 border border-border p-5">
          <h3 className="text-foreground font-semibold mb-4">Prochain Cours</h3>
          {stats?.next_class && (
            <div className="bg-muted/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2 text-indigo-400">
                <Clock size={18} />
                <span className="font-medium">{stats.next_class.time}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.next_class.module}</p>
              <p className="text-muted-foreground text-sm mt-1">Salle: {stats.next_class.room}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
