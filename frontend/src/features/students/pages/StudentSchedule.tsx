import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Building2,
  Info,
  RefreshCcw,
  LayoutGrid,
  ListFilter,
  Download
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';

interface ScheduleSession {
  id: number | string;
  day_of_week: number;
  day: string;
  time: string;
  start_time?: string;
  end_time?: string;
  module_name?: string;
  title: string;
  module_code?: string;
  room?: string;
  location: string;
  type: string;
  raw_type?: string;
  professor: string;
}

const DAYS = [
  { key: 1, name: 'Lundi', short: 'LUN' },
  { key: 2, name: 'Mardi', short: 'MAR' },
  { key: 3, name: 'Mercredi', short: 'MER' },
  { key: 4, name: 'Jeudi', short: 'JEU' },
  { key: 5, name: 'Vendredi', short: 'VEN' },
  { key: 6, name: 'Samedi', short: 'SAM' },
];

const TIME_SLOTS = [
  { start: '08:30', end: '10:30', label: '08:30 - 10:30', period: 'Matinée 1' },
  { start: '10:45', end: '12:45', label: '10:45 - 12:45', period: 'Matinée 2' },
  { start: '14:30', end: '16:30', label: '14:30 - 16:30', period: 'Après-midi 1' },
  { start: '16:45', end: '18:45', label: '16:45 - 18:45', period: 'Après-midi 2' },
];

