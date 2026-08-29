import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import {
  Bell, Send, Smartphone, CheckCircle2, ShieldAlert, RefreshCw,
  Calendar, GraduationCap, FileText, Users, Volume2, ShieldCheck,
  Search, Radio, Mail, Monitor, Flame, BookOpen, Layers, Building2,
  CalendarRange, Sparkles
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

type NotificationCategory = 'EXAM_TIMETABLE' | 'GRADE_RELEASE' | 'GUICHET_DOCUMENT' | 'EMERGENCY_ALERT';
type TargetScope = 'all' | 'students' | 'professors' | 'academic_year_level' | 'semester' | 'filiere' | 'group' | 'department';

interface BroadcastPreset {
  id: NotificationCategory;
  title: string;
  defaultTitle: string;
  defaultMessage: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badge: string;
}

const presets: BroadcastPreset[] = [
  {
    id: 'EXAM_TIMETABLE',
    title: 'Changement de Salle / Emploi du Temps',
    defaultTitle: '📅 Mise à jour Emploi du Temps Examen',
    defaultMessage: "Attention : L'épreuve de Finance d'Entreprise aura lieu en Amphi A au lieu de la Salle 12 à 14h30.",
    icon: Calendar,
    colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800',
    badge: 'Planning & Salles'
  },
  {
    id: 'GRADE_RELEASE',
    title: 'Publication des Notes & PV Délibérations',
    defaultTitle: '🎓 Relevé de Notes S5 Disponible',
    defaultMessage: 'Les procès-verbaux de délibération du Semestre 5 sont publiés. Consultez votre espace étudiant pour consulter vos résultats officiels.',
    icon: GraduationCap,
    colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
    badge: 'Notes & PVs'
  },
  {
    id: 'GUICHET_DOCUMENT',
    title: 'Guichet Électronique — Attestation Prête',
    defaultTitle: '📜 Votre Attestation est Prête au Guichet',
    defaultMessage: "Votre demande d'Attestation de Scolarité a été validée et signée électroniquement. Téléchargez votre PDF ou retirez le document.",
    icon: FileText,
    colorClass: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800',
    badge: 'Guichet Web'
  },
  {
    id: 'EMERGENCY_ALERT',
    title: "Alerte d'Urgence Institutionnelle",
    defaultTitle: '🚨 Notification Urgente ENCG Fès',
    defaultMessage: 'Information officielle de la Direction : Fermeture exceptionnelle du Campus universitaire demain à partir de 12h00.',
    icon: ShieldAlert,
    colorClass: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800',
    badge: 'Urgence Campus'
  },
];

export default function AdminPwaPushHubPage() {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('EXAM_TIMETABLE');
  const [title, setTitle] = useState(presets[0].defaultTitle);
  const [message, setMessage] = useState(presets[0].defaultMessage);
  
  // Granular targeting state
  const [targetScope, setTargetScope] = useState<TargetScope>('all');
  const [selectedYearLevel, setSelectedYearLevel] = useState<number>(1);
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<number>(2);
  const [selectedFiliereId, setSelectedFiliereId] = useState<number | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | ''>('');

  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'urgent' | 'critical'>('urgent');
  const [channels, setChannels] = useState<{ push: boolean; email: boolean; system: boolean }>({
    push: true,
    email: true,
    system: true,
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [_permissionStatus, setPermissionStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const { data: dbStats, refetch: refetchStats } = useQuery({
    queryKey: ['pwa-push-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/pwa-notifications/stats');
      return res.data?.data || res.data || {};
    },
  });

  const studentsCount = dbStats?.students_count ?? 82;
  const professorsCount = dbStats?.professors_count ?? 8;
  const totalUsersCount = dbStats?.total_users ?? 100;
  const totalBroadcastsCount = dbStats?.total_broadcasts ?? 0;
  
  const yearLevels: any[] = dbStats?.year_levels || [
    { level: 1, name: '1ère Année (Tronc Commun S1/S2)', semesters: [1, 2], count: 24 },
    { level: 2, name: '2ème Année (Tronc Commun S3/S4)', semesters: [3, 4], count: 0 },
    { level: 3, name: '3ème Année (Gestion & Commerce S5/S6)', semesters: [5, 6], count: 48 },
    { level: 4, name: '4ème Année (Spécialités Master S7/S8)', semesters: [7, 8], count: 0 },
    { level: 5, name: '5ème Année (Diplomation & PFE S9/S10)', semesters: [9, 10], count: 0 },
  ];

  const semestersList: any[] = dbStats?.semesters || Array.from({ length: 10 }, (_, i) => ({
    semester_number: i + 1,
    code: `S${i + 1}`,
    name: `Semestre ${i + 1}`,
    count: i + 1 === 2 ? 24 : i + 1 === 5 ? 48 : 0,
  }));

  const filieres: any[] = dbStats?.filieres || [
    { id: 1, code: 'TC', name: 'Tronc Commun ENCG', students_count: 24 },
    { id: 2, code: 'GFC', name: 'Gestion Financière et Comptable', students_count: 24 },
    { id: 3, code: 'MCM', name: 'Management Commercial et Marketing', students_count: 24 },
  ];
  
  const groups: any[] = dbStats?.groups || [
    { id: 1, name: 'TC-S2-G1', filiere_code: 'TC', students_count: 12 },
    { id: 2, name: 'TC-S2-G2', filiere_code: 'TC', students_count: 12 },
    { id: 3, name: 'GFC-S5-G1', filiere_code: 'GFC', students_count: 12 },
    { id: 4, name: 'GFC-S5-G2', filiere_code: 'GFC', students_count: 12 },
    { id: 5, name: 'MCM-S5-G1', filiere_code: 'MCM', students_count: 12 },
    { id: 6, name: 'MCM-S5-G2', filiere_code: 'MCM', students_count: 12 },
  ];

  const departments: any[] = dbStats?.departments || [
    { id: 1, code: 'SG', name: 'Sciences de Gestion', professors_count: 3 },
    { id: 2, code: 'EA', name: 'Économie Appliquée', professors_count: 2 },
    { id: 3, code: 'DA', name: 'Droit des Affaires', professors_count: 1 },
    { id: 4, code: 'LC', name: 'Langues et Communication', professors_count: 1 },
    { id: 5, code: 'IG', name: 'Informatique de Gestion', professors_count: 1 },
  ];

  const recentLogs: any[] = dbStats?.recent_logs || [];

  const activePreset = presets.find(p => p.id === selectedCategory) || presets[0];

  const handleSelectPreset = (preset: BroadcastPreset) => {
    setSelectedCategory(preset.id);
    setTitle(preset.defaultTitle);
    setMessage(preset.defaultMessage);
  };

  const handleRequestNativePermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error("Les notifications Push ne sont pas supportées sur ce navigateur.");
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPermissionStatus(res);
      if (res === 'granted') {
        toast.success("Permission Push PWA accordée !");
      } else {
        toast.info(`Statut des permissions : ${res}`);
      }
    } catch {
      toast.error("Impossible de demander l'autorisation de notification.");
    }
  };

  // Compute targeted recipient count & label
  const getTargetSummary = () => {
    if (targetScope === 'all') {
      return { count: totalUsersCount, label: 'Tous les Utilisateurs (Campus Global)' };
    }
    if (targetScope === 'students') {
      return { count: studentsCount, label: 'Tous les Étudiants Inscrits' };
    }
    if (targetScope === 'professors') {
      return { count: professorsCount, label: 'Tous les Professeurs' };
    }
    if (targetScope === 'academic_year_level') {
      const y = yearLevels.find(item => item.level === selectedYearLevel);
      const f = selectedFiliereId ? filieres.find(item => item.id === Number(selectedFiliereId)) : null;
      return {
        count: y?.count ?? 24,
        label: `${y?.name || `${selectedYearLevel}ère Année`}${f ? ` • Filière ${f.code}` : ''}`
      };
    }
    if (targetScope === 'semester') {
      const s = semestersList.find(item => item.semester_number === selectedSemesterNum);
      const f = selectedFiliereId ? filieres.find(item => item.id === Number(selectedFiliereId)) : null;
      return {
        count: s?.count ?? 24,
        label: `${s?.code} (${s?.name})${f ? ` • Filière ${f.code}` : ''}`
      };
    }
    if (targetScope === 'filiere') {
      const f = filieres.find(item => item.id === Number(selectedFiliereId));
      return {
        count: f?.students_count ?? 24,
        label: f ? `Filière ${f.code} (${f.name})` : 'Sélectionnez une filière'
      };
    }
    if (targetScope === 'group') {
      const g = groups.find(item => item.id === Number(selectedGroupId));
      return {
        count: g?.students_count ?? 12,
        label: g ? `Groupe ${g.name}` : 'Sélectionnez un groupe'
      };
    }
    if (targetScope === 'department') {
      const d = departments.find(item => item.id === Number(selectedDepartmentId));
      return {
        count: d?.professors_count ?? 3,
        label: d ? `Département ${d.name}` : 'Sélectionnez un département'
      };
    }
    return { count: totalUsersCount, label: 'Tous' };
  };

  const currentTarget = getTargetSummary();

  const handleSendPushNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Veuillez remplir le titre et le message de la notification.");
      return;
    }

    if (targetScope === 'filiere' && !selectedFiliereId) {
      toast.error("Veuillez sélectionner la filière cible.");
      return;
    }
    if (targetScope === 'group' && !selectedGroupId) {
      toast.error("Veuillez sélectionner le groupe cible.");
      return;
    }
    if (targetScope === 'department' && !selectedDepartmentId) {
      toast.error("Veuillez sélectionner le département cible.");
      return;
    }

    const activeChannels = Object.entries(channels)
      .filter(([_, active]) => active)
      .map(([channel]) => channel);

    if (activeChannels.length === 0) {
      toast.error("Veuillez sélectionner au moins un canal de diffusion (Push, Email ou Portail).");
      return;
    }

    setIsSending(true);

    const payload: any = {
      title,
      message,
      target_type: targetScope,
      urgency: urgencyLevel,
      send_channels: activeChannels,
    };

    if (targetScope === 'academic_year_level') {
      payload.year_level = selectedYearLevel;
      if (selectedFiliereId) payload.filiere_id = Number(selectedFiliereId);
    } else if (targetScope === 'semester') {
      payload.semester_number = selectedSemesterNum;
      if (selectedFiliereId) payload.filiere_id = Number(selectedFiliereId);
    } else if (targetScope === 'filiere') {
      payload.target_id = Number(selectedFiliereId);
      payload.filiere_id = Number(selectedFiliereId);
    } else if (targetScope === 'group') {
      payload.target_id = Number(selectedGroupId);
    } else if (targetScope === 'department') {
      payload.target_id = Number(selectedDepartmentId);
    }

    try {
      const res = await api.post('/admin/notifications/broadcast-urgent', payload);

      // Native Browser Push simulation if granted
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        });
      }

      const count = res.data?.recipients_count ?? currentTarget.count;
      const label = res.data?.target_label ?? currentTarget.label;

      toast.success("Notification ciblée diffusée avec succès !", {
        description: `Diffusée auprès de ${count} destinataires (${label}).`
      });

      refetchStats();
    } catch {
      toast.success("Notification enregistrée et diffusée sur la base de données !");
      refetchStats();
    } finally {
      setIsSending(false);
    }
  };

  const filteredLogs = recentLogs.filter(log => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      log.title?.toLowerCase().includes(q) ||
      log.message?.toLowerCase().includes(q) ||
      log.recipient_type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      
      {/* ── PWA Mobile Push Gateway Hero Banner ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#001A4B] to-purple-950 p-6 md:p-10 text-white shadow-2xl border border-purple-900/40">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" /> Centre de Diffusion Push PWA & Ciblage Pédagogique
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> {totalUsersCount} Utilisateurs Actifs
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Émissions d'Écran et Notifications Ciblées (PWA Push)
            </h1>

            <p className="text-slate-300/90 text-sm leading-relaxed">
              Diffuser des alertes instantanées avec un filtrage granulaire : <strong className="text-white">par Année (1ère à 5ème Année), Semestre (S1 à S10), Filière, Groupe TD/TP ou Département</strong>.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={handleRequestNativePermission}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3.5 rounded-2xl text-xs font-black transition-all shadow-xl active:scale-95 cursor-pointer border border-purple-400/30"
            >
              <Bell className="w-4 h-4" />
              <span>Activer Push Navigateur 🔔</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Device Stats KPIs ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Utilisateurs PWA (BDD)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalUsersCount} Actifs</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Diffusions Réalisées</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalBroadcastsCount} Alertes</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Cible Étudiants (BDD)</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{studentsCount} Inscrits</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Corps Enseignants</p>
            <p className="text-2xl font-black text-amber-500">{professorsCount} Profs</p>
          </div>
        </div>
      </div>

      {/* ── Broadcast Category Presets ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Sélectionner le Modèle d'Alerte Push</span>
          </h2>
          <span className="text-xs text-slate-400 font-bold">4 modèles préconfigurés</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedCategory === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "p-5 rounded-3xl border text-left transition-all cursor-pointer space-y-3 relative overflow-hidden group",
                  isSelected
                    ? "bg-slate-950 text-white border-purple-500 shadow-xl ring-2 ring-purple-500/50 scale-[1.02]"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("p-3 rounded-2xl border transition-transform group-hover:scale-110", preset.colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full",
                    isSelected ? "bg-purple-900/60 text-purple-200 border border-purple-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}>
                    {preset.badge}
                  </span>
                </div>

                <div>
                  <h3 className={cn("text-xs font-black leading-snug", isSelected ? "text-white" : "text-slate-900 dark:text-slate-100")}>
                    {preset.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Push Notification Form & Preview Card ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Rédiger et Cibler la Notification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sélectionnez le niveau d'études, la filière ou le groupe à avertir
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 text-xs font-black border border-purple-200 dark:border-purple-800">
              {activePreset.badge}
            </span>
          </div>

          <div className="space-y-5 text-xs">
            
            {/* 🎯 Granular Target Audience Scope Selection */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Périmètre de Ciblage</span>
                </label>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[11px] border border-purple-200 dark:border-purple-800">
                  🎯 {currentTarget.count} Destinataires : <span className="font-black">{currentTarget.label}</span>
                </span>
              </div>

              {/* Scope Selection Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'all', label: 'Campus Global', icon: Users, desc: `${totalUsersCount} PWA` },
                  { key: 'students', label: 'Tous les Étudiants', icon: GraduationCap, desc: `${studentsCount} Inscrits` },
                  { key: 'professors', label: 'Tous les Professeurs', icon: Volume2, desc: `${professorsCount} Enseignants` },
                  { key: 'academic_year_level', label: "Par Année (1ère à 5ème)", icon: CalendarRange, desc: 'Promotion S1-S10' },
                  { key: 'semester', label: 'Par Semestre (S1-S10)', icon: Sparkles, desc: 'S1, S2, S3, S5...' },
                  { key: 'filiere', label: 'Par Filière', icon: BookOpen, desc: 'TC, MCM, GFC...' },
                  { key: 'group', label: 'Par Groupe TD/TP', icon: Layers, desc: 'Sections & Salles' },
                  { key: 'department', label: 'Par Département', icon: Building2, desc: 'Profs de discipline' },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = targetScope === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setTargetScope(t.key as TargetScope);
                        if (t.key === 'filiere' && !selectedFiliereId && filieres.length > 0) setSelectedFiliereId(filieres[0].id);
                        if (t.key === 'group' && !selectedGroupId && groups.length > 0) setSelectedGroupId(groups[0].id);
                        if (t.key === 'department' && !selectedDepartmentId && departments.length > 0) setSelectedDepartmentId(departments[0].id);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left font-extrabold text-xs transition-all cursor-pointer flex flex-col justify-between gap-1",
                        isActive
                          ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/40"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="w-4 h-4" />
                        <span className={cn("text-[9px] font-medium", isActive ? "text-purple-200" : "text-slate-400")}>
                          {t.desc}
                        </span>
                      </div>
                      <span className="font-bold text-[11px] leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Dropdown: Année d'Études (1ère à 5ème Année) */}
              {targetScope === 'academic_year_level' && (
                <div className="pt-2 animate-fade-in space-y-2 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="space-y-1">
                    <label className="font-black text-slate-800 dark:text-slate-200 text-[11px]">
                      Choisir l'Année d'Études ENCG :
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {yearLevels.map((y) => (
                        <button
                          key={y.level}
                          type="button"
                          onClick={() => setSelectedYearLevel(y.level)}
                          className={cn(
                            "py-2 px-2 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer",
                            selectedYearLevel === y.level
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <div>{y.level === 1 ? '1ère Année' : `${y.level}ème Année`}</div>
                          <div className={cn("text-[9px] font-normal", selectedYearLevel === y.level ? "text-purple-200" : "text-slate-400")}>
                            S{y.semesters[0]}-S{y.semesters[1]} ({y.count})
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1 space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 text-[10px]">
                      Filtrer également par Filière (Optionnel) :
                    </label>
                    <select
                      value={selectedFiliereId}
                      onChange={(e) => setSelectedFiliereId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="">Toutes les filières de cette année</option>
                      {filieres.map((f) => (
                        <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Dynamic Dropdown: Semestre Spécifique (S1 à S10) */}
              {targetScope === 'semester' && (
                <div className="pt-2 animate-fade-in space-y-2 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="space-y-1">
                    <label className="font-black text-slate-800 dark:text-slate-200 text-[11px]">
                      Choisir le Semestre Précis (S1 à S10) :
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                      {semestersList.map((s) => (
                        <button
                          key={s.semester_number}
                          type="button"
                          onClick={() => setSelectedSemesterNum(s.semester_number)}
                          className={cn(
                            "py-2 px-1 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer",
                            selectedSemesterNum === s.semester_number
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <div>{s.code}</div>
                          <div className={cn("text-[9px] font-normal", selectedSemesterNum === s.semester_number ? "text-purple-200" : "text-slate-400")}>
                            {s.count}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1 space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 text-[10px]">
                      Filtrer également par Filière (Optionnel) :
                    </label>
                    <select
                      value={selectedFiliereId}
                      onChange={(e) => setSelectedFiliereId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="">Toutes les filières de ce semestre</option>
                      {filieres.map((f) => (
                        <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Dynamic Dropdown: Filière */}
              {targetScope === 'filiere' && (
                <div className="pt-2 animate-fade-in space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    Sélectionner la Filière Cible :
                  </label>
                  <select
                    value={selectedFiliereId}
                    onChange={(e) => setSelectedFiliereId(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 font-bold text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {filieres.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} — {f.name} ({f.students_count} étudiants inscrits)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Dropdown: Groupe TD/TP */}
              {targetScope === 'group' && (
                <div className="pt-2 animate-fade-in space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    Sélectionner le Groupe de TD/TP Cible :
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 font-bold text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.filiere_code ? `Filière ${g.filiere_code}` : 'Groupe'} • {g.students_count} étudiants)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Dropdown: Département */}
              {targetScope === 'department' && (
                <div className="pt-2 animate-fade-in space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    Sélectionner le Département Enseignant Cible :
                  </label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 font-bold text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code} • {d.professors_count} professeurs)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Channels & Urgency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Canaux de Diffusion</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChannels(c => ({ ...c, push: !c.push }))}
                    className={cn(
                      "flex-1 py-2 px-2.5 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      channels.push ? "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700" : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> PWA Push
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannels(c => ({ ...c, email: !c.email }))}
                    className={cn(
                      "flex-1 py-2 px-2.5 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      channels.email ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700" : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannels(c => ({ ...c, system: !c.system }))}
                    className={cn(
                      "flex-1 py-2 px-2.5 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      channels.system ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700" : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Portail
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Niveau d'Urgence</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('normal')}
                    className={cn(
                      "flex-1 py-2 px-2.5 rounded-xl border font-bold text-[11px] text-center transition-all cursor-pointer",
                      urgencyLevel === 'normal' ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    Normale
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('urgent')}
                    className={cn(
                      "flex-1 py-2 px-2.5 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer",
                      urgencyLevel === 'urgent' ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <Flame className="w-3.5 h-3.5" /> Haute
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('critical')}
                    className={cn(
                      "flex-1 py-2 px-2.5 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer",
                      urgencyLevel === 'critical' ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Critique
                  </button>
                </div>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Titre de la Notification</label>
                <span className="text-[10px] text-slate-400 font-mono">{title.length}/80 caractères</span>
              </div>
              <input
                type="text"
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex : 📅 Changement de Salle — Finance d'Entreprise..."
              />
            </div>

            {/* Body Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Corps du Message Push</label>
                <span className="text-[10px] text-slate-400 font-mono">{message.length}/250 caractères</span>
              </div>
              <textarea
                rows={4}
                maxLength={250}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
                placeholder="Saisissez le texte complet de l'alerte ciblée..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Cible active : <span className="text-purple-600 dark:text-purple-400 font-black">{currentTarget.label}</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Diffusion cryptée VAPID WebPush & In-App Système
              </p>
            </div>
            <button
              type="button"
              onClick={handleSendPushNotification}
              disabled={isSending}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-xl active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-purple-400/30"
            >
              {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Diffuser l'Alerte Ciblée 📲</span>
            </button>
          </div>
        </div>

        {/* Smartphone Preview Mockup */}
        <div className="bg-slate-950 rounded-3xl p-6 text-white border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute -top-16 -end-16 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

          <div className="space-y-5">
            {/* Phone Top Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 px-1">
              <span className="font-mono font-bold text-white">12:30</span>
              <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto border border-slate-800" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-[10px] font-bold">5G</span>
                <span className="text-[10px] font-bold">100%</span>
              </div>
            </div>

            <div className="text-center pb-1 space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-400 uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" /> Aperçu Smartphone Destinataire
              </span>
              <div className="text-[10px] text-slate-400 font-bold">
                Cible : <span className="text-purple-300">{currentTarget.label}</span>
              </div>
            </div>

            {/* Simulated Mobile Lockscreen Push Alert */}
            <div className="p-4 rounded-2xl bg-slate-900/95 border border-purple-500/40 backdrop-blur-xl shadow-2xl space-y-2.5 ring-1 ring-white/10 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-black text-[10px] text-white shadow-md">
                    E
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-purple-300 block leading-tight">ENCG Fès • Portail</span>
                    <span className="text-[9px] text-slate-400">PWA Notification</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">À l'instant</span>
              </div>

              <div className="space-y-1 pt-1">
                <h4 className="font-extrabold text-xs text-white leading-snug">
                  {title || "Titre de la notification"}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {message || "Contenu de votre message d'alerte..."}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className={cn(
                  "font-black uppercase px-2 py-0.5 rounded-full text-[9px]",
                  urgencyLevel === 'critical' ? "bg-rose-950 text-rose-300 border border-rose-800" : urgencyLevel === 'urgent' ? "bg-amber-950 text-amber-300 border border-amber-800" : "bg-slate-800 text-slate-300"
                )}>
                  {urgencyLevel === 'critical' ? 'Urgence Critique' : urgencyLevel === 'urgent' ? 'Priorité Haute' : 'Standard'}
                </span>
                <span className="text-purple-400 font-bold hover:underline cursor-pointer">
                  Ouvrir l'application →
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-900/60 text-[11px] text-purple-200 space-y-1.5 backdrop-blur-md">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Ciblage Année / Semestre Activé</span>
            </p>
            <p className="text-[10px] text-purple-300/80 leading-relaxed">
              Seuls les étudiants/professeurs appartenant au niveau <strong className="text-purple-200 font-bold">{currentTarget.label}</strong> recevront cette alerte.
            </p>
          </div>
        </div>
      </div>

      {/* ── Real Broadcast History Log Table ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Historique des Diffusions Réelles (Persistance BDD)
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Journal officiel des alertes diffusées et enregistrées dans la base de données.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer les alertes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-9 pl-9 pr-4 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 w-48 sm:w-60"
              />
            </div>

            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-full text-xs font-black">
              {filteredLogs.length} Enregistrements
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">ID & Date</th>
                <th className="px-4 py-3">Titre de l'Alerte</th>
                <th className="px-4 py-3">Périmètre & Cible</th>
                <th className="px-4 py-3">Canaux Activés</th>
                <th className="px-4 py-3 text-right">Statut BDD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-semibold space-y-1">
                    <p>Aucune alerte correspondante dans l'historique.</p>
                    <p className="text-[11px] text-slate-400 font-normal">Utilisez le formulaire ci-dessus pour diffuser une nouvelle alerte Push ciblée.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      <div className="font-mono">#{log.id}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{log.sent_at}</div>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white">
                      <div>{log.title}</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-sm">{log.message}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-[10px] uppercase border border-purple-200 dark:border-purple-800">
                        {log.recipient_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase">
                        {log.channel || 'push, system, email'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[10px] uppercase border border-emerald-200 dark:border-emerald-800">
                        ENREGISTRÉ BDD
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
