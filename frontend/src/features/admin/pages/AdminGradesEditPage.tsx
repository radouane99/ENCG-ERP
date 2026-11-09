import { useMemo, useState, FormEvent, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  History,
  Settings,
  Calculator,
  ShieldCheck,
  X,
  Trash2,
  Plus,
  FileText,
  Search,
  AlertTriangle,
  Layers,
  Lock,
  Unlock,
  BookOpen
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/Button';
import { Spinner } from '@shared/components/ui/Spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function AdminGradesEditPage() {
  const { i18n } = useTranslation('common');
  const isRtl = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module_id');
  const currentGroupId = searchParams.get('group_id');
  const filiereId = searchParams.get('filiere_id');
  const semesterParam = searchParams.get('semester');
  const queryClient = useQueryClient();

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [grades, setGrades] = useState<Record<number, { value: string; absent: boolean }>>({});
  const [grades2, setGrades2] = useState<Record<number, { value: string; absent: boolean }>>({});
  const [isDoubleSaisie, setIsDoubleSaisie] = useState(false);
  const [viewAllGroups, setViewAllGroups] = useState(!currentGroupId || currentGroupId === 'null' || currentGroupId === 'all');
  const [showAuditLogsDrawer, setShowAuditLogsDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'graded' | 'absent'>('all');

  const [showModalityModal, setShowModalityModal] = useState(false);
  const [modalityAssessments, setModalityAssessments] = useState<{
    id: number | null;
    type: string;
    weight: number;
  }[]>([]);
  const [rattrapageCap, setRattrapageCap] = useState<number>(12);

  // Query audit logs
  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['module-audit-logs', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/audit-logs`).then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])),
    enabled: !!moduleId && showAuditLogsDrawer,
  });

  // Fetch module details
  const { data: moduleDetails } = useQuery({
    queryKey: ['module-details', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}`).then(res => res.data?.data || res.data),
    enabled: !!moduleId,
  });

  // Fetch assessments for the given module
  const { data: assessmentsData, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['assessments', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/assessments`).then(res => (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []))),
    enabled: !!moduleId,
  });

  // Fetch students & grades for the selected assessment
  const { data: gradesResponse, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['grades', selectedAssessmentId, currentGroupId, viewAllGroups],
    queryFn: () => api.get(`/assessments/${selectedAssessmentId}/grades`, {
      params: { group_id: viewAllGroups ? 'all' : (currentGroupId && currentGroupId !== 'null' ? currentGroupId : 'all') }
    }).then(res => res.data),
    enabled: !!selectedAssessmentId,
  });

  const studentsData: any[] = useMemo(() => (Array.isArray(gradesResponse?.data) ? gradesResponse.data : (Array.isArray(gradesResponse) ? gradesResponse : [])), [gradesResponse]);
  const selectedAssessment = useMemo(() => (Array.isArray(assessmentsData) ? assessmentsData.find((a: any) => a.id === selectedAssessmentId) : null), [assessmentsData, selectedAssessmentId]);
  const assessmentType = (selectedAssessment?.type || '').trim().toLowerCase();
  const isExamAssessment = assessmentType.includes('exam') || assessmentType.includes('rattrapage') || assessmentType === 'ef' || assessmentType === 'eo';

  const isAssessmentLocked = (gradesResponse?.is_locked || false) && isExamAssessment;
  const isModulePvSigned = Boolean(gradesResponse?.is_module_pv_signed || gradesResponse?.is_locked);
  const signatureInfo = gradesResponse?.signature;

  // Initialize modality assessments modal state
  useEffect(() => {
    if (Array.isArray(assessmentsData)) {
      setModalityAssessments(
        assessmentsData.map((a: any) => ({
          id: a.id,
          type: a.type,
          weight: a.weight
        }))
      );
    }
  }, [assessmentsData, showModalityModal]);

  // Select the appropriate assessment by default if available
  useEffect(() => {
    if (Array.isArray(assessmentsData) && assessmentsData.length > 0 && !selectedAssessmentId) {
      const sessionParam = searchParams.get('session');
      if (sessionParam === 'rattrapage') {
        const rat = assessmentsData.find((a: any) => (a.type || '').toLowerCase().includes('rattrapage'));
        if (rat) {
          setSelectedAssessmentId(rat.id);
          return;
        }
      } else {
        const nonRat = assessmentsData.find((a: any) => !(a.type || '').toLowerCase().includes('rattrapage'));
        if (nonRat) {
          setSelectedAssessmentId(nonRat.id);
          return;
        }
      }
      setSelectedAssessmentId(assessmentsData[0].id);
    }
  }, [assessmentsData, selectedAssessmentId, searchParams]);

  // Initialize local state when students are loaded
  useEffect(() => {
    if (studentsData && studentsData.length > 0) {
      const initialGrades: Record<number, { value: string; absent: boolean }> = {};
      const initialGrades2: Record<number, { value: string; absent: boolean }> = {};
      studentsData.forEach((student: any) => {
        const val = student.is_fraud ? '0' : (student.value !== null && student.value !== undefined ? String(student.value) : '');
        const abs = student.is_fraud ? false : (student.is_absent || false);
        initialGrades[student.student_id] = { value: val, absent: abs };
        initialGrades2[student.student_id] = { value: val, absent: abs };
      });
      setGrades(initialGrades);
      setGrades2(initialGrades2);
    }
  }, [studentsData]);

  // Dynamic Live Metrics
  const statsMetrics = useMemo(() => {
    let filledCount = 0;
    let absentCount = 0;
    let sumGrades = 0;
    let passedCount = 0;

    studentsData.forEach((student: any) => {
      const g = grades[student.student_id];
      if (g?.absent) {
        absentCount++;
      } else if (g?.value !== undefined && g?.value !== '' && !isNaN(Number(g.value))) {
        const num = Number(g.value);
        filledCount++;
        sumGrades += num;
        if (num >= 10) passedCount++;
      }
    });

    const avg = filledCount > 0 ? (sumGrades / filledCount).toFixed(2) : '-';
    const passRate = filledCount > 0 ? Math.round((passedCount / filledCount) * 100) : 0;
    const progressPercent = studentsData.length > 0 ? Math.round(((filledCount + absentCount) / studentsData.length) * 100) : 0;

    return { filledCount, absentCount, avg, passRate, progressPercent };
  }, [studentsData, grades]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return studentsData.filter((student: any) => {
      // Search text filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
        const apogee = String(student.apogee || student.student_number || '').toLowerCase();
        const cne = String(student.cne || student.cin || '').toLowerCase();
        if (!fullName.includes(term) && !apogee.includes(term) && !cne.includes(term)) {
          return false;
        }
      }

      // Filter Mode
      const g = grades[student.student_id];
      if (filterMode === 'absent') return g?.absent;
      if (filterMode === 'pending') return !g?.absent && (!g?.value || g.value.trim() === '');
      if (filterMode === 'graded') return !g?.absent && g?.value && g.value.trim() !== '';

      return true;
    });
  }, [studentsData, searchTerm, filterMode, grades]);

  const handleInputChange = (id: number, field: 'value' | 'absent', val: string | boolean) => {
    setGrades(prev => {
      const studentData = prev[id] || { value: '', absent: false };
      if (field === 'absent') {
        return { ...prev, [id]: { ...studentData, absent: val as boolean, value: val ? '' : studentData.value } };
      } else {
        const cleanValue = (val as string).replace(',', '.');
        return { ...prev, [id]: { ...studentData, value: cleanValue } };
      }
    });
  };

  const handleInputChange2 = (id: number, field: 'value' | 'absent', val: string | boolean) => {
    setGrades2(prev => {
      const studentData = prev[id] || { value: '', absent: false };
      if (field === 'absent') {
        return { ...prev, [id]: { ...studentData, absent: val as boolean, value: val ? '' : studentData.value } };
      } else {
        const cleanValue = (val as string).replace(',', '.');
        return { ...prev, [id]: { ...studentData, value: cleanValue } };
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`grade-input-${index + 1}`);
      nextInput?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`grade-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleExportExcel = async () => {
    try {
      const assessmentTypeName = selectedAssessment ? selectedAssessment.type : 'Saisie';
      const moduleCode = moduleDetails?.code || `MOD_${moduleId}`;
      const rawModuleName = moduleDetails?.name || 'Module';
      const cleanModuleName = rawModuleName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');

      const fileName = `Canevas_Notes_${moduleCode}_${cleanModuleName}_${assessmentTypeName}.xlsx`;

      const response = await api.get(`/modules/${moduleId}/export-grades`, {
        params: {
          group_id: viewAllGroups ? 'all' : searchParams.get('group_id'),
          assessment_id: selectedAssessmentId || undefined
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(isRtl ? `تم تحميل كشف النقاط: ${fileName}` : `Canevas Excel (${fileName}) téléchargé avec succès !`);
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء تحميل الملف' : 'Erreur lors du téléchargement du canevas Excel.');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (selectedAssessmentId) {
      formData.append('assessment_id', String(selectedAssessmentId));
    }

    const toastId = toast.loading(isRtl ? 'جاري استيراد النقاط...' : 'Importation des notes en cours...');
    try {
      const res = await api.post(`/modules/${moduleId}/import-grades`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.dismiss(toastId);
      toast.success(res.data.message || "Notes importées avec succès !");
      if (res.data.warnings && res.data.warnings.length > 0) {
        if (res.data.warnings.length <= 3) {
          res.data.warnings.forEach((warn: string) => {
            toast.warning(warn, { duration: 5000 });
          });
        } else {
          toast.warning(isRtl ? `${res.data.warnings.length} تنبيهات أثناء الاستيراد` : `${res.data.warnings.length} avertissements lors de l'import (ex: ${res.data.warnings[0]})`, { duration: 6000 });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['module-pv', moduleId] });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Erreur lors de l'importation du fichier Excel.");
      if (err.response?.data?.details) {
        toast.error(err.response.data.details, { duration: 6000 });
      }
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Mutation to save grades
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post(`/assessments/${selectedAssessmentId}/grades`, payload);
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم حفظ النقاط بنجاح' : 'Notes enregistrées avec succès dans Apogée !');
      queryClient.invalidateQueries({ queryKey: ['grades', selectedAssessmentId] });
      queryClient.invalidateQueries({ queryKey: ['user-action-center'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Erreur lors de la sauvegarde'));
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedAssessmentId) return;

    if (isDoubleSaisie) {
      const hasDifferences = Object.keys(grades).some(studentIdStr => {
        const studentId = parseInt(studentIdStr, 10);
        const g1 = grades[studentId];
        const g2 = grades2[studentId];
        return g1?.value !== g2?.value || g1?.absent !== g2?.absent;
      });

      if (hasDifferences) {
        toast.error(isRtl ? 'يرجى تصحيح الفروقات بين السطرين قبل الحفظ' : "Veuillez résoudre les écarts de Saisie 1 et Saisie 2 avant d'enregistrer.");
        return;
      }
    }

    const payload = {
      grades: Object.keys(grades).map(studentIdStr => {
        const studentId = parseInt(studentIdStr, 10);
        const data = grades[studentId];
        return {
          student_id: studentId,
          version: studentsData.find((student: any) => Number(student.student_id) === studentId)?.version ?? 0,
          value: data.value === '' ? null : parseFloat(data.value),
          absent: data.absent
        };
      })
    };

    saveMutation.mutate(payload);
  };

  const handleUnlockPv = async () => {
    if (!window.confirm(isRtl ? 'هل تريد فتح المحضر وإعادة تفعيل إدخال النقط؟' : 'Voulez-vous déverrouiller le PV et réautoriser la saisie des notes ?')) {
      return;
    }
    try {
      const reason = window.prompt('Motif de réouverture du PV (10 caractères minimum) :');
      if (!reason || reason.trim().length < 10) { toast.error('Un motif précis est obligatoire.'); return; }
      const res = await api.post(`/modules/${moduleId}/unlock-pv`, { session: 'normale', reason: reason.trim() });
      toast.success(res.data.message || 'PV déverrouillé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['module-pv', moduleId] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du déverrouillage du PV');
    }
  };

  const addModalityRow = () => {
    setModalityAssessments(prev => [...prev, { id: null, type: 'CC', weight: 0 }]);
  };

  const removeModalityRow = (index: number) => {
    setModalityAssessments(prev => prev.filter((_, i) => i !== index));
  };

  const updateModalityField = (index: number, field: 'type' | 'weight', value: any) => {
    setModalityAssessments(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSaveModality = async () => {
    const ordinaryAssessments = modalityAssessments.filter(a => a.type !== 'Rattrapage');
    const sum = ordinaryAssessments.reduce((acc, curr) => acc + curr.weight, 0);

    if (ordinaryAssessments.length > 0 && Math.abs(sum - 100) > 0.01) {
      toast.error(
        isRtl
          ? 'يجب أن يكون مجموع أوزان الدورة العادية (CC + Examen) يساوي 100%'
          : 'La somme des poids de la session ordinaire (CC + Examen) doit être égale à 100%'
      );
      return;
    }

    try {
      const response = await api.post(`/modules/${moduleId}/assessments`, {
        assessments: modalityAssessments
      });
      toast.success(isRtl ? 'تم حفظ نظام التقييم بنجاح' : 'Modalités d\'évaluation enregistrées avec succès');
      queryClient.invalidateQueries({ queryKey: ['assessments', moduleId] });
      setShowModalityModal(false);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedAssessmentId(response.data.data[0].id);
      } else {
        setSelectedAssessmentId(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la configuration');
    }
  };

  if (!moduleId) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Erreur : identifiant de module (module_id) manquant dans l'adresse.
      </div>
    );
  }

  const moduleTitle = moduleDetails?.name || 'Statistiques et Probabilités';
  const moduleCode = moduleDetails?.code || 'TC-S2-M01';
  const filiereName = moduleDetails?.filiere?.name || moduleDetails?.filiere_name || 'Tronc Commun';
  const semesterLabel = semesterParam ? `Semestre ${semesterParam}` : 'Semestre 2';
  const groupLabel = currentGroupId && currentGroupId !== 'null' ? `Groupe ${currentGroupId}` : 'Tous les groupes';

  return (
    <div className="space-y-6 font-sans text-foreground pb-12 max-w-[1600px] mx-auto p-2">

      {/* ── Breadcrumb Navigation ── */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Link to="/dashboard" className="hover:text-[#1a3673] dark:hover:text-amber-300 transition-colors">
          Portail Enseignant
        </Link>
        <span>/</span>
        <Link to="/admin/grades" className="hover:text-[#1a3673] dark:hover:text-amber-300 transition-colors">
          Notes & Évaluations
        </Link>
        <span>/</span>
        <span className="text-[#1a3673] dark:text-amber-300 font-bold">
          Saisie Apogée
        </span>
      </nav>

      {/* ── Executive Header: Module Context & Actions ── */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-xs border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#1a3673]/10 dark:bg-blue-950 text-[#1a3673] dark:text-blue-300 border border-[#1a3673]/20">
                {moduleCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                {filiereName} · {semesterLabel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                {groupLabel}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a3673] dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#1a3673] dark:text-amber-300 shrink-0" />
              <span>{moduleTitle}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Grille officielle de saisie des notes d'évaluation continue (CC) et d'examen pour le relevé Apogée.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAuditLogsDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground transition-all cursor-pointer border border-border"
              title="Consulter l'historique de traçabilité"
            >
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Historique Audit</span>
            </button>

            <Link
              to={`/admin/grades/pv?filiere_id=${filiereId || ''}&semester=${semesterParam || ''}&module_id=${moduleId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-bold text-[#1a3673] dark:text-blue-300 transition-all cursor-pointer border border-border"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Consulter le PV</span>
            </Link>

            <Link
              to="/admin/grades"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card hover:bg-muted/50 text-xs font-bold text-muted-foreground transition-all cursor-pointer border border-border"
            >
              <ArrowLeft className={cn("w-3.5 h-3.5", isRtl && "rotate-180")} />
              <span>Retour</span>
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saveMutation.isPending || isAssessmentLocked || !selectedAssessmentId}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all cursor-pointer",
                isAssessmentLocked || !selectedAssessmentId
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-emerald-950/20"
              )}
            >
              {saveMutation.isPending ? (
                <Spinner className="w-3.5 h-3.5 text-white" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── PV Locked Alert Banner (If Applicable) ── */}
      {isModulePvSigned && (
        <div className={cn(
          "rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in",
          isExamAssessment
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200"
            : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
              isExamAssessment ? "bg-rose-500 text-white" : "bg-blue-600 text-white"
            )}>
              {isExamAssessment ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm">
                {isExamAssessment
                  ? "Procès-Verbal d'Examen Scellé & Clôturé Électroniquement"
                  : "Procès-Verbal Scellé — Saisie des Contrôles Continus Toujours Ouverte"}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                {isExamAssessment ? (
                  <>Signé et scellé par <strong>{signatureInfo?.signed_by || "l'Enseignant Responsable"}</strong>. La saisie de l'examen final est verrouillée.</>
                ) : (
                  <>PV d'examen final scellé. <strong>La saisie du CC ({selectedAssessment?.type || 'CC'}) reste pleinement ouverte et modifiable</strong>.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {isModulePvSigned && (
              <button
                type="button"
                onClick={handleUnlockPv}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 shadow-sm border border-border hover:bg-muted text-foreground transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-600" />
                <span>Déverrouiller PV</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Evaluation Selector & Controls Dock ── */}
      <div className="bg-card rounded-2xl p-5 shadow-xs border border-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Evaluations Switcher Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Modalités d'Évaluation du Module</span>
            </label>

            {isLoadingAssessments ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Spinner className="w-4 h-4 text-primary" />
                <span>Chargement des évaluations...</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {assessmentsData?.map((a: any) => {
                  const isActive = selectedAssessmentId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAssessmentId(a.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border",
                        isActive
                          ? "bg-[#1a3673] text-white border-[#1a3673] shadow-md shadow-blue-950/20 scale-102"
                          : "bg-muted/60 hover:bg-muted text-foreground border-border"
                      )}
                    >
                      <span>{a.type}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] font-mono",
                        isActive ? "bg-white/20 text-amber-300" : "bg-card text-muted-foreground border border-border"
                      )}>
                        {a.weight}%
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowModalityModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/25 text-xs font-bold transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Configurer</span>
                </button>
              </div>
            )}
          </div>

          {/* Scope & Mode Toggles */}
          <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
            {/* Scope Toggle */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Périmètre
              </span>
              <div className="inline-flex rounded-xl bg-muted/70 p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setViewAllGroups(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    !viewAllGroups ? "bg-card text-[#1a3673] dark:text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Par Groupe
                </button>
                <button
                  type="button"
                  onClick={() => setViewAllGroups(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    viewAllGroups ? "bg-card text-[#1a3673] dark:text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Module Entier
                </button>
              </div>
            </div>

            {/* Double Saisie Mode */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Contrôle Saisie
              </span>
              <button
                type="button"
                onClick={() => setIsDoubleSaisie(!isDoubleSaisie)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
                  isDoubleSaisie
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 shadow-2xs"
                    : "bg-muted/70 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>{isDoubleSaisie ? 'Double Saisie Active' : 'Mode Double Saisie'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Active Evaluation Hero Banner with Live Analytics ── */}
      {!selectedAssessmentId ? (
        <div className="py-16 text-center rounded-2xl bg-muted/40 border border-dashed border-border space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-foreground">Sélectionnez une évaluation ci-dessus pour ouvrir la grille de notes.</p>
          <p className="text-xs text-muted-foreground">Vous pouvez aussi configurer les pondérations (CC1, CC2, Examen) via le bouton Configurer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a3673] via-[#092868] to-[#041233] text-white p-5 sm:p-7 shadow-sm border border-white/10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">

              {/* Identity & Coefficients */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-amber-300 border border-white/15 backdrop-blur-md">
                    Session Ordinaire
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/20">
                    Poids : {selectedAssessment?.weight}%
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{selectedAssessment?.type}</span>
                </h2>
                <p className="text-xs text-blue-200/90 font-medium">
                  Grille d'évaluation numérique · Synchronisation automatique avec les PVs délibératoires.
                </p>
              </div>

              {/* 4 Live Metrics in Hero Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="text-center px-2">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {studentsData.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80 mt-0.5">
                    Étudiants
                  </div>
                </div>

                <div className="text-center px-2 border-l border-white/10">
                  <div className="text-xl sm:text-2xl font-bold text-amber-300">
                    {statsMetrics.filledCount} / {studentsData.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80 mt-0.5">
                    Notes Saisies
                  </div>
                </div>

                <div className="text-center px-2 border-l border-white/10">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-300">
                    {statsMetrics.avg} <span className="text-xs font-normal opacity-70">/20</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80 mt-0.5">
                    Moyenne
                  </div>
                </div>

                <div className="text-center px-2 border-l border-white/10">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {statsMetrics.absentCount}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80 mt-0.5">
                    Absents
                  </div>
                </div>
              </div>

              {/* Excel Import / Export Quick CTAs */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-2 border border-white/15"
                  title="Télécharger le canevas Excel vierge ou pré-rempli"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Canevas Excel</span>
                </button>

                <label className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md",
                  isAssessmentLocked
                    ? "bg-white/30 text-white/50 cursor-not-allowed"
                    : "bg-white text-[#1a3673] hover:bg-slate-100 hover:scale-102"
                )}>
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Importer Excel</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    disabled={isAssessmentLocked}
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          </div>

          {/* ── Search & Filter Controls ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, prénom, code Apogée..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-[#1a3673]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                  filterMode === 'all' ? "bg-[#1a3673] text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Tous ({studentsData.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('pending')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                  filterMode === 'pending' ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                À saisir ({studentsData.length - (statsMetrics.filledCount + statsMetrics.absentCount)})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('graded')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                  filterMode === 'graded' ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Saisis ({statsMetrics.filledCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('absent')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                  filterMode === 'absent' ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Absents ({statsMetrics.absentCount})
              </button>
            </div>
          </div>

          {/* ── Main Grades Table ── */}
          {isLoadingStudents ? (
            <div className="py-20 text-center rounded-2xl bg-card border border-border">
              <Spinner className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs font-bold text-muted-foreground">Chargement des étudiants et des notes...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/70 text-muted-foreground border-b border-border uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        <th className="py-3.5 px-4">Étudiant(e)</th>
                        {isDoubleSaisie ? (
                          <>
                            <th className="py-3.5 px-4 text-center w-32">Note 1 (/20)</th>
                            <th className="py-3.5 px-4 text-center w-28">Absent 1</th>
                            <th className="py-3.5 px-4 text-center w-32">Note 2 (/20)</th>
                            <th className="py-3.5 px-4 text-center w-28">Absent 2</th>
                            <th className="py-3.5 px-4 text-center w-28">Conformité</th>
                          </>
                        ) : (
                          <>
                            <th className="py-3.5 px-4 text-center w-40">Note sur 20</th>
                            <th className="py-3.5 px-4 text-center w-32">Présence / Absence</th>
                            <th className="py-3.5 px-4 text-center w-28">Statut</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={isDoubleSaisie ? 7 : 5} className="py-12 text-center text-muted-foreground text-xs">
                            Aucun étudiant ne correspond aux critères de filtre.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student: any, index: number) => {
                          const s1 = grades[student.student_id];
                          const s2 = grades2[student.student_id];
                          const isFraud = student.is_fraud || student.has_exam_fraud;
                          const hasConflict = isDoubleSaisie && (s1?.value !== s2?.value || s1?.absent !== s2?.absent);

                          const initials = ((student.first_name?.[0] || '') + (student.last_name?.[0] || '')).toUpperCase() || 'ET';
                          const gradeValue = s1?.value ?? '';
                          const isAbsent = s1?.absent ?? false;
                          const numGrade = gradeValue !== '' ? Number(gradeValue) : null;

                          return (
                            <tr
                              key={student.student_id}
                              className={cn(
                                "hover:bg-muted/40 transition-colors",
                                hasConflict && "bg-rose-50/60 dark:bg-rose-950/20"
                              )}
                            >
                              {/* Row index */}
                              <td className="py-3 px-4 text-center font-mono text-muted-foreground font-bold">
                                {index + 1}
                              </td>

                              {/* Student Info */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3673] to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-sm text-foreground">
                                      {student.last_name?.toUpperCase()} {student.first_name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-muted-foreground">
                                      <span>Apogée : <strong>{student.apogee || student.student_number || 'N/A'}</strong></span>
                                      {student.cne && <span>· CNE : {student.cne}</span>}
                                    </div>
                                    {isFraud && (
                                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                        <span>Fraude constatée au PV</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Simple or Double Entry Mode */}
                              {isDoubleSaisie ? (
                                <>
                                  <td className="py-3 px-4 text-center">
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="0"
                                      max="20"
                                      value={(isExamAssessment && isFraud) ? '0' : (grades[student.student_id]?.value ?? '')}
                                      disabled={isAssessmentLocked || (isExamAssessment && isFraud) || grades[student.student_id]?.absent}
                                      onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                                      className="w-28 py-1.5 px-2 text-center font-mono font-bold text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-[#1a3673]"
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={(isExamAssessment && isFraud) ? false : (grades[student.student_id]?.absent ?? false)}
                                      disabled={isAssessmentLocked || (isExamAssessment && isFraud)}
                                      onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                                      className="w-4 h-4 rounded text-[#1a3673]"
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="0"
                                      max="20"
                                      value={(isExamAssessment && isFraud) ? '0' : (grades2[student.student_id]?.value ?? '')}
                                      disabled={isAssessmentLocked || (isExamAssessment && isFraud) || grades2[student.student_id]?.absent}
                                      onChange={(e) => handleInputChange2(student.student_id, 'value', e.target.value)}
                                      className="w-28 py-1.5 px-2 text-center font-mono font-bold text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-[#1a3673]"
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={(isExamAssessment && isFraud) ? false : (grades2[student.student_id]?.absent ?? false)}
                                      disabled={isAssessmentLocked || (isExamAssessment && isFraud)}
                                      onChange={(e) => handleInputChange2(student.student_id, 'absent', e.target.checked)}
                                      className="w-4 h-4 rounded text-[#1a3673]"
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {hasConflict ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                        Écart
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                        Conforme
                                      </span>
                                    )}
                                  </td>
                                </>
                              ) : (
                                <>
                                  {/* Single Entry: Note Input */}
                                  <td className="py-3 px-4 text-center">
                                    <div className="inline-block relative">
                                      <input
                                        id={`grade-input-${index}`}
                                        type="number"
                                        step="0.25"
                                        min="0"
                                        max="20"
                                        placeholder="— / 20"
                                        value={(isExamAssessment && isFraud) ? '0' : gradeValue}
                                        disabled={isAssessmentLocked || (isExamAssessment && isFraud) || isAbsent}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                                        className={cn(
                                          "w-32 py-2 px-3 text-center font-mono font-bold text-sm rounded-xl border transition-all focus:outline-hidden focus:ring-2 focus:ring-[#1a3673]",
                                          isAbsent && "bg-muted/60 text-muted-foreground line-through border-dashed",
                                          !isAbsent && numGrade !== null && numGrade >= 10 && "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
                                          !isAbsent && numGrade !== null && numGrade < 10 && "bg-amber-50/40 dark:bg-amber-950/20 border-amber-500/40 text-amber-700 dark:text-amber-300",
                                          !isAbsent && numGrade === null && "bg-background border-border"
                                        )}
                                      />
                                    </div>
                                  </td>

                                  {/* Absent Toggle Button */}
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      disabled={isAssessmentLocked || (isExamAssessment && isFraud)}
                                      onClick={() => handleInputChange(student.student_id, 'absent', !isAbsent)}
                                      className={cn(
                                        "px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border",
                                        isAbsent
                                          ? "bg-rose-500 text-white border-rose-600 shadow-2xs"
                                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                      )}
                                    >
                                      {isAbsent ? 'Absent(e)' : 'Présent(e)'}
                                    </button>
                                  </td>

                                  {/* Status Pill */}
                                  <td className="py-3 px-4 text-center">
                                    {isAbsent ? (
                                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                        ABS
                                      </span>
                                    ) : numGrade !== null ? (
                                      numGrade >= 10 ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                          Validé
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                          Non Validé
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-muted-foreground font-mono text-xs">—</span>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Action & Summary Footer (In-flow, non-fixed) ── */}
              <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-foreground">
                      {statsMetrics.filledCount + statsMetrics.absentCount} / {studentsData.length} étudiants renseignés ({statsMetrics.progressPercent}%)
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground pl-4 border-l border-border">
                    <Calculator className="w-3.5 h-3.5 text-primary" />
                    <span>Moyenne calculée : <strong className="text-foreground">{statsMetrics.avg} / 20</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <Link
                    to={`/admin/grades/pv?filiere_id=${filiereId || ''}&semester=${semesterParam || ''}&module_id=${moduleId}`}
                    className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground transition-all cursor-pointer border border-border"
                  >
                    Consulter le PV
                  </Link>

                  <button
                    type="submit"
                    disabled={saveMutation.isPending || isAssessmentLocked}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer",
                      isAssessmentLocked
                        ? "bg-slate-400 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-emerald-950/20 hover:scale-102"
                    )}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Spinner className="w-4 h-4 text-white" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{isAssessmentLocked ? 'Examen Clôturé & Verrouillé' : 'Enregistrer les Notes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Modal: Configuration des Modalités d'Évaluation ── */}
      {showModalityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-border space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Configuration des Modalités d'Évaluation</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Définissez la répartition des épreuves. La somme des coefficients de la session ordinaire doit égaler 100%.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalityModal(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {modalityAssessments.map((a, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type d'Épreuve</label>
                    <select
                      value={a.type}
                      onChange={(e) => updateModalityField(index, 'type', e.target.value)}
                      className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-background border border-border text-foreground"
                    >
                      <option value="CC">Contrôle Continu (CC)</option>
                      <option value="CC1">CC1</option>
                      <option value="CC2">CC2</option>
                      <option value="Exam">Examen Final (EF)</option>
                      <option value="TP">Travaux Pratiques (TP)</option>
                      <option value="Oral">Épreuve Orale</option>
                      <option value="Projet">Projet & Mémoire</option>
                      <option value="Rattrapage">Session de Rattrapage</option>
                    </select>
                  </div>

                  <div className="w-28 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Poids (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={a.weight}
                      onChange={(e) => updateModalityField(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full py-1.5 px-2.5 text-center rounded-lg text-xs font-mono font-bold bg-background border border-border text-foreground"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeModalityRow(index)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer self-end mb-0.5"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {modalityAssessments.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Aucune évaluation configurée. Cliquez sur "Ajouter une épreuve".
                </div>
              )}
            </div>

            {/* Sum Indicator */}
            {(() => {
              const ordinary = modalityAssessments.filter(a => a.type !== 'Rattrapage');
              const sum = ordinary.reduce((acc, curr) => acc + curr.weight, 0);
              const isExact = Math.abs(sum - 100) <= 0.01;
              return (
                <div className={cn(
                  "p-3 rounded-xl border flex items-center justify-between text-xs font-bold",
                  isExact ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300"
                )}>
                  <span>Somme Session Ordinaire (CC + Examen) :</span>
                  <span className="font-mono text-sm">{sum} % {isExact ? '✓' : '(Doit être 100%)'}</span>
                </div>
              );
            })()}

            {/* Plafond Rattrapage */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-foreground">Plafond de Note en Rattrapage</h4>
                <p className="text-[11px] text-muted-foreground">Note maximale après délibération de rattrapage (Article CNPN)</p>
              </div>
              <select
                value={rattrapageCap}
                onChange={(e) => setRattrapageCap(Number(e.target.value))}
                className="py-1.5 px-3 rounded-lg text-xs font-bold bg-background border border-border text-foreground shrink-0"
              >
                <option value={10}>10.00 / 20</option>
                <option value={12}>12.00 / 20 (Règle LMD ENCG Fès)</option>
                <option value={14}>14.00 / 20</option>
                <option value={20}>Sans Plafond (20/20)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={addModalityRow}
                className="rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une Épreuve</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModalityModal(false)}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveModality}
                  className="rounded-xl text-xs font-bold bg-[#1a3673] hover:bg-[#0c2459] text-white cursor-pointer"
                >
                  Enregistrer Modalités
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer: Historique d'Audit des Notes ── */}
      {showAuditLogsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <span>Historique d'Audit & Traçabilité</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Journal inaltérable des saisies et modifications de notes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditLogsDrawer(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {isLoadingLogs ? (
                <div className="py-12 text-center">
                  <Spinner className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Chargement du journal d'audit...</p>
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="relative pl-7 text-xs space-y-1">
                      <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#1a3673] border-2 border-white dark:border-slate-900" />
                      <p className="font-bold text-foreground">{log.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        <span>{log.causer_name || 'Utilisateur'}</span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Aucun historique d'audit enregistré pour ce module.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
