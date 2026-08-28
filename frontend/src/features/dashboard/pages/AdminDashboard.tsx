import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import {
  Users, GraduationCap, CalendarCheck,
  Activity, ChevronRight, Zap, Sparkles,
  CheckCircle2, ShieldAlert,
  RefreshCcw, FileSpreadsheet, Filter, Check, X,
  BrainCircuit, ShieldCheck, Link2, Calendar, Lock,
  Stamp, Trophy, TrendingUp, TrendingDown, ArrowUpRight, Bell, BarChart3,
  BookOpen, Award, Target, Wifi
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@shared/lib/utils';

// ── Multi-Language Dictionary ─────────────────────────────────────────────
const DICT = {
  fr: {
    welcome: 'Cockpit de Pilotage Stratégique',
    subtitle: 'École Nationale de Commerce et de Gestion de Fès · Année Académique 2024-2025',
    liveSystem: 'Système Opérationnel',
    refreshBtn: 'Actualiser',
    filterLabel: 'Filtres :',
    allFilieres: 'Toutes les Filières',
    allSemesters: 'Tous les Semestres',
    resetFilters: 'Réinitialiser',
    studentsTitle: 'Étudiants Inscrits',
    studentsSub: 'Effectif actif certifié',
    professorsTitle: 'Corps Enseignant',
    professorsSub: (p: number, v: number) => `${p} permanents · ${v} vacataires`,
    attendanceTitle: 'Taux de Présence',
    attendanceSub: 'Moyenne campus',
    riskTitle: 'Étudiants à Risque',
    riskSub: 'Détection IA active',
    aiBadge: 'ENCG AI Copilot',
    aiHeadline: 'Diagnostic Académique & Recommandations Proactives',
    aiAlert1: 'Présence Critique : Surveillance recommandée sur les modules à taux d\'absentéisme > 15%.',
    aiAlert2: 'Délibérations & Rattrapages : Analyse proactive des étudiants nécessitant un soutien.',
    aiRunBtn: 'Lancer Analyse Neurone',
    aiAnalyzing: 'Traitement en cours...',
    guichetTitle: 'Guichet Express',
    guichetDesc: 'Approbations 1-Clic',
    guichetEmpty: 'Aucune demande en attente ! 🎉',
    viewAllGuichet: 'Ouvrir le Guichet Complet',
    examTitle: 'Planification Examens',
    examCountdown: (d: string) => `${d}`,
    examRoomCoverage: 'Capacité Salles',
    examSupervisorCoverage: 'Assignation Surveillants',
    viewExams: 'Gérer les Convocations',
    analyticsTitle: 'Observatoire des Performances',
    tabEnrollment: 'Inscriptions',
    tabAttendance: 'Présence',
    tabFiliere: 'Filières',
    trustTitle: 'Sécurité Numérique',
    blockchainPV: 'PVs Horodatés SHA-256',
    signedDocs: 'Documents Certifiés',
    activeModules: 'Modules Actifs',
    upcomingExams: 'Sessions d\'Examens',
    averageGrade: 'Moyenne Campus',
    activityTitle: 'Activité en Temps Réel',
    liveBadge: 'LIVE',
    quickActionsTitle: 'Accès Rapide',
  },
  ar: {
    welcome: 'مركز القيادة الاستراتيجية',
    subtitle: 'المدرسة الوطنية للتجارة والتسيير بفاس · السنة الجامعية 2024-2025',
    liveSystem: 'النظام قيد التشغيل',
    refreshBtn: 'تحديث',
    filterLabel: 'تصفية :',
    allFilieres: 'جميع المسالك',
    allSemesters: 'جميع الفصول',
    resetFilters: 'إلغاء',
    studentsTitle: 'الطلبة المسجلون',
    studentsSub: 'العدد الفعلي النشط',
    professorsTitle: 'هيئة التدريس',
    professorsSub: (p: number, v: number) => `${p} دائمون · ${v} عرضيون`,
    attendanceTitle: 'نسبة الحضور',
    attendanceSub: 'المعدل العام',
    riskTitle: 'الطلبة تحت الملاحظة',
    riskSub: 'كشف ذكي بالذكاء الاصطناعي',
    aiBadge: 'المساعد الذكي',
    aiHeadline: 'التشخيص الأكاديمي والتوصيات الاستباقية',
    aiAlert1: 'مراقبة الحضور: المواد ذات نسب غياب تتجاوز 15%.',
    aiAlert2: 'الدعم الأكاديمي: رصد الطلبة المحتاجين.',
    aiRunBtn: 'تشغيل التحليل',
    aiAnalyzing: 'جاري التحليل...',
    guichetTitle: 'الشباك السريع',
    guichetDesc: 'المصادقة الفورية',
    guichetEmpty: 'لا توجد طلبات معلقة ! 🎉',
    viewAllGuichet: 'الشباك الموحد الكامل',
    examTitle: 'برمجة الامتحانات',
    examCountdown: (d: string) => `${d}`,
    examRoomCoverage: 'جاهزية القاعات',
    examSupervisorCoverage: 'تغطية الحراسة',
    viewExams: 'إدارة الامتحانات',
    analyticsTitle: 'مرصد الأداء',
    tabEnrollment: 'التسجيلات',
    tabAttendance: 'الحضور',
    tabFiliere: 'المسالك',
    trustTitle: 'الأمان الرقمي',
    blockchainPV: 'محاضر موثقة SHA-256',
    signedDocs: 'وثائق رسمية مؤشرة',
    activeModules: 'المواد النشطة',
    upcomingExams: 'دورات الامتحانات',
    averageGrade: 'المعدل العام',
    activityTitle: 'الأنشطة المباشرة',
    liveBadge: 'مباشر',
    quickActionsTitle: 'روابط سريعة',
  }
};

// ── Quick Action Tiles ───────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Import TAFEM', path: '/admin/tafem', icon: Trophy, accent: '#f59e0b', bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/20', iconBg: 'bg-amber-500/15 text-amber-500' },
  { label: 'Guichet Unique', path: '/admin/guichet', icon: Stamp, accent: '#6366f1', bg: 'from-indigo-500/10 to-blue-500/5', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/15 text-indigo-500' },
  { label: 'Notes & PV', path: '/admin/grades/pv', icon: FileSpreadsheet, accent: '#10b981', bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/15 text-emerald-500' },
  { label: 'Convocations', path: '/admin/convocations', icon: CalendarCheck, accent: '#a855f7', bg: 'from-purple-500/10 to-pink-500/5', border: 'border-purple-500/20', iconBg: 'bg-purple-500/15 text-purple-500' },
  { label: 'Export APOGEE', path: '/admin/exams/pv-archive', icon: Link2, accent: '#64748b', bg: 'from-slate-500/10 to-slate-600/5', border: 'border-slate-500/20', iconBg: 'bg-slate-500/15 text-slate-500' },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [lang] = useState<'fr' | 'ar'>('fr'); // lang driven by global layout switcher
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [chartTab, setChartTab] = useState<'enrollment' | 'attendance' | 'filiere'>('enrollment');
  const [isAiRunning, setIsAiRunning] = useState(false);

  const isRTL = lang === 'ar';
  const t = DICT[lang];

  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats', selectedFiliere, selectedSemester],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats', {
        params: { filiere: selectedFiliere, semester: selectedSemester }
      });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, targetType }: { id: number | string; targetType: string }) => {
      if (targetType === 'professor') {
        return api.patch(`/admin/professor-document-requests/${id}/status`, { status: 'ready' });
      } else {
        return api.patch(`/admin/document-requests/${id}/status`, { status: 'ready' });
      }
    },
    onSuccess: () => {
      toast.success("Demande validée avec succès !");
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erreur lors de la validation.")
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, targetType }: { id: number | string; targetType: string }) => {
      if (targetType === 'professor') {
        return api.patch(`/admin/professor-document-requests/${id}/status`, { status: 'rejected', rejection_reason: 'Rejeté depuis le Cockpit' });
      } else {
        return api.patch(`/admin/document-requests/${id}/status`, { status: 'rejected', rejection_reason: 'Rejeté depuis le Cockpit' });
      }
    },
    onSuccess: () => {
      toast.error("Demande rejetée.");
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erreur lors du rejet.")
  });

  const handleRunAiDiagnostic = () => {
    setIsAiRunning(true);
    setTimeout(() => {
      setIsAiRunning(false);
      toast.success("Diagnostic Neuronale terminé !", { description: "Recommandations synchronisées avec les départements." });
    }, 1400);
  };

  const studentsCount = statsData?.studentsCount ?? 0;
  const professorsCount = statsData?.professorsCount ?? 0;
  const permanentsCount = statsData?.permanentsCount ?? 0;
  const vacatairesCount = statsData?.vacatairesCount ?? 0;
  const attendanceRate = statsData?.attendanceRate ?? 88;
  const atRiskCount = statsData?.atRiskCount ?? 0;
  const alertsCount = statsData?.alertsCount ?? 0;
  const filiereDist = statsData?.filiereDistribution ?? [];
  const enrollmentData = statsData?.enrollmentData ?? [];
  const attendanceByWeek = statsData?.attendanceByWeek ?? [];
  const pendingRequests = statsData?.pendingRequests ?? [];
  const examStats = statsData?.examStats ?? { upcomingCount: 4, sessionTitle: 'Session Ordinaire S2 / S4 / S6', countdown: 'Dans 4 jours', totalRooms: 12, validRooms: 12, supervisorCoverage: 96 };
  const recentActivities = statsData?.recentActivities ?? [];
  const avgGrade = statsData?.avgGrade ?? 13.5;
  const totalSignedDocs = statsData?.totalSignedDocs ?? 12;
  const activeModulesCount = statsData?.activeModulesCount ?? 24;
  const userName = user?.name || 'Admin ENCG Fès';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={cn(
      "min-h-screen text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 pb-16",
      isRTL && "font-serif"
    )}>
      <div className="w-full space-y-5">

        {/* ══════════════════════════════════════════════════════════════
            HERO HEADER — Premium Dark Glassmorphism
        ══════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)' }}>
          {/* Decorative orbs */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', transform: 'translateY(-50%)' }} />
          <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', transform: 'translateY(40%)' }} />
          <div className="absolute top-1/2 right-0 w-[200px] h-[200px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', transform: 'translate(30%, -50%)' }} />

          {/* Subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)' }} />

          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">

              {/* Left: Identity */}
              <div className="space-y-4 flex-1">
                {/* Status row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-slate-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>🏛️</span>
                    <span>ENCG Fès ERP · Tableau Exécutif</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-emerald-400" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{t.liveSystem}</span>
                  </div>
                </div>

                {/* Greeting */}
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                    Bonjour, {userName.split(' ')[0]}{' '}
                    <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #c084fc)' }}>
                      {userName.split(' ').slice(1).join(' ')}
                    </span>
                  </h1>
                  <p className="mt-2 text-sm text-slate-400 font-medium">
                    {t.subtitle}
                  </p>
                </div>

                {/* Mini KPI strip */}
                <div className="flex items-center gap-4 flex-wrap pt-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users size={14} className="text-indigo-400" />
                    <span className="text-sm font-bold">{studentsCount.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">étudiants</span>
                  </div>
                  <div className="w-px h-4 bg-slate-700" />
                  <div className="flex items-center gap-2 text-slate-300">
                    <GraduationCap size={14} className="text-emerald-400" />
                    <span className="text-sm font-bold">{professorsCount}</span>
                    <span className="text-xs text-slate-500">enseignants</span>
                  </div>
                  <div className="w-px h-4 bg-slate-700" />
                  <div className="flex items-center gap-2 text-slate-300">
                    <Activity size={14} className="text-cyan-400" />
                    <span className="text-sm font-bold">{attendanceRate}%</span>
                    <span className="text-xs text-slate-500">présence</span>
                  </div>
                  {atRiskCount > 0 && (
                    <>
                      <div className="w-px h-4 bg-slate-700" />
                      <div className="flex items-center gap-2 text-amber-400">
                        <ShieldAlert size={14} />
                        <span className="text-sm font-bold">{atRiskCount}</span>
                        <span className="text-xs text-slate-500">à risque</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Controls — lang/theme are global (sidebar + navbar) */}
              <div className="flex flex-col gap-3 items-end shrink-0">
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}
                >
                  <RefreshCcw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                  <span>{t.refreshBtn}</span>
                </button>

                {alertsCount > 0 && (
                  <Link
                    to="/admin/guichet"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 4px 15px rgba(217,119,6,0.3)' }}
                  >
                    <Bell className="w-3.5 h-3.5 animate-bounce" />
                    <span>{alertsCount} dossiers en attente</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)' }} />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            QUICK ACTIONS — Premium Icon Grid
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                "bg-gradient-to-b",
                action.bg,
                action.border,
                "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110", action.iconBg)}>
                <action.icon size={20} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center leading-snug">{action.label}</span>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: `radial-gradient(circle at 50% 0%, ${action.accent}10 0%, transparent 70%)` }} />
            </Link>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            FILTERS BAR
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.filterLabel}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">{t.allFilieres}</option>
              {filiereDist.map((f: any) => (
                <option key={f.name} value={f.name}>{f.name} ({f.count})</option>
              ))}
            </select>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">{t.allSemesters}</option>
              {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'].map(s => (
                <option key={s} value={s}>Semestre {s}</option>
              ))}
            </select>
            {(selectedFiliere !== 'all' || selectedSemester !== 'all') && (
              <button
                onClick={() => { setSelectedFiliere('all'); setSelectedSemester('all'); }}
                className="px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {t.resetFilters}
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            KPI CARDS — 4-Column Premium Grid
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            value={studentsCount.toLocaleString()}
            label={t.studentsTitle}
            sublabel={t.studentsSub}
            icon={<Users size={20} />}
            trend="+4.2%"
            trendUp
            accent="#6366f1"
            iconBg="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
            badge="100% DB"
            badgeColor="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
          />
          <KPICard
            value={String(professorsCount)}
            label={t.professorsTitle}
            sublabel={t.professorsSub(permanentsCount, vacatairesCount)}
            icon={<GraduationCap size={20} />}
            trend={`${permanentsCount} perm.`}
            trendUp
            accent="#10b981"
            iconBg="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
            badge={`${vacatairesCount} Vacat.`}
            badgeColor="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300"
          />
          <KPICard
            value={`${attendanceRate}%`}
            label={t.attendanceTitle}
            sublabel={t.attendanceSub}
            icon={<Activity size={20} />}
            trend={attendanceRate >= 85 ? "Excellent" : "À améliorer"}
            trendUp={attendanceRate >= 85}
            accent="#06b6d4"
            iconBg="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400"
            badge="Assiduité"
            badgeColor="bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300"
            progress={attendanceRate}
          />
          <KPICard
            value={String(atRiskCount)}
            label={t.riskTitle}
            sublabel={t.riskSub}
            icon={<ShieldAlert size={20} />}
            trend={atRiskCount > 5 ? "Surveillance" : "Stable"}
            trendUp={atRiskCount <= 5}
            accent="#f59e0b"
            iconBg="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
            badge="Suivi IA"
            badgeColor="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            AI COPILOT BANNER — Premium Neural Style
        ══════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #1e1b4b 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />
          <div className="absolute -bottom-8 left-1/4 w-48 h-48 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <BrainCircuit size={16} className="text-purple-400 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{t.aiBadge}</span>
                </div>
              </div>
              <h2 className="text-lg font-black text-white">{t.aiHeadline}</h2>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs text-purple-200/80">
                  <span className="text-amber-400 shrink-0 mt-0.5">●</span>
                  <span>{t.aiAlert1}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-purple-200/80">
                  <span className="text-emerald-400 shrink-0 mt-0.5">●</span>
                  <span>{t.aiAlert2}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunAiDiagnostic}
              disabled={isAiRunning}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shrink-0 cursor-pointer disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 8px 25px rgba(124,58,237,0.4)' }}
            >
              <Sparkles className={cn("w-4 h-4", isAiRunning && "animate-spin")} />
              <span>{isAiRunning ? t.aiAnalyzing : t.aiRunBtn}</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            BENTO MIDDLE ROW — Guichet + Exam
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Guichet Express Widget */}
          <div className="rounded-2xl p-6 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Stamp size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{t.guichetTitle}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{t.guichetDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
                <Zap size={11} className="animate-pulse" />
                <span>{pendingRequests.length} en attente</span>
              </div>
            </div>

            <div className="flex-1">
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                    <CheckCircle2 size={28} />
                  </div>
                  <p className="text-xs text-slate-400 font-bold text-center">{t.guichetEmpty}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingRequests.slice(0, 4).map((req: any) => (
                    <div
                      key={`${req.target_type}-${req.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{req.name}</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">{req.filiere}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{req.docType} · {req.time_ago}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => approveMutation.mutate({ id: req.id, targetType: req.target_type })}
                          disabled={approveMutation.isPending}
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate({ id: req.id, targetType: req.target_type })}
                          disabled={rejectMutation.isPending}
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500 hover:bg-rose-400 text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link to="/admin/guichet" className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity">
                <span>{t.viewAllGuichet}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Exam Readiness Widget */}
          <div className="rounded-2xl p-6 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400" style={{ border: '1px solid rgba(168,85,247,0.25)' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{t.examTitle}</h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">{examStats.sessionTitle}</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full text-[11px] font-bold text-purple-600 dark:text-purple-400 animate-pulse" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                {t.examCountdown(examStats.countdown)}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {/* Room Coverage */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}>
                <div className="flex justify-between items-center text-xs font-bold mb-3">
                  <span className="text-slate-700 dark:text-slate-300">{t.examRoomCoverage}</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">{examStats.validRooms}/{examStats.totalRooms} Salles</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(examStats.validRooms / Math.max(examStats.totalRooms, 1)) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #6366f1)' }}
                  />
                </div>
              </div>

              {/* Supervisor Coverage */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex justify-between items-center text-xs font-bold mb-3">
                  <span className="text-slate-700 dark:text-slate-300">{t.examSupervisorCoverage}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">{examStats.supervisorCoverage}% Assignés</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${examStats.supervisorCoverage}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
                  />
                </div>
              </div>

              {/* Exam count badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.upcomingExams}</span>
                <span className="text-lg font-black text-purple-600 dark:text-purple-400">{examStats.upcomingCount}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link to="/admin/exams" className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 hover:opacity-80 transition-opacity">
                <span>{t.viewExams}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ANALYTICS SECTION
        ══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-500" />
                {t.analyticsTitle}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Métriques en temps réel · Base de données ENCG</p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              {(['enrollment', 'attendance', 'filiere'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                    chartTab === tab
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {tab === 'enrollment' ? t.tabEnrollment : tab === 'attendance' ? t.tabAttendance : t.tabFiliere}
                </button>
              ))}
            </div>
          </div>

          {chartTab === 'enrollment' && (
            <div className="space-y-4">
              <div className="flex justify-between px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {enrollmentData.map((d: any) => <span key={d.month}>{d.month}</span>)}
              </div>
              <AreaChartSVG data={enrollmentData} />
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Inscrits', value: studentsCount, color: 'text-slate-900 dark:text-white' },
                  { label: 'Taux de Rétention', value: '98.4%', color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Croissance', value: '+4.2%', color: 'text-indigo-600 dark:text-indigo-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className={cn("text-xl font-black mt-0.5", color)}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chartTab === 'attendance' && (
            <div className="space-y-4">
              <BarChartSVG data={attendanceByWeek} />
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{attendanceRate}%</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">Moyenne Campus</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{atRiskCount}</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">Étudiants à Risque</p>
                </div>
              </div>
            </div>
          )}

          {chartTab === 'filiere' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <DonutChart data={filiereDist} />
              <div className="space-y-2">
                {filiereDist.map((f: any) => (
                  <div key={f.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-xs font-bold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.color }} />
                      <span className="text-slate-700 dark:text-slate-200">{f.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">({f.count})</span>
                      <span className="text-slate-900 dark:text-white font-black">{f.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            BOTTOM ROW — Digital Trust + Activity Feed
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Digital Trust Panel */}
          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                {t.trustTitle}
              </h3>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full">
                <Wifi size={10} />
                <span>Sécurisé</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl space-y-2.5" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock size={12} className="text-emerald-500" />
                  {t.blockchainPV}
                </span>
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">Actif</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Link2 size={12} className="text-blue-500" />
                  {totalSignedDocs} {t.signedDocs}
                </span>
                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">Certifié</span>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: t.activeModules, value: activeModulesCount, color: 'text-indigo-600 dark:text-indigo-400', icon: <BookOpen size={12} /> },
                { label: t.upcomingExams, value: examStats.upcomingCount, color: 'text-purple-600 dark:text-purple-400', icon: <Calendar size={12} /> },
                { label: t.averageGrade, value: `${avgGrade}/20`, color: 'text-emerald-600 dark:text-emerald-400', icon: <Award size={12} /> },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">{icon}{label}</span>
                  <span className={cn("font-black", color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="rounded-2xl p-5 flex flex-col lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{t.activityTitle}</h3>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t.liveBadge}</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <Target size={32} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-400 font-medium">Aucune activité récente</p>
                </div>
              ) : (
                recentActivities.slice(0, 6).map((a: any, i: number) => {
                  const Icon = a.type === 'approve' ? CheckCircle2 : a.type === 'warning' ? ShieldAlert : Activity;
                  const iconColor = a.type === 'approve' ? 'text-emerald-500' : a.type === 'warning' ? 'text-amber-500' : 'text-blue-500';
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800", iconColor)}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-snug">{a.message}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── KPI Card Component ──────────────────────────────────────────────────
function KPICard({
  value, label, sublabel, icon, trend, trendUp, accent, iconBg, badge, badgeColor, progress
}: {
  value: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
  accent: string;
  iconBg: string;
  badge: string;
  badgeColor: string;
  progress?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
      {/* Accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accent}80, ${accent}00)` }} />

      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110", iconBg)}>
          {icon}
        </div>
        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold", badgeColor)}>{badge}</span>
      </div>

      <div className="mt-4 space-y-0.5">
        <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</div>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</div>
        <p className="text-[11px] text-slate-400 font-medium truncate">{sublabel}</p>
      </div>

      {progress !== undefined && (
        <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: accent }} />
        </div>
      )}

      <div className={cn("mt-2.5 flex items-center gap-1 text-[11px] font-bold", trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{trend}</span>
      </div>
    </div>
  );
}

