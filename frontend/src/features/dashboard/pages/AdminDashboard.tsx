import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  Users, GraduationCap, BookOpen, CalendarCheck,
  TrendingUp, TrendingDown, Clock, AlertCircle,
  Activity, ArrowUpRight, Award, Layers,
  FileText, Bell, ChevronRight, Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Default Data ────────────────────────────────────────────────────────
const enrollmentData = [
  { month: 'Sep', students: 420 },
  { month: 'Oct', students: 418 },
  { month: 'Nov', students: 415 },
  { month: 'Déc', students: 410 },
  { month: 'Jan', students: 408 },
  { month: 'Fév', students: 425 },
  { month: 'Mar', students: 432 },
];

const filiereDistribution = [
  { name: 'GFC', value: 38, color: '#3b82f6' },
  { name: 'MCM', value: 28, color: '#6366f1' },
  { name: 'GRH', value: 18, color: '#8b5cf6' },
  { name: 'ACG', value: 12, color: '#a78bfa' },
  { name: 'ESCM', value: 4, color: '#c4b5fd' },
];

const attendanceByWeek = [
  { day: 'Lun', rate: 87 },
  { day: 'Mar', rate: 91 },
  { day: 'Mer', rate: 88 },
  { day: 'Jeu', rate: 85 },
  { day: 'Ven', rate: 79 },
  { day: 'Sam', rate: 72 },
];

const recentActivities = [
  { type: 'student', message: '23 nouveaux étudiants inscrits ce mois', time: 'Il y a 2h', icon: Users },
  { type: 'grade', message: 'Notes de GFC-S5 saisies par Prof. Benali', time: 'Il y a 3h', icon: BookOpen },
  { type: 'exam', message: 'Planning examens S2 publié', time: 'Il y a 5h', icon: CalendarCheck },
  { type: 'alert', message: '28 étudiants détectés à risque (IA)', time: 'Il y a 1j', icon: AlertCircle },
  { type: 'doc', message: '12 demandes de documents en attente', time: 'Il y a 1j', icon: FileText },
];

const quickActions = [
  { label: 'Nouvel étudiant', icon: Users, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400', link: '/students/new' },
  { label: 'Créer examen', icon: CalendarCheck, color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400', link: '/academic/exam-planning' },
  { label: 'Générer rapport', icon: FileText, color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400', link: '/documents/requests' },
  { label: 'Notification', icon: Bell, color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400', link: '/announcements' },
];

// ── SVG Area Chart ───────────────────────────────────────────────────
const AreaChartSVG: React.FC<{ data: { month: string; students: number }[] }> = ({ data }) => {
  const width = 100;
  const height = 60;
  const maxVal = Math.max(...data.map(d => d.students));
  const minVal = Math.min(...data.map(d => d.students)) - 5;
  const stepX = width / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - ((d.students - minVal) / (maxVal - minVal)) * height,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#3b82f6" />
      ))}
    </svg>
  );
};

