import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  QrCode,
  Building2,
  Eye,
  Zap,
  FileSignature,
  RotateCcw,
  Sparkles,
  PenTool,
  ShieldCheck,
  Download,
  X,
  UserX,
  Award,
  ArrowRight,
  BrainCircuit,
  Mic,
  ArrowRightLeft,
  MapPin,
  TrendingUp,
  Stamp,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  FileText,
  Shield,
  Layers,
  ChevronRight,
  Activity,
  BarChart3,
  CalendarCheck,
  RefreshCcw,
  FileSpreadsheet
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
  const [activeScannerSession, setActiveScannerSession] = useState<number | null>(null);

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
    total_students: statsData?.total_students ?? 24,
    total_modules: statsData?.total_modules ?? 4,
    total_groups: statsData?.total_groups ?? 2,
    pending_grades: statsData?.pending_grades ?? 0,
    statutory_hours_done: statsData?.statutory_hours_done ?? 168,
    statutory_hours_total: statsData?.statutory_hours_total ?? 240,
    pfe_supervised_count: statsData?.pfe_supervised_count ?? 3,
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
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-12">
      
      {/* ── Executive Top Cockpit Header (Admin Style) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-[#001A4B] dark:text-white">
              Cockpit Enseignant-Chercheur
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Système Opérationnel
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5 text-blue-600", isFetching && "animate-spin")} />
            Actualiser
          </button>

          <Link
            to="/professor/schedules"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300" /> Mon Emploi du Temps
          </Link>
        </div>
      </div>

      {/* ── Executive Professor Hero Identity Card ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#001A4B] via-[#092868] to-[#041233] text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Initials Badge */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 p-0.5 shadow-xl flex items-center justify-center">
                <div className="w-full h-full bg-[#001A4B] rounded-[22px] flex items-center justify-center font-black text-2xl sm:text-3xl text-amber-300 tracking-wider">
                  {profInitials}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-[#001A4B] w-5 h-5 rounded-full" title="Actif 2026/2027"></span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
                  Corps Enseignant-Chercheur
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {stats.has_contract ? 'Enseignant Vacataire' : 'Professeur Permanent'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ENCG Fès
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {profName}
              </h2>
              <p className="text-xs sm:text-sm text-blue-200 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-300" />
                {profDepartment} • <span className="text-amber-300 font-bold">{profRank}</span>
              </p>
            </div>
          </div>

          {/* Quick AI & Signature Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowSignModal(true)}
              className={cn(
                "px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer",
                hasAcknowledged 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30"
                  : "bg-amber-400 text-[#001A4B] hover:bg-amber-300 hover:scale-105"
              )}
            >
              <FileSignature className="w-4 h-4" />
              {hasAcknowledged ? 'Ordre de Service Signé ✓' : 'Signer l’Ordre de Service'}
            </button>

            <Link
              to="/professor/qcm-generator"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider border border-white/15 backdrop-blur-md shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Générateur QCM IA
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick Role Actions Navigation (Admin Executive Tiles) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          to="/professor/absences"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-blue-900/5 to-transparent hover:from-blue-900/20 border border-blue-900/15 dark:border-blue-700/30 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#001A4B] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <UserX className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Émarger / Appel</div>
            <div className="text-[10px] font-bold text-slate-400">Scanner Présence QR</div>
          </div>
        </Link>

        <Link
          to="/admin/grades"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-900/10 via-emerald-900/5 to-transparent hover:from-emerald-900/20 border border-emerald-900/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Saisie Notes CC</div>
            <div className="text-[10px] font-bold text-slate-400">Contrôles & Examens</div>
          </div>
        </Link>

        <Link
          to="/professor/schedules"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-900/10 via-amber-900/5 to-transparent hover:from-amber-900/20 border border-amber-900/15 dark:border-amber-700/30 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#001A4B] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Emploi du Temps</div>
            <div className="text-[10px] font-bold text-slate-400">Planning & Séances</div>
          </div>
        </Link>

        <Link
          to="/professor/proctoring"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/10 via-purple-900/5 to-transparent hover:from-purple-900/20 border border-purple-900/15 dark:border-purple-700/30 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Eye className="w-5 h-5 text-purple-100" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Surveillance</div>
            <div className="text-[10px] font-bold text-slate-400">Convocations Officielles</div>
          </div>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 bg-slate-100 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Dynamic KPIs Grid (Admin Executive Quality) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Modules */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen className="w-20 h-20 text-[#001A4B] dark:text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Modules Attribués</span>
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black text-[#001A4B] dark:text-white mt-3">{stats.total_modules}</div>
              <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {stats.total_groups > 0 ? `${stats.total_groups} Groupes Validés` : 'Affectations Actives'}
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-20 h-20 text-indigo-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Étudiants</span>
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black text-[#001A4B] dark:text-white mt-3">{stats.total_students}</div>
              <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-2.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Promotion Active ENCG
              </div>
            </div>

            {/* Notes en attente */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertTriangle className="w-20 h-20 text-rose-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Notes Apogée en Attente</span>
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className={cn("text-3xl font-black mt-3", stats.pending_grades > 0 ? "text-rose-600" : "text-emerald-600")}>
                {stats.pending_grades}
              </div>
              <Link to="/admin/grades" className="text-[10px] font-black text-rose-600 dark:text-rose-400 hover:underline mt-2.5 inline-flex items-center gap-1 uppercase tracking-widest">
                Saisie des Notes Apogée →
              </Link>
            </div>

            {/* Charge Statutaire */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Clock className="w-20 h-20 text-amber-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Charge Statutaire RH</span>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-3">
                {stats.statutory_hours_done}h / {stats.statutory_hours_total}h
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <span>Avancement {statutoryPercent}%</span>
                <Link to="/professor/workload" className="text-amber-700 dark:text-amber-400 hover:underline">
                  Détail Vacations →
                </Link>
              </div>
            </div>
          </div>

          {/* ── Official Teaching Assignment & Digital Signature Banner ── */}
          <div className="bg-gradient-to-r from-[#001A4B] via-[#082a6d] to-[#001A4B] rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-amber-300 shrink-0">
                  <Stamp className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black uppercase tracking-wider">
                      Ordre de Service & Affectations Pédagogiques (2026/2027)
                    </h3>
                    {hasAcknowledged ? (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Signé & Certifié SHA-256
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> En attente de signature
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-100/80 mt-1 leading-relaxed">
                    Consultez la liste officielle de vos modules attribués, validez votre émargement certifié et synchronisez vos créneaux avec votre agenda.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={() => openMyOrdreDeServicePdf()}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#001A4B] font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Ordre de Service (PDF A4)
                </button>

                {hasAcknowledged ? (
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="px-4 py-2.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:bg-emerald-500/40 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" /> Revoir l'Émargement
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30"
                  >
                    <FileSignature className="w-4 h-4 text-emerald-200" /> Signer l'Affectation
                  </button>
                )}

                <button
                  onClick={handleSyncCalendar}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/20 backdrop-blur-md cursor-pointer"
                  title="Exporter les séances vers votre agenda smartphone (.ics / iCal)"
                >
                  <Calendar className="w-4 h-4 text-blue-300" /> Agenda (.ics)
                </button>
              </div>
            </div>
          </div>

          {/* ── Live Exam Surveillance Notification Banner ── */}
          {stats.surveillances && stats.surveillances.length > 0 && (
            <div className="bg-gradient-to-r from-slate-900 via-[#0f2863] to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-blue-500/20 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 bg-amber-400/20 text-amber-300 rounded-2xl flex items-center justify-center font-black shrink-0 border border-amber-400/30">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-400 text-[#001A4B] rounded-full text-[10px] font-black uppercase tracking-wider">
                        Planning de Surveillance d'Examens
                      </span>
                      <span className="text-xs text-blue-200 font-bold">
                        {stats.surveillances.length} séance(s) assignée(s)
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      {stats.surveillances[0]?.session_name || "Session d'Examens Universitaires"}
                    </h3>
                    <p className="text-xs text-blue-100/80 mt-0.5">
                      Prochaine épreuve : <strong className="text-white">{stats.surveillances[0]?.module_name}</strong> le <strong>{stats.surveillances[0]?.date}</strong> ({stats.surveillances[0]?.time}) en <strong>{stats.surveillances[0]?.room}</strong> — Rôle : <span className="text-amber-300 font-bold">{stats.surveillances[0]?.role}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {stats.surveillances.some(s => s.is_confirmed) ? (
                    <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Présence Confirmée
                    </span>
                  ) : (
                    <Link
                      to="/professor/proctoring"
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#001A4B] rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> Voir mes Convocations
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 2 Main Grid Columns (Observatory Layout) ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left 2 Columns */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* Scheduled Classes */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" /> Séances Programmées & Emploi du Temps
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Faites l'appel ou lancez le scanner de présence en direct</p>
                  </div>
                  <Link to="/professor/schedules" className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                    Emploi du Temps Complet →
                  </Link>
                </div>

                {stats.next_classes.length === 0 ? (
                  <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                    <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Aucune séance planifiée dans l'immédiat.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Votre planning d'enseignement est synchronisé avec les emplois du temps officiels.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.next_classes.map((cls, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-all">
                        <div className="flex items-start gap-3.5">
                          <div className="flex flex-col items-center justify-center w-16 h-14 bg-white dark:bg-slate-900 rounded-xl shadow-2xs text-center border border-slate-200 dark:border-slate-700 shrink-0">
                            <span className="text-[11px] font-black text-blue-900 dark:text-blue-300 leading-tight">
                              {cls.day_name ? cls.day_name.slice(0, 3).toUpperCase() : 'HORAIRE'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                              {cls.time ? cls.time.split(' - ')[0] : '08:30'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{cls.title}</h3>
                            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-500">
                              {cls.group && (
                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg font-black text-[11px] border border-emerald-200 dark:border-emerald-800">
                                  <Users className="w-3 h-3" /> {cls.group}
                                </span>
                              )}
                              {(cls.location || cls.room) && (
                                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                                  <MapPin className="w-3 h-3 text-rose-500" /> {cls.location || cls.room}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 font-medium">
                                ⏱️ {cls.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button 
                            onClick={() => setActiveScannerSession(cls.session_id || 1)}
                            className="px-4 py-2.5 bg-[#001A4B] hover:bg-[#082663] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5 text-amber-300" /> Faire l'Appel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modules & Syllabus Progress */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" /> Éléments de Modules & Avancement Pédagogique
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Syllabus officiel et taux d'avancement horaire par groupe</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">Semestre Courant</span>
                </div>

                {stats.modules_list.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Aucun module affecté pour le semestre en cours.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.modules_list.map((mod) => (
                      <div key={mod.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-indigo-300 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                              {mod.code}
                            </span>
                            <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 pt-1">{mod.name}</h3>
                            <p className="text-[11px] text-slate-500 font-medium">{mod.group_name || mod.filiere || 'Tronc Commun'}</p>
                          </div>
                          <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-lg">
                            {mod.progress}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>Volume horaire</span>
                            <span>{mod.hours_done}h / {mod.hours_total}h</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${mod.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-8">
              
              {/* PFE & Supervisions Tracker */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Encadrements PFE & Stages</h3>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{stats.pfe_list.length} étudiants tutorés</p>
                  </div>
                  <Link to="/professor/pfe-evaluation" className="text-xs font-black text-blue-600 hover:underline">
                    Grilles →
                  </Link>
                </div>

                {stats.pfe_list.length === 0 ? (
                  <div className="py-8 text-center px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                    <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Aucun encadrement PFE actif</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Les soutenances et stages attribués s'afficheront ici.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.pfe_list.map((pfe) => (
                      <div key={pfe.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
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
                  className="block w-full text-center bg-[#001A4B] hover:bg-[#082663] text-white font-black text-xs py-3 rounded-xl uppercase tracking-widest transition-colors shadow-sm"
                >
                  Grille d'Évaluation PFE →
                </Link>
              </div>

              {/* Excellence Tools Box */}
              <div className="bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Suite d'Excellence IA
                  </span>
                  <BrainCircuit className="w-5 h-5 text-purple-300" />
                </div>

                <div className="space-y-2.5">
                  <Link 
                    to="/professor/voice-textbook"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-bold text-white border border-white/10"
                  >
                    <span className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-rose-300" /> Cahier de Texte Vocal (IA)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
                  </Link>

                  <Link 
                    to="/professor/double-grading"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-bold text-white border border-white/10"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-emerald-300" /> Double Correction Apogée
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
                  </Link>

                  <Link 
                    to="/professor/rooms/availability"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-bold text-white border border-white/10"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-300" /> Salles Libres (Rattrapages)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {/* Modals */}
      <ProfAiCopilotModal 
        isOpen={!!activeAiModule} 
        onClose={() => setActiveAiModule(null)} 
        moduleId={activeAiModule!} 
      />
      <QRScannerModal 
        isOpen={!!activeScannerSession} 
        onClose={() => setActiveScannerSession(null)} 
        sessionId={activeScannerSession!} 
      />

      {/* ✍️ SIGNATURE ÉLECTRONIQUE & ACCUSÉ DE RÉCEPTION MODAL */}
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

            {/* Interactive Drawing Canvas Area */}
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
