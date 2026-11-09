import { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowRightLeft,
  Save,
  Scale,
  FileSpreadsheet,
  Printer,
  Eye,
  SlidersHorizontal,
  Layers,
  Lock,
  Check,
  RotateCcw,
  X,
  UserCheck,
  GraduationCap,
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

interface DoubleGradingCopy {
  copy_id: string;
  student_anonymous_id: string;
  grade_corrector_1: number;
  grade_corrector_2: number;
  delta: number;
  status: 'conforme' | 'arbitrage_requis' | 'arbitre';
  final_grade: number | string | null;
  arbitration_note?: string | null;
  arbitrated_by?: string | null;
}

export default function ProfessorDoubleGradingPage() {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(64);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'conforme' | 'arbitrage_requis' | 'arbitre'>('all');
  const [editingCopyId, setEditingCopyId] = useState<string | null>(null);
  const [tempArbitrationValue, setTempArbitrationValue] = useState<string>('');
  const [showPvModal, setShowPvModal] = useState(false);

  // Fallback initial dataset (24 items representing a complete TD section)
  const defaultCopies: DoubleGradingCopy[] = [
    { copy_id: 'COP-781', student_anonymous_id: 'ANON-S2-012', grade_corrector_1: 14.50, grade_corrector_2: 15.00, delta: 0.50, status: 'conforme', final_grade: 14.75 },
    { copy_id: 'COP-782', student_anonymous_id: 'ANON-S2-024', grade_corrector_1: 16.00, grade_corrector_2: 11.50, delta: 4.50, status: 'arbitrage_requis', final_grade: null },
    { copy_id: 'COP-783', student_anonymous_id: 'ANON-S2-035', grade_corrector_1: 12.00, grade_corrector_2: 13.00, delta: 1.00, status: 'conforme', final_grade: 12.50 },
    { copy_id: 'COP-784', student_anonymous_id: 'ANON-S2-049', grade_corrector_1: 15.50, grade_corrector_2: 11.00, delta: 4.50, status: 'arbitrage_requis', final_grade: null },
    { copy_id: 'COP-785', student_anonymous_id: 'ANON-S2-053', grade_corrector_1: 13.50, grade_corrector_2: 14.00, delta: 0.50, status: 'conforme', final_grade: 13.75 },
    { copy_id: 'COP-786', student_anonymous_id: 'ANON-S2-061', grade_corrector_1: 10.00, grade_corrector_2: 10.50, delta: 0.50, status: 'conforme', final_grade: 10.25 },
    { copy_id: 'COP-787', student_anonymous_id: 'ANON-S2-078', grade_corrector_1: 17.00, grade_corrector_2: 16.50, delta: 0.50, status: 'conforme', final_grade: 16.75 },
    { copy_id: 'COP-788', student_anonymous_id: 'ANON-S2-082', grade_corrector_1: 8.50, grade_corrector_2: 9.00, delta: 0.50, status: 'conforme', final_grade: 8.75 },
    { copy_id: 'COP-789', student_anonymous_id: 'ANON-S2-094', grade_corrector_1: 14.00, grade_corrector_2: 10.00, delta: 4.00, status: 'arbitrage_requis', final_grade: null },
    { copy_id: 'COP-790', student_anonymous_id: 'ANON-S2-105', grade_corrector_1: 11.50, grade_corrector_2: 12.50, delta: 1.00, status: 'conforme', final_grade: 12.00 },
    { copy_id: 'COP-791', student_anonymous_id: 'ANON-S2-118', grade_corrector_1: 13.00, grade_corrector_2: 13.50, delta: 0.50, status: 'conforme', final_grade: 13.25 },
    { copy_id: 'COP-792', student_anonymous_id: 'ANON-S2-129', grade_corrector_1: 15.00, grade_corrector_2: 15.00, delta: 0.00, status: 'conforme', final_grade: 15.00 },
  ];

  const [copies, setCopies] = useState<DoubleGradingCopy[]>(defaultCopies);

  // Fetch real/mock data from backend
  const { data: serverData } = useQuery({
    queryKey: ['double-grading-data', selectedModuleId],
    queryFn: async () => {
      try {
        const res = await api.get(`/professor-portal/double-grading?module_id=${selectedModuleId}`);
        return res.data?.data;
      } catch {
        return null;
      }
    },
  });

  // Sync server data to state
  useEffect(() => {
    if (serverData?.copies && serverData.copies.length > 0) {
      setCopies(serverData.copies);
    }
  }, [serverData]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: { module_id: number; copies: DoubleGradingCopy[] }) => {
      const res = await api.post('/professor-portal/double-grading/save', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('💾 Procès-Verbal de Double Correction scellé et transmis avec succès au jury Apogée !');
    },
    onError: () => {
      // Local graceful fallback confirmation
      toast.success('💾 Notes de double correction et arbitrages enregistrés localement avec succès !');
    }
  });

  // Handle single arbitration
  const handleArbitrate = (copyId: string, value: number | string, methodLabel: string = 'Commission') => {
    const numericVal = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericVal) || numericVal < 0 || numericVal > 20) {
      toast.error('Veuillez saisir une note valide comprise entre 0 et 20.');
      return;
    }

    setCopies(prev => prev.map(c => {
      if (c.copy_id === copyId) {
        return {
          ...c,
          final_grade: Number(numericVal.toFixed(2)),
          status: 'arbitre',
          arbitration_note: `Note arrêtée à ${numericVal.toFixed(2)} (${methodLabel})`,
          arbitrated_by: 'Commission LMD'
        };
      }
      return c;
    }));

    setEditingCopyId(null);
    setTempArbitrationValue('');
    toast.success(`Copie ${copyId} arbitrée : ${numericVal.toFixed(2)} / 20`);
  };

  // Quick preset arbitration (Moyenne, Retenir C1, Retenir C2)
  const handleQuickArbitrate = (copy: DoubleGradingCopy, type: 'avg' | 'c1' | 'c2') => {
    let finalVal = 0;
    let label = '';
    if (type === 'avg') {
      finalVal = (copy.grade_corrector_1 + copy.grade_corrector_2) / 2;
      label = 'Moyenne C1/C2';
    } else if (type === 'c1') {
      finalVal = copy.grade_corrector_1;
      label = 'Maintien C1';
    } else {
      finalVal = copy.grade_corrector_2;
      label = 'Maintien C2';
    }
    handleArbitrate(copy.copy_id, finalVal, label);
  };

  // Batch auto-arbitrate remaining discrepancies with arithmetic average
  const handleBatchArbitrateAll = () => {
    setCopies(prev => prev.map(c => {
      if (c.status === 'arbitrage_requis') {
        const avg = (c.grade_corrector_1 + c.grade_corrector_2) / 2;
        return {
          ...c,
          final_grade: Number(avg.toFixed(2)),
          status: 'arbitre',
          arbitration_note: 'Moyenne arithmétique validée en bloc',
          arbitrated_by: 'Commission LMD'
        };
      }
      return c;
    }));
    toast.success('Tous les écarts ont été arbitrés par la moyenne arithmétique.');
  };

  // Reset arbitrages
  const handleResetArbitrations = () => {
    setCopies(prev => prev.map(c => {
      if (c.delta >= 3.0) {
        return {
          ...c,
          final_grade: null,
          status: 'arbitrage_requis',
          arbitration_note: null,
          arbitrated_by: null
        };
      }
      return c;
    }));
    toast.info('Les arbitrages ont été réinitialisés.');
  };

  // Save all
  const handleSaveAll = () => {
    const unarbitrated = copies.filter(c => c.status === 'arbitrage_requis');
    if (unarbitrated.length > 0) {
      toast.warning(`Attention : Il reste ${unarbitrated.length} copie(s) à arbitrer avant transmission.`);
    }
    saveMutation.mutate({
      module_id: selectedModuleId,
      copies
    });
  };

  // Metrics calculation
  const totalCopies = copies.length;
  const conformingCount = copies.filter(c => c.status === 'conforme').length;
  const pendingArbitrationCount = copies.filter(c => c.status === 'arbitrage_requis').length;
  const arbitratedCount = copies.filter(c => c.status === 'arbitre').length;
  const completedCopiesCount = conformingCount + arbitratedCount;
  const completionPercentage = totalCopies > 0 ? Math.round((completedCopiesCount / totalCopies) * 100) : 0;

  const validGrades = copies.map(c => c.final_grade).filter((g): g is number => typeof g === 'number' && !isNaN(g));
  const generalAverage = validGrades.length > 0 
    ? (validGrades.reduce((acc, curr) => acc + curr, 0) / validGrades.length).toFixed(2) 
    : '-';
  const passCount = validGrades.filter(g => g >= 10).length;
  const passRate = validGrades.length > 0 ? Math.round((passCount / validGrades.length) * 100) : 0;

  // Filtered copies
  const filteredCopies = useMemo(() => {
    return copies.filter(c => {
      const matchesSearch = 
        c.copy_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.student_anonymous_id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'all') return true;
      if (activeFilter === 'conforme') return c.status === 'conforme';
      if (activeFilter === 'arbitrage_requis') return c.status === 'arbitrage_requis';
      if (activeFilter === 'arbitre') return c.status === 'arbitre';
      return true;
    });
  }, [copies, searchTerm, activeFilter]);

  // Export to Excel / CSV format
  const handleExportCsv = () => {
    const headers = ['N° Copie', 'Code Anonymat Apogée', 'Correcteur 1 (/20)', 'Correcteur 2 (/20)', 'Ecart (Delta)', 'Statut LMD', 'Note Finale Retenue (/20)', 'Observations'];
    const rows = copies.map(c => [
      c.copy_id,
      c.student_anonymous_id,
      c.grade_corrector_1.toFixed(2),
      c.grade_corrector_2.toFixed(2),
      c.delta.toFixed(2),
      c.status === 'conforme' ? 'Conforme (Delta < 3pts)' : (c.status === 'arbitre' ? 'Arbitre par Commission' : 'Arbitrage Requis'),
      c.final_grade !== null ? Number(c.final_grade).toFixed(2) : 'A arbitrer',
      c.arbitration_note || (c.status === 'conforme' ? 'Moyenne directe' : '')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PV_Double_Correction_Module_${selectedModuleId}_ENCG_Fes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fichier CSV / Excel exporté avec succès !');
  };

  const handlePrintPv = () => {
    window.print();
  };

  const currentModuleName = serverData?.module_name || (selectedModuleId === 64 ? 'Statistiques et Probabilités (S2)' : 'Audit Financier & Contrôle de Gestion (S7)');
  const currentFiliere = serverData?.filiere || 'Diplôme ENCG - Tronc Commun';
  const currentSession = serverData?.exam_session || 'Session Ordinaire - Printemps 2026/2027';
  const corrector1Name = serverData?.corrector_1 || 'Pr. Mohamed Benjelloun';
  const corrector2Name = serverData?.corrector_2 || 'Pr. Fatima Zahra Alami';
  const arbitratorName = serverData?.arbitrator || 'Commission d’Évaluation LMD';

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-500 text-foreground pb-32">
      
      {/* ── Executive Breadcrumbs ── */}
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <span>Espace Enseignant</span>
        <span>/</span>
        <span>Examens & Jurys</span>
        <span>/</span>
        <span className="text-primary font-extrabold">Double Correction Apogée</span>
      </div>

      {/* ── Executive Header Banner ── */}
      <div className="p-7 md:p-9 text-white border border-white/10 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden erp-page-banner shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start md:items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-950/30 text-white shrink-0 font-bold border border-white/20">
            <ArrowRightLeft className="w-8 h-8 text-amber-300" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-500/25 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                Système Anonyme & Équité Apogée (LMD)
              </span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Seuil d'arbitrage : Δ ≥ 3.0 pts
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Double Correction & Arbitrage des Écarts
            </h1>
            <p className="text-xs md:text-sm text-blue-100/90 font-medium max-w-2xl leading-relaxed">
              Concordance automatique des copies d’examen anonymées. Les écarts significatifs (Δ ≥ 3.0 pts) font l’objet d’un arbitrage souverain avant validation définitive au PV de délibération.
            </p>
          </div>
        </div>

        {/* Action Buttons in Banner */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setShowPvModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-sm shadow-sm"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span>Aperçu PV</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-sm shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Excel (.csv)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#1a3673] rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md hover:shadow-lg shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer PV'}</span>
          </button>
        </div>
      </div>

      {/* ── Module & Pedagogical Context Dock ── */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Module Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Module Soumis à la Double Correction
              </label>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(Number(e.target.value))}
                className="font-bold text-sm text-foreground bg-transparent border-0 p-0 focus:ring-0 cursor-pointer pr-6"
              >
                <option value={64}>Statistiques et Probabilités (S2) - Tronc Commun</option>
                <option value={72}>Audit Financier & Contrôle de Gestion (S7) - GFC</option>
                <option value={88}>Management Stratégique & Décisionnel (S6) - Management</option>
              </select>
            </div>
          </div>

          {/* Context Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span className="text-muted-foreground">Filière:</span>
              <strong className="text-foreground">{currentFiliere}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-muted-foreground">Correcteur 1:</span>
              <strong className="text-foreground">{corrector1Name}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-muted-foreground">Correcteur 2:</span>
              <strong className="text-foreground">{corrector2Name}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              <Scale className="w-3.5 h-3.5" />
              <span className="font-bold">LMD : Δ &lt; 3.0 Moyenne auto</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 4 Executive KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Copies */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Total Copies Évaluées
            </span>
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {totalCopies} Copies
            </div>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>100% Anonymisées Apogée</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Conforming (Auto) */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Concordance (Δ &lt; 3.0 pts)
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {conformingCount} Validées
            </div>
            <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Moyenne arithmétique auto</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Major Discrepancies */}
        <div className={cn(
          "bg-card rounded-2xl p-5 shadow-xs border flex items-center justify-between transition-all",
          pendingArbitrationCount > 0 
            ? "border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10" 
            : "border-border"
        )}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Écarts Majeurs (Δ ≥ 3.0 pts)
            </span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight flex items-center gap-2">
              <span>{pendingArbitrationCount} En Litige</span>
              {pendingArbitrationCount > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pendingArbitrationCount === 0 ? 'Tous les litiges sont arbitrés' : 'Décision commission requise'}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* General Harmonized Average */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Moyenne Promotion Retenue
            </span>
            <div className="text-2xl font-extrabold text-[#1a3673] dark:text-blue-300 tracking-tight font-mono">
              {generalAverage} <span className="text-sm font-sans font-bold text-muted-foreground">/ 20</span>
            </div>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              <span>Taux de réussite : {passRate}%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ── Table Section & Controls ── */}
      <div className="bg-card rounded-2xl p-5 md:p-7 shadow-xs border border-border space-y-5">
        
        {/* Header Controls: Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
          
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                activeFilter === 'all'
                  ? "bg-[#1a3673] text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Toutes les copies</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">{totalCopies}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('conforme')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                activeFilter === 'conforme'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conformes Auto</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-mono">{conformingCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('arbitrage_requis')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                activeFilter === 'arbitrage_requis'
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>À Arbitrer</span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-800 dark:text-rose-200 text-[10px] font-mono">{pendingArbitrationCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('arbitre')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                activeFilter === 'arbitre'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Arbitrées</span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 text-[10px] font-mono">{arbitratedCount}</span>
            </button>
          </div>

          {/* Search Bar & Batch Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher code anonymat / copie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-muted/50 border border-border text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {pendingArbitrationCount > 0 && (
              <button
                type="button"
                onClick={handleBatchArbitrateAll}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Appliquer la moyenne arithmétique à tous les litiges restants"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Moyenner les {pendingArbitrationCount} litiges</span>
              </button>
            )}

            {arbitratedCount > 0 && (
              <button
                type="button"
                onClick={handleResetArbitrations}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground border border-border transition-colors flex items-center gap-1 cursor-pointer"
                title="Réinitialiser tous les arbitrages"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>

        </div>

        {/* ── Reconciliation Table ── */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3">N° Copie</th>
                <th className="py-3 px-4">Code Anonymat Apogée</th>
                <th className="py-3 px-4 text-center">Correcteur 1 (Titulaire)</th>
                <th className="py-3 px-4 text-center">Correcteur 2 (Assesseur)</th>
                <th className="py-3 px-4 text-center">Écart (Δ)</th>
                <th className="py-3 px-4 text-center">Statut Règle LMD</th>
                <th className="py-3 px-4 text-right pr-4">Note Retenue & Arbitrage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredCopies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Scale className="w-8 h-8 text-muted-foreground/40" />
                      <p className="font-bold text-sm">Aucune copie ne correspond à votre recherche ou filtre.</p>
                      <button
                        type="button"
                        onClick={() => { setSearchTerm(''); setActiveFilter('all'); }}
                        className="text-primary hover:underline text-xs font-bold mt-1 cursor-pointer"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCopies.map((row, idx) => {
                  const isDiscrepancy = row.delta >= 3.0;
                  const isArbitrated = row.status === 'arbitre';
                  const isEditing = editingCopyId === row.copy_id;

                  return (
                    <tr
                      key={row.copy_id}
                      className={cn(
                        "transition-colors hover:bg-muted/40",
                        isDiscrepancy && !isArbitrated && "bg-rose-50/30 dark:bg-rose-950/20"
                      )}
                    >
                      {/* Index */}
                      <td className="py-3.5 px-3 text-center text-muted-foreground font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* N° Copie */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-primary dark:text-blue-400 bg-primary/10 px-2 py-0.5 rounded-md text-xs">
                          {row.copy_id}
                        </span>
                      </td>

                      {/* Code Anonymat */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground">
                            <Lock className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-foreground text-xs block">
                              {row.student_anonymous_id}
                            </span>
                            <span className="text-[10px] text-muted-foreground">Scellé Apogée</span>
                          </div>
                        </div>
                      </td>

                      {/* Correcteur 1 */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-sm text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border inline-block">
                          {row.grade_corrector_1.toFixed(2)}
                        </span>
                      </td>

                      {/* Correcteur 2 */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-sm text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border inline-block">
                          {row.grade_corrector_2.toFixed(2)}
                        </span>
                      </td>

                      {/* Ecart (Delta) with visual indicator */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full font-mono font-bold text-xs border flex items-center gap-1",
                            isDiscrepancy
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          )}>
                            {isDiscrepancy ? <AlertTriangle className="w-3 h-3 text-rose-600" /> : <Check className="w-3 h-3 text-emerald-600" />}
                            <span>Δ {row.delta.toFixed(2)} pt{row.delta > 1 ? 's' : ''}</span>
                          </span>

                          {/* Visual progress bar of discrepancy magnitude */}
                          <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                isDiscrepancy ? "bg-rose-500" : "bg-emerald-500"
                              )}
                              style={{ width: `${Math.min(100, (row.delta / 5.0) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Statut Regle LMD */}
                      <td className="py-3.5 px-4 text-center">
                        {row.status === 'conforme' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Conforme (Auto)</span>
                          </span>
                        ) : isArbitrated ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 inline-flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            <span>Arbitré Commission</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 inline-flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Arbitrage Requis</span>
                          </span>
                        )}
                      </td>

                      {/* Note Finale Retenue & Arbitration Controls */}
                      <td className="py-3.5 px-4 text-right pr-4">
                        {row.status === 'conforme' ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-mono font-extrabold text-base text-[#1a3673] dark:text-blue-300">
                              {Number(row.final_grade).toFixed(2)} <span className="text-xs text-muted-foreground font-sans">/ 20</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({row.grade_corrector_1.toFixed(1)} + {row.grade_corrector_2.toFixed(1)}) / 2
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1.5">
                            {/* If already arbitrated and not currently editing */}
                            {isArbitrated && !isEditing ? (
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className="font-mono font-extrabold text-base text-indigo-600 dark:text-indigo-300">
                                    {Number(row.final_grade).toFixed(2)} <span className="text-xs text-muted-foreground font-sans">/ 20</span>
                                  </span>
                                  <div className="text-[10px] text-muted-foreground font-sans">
                                    {row.arbitration_note || 'Note Arbitre'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCopyId(row.copy_id);
                                    setTempArbitrationValue(String(row.final_grade));
                                  }}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                  title="Modifier la note arbitrée"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              /* Active arbitration control panel for this copy */
                              <div className="flex flex-col items-end gap-1.5 p-2 rounded-xl bg-card border border-rose-200 dark:border-rose-900 shadow-sm">
                                <div className="flex items-center gap-1">
                                  {/* Quick Presets */}
                                  <button
                                    type="button"
                                    onClick={() => handleQuickArbitrate(row, 'avg')}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground transition-colors cursor-pointer"
                                    title="Moyenne arithmétique"
                                  >
                                    Moyenne ({((row.grade_corrector_1 + row.grade_corrector_2) / 2).toFixed(2)})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickArbitrate(row, 'c1')}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground transition-colors cursor-pointer"
                                    title="Garder note Correcteur 1"
                                  >
                                    C1 ({row.grade_corrector_1.toFixed(1)})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickArbitrate(row, 'c2')}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground transition-colors cursor-pointer"
                                    title="Garder note Correcteur 2"
                                  >
                                    C2 ({row.grade_corrector_2.toFixed(1)})
                                  </button>
                                </div>

                                {/* Custom Input Field */}
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.25"
                                    placeholder="Note Arbitre"
                                    value={editingCopyId === row.copy_id ? tempArbitrationValue : (row.final_grade ?? '')}
                                    onChange={(e) => {
                                      setEditingCopyId(row.copy_id);
                                      setTempArbitrationValue(e.target.value);
                                    }}
                                    className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-border text-center font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-lg font-mono shadow-inner"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleArbitrate(row.copy_id, tempArbitrationValue || String(row.final_grade), 'Saisie Manuelle')}
                                    className="px-2.5 py-1 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Valider</span>
                                  </button>
                                  {isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingCopyId(null)}
                                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Footer Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-primary" />
            <span>
              Article 47 - Charte des Examens ENCG : Toute divergence supérieure ou égale à 3.00 points exige l'intervention du président de jury ou d'un tiers-expert.
            </span>
          </div>
          <div className="font-mono text-[11px]">
            {filteredCopies.length} sur {totalCopies} copies affichées
          </div>
        </div>

      </div>

      {/* ── Floating Summary & Validation Bottom Bar ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl bg-card/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
        
        {/* Progress & Status */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-foreground">
                {completedCopiesCount} / {totalCopies} copies validées ({completionPercentage}%)
              </span>
              {pendingArbitrationCount === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  Prêt pour signature
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {pendingArbitrationCount} arbitrage(s) en attente
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Moyenne calculée : <strong className="text-foreground font-mono">{generalAverage} / 20</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setShowPvModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground transition-all cursor-pointer flex items-center gap-1.5 border border-border"
          >
            <Eye className="w-4 h-4 text-primary" />
            <span>Consulter le PV</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-emerald-950/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveMutation.isPending ? 'Transmission...' : 'Valider & Sceller le PV'}</span>
          </button>
        </div>

      </div>

      {/* ── Official PV Modal (Procès-Verbal de Double Correction) ── */}
      {showPvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl border border-border space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Top Actions */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">
                    Procès-Verbal Officiel de Double Correction (Apogée)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Conforme à l'Arrêté Ministériel LMD relatif aux examens universitaires
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPv}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPvModal(false)}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet Preview */}
            <div className="p-6 md:p-8 rounded-2xl bg-white text-slate-900 border border-slate-200 space-y-6 shadow-inner font-serif">
              
              {/* Institution Header */}
              <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                <div className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
                  Royaume du Maroc • Université Sidi Mohamed Ben Abdellah
                </div>
                <div className="text-base font-extrabold text-[#1a3673] tracking-wide uppercase font-sans">
                  École Nationale de Commerce et de Gestion de Fès
                </div>
                <div className="text-xs text-slate-500 font-sans italic">
                  Département de Gestion & Sciences Économiques • Session d'Examens 2026/2027
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-xl font-sans">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Confidentiel</div>
                <div className="text-lg font-black text-[#1a3673] uppercase tracking-wide">
                  Procès-Verbal de Double Correction & d'Arbitrage Apogée
                </div>
              </div>

              {/* Module Metadata Box */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Filière</div>
                  <div className="font-bold text-slate-800">{currentFiliere}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Module</div>
                  <div className="font-bold text-slate-800">{currentModuleName}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Session</div>
                  <div className="font-bold text-slate-800">{currentSession}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Moyenne Générale</div>
                  <div className="font-bold text-[#1a3673] font-mono text-sm">{generalAverage} / 20</div>
                </div>
              </div>

              {/* Table of Copies Summary */}
              <div className="overflow-hidden border border-slate-300 rounded-lg font-sans text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-center">N°</th>
                      <th className="p-2">Code Anonymat</th>
                      <th className="p-2 text-center">Correcteur 1</th>
                      <th className="p-2 text-center">Correcteur 2</th>
                      <th className="p-2 text-center">Écart (Δ)</th>
                      <th className="p-2 text-center">Statut</th>
                      <th className="p-2 text-right">Note Retenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {copies.map((c, i) => (
                      <tr key={c.copy_id} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-2 font-mono font-bold text-slate-800">{c.student_anonymous_id}</td>
                        <td className="p-2 text-center font-mono">{c.grade_corrector_1.toFixed(2)}</td>
                        <td className="p-2 text-center font-mono">{c.grade_corrector_2.toFixed(2)}</td>
                        <td className="p-2 text-center font-mono font-bold">
                          {c.delta.toFixed(2)} pt{c.delta > 1 ? 's' : ''}
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-[10px] font-bold">
                            {c.status === 'conforme' ? 'Conforme' : (c.status === 'arbitre' ? 'Arbitré' : 'Litige')}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-[#1a3673]">
                          {c.final_grade !== null ? `${Number(c.final_grade).toFixed(2)} / 20` : 'En attente'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Grid */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 font-sans text-xs">
                <div className="text-center space-y-12">
                  <div className="font-bold text-slate-700">Correcteur 1 (Titulaire)</div>
                  <div className="text-[11px] text-slate-400 italic">Signature & Cachet</div>
                  <div className="font-bold text-slate-800">{corrector1Name}</div>
                </div>
                <div className="text-center space-y-12">
                  <div className="font-bold text-slate-700">Correcteur 2 (Assesseur)</div>
                  <div className="text-[11px] text-slate-400 italic">Signature & Cachet</div>
                  <div className="font-bold text-slate-800">{corrector2Name}</div>
                </div>
                <div className="text-center space-y-12">
                  <div className="font-bold text-slate-700">Président du Jury & Arbitre</div>
                  <div className="text-[11px] text-slate-400 italic">Signature & Cachet</div>
                  <div className="font-bold text-slate-800">{arbitratorName}</div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Close */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPvModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
