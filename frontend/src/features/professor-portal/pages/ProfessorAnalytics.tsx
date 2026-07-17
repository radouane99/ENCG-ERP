import React from 'react';
import { BarChart3, AlertTriangle, TrendingDown, BellRing, Users, Activity } from 'lucide-react';
import { cn } from '@shared/lib/utils';

import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

export default function ProfessorAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['professor-analytics'],
    queryFn: async () => {
      const res = await api.get('/professor-portal/analytics');
      return res.data;
    }
  });

  const atRiskStudents = analytics?.atRiskStudents || [];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-[#003a8c]" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4B] italic">Analytique Prédictive & Engagement</h1>
          <p className="text-sm text-white/50">Anticipez les difficultés et analysez le comportement de vos étudiants.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-[#001A4B]">Taux de participation (Heatmap)</h2>
              <select className="bg-white/[0.02] border-none text-sm font-bold rounded-lg px-4 py-2 outline-none">
                <option>Génie Informatique - S4</option>
                <option>Marketing - S6</option>
              </select>
            </div>
            
            {/* Heatmap */}
            <div className="space-y-4">
              {['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'].map((week, wIdx) => (
                <div key={wIdx} className="flex items-center gap-4">
                  <div className="w-20 text-xs font-bold text-gray-400">{week}</div>
                  <div className="flex-1 flex gap-1 h-8">
                    {Array.from({ length: 15 }).map((_, dIdx) => {
                      // Random opacity for heatmap effect
                      const op = Math.random();
                      const bgColor = op > 0.7 ? 'bg-emerald-500' : op > 0.4 ? 'bg-emerald-300' : 'bg-emerald-100';
                      return (
                        <div key={dIdx} className={cn("flex-1 rounded-sm", bgColor)} title="Interaction niveau"></div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-100"></span>
                <span className="text-xs text-white/50">Faible</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-white/50">Élevée</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                 <Users className="w-6 h-6" />
               </div>
               <div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temps Moyen / Cours</div>
                 <div className="text-2xl font-black text-white">{analytics?.avgTime || 0} min</div>
               </div>
             </div>
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                 <BarChart3 className="w-6 h-6" />
               </div>
               <div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Taux de Complétion</div>
                 <div className="text-2xl font-black text-white">{analytics?.completionRate || 0}%</div>
               </div>
             </div>
          </div>
        </div>

        {/* AI Alerts Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-rose-50 to-white rounded-3xl p-8 shadow-sm border border-rose-100 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
              </div>
              <h2 className="text-lg font-black text-rose-900">Alerte Décrochage IA</h2>
            </div>
            <p className="text-sm text-rose-600/80 mb-6 font-medium">
              Notre algorithme prédictif a identifié 3 étudiants présentant un risque élevé d'échec basé sur leur comportement récent.
            </p>

            <div className="space-y-4 flex-1">
              {atRiskStudents.map((student, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-sm">{student.name}</h3>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                      student.risk === 'high' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {student.risk === 'high' ? 'Critique' : 'Attention'}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mb-3">{student.issue}</p>
                  <button className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <BellRing className="w-3 h-3" /> Envoyer une Relance
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
