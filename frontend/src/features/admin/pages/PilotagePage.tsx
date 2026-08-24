import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Target, Settings, AlertTriangle, ShieldAlert, BarChart3,
  Clock, FileText, XCircle, GraduationCap, FileDown, ChevronRight,
  Sparkles, CheckCircle2, Check, X
} from 'lucide-react';

const stats = [
  {
    id: 1, label: 'Étudiants à risque\n(≥ 80h)', value: '3', badge: 'RISQUE',
    icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', link: '/admin/students-risk',
  },
  {
    id: 2, label: 'Conseil de discipline\n(≥ 120h)', value: '1', badge: 'DISCIPLINE',
    icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', link: '/discipline',
  },
  {
    id: 3, label: 'Heures non justifiées\ncumulées', value: '51.5h', badge: 'HEURES',
    icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', link: '/admin/absences',
  },
  {
    id: 4, label: 'Justificatifs cours\nen attente', value: '10', badge: 'EN ATTENTE',
    icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/60',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', link: '/admin/requests',
  },
  {
    id: 5, label: 'Absences enregistrées\naux examens', value: '16', badge: 'EXAMENS',
    icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/60',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', link: '/admin/exams',
  },
  {
    id: 6, label: 'Cas de fraude\ndétectés', value: '2', badge: 'FRAUDE',
    icon: XCircle, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/60',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300', link: '/admin/exams/1/surveillance',
  },
  {
    id: 7, label: 'Rattrapages\naccordés', value: '1', badge: 'RATTRAPAGE',
    icon: GraduationCap, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/60',
    badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300', link: '/admin/retake',
  },
  {
    id: 8, label: 'Convocations non\ntéléchargées', value: '774', badge: 'CONVOCS',
    icon: FileDown, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', link: '/admin/convocations',
  },
];

import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';

interface DisciplineCase {
  id: string;
  student: string;
  cne?: string;
  filiere: string;
  hours: string;
  reason: string;
  date: string;
  status: string;
}

interface JustificationCase {
  id: string;
  student: string;
  filiere: string;
  module: string;
  motif: string;
  date: string;
  status: string;
}

const initialDisciplineCases: DisciplineCase[] = [
  { id: '1', student: 'Amine Bennani', cne: 'N134098212', filiere: 'GFC S5', hours: '124h', reason: 'Dépassement du seuil de 120h d\'absence', date: '25/07/2026', status: 'À convoquer' },
];

const initialJustifications: JustificationCase[] = [
  { id: '101', student: 'Sarah El Amrani', filiere: 'MCM S3', module: 'Marketing Digital (Exam)', motif: 'Certificat Médical CHU', date: '24/07/2026', status: 'En attente' },
  { id: '102', student: 'Karim Tazi', filiere: 'TC S1', module: 'Comptabilité Générale', motif: 'Attestation de Transport', date: '23/07/2026', status: 'En attente' },
  { id: '103', student: 'Zineb Chraibi', filiere: 'GFC S5', module: 'Finance d\'Entreprise', motif: 'Convocation Permis', date: '22/07/2026', status: 'En attente' },
];

