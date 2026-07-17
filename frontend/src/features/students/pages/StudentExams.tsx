import React from 'react';
import { Calendar as CalendarIcon, Clock, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

export default function StudentExams() {
  const { data: convData, isLoading } = useQuery({
    queryKey: ['student-convocations'],
    queryFn: async () => {
      const res = await api.get('/student-portal/convocations');
      return res.data.convocations;
    }
  });

  const exams = convData?.map((c: any) => ({
    id: c.id,
    name: c.exam?.module?.name || 'Examen',
    type: 'SESSION',
    date: c.exam?.date || 'N/A',
    time: c.exam?.start_time || 'N/A',
    duration: c.exam?.duration ? `${c.exam.duration} min` : '90 min',
    status: c.status === 'viewed' ? 'Présent' : 'Non renseigné',
  })) || [];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-[#2563eb]" /></div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#2563eb] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white italic mb-2">Mes Examens & Présences</h1>
          <p className="text-blue-100 mb-6">Consultez vos statuts de présence aux examens et gérez vos justifications.</p>
          <button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 w-max shadow-sm backdrop-blur-sm">
            ðŸ¦… Mon Rattrapage
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5 text-center flex flex-col justify-center items-center">
          <div className="text-3xl font-black text-white">8</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">TOTAL EXAMENS</div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-6 shadow-sm border border-emerald-100 text-center flex flex-col justify-center items-center">
          <div className="text-3xl font-black text-[#003a8c]">1</div>
          <div className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest mt-1">PRÉSENT</div>
        </div>
        <div className="bg-rose-50 rounded-2xl p-6 shadow-sm border border-rose-100 text-center flex flex-col justify-center items-center">
          <div className="text-3xl font-black text-rose-600">0</div>
          <div className="text-[10px] font-bold text-rose-600/80 uppercase tracking-widest mt-1">ABSENT</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-6 shadow-sm border border-amber-100 text-center flex flex-col justify-center items-center">
          <div className="text-3xl font-black text-amber-600">0</div>
          <div className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest mt-1">JUSTIF. À DÉPOSER</div>
        </div>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        {exams.map((exam, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-white/5 hover:shadow-md transition-shadow">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-black text-lg text-white">{exam.name}</h3>
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-blue-100">
                  {exam.type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-white/50">
                <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-[#003a8c]" /> {exam.date}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#003a8c]" /> {exam.time}</div>
                <div className="flex items-center gap-1.5 bg-white/[0.05] px-2 py-1 rounded-md text-white/70">âŒ› {exam.duration}</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {exam.status === 'Présent' && (
                <div className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-200">
                  <Check className="w-4 h-4" /> Présent
                </div>
              )}
              {exam.status === 'Non renseigné' && (
                <div className="bg-white/[0.05] text-white/50 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-white/10">
                  <HelpCircle className="w-4 h-4" /> Non renseigné
                </div>
              )}
              
              {exam.action && (
                <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-rose-100 flex items-center gap-1">
                  ðŸ¦… {exam.action}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