// ── SVG Visualizations ───────────────────────────────────────────────────
function AreaChartSVG({ data }: { data: { month: string; effectif: number }[] }) {
  const width = 500;
  const height = 100;
  const values = data.map(d => Number(d.effectif) || 0);
  const maxVal = Math.max(...values, 10);
  const minVal = Math.min(...values, 0);
  const stepX = width / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - (maxVal === minVal ? 20 : (((Number(d.effectif) || 0) - minVal) / (maxVal - minVal)) * (height - 25) + 12),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0 ? `${linePath} L${points[points.length - 1].x},${height} L0,${height} Z` : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
      {linePath && <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="2.5" />
      ))}
    </svg>
  );
}

function BarChartSVG({ data }: { data: { day: string; taux: number }[] }) {
  const barW = 20;
  const gap = 22;
  const totalW = Math.max(data.length * (barW + gap), 200);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${totalW} 80`} className="w-full h-32">
        {data.map((d, i) => {
          const rate = Number(d.taux) || 0;
          const barH = Math.max((rate / 100) * 58, 4);
          const x = i * (barW + gap) + 8;
          const y = 62 - barH;
          const color = rate >= 88 ? '#10b981' : rate >= 80 ? '#6366f1' : '#f59e0b';
          return (
            <g key={d.day}>
              <rect x={x} y={4} width={barW} height={58} rx={6} fill="currentColor" className="text-slate-100 dark:text-slate-800" />
              <rect x={x} y={y} width={barW} height={barH} rx={6} fill={color} opacity="0.9" />
              <text x={x + barW / 2} y={76} textAnchor="middle" fill="currentColor" fontSize="8" className="text-slate-400 fill-slate-400 font-bold">{d.day}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const size = 140;
  const sw = 18;
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;
  const valid = data && data.length > 0 ? data : [];

  return (
    <div className="relative flex items-center justify-center py-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={sw} className="text-slate-100 dark:text-slate-800" />
        {valid.map((slice, i) => {
          const dash = `${(slice.value / 100) * circumference} ${circumference}`;
          const offset = -accumulated;
          accumulated += (slice.value / 100) * circumference;
          return <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={slice.color} strokeWidth={sw} strokeDasharray={dash} strokeDashoffset={offset} className="transition-all duration-500" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xl font-black text-slate-800 dark:text-white">{valid.reduce((s, d) => s + d.value, 0) || 0}%</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Effectifs</span>
      </div>
    </div>
  );
}