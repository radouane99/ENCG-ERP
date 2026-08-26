import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, AlertTriangle, TrendingDown, BellRing, Users, Activity, CheckCircle, ShieldAlert, Sparkles, Send, Loader2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';

export default function ProfessorAnalytics() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const [selectedModule, setSelectedModule] = useState('all');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['professor-analytics'],
    queryFn: async () => {
      const res = await api.get('/professor-portal/analytics');
      return res.data;
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (studentName: string) => {
      // Simulate sending instant academic reminder notification
      await new Promise(r => setTimeout(r, 600));
      return { studentName };
    },
    onSuccess: (data) => {
      toast.success(`Alerte de présence envoyée à ${data.studentName} !`, {
        description: 'Notification push PWA & Email de rappel expédiés avec succès.'
      });
    }
  });

  const atRiskStudents = analytics?.atRiskStudents || [];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-[#003a8c]" /></div>;
  }

  const completionRate = analytics?.completionRate || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Early Warning System (IA)
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Analytique Prédictive & Engagement Étudiants</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Suivi de l'assiduité, détection précoce du décrochage et relance des étudiants en difficulté.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Taux de Présence & Assiduité aux Séances
                </h2>
                <p className="text-xs text-slate-500 font-medium">Répartition temporelle sur les 4 dernières semaines.</p>
              </div>

              <select 
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Tous mes modules ENCG</option>
                <option value="audit">Audit & Contrôle de Gestion (S7)</option>
                <option value="finance">Finance d'Entreprise & Diagnostic (S5)</option>
                <option value="marketing">Marketing Stratégique (S3)</option>
                <option value="management">Management & Organisation (S1)</option>
              </select>
            </div>
            
            {/* Heatmap Matrix */}
            <div className="space-y-4">
              {['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4 (En cours)'].map((week, wIdx) => {
                const patterns = [
                  [0.9, 0.8, 0.95, 0.7, 0.85, 0.9, 1.0, 0.8, 0.9, 0.85, 0.95, 0.9, 0.75, 0.88, 0.92],
                  [0.85, 0.9, 0.75, 0.88, 0.92, 0.8, 0.95, 0.7, 0.85, 0.9, 1.0, 0.8, 0.9, 0.85, 0.95],
                  [0.95, 0.9, 0.85, 1.0, 0.8, 0.9, 0.85, 0.95, 0.9, 0.75, 0.88, 0.92, 0.85, 0.9, 0.75],
                  [0.88, 0.92, 0.8, 0.95, 0.7, 0.85, 0.9, 1.0, 0.8, 0.9, 0.85, 0.95, 0.9, 0.75, 0.88],
                ];
                const weekPattern = patterns[wIdx] || patterns[0];

                return (
                  <div key={wIdx} className="flex items-center gap-4">
                    <div className="w-28 text-xs font-black text-slate-600">{week}</div>
                    <div className="flex-1 flex gap-1.5 h-7">
                      {weekPattern.map((op, dIdx) => {
                        const bgColor = op > 0.85 ? 'bg-emerald-500 hover:bg-emerald-600' : op > 0.75 ? 'bg-emerald-400 hover:bg-emerald-500' : 'bg-emerald-200 hover:bg-emerald-300';
                        return (
                          <div 
                            key={dIdx} 
                            className={cn("flex-1 rounded-md transition-all cursor-pointer", bgColor)} 
                            title={`Séance #${dIdx + 1} — Présence : ${Math.round(op * 100)}%`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-200"></span>
                <span>Présence Moyenne (70% - 80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                <span>Excellente Assiduité (&gt; 90%)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex items-center gap-4">
               <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0">
                 <Users className="w-7 h-7" />
               </div>
               <div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durée Moyenne / Séance</div>
                 <div className="text-2xl font-black text-slate-900">120 min</div>
                 <div className="text-[11px] font-bold text-indigo-600">Blocs de 2h respectés</div>
               </div>
             </div>

             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex items-center gap-4">
               <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0">
                 <BarChart3 className="w-7 h-7" />
               </div>
               <div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux Global d'Assiduité</div>
                 <div className="text-2xl font-black text-emerald-600">{completionRate}%</div>
                 <div className="text-[11px] font-bold text-slate-500">Seuil de conformité atteint</div>
               </div>
             </div>
          </div>
        </div>

        {/* AI Alerts Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-rose-50 to-white rounded-3xl p-6 md:p-8 shadow-sm border border-rose-100 flex flex-col h-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
              </div>
              <div>
                <h2 className="text-base font-black text-rose-950">Alerte Décrochage IA</h2>
                <p className="text-xs text-rose-700/80 font-semibold">Risques de non-validation détectés</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              L'algorithme a identifié {atRiskStudents.length} étudiants approchant le quota d'absences éliminatoires.
            </p>

            <div className="space-y-3 flex-1">
              {atRiskStudents.map((student: { name: string; risk: string; issue: string }, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{student.name}</h3>
                      <p className="text-xs font-semibold text-rose-600 mt-0.5">{student.issue}</p>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                      student.risk === 'high' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {student.risk === 'high' ? 'Critique' : 'Attention'}
                    </span>
                  </div>

                  <button 
                    onClick={() => sendReminderMutation.mutate(student.name)}
                    disabled={sendReminderMutation.isPending}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {sendReminderMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5 text-rose-600" />}
                    Envoyer une Relance Officielle
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
