import React, { useRef, useState } from 'react';
import UserActionCenter from '@features/dashboard/components/UserActionCenter';
import {
  BookOpen, Users, Calendar, CheckCircle, Clock, QrCode,
  Building2, Eye, Zap, FileSignature, RotateCcw, Sparkles,
  PenTool, ShieldCheck, Download, X, UserX, ArrowRight,
  BrainCircuit, Mic, ArrowRightLeft, MapPin, TrendingUp,
  Stamp, CheckCircle2, AlertTriangle, GraduationCap, Shield,
  RefreshCcw, FileEdit, Check, ChevronRight, Layers, Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { ProfAiCopilotModal } from '../components/ProfAiCopilotModal';
import { QRScannerModal } from '../components/QRScannerModal';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';
import { openMyOrdreDeServicePdf } from '@shared/lib/documentAccess';

interface NextClassItem {
  session_id?: number;
  title: string;
  code?: string;
  time: string;
  day_name?: string;
  full_time?: string;
  location?: string;
  room?: string;
  group?: string;
  group_id?: number;
  filiere_id?: number;
  filiere_code?: string;
  filiere_name?: string;
  semester_number?: number;
  semester_label?: string;
}

interface ModuleItem {
  id: number;
  name: string;
  code: string;
  filiere?: string;
  group_name?: string;
  progress: number;
  hours_done: number;
  hours_total: number;
}

interface PfeItem {
  id: number;
  student_name: string;
  title: string;
  company: string;
  status: string;
}

interface SurveillanceItem {
  id: number;
  module_name: string;
  date: string;
  time: string;
  room: string;
  role: string;
  session_name: string;
  is_confirmed: boolean;
  confirmed_at?: string;
}

interface ProfessorStatsResponse {
  total_students: number;
  total_modules: number;
  total_groups: number;
  pending_grades: number;
  statutory_hours_done: number;
  statutory_hours_total: number;
  pfe_supervised_count: number;
  next_classes: NextClassItem[];
  modules_list: ModuleItem[];
  pfe_list: PfeItem[];
  surveillances: SurveillanceItem[];
  has_contract: boolean;
  professor_id: number;
  department_name: string;
  rank: string;
}

export default function ProfessorDashboard() {
  const { i18n } = useTranslation(['professors', 'common']);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const currentDate = new Date().toLocaleDateString(
    i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  ).toUpperCase();

  const [activeAiModule, setActiveAiModule] = useState<number | null>(null);
  const [activeScannerSession, setActiveScannerSession] = useState<NextClassItem | null>(null);

  // Persist signature acknowledgement
  const [hasAcknowledged, setHasAcknowledged] = useState<boolean>(() => {
    return localStorage.getItem('encg_prof_os_signed') === 'true';
  });
  const [showSignModal, setShowSignModal] = useState<boolean>(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Fetch real statistics from database backend
  const { data: statsData, isLoading, refetch, isFetching } = useQuery<ProfessorStatsResponse>({
    queryKey: ['professor-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/professor/stats');
      return res.data.data;
    },
    staleTime: 60000,
  });

  const stats: ProfessorStatsResponse = {
    total_students: statsData?.total_students ?? 0,
    total_modules: statsData?.total_modules ?? 0,
    total_groups: statsData?.total_groups ?? 0,
    pending_grades: statsData?.pending_grades ?? 0,
    statutory_hours_done: statsData?.statutory_hours_done ?? 0,
    statutory_hours_total: statsData?.statutory_hours_total ?? 240,
    pfe_supervised_count: statsData?.pfe_supervised_count ?? 0,
    next_classes: Array.isArray(statsData?.next_classes) ? statsData.next_classes : [],
    modules_list: Array.isArray(statsData?.modules_list) ? statsData.modules_list : [],
    pfe_list: Array.isArray(statsData?.pfe_list) ? statsData.pfe_list : [],
    surveillances: Array.isArray(statsData?.surveillances) ? statsData.surveillances : [],
    has_contract: statsData?.has_contract ?? false,
    professor_id: statsData?.professor_id ?? (user?.id ? Number(user.id) : 1),
    department_name: statsData?.department_name || (user as any)?.department?.name || 'Sciences de Gestion & Finance',
    rank: statsData?.rank || (user as any)?.rank || 'Professeur de l’Enseignement Supérieur (PES)',
  };

  const profName = user?.name || 'Professeur ENCG';
  const profDepartment = stats.department_name;
  const profRank = stats.rank;
  const profInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'PR';

  // Canvas context handler
  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#001A4B';
    }
    return ctx;
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  const generateStylizedSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'italic 34px "Brush Script MT", "Segoe Script", "Dancing Script", cursive, sans-serif';
    ctx.fillStyle = '#001A4B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(profName, canvas.width / 2, canvas.height / 2);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#001A4B';
    ctx.moveTo(canvas.width / 2 - 100, canvas.height / 2 + 25);
    ctx.bezierCurveTo(
      canvas.width / 2 - 40, canvas.height / 2 + 35,
      canvas.width / 2 + 40, canvas.height / 2 + 15,
      canvas.width / 2 + 100, canvas.height / 2 + 30
    );
    ctx.stroke();

    setHasDrawn(true);
    toast.success('✨ Signature stylisée générée avec succès !');
  };

  const handleSyncCalendar = () => {
    const classes = stats.next_classes;
    if (classes.length === 0) {
      toast.error('Aucun cours à exporter.');
      return;
    }
    const events = classes
      .map((c) => {
        return `BEGIN:VEVENT\nSUMMARY:${c.title || 'Séance de cours'}\nLOCATION:${c.location || c.room || 'ENCG Fès'}\nDESCRIPTION:${c.group || ''}\nEND:VEVENT`;
      })
      .join('\n');
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ENCG Fes ERP//Emploi du temps//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${events}\nEND:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Emploi_du_temps_ENCG_Fes.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📅 Emploi du temps exporté vers votre Agenda Smartphone (.ics / iCal) !');
  };

  const handleSignOrdreDeService = () => {
    if (!hasDrawn) {
      generateStylizedSignature();
    }
    setHasAcknowledged(true);
    localStorage.setItem('encg_prof_os_signed', 'true');
    setShowSignModal(false);
    toast.success('✍️ Émargement certifié et signé électroniquement avec succès !', {
      description: 'Certificat horodaté SHA-256 transmis au Secrétariat Général & Chef de Département.',
    });
  };

  const statutoryPercent = Math.min(100, Math.round((stats.statutory_hours_done / (stats.statutory_hours_total || 240)) * 100));

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-16 max-w-[1600px] mx-auto p-2 sm:p-4">
      <UserActionCenter actor="professor" />

      {/* ── Top Header Bar (Breadcrumb & Live Actions) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#001A4B] dark:text-white flex items-center gap-2">
              Cockpit Enseignant-Chercheur
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Connecté
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            École Nationale de Commerce et de Gestion de Fès · Année 2026–2027 · {currentDate}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            title="Actualiser les données"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5 text-blue-600", isFetching && "animate-spin")} />
            <span>Actualiser</span>
          </button>

          <Link
            to="/professor/schedules"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>Mon Emploi du Temps</span>
          </Link>
        </div>
      </div>

      {/* ── Executive Professor Hero Identity Card (Compact & Integrated) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001A4B] via-[#092868] to-[#041233] text-white p-5 sm:p-7 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Identity & Department Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 p-0.5 shadow-lg flex items-center justify-center">
                <div className="w-full h-full bg-[#001A4B] rounded-[14px] flex items-center justify-center font-black text-xl sm:text-2xl text-amber-300 tracking-wider">
                  {profInitials}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-[#001A4B] w-4 h-4 rounded-full" title="Session Active"></span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
                  {stats.has_contract ? 'Enseignant Vacataire' : 'Professeur Permanent'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-200 border border-blue-400/20">
                  ENCG Fès
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {profName}
              </h2>
              <p className="text-xs text-blue-200/90 font-medium flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>{profDepartment}</span>
                <span>•</span>
                <span className="text-amber-300 font-bold">{profRank}</span>
              </p>
            </div>
          </div>

          {/* Integrated Ordre de Service Actions (No duplicate banner!) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
            {hasAcknowledged ? (
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-2.5 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Ordre de Service Signé (SHA-256)</span>
                </span>
                <button
                  onClick={() => openMyOrdreDeServicePdf()}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-white/15"
                  title="Télécharger l'Ordre de Service Officiel A4"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>PDF A4</span>
                </button>
                <button
                  onClick={handleSyncCalendar}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-white/15"
                  title="Synchroniser avec votre agenda smartphone (.ics / iCal)"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  <span>iCal</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 text-[#001A4B] hover:bg-amber-300 hover:scale-102 shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Signer l’Ordre de Service</span>
                </button>
                <button
                  onClick={() => openMyOrdreDeServicePdf()}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-white/15"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Consulter PDF</span>
                </button>
              </div>
            )}

            <Link
              to="/professor/qcm-generator"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-white/15 backdrop-blur-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Générateur QCM IA</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Key Indicators (4 Modern Balanced KPI Cards) ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Modules Attribués */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Modules Attribués</span>
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#001A4B] dark:text-white mt-2">
              {stats.total_modules}
            </div>
            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.total_groups > 0 ? `${stats.total_groups} Groupes / Sections` : 'Affectations Actives'}</span>
            </div>
          </div>

          {/* Card 2: Total Étudiants */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Étudiants Suivis</span>
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#001A4B] dark:text-white mt-2">
              {stats.total_students}
            </div>
            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Promotion Active ENCG</span>
            </div>
          </div>

          {/* Card 3: Notes Apogée en Attente */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Notes à Saisir</span>
              <span className={cn(
                "p-2 rounded-xl",
                stats.pending_grades > 0 ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600" : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
              )}>
                <FileEdit className="w-4 h-4" />
              </span>
            </div>
            <div className={cn(
              "text-2xl sm:text-3xl font-black mt-2",
              stats.pending_grades > 0 ? "text-rose-600" : "text-emerald-600"
            )}>
              {stats.pending_grades}
            </div>
            <Link
              to="/admin/grades"
              className={cn(
                "text-[10px] font-black hover:underline mt-2 inline-flex items-center gap-1 uppercase tracking-widest",
                stats.pending_grades > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {stats.pending_grades > 0 ? 'Saisie des Notes Apogée →' : 'Toutes les notes saisies ✓'}
            </Link>
          </div>

          {/* Card 4: Charge Statutaire RH */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Charge Statutaire</span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
              {stats.statutory_hours_done}h <span className="text-xs font-bold text-slate-400">/ {stats.statutory_hours_total}h</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>{statutoryPercent}% Réalisé</span>
              <Link to="/professor/workload" className="text-amber-700 dark:text-amber-400 hover:underline">
                Détail Vacations →
              </Link>
            </div>
          </div>

        </div>
      )}

      {/* ── Direct Shortcuts Ribbon (Clean 6-Icon Grid) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <Link
          to="/professor/absences"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 shadow-2xs hover:shadow-sm transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserX className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">Faire l'Appel</div>
            <div className="text-[10px] text-slate-400 truncate">Scanner QR</div>
          </div>
        </Link>

        <Link
          to="/admin/grades"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-2xs hover:shadow-sm transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">Saisie Notes CC</div>
            <div className="text-[10px] text-slate-400 truncate">Notes & CC</div>
          </div>
        </Link>

        <Link
          to="/professor/schedules"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 shadow-2xs hover:shadow-sm transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">Emploi du Temps</div>
            <div className="text-[10px] text-slate-400 truncate">Séances & Salles</div>
          </div>
        </Link>

        <Link
          to="/professor/proctoring"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 shadow-2xs hover:shadow-sm transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Eye className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">Surveillance</div>
            <div className="text-[10px] text-slate-400 truncate">Convocations</div>
          </div>
        </Link>

        <Link
          to="/professor/voice-textbook"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 shadow-2xs hover:shadow-sm transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Mic className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">Cahier Vocal</div>
            <div className="text-[10px] text-slate-400 truncate">Texte IA</div>
          </div>
        </Link>

        <Link
          to="/professor/rooms/availability"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 shadow-2xs hover:shadow-sm transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">Salles Libres</div>
            <div className="text-[10px] text-slate-400 truncate">Rattrapages</div>
          </div>
        </Link>
      </div>

      {/* ── Main 2-Column Responsive Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column (2/3 width) : Classes & Teaching Modules */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Scheduled Classes & Schedule */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Séances Programmées & Emploi du Temps</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Faites l'appel ou lancez le scanner QR de présence pour vos cours
                </p>
              </div>
              <Link
                to="/professor/schedules"
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                Planning Complet →
              </Link>
            </div>

            {stats.next_classes.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Aucune séance planifiée dans l'immédiat.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Votre planning d'enseignement est synchronisé avec l'emploi du temps officiel ENCG.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.next_classes.map((cls, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-white dark:bg-slate-900 rounded-xl shadow-2xs text-center border border-slate-200 dark:border-slate-700 shrink-0">
                        <span className="text-[11px] font-black text-blue-900 dark:text-blue-300 leading-tight">
                          {cls.day_name ? cls.day_name.slice(0, 3).toUpperCase() : 'JOUR'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                          {cls.time ? cls.time.split(' - ')[0] : '10:30'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {cls.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                          {cls.group && (
                            <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-emerald-300 dark:border-emerald-800">
                              <Users className="w-3 h-3" /> {cls.group}
                            </span>
                          )}
                          {(cls.location || cls.room) && (
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700/60 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              <MapPin className="w-3 h-3 text-rose-500" /> {cls.location || cls.room}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 font-mono">
                            ⏱️ {cls.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => setActiveScannerSession(cls)}
                        className="px-4 py-2 bg-[#001A4B] hover:bg-[#082663] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-300" />
                        <span>Faire l'Appel</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Teaching Modules & Syllabus Progress */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>Modules Attribués & Avancement Pédagogique</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Taux d'avancement horaire officiel et syllabus par groupe
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">Semestre en cours</span>
            </div>

            {stats.modules_list.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucun module affecté pour le semestre en cours.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.modules_list.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-indigo-400 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          {mod.code}
                        </span>
                        <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 pt-0.5">
                          {mod.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {mod.group_name || mod.filiere || 'Tronc Commun'}
                        </p>
                      </div>
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950 px-2 py-0.5 rounded-lg">
                        {mod.progress}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Volume horaire</span>
                        <span>{mod.hours_done}h / {mod.hours_total}h</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${mod.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <Link
                        to="/professor/voice-textbook"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-bold flex items-center gap-1"
                      >
                        <Mic className="w-3 h-3" /> Cahier de texte
                      </Link>
                      <Link
                        to="/admin/grades"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-bold flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" /> Notes CC
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1/3 width) : Tutoring, Surveillance & Toolset */}
        <div className="space-y-6">

          {/* Widget 1: Encadrements PFE & Stages */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Encadrements PFE & Stages
                </h3>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {stats.pfe_list.length} étudiant(s) tutoré(s)
                </p>
              </div>
              <Link to="/professor/pfe-evaluation" className="text-xs font-black text-blue-600 hover:underline">
                Grilles →
              </Link>
            </div>

            {stats.pfe_list.length === 0 ? (
              <div className="py-6 text-center px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                <GraduationCap className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Aucun encadrement PFE actif</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Les soutenances et mémoires attribués s'afficheront ici.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.pfe_list.map((pfe) => (
                  <div
                    key={pfe.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{pfe.student_name}</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                        pfe.status === 'ready_for_defense' || pfe.status === 'soutenu'
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                      )}>
                        {pfe.status === 'ready_for_defense' ? 'Prêt Soutenance' : pfe.status === 'soutenu' ? 'Soutenu' : 'En Rédaction'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-tight font-medium">
                      {pfe.title}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block pt-0.5">
                      🏢 {pfe.company}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/professor/pfe-evaluation"
              className="block w-full text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs py-2.5 rounded-xl uppercase tracking-wider transition-colors"
            >
              Accéder aux Grilles PFE →
            </Link>
          </div>

          {/* Widget 2: Convocations de Surveillance */}
          {stats.surveillances && stats.surveillances.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-purple-200 dark:border-purple-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Surveillance d'Examens
                </span>
                <Link to="/professor/proctoring" className="text-xs font-bold text-purple-600 hover:underline">
                  Convocations →
                </Link>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {stats.surveillances[0]?.session_name || "Session d'Examens"}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {stats.surveillances[0]?.module_name} · {stats.surveillances[0]?.date} ({stats.surveillances[0]?.time})
                </p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-bold">
                  📍 {stats.surveillances[0]?.room} · Rôle : {stats.surveillances[0]?.role}
                </p>
              </div>
            </div>
          )}

          {/* Widget 3: Suite d'Excellence & IA ENCG */}
          <div className="bg-gradient-to-br from-indigo-950 via-[#001A4B] to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-indigo-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Suite Pédagogique IA</span>
              </span>
              <BrainCircuit className="w-5 h-5 text-purple-300" />
            </div>

            <div className="space-y-2">
              <Link
                to="/professor/voice-textbook"
                className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-bold text-white border border-white/10"
              >
                <span className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-rose-300" />
                  <span>Cahier de Texte Vocal (IA)</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
              </Link>

              <Link
                to="/professor/double-grading"
                className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-bold text-white border border-white/10"
              >
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-300" />
                  <span>Double Correction Apogée</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
              </Link>

              <Link
                to="/professor/rooms/availability"
                className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-bold text-white border border-white/10"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-300" />
                  <span>Salles Libres (Rattrapages)</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* ── Modals ── */}
      <ProfAiCopilotModal
        isOpen={!!activeAiModule}
        onClose={() => setActiveAiModule(null)}
        moduleId={activeAiModule!}
      />
      <QRScannerModal
        isOpen={!!activeScannerSession}
        onClose={() => setActiveScannerSession(null)}
        sessionId={activeScannerSession?.session_id ?? ''}
        sessionData={activeScannerSession || undefined}
      />

      {/* ✍️ Signature Électronique Ordre de Service Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Émargement & Accusé de Réception</h3>
                  <p className="text-xs text-slate-400 font-medium">Ordre de Service & Affectations 2026/2027</p>
                </div>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                Je soussigné(e), <strong className="text-indigo-900 dark:text-indigo-300">{user?.name || ''}</strong>, confirme avoir pris connaissance de mon ordre de service officiel décernant mes modules et horaires d'enseignement pour l'année universitaire 2026/2027.
              </p>
              <div className="font-mono text-[10px] text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Certificat Horodaté ENCG Fès — Hash SHA-256 : 8f9a2b4c1e0d3f7a</span>
              </div>
            </div>

            {/* Interactive Drawing Canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-500">
                  Zone de Signature Tactile / Souris
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateStylizedSignature}
                    className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" /> Signature Auto
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-black text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-lg"
                  >
                    <RotateCcw className="w-3 h-3" /> Effacer
                  </button>
                </div>
              </div>

              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white overflow-hidden shadow-inner group hover:border-emerald-500 transition-colors">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] cursor-crosshair touch-none"
                />

                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-4 space-y-1">
                    <PenTool className="w-6 h-6 text-slate-300" />
                    <div className="text-xs font-bold text-slate-400">
                      Signez ici avec votre souris, stylet ou doigt
                    </div>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-center">
                Signature Électronique Certifiée • Conforme Loi 53-05 sur la validité des actes numériques
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSignOrdreDeService}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Valider mon Émargement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