// ── SVG Bar Chart ────────────────────────────────────────────────────
const BarChartSVG: React.FC<{ data: { day: string; rate: number }[] }> = ({ data }) => {
  const maxRate = 100;
  const barW = 10;
  const gap = 8;
  const totalW = data.length * (barW + gap);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${totalW} 70`} className="w-full" style={{ height: 110 }}>
        {data.map((d, i) => {
          const barH = (d.rate / maxRate) * 55;
          const x = i * (barW + gap) + gap / 2;
          const y = 60 - barH;
          const color = d.rate >= 88 ? '#10b981' : d.rate >= 80 ? '#6366f1' : '#f59e0b';
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={color} opacity="0.85" />
              <text x={x + barW / 2} y={68} textAnchor="middle" fontSize="5" fill="currentColor" className="text-muted-foreground">{d.day}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Donut Chart ──────────────────────────────────────────────────────
const DonutChart: React.FC<{ data: any[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 50; const cy = 50; const r = 35; const ir = 22;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height: 140 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-border" strokeWidth={13} />
      {data.map((d, i) => {
        const dash = (d.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={12}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circumference / total + circumference * 0.25}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
          />
        );
        offset += d.value;
        return el;
      })}
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">{total}%</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="5" fill="currentColor" className="text-muted-foreground">total</text>
    </svg>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  gradient: string;
  iconBg: string;
}> = ({ icon, label, value, sub, trend, gradient, iconBg }) => (
  <div className={`relative overflow-hidden rounded-2xl border p-5 group hover:scale-[1.02] transition-all duration-300 ${gradient}`}>
    {/* Glow blob */}
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: 'white' }} />

    <div className="flex items-start justify-between relative z-10">
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-2">{label}</p>
        <p className="text-3xl font-extrabold text-foreground tracking-tight leading-none">{value}</p>
        {sub && <p className="text-muted-foreground text-xs mt-1">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{Math.abs(trend)}% ce mois</span>
          </div>
        )}
      </div>
      <div className={`p-3.5 rounded-xl ${iconBg} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

// ── Activity dot colors ────────────────────────────────────────────────
const activityColors: Record<string, string> = {
  student: 'bg-blue-500',
  grade: 'bg-emerald-500',
  exam: 'bg-amber-500',
  alert: 'bg-red-500',
  doc: 'bg-purple-500',
};

// ── Main Dashboard ────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const now = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard/stats');
      return res.data.data;
    }
  });

  const studentsCount = statsData?.studentsCount ?? 0;
  const professorsCount = statsData?.professorsCount ?? 0;
  const permanentsCount = statsData?.permanentsCount ?? 0;
  const vacatairesCount = statsData?.vacatairesCount ?? 0;
  const attendanceRate = statsData?.attendanceRate ?? 0;
  const alertsCount = statsData?.alertsCount ?? 0;
  const filiereDist = statsData?.filiereDistribution ?? [];

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003a8c]"></div></div>;
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.name?.split(' ')[0] ?? 'Admin'}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 capitalize">{now} · Année académique 2024-2025</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs bg-muted/50 border border-border px-3 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Système opérationnel
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs bg-muted/50 border border-border px-3 py-2 rounded-xl">
            <Zap size={12} className={alertsCount > 0 ? "text-amber-400" : "text-emerald-400"} />
            <span>{alertsCount} alertes</span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} className="text-blue-300" />}
          label="Étudiants inscrits"
          value={studentsCount.toLocaleString()}
          sub="Actifs ce semestre"
          trend={0}
          gradient="bg-gradient-to-br from-blue-600/20 to-blue-900/10 border-blue-500/20"
          iconBg="bg-blue-500/25"
        />
        <StatCard
          icon={<GraduationCap size={20} className="text-indigo-300" />}
          label="Corps enseignant"
          value={professorsCount}
          sub={`${permanentsCount} permanents · ${vacatairesCount} vacataires`}
          trend={0}
          gradient="bg-gradient-to-br from-indigo-600/20 to-indigo-900/10 border-indigo-500/20"
          iconBg="bg-indigo-500/25"
        />
        <StatCard
          icon={<Activity size={20} className="text-emerald-300" />}
          label="Taux de présence"
          value={`${attendanceRate}%`}
          sub="Moyenne globale enregistrée"
          trend={0}
          gradient="bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border-emerald-500/20"
          iconBg="bg-emerald-500/25"
        />
        <StatCard
          icon={<AlertCircle size={20} className="text-amber-300" />}
          label="Étudiants à risque"
          value="28"
          sub="Détectés par l'IA prédictive"
          trend={5}
          gradient="bg-gradient-to-br from-amber-600/20 to-amber-900/10 border-amber-500/20"
          iconBg="bg-amber-500/25"
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area Chart — Enrollment */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.04] border border-border p-5 hover:bg-white/[0.06] transition-colors">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-foreground font-semibold">Évolution des inscriptions</h3>
              <p className="text-muted-foreground text-xs">Semestre en cours · 2024-2025</p>
            </div>
            <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium">
              +2.8% ↑
            </span>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between px-1 mb-1 mt-3">
            {enrollmentData.map(d => (
              <span key={d.month} className="text-foreground/30 text-[10px]">{d.month}</span>
            ))}
          </div>
          <AreaChartSVG data={enrollmentData} />

          {/* Summary pills */}
          <div className="flex gap-3 mt-3">
            {[
              { label: 'Max', value: '432', color: 'text-emerald-400' },
              { label: 'Min', value: '408', color: 'text-red-400' },
              { label: 'Moy', value: '418', color: 'text-blue-400' },
            ].map(p => (
              <div key={p.label} className="flex-1 text-center bg-muted/50 rounded-xl py-2">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{p.label}</p>
                <p className={`text-sm font-bold ${p.color}`}>{p.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Donut — Filière Distribution */}
        <div className="rounded-2xl bg-white/[0.04] border border-border p-5 hover:bg-white/[0.06] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-foreground font-semibold">Répartition filières</h3>
              <p className="text-muted-foreground text-xs">Par effectif inscrits</p>
            </div>
            <Layers size={15} className="text-foreground/20" />
          </div>
          <DonutChart data={filiereDist} />
          <div className="space-y-2 mt-1">
            {filiereDist.map((f: any) => (
              <div key={f.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: f.color }} />
                  <span className="text-foreground/55 text-xs">{f.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${f.value}%`, background: f.color }} />
                  </div>
                  <span className="text-foreground text-xs font-semibold w-8 text-right">{f.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar Chart — Attendance */}
        <div className="rounded-2xl bg-white/[0.04] border border-border p-5 hover:bg-white/[0.06] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-foreground font-semibold">Présence par jour</h3>
              <p className="text-muted-foreground text-xs">Semaine en cours</p>
            </div>
            <div className="flex gap-1.5">
              {[{ c: 'bg-emerald-400', l: '≥88%' }, { c: 'bg-indigo-400', l: '≥80%' }, { c: 'bg-amber-400', l: '<80%' }].map(b => (
                <div key={b.l} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${b.c}`} />
                  <span className="text-foreground/30 text-[9px]">{b.l}</span>
                </div>
              ))}
            </div>
          </div>
          <BarChartSVG data={attendanceByWeek} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
              <p className="text-emerald-400 text-lg font-bold">87.3%</p>
              <p className="text-muted-foreground text-[10px]">Taux moyen</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
              <p className="text-amber-400 text-lg font-bold">28</p>
              <p className="text-muted-foreground text-[10px]">Absences non justifiées</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl bg-white/[0.04] border border-border p-5 hover:bg-white/[0.06] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-semibold">Indicateurs clés</h3>
            <Award size={15} className="text-foreground/20" />
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Modules actifs ce semestre', value: '68', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15', link: '/academic/modules' },
              { label: 'Examens à venir', value: '6', icon: CalendarCheck, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15', link: '/exams' },
              { label: 'Demandes en attente', value: '12', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/15', link: '/documents/requests' },
              { label: 'Moyenne générale /20', value: '12.4', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15', link: '/exams/notes' },
              { label: 'Modules au total', value: '320', icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/15', link: '/academic/modules' },
            ].map((item) => (
              <Link key={item.label} to={item.link} className={`flex items-center justify-between p-2.5 rounded-xl border hover:bg-muted/50 transition-colors ${item.bg}`}>
                <div className={`flex items-center gap-2.5 ${item.color}`}>
                  <item.icon size={13} />
                  <span className="text-xs text-foreground/60">{item.label}</span>
                </div>
                <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl bg-white/[0.04] border border-border p-5 hover:bg-white/[0.06] transition-colors flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-semibold">Activité récente</h3>
            <button className="flex items-center gap-1 text-xs text-foreground/30 hover:text-foreground/60 transition-colors">
              Voir tout <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3 flex-1">
            {recentActivities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="relative mt-1">
                  <div className={`w-2 h-2 rounded-full ${activityColors[a.type]} ring-2 ring-offset-1 ring-offset-transparent`} />
                  {i < recentActivities.length - 1 && (
                    <div className="absolute top-3 left-0.5 w-px h-7 bg-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-foreground/75 text-xs leading-snug group-hover:text-foreground/90 transition-colors">{a.message}</p>
                  <p className="text-foreground/25 text-[10px] mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-foreground/30 text-[10px] uppercase tracking-widest mb-2">Actions rapides</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.link} className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br border text-xs font-medium transition-all hover:scale-105 hover:shadow-lg ${a.color}`}>
                  <a.icon size={12} />
                  {a.label}
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
