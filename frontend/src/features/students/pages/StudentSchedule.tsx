import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Download, Link as LinkIcon, FileText, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

export default function StudentSchedule() {
  const { t, i18n } = useTranslation(['timetable', 'common']);
  const isRtl = i18n.language === 'ar';
  const [view, setView] = useState<'MOIS' | 'SEMAINE' | 'JOUR' | 'LISTE'>('SEMAINE');

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['student-schedule'],
    queryFn: async () => {
      const res = await api.get('/student-portal/schedule');
      return res.data.data;
    }
  });

  const getTop = (timeStr: string) => {
    try {
      const [start] = timeStr.split(' - ');
      const [h, m] = start.trim().split(':').map(Number);
      return (h - 8) * 60 + (m / 60) * 60;
    } catch {
      return 0;
    }
  };

  const getHeight = (timeStr: string) => {
    try {
      const [start, end] = timeStr.split(' - ');
      const [h1, m1] = start.trim().split(':').map(Number);
      const [h2, m2] = end.trim().split(':').map(Number);
      return ((h2 - h1) * 60) + (m2 - m1);
    } catch {
      return 60;
    }
  };

  const getLeft = (dayOfWeek: number) => {
    // dayOfWeek: 1 = Lundi, 6 = Samedi
    // Time column takes 14.28% (index 0). So Lundi starts at 14.28%.
    return `${dayOfWeek * 14.28}%`;
  };

  const colors = [
    { bg: 'bg-blue-100', border: 'border-blue-500', textTitle: 'text-blue-900', textRoom: 'text-blue-700', textTime: 'text-blue-600' },
    { bg: 'bg-emerald-100', border: 'border-emerald-500', textTitle: 'text-emerald-900', textRoom: 'text-emerald-700', textTime: 'text-emerald-600' },
    { bg: 'bg-purple-100', border: 'border-purple-500', textTitle: 'text-purple-900', textRoom: 'text-purple-700', textTime: 'text-purple-600' },
    { bg: 'bg-rose-100', border: 'border-rose-500', textTitle: 'text-rose-900', textRoom: 'text-rose-700', textTime: 'text-rose-600' },
    { bg: 'bg-amber-100', border: 'border-amber-500', textTitle: 'text-amber-900', textRoom: 'text-amber-700', textTime: 'text-amber-600' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-[#003a8c] rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#003a8c] italic">Mon Emploi du Temps</h1>
            <p className="text-gray-500 font-medium">Semaine en cours</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-[#001A4B] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#003a8c] transition-colors shadow-sm">
            <FileText className="w-4 h-4" /> EXPORTER PDF
          </button>
          <button className="flex items-center gap-2 bg-[#003a8c] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-sm">
            <CalendarIcon className="w-4 h-4" /> Télécharger iCal
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#0b1021] rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10 flex-1">
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">EMPLOI DU TEMPS PERSONNEL</div>
          <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-400" /> Mon Groupe
          </h2>
          <div className="flex items-center gap-2 text-gray-300 font-medium text-sm">
            <BookOpen className="w-4 h-4" /> Session Actuelle
          </div>
          <p className="text-gray-400 mt-2 text-sm">Planning hebdomadaire récurrent — mis à jour par l'administration.</p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center min-w-[100px] backdrop-blur-md">
            <div className="text-3xl font-black text-white">{scheduleData?.length || 0}</div>
            <div className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-1">SÉANCES / SEM.</div>
          </div>
        </div>
      </div>

      {/* Calendar UI */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100">
        
        {/* Calendar Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <button className="p-2 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors uppercase tracking-widest">
              AUJOURD'HUI
            </button>
          </div>
          
          <h2 className="text-xl font-black text-[#001A4B] italic">Semaine Actuelle</h2>
          
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            {['MOIS', 'SEMAINE', 'JOUR', 'LISTE'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  view === v 
                    ? "bg-[#003a8c] text-white shadow-sm" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Spinner className="w-8 h-8 text-[#003a8c]" /></div>
        ) : (
          <div className="border border-gray-100 rounded-2xl overflow-hidden overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                <div className="p-3"></div> {/* Time Column */}
                <div className="p-3 text-center border-l border-gray-100 text-xs font-bold text-gray-500">LUNDI</div>
                <div className="p-3 text-center border-l border-gray-100 text-xs font-bold text-gray-500">MARDI</div>
                <div className="p-3 text-center border-l border-gray-100 text-xs font-bold text-gray-500">MERCREDI</div>
                <div className="p-3 text-center border-l border-gray-100 text-xs font-bold text-gray-500">JEUDI</div>
                <div className="p-3 text-center border-l border-gray-100 text-xs font-bold text-gray-500">VENDREDI</div>
                <div className="p-3 text-center border-l border-gray-100 text-xs font-bold text-gray-500">SAMEDI</div>
              </div>
              
              {/* Time Grid */}
              <div className="relative h-[660px] bg-white">
                {/* Background Lines */}
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => (
                  <div key={hour} className="absolute w-full border-t border-gray-100 flex h-[60px]" style={{ top: `${(hour - 8) * 60}px` }}>
                    <div className="w-[14.28%] text-xs font-bold text-gray-400 -mt-2.5 pl-2">{hour}:00</div>
                    <div className="w-[14.28%] border-l border-gray-100"></div>
                    <div className="w-[14.28%] border-l border-gray-100"></div>
                    <div className="w-[14.28%] border-l border-gray-100"></div>
                    <div className="w-[14.28%] border-l border-gray-100"></div>
                    <div className="w-[14.28%] border-l border-gray-100"></div>
                    <div className="w-[14.28%] border-l border-gray-100"></div>
                  </div>
                ))}

                {/* API Events */}
                {scheduleData?.map((event: any, index: number) => {
                  const top = getTop(event.time);
                  const height = getHeight(event.time);
                  const left = getLeft(event.day); // event.day is 1 for Lundi, 2 for Mardi
                  const color = colors[index % colors.length];

                  return (
                    <div 
                      key={event.id}
                      className="absolute p-1 transition-all hover:z-10 hover:scale-[1.02]"
                      style={{ 
                        top: `${top}px`, 
                        left: left, 
                        width: '14.28%', 
                        height: `${height}px` 
                      }}
                    >
                      <div className={cn(
                        "w-full h-full rounded p-2 text-xs overflow-hidden border-l-4",
                        color.bg, color.border
                      )}>
                        <div className={cn("font-bold truncate", color.textTitle)}>{event.module}</div>
                        <div className={cn("truncate", color.textRoom)}>{event.room} - {event.type}</div>
                        <div className={cn("truncate", color.textTime)}>{event.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
