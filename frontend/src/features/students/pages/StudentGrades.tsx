import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  FlaskConical, 
  Download, 
  AlertCircle, 
  Award, 
  BookOpen, 
  Sparkles, 
  Scale, 
  Clock, 
  X, 
  Send,
  Eye,
  EyeOff,
  Search,
  GraduationCap,
  Info,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import LmdLegend from '@shared/components/academic/LmdLegend';
import LmdBadge from '@shared/components/academic/LmdBadge';
import EmptyState from '@shared/components/ui/EmptyState';
import { decisionLabel, normalizeDecision } from '@shared/lib/lmd';
import { toast } from 'sonner';

function cleanMojibake(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã‰/g, 'É')
    .replace(/Ãˆ/g, 'È')
    .replace(/Ã /g, 'à')
    .replace(/Ã¢/g, 'â')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã®/g, 'î')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã»/g, 'û')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¯/g, 'ï')
    .replace(/Ã«/g, 'ë')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã¤/g, 'ä')
    .replace(/â€™/g, '’')
    .replace(/Â«/g, '«')
    .replace(/Â»/g, '»')
    .replace(/Â°/g, '°');
}

export default function StudentGrades() {
  const { i18n } = useTranslation(['students', 'common']);
  const isRtl = i18n.language === 'ar';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => api.get('/student-portal/grades').then(res => res.data)
  });

  const { data: appealsData, refetch: refetchAppeals } = useQuery({
    queryKey: ['student-grade-appeals'],
    queryFn: () => api.get('/student-portal/grade-appeals', { suppressToast: true } as any)
      .then(res => res.data?.data?.appeals || res.data?.data || res.data || [])
      .catch(() => [])
  });

  // Confidential privacy mode toggle (default revealed)
  const [isRevealed, setIsRevealed] = useState(true);
  const [judge, setJudge] = useState<{ verdict?: string; explanation_fr?: string; explanation_ar?: string } | null>(null);
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'validated' | 'retake' | 'failed'>('all');

  // Interactive Simulator Modal state (CC1 25% + CC2 25% + Exam 50%)
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [simCc1, setSimCc1] = useState<string>('13');
  const [simCc2, setSimCc2] = useState<string>('14');
  const [simExam, setSimExam] = useState<string>('12');

  // Modal Réclamation LMD 48h
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [selectedModuleForAppeal, setSelectedModuleForAppeal] = useState<any>(null);
  const [appealReasonType, setAppealReasonType] = useState('erreur_sommation');
  const [appealReasonDetails, setAppealReasonDetails] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  // Raw data extraction
  const grades = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
  }, [data]);

  const overallAvg = useMemo(() => {
    if (!data || data.overall_average === undefined || data.overall_average === null) return null;
    return Number(data.overall_average);
  }, [data]);

  const overallDecision = useMemo(() => {
    if (data?.overall_decision) return data.overall_decision;
    if (overallAvg !== null) {
      if (overallAvg >= 16) return 'TRÈS BIEN';
      if (overallAvg >= 14) return 'BIEN';
      if (overallAvg >= 12) return 'ASSEZ BIEN';
      if (overallAvg >= 10) return 'PASSABLE';
      return 'AJOURNÉ';
    }
    return null;
  }, [data, overallAvg]);



  const totalModules = useMemo(() => {
    return data?.total_modules || grades.length;
  }, [data, grades]);

  const validatedModules = useMemo(() => {
    if (data?.validated_modules !== undefined) return Number(data.validated_modules);
    return grades.filter((g: any) => (g.moyenne_finale ?? g.moyenne_normale ?? 0) >= 10).length;
  }, [data, grades]);

  const retakeModules = useMemo(() => {
    return grades.filter((g: any) => {
      const s = g.moyenne_finale ?? g.moyenne_normale;
      return s !== null && s !== undefined && s >= 6 && s < 10;
    }).length;
  }, [grades]);

  // Available semesters list
  const availableSemesters = useMemo(() => {
    const set = new Set<string>();
    grades.forEach((g: any) => {
      const s = String(g.semester_number || g.semester || '').toUpperCase();
      if (s) set.add(s.replace(/^S/i, ''));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [grades]);

  // Filtered grades based on semester, search, and status
  const filteredGrades = useMemo(() => {
    return grades.filter((g: any) => {
      // Semester
      if (selectedSemester !== 'all') {
        const sem = String(g.semester_number || g.semester || '').toUpperCase();
        if (!sem.includes(selectedSemester.toUpperCase())) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = String(g.module_name || g.module?.name || '').toLowerCase();
        const code = String(g.module_code || g.module?.code || '').toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }
      // Status
      const total = g.moyenne_finale !== null && g.moyenne_finale !== undefined 
        ? Number(g.moyenne_finale) 
        : (g.moyenne_normale !== null && g.moyenne_normale !== undefined ? Number(g.moyenne_normale) : null);
      if (statusFilter === 'validated') {
        return total !== null && total >= 10;
      }
      if (statusFilter === 'retake') {
        return total !== null && total >= 6 && total < 10;
      }
      if (statusFilter === 'failed') {
        return total !== null && total < 6;
      }
      return true;
    });
  }, [grades, selectedSemester, searchQuery, statusFilter]);

  // Calculation for quick simulator: CC1 (25%) + CC2 (25%) + Examen (50%)
  const simulatedAverage = useMemo(() => {
    const cc1 = parseFloat(simCc1) || 0;
    const cc2 = parseFloat(simCc2) || 0;
    const exam = parseFloat(simExam) || 0;
    return Number(((cc1 * 0.25) + (cc2 * 0.25) + (exam * 0.50)).toFixed(2));
  }, [simCc1, simCc2, simExam]);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleForAppeal) return;
    setSubmittingAppeal(true);
    const reasonFull = `[${appealReasonType.toUpperCase()}] ${appealReasonDetails.trim()}`;
    try {
      await api.post('/student-portal/grade-appeals', {
        module_id: selectedModuleForAppeal.module_id || selectedModuleForAppeal.id,
        assessment_id: selectedModuleForAppeal.assessment_id,
        original_grade: selectedModuleForAppeal.moyenne_finale ?? selectedModuleForAppeal.moyenne_normale ?? 0,
        reason: reasonFull,
      });
      toast.success('Réclamation enregistrée et transmise à l\'enseignant responsable !');
      setAppealModalOpen(false);
      setSelectedModuleForAppeal(null);
      setAppealReasonDetails('');
      refetchAppeals();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors du dépôt de la réclamation.';
      toast.error(msg);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const handleRunAiJudge = async () => {
    setJudgeLoading(true);
    try {
      const res = await api.post('/v1/student-portal/ai/lmd-judge', { 
        question: 'Est-ce que je valide mon semestre selon les règles officielles ENCG ?' 
      });
      setJudge(res.data);
      toast.success('Analyse du jury LMD générée avec succès !');
    } catch {
      toast.error("Le simulateur LMD n'a pas pu traiter la demande. Veuillez réessayer ultérieurement.");
    } finally {
      setJudgeLoading(false);
    }
  };

  const appealsList = Array.isArray(appealsData) ? appealsData : [];

  if (isLoading) {
    return (
      <div className="flex flex-col h-[55vh] items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Chargement des résultats de délibération...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 font-sans bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mx-auto text-rose-500 border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Impossible de charger vos notes</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Une erreur temporaire est survenue lors de la synchronisation avec le serveur Apogée. Vos notes restent sécurisées et seront disponibles dès le rétablissement de la liaison.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-[#001A4B] text-white font-bold text-xs shadow-md hover:bg-[#082663] transition-all cursor-pointer"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div data-testid="student-grades-page" className="space-y-6 sm:space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#001A4B] dark:text-white tracking-tight flex items-center gap-2.5">
              <Award className="w-7 h-7 text-amber-500" /> Performance Académique & Décisions LMD
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Régime LMD ENCG Fès • Seuil de validation V ≥ 10.00/20 • Seuil éliminatoire &lt; 6.00/20
          </p>
        </div>

        {/* Privacy Eye Toggle */}
        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-black text-slate-700 dark:text-slate-300 transition-all cursor-pointer self-start md:self-auto"
          title={isRevealed ? "Masquer les notes pour confidentialité" : "Afficher toutes mes notes"}
        >
          {isRevealed ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-blue-600" />}
          <span>{isRevealed ? "Mode Confidentiel" : "Révéler les notes"}</span>
        </button>
      </div>
      
      {/* ── Executive Hero Banner (ENCG Royal Navy) ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#04122d] rounded-[2.5rem] p-6 sm:p-9 text-white shadow-2xl border border-white/10 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 backdrop-blur-md text-amber-300 border border-white/10 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" /> Procès-Verbal Officiel Certifié
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Année 2026/2027
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Guichet LMD 48h Actif
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight" lang={isRtl ? 'ar' : 'fr'}>
              Relevé de Notes & Décisions de Jury
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed mt-1.5">
              CC 1 (25%) + CC 2 (25%) + Examen Final (50%) — Compensation semestrielle automatique sous réserve d'aucune note éliminatoire (&lt; 6.0/20).
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              data-testid="lmd-simulator"
              onClick={() => setSimulatorModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-[#001A4B] px-4 py-2.5 rounded-xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FlaskConical className="w-4 h-4 text-[#001A4B]" /> Simulateur LMD & IA
            </button>

            <button 
              onClick={() => {
                const tid = toast.loading('Génération du relevé officiel PDF certifié...');
                api.get('/student-portal/transcript/pdf', { responseType: 'blob' })
                  .then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'Releve_Notes_Officiel_ENCG_Fes.pdf');
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success('Relevé officiel téléchargé avec succès !', { id: tid });
                  })
                  .catch(() => toast.error('Erreur lors du téléchargement du relevé.', { id: tid }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-300" /> Relevé Officiel (PDF)
            </button>

            <button 
              onClick={() => {
                const tid = toast.loading("Génération de l'attestation de réussite...");
                api.get('/student-portal/attestation-reussite/pdf', { responseType: 'blob' })
                  .then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'Attestation_Reussite_ENCG.pdf');
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success('Attestation de réussite téléchargée !', { id: tid });
                  })
                  .catch(() => toast.error("Attestation accessible après validation complète de l'année.", { id: tid }));
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 border border-emerald-400/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-200" /> Attestation de Réussite
            </button>
          </div>
        </div>

        {/* Hero Right Widget - Overall Grade Card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white/20 text-center sm:text-right shrink-0 min-w-[280px]">
          <div className="flex items-center justify-between sm:justify-end gap-2 mb-1">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
              Moyenne Semestrielle
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white border border-white/10">
              Système 20
            </span>
          </div>
          
          <div className="flex items-baseline justify-center sm:justify-end gap-1.5 my-1">
            <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
              {isRevealed ? (overallAvg !== null ? overallAvg.toFixed(2) : '—') : (overallAvg !== null ? '••••' : '—')}
            </span>
            <span className="text-xl font-black text-blue-200">/ 20</span>
          </div>

          <div className={cn(
            "mt-3 inline-flex items-center gap-2 text-xs font-black px-3.5 py-1.5 rounded-full border shadow-sm",
            overallAvg !== null && overallAvg >= 10 
              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
              : overallAvg !== null 
                ? "bg-rose-500/20 border-rose-400/40 text-rose-300"
                : "bg-slate-500/20 border-slate-400/40 text-slate-300"
          )}>
            <Award className="w-4 h-4" />
            <span>
              {overallAvg !== null 
                ? (overallAvg >= 10 ? `MENTION ${overallDecision} • VALIDÉ` : 'SESSION DE RATTRAPAGE') 
                : 'DÉLIBÉRATION EN COURS'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200">
            <span>Modules Validés :</span>
            <span className="font-black text-white">{isRevealed ? `${validatedModules} / ${totalModules}` : '•• / ••'}</span>
          </div>
        </div>
      </div>

      {/* ── 4 Executive KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Moyenne & Mention */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Moyenne Générale</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#001A4B] dark:text-white">
              {isRevealed ? (overallAvg !== null ? overallAvg.toFixed(2) : '—') : '••••'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 20</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-500 dark:text-slate-400">Mention officielle :</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {overallAvg !== null && overallAvg >= 10 ? overallDecision : '—'}
            </span>
          </div>
        </div>

        {/* Card 2: Taux de Réussite */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Taux de Réussite</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {isRevealed ? `${totalModules > 0 ? Math.round((validatedModules / totalModules) * 100) : 0}%` : '••%'}
            </span>
            <span className="text-xs font-bold text-slate-400">({validatedModules}/{totalModules} validés)</span>
          </div>
          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalModules > 0 ? Math.min(100, Math.round((validatedModules / totalModules) * 100)) : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>Progression de validation</span>
              <span>{totalModules > 0 ? Math.round((validatedModules / totalModules) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Modules Validés */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Statut des Modules</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {isRevealed ? `${validatedModules}` : '•'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ {totalModules} Validés</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 font-bold">Rattrapage :</span>
            <span className={cn("font-black px-2 py-0.5 rounded-full text-[10px]", retakeModules > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700")}>
              {retakeModules > 0 ? `${retakeModules} à repasser` : '0 module'}
            </span>
          </div>
        </div>

        {/* Card 4: Statut Délibération & Jury */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Jury & Délibération</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg font-black text-[#001A4B] dark:text-white block">
              {overallAvg !== null && overallAvg >= 10 ? 'Semestre Validé' : 'Délibération Clôturée'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Session Ordinaire 2026</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 font-bold">Recours 48h :</span>
            <span className="inline-flex items-center gap-1 font-black text-amber-600 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Actif
            </span>
          </div>
        </div>
      </div>

      {/* AI Judge Result Box (if evaluated) */}
      {judge && (
        <div data-testid="lmd-judge-result" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-indigo-200 dark:border-indigo-900 shadow-sm space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Verdict Officiel du Moteur LMD
            </span>
            <button 
              onClick={() => setJudge(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              Fermer
            </button>
          </div>
          <h3 className="text-xl font-black text-[#001A4B] dark:text-white">{judge.verdict}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {isRtl ? judge.explanation_ar : judge.explanation_fr}
          </p>
        </div>
      )}

      {/* ── Main Grades Content Container ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-6">
        {/* Controls: Title + Search & Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-[#001A4B] dark:text-white flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-blue-600" /> Détail des Modules & Éléments Pédagogiques
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Notes de contrôle continu, examen terminal et session de rattrapage — Guichet Réclamations ouvert sous 48h
            </p>
          </div>

          {/* Search + Status Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
            >
              <option value="all">Tous les statuts</option>
              <option value="validated">Validés (≥ 10/20)</option>
              <option value="retake">Rattrapage (6 - 9.9/20)</option>
              <option value="failed">Éliminatoires (&lt; 6/20)</option>
            </select>
          </div>
        </div>

        {/* Semester Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Semestres :</span>
          <button
            onClick={() => setSelectedSemester('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              selectedSemester === 'all'
                ? "bg-[#001A4B] text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            Tous les semestres ({grades.length})
          </button>
          {availableSemesters.map((sem) => {
            const semCode = `S${sem}`;
            const count = grades.filter((g: any) => String(g.semester_number || g.semester || '').toUpperCase().includes(semCode)).length;
            return (
              <button
                key={sem}
                onClick={() => setSelectedSemester(semCode)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                  selectedSemester.toUpperCase() === semCode
                    ? "bg-[#001A4B] text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <span>Semestre {sem}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  selectedSemester.toUpperCase() === semCode ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Table Container ── */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 pl-4 pr-3">Élément de Module</th>
                <th className="py-3.5 px-3 text-center">CC 1 (25%)</th>
                <th className="py-3.5 px-3 text-center">CC 2 (25%)</th>
                <th className="py-3.5 px-3 text-center">Examen Final (50%)</th>
                <th className="py-3.5 px-3 text-center">Rattrapage</th>
                <th className="py-3.5 px-3 text-center">Moyenne Finale</th>
                <th className="py-3.5 px-3 text-center">Décision LMD</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Recours 48h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredGrades.map((grade: any, idx: number) => {
                const total = grade.moyenne_finale !== null && grade.moyenne_finale !== undefined 
                  ? Number(grade.moyenne_finale) 
                  : (grade.moyenne_normale !== null && grade.moyenne_normale !== undefined ? Number(grade.moyenne_normale) : null);
                const rawDecision = grade.decision_finale || grade.decision_normale;
                const decision = rawDecision ? normalizeDecision(rawDecision, total || 0) : null;
                const code = decision ? decisionLabel(String(decision)) : null;

                const isPassing = total !== null && total >= 10;
                const isEliminated = total !== null && total < 6;
                const isRetake = total !== null && total >= 6 && total < 10;
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    {/* Module Title & Badges */}
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="font-black text-slate-900 dark:text-white text-sm">
                        {cleanMojibake(grade.module_name || grade.module?.name) || `Module ${idx + 1}`}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {grade.module_code || grade.module?.code || `M-${idx + 101}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {grade.semester_number || grade.semester || 'S5'}
                        </span>
                      </div>
                    </td>

                    {/* CC 1 Note (25%) */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                      {isRevealed ? (
                        grade.cc1_note !== null && grade.cc1_note !== undefined 
                          ? `${Number(grade.cc1_note).toFixed(2)}` 
                          : (grade.cc_note !== null && grade.cc_note !== undefined ? `${Number(grade.cc_note).toFixed(2)}` : '—')
                      ) : '•••'}
                    </td>

                    {/* CC 2 Note (25%) */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                      {isRevealed ? (
                        grade.cc2_note !== null && grade.cc2_note !== undefined 
                          ? `${Number(grade.cc2_note).toFixed(2)}` 
                          : (grade.cc_note !== null && grade.cc_note !== undefined ? `${Number(grade.cc_note).toFixed(2)}` : '—')
                      ) : '•••'}
                    </td>

                    {/* Exam Note */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                      {isRevealed ? (
                        grade.exam_note !== null && grade.exam_note !== undefined 
                          ? `${Number(grade.exam_note).toFixed(2)}` 
                          : '—'
                      ) : '•••'}
                    </td>

                    {/* Rattrapage Note */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {isRevealed ? (
                        grade.rattrapage_note !== null && grade.rattrapage_note !== undefined ? (
                          <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                            {Number(grade.rattrapage_note).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )
                      ) : '•••'}
                    </td>

                    {/* Moyenne Finale */}
                    <td className="py-3.5 px-3 text-center font-mono font-black text-base">
                      {isRevealed ? (
                        total !== null ? (
                          <span className={cn(
                            isPassing && "text-emerald-600 dark:text-emerald-400",
                            isRetake && "text-amber-600 dark:text-amber-400",
                            isEliminated && "text-rose-600 dark:text-rose-400"
                          )}>
                            {Number(total).toFixed(2)}
                          </span>
                        ) : '—'
                      ) : '••••'}
                    </td>

                    {/* Décision LMD */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex justify-center">
                        {isRevealed ? (
                          total !== null && code ? (
                            <LmdBadge decision={code} score={total} />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                              En attente
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            Masqué
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Recours / Réclamation 48h */}
                    <td className="py-3.5 pr-4 pl-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedModuleForAppeal(grade);
                          setAppealModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black transition-all cursor-pointer active:scale-95 shadow-2xs"
                        title="Déposer un recours pour vérification matérielle de la note sous 48h"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Recours 48h
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state when no modules match filters */}
              {(!filteredGrades || filteredGrades.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      icon={AlertCircle}
                      title="Aucun module ne correspond à vos critères"
                      description="Modifiez votre recherche ou réinitialisez les filtres pour afficher l'ensemble de vos éléments pédagogiques."
                      actionLabel="Réinitialiser tous les filtres"
                      onAction={() => { 
                        setSelectedSemester('all');
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Official LMD Pedagogical Rules Footer ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <LmdLegend />
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Seuil de validation : <strong>10.00/20</strong> • Note éliminatoire : <strong>&lt; 6.00/20</strong></span>
          </div>
        </div>
      </div>

      {/* ── Active Appeals Section (Guichet LMD 48h) ── */}
      {appealsList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-black text-[#001A4B] dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" /> Suivi de mes Réclamations de Notes (Guichet LMD 48h)
            </h2>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full text-xs font-black">
              {appealsList.length} Demande{appealsList.length > 1 ? 's' : ''} en cours
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {appealsList.map((appeal: any) => (
              <div key={appeal.id} className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      {appeal.module?.name || `Module #${appeal.module_id}`}
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      Note initiale contestée : <strong className="text-slate-700 dark:text-slate-300">{Number(appeal.original_grade).toFixed(2)} / 20</strong>
                    </span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    appeal.status === 'rectified' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                    appeal.status === 'maintained' && "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
                    (appeal.status === 'submitted' || appeal.status === 'under_review') && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  )}>
                    {appeal.status === 'rectified' ? `Note Rectifiée : ${Number(appeal.rectified_grade).toFixed(2)}/20` : 
                     appeal.status === 'maintained' ? 'Note Maintenue' : 'En Instruction (48h)'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                  <span className="font-bold">Motif invoqué :</span> {appeal.reason}
                </p>

                {appeal.resolution_notes && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-[#001A4B] dark:text-blue-300">Avis du Professeur Responsable :</span> {appeal.resolution_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Interactive LMD Simulator Modal ── */}
      {simulatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600">
                <FlaskConical className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Simulateur de Validation & Moteur IA LMD</h3>
              </div>
              <button 
                onClick={() => setSimulatorModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Interactive Calculator */}
            <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-indigo-800 dark:text-indigo-300 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Simulation Instantanée de Module
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full font-mono">
                    Formule LMD : 25% + 25% + 50%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CC 1 (25%)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    value={simCc1}
                    onChange={(e) => setSimCc1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CC 2 (25%)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    value={simCc2}
                    onChange={(e) => setSimCc2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Examen (50%)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    value={simExam}
                    onChange={(e) => setSimExam(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-indigo-900">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Moyenne simulée :</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xl font-black font-mono",
                    simulatedAverage >= 10 ? "text-emerald-600" : (simulatedAverage >= 6 ? "text-amber-600" : "text-rose-600")
                  )}>
                    {simulatedAverage} / 20
                  </span>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                    simulatedAverage >= 10 ? "bg-emerald-100 text-emerald-800" : (simulatedAverage >= 6 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800")
                  )}>
                    {simulatedAverage >= 10 ? 'V (Validé)' : (simulatedAverage >= 6 ? 'RAT (Rattrapage)' : 'NV (Éliminatoire)')}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Copilot Ask */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Consulter l'IA LMD sur l'ensemble de votre semestre
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Le moteur IA analyse l'ensemble de vos notes réelles enregistrées sur votre dossier étudiant, vérifie l'absence de note éliminatoire (&lt; 6/20) et simule la compensation semestrielle officielle.
              </p>
              <button
                onClick={async () => {
                  await handleRunAiJudge();
                  setSimulatorModalOpen(false);
                }}
                disabled={judgeLoading}
                className="w-full py-3 rounded-2xl bg-[#001A4B] hover:bg-[#082663] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {judgeLoading ? "Analyse en cours par le Jury IA..." : "Lancer l'Analyse Globale de mon Semestre"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grade Appeal Modal (Guichet 48h) ── */}
      {appealModalOpen && selectedModuleForAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600">
                <Scale className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Déposer un Recours de Note (48h)</h3>
              </div>
              <button 
                onClick={() => setAppealModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <p className="font-black flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Délais Réglementaires : 48 Heures Après Affichage
              </p>
              <p className="text-[11px] leading-relaxed">
                Conformément à la charte des examens de l'ENCG Fès, tout recours doit porter sur une erreur matérielle de report, de sommation ou d'omission d'une copie double.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Module concerné</span>
              <p className="font-black text-sm text-slate-800 dark:text-white">{cleanMojibake(selectedModuleForAppeal.module_name || selectedModuleForAppeal.module?.name)}</p>
              <p className="text-xs font-mono text-slate-500">
                Note actuelle enregistrée : <strong className="text-slate-800 dark:text-slate-200">{Number(selectedModuleForAppeal.moyenne_finale || selectedModuleForAppeal.moyenne_normale || 10).toFixed(2)} / 20</strong>
              </p>
            </div>

            <form onSubmit={handleSubmitAppeal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nature du Recours</label>
                <select
                  value={appealReasonType}
                  onChange={(e) => setAppealReasonType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
                >
                  <option value="erreur_sommation">Erreur matérielle de sommation des points sur l'épreuve</option>
                  <option value="omission_cc">Omission ou erreur de report de la note de Contrôle Continu (CC)</option>
                  <option value="omission_copie">Omission d'évaluation d'une copie double ou intercalaire</option>
                  <option value="discordance_saisie">Discordance entre la note affichée et le barème de l'épreuve</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Détails & Arguments Précis</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Précisez la question ou la copie concernée (ex : Exercice 3 non comptabilisé sur 4 points)..."
                  value={appealReasonDetails}
                  onChange={(e) => setAppealReasonDetails(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAppealModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#001A4B] hover:bg-[#082663] text-white shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> {submittingAppeal ? 'Transmission...' : 'Soumettre le Recours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
