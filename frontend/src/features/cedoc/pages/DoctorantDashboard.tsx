import React from 'react';
import { Microscope, BookOpen, FileText, Clock, GraduationCap, CheckCircle2, ChevronRight, Award } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

export default function DoctorantDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['cedoc-stats'],
    queryFn: () => api.get('/student/cedoc/dashboard').then(res => res.data.data)
  });

  if (isLoading) return <div className="p-12 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>;

  const publications = stats?.publications || [];
  const vacations = stats?.vacations || [];
  const thesis = stats?.thesis || {};
  const training = stats?.training || { completed_hours: 0, required_hours: 200 };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#0b1021] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00e5ff]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#00e5ff]/20 text-[#00e5ff] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-[#00e5ff]/30">
              <Microscope className="w-3.5 h-3.5" /> CEDoc ENCG
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Espace Chercheur & Doctorant</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Suivi de l'état d'avancement de la thèse, publications scientifiques et gestion des heures de vacation.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Année de Thèse</div>
              <div className="text-3xl font-black text-white">2ème <span className="text-sm font-medium text-white/50">Année</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Avancement Thèse */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><GraduationCap className="w-32 h-32 text-[#003a8c]" /></div>
            
            <h2 className="text-xl font-black text-white mb-2">Thèse de Doctorat</h2>
            <div className="text-sm font-bold text-blue-600 mb-6">{thesis.title || '"Digitalisation et Performance des PME Marocaines"'}</div>

            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-white/80">Progression Globale Estimée</span>
                  <span className="text-sm font-black text-[#003a8c]">{thesis.progress || 0}%</span>
                </div>
                <div className="h-3 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${thesis.progress || 0}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                  <div className="text-xs font-bold text-white/50 uppercase mb-1">Directeur de Thèse</div>
                  <div className="font-bold text-white">{thesis.director || 'Non assigné'}</div>
                </div>
                <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                  <div className="text-xs font-bold text-white/50 uppercase mb-1">Prochaine Échéance</div>
                  <div className="font-bold text-rose-600 flex items-center gap-1"><Clock className="w-4 h-4" /> {thesis.next_deadline || 'Aucune'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Publications */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#00e5ff]" /> Publications Scientifiques
              </h3>
              <button className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                + Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {publications.map((pub: any, idx: number) => (
                <div key={idx} className="p-4 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <h4 className="font-bold text-white leading-tight mb-1">{pub.title}</h4>
                  <div className="text-xs text-white/50 mb-3">{pub.journal} â€¢ {pub.date}</div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                    pub.status === 'PUBLISHED' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {pub.status === 'PUBLISHED' ? 'Publié' : 'En révision'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Formations & Vacations */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-500" /> Formations CEDoc
            </h3>
            
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" className="stroke-gray-100" strokeWidth="12" fill="none" />
                  <circle cx="64" cy="64" r="56" className="stroke-purple-500" strokeWidth="12" fill="none" strokeDasharray="351.858" strokeDashoffset={351.858 * (1 - (training.completed_hours || 0)/(training.required_hours || 200))} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{training.completed_hours || 0}h</span>
                  <span className="text-[10px] font-bold text-white/50 uppercase">/ {training.required_hours || 200}h req.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" /> Mes Vacations (TD)
            </h3>
            
            <div className="space-y-3">
              {vacations.map((vac: any, idx: number) => (
                <div key={idx} className="border border-white/5 rounded-xl p-3 bg-white/[0.02]">
                  <div className="text-sm font-bold text-white mb-1">{vac.module}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-[#003a8c] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{vac.hours} de TD</span>
                    {vac.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 bg-white border border-white/10 text-white/80 py-2 rounded-xl text-xs font-bold hover:bg-white/[0.02] transition-colors flex items-center justify-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Fiche de Paie Vacation
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
