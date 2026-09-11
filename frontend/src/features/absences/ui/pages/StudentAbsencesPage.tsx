import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  UploadCloud, 
  Search, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  Building2, 
  User, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useStudentAbsences, useJustifyAbsence } from '../../api/absencesApi';
import { offlineJustificatifStore } from '@shared/lib/offlineJustificatifStore';
import { cn } from '@shared/lib/utils';
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

function formatSessionDate(dateStr?: string | null): string {
  if (!dateStr) return 'Date non renseignée';
  try {
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    const fallbackDate = new Date(dateStr);
    return isNaN(fallbackDate.getTime())
      ? 'Date non renseignée'
      : fallbackDate.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
  } catch {
    return 'Date non renseignée';
  }
}

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

function getSession(record: any) {
  return record.attendanceSession || record.attendance_session || record.session || {};
}

function getJustification(record: any) {
  return record.absenceJustification || record.absence_justification || null;
}

export default function StudentAbsencesPage() {
  const { data: rawAbsences, isLoading, refetch } = useStudentAbsences();
  const { mutate: justifyAbsence, isPending: isSubmittingJustification } = useJustifyAbsence();

  // Selected record for justification modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [reason, setReason] = useState('medical');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [regulationsModalOpen, setRegulationsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'absent' | 'present' | 'late'>('all');
  const [justificationFilter, setJustificationFilter] = useState<'all' | 'unjustified' | 'pending' | 'justified'>('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');

  const absencesList: any[] = useMemo(() => {
    if (!rawAbsences) return [];
    if (Array.isArray(rawAbsences)) return rawAbsences;
    if (Array.isArray(rawAbsences.data)) return rawAbsences.data;
    if (Array.isArray(rawAbsences.absences)) return rawAbsences.absences;
    return [];
  }, [rawAbsences]);

  // Extract distinct modules for filter dropdown
  const modulesList = useMemo(() => {
    const set = new Map<string, string>();
    absencesList.forEach((record: any) => {
      const session = getSession(record);
      const modName = cleanMojibake(session.module?.name || session.module_name);
      const modId = String(session.module_id || session.module?.id || modName);
      if (modName && !set.has(modId)) {
        set.set(modId, modName);
      }
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [absencesList]);

  const studentMeta = rawAbsences?.student_meta || null;
  const backendStats = rawAbsences?.stats || null;

  // Statistics calculation directly from live backend database data
  const stats = useMemo(() => {
    const totalSessions = typeof backendStats?.total_sessions === 'number' ? backendStats.total_sessions : absencesList.length;
    const presentCount = typeof backendStats?.present_count === 'number' ? backendStats.present_count : absencesList.filter((a: any) => a.status === 'present').length;
    const lateCount = typeof backendStats?.late_count === 'number' ? backendStats.late_count : absencesList.filter((a: any) => a.status === 'late').length;
    const absentRecords = absencesList.filter((a: any) => a.status === 'absent');
    const absentCount = typeof backendStats?.absent_count === 'number' ? backendStats.absent_count : absentRecords.length;

    const justifiedCount = typeof backendStats?.justified_count === 'number' ? backendStats.justified_count : absentRecords.filter((a: any) => {
      const j = getJustification(a);
      return a.is_justified || (j && j.status === 'approved');
    }).length;

    const pendingCount = typeof backendStats?.pending_count === 'number' ? backendStats.pending_count : absentRecords.filter((a: any) => {
      const j = getJustification(a);
      return !a.is_justified && j && j.status === 'pending';
    }).length;

    const unjustifiedCount = typeof backendStats?.unjustified_count === 'number' ? backendStats.unjustified_count : Math.max(0, absentCount - justifiedCount - pendingCount);

    const attendanceRate = typeof backendStats?.attendance_rate === 'number'
      ? backendStats.attendance_rate
      : (totalSessions > 0 ? Number((((presentCount + (lateCount * 0.5)) / totalSessions) * 100).toFixed(1)) : 100.0);

    // Check modules with highest unjustified absence count
    const moduleAbsenceCount: Record<string, { name: string; count: number }> = {};
    absentRecords.forEach((a: any) => {
      const j = getJustification(a);
      const isUnjust = !a.is_justified && (!j || j.status !== 'approved');
      if (isUnjust) {
        const session = getSession(a);
        const name = cleanMojibake(session.module?.name || session.module_name || 'Module');
        if (!moduleAbsenceCount[name]) moduleAbsenceCount[name] = { name, count: 0 };
        moduleAbsenceCount[name].count++;
      }
    });

    const maxAbsencesInSingleModule = Math.max(0, ...Object.values(moduleAbsenceCount).map(m => m.count));
    const highestRiskModule = Object.values(moduleAbsenceCount).find(m => m.count === maxAbsencesInSingleModule);

    return {
      totalSessions,
      presentCount,
      lateCount,
      absentCount,
      justifiedCount,
      pendingCount,
      unjustifiedCount,
      attendanceRate,
      maxAbsencesInSingleModule,
      highestRiskModule,
    };
  }, [absencesList, backendStats]);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return absencesList.filter((record: any) => {
      const session = getSession(record);
      const justif = getJustification(record);
      const moduleName = cleanMojibake(session.module?.name || session.module_name || '').toLowerCase();
      const profName = cleanMojibake(session.professor?.user?.name || session.professor?.name || '').toLowerCase();

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!moduleName.includes(q) && !profName.includes(q)) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false;
      }

      // Module filter
      if (selectedModuleFilter !== 'all') {
        const modId = String(session.module_id || session.module?.id || '');
        const modName = cleanMojibake(session.module?.name || session.module_name || '');
        if (modId !== selectedModuleFilter && modName !== selectedModuleFilter) {
          return false;
        }
      }

      // Justification filter
      if (justificationFilter === 'justified') {
        const isJ = record.is_justified || (justif && justif.status === 'approved');
        if (!isJ) return false;
      } else if (justificationFilter === 'pending') {
        const isP = !record.is_justified && justif && justif.status === 'pending';
        if (!isP) return false;
      } else if (justificationFilter === 'unjustified') {
        const isU = record.status === 'absent' && !record.is_justified && (!justif || justif.status === 'rejected');
        if (!isU) return false;
      }

      return true;
    });
  }, [absencesList, searchQuery, statusFilter, selectedModuleFilter, justificationFilter]);

  const handleJustifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !file) {
      toast.error('Veuillez joindre une pièce justificative (PDF ou image).');
      return;
    }

    const formData = new FormData();
    formData.append('reason', reason);
    formData.append('description', description);
    formData.append('document', file);

    const attendanceId = selectedRecord.id;

    if (!navigator.onLine) {
      void offlineJustificatifStore.saveOffline({
        attendanceId,
        reason,
        description,
        fileName: file.name,
        file,
      });
      toast.info('Mode hors-ligne : justificatif enregistré localement et synchronisé dès reconnexion.');
      setSelectedRecord(null);
      setFile(null);
      setDescription('');
      return;
    }

    const toastId = toast.loading('Transmission du justificatif au service de scolarité...');

    justifyAbsence(
      { attendanceId, formData },
      {
        onSuccess: () => {
          toast.success('Justificatif transmis avec succès ! En cours d\'examen par la scolarité.', { id: toastId });
          setSelectedRecord(null);
          setFile(null);
          setDescription('');
          refetch();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Erreur lors de la soumission du justificatif.';
          toast.error(msg, { id: toastId });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#001A4B]/20 border-t-[#001A4B] rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chargement de votre relevé d'assiduité...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#001A4B] dark:text-white tracking-tight flex items-center gap-2.5">
              <Calendar className="w-7 h-7 text-blue-600" /> Suivi d'Assiduité & Justificatifs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Régime Pédagogique ENCG Fès • Présence obligatoire en CM & TD • Seuil d'exclusion fixé à 3 absences non justifiées
          </p>
        </div>

        {/* Regulations button */}
        <button
          onClick={() => setRegulationsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-black text-slate-700 dark:text-slate-300 transition-all cursor-pointer self-start md:self-auto"
        >
          <Info className="w-4 h-4 text-blue-600" />
          <span>Règlement d'Assiduité (48h)</span>
        </button>
      </div>

      {/* ── Executive Hero Banner (Royal Navy #001A4B) ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#04122d] rounded-[2.5rem] p-6 sm:p-9 text-white shadow-2xl border border-white/10 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 backdrop-blur-md text-amber-300 border border-white/10 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" /> Assiduité Académique Certifiée
            </span>
            {studentMeta?.academic_year && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Année {studentMeta.academic_year}
              </span>
            )}
            {studentMeta?.filiere && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/10 text-white border border-white/15">
                {studentMeta.filiere}{studentMeta.group ? ` • ${studentMeta.group}` : ''}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Délai Dépôt : 48h
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Registre Officiel des Présences
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed mt-1.5">
              Toute absence doit impérativement être justifiée par pièce médicale ou administrative officielle auprès du guichet de scolarité dans un délai maximal de 48 heures suivant la reprise des cours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => {
                const firstAbsent = absencesList.find((a: any) => a.status === 'absent' && !a.is_justified && (!getJustification(a) || getJustification(a)?.status === 'rejected'));
                if (firstAbsent) {
                  setSelectedRecord(firstAbsent);
                } else {
                  toast.info('Toutes vos absences sont déjà justifiées ou vous n\'avez aucune absence à justifier.');
                }
              }}
              className="bg-amber-400 hover:bg-amber-300 text-[#001A4B] px-4 py-2.5 rounded-xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <UploadCloud className="w-4 h-4 text-[#001A4B]" /> Déposer un Justificatif
            </button>
            <button
              onClick={() => setRegulationsModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-300" /> Charte des Examens & RPN
            </button>
          </div>
        </div>

        {/* Hero Right Widget: Attendance Gauge */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white/20 text-center sm:text-right shrink-0 min-w-[280px]">
          <div className="flex items-center justify-between sm:justify-end gap-2 mb-1">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
              Taux de Présence Global
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white border border-white/10">
              Assiduité
            </span>
          </div>

          <div className="flex items-baseline justify-center sm:justify-end gap-1.5 my-1">
            <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
              {stats.attendanceRate}
            </span>
            <span className="text-xl font-black text-blue-200">%</span>
          </div>

          <div className={cn(
            "mt-3 inline-flex items-center gap-2 text-xs font-black px-3.5 py-1.5 rounded-full border shadow-sm",
            stats.attendanceRate >= 85
              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
              : stats.attendanceRate >= 70
                ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                : "bg-rose-500/20 border-rose-400/40 text-rose-300"
          )}>
            {stats.attendanceRate >= 85 ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
            <span>
              {stats.attendanceRate >= 85
                ? 'ASSIDUITÉ RÉGULIÈRE'
                : stats.attendanceRate >= 70
                  ? 'ATTENTION : VIGILANCE REQUISE'
                  : 'SEUIL CRITIQUE DÉPASSÉ'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200">
            <span>Bilan Séances :</span>
            <span className="font-black text-white">{stats.presentCount} Présent(s) • {stats.absentCount} Absent(s)</span>
          </div>
        </div>
      </div>

      {/* ── 4 Executive KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Taux d'Assiduité */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Taux d'Assiduité</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#001A4B] dark:text-white">
              {stats.attendanceRate}%
            </span>
            <span className="text-xs font-bold text-slate-400">global</span>
          </div>
          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  stats.attendanceRate >= 85 ? "bg-emerald-500" : stats.attendanceRate >= 70 ? "bg-amber-500" : "bg-rose-500"
                )}
                style={{ width: `${Math.min(100, stats.attendanceRate)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>Régularité</span>
              <span>{stats.presentCount}/{stats.totalSessions} séances</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Séances Enregistrées */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Séances</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.totalSessions}
            </span>
            <span className="text-xs font-bold text-slate-400">séances pointées</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 font-bold">Retards constatés :</span>
            <span className={cn("font-black px-2 py-0.5 rounded-full text-[10px]", stats.lateCount > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600")}>
              {stats.lateCount} retard(s)
            </span>
          </div>
        </div>

        {/* Card 3: Absences & Justificatifs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Statut Justifications</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.absentCount}
            </span>
            <span className="text-xs font-bold text-slate-400">absence(s) au total</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-emerald-600">{stats.justifiedCount} Justifiée(s)</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-amber-600">{stats.pendingCount} En attente</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-rose-600">{stats.unjustifiedCount} Non justifiée(s)</span>
          </div>
        </div>

        {/* Card 4: Alerte Pédagogique (Règle des 3 absences) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Règle des 3 Absences</span>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              stats.maxAbsencesInSingleModule >= 3 
                ? "bg-rose-50 text-rose-600"
                : stats.maxAbsencesInSingleModule === 2
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
            )}>
              {stats.maxAbsencesInSingleModule >= 3 ? (
                <AlertCircle className="w-4 h-4" />
              ) : stats.maxAbsencesInSingleModule === 2 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
            <span className={cn(
              "text-base font-black block tracking-tight",
              stats.maxAbsencesInSingleModule >= 3 
                ? "text-rose-600"
                : stats.maxAbsencesInSingleModule === 2
                  ? "text-amber-600"
                  : "text-emerald-600"
            )}>
              {stats.maxAbsencesInSingleModule >= 3
                ? "Seuil d'Exclusion Atteint"
                : stats.maxAbsencesInSingleModule === 2
                  ? "Alerte : 2/3 Absences"
                  : "Situation Conforme"}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {stats.highestRiskModule
                ? `Max : ${stats.highestRiskModule.count}/3 dans ${stats.highestRiskModule.name}`
                : "Aucun risque d'exclusion identifié"}
            </p>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
            Article 24 Règlement Pédagogique
          </div>
        </div>
      </div>

      {/* ── Main Absences & Sessions Container ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-6">
        {/* Controls: Title + Search & Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-[#001A4B] dark:text-white flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-blue-600" /> Historique Détaillé des Séances & Feuilles de Présence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pointages QR Code dynamique, émargements numériques et validation officielle des justificatifs médicaux
            </p>
          </div>

          {/* Search + Select Filters */}
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

            {/* Module Filter */}
            {modulesList.length > 0 && (
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
              >
                <option value="all">Tous les modules ({modulesList.length})</option>
                {modulesList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {/* Justification Filter */}
            <select
              value={justificationFilter}
              onChange={(e: any) => setJustificationFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
            >
              <option value="all">Tous les justificatifs</option>
              <option value="unjustified">Non justifiées (action requise)</option>
              <option value="pending">En attente de validation</option>
              <option value="justified">Justifiées / Acceptées</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Statut :</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              statusFilter === 'all'
                ? "bg-[#001A4B] text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
          >
            Toutes les séances ({absencesList.length})
          </button>
          <button
            onClick={() => setStatusFilter('absent')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
              statusFilter === 'absent'
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            )}
          >
            <XCircle className="w-3.5 h-3.5" /> Absences ({stats.absentCount})
          </button>
          <button
            onClick={() => setStatusFilter('present')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
              statusFilter === 'present'
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Présences ({stats.presentCount})
          </button>
          <button
            onClick={() => setStatusFilter('late')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
              statusFilter === 'late'
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            )}
          >
            <Clock className="w-3.5 h-3.5" /> Retards ({stats.lateCount})
          </button>
        </div>

        {/* ── Records Table ── */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-3.5 pl-4 pr-3">Séance & Module</th>
                <th className="py-3.5 px-3">Date & Horaire</th>
                <th className="py-3.5 px-3 text-center">Statut de Présence</th>
                <th className="py-3.5 px-3 text-center">Justificatif Réglementaire</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record: any, idx: number) => {
                  const session = getSession(record);
                  const justif = getJustification(record);
                  const moduleName = cleanMojibake(session.module?.name || session.module_name || 'Module sans intitulé');
                  const moduleCode = session.module?.code || session.module_code || null;
                  const room = session.room_name || session.room || null;
                  const sessionType = session.session_type_label || (
                    session.session_type === 'cm' ? 'Cours Magistral (CM)' :
                    session.session_type === 'td' ? 'Travaux Dirigés (TD)' :
                    session.session_type === 'tp' ? 'Travaux Pratiques (TP)' :
                    session.session_type || 'Séance'
                  );
                  const dateFormatted = formatSessionDate(session.session_date);
                  const timeSchedule = session.start_time ? `${formatTime(session.start_time)} - ${formatTime(session.end_time || '')}` : '';

                  const isAbsent = record.status === 'absent';
                  const isPresent = record.status === 'present';
                  const isLate = record.status === 'late';

                  const isJustifiedApproved = record.is_justified || (justif && justif.status === 'approved');
                  const isJustifiedPending = !record.is_justified && justif && justif.status === 'pending';
                  const isJustifiedRejected = !record.is_justified && justif && justif.status === 'rejected';

                  return (
                    <tr key={record.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      {/* Module & Session info */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {moduleName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {moduleCode && (
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {moduleCode}
                            </span>
                          )}
                          {room && (
                            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {room}
                            </span>
                          )}
                          {sessionType && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {sessionType}
                            </span>
                          )}
                          {session.professor?.user?.name && (
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3" /> Pr. {session.professor.user.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {dateFormatted}
                        </div>
                        {timeSchedule && (
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeSchedule}
                          </div>
                        )}
                      </td>

                      {/* Attendance Status Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex justify-center">
                          {isPresent && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Présent
                            </span>
                          )}
                          {isAbsent && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800">
                              <XCircle className="w-3.5 h-3.5" /> Absent
                            </span>
                          )}
                          {isLate && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5" /> En Retard
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Justification Status */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {isJustifiedApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Justifié • Accepté
                            </span>
                          ) : isJustifiedPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> En cours d'examen
                            </span>
                          ) : isJustifiedRejected ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle className="w-3 h-3 text-rose-600" /> Rejeté
                              </span>
                              {justif?.rejection_reason && (
                                <span className="text-[10px] text-rose-500 font-medium max-w-[180px] truncate" title={justif.rejection_reason}>
                                  Motif : {justif.rejection_reason}
                                </span>
                              )}
                            </div>
                          ) : isAbsent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800">
                              Non justifié
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">—</span>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 pr-4 pl-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAbsent && !isJustifiedApproved && !isJustifiedPending && (
                            <button
                              onClick={() => setSelectedRecord(record)}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-blue-900 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <UploadCloud className="w-3.5 h-3.5" /> Justifier
                            </button>
                          )}

                          {justif?.media && justif.media.length > 0 && (
                            <a
                              href={justif.media[0].original_url || justif.media[0].url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Consulter le document justificatif déposé"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Voir PJ
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {absencesList.length === 0
                        ? "Aucun enregistrement d'assiduité trouvé dans la base de données"
                        : "Aucune séance ne correspond aux filtres sélectionnés"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {absencesList.length === 0
                        ? "Vos pointages de cours et TD apparaîtront ici dès leur émargement par vos professeurs."
                        : "Modifiez vos critères de recherche ou réinitialisez les filtres."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Justification Submission Modal (Guichet 48h) ── */}
      {selectedRecord && (() => {
        const session = getSession(selectedRecord);
        const moduleName = cleanMojibake(session.module?.name || session.module_name || 'Module');
        const sessionDate = formatSessionDate(session.session_date);
        const sessionTime = session.start_time ? `${formatTime(session.start_time)} - ${formatTime(session.end_time || '')}` : '';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-blue-600">
                  <UploadCloud className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Déposer un Justificatif d'Absence</h3>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Session Recap */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 tracking-wider">Séance concernée</span>
                <p className="font-black text-sm text-slate-900 dark:text-white">{moduleName}</p>
                <div className="text-slate-500 flex items-center gap-2 font-medium">
                  <span>{sessionDate}</span>
                  {sessionTime && <span>• {sessionTime}</span>}
                  <span>• {session.room_name || session.room || 'Salle de cours'}</span>
                </div>
              </div>

              {/* 48h Alert Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                <p className="font-black flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Délai Réglementaire : 48 Heures Ouvrées
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Conformément au règlement pédagogique de l'ENCG, le certificat médical ou la pièce justificative doit être délivré par une autorité médicale assermentée ou un organisme officiel.
                </p>
              </div>

              <form onSubmit={handleJustifySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Motif de l'absence</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
                  >
                    <option value="medical">Certificat Médical / Raison de Santé</option>
                    <option value="family">Événement Familial Majeur (Cas de force majeure)</option>
                    <option value="official">Convocation Administrative ou Judiciaire</option>
                    <option value="sports">Représentation Sportive ou Institutionnelle ENCG</option>
                    <option value="other">Autre motif exceptionnel justifié</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Précisions & Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Précisez la date de consultation, le nom du praticien ou les circonstances..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
                  />
                </div>

                {/* File Upload Zone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pièce Justificative (PDF, JPG, PNG - Max 5Mo)</label>
                  <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <UploadCloud className="w-7 h-7 text-blue-600" />
                      {file ? (
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} Ko • Cliquez pour remplacer</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Cliquez ou glissez-déposez votre document</p>
                          <p className="text-[10px] text-slate-400">Formats acceptés : PDF, JPEG, PNG (5 Mo max)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!file || isSubmittingJustification}
                    className="px-5 py-2.5 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmittingJustification ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Transmission en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Soumettre mon Justificatif
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── Regulations & Attendance Charter Modal ── */}
      {regulationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#001A4B] dark:text-white">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black">Règlement Pédagogique Relatif à l'Assiduité</h3>
              </div>
              <button 
                onClick={() => setRegulationsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> Article 24 — Seuil d'Exclusion aux Examens
                </h4>
                <p>
                  La présence des étudiants aux séances de Cours Magistraux (CM), Travaux Dirigés (TD) et Travaux Pratiques (TP) est strictement obligatoire. <strong>Trois (3) absences non justifiées</strong> au cours d'un même semestre dans un module entraînent automatiquement la non-validation du module et l'interdiction de se présenter à l'examen final de la session normale.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" /> Article 25 — Procédure et Délais de Justification (48h)
                </h4>
                <p>
                  Tout justificatif (certificat médical, convocation officielle, cas de force majeure) doit être déposé par voie numérique ou au guichet de scolarité dans un <strong>délai strict de 48 heures</strong> suivant la première séance d'absence. Tout document déposé hors délai est irrecevable.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Émargement Numérique & Anti-Fraude
                </h4>
                <p>
                  Les pointages s'effectuent par scan du QR Code dynamique sécurisé de séance avec géolocalisation. Toute tentative de pointage frauduleux pour un tiers fait l'objet de poursuites disciplinaires immédiates.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setRegulationsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#001A4B] text-white font-black text-xs cursor-pointer shadow-md hover:bg-[#082663]"
              >
                J'ai pris connaissance du règlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
