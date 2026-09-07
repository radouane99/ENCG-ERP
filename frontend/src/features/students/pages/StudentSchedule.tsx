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
  Download,
  Eye,
  X,
  ExternalLink
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
  const studentSection = dashboardData?.section || userAny?.section || 'Section 1';
  const studentSubGroup = dashboardData?.sub_group || userAny?.sub_group || 'G1.1';
  const studentGroupName = dashboardData?.group_name || userAny?.group_name || 'GFC-S5-G1';

  // Extract clean semester dynamically (e.g. from GFC-S5-G1 -> 5 or backend data)
  const groupSemesterMatch = String(studentGroupName).match(/S(\d+)/i);
  const semesterNum = groupSemesterMatch
    ? Number(groupSemesterMatch[1])
    : Number(dashboardData?.semester || userAny?.semester || 5);
  const isTroncCommun = semesterNum <= 4;
  const semesterLabel = `Semestre ${semesterNum} · ${isTroncCommun ? 'Tronc Commun' : 'Spécialité'}`;
  const filiereRaw = dashboardData?.filiere_name || userAny?.filiere?.name || 'Gestion Financière et Comptable';
  const studentFiliere = `ENCG Grande École • S${semesterNum} ${filiereRaw}`;
  const studentFiliereName = studentFiliere;

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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const handlePreviewPdf = async () => {
    if (previewPdfUrl) {
      setIsPreviewModalOpen(true);
      return;
    }

    try {
      setIsPreviewLoading(true);
      toast.info("Chargement de l'Aperçu officiel (PDF A4)...");
      const studentId = (user as any)?.student?.id || (user as any)?.id || 11;
      const res = await api.get(`/timetable/export/student/${studentId}/pdf`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(objectUrl);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      console.error('PDF Preview Error:', err);
      toast.error(err?.response?.data?.message || "Impossible de charger l'aperçu PDF.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      toast.info("Préparation de l'Emploi du Temps Officiel (PDF A4)...");

      const studentId = (user as any)?.student?.id || (user as any)?.id || 11;
      const res = await api.get(`/timetable/export/student/${studentId}/pdf`, {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
        },
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `Emploi_du_Temps_${studentGroupName}_${studentSubGroup}_ENCG.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Emploi du temps officiel PDF téléchargé avec succès !");
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      toast.error(err?.response?.data?.message || "Erreur lors de la génération du PDF officiel.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-20">
      
      {/* ── Executive Top Cockpit Header (Fully Responsive) ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#001A4B] dark:text-white">
              Cockpit Étudiant · Emploi du Temps
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Planning Validé & Publié
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>École Nationale de Commerce et de Gestion de Fès</span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span>Année 2026-2027</span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{currentDate.toLowerCase()}</span>
          </p>
        </div>

        {/* Action Buttons Group: 2x2 grid on mobile, inline on sm+ */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full xl:w-auto shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Rafraîchir les données de l'emploi du temps"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5 text-slate-500", isFetching && "animate-spin text-blue-600")} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handlePreviewPdf}
            disabled={isPreviewLoading}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs hover:shadow-sm"
          >
            <Eye className={cn("w-4 h-4 text-blue-600 dark:text-blue-400", isPreviewLoading && "animate-pulse")} />
            <span>{isPreviewLoading ? 'Chargement...' : 'Aperçu PDF'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center justify-center gap-2 h-10 px-3 sm:px-4.5 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 border border-white/10"
          >
            <Download className={cn("w-4 h-4 text-amber-300", isGeneratingPdf && "animate-bounce")} />
            <span className="truncate">{isGeneratingPdf ? 'Génération...' : 'Télécharger PDF'}</span>
          </button>

          <button
            onClick={handleExportIcs}
            className="inline-flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-300 border border-amber-400/20 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-sm"
            title="Synchroniser avec Google Calendar, Apple Calendar, Outlook"
          >
            <CalendarIcon className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">Synchroniser iCal</span>
          </button>
        </div>
      </div>

      {/* ── Executive Hero Banner (Responsive Grid & Cards) ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#001338] text-white p-4 sm:p-7 lg:p-8 shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 sm:w-80 h-64 sm:h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 sm:gap-6">
          {/* Left Column: Heading & Academic Context Cards */}
          <div className="space-y-4 max-w-2xl flex-1">
            
            {/* Top context badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Planning Pédagogique Officiel
              </span>
              <span className="px-2.5 sm:px-3 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-bold tracking-wide bg-white/10 text-blue-100 border border-white/15">
                {semesterLabel}
              </span>
              <span className="px-2.5 sm:px-3 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-mono font-bold bg-blue-500/20 text-blue-200 border border-blue-400/20">
                Groupe {studentGroupName}
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span>Emploi du Temps Hebdomadaire</span>
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-blue-200/80 font-normal leading-relaxed">
                Affectation officielle en Amphithéâtre pour les Cours Magistraux (CM) et en salles dédiées par sous-groupe pour les Travaux Dirigés (TD) et Travaux Pratiques (TP).
              </p>
            </div>

            {/* Structured Academic Identity Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {/* Amphi Section */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Amphithéâtre (CM)</div>
                  <div className="text-xs font-black text-white truncate">{studentSection} <span className="text-[10px] font-normal text-amber-300/90">(~100 étud.)</span></div>
                </div>
              </div>

              {/* Sous-groupe TD */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-violet-400/20 text-violet-300 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Sous-Groupe TD</div>
                  <div className="text-xs font-black text-white truncate">{studentSubGroup} <span className="text-[10px] font-normal text-violet-200/80">(Ordre Alpha)</span></div>
                </div>
              </div>

              {/* Filiere */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md sm:col-span-2 lg:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-blue-400/20 text-blue-300 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Filière & Spécialité</div>
                  <div className="text-xs font-black text-white truncate" title={filiereRaw}>{filiereRaw}</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Glassmorphism KPI Stats Card */}
          <div className="w-full lg:w-72 bg-white/[0.07] backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/15 shadow-xl flex flex-col justify-between shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300 pb-2.5 sm:pb-3 border-b border-white/10 flex items-center justify-between">
              <span>Synthèse Hebdomadaire</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            <div className="grid grid-cols-3 gap-1 sm:gap-2 py-3 sm:py-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-300">{stats.totalSessions}</div>
                <div className="text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wide text-blue-200 mt-1 leading-tight">Séances / sem.</div>
              </div>
              <div className="border-x border-white/10 px-1">
                <div className="text-xl sm:text-2xl font-black text-emerald-300">{stats.totalHours}h</div>
                <div className="text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wide text-blue-200 mt-1 leading-tight">Volume Heures</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">{stats.tdTpCount}</div>
                <div className="text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wide text-blue-200 mt-1 leading-tight">Séances TD/TP</div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10.5px] sm:text-[11px] text-blue-200/80 font-medium">
              <span>Séances CM : <strong className="text-white">{stats.cmCount}</strong></span>
              <span>Statut : <strong className="text-emerald-400">Actif</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Structured Dual-Card Official Start Dates (Responsive) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* CM Notice Card */}
        <div className="flex items-start gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 shadow-2xs">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-xs">
            CM
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-black text-blue-950 dark:text-blue-200">
                Démarrage officiel des Cours Magistraux
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10.5px] sm:text-[11px] font-black">
                15 Septembre 2026
              </span>
            </div>
            <p className="text-[11px] sm:text-[11.5px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Dispensés en <strong className="text-slate-800 dark:text-slate-200">Amphithéâtre</strong> regroupant l'ensemble de la section ({studentSection}, ~100 étudiants).
            </p>
          </div>
        </div>

        {/* TD/TP Notice Card */}
        <div className="flex items-start gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-900/40 shadow-2xs">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-xs">
            TD
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-black text-violet-950 dark:text-violet-200">
                Démarrage officiel des Travaux Dirigés & TP
              </span>
              <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[10.5px] sm:text-[11px] font-black">
                22 Septembre 2026
              </span>
            </div>
            <p className="text-[11px] sm:text-[11.5px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Dispensés en salles de cours par sous-groupe officiel (<strong className="text-violet-700 dark:text-violet-300">{studentSubGroup}</strong>, scission alphabétique A à K).
            </p>
          </div>
        </div>
      </div>

      {/* ── View Controls Bar & Filter (Responsive & Horizontal Scroll for Days) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode('matrix')}
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              viewMode === 'matrix'
                ? "bg-[#001A4B] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grille Hebdomadaire</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              viewMode === 'cards'
                ? "bg-[#001A4B] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Vue Cartes</span>
          </button>
        </div>

        {/* Day Filters: horizontally scrollable on mobile */}
        {viewMode === 'cards' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto no-scrollbar">
            <button
              onClick={() => setSelectedDay('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0",
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
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0",
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

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{filteredSchedule.length} séance(s) trouvée(s)</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400 font-bold">
          <Spinner size="lg" />
        </div>
      ) : schedule.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
          <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Aucun cours programmé</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            L'emploi du temps officiel pour votre groupe ({studentGroupName} • {studentSubGroup}) n'a pas encore de séances enregistrées dans la base de données.
          </p>
        </div>
      ) : viewMode === 'matrix' ? (
        /* ══════════════════════════════════════════════════════════════
           1. VUE GRILLE HEBDOMADAIRE (MATRIX TIMETABLE WITH STICKY TIME)
        ══════════════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-x-auto relative">
          <table className="w-full border-collapse min-w-[780px] sm:min-w-[850px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white dark:bg-slate-900 z-10 p-3 text-left text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 w-32 sm:w-36 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
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
                  {/* Slot Header (Sticky Column for Mobile/Tablet) */}
                  <td className="sticky left-0 bg-white dark:bg-slate-900 z-10 p-2.5 sm:p-3.5 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{slot.label}</span>
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
                        <td key={day.key} className="p-2 sm:p-2.5 align-top">
                          <div className="h-28 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 flex items-center justify-center text-[11px] font-bold text-slate-300 dark:text-slate-700 select-none">
                            —
                          </div>
                        </td>
                      );
                    }

                    const isCm = session.type.includes('CM');
                    const isTd = session.type.includes('TD');

                    return (
                      <td key={day.key} className="p-2 sm:p-2.5 align-top">
                        <div
                          className={cn(
                            "h-28 rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredSchedule.map((item, idx) => {
            const isCm = item.type.includes('CM');
            const isTd = item.type.includes('TD');

            return (
              <div
                key={idx}
                className={cn(
                  "p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col justify-between space-y-4 group",
                  isCm
                    ? "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50 hover:border-blue-500"
                    : isTd
                    ? "bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-900/50 hover:border-violet-500"
                    : "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-500"
                )}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.day}
                    </span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                      isCm
                        ? "bg-[#001A4B] text-white"
                        : isTd
                        ? "bg-violet-600 text-white"
                        : "bg-emerald-600 text-white"
                    )}>
                      {item.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 
                      <span className="truncate">{item.professor}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" /> {item.time}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {item.location}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Aperçu Emploi du Temps PDF (Responsive A4 Paysage) ── */}
      {isPreviewModalOpen && previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <span>Aperçu Officiel · Emploi du Temps</span>
                    <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      A4 Paysage
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {studentGroupName} • Sous-groupe {studentSubGroup} • {studentFiliereName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={() => window.open(previewPdfUrl, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  title="Ouvrir en plein écran dans un nouvel onglet"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nouvel Onglet</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Télécharger</span>
                </button>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Fermer l'aperçu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF IFrame */}
            <div className="flex-1 p-2 sm:p-4 bg-slate-100/50 dark:bg-slate-950/50 overflow-hidden flex flex-col items-center justify-center">
              <iframe
                src={`${previewPdfUrl}#toolbar=0&navpanes=0`}
                className="w-full h-[65vh] sm:h-[75vh] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner"
                title="Aperçu Emploi du Temps PDF"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
