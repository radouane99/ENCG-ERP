import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import {
  Users, GraduationCap, BookOpen, CalendarCheck,
  TrendingUp, TrendingDown, Clock, AlertCircle,
  Activity, Award, Layers, FileText, ChevronRight, Zap, Sparkles,
  UserPlus, CheckCircle2, ShieldAlert,
  RefreshCcw, FileSpreadsheet, Filter, Check, X,
  BrainCircuit, ShieldCheck, Link2, Calendar, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Default Data Fallbacks ───────────────────────────────────────────────
const defaultEnrollmentData = [
  { month: 'Sep', students: 420 },
  { month: 'Oct', students: 418 },
  { month: 'Nov', students: 415 },
  { month: 'Déc', students: 410 },
  { month: 'Jan', students: 408 },
  { month: 'Fév', students: 425 },
  { month: 'Mar', students: 432 },
];

const defaultAttendanceByWeek = [
  { day: 'Lun', rate: 87 },
  { day: 'Mar', rate: 91 },
  { day: 'Mer', rate: 88 },
  { day: 'Jeu', rate: 85 },
  { day: 'Ven', rate: 79 },
  { day: 'Sam', rate: 72 },
];

const defaultRecentActivities = [
  { type: 'student', message: 'Nouveau dossier étudiant enregistré (ENCG Fès)', time: 'Il y a 2h', icon: Users },
  { type: 'grade', message: 'Nouvelle note saisie - Management Stratégique S5', time: 'Il y a 3h', icon: BookOpen },
  { type: 'doc', message: 'Demande d\'attestation de scolarité approuvée', time: 'Il y a 1j', icon: FileText },
  { type: 'exam', message: 'Planning d\'examen Session Ordinaire validé', time: 'Il y a 2j', icon: CalendarCheck },
];

const quickActions = [
  { label: 'Inscrire Étudiant', icon: UserPlus, color: 'from-blue-600 to-indigo-600 text-white shadow-blue-500/20', link: '/academic/enrollments' },
  { label: 'Saisir Notes', icon: FileSpreadsheet, color: 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/20', link: '/admin/grades' },
  { label: 'Planifier Examen', icon: CalendarCheck, color: 'from-purple-600 to-indigo-600 text-white shadow-purple-500/20', link: '/admin/exams' },
  { label: 'Générer PV', icon: FileText, color: 'from-amber-600 to-orange-600 text-white shadow-amber-500/20', link: '/admin/grades/pv' },
];

// Initial Pending Guichet Requests for 1-click Approval
const initialRequests = [
  { id: '1', student: 'Youssef Alami', filiere: 'GFC S5', doc: 'Attestation de scolarité', date: 'Il y a 10 min' },
  { id: '2', student: 'Salma Mansouri', filiere: 'MCM S3', doc: 'Relevé de notes officiel', date: 'Il y a 45 min' },
  { id: '3', student: 'Mohamed Tazi', filiere: 'TC S1', doc: 'Carte Étudiant Pass Numérique', date: 'Il y a 2h' },
];

// ── SVG Area Chart ───────────────────────────────────────────────────
const AreaChartSVG: React.FC<{ data: { month: string; students: number }[] }> = ({ data }) => {
  const width = 300;
  const height = 100;
  const maxVal = Math.max(...data.map(d => d.students), 1);
  const minVal = Math.min(...data.map(d => d.students), 0);
  const stepX = width / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - (maxVal === minVal ? 0 : ((d.students - minVal) / (maxVal - minVal)) * (height - 15) + 5),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0 ? `${linePath} L${points[points.length - 1].x},${height} L0,${height} Z` : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
      {linePath && <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((p, i) => (
        <g key={i} className="group cursor-pointer">
          <circle cx={p.x} cy={p.y} r="4" fill="#818cf8" stroke="#ffffff" strokeWidth="2" className="transition-transform group-hover:scale-150" />
        </g>
      ))}
    </svg>
  );
};

// ── SVG Bar Chart ────────────────────────────────────────────────────
const BarChartSVG: React.FC<{ data: { day: string; rate: number }[] }> = ({ data }) => {
  const maxRate = 100;
  const barW = 14;
  const gap = 12;
  const totalW = Math.max(data.length * (barW + gap), 120);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${totalW} 75`} className="w-full h-28">
        {data.map((d, i) => {
          const barH = (d.rate / maxRate) * 55;
          const x = i * (barW + gap) + gap / 2;
          const y = 60 - barH;
          const color = d.rate >= 88 ? '#10b981' : d.rate >= 80 ? '#6366f1' : '#f59e0b';
          return (
            <g key={i} className="group">
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} className="transition-all opacity-90 group-hover:opacity-100 group-hover:scale-y-105" />
              <text x={x + barW / 2} y={72} textAnchor="middle" fontSize="6 font-bold" fill="currentColor" className="text-slate-500 dark:text-slate-400 font-semibold">{d.day}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Donut Chart ──────────────────────────────────────────────────────
const DonutChart: React.FC<{ data: any[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + (d.value || d.count || 0), 0) || 1;
  const cx = 50; const cy = 50; const r = 35;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-36">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth={12} />
      {data.map((d, i) => {
        const val = d.value || d.count || 0;
        const dash = (val / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={d.color || '#6366f1'}
            strokeWidth={12}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circumference / total + circumference * 0.25}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
            className="transition-all duration-300"
          />
        );
        offset += val;
        return el;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">{total}%</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="5" className="fill-slate-400 font-bold uppercase tracking-wider">Total</text>
    </svg>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  trend?: number;
  gradient: string;
  iconBg: string;
}> = ({ icon, label, value, sub, badge, badgeColor, trend, gradient, iconBg }) => (
  <div className={`relative overflow-hidden rounded-3xl border p-5 group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${gradient}`}>
    <div className="flex items-start justify-between relative z-10">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-extrabold uppercase tracking-wider">{label}</p>
          {badge && (
            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
        {sub && <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1.5">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{Math.abs(trend)}% ce mois</span>
          </div>
        )}
      </div>
      <div className={`p-3.5 rounded-2xl ${iconBg} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md shrink-0`}>
        {icon}
      </div>
    </div>
  </div>
);

// ── Activity dot colors ────────────────────────────────────────────────
const activityColors: Record<string, string> = {
  student: 'bg-blue-500 ring-blue-500/20',
  grade: 'bg-emerald-500 ring-emerald-500/20',
  exam: 'bg-purple-500 ring-purple-500/20',
  alert: 'bg-rose-500 ring-rose-500/20',
  doc: 'bg-amber-500 ring-amber-500/20',
};

// ── Main Dashboard ────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const now = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Interactive state
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [pendingRequests, setPendingRequests] = useState(initialRequests);
  const [isAiRunning, setIsAiRunning] = useState(false);

  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats', selectedFiliere, selectedSemester],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats', {
        params: { filiere: selectedFiliere, semester: selectedSemester }
      });
      return res.data.data;
    }
  });

  const handleApproveRequest = (id: string, student: string, doc: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== id));
    toast.success(`Demande de "${doc}" approuvée pour ${student} !`);
  };

  const handleRejectRequest = (id: string, student: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== id));
    toast.error(`Demande rejetée pour ${student}.`);
  };

  const handleRunAiDiagnostic = () => {
    setIsAiRunning(true);
    setTimeout(() => {
      setIsAiRunning(false);
      toast.success("Diagnostic IA exécuté avec succès : 3 recommandations générées !", {
        description: "Baisse de présence détectée en S5 GFC. Alertes transmises aux chefs de département."
      });
    }, 1500);
  };

  const studentsCount = statsData?.studentsCount ?? 72;
  const professorsCount = statsData?.professorsCount ?? 5;
  const permanentsCount = statsData?.permanentsCount ?? 5;
  const vacatairesCount = statsData?.vacatairesCount ?? 0;
  const attendanceRate = statsData?.attendanceRate ?? 85;
  const alertsCount = statsData?.alertsCount ?? 5;
  
  const defaultFiliereDist = [
    { name: 'GFC', value: 33, color: '#10b981' },
    { name: 'MCM', value: 33, color: '#3b82f6' },
    { name: 'TC', value: 34, color: '#f59e0b' },
  ];
  
  const filiereDist = statsData?.filiereDistribution?.length ? statsData.filiereDistribution : defaultFiliereDist;
  const enrollmentData = statsData?.enrollmentData?.length ? statsData.enrollmentData : defaultEnrollmentData;
  const attendanceByWeek = statsData?.attendanceByWeek?.length ? statsData.attendanceByWeek : defaultAttendanceByWeek;
  const recentActivities = statsData?.recentActivities?.length ? statsData.recentActivities : defaultRecentActivities;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* ── Welcome Hero Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-700/50">
        {/* Glow & Geometric background accents */}
        <div className="absolute -top-24 -end-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-64 h-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                🎓 ENCG Fès ERP • Portail Administration
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                En Ligne
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-amber-200">{user?.name || 'Administrateur'}</span> 👋
            </h1>

            <p className="text-indigo-200/80 text-sm font-medium capitalize">
              {now} · <span className="text-white font-bold">Année Académique 2024-2025</span>
            </p>
          </div>

          {/* Quick Action Pills in Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-white text-xs font-bold backdrop-blur-md">
              <Zap size={14} className={alertsCount > 0 ? "text-amber-400 animate-pulse" : "text-emerald-400"} />
              <span>{alertsCount} alertes système</span>
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. Global Filter Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Filtres de données :</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Filière filter */}
          <select
            value={selectedFiliere}
            onChange={(e) => setSelectedFiliere(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">Toutes les Filières</option>
            <option value="GFC">GFC — Finance & Contrôle</option>
            <option value="MCM">MCM — Marketing & Commerce</option>
            <option value="TC">TC — Tronc Commun</option>
          </select>

          {/* Semester filter */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">Tous les Semestres</option>
            <option value="S1">Semestre S1</option>
            <option value="S2">Semestre S2</option>
            <option value="S3">Semestre S3</option>
            <option value="S4">Semestre S4</option>
            <option value="S5">Semestre S5</option>
            <option value="S6">Semestre S6</option>
          </select>

          {(selectedFiliere !== 'all' || selectedSemester !== 'all') && (
            <button
              onClick={() => { setSelectedFiliere('all'); setSelectedSemester('all'); }}
              className="px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── 2. AI Copilot & Insights Widget Banner ──────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-900 to-slate-900 border border-purple-500/30 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-black text-purple-300 uppercase tracking-widest">
                Insights & Diagnostic IA ENCG
              </span>
            </div>
            <h2 className="text-lg font-black text-white">Recommandations en temps réel générées par l'IA</h2>
            <div className="space-y-1 text-xs text-purple-200/90 font-medium pt-1">
              <p>• 💡 <span className="font-bold text-amber-300">Baisse de Présence :</span> 3 modules en S5 GFC enregistrent une baisse de présence &gt; 20%.</p>
              <p>• ⚠️ <span className="font-bold text-rose-300">Rattrapage Prédictif :</span> 28 étudiants nécessitent un suivi pédagogique ciblé.</p>
            </div>
          </div>

          <button
            onClick={handleRunAiDiagnostic}
            disabled={isAiRunning}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <BrainCircuit className={isAiRunning ? "w-4 h-4 animate-spin text-purple-300" : "w-4 h-4 text-purple-300"} />
            <span>{isAiRunning ? "Analyse en cours..." : "Lancer Diagnostic IA"}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={22} className="text-indigo-600 dark:text-indigo-300" />}
          label="Étudiants Inscrits"
          value={studentsCount.toLocaleString()}
          sub="Actifs ce semestre"
          badge="+2.8%"
          badgeColor="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
          gradient="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm"
          iconBg="bg-indigo-50 dark:bg-indigo-950/60"
        />
        <StatCard
          icon={<GraduationCap size={22} className="text-emerald-600 dark:text-emerald-300" />}
          label="Corps Enseignant"
          value={professorsCount}
          sub={`${permanentsCount} permanents · ${vacatairesCount} vacataires`}
          badge="100% Actif"
          badgeColor="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300"
          gradient="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm"
          iconBg="bg-emerald-50 dark:bg-emerald-950/60"
        />
        <StatCard
          icon={<Activity size={22} className="text-cyan-600 dark:text-cyan-300" />}
          label="Taux de Présence"
          value={`${attendanceRate}%`}
          sub="Moyenne globale enregistrée"
          badge="Excellence"
          badgeColor="bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300"
          gradient="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm"
          iconBg="bg-cyan-50 dark:bg-cyan-950/60"
        />
        <StatCard
          icon={<ShieldAlert size={22} className="text-amber-600 dark:text-amber-300" />}
          label="Étudiants à Risque"
          value="28"
          sub="Détectés par l'IA prédictive"
          badge="Suivi IA"
          badgeColor="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300"
          gradient="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm"
          iconBg="bg-amber-50 dark:bg-amber-950/60"
        />
      </div>

      {/* ── 3. Guichet Express & Exam Countdown Grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ⚡ Express Approvals Widget */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-base">Guichet Express — Approbations 1-Clic</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Demandes administratives urgentes</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-black text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400 rounded-full">
              {pendingRequests.length} en attente
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span>Toutes les demandes en attente ont été traitées !</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">{req.student}</p>
                      <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">{req.filiere}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{req.doc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleApproveRequest(req.id, req.student, req.doc)}
                      className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                      title="Approuver"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id, req.student)}
                      className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                      title="Rejeter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Link to="/admin/requests" className="hover:underline flex items-center gap-1">
              <span>Voir le guichet complet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 📅 Upcoming Exams Countdown & Readiness */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-base">Planning Examens & Salles</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Session Ordinaire S2 / S4 / S6</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-black text-purple-600 bg-purple-100 dark:bg-purple-950 dark:text-purple-400 rounded-full animate-pulse">
                Dans 3j 14h
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200/60 dark:border-purple-800/60">
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Préparation Salles & Amphis :</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">12 / 12 Salles Valides</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-600 w-full" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/60 dark:border-emerald-800/60">
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Couverture Surveillants :</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">95% Assignés</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-600 w-[95%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-purple-600 dark:text-purple-400">
            <Link to="/admin/exams" className="hover:underline flex items-center gap-1">
              <span>Gérer les convocations & examens</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* ── Charts Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area Chart — Enrollment Evolution */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-base">Évolution des Inscriptions</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">Semestre en cours · Année Académique 2024-2025</p>
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full font-black">
              +2.8% ↑
            </span>
          </div>

          <div className="flex justify-between px-2 text-[11px] font-bold text-slate-400 mb-1">
            {enrollmentData.map((d: any) => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>

          <AreaChartSVG data={enrollmentData} />

          {/* Stat indicators */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Effectif Max</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">432</p>
            </div>
            <div className="text-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Effectif Min</p>
              <p className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">408</p>
            </div>
            <div className="text-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Moyenne</p>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">418</p>
            </div>
          </div>
        </div>

        {/* Donut — Filière Distribution */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-base">Répartition Filières</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">Par effectif d'étudiants inscrits</p>
              </div>
              <Layers size={18} className="text-slate-400" />
            </div>

            <DonutChart data={filiereDist} />
          </div>

          <div className="space-y-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {filiereDist.map((f: any) => (
              <div key={f.name} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: f.color }} />
                  <span className="text-slate-700 dark:text-slate-300">{f.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${f.value}%`, background: f.color }} />
                  </div>
                  <span className="text-slate-900 dark:text-slate-100 font-black w-8 text-end">{f.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Attendance Bar Chart */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-base">Présence par Jour</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">Semaine en cours</p>
            </div>
            <div className="flex gap-1.5">
              {[{ c: 'bg-emerald-500', l: '≥88%' }, { c: 'bg-indigo-500', l: '≥80%' }, { c: 'bg-amber-500', l: '<80%' }].map(b => (
                <div key={b.l} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${b.c}`} />
                  <span className="text-slate-400 text-[10px] font-bold">{b.l}</span>
                </div>
              ))}
            </div>
          </div>

          <BarChartSVG data={attendanceByWeek} />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-2xl p-3 text-center">
              <p className="text-emerald-600 dark:text-emerald-400 text-xl font-black">87.3%</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mt-0.5">Taux Moyen</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-2xl p-3 text-center">
              <p className="text-amber-600 dark:text-amber-400 text-xl font-black">28</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mt-0.5">Absences non justifiées</p>
            </div>
          </div>
        </div>

        {/* Key Indicators & Blockchain */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-base">Indicateurs & Certifications</h3>
            <ShieldCheck size={18} className="text-emerald-500" />
          </div>

          {/* Blockchain & Apogee Status */}
          <div className="p-3.5 mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5 text-xs font-bold">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> 12 PVs Verrouillés
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">Officiel</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" /> 148 Diplômes Blockchain
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-black">Ancrés</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Modules actifs ce semestre', value: '68', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900', link: '/academic/modules' },
              { label: 'Examens à venir', value: '6', icon: CalendarCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900', link: '/admin/exams' },
              { label: 'Demandes en attente', value: '12', icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900', link: '/admin/requests' },
              { label: 'Moyenne générale /20', value: '12.4', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900', link: '/admin/grades' },
            ].map((item) => (
              <Link key={item.label} to={item.link} className={`flex items-center justify-between p-2.5 rounded-2xl border hover:scale-[1.01] transition-all ${item.bg}`}>
                <div className={`flex items-center gap-2.5 font-bold text-xs ${item.color}`}>
                  <item.icon size={14} />
                  <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                </div>
                <span className={`font-black text-sm ${item.color}`}>{item.value}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity & Quick Actions */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-base">Activité Récente</h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">En direct</span>
            </div>

            <div className="space-y-3.5">
              {recentActivities.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="relative mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${activityColors[a.type] || 'bg-indigo-500'} ring-4`} />
                    {i < recentActivities.length - 1 && (
                      <div className="absolute top-3 start-1 w-px h-6 bg-slate-200 dark:bg-slate-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {a.message}
                    </p>
                    <p className="text-slate-400 text-[10px] font-semibold mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2.5">Actions Rapides</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a: any) => (
                <Link 
                  key={a.label} 
                  to={a.link} 
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r ${a.color} text-xs font-extrabold shadow-md hover:scale-105 transition-transform`}
                >
                  <a.icon size={14} />
                  <span className="truncate">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