export default function StudentSchedule() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  // Fetch real student info & sub-group from backend
  const { data: dashboardData } = useQuery({
    queryKey: ['student-stats-schedule'],
    queryFn: async () => {
      const res = await api.get('/student-portal/dashboard');
      return res.data?.data;
    },
    staleTime: 60000,
  });

  const userAny = user as any;
  const studentSection = dashboardData?.section || userAny?.section || '—';
  const studentSubGroup = dashboardData?.sub_group || userAny?.sub_group || '—';
  const studentGroupName = dashboardData?.group_name || userAny?.group_name || '—';
  const studentFiliere = dashboardData?.filiere_name 
    ? `ENCG Grande École • S${dashboardData?.semester || 1} ${dashboardData?.filiere_name}`
    : (userAny?.filiere?.name || 'ENCG Grande École');

  // 1. Fetch Schedule from backend API (100% Live DB Data)
  const { data: scheduleData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['student-schedule'],
    retry: 1,
    queryFn: async () => {
      const res = await api.get('/v1/student-portal/schedule');
      return res.data?.data ?? [];
    },
    staleTime: 60000,
  });

  // Harmonize schedule items
  const schedule: ScheduleSession[] = useMemo(() => {
    if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
      return [];
    }

    const daysMap: Record<number, string> = {
      1: 'Lundi',
      2: 'Mardi',
      3: 'Mercredi',
      4: 'Jeudi',
      5: 'Vendredi',
      6: 'Samedi',
    };

    return scheduleData.map((item: any, idx: number) => {
      const dayNum = Number(item.day_of_week || (typeof item.day === 'number' ? item.day : 1));
      const dayName = typeof item.day === 'string' && isNaN(Number(item.day))
        ? item.day
        : (daysMap[dayNum] || 'Lundi');

      const rawTitle = item.title || item.module_name || item.module || `Module ${idx + 1}`;
      const rawRoom = item.location || item.room || item.room_name || 'Salle non assignée';
      const rawType = (item.raw_type || item.type || 'cm').toLowerCase();
      
      let cleanType = 'Cours Magistral (CM)';
      if (rawType.includes('td') || rawType.includes('dirig')) {
        cleanType = 'Travaux Dirigés (TD)';
      } else if (rawType.includes('tp') || rawType.includes('prat')) {
        cleanType = 'Travaux Pratiques (TP)';
      }

      const rawTime = String(item.time || `${item.start_time || '08:30'} - ${item.end_time || '10:30'}`);
      const cleanTime = rawTime
        .split('-')
        .map(t => t.trim().substring(0, 5))
        .join(' - ');

      const prof = item.professor || 'Enseignant non assigné';

      return {
        id: item.id || idx + 1,
        day_of_week: dayNum,
        day: dayName,
        time: cleanTime,
        start_time: cleanTime.split('-')[0]?.trim() || '08:30',
        end_time: cleanTime.split('-')[1]?.trim() || '10:30',
        title: rawTitle,
        module_name: rawTitle,
        module_code: item.module_code,
        room: rawRoom,
        location: rawRoom,
        type: cleanType,
        raw_type: rawType,
        professor: prof.startsWith('Pr.') || prof.startsWith('Dr.') ? prof : `Pr. ${prof}`,
      };
    });
  }, [scheduleData]);

  // Filtered schedule for cards view
  const filteredSchedule = useMemo(() => {
    return schedule.filter((s) => {
      if (selectedDay === 'all') return true;
      return s.day.toLowerCase() === selectedDay.toLowerCase();
    });
  }, [schedule, selectedDay]);

  // Weekly stats
  const stats = useMemo(() => {
    const totalSessions = schedule.length;
    const cmCount = schedule.filter(s => s.type.includes('CM')).length;
    const tdTpCount = schedule.filter(s => s.type.includes('TD') || s.type.includes('TP')).length;
    const totalHours = totalSessions * 2; // 2h per session standard ENCG
    return { totalSessions, cmCount, tdTpCount, totalHours };
  }, [schedule]);

  // Export ICS
  const handleExportIcs = () => {
    if (schedule.length === 0) {
      toast.error('Aucune séance à exporter.');
      return;
    }

    const events = schedule.map((c) => {
      return `BEGIN:VEVENT\nSUMMARY:${c.title} (${c.type})\nLOCATION:${c.location}\nDESCRIPTION:${c.professor} • Groupe ${studentGroupName} • ${studentSubGroup}\nEND:VEVENT`;
    }).join('\n');

    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ENCG Fes ERP//Emploi du Temps Etudiant//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${events}\nEND:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Emploi_du_Temps_${studentGroupName}_${studentSubGroup}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📅 Emploi du temps exporté vers votre Agenda Smartphone (.ics / Google Calendar / Apple Calendar) !');
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      toast.info("Génération de l'Emploi du Temps officiel ENCG Fès (PDF A4)...");
      const studentId = (user as any)?.student?.id || (user as any)?.id || 11;
      const res = await api.get(`/timetable/export/student/${studentId}/pdf`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `Emploi_du_Temps_${studentGroupName}_${studentSubGroup}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(link.href), 60000);
      toast.success("Emploi du temps officiel PDF téléchargé avec succès !");
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      toast.error(err?.response?.data?.message || "Erreur lors de la génération du PDF officiel.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-20">
      
      {/* ── Executive Top Cockpit Header (Matching Admin & Professor Cockpit) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-[#001A4B] dark:text-white">
              Cockpit Étudiant · Emploi du Temps
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Planning Validé & Publié
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            École Nationale de Commerce et de Gestion de Fès · Année Universitaire 2026-2027 · {currentDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5 text-blue-600", isFetching && "animate-spin")} />
            Actualiser
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <Download className={cn("w-3.5 h-3.5 text-amber-300", isGeneratingPdf && "animate-bounce")} />
            {isGeneratingPdf ? 'Génération PDF...' : 'Télécharger PDF Officiel'}
          </button>

          <button
            onClick={handleExportIcs}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#001A4B] text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Synchroniser iCal (.ics)
          </button>
        </div>
      </div>

      {/* ── Executive Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#001A4B] via-[#092868] to-[#041233] text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
                Planning Pédagogique Officiel
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Semestre 2 · Tronc Commun
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {studentGroupName}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-amber-300" />
              Emploi du Temps Hebdomadaire
            </h2>

            <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed max-w-2xl">
              Affectation officielle en Amphithéâtre pour les Cours Magistraux (CM) et en Salles dédiées par sous-groupe pour les Travaux Dirigés (TD) et Travaux Pratiques (TP).
            </p>

            {/* Compact Pedagogical Badges Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 backdrop-blur-sm shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-[10.5px] font-black text-amber-300 uppercase tracking-wide">Amphi</span>
                <span className="text-xs font-black text-amber-200">{studentSection} (~100 étud.)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-500/20 border border-violet-400/30 backdrop-blur-sm shadow-sm">
                <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                <span className="text-[10.5px] font-black text-violet-300 uppercase tracking-wide">Sous-Groupe TD</span>
                <span className="text-xs font-black text-violet-200">{studentSubGroup} (Ordre Alpha)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm text-xs font-bold text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-blue-300" />
                <span>{studentFiliere}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary Tile */}
          <div className="w-full lg:w-auto bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/15 shadow-xl grid grid-cols-3 gap-4 text-center shrink-0">
            <div>
              <div className="text-2xl font-black text-amber-300">{stats.totalSessions}</div>
              <div className="text-[9.5px] font-black uppercase tracking-wider text-blue-200 mt-0.5">Séances / Sem.</div>
            </div>
            <div className="border-x border-white/15 px-3">
              <div className="text-2xl font-black text-emerald-300">{stats.totalHours}h</div>
              <div className="text-[9.5px] font-black uppercase tracking-wider text-blue-200 mt-0.5">Volume Horaire</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.tdTpCount}</div>
              <div className="text-[9.5px] font-black uppercase tracking-wider text-blue-200 mt-0.5">Séances TD/TP</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Official Start Dates & Architecture Notice (Rule 7 Compliance) ── */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 text-slate-800 dark:text-slate-200">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-1 text-xs font-medium leading-relaxed">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-blue-900 dark:text-blue-300">
              📅 Démarrage officiel des Cours Magistraux : <span className="font-black">15 Septembre 2026</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
            <span className="font-bold text-violet-900 dark:text-violet-300">
              🧪 Démarrage officiel des TD / TP : <span className="font-black">22 Septembre 2026</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Les séances CM sont dispensées en <span className="font-bold">Amphithéâtre A</span> réunissant toute la section. Les séances TD sont dispensées par sous-groupe (<span className="font-bold text-violet-600 dark:text-violet-400">{studentSubGroup}</span>) dans les salles attribuées.
          </p>
        </div>
      </div>

      {/* ── View Controls Bar & Filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('matrix')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
              viewMode === 'matrix'
                ? "bg-[#001A4B] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grille Hebdomadaire
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
              viewMode === 'cards'
                ? "bg-[#001A4B] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            )}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Vue Cartes par Jour
          </button>
        </div>

        {/* Day Filters (active in cards view, informative in matrix view) */}
        {viewMode === 'cards' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedDay('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                selectedDay === 'all'
                  ? "bg-[#001A4B] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              Toute la Semaine
            </button>
            {DAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.name)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                  selectedDay.toLowerCase() === d.name.toLowerCase()
                    ? "bg-[#001A4B] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                )}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        <div className="text-xs font-bold text-slate-400 shrink-0">
          {filteredSchedule.length} séance(s) trouvée(s)
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400 font-bold">
          <Spinner size="lg" />
        </div>
      ) : schedule.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
          <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Aucun cours programmé</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            L'emploi du temps officiel pour votre groupe ({studentGroupName} • {studentSubGroup}) n'a pas encore de séances enregistrées dans la base de données.
          </p>
        </div>
      ) : viewMode === 'matrix' ? (
        /* ══════════════════════════════════════════════════════════════
           1. VUE GRILLE HEBDOMADAIRE (MATRIX TIMETABLE)
        ══════════════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
          <table className="w-full border-collapse min-w-[850px]">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 w-36">
                  Créneau Horaire
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.key}
                    className="p-3 text-center border-b border-slate-200 dark:border-slate-800"
                  >
                    <div className="font-black text-sm text-[#001A4B] dark:text-white uppercase tracking-wider">
                      {day.name}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {day.short}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {TIME_SLOTS.map((slot, slotIdx) => (
                <tr key={slotIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Slot Header */}
                  <td className="p-3.5 align-top">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {slot.label}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                      {slot.period}
                    </div>
                  </td>

                  {/* Day Columns */}
                  {DAYS.map((day) => {
                    const session = schedule.find((s) => {
                      const sameDay = s.day_of_week === day.key || s.day.toLowerCase() === day.name.toLowerCase();
                      const sameStart = (s.start_time || s.time || '').startsWith(slot.start);
                      return sameDay && sameStart;
                    });

                    if (!session) {
                      return (
                        <td key={day.key} className="p-2.5 align-top">
                          <div className="h-28 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 flex items-center justify-center text-[11px] font-bold text-slate-300 dark:text-slate-700 select-none">
                            —
                          </div>
                        </td>
                      );
                    }

                    const isCm = session.type.includes('CM');
                    const isTd = session.type.includes('TD');

                    return (
                      <td key={day.key} className="p-2.5 align-top">
                        <div
                          className={cn(
                            "h-28 rounded-2xl p-3 border transition-all duration-200 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5",
                            isCm
                              ? "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/30 dark:bg-blue-950/20"
                              : isTd
                              ? "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/30 dark:bg-violet-950/20"
                              : "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30 dark:bg-emerald-950/20"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                                  isCm
                                    ? "bg-[#001A4B] text-white"
                                    : isTd
                                    ? "bg-violet-600 text-white"
                                    : "bg-emerald-600 text-white"
                                )}
                              >
                                {isCm ? 'CM' : isTd ? 'TD' : 'TP'}
                              </span>
                              <span className="font-mono text-[9px] font-black text-slate-500 dark:text-slate-400">
                                {session.time}
                              </span>
                            </div>

                            <div className="font-black text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                              {session.title}
                            </div>
                          </div>

                          <div className="space-y-0.5 pt-1">
                            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                              {session.professor}
                            </div>
                            <div className="flex items-center gap-1 text-[9.5px] font-black text-blue-700 dark:text-blue-300 truncate">
                              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="truncate">{session.location}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════
           2. VUE CARTES PAR JOUR (TIMELINE CARDS)
        ══════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedule.map((item, idx) => {
            const isCm = item.type.includes('CM');
            const isTd = item.type.includes('TD');

            return (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#001A4B] text-white">
                      {item.day}
                    </span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      isCm 
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200" 
                        : isTd 
                        ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200" 
                        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                    )}>
                      {item.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" /> {item.professor}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" /> {item.time}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
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
