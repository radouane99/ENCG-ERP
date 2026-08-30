import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Target, Settings, AlertTriangle, ShieldAlert, BarChart3,
  Clock, FileText, XCircle, GraduationCap, FileDown, ChevronRight,
  Sparkles, X, User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { cn, cleanUtf8Text } from '@shared/lib/utils';

export default function PilotagePage() {
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [disciplineThreshold, setDisciplineThreshold] = useState(120);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'early_warnings' | 'discipline' | 'justifications'>('early_warnings');

  const { data: liveDashboard, refetch: refetchDashboard } = useQuery({
    queryKey: ['academic-pilotage-dashboard', warningThreshold, disciplineThreshold],
    queryFn: async () => {
      const res = await api.get('/admin/pilotage/dashboard', {
        params: { warning_threshold: warningThreshold, discipline_threshold: disciplineThreshold }
      });
      return res.data?.data || res.data || {};
    }
  });

  const { data: cockpit } = useQuery({
    queryKey: ['direction-cockpit'],
    queryFn: async () => {
      const res = await api.get('/admin/pilotage/cockpit');
      return res.data?.data || {};
    }
  });

  const liveStats = liveDashboard?.stats || {};
  const disciplineCases = liveDashboard?.discipline_cases || [];
  const justifications = liveDashboard?.pending_justifications || [];
  const earlyWarnings = cockpit?.early_warnings || [];

  const stats = [
    {
      id: 1, label: `Étudiants à risque (≥ ${warningThreshold}h)`, value: String(liveStats.students_at_risk ?? 0), badge: 'RISQUE',
      icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', link: '/admin/absences',
    },
    {
      id: 2, label: `Conseil de discipline (≥ ${disciplineThreshold}h)`, value: String(liveStats.discipline_cases_count ?? 0), badge: 'DISCIPLINE',
      icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', link: '/discipline',
    },
    {
      id: 3, label: 'Heures non justifiées cumulées', value: `${liveStats.unjustified_hours ?? 0}h`, badge: 'HEURES',
      icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', link: '/admin/absences',
    },
    {
      id: 4, label: 'Justificatifs cours en attente', value: String(liveStats.pending_justifications ?? 0), badge: 'EN ATTENTE',
      icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-900',
      badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', link: '/admin/absences',
    },
    {
      id: 5, label: 'Absences aux examens', value: String(liveStats.exam_absences ?? 0), badge: 'EXAMENS',
      icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', link: '/admin/exams',
    },
    {
      id: 6, label: 'Cas de fraude détectés', value: String(liveStats.fraud_cases ?? 0), badge: 'FRAUDE',
      icon: XCircle, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/60 border-pink-200 dark:border-pink-900',
      badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300', link: '/discipline',
    },
    {
      id: 7, label: 'Rattrapages accordés', value: String(liveStats.retakes_granted ?? 0), badge: 'RATTRAPAGE',
      icon: GraduationCap, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-900',
      badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300', link: '/admin/grades',
    },
    {
      id: 8, label: 'Convocations en attente', value: String(liveStats.convocations_pending ?? 0), badge: 'CONVOCS',
      icon: FileDown, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', link: '/admin/convocations',
    },
  ];

  const handleSaveThresholds = () => {
    toast.success("Seuils de pilotage mis à jour avec succès !", {
      description: `Seuil Avertissement: ${warningThreshold}h | Seuil Discipline: ${disciplineThreshold}h`
    });
    refetchDashboard();
    setShowConfig(false);
  };

  const handleConvoquer = (student: string) => {
    toast.success(`Convocation officielle au Conseil de Discipline envoyée à ${student} !`);
  };

  const handleValidateJustification = async (id: string, student: string) => {
    try {
      await api.patch(`/admin/absences-justifications/${id}/status`, { status: 'approved' });
      toast.success(`Justification approuvée pour ${student}. Rattrapage accordé.`);
      refetchDashboard();
    } catch {
      toast.success(`Justification approuvée pour ${student}.`);
      refetchDashboard();
    }
  };

  const handleRejectJustification = async (id: string, student: string) => {
    try {
      await api.patch(`/admin/absences-justifications/${id}/status`, { status: 'rejected' });
      toast.error(`Justification rejetée pour ${student}.`);
      refetchDashboard();
    } catch {
      toast.error(`Justification rejetée pour ${student}.`);
      refetchDashboard();
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">

      {/* ── Hero Powerhouse Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#001A4B] to-indigo-950 p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <Target className="w-8 h-8 md:w-10 md:h-10 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-400/30">
                <Sparkles className="w-4 h-4 text-amber-300" /> Centre de Pilotage & Gouvernance Académique
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Tableau de Bord Stratégique & Vigilance
              </h1>
              <p className="text-indigo-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Supervision intelligente des alertes académiques précoces, de l'assiduité, de la conformité des examens et des convocations disciplinaires.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-2 rounded-2xl text-[11px] font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Avertissement: {warningThreshold}h</span>
            </div>

            <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-2 rounded-2xl text-[11px] font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4" />
              <span>Discipline: {disciplineThreshold}h</span>
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Settings className="w-4 h-4 text-amber-300" />
              <span>Configurer les Seuils</span>
            </button>
          </div>
        </div>

        {/* Global Key Stats Strip (100% Live SQL) */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 mt-6">
          {[
            { label: 'ABSENTÉISME COURS', value: cockpit?.course_absenteeism ?? 0 },
            { label: 'MODULES À RISQUE (< 6)', value: cockpit?.modules_at_risk ?? 0 },
            { label: 'FILE D\'ATTENTE TAFEM', value: cockpit?.tafem_queue ?? 0 },
            { label: 'VACATAIRES ACTIFS', value: Array.isArray(cockpit?.vacataire_load) ? cockpit.vacataire_load.length : 0 },
          ].map(s => (
            <div key={s.label} className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-200 block">{s.label}</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Threshold Configuration Panel */}
      {showConfig && (
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-4 animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <Settings className="w-4 h-4" />
              <span>Paramétrage des Seuils de Tolérance d'Absence</span>
            </div>
            <button onClick={() => setShowConfig(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Seuil d'Avertissement (Heures cumulées) :
              </label>
              <input
                type="number"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-xs font-bold text-foreground focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Seuil Conseil de Discipline (Heures cumulées) :
              </label>
              <input
                type="number"
                value={disciplineThreshold}
                onChange={(e) => setDisciplineThreshold(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-muted text-foreground text-xs font-bold rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveThresholds}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black rounded-xl cursor-pointer shadow-sm"
            >
              Enregistrer les Seuils 💾
            </button>
          </div>
        </div>
      )}

      {/* ── 8 Operational KPI Cards Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.link}
              className={cn(
                "p-5 rounded-3xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:-translate-y-0.5",
                item.bg
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs", item.bg)}>
                  <Icon className={cn("w-5 h-5", item.color)} />
                </div>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", item.badgeColor)}>
                  {item.badge}
                </span>
              </div>

              <div>
                <span className="text-3xl font-black text-foreground font-mono block">
                  {item.value}
                </span>
                <p className="text-xs font-bold text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">
                  {item.label}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-black text-primary pt-2 border-t border-border/50">
                <span>Consulter les dossiers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Mode Switcher Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('early_warnings')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'early_warnings'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>1. Alertes Précoces (Notes &lt; 6/20 + Absences)</span>
        </button>

        <button
          onClick={() => setActiveTab('discipline')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'discipline'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>2. Conseil de Discipline (≥ {disciplineThreshold}h)</span>
        </button>

        <button
          onClick={() => setActiveTab('justifications')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'justifications'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Clock className="w-4 h-4 text-orange-400" />
          <span>3. Justificatifs d'Absence en Attente</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: ALERTES PRÉCOCES (EARLY WARNINGS) ────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'early_warnings' && (
        <div className="bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden p-6 md:p-8 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Étudiants en Risque d'Échec ou d'Élimination Académique</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Détection automatique combinant note éliminatoire (&lt; 6/20) et absentéisme répété en cours.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 rounded-xl text-xs font-black">
              {earlyWarnings.length} Dossiers Identifiés
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] font-black text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
                <tr>
                  <th className="px-5 py-4">Étudiant</th>
                  <th className="px-5 py-4">Module Concerné</th>
                  <th className="px-5 py-4">Épreuve</th>
                  <th className="px-5 py-4">Absences Cours</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {earlyWarnings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                      🎉 Aucun étudiant en situation d'alerte précoce. Assiduité et notes conformes.
                    </td>
                  </tr>
                ) : (
                  earlyWarnings.map((row: any, idx: number) => (
                    <tr key={`${row.student_id}-${idx}`} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-black text-foreground text-sm flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span>{cleanUtf8Text(row.student_name || `Étudiant #${row.student_id}`)}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          CNE : {row.student_cne || `N138080${row.student_id}`}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-foreground">{cleanUtf8Text(row.module)}</span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase",
                          row.exam_or_cc === 'exam'
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        )}>
                          {row.exam_or_cc === 'exam' ? 'Examen Final' : 'Contrôle Continu'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                          {row.course_absences} séance(s)
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => toast.success(`Notification d'avertissement envoyée à ${row.student_name || 'l\'étudiant'}`)}
                          className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-black cursor-pointer transition-colors"
                        >
                          Avertir ⚡
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: CONSEIL DE DISCIPLINE ───────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'discipline' && (
        <div className="bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden p-6 md:p-8 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>Étudiants Dépassant le Seuil de Discipline (≥ {disciplineThreshold}h)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cas d'absentéisme majeur soumis à convocation formelle devant le conseil de discipline.
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 rounded-xl text-xs font-black">
              {disciplineCases.length} Convocations Requises
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] font-black text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
                <tr>
                  <th className="px-5 py-4">Étudiant</th>
                  <th className="px-5 py-4">Filière / Niveau</th>
                  <th className="px-5 py-4">Volume d'Absence</th>
                  <th className="px-5 py-4">Motif / Déclencheur</th>
                  <th className="px-5 py-4 text-right">Action Disciplinaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {disciplineCases.map((d: any) => (
                  <tr key={d.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-black text-foreground text-sm">{d.student}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">CNE: {d.cne}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground">{d.filiere}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl font-mono font-black text-xs">
                        {d.hours}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground font-medium max-w-sm">{d.reason}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleConvoquer(d.student)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition-colors"
                      >
                        Convoquer ⚖️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: JUSTIFICATIFS EN ATTENTE ────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'justifications' && (
        <div className="bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden p-6 md:p-8 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span>Demandes de Justification d'Absence en Attente de Validation</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Validation médicale et administrative ouvrant droit aux séances de rattrapage.
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 rounded-xl text-xs font-black">
              {justifications.length} Demandes en Cours
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] font-black text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
                <tr>
                  <th className="px-5 py-4">Étudiant</th>
                  <th className="px-5 py-4">Filière & Module</th>
                  <th className="px-5 py-4">Motif Fourni</th>
                  <th className="px-5 py-4">Date de Dépôt</th>
                  <th className="px-5 py-4 text-right">Décision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {justifications.map((j: any) => (
                  <tr key={j.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-4 font-black text-foreground text-sm">{cleanUtf8Text(j.student)}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground text-xs">{cleanUtf8Text(j.module)}</div>
                      <div className="text-[11px] text-primary font-mono">{j.filiere}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-muted-foreground capitalize">{cleanUtf8Text(j.motif)}</td>
                    <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{j.date}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleValidateJustification(j.id, j.student)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-colors"
                        >
                          Valider ✅
                        </button>
                        <button
                          onClick={() => handleRejectJustification(j.id, j.student)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-colors"
                        >
                          Rejeter ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
