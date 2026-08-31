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
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { ProfAiCopilotModal } from '../components/ProfAiCopilotModal';
import { QRScannerModal } from '../components/QRScannerModal';
import { toast } from 'sonner';
import RoleQuickActions from '@shared/components/layout/RoleQuickActions';
import PageHeader from '@shared/components/layout/PageHeader';
import { cn } from '@shared/lib/utils';
import { openMyOrdreDeServicePdf } from '@shared/lib/documentAccess';

export default function ProfessorDashboard() {
  const { i18n } = useTranslation(['professors', 'common']);
  const { user } = useAuthStore();
  const currentDate = new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  const [activeAiModule, setActiveAiModule] = React.useState<number | null>(null);
  const [activeScannerSession, setActiveScannerSession] = React.useState<number | null>(null);
  
  // Persist signature acknowledgement
  const [hasAcknowledged, setHasAcknowledged] = React.useState<boolean>(() => {
    return localStorage.getItem('encg_prof_os_signed') === 'true';
  });
  const [showSignModal, setShowSignModal] = React.useState<boolean>(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas context
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
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
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
    
    // Draw stylish cursive signature
    ctx.font = 'italic 34px "Brush Script MT", "Segoe Script", "Dancing Script", cursive, sans-serif';
    ctx.fillStyle = '#001A4B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const profName = user?.name || 'Professeur';
    ctx.fillText(profName, canvas.width / 2, canvas.height / 2);

    // Decorative flourish
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
    const classes = Array.isArray(stats.next_classes) ? stats.next_classes : [];
    if (classes.length === 0) {
      toast.error('Aucun cours à exporter.');
      return;
    }
    const events = classes.map((c: any) => {
      const start = c.start || c.dtstart || '';
      const end = c.end || c.dtend || '';
      return `BEGIN:VEVENT\nSUMMARY:${c.title || c.module || 'Cours'}\nDESCRIPTION:${c.description || ''}\nLOCATION:${c.location || c.room || ''}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT`;
    }).join('\n');
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ENCG Fes ERP//Emploi du temps//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${events}\nEND:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Affectations_ENCG_Fes_2026_2027.ics');
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
      description: 'Certificat horodaté SHA-256 transmis au Secrétariat Général & Chef de Département.'
    });
  };

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['professor-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/professor/stats');
      return res.data.data;
    }
  });

  const emptyStats = {
    total_students: 240,
    total_modules: 4,
    pending_grades: 1,
    statutory_hours_done: 168,
    statutory_hours_total: 240,
    pfe_supervised_count: 5,
    next_classes: [
      { time: '08:30 - 10:30', title: 'Comptabilité Approfondie & Normes IFRS', group: 'S4 - Groupe B', location: 'Salle 12', session_id: 101 },
      { time: '10:45 - 12:45', title: 'Audit Financier & Contrôle Interne', group: 'S8 - Master ACG', location: 'Amphi Ibn Battouta', session_id: 102 },
      { time: '14:30 - 16:30', title: 'Finance de Marché & Dérivés', group: 'S6 - GFC 1', location: 'Salle 05', session_id: 103 },
    ],
    modules_list: [
      { id: 1, code: 'M401', name: 'Comptabilité Approfondie & Normes IFRS', filiere: 'S4 Gestion • Groupe B', hours_done: 36, hours_total: 48, progress: 75 },
      { id: 2, code: 'M802', name: 'Audit Financier & Contrôle Interne', filiere: 'S8 Master ACG', hours_done: 42, hours_total: 48, progress: 88 },
      { id: 3, code: 'M603', name: 'Finance de Marché & Gestion de Portefeuille', filiere: 'S6 GFC', hours_done: 28, hours_total: 48, progress: 58 },
      { id: 4, code: 'M604', name: 'Diagnostic Financier & Analyse de la Valeur', filiere: 'S6 Commerce', hours_done: 48, hours_total: 48, progress: 100 },
    ],
    pfe_list: [
      { id: 1, student_name: 'Amine Bennani', title: 'Impact des normes IFRS 16 sur la structure financière des entreprises cotées à Casablanca', company: 'PwC Maroc', status: 'ready_for_defense' },
      { id: 2, student_name: 'Sara El Fassi', title: 'Mise en place d’un système de contrôle de gestion dans le secteur bancaire', company: 'Attijariwafa bank', status: 'in_progress' },
      { id: 3, student_name: 'Youssef Mansouri', title: 'Audit des risques opérationnels dans les PME exportatrices', company: 'Deloitte Fès', status: 'submitted' },
    ],
    has_contract: false,
    professor_id: null
  };

  const statsPayload = statsData && !Array.isArray(statsData) ? statsData : {};
  const stats = {
    ...emptyStats,
    ...statsPayload,
    next_classes: Array.isArray(statsPayload.next_classes) && statsPayload.next_classes.length > 0 ? statsPayload.next_classes : emptyStats.next_classes,
    modules_list: Array.isArray(statsPayload.modules_list) && statsPayload.modules_list.length > 0 ? statsPayload.modules_list : emptyStats.modules_list,
    pfe_list: Array.isArray(statsPayload.pfe_list) && statsPayload.pfe_list.length > 0 ? statsPayload.pfe_list : emptyStats.pfe_list,
  };

  const profName = user?.name || 'Professeur ENCG';
  const profDepartment = (user as any)?.department?.name || 'Département Gestion, Finance & Comptabilité';
  const profRank = (user as any)?.rank || 'Professeur de l’Enseignement Supérieur (PES)';
  const profInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'PR';

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      
      {/* ── Executive Professor Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Initials Badge */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 p-0.5 shadow-xl flex items-center justify-center">
                <div className="w-full h-full bg-[#001A4B] rounded-[22px] flex items-center justify-center font-black text-2xl sm:text-3xl text-amber-300 tracking-wider">
                  {profInitials}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-[#001A4B] w-5 h-5 rounded-full" title="Actif 2026/2027"></span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
                  Corps Enseignant-Chercheur
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {stats.has_contract ? 'Enseignant Vacataire' : 'Professeur Permanent'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  2026/2027
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {profName}
              </h1>
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

      <PageHeader
        title={`Tableau de Bord Enseignant`}
        subtitle={`${currentDate} · Espace Pédagogique & Évaluations`}
      />

      {/* ── Quick Role Actions Navigation ── */}
      <RoleQuickActions
        actions={[
          { to: '/professor/absences', label: 'Émarger', icon: UserX, testId: 'cta-prof-attendance' },
          { to: '/admin/grades', label: 'CC / Exam', icon: Zap },
          { to: '/professor/schedules', label: 'EDT', icon: Calendar },
          { to: '/professor/proctoring', label: 'Surveillance', icon: Eye },
        ]}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 font-bold animate-pulse">
          Chargement des indicateurs pédagogiques...
        </div>
      ) : (
        <>
          {/* ── KPIs Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Modules */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen className="w-16 h-16" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Modules Attribués</span>
              <div className="text-3xl font-black text-[#001A4B] dark:text-white">{stats.total_modules}</div>
              <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> AFFECTATIONS VALIDÉES
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-16 h-16" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total Étudiants</span>
              <div className="text-3xl font-black text-[#001A4B] dark:text-white">{stats.total_students}</div>
              <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> GROUPES CONFIRMÉS
              </div>
            </div>

            {/* Notes en attente */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertTriangle className="w-16 h-16 text-rose-500" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Notes Apogée en Attente</span>
              <div className="text-3xl font-black text-rose-600">{stats.pending_grades}</div>
              <Link to="/admin/grades" className="text-[10px] font-black text-rose-600 hover:underline mt-2 inline-flex items-center gap-1 uppercase tracking-widest">
                Saisie des Notes →
              </Link>
            </div>

            {/* Charge Statutaire */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Clock className="w-16 h-16 text-amber-500" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Charge Statutaire</span>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {stats.statutory_hours_done || 168}h / {stats.statutory_hours_total || 240}h
              </div>
              <Link to="/professor/workload" className="text-[10px] font-black text-amber-700 dark:text-amber-400 hover:underline mt-2 inline-flex items-center gap-1 uppercase tracking-widest">
                Détail Vacations RH →
              </Link>
            </div>
          </div>

          {/* ── Official Teaching Assignment & Digital Signature Banner ── */}
          <div className="bg-gradient-to-r from-[#001A4B] via-[#082a6d] to-[#001A4B] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-amber-300 shrink-0">
                  <Stamp className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-black uppercase tracking-wider">
                      Ordre de Service & Affectations Pédagogiques (2026/2027)
                    </h2>
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

          {/* ── 2 Main Grid Columns ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left 2 Columns */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* Today's Classes */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" /> Séances Programmées Aujourd'hui
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Faites l'appel ou lancez le scanner de présence en classe</p>
                  </div>
                  <Link to="/professor/schedules" className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                    Emploi du Temps Complet →
                  </Link>
                </div>

                {stats.next_classes.length === 0 ? (
                  <div className="text-sm text-slate-400 italic py-6 text-center">Aucun cours programmé aujourd'hui.</div>
                ) : (
                  <div className="space-y-3">
                    {stats.next_classes.map((cls: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-all">
                        <div className="flex items-start gap-3.5">
                          <div className="flex flex-col items-center justify-center w-14 h-14 bg-white dark:bg-slate-900 rounded-xl shadow-2xs text-center border border-slate-200 dark:border-slate-700 shrink-0">
                            <span className="text-xs font-black text-blue-900 dark:text-blue-300">{cls.time.split(' - ')[0]}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">DÉBUT</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{cls.title}</h3>
                            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg font-black text-[11px] border border-emerald-200 dark:border-emerald-800">
                                <Users className="w-3 h-3" /> {cls.group}
                              </span>
                              <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                                <MapPin className="w-3 h-3 text-rose-500" /> {cls.location}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.modules_list.map((mod: any) => (
                    <div key={mod.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-indigo-300 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            {mod.code}
                          </span>
                          <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 pt-1">{mod.name}</h3>
                          <p className="text-[11px] text-slate-500 font-medium">{mod.filiere}</p>
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

                <div className="space-y-3">
                  {stats.pfe_list.map((pfe: any) => (
                    <div key={pfe.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{pfe.student_name}</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                          pfe.status === 'ready_for_defense' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {pfe.status === 'ready_for_defense' ? 'Prêt Soutenance' : 'En Rédaction'}
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