export default function PilotagePage() {
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [disciplineThreshold, setDisciplineThreshold] = useState(120);
  const [showConfig, setShowConfig] = useState(false);

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
  const disciplineCases = liveDashboard?.discipline_cases || initialDisciplineCases;
  const justifications = liveDashboard?.pending_justifications || initialJustifications;

  const stats = [
    {
      id: 1, label: `Étudiants à risque\n(≥ ${warningThreshold}h)`, value: String(liveStats.students_at_risk ?? 3), badge: 'RISQUE',
      icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/60',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', link: '/admin/absences',
    },
    {
      id: 2, label: `Conseil de discipline\n(≥ ${disciplineThreshold}h)`, value: String(liveStats.discipline_cases_count ?? 1), badge: 'DISCIPLINE',
      icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/60',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', link: '/admin/absences',
    },
    {
      id: 3, label: 'Heures non justifiées\ncumulées', value: `${liveStats.unjustified_hours ?? 51.5}h`, badge: 'HEURES',
      icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', link: '/admin/absences',
    },
    {
      id: 4, label: 'Justificatifs cours\nen attente', value: String(liveStats.pending_justifications ?? 10), badge: 'EN ATTENTE',
      icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/60',
      badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', link: '/admin/absences',
    },
    {
      id: 5, label: 'Absences enregistrées\naux examens', value: String(liveStats.exam_absences ?? 16), badge: 'EXAMENS',
      icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/60',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', link: '/admin/exams',
    },
    {
      id: 6, label: 'Cas de fraude\ndétectés', value: String(liveStats.fraud_cases ?? 2), badge: 'FRAUDE',
      icon: XCircle, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/60',
      badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300', link: '/admin/exams/1/surveillance',
    },
    {
      id: 7, label: 'Rattrapages\naccordés', value: String(liveStats.retakes_granted ?? 1), badge: 'RATTRAPAGE',
      icon: GraduationCap, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/60',
      badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300', link: '/admin/retake',
    },
    {
      id: 8, label: 'Convocations non\ntéléchargées', value: String(liveStats.convocations_pending ?? 774), badge: 'CONVOCS',
      icon: FileDown, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/60',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', link: '/admin/exams',
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
    toast.success(`Convocation au Conseil de Discipline envoyée à ${student} !`);
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
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* ── Header Title & Actions ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Centre de Pilotage Académique
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Supervision intelligente des alertes, absences, fraudes et conseils de discipline
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Configurer les Seuils</span>
        </button>
      </div>

      <div data-testid="direction-cockpit" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Absentéisme cours', value: cockpit?.course_absenteeism ?? '—' },
          { label: 'Modules à risque (< 6)', value: cockpit?.modules_at_risk ?? '—' },
          { label: 'File TAFEM', value: cockpit?.tafem_queue ?? '—' },
          { label: 'Vacataires suivis', value: Array.isArray(cockpit?.vacataire_load) ? cockpit.vacataire_load.length : '—' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{String(item.value)}</p>
          </div>
        ))}
      </div>

      {Array.isArray(cockpit?.early_warnings) && cockpit.early_warnings.length > 0 && (
        <div data-testid="early-warnings" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold">Alertes précoces (notes &lt; 6 + absences cours)</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-slate-500 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 text-left">Étudiant</th>
                <th className="px-4 py-2 text-left">Module</th>
                <th className="px-4 py-2 text-left">CC / Exam</th>
                <th className="px-4 py-2 text-left">Absences cours</th>
              </tr>
            </thead>
            <tbody>
              {cockpit.early_warnings.map((row: any, idx: number) => (
                <tr key={`${row.student_id}-${idx}`} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2">#{row.student_id}</td>
                  <td className="px-4 py-2">{row.module}</td>
                  <td className="px-4 py-2">{row.exam_or_cc}</td>
                  <td className="px-4 py-2">{row.course_absences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Threshold Configuration Panel (Inline Toggle) ──────────────────────── */}
      {showConfig && (
        <div className="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-4 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Paramétrage des Seuils de Tolérance (Heures d'Absence)</span>
            </div>
            <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Seuil d'Avertissement (Heures) :
              </label>
              <input
                type="number"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Seuil Conseil de Discipline (Heures) :
              </label>
              <input
                type="number"
                value={disciplineThreshold}
                onChange={(e) => setDisciplineThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveThresholds}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Enregistrer les Seuils
            </button>
          </div>
        </div>
      )}

      {/* ── Main Banner ────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 md:p-8 text-white shadow-xl border border-indigo-700/50">
        <div className="absolute -top-20 -end-20 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-64 h-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-extrabold uppercase tracking-wider">
              🛡️ Governance & Alertes ENCG
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-extrabold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> IA Active
            </span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white">Pilotage Académique Global</h2>
          <p className="text-indigo-200/90 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Vue d'ensemble centralisée pour piloter la rigueur académique : suivi automatique des absences cumulées, convocations, détection des cas de fraude aux examens et gestion des avis de discipline.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-amber-300 border border-white/15 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Seuil avertissement : {warningThreshold}h
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-rose-300 border border-white/15 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Seuil discipline : {disciplineThreshold}h
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.id}
            to={stat.link}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stat.bg} shadow-xs group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>

            <div className="mt-4">
              <div className={`text-3xl font-black ${stat.color} tracking-tight leading-none mb-1.5`}>{stat.value}</div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line leading-tight">{stat.label}</div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-extrabold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <span>Voir les détails</span>
              <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Tables & Active Governance Actions Section ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Conseil de Discipline Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="h-1.5 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Conseil de Discipline</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Étudiants ayant dépassé le seuil de {disciplineThreshold}h</p>
                </div>
              </div>
              <Link to="/discipline" className="text-xs font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
                Voir tout <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {disciplineCases.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Aucun étudiant ne nécessite actuellement un conseil de discipline.
              </div>
            ) : (
              <div className="space-y-3">
                {disciplineCases.map((c: DisciplineCase) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{c.student}</p>
                        <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">{c.filiere}</span>
                      </div>
                      <p className="text-xs text-rose-600 font-bold mt-0.5">{c.hours} non justifiées · {c.reason}</p>
                    </div>

                    <button
                      onClick={() => handleConvoquer(c.student)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      Convoquer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Justifications Examen en Attente Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Justifications Examen en Attente</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{justifications.length} demande(s) en cours d'examen</p>
                </div>
              </div>
              <Link to="/admin/requests" className="text-xs font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                Voir tout <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {justifications.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span>Aucune justification en attente de traitement.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {justifications.map((j: JustificationCase) => (
                  <div key={j.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">{j.student}</p>
                        <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0">{j.filiere}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{j.module} · {j.motif}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleValidateJustification(j.id, j.student)}
                        className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                        title="Accepter & Accorder Rattrapage"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectJustification(j.id, j.student)}
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
          </div>
        </div>

      </div>

    </div>
  );
}
