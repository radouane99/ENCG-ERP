import React, { useState } from 'react';
import { Calendar as CalendarIcon, FileText, BookOpen, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';

export default function StudentSchedule() {
  const [selectedDay, setSelectedDay] = useState<string>('all');

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['student-schedule'],
    retry: 1,
    queryFn: async () => {
      const res = await api.get('/v1/student-portal/schedule');
      return res.data.data ?? [];
    }
  });

  const defaultSchedule = [
    { day: 'Lundi', time: '08:30 - 10:30', title: 'Management Stratégique & Gouvernance', type: 'Cours Magistral (CM)', location: 'Amphi Ibn Khaldoun', professor: 'Pr. El Amrani', group: 'S6 GFC - Grp 1' },
    { day: 'Lundi', time: '10:45 - 12:45', title: 'Comptabilité des Sociétés Approfondie', type: 'Travaux Dirigés (TD)', location: 'Salle 14', professor: 'Pr. Bennani', group: 'S6 GFC - Grp 1' },
    { day: 'Mardi', time: '08:30 - 10:30', title: 'Diagnostic Financier & Analyse de la Valeur', type: 'Cours Magistral (CM)', location: 'Amphi 2', professor: 'Pr. Bensouda', group: 'S6 GFC - Grp 1' },
    { day: 'Mardi', time: '14:30 - 16:30', title: 'Fiscalité d’Entreprise & IS/TVA', type: 'Travaux Dirigés (TD)', location: 'Salle 08', professor: 'Pr. Mansouri', group: 'S6 GFC - Grp 1' },
    { day: 'Mercredi', time: '10:45 - 12:45', title: 'Marketing International & Négociation', type: 'Cours Magistral (CM)', location: 'Amphi Ibn Battouta', professor: 'Pr. Tazi', group: 'S6 GFC - Grp 1' },
    { day: 'Jeudi', time: '08:30 - 10:30', title: 'Audit Financier & Contrôle Interne', type: 'Cours Magistral (CM)', location: 'Salle 12', professor: 'Pr. Fassi Fihri', group: 'S6 GFC - Grp 1' },
    { day: 'Vendredi', time: '09:00 - 11:00', title: 'Anglais des Affaires & Soft Skills', type: 'Travaux Pratiques (TP)', location: 'Labo Langues 2', professor: 'Pr. Wilson', group: 'S6 GFC - Grp 1' },
  ];

  const schedule = Array.isArray(scheduleData) && scheduleData.length > 0 ? scheduleData : defaultSchedule;

  const filteredSchedule = schedule.filter((s: any) => {
    if (selectedDay === 'all') return true;
    return (s.day || '').toLowerCase() === selectedDay.toLowerCase();
  });

  const handleExportIcs = () => {
    const events = schedule.map((c: any) => {
      return `BEGIN:VEVENT\nSUMMARY:${c.title || 'Cours'}\nDESCRIPTION:${c.professor || ''} - ${c.type || ''}\nLOCATION:${c.location || ''}\nEND:VEVENT`;
    }).join('\n');
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ENCG Fes ERP//Emploi du temps Étudiant//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${events}\nEND:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Emploi_du_Temps_ENCG_2026.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📅 Emploi du temps exporté vers votre Agenda Smartphone (.ics) !');
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-20">
      
      {/* ── Executive Hero Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
              Planning Pédagogique Hebdomadaire
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Semestre 6 (2026/2027)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-amber-300" /> Mon Emploi du Temps
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed max-w-xl">
            Salles géolocalisées en temps réel, affectations d'amphithéâtres et synchronisation automatique avec votre calendrier mobile.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs uppercase tracking-wider border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-300" /> Imprimer / PDF
          </button>
          <button 
            onClick={handleExportIcs}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#001A4B] font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4" /> Synchroniser iCal (.ics)
          </button>
        </div>
      </div>

      {/* ── Filter Bar by Day ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                selectedDay === day
                  ? "bg-[#001A4B] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {day === 'all' ? 'Toute la Semaine' : day}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-slate-400">
          {filteredSchedule.length} séance(s) programmée(s)
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400 font-bold">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedule.map((item: any, idx: number) => {
            const isCm = (item.type || '').includes('CM') || (item.type || '').includes('Magistral');
            const isTd = (item.type || '').includes('TD') || (item.type || '').includes('Dirigés');
            
            return (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#001A4B] text-white">
                      {item.day || 'Lundi'}
                    </span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      isCm ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200" : isTd ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                    )}>
                      {item.type || 'Cours Magistral'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" /> {item.professor}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" /> {item.time}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {item.location}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
