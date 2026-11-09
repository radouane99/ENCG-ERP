import React, { useState, useMemo, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ShieldCheck,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  FileCheck2,
  Sparkles,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@shared/lib/api';
import { cn } from '@shared/lib/utils';

interface Appeal {
  id: number;
  status: 'submitted' | 'pending' | 'under_review' | 'rectified' | 'maintained' | 'rejected' | string;
  original_grade: number;
  rectified_grade: number | null;
  claimed_grade?: number | null;
  reason_category?: string;
  student_justification: string;
  professor_comment: string | null;
  created_at?: string;
  updated_at?: string;
  module: {
    id?: number;
    name: string;
    code?: string;
  };
  assessment?: {
    id?: number;
    type: string;
    weight?: number;
  };
  student: {
    id?: number;
    cne: string;
    student_number?: string;
    user: {
      id?: number;
      name: string;
      email?: string;
    };
  };
  resolver?: {
    id?: number;
    name: string;
  };
}

const statusConfig: Record<string, { label: string; badge: string; icon: any }> = {
  submitted: {
    label: 'À Instruire (48h)',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    icon: Clock,
  },
  pending: {
    label: 'À Instruire',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    icon: Clock,
  },
  under_review: {
    label: 'En Cours de Revue',
    badge: 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    icon: Search,
  },
  rectified: {
    label: 'Note Rectifiée',
    badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    icon: CheckCircle2,
  },
  maintained: {
    label: 'Note Maintenue',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    icon: ShieldCheck,
  },
  rejected: {
    label: 'Recours Rejeté',
    badge: 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-700',
    icon: AlertTriangle,
  },
};

const defaultReasonMotifs = [
  "Erreur matérielle de report constatée : la note sur copie était supérieure à celle saisie dans Apogée.",
  "Erreur de sommation des points sur la copie double d'examen.",
  "Omission d'une question ou d'un exercice lors du barème initial.",
  "Note de Contrôle Continu (CC) réconciliée avec le relevé de l'enseignant.",
  "Examen approfondi de la copie effectué : le barème a été rigoureusement appliqué, note maintenue.",
  "Recours non recevable : contestation pédagogique générale sans élément matériel d'erreur.",
];

export default function AdminGradeAppealsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selection, setSelection] = useState<Appeal | null>(null);
  const [decision, setDecision] = useState<'rectified' | 'maintained' | 'rejected'>('rectified');
  const [rectifiedGrade, setRectifiedGrade] = useState<string>('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Fetch appeals
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-grade-appeals', page, search, status],
    queryFn: async () => {
      const res = await api.get('/admin/grade-appeals', {
        params: {
          page,
          search: search || undefined,
          status: status || undefined,
          per_page: 20,
        },
      });
      return res.data as {
        data: {
          data: Appeal[];
          total: number;
          last_page: number;
          current_page: number;
        };
        statistics: {
          submitted: number;
          rectified: number;
          maintained: number;
          total: number;
        };
      };
    },
  });

  const appeals = data?.data?.data || [];
  const stats = data?.statistics || { submitted: 0, rectified: 0, maintained: 0, total: 0 };
  const pagination = data?.data || { total: 0, last_page: 1, current_page: 1 };

  const handleOpenArbitration = (appeal: Appeal) => {
    setSelection(appeal);
    setDecision('rectified');
    setRectifiedGrade(appeal.rectified_grade != null ? String(appeal.rectified_grade) : String(appeal.original_grade));
    setComment(appeal.professor_comment || '');
    setError('');
  };

  const handleResolve = async (e: FormEvent) => {
    e.preventDefault();
    if (!selection) return;

    if (decision === 'rectified') {
      const numGrade = parseFloat(rectifiedGrade);
      if (isNaN(numGrade) || numGrade < 0 || numGrade > 20) {
        setError('Veuillez renseigner une note valide comprise entre 0.00 et 20.00.');
        return;
      }
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setError('Veuillez indiquer un motif académique explicite pour cette décision (minimum 5 caractères).');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await api.post(`/admin/grade-appeals/${selection.id}/resolve`, {
        decision,
        rectified_grade: decision === 'rectified' ? parseFloat(rectifiedGrade) : undefined,
        professor_comment: comment.trim(),
      });

      toast.success(
        decision === 'rectified' 
          ? ' Note rectifiée avec succès dans Apogée !' 
          : ' Décision d\'arbitrage enregistrée.'
      );
      
      await refetch();
      setSelection(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement de la décision.';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const deltaGrade = useMemo(() => {
    if (!selection || decision !== 'rectified') return 0;
    const num = parseFloat(rectifiedGrade);
    if (isNaN(num)) return 0;
    return Number((num - selection.original_grade).toFixed(2));
  }, [selection, decision, rectifiedGrade]);

  return (
    <div className="space-y-7 max-w-[1720px] mx-auto font-sans animate-in fade-in pb-28">
      
      {/* 1. Official Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1a3673]/10 dark:bg-blue-900/30 text-[#1a3673] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 font-medium">Gestion Pédagogique &amp; Apogée</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-700 dark:text-slate-200 font-bold">Commission des Recours</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              Délai Réglementaire Strict : 48 Heures Post-Affichage
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Décret MESRSFC / Charte LMD
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            ENCG Fès • Année 2026-2027
          </span>
        </div>
      </div>

      {/* 2. Executive Hero Banner */}
      <div className="rounded-2xl p-7 md:p-8 text-white shadow-xl border border-[#1a3673]/30 bg-gradient-to-r from-[#0c1f4a] via-[#162f6b] to-[#1a3673] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Arbitrage Académique Officiel
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-blue-200 border border-white/15">
                  Loi 01-00 • Système LMD
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Recours, Réclamations sur Notes &amp; Rectifications Apogée
              </h1>
              <p className="text-xs md:text-sm text-blue-100/90 font-medium mt-1 max-w-2xl leading-relaxed">
                Instruction des contestations des étudiants dans la fenêtre légale des 48h. Vérification matérielle des copies, révision des notes et génération du Procès-Verbal de Rectification scellé.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/15 backdrop-blur-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Recours Actifs</span>
              <span className="text-xl font-black text-amber-300">{stats.submitted}</span>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/15 backdrop-blur-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Total Clôturés</span>
              <span className="text-xl font-black text-white">{stats.rectified + stats.maintained}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total des Recours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Recours Déposés</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Session Normale &amp; Rattrapage 2026
          </p>
        </div>

        {/* À Traiter en Priorité */}
        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            <span>À Traiter (Urgent 48h)</span>
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200">
            {stats.submitted}
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium">
            Instruction requise par le professeur responsable
          </p>
        </div>

        {/* Notes Rectifiées */}
        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-800/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
            <span>Notes Rectifiées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
            {stats.rectified}
          </div>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-medium">
            Erreur matérielle confirmée &amp; PV émis
          </p>
        </div>

        {/* Notes Maintenues */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Notes Maintenues / Rejetées</span>
            <ShieldCheck className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {stats.maintained}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Conformité du barème validée après révision
          </p>
        </div>

      </div>

      {/* 4. Filtres, Recherche & Onglets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Quick status tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setStatus(''); setPage(1); }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg transition-all",
                status === '' 
                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Tous les Recours ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => { setStatus('submitted'); setPage(1); }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                status === 'submitted' 
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm" 
                  : "text-amber-700 dark:text-amber-300 hover:text-amber-900"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              À Instruire ({stats.submitted})
            </button>
            <button
              type="button"
              onClick={() => { setStatus('rectified'); setPage(1); }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg transition-all",
                status === 'rectified' 
                  ? "bg-emerald-500 text-white font-bold shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Rectifiées ({stats.rectified})
            </button>
            <button
              type="button"
              onClick={() => { setStatus('maintained'); setPage(1); }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg transition-all",
                status === 'maintained' 
                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Maintenues ({stats.maintained})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher étudiant, CNE, module..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30"
            />
          </div>

        </div>
      </div>

      {/* 5. Tableau Exécutif des Recours */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3673] dark:text-blue-400" />
            <span className="text-xs text-slate-400 font-medium">Chargement des recours académiques...</span>
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Impossible de charger les recours</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Une erreur est survenue lors de la communication avec le serveur Apogée.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#1a3673] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Réessayer
            </button>
          </div>
        ) : appeals.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[#1a3673] dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white text-base">Aucun recours enregistré</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Toutes les évaluations sont actuellement conformes et aucun litige n'est en attente d'instruction pour les critères sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Étudiant &amp; CNE</th>
                  <th className="py-4 px-4">Module &amp; Épreuve</th>
                  <th className="py-4 px-4 text-center">Note Initiale</th>
                  <th className="py-4 px-4 text-center">Note Rectifiée</th>
                  <th className="py-4 px-4">Motif de la Réclamation</th>
                  <th className="py-4 px-4 text-center">Statut Délibération</th>
                  <th className="py-4 px-5 text-right">Action Arbitrage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {appeals.map((appeal) => {
                  const cfg = statusConfig[appeal.status] || statusConfig.submitted;
                  const StatusIcon = cfg.icon;
                  const isPending = ['submitted', 'pending', 'under_review'].includes(appeal.status);

                  return (
                    <tr 
                      key={appeal.id} 
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Étudiant */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1a3673] dark:text-blue-300 font-bold flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 text-xs">
                            {appeal.student?.user?.name ? appeal.student.user.name.charAt(0).toUpperCase() : 'E'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white text-xs">
                              {appeal.student?.user?.name || 'Étudiant Anonyme'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              CNE: {appeal.student?.cne || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Module & Épreuve */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 dark:text-white line-clamp-1">
                          {appeal.module?.name}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {appeal.assessment?.type || 'Examen Final'}
                        </span>
                      </td>

                      {/* Note Initiale */}
                      <td className="py-4 px-4 text-center">
                        <span className={cn(
                          "font-mono font-bold px-2.5 py-1 rounded-lg text-xs",
                          appeal.original_grade < 10 
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800" 
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          {Number(appeal.original_grade).toFixed(2)} / 20
                        </span>
                      </td>

                      {/* Note Rectifiée */}
                      <td className="py-4 px-4 text-center">
                        {appeal.rectified_grade != null ? (
                          <div className="inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span>{Number(appeal.rectified_grade).toFixed(2)}</span>
                            {appeal.rectified_grade > appeal.original_grade && (
                              <span className="text-[10px] text-emerald-600 font-black">
                                (+{(appeal.rectified_grade - appeal.original_grade).toFixed(1)})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">—</span>
                        )}
                      </td>

                      {/* Justification de l'étudiant */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          "{appeal.student_justification}"
                        </p>
                      </td>

                      {/* Statut */}
                      <td className="py-4 px-4 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          cfg.badge
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenArbitration(appeal)}
                          className={cn(
                            "px-3.5 py-1.5 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95",
                            isPending 
                              ? "bg-[#1a3673] hover:bg-[#0f2454] text-white" 
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          )}
                        >
                          {isPending ? (
                            <>
                              <Scale className="w-3.5 h-3.5 text-amber-300" />
                              Instruire
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              Consulter
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div>
              Affichage de {appeals.length} sur {pagination.total} recours enregistrés • Page {pagination.current_page} / {pagination.last_page}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Précédente
              </button>
              <button
                type="button"
                disabled={page >= pagination.last_page}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                Suivante <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 6. Modal d'Arbitrage Avancé & PV Officiel de Rectification */}
      {selection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-0">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0c1f4a] via-[#162f6b] to-[#1a3673] p-6 text-white relative">
              <button 
                onClick={() => !busy && setSelection(null)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <Scale className="w-3.5 h-3.5 text-amber-300" /> Commission d'Arbitrage des Examens
              </span>
              <h3 className="font-bold text-xl tracking-tight text-white">
                Examen du Recours #{selection.id}
              </h3>
              <p className="text-xs text-blue-100 font-medium mt-1">
                Étudiant : <strong>{selection.student?.user?.name}</strong> (CNE: {selection.student?.cne}) • Module : {selection.module?.name}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-7 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Recours Details Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">
                    Déclaration de l'étudiant
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    Note Attribuée : <strong className="text-slate-800 dark:text-white">{Number(selection.original_grade).toFixed(2)}/20</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  "{selection.student_justification}"
                </p>
              </div>

              {/* Read-Only State for Closed Appeals */}
              {!['submitted', 'pending', 'under_review'].includes(selection.status) ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Décision Enregistrée
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        statusConfig[selection.status]?.badge
                      )}>
                        {statusConfig[selection.status]?.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span>Note Initiale : {Number(selection.original_grade).toFixed(2)}/20</span>
                      {selection.rectified_grade != null && (
                        <span>➔ Note Rectifiée : <strong className="text-emerald-600 font-mono">{Number(selection.rectified_grade).toFixed(2)}/20</strong></span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      <strong>Motif de la commission :</strong> {selection.professor_comment}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelection(null)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Arbitration Form */
                <form onSubmit={handleResolve} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Decision Options */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Décision d'Arbitrage du Jury *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setDecision('rectified')}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all cursor-pointer",
                          decision === 'rectified'
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-400 ring-2 ring-emerald-400/20 font-bold"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                        <span className="text-xs block font-bold">Rectifier la note</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecision('maintained')}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all cursor-pointer",
                          decision === 'maintained'
                            ? "bg-blue-50 text-[#1a3673] dark:bg-blue-950/60 dark:text-blue-200 border-blue-400 ring-2 ring-blue-400/20 font-bold"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                        )}
                      >
                        <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                        <span className="text-xs block font-bold">Maintenir la note</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecision('rejected')}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all cursor-pointer",
                          decision === 'rejected'
                            ? "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border-rose-400 ring-2 ring-rose-400/20 font-bold"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                        )}
                      >
                        <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                        <span className="text-xs block font-bold">Rejeter le recours</span>
                      </button>
                    </div>
                  </div>

                  {/* Rectified Grade Field */}
                  {decision === 'rectified' && (
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                          Nouvelle Note Rectifiée / 20 *
                        </label>
                        <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          Écart : <strong className={deltaGrade >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {deltaGrade >= 0 ? `+${deltaGrade}` : deltaGrade} pts
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          required
                          value={rectifiedGrade}
                          onChange={(e) => setRectifiedGrade(e.target.value)}
                          className="w-36 px-4 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-lg font-mono font-black text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          De <strong className="font-mono">{Number(selection.original_grade).toFixed(2)}</strong> à <strong className="font-mono text-emerald-600">{rectifiedGrade || '—'}</strong> / 20
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Motif Suggestions */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Suggestions de Motifs Officiels
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {defaultReasonMotifs.map((m, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setComment(m)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 rounded-lg text-left line-clamp-1 max-w-full"
                          title={m}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Motif Académique Détaillé de la Décision *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Indiquez les constatations de la commission d'arbitrage..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30"
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setSelection(null)}
                      className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#1a3673] to-[#254b9e] hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Enregistrer la Décision &amp; Notifier l'Étudiant
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
