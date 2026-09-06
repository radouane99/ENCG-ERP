import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, BookOpen, FileSpreadsheet, Search, Loader2,
  ChevronDown, GraduationCap, Layers, ClipboardList, Filter,
  UserCheck, ShieldAlert, RefreshCw, Printer, Info,
  FileText, X, CheckCircle2, BarChart3, Download, Copy,
  LayoutGrid, LayoutList, UserX, RotateCcw, QrCode,
  Lock, Unlock, MessageCircle, Eye, Calendar, Pencil, SlidersHorizontal
} from 'lucide-react';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@shared/lib/utils';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SectionOption {
  group_id: number;
  group_code: string;
  filiere_name: string;
  semester: string;
  academic_year: string;
  sub_groups: string[];
}

interface ModuleOption {
  module_id: number;
  module_name: string;
  module_code: string;
  sections: SectionOption[];
}

interface OptionsPayload {
  modules: ModuleOption[];
}

interface StudentRow {
  id: number;
  matricule: string;
  cne: string;
  massar_code: string;
  cin: string;
  first_name: string;
  last_name: string;
  section: string;
  sub_group: string;
  gender?: 'M' | 'F';
}

type ListMode = 'section' | 'subgroup';
type PdfMode = 'emargement' | 'seances';
type PdfOrientation = 'portrait' | 'paysage';
type ViewMode = 'table' | 'cards';
type AttendanceFilter = 'all' | 'present' | 'absent';

const SEANCES = Array.from({ length: 10 }, (_, i) => `S${i + 1}`);

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function generateQrDataUrl(text: string): string {
  // Simple URL-based QR â€” using a public API as a lightweight approach
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encoded}&bgcolor=1e293b&color=6ee7b7&format=svg`;
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ProfessorStudentRosterPage() {
  const { user } = useAuthStore();
  const u = user as any;
  const profName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || '' : '';

  const [options, setOptions] = useState<OptionsPayload | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [listMode, setListMode] = useState<ListMode>('section');
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>('');

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New feature states
  const [absentIds, setAbsentIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showQrCol, setShowQrCol] = useState(false);
  const [showStats, setShowStats] = useState(false);
  // Séance selector
  const [selectedSeance, setSelectedSeance] = useState<string>('S1');
  const [seanceDate, setSeanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  // Lock
  const [isLocked, setIsLocked] = useState(false);
  // Annotations per student
  const [annotations, setAnnotations] = useState<Record<number, string>>({});
  const [editingAnnotationId, setEditingAnnotationId] = useState<number | null>(null);
  // Quick filter
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  // PDF preview
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');

  // PDF modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfMode, setPdfMode] = useState<PdfMode>('emargement');
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('portrait');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Derived
  const selectedModule = useMemo(
    () => options?.modules.find(m => m.module_id === selectedModuleId) ?? null,
    [options, selectedModuleId]
  );
  const selectedSection = useMemo(
    () => selectedModule?.sections.find(s => s.group_id === selectedGroupId) ?? null,
    [selectedModule, selectedGroupId]
  );
  const availableSubGroups = useMemo(() => selectedSection?.sub_groups ?? [], [selectedSection]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = students;
    // Attendance quick filter
    if (attendanceFilter === 'absent') list = list.filter(s => absentIds.has(s.id));
    else if (attendanceFilter === 'present') list = list.filter(s => !absentIds.has(s.id));
    if (!q) return list;
    return list.filter(s =>
      `${s.last_name} ${s.first_name}`.toLowerCase().includes(q) ||
      (s.matricule || '').toLowerCase().includes(q) ||
      (s.cne || '').toLowerCase().includes(q) ||
      (s.massar_code || '').toLowerCase().includes(q) ||
      (s.cin || '').toLowerCase().includes(q)
    );
  }, [students, searchQuery, attendanceFilter, absentIds]);

  // Stats
  const stats = useMemo(() => {
    const total = students.length;
    const absent = absentIds.size;
    const present = total - absent;
    // Try to detect gender from first name heuristics or field
    const male = students.filter(s => s.gender === 'M' || (!s.gender && (s.first_name || '').match(/^(Mohamed|Ahmed|Youssef|Hamza|Omar|Ali|Amine|Khalid|Saad|Soufiane|Mehdi|Rachid)/i))).length;
    const female = total - male;
    const subGroupBreakdown: Record<string, number> = {};
    students.forEach(s => {
      const key = s.sub_group || 'N/A';
      subGroupBreakdown[key] = (subGroupBreakdown[key] || 0) + 1;
    });
    return { total, absent, present, male, female, subGroupBreakdown };
  }, [students, absentIds]);

  // Fetch
  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const res = await api.get('/professor-portal/student-lists/options');
      setOptions(res.data);
      const firstModule = res.data.modules?.[0];
      if (firstModule) {
        setSelectedModuleId(firstModule.module_id);
        const firstSection = firstModule.sections?.[0];
        if (firstSection) setSelectedGroupId(firstSection.group_id);
      }
    } catch {
      toast.error('Impossible de charger les modules affectÃ©s');
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!selectedGroupId) return;
    setLoadingStudents(true);
    setStudents([]);
    setAbsentIds(new Set());
    try {
      const params: Record<string, string> = { group_id: String(selectedGroupId) };
      if (listMode === 'subgroup' && selectedSubGroup) params.sub_group = selectedSubGroup;
      const res = await api.get('/professor-portal/student-lists', { params });
      setStudents(res.data.students ?? res.data.data ?? []);
    } catch {
      toast.error('Erreur lors du chargement de la liste');
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedGroupId, listMode, selectedSubGroup]);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);
  useEffect(() => { if (selectedGroupId) fetchStudents(); }, [selectedGroupId, listMode, selectedSubGroup]);
  useEffect(() => { setSelectedSubGroup(availableSubGroups[0] ?? ''); }, [availableSubGroups]);
  useEffect(() => {
    const firstSection = selectedModule?.sections?.[0];
    setSelectedGroupId(firstSection?.group_id ?? null);
  }, [selectedModuleId]);

  // Actions
  const toggleAbsent = (id: number) => {
    if (isLocked) { toast.error('Liste verrouillée — déverrouillez d\'abord'); return; }
    setAbsentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const resetAbsences = () => {
    if (isLocked) { toast.error('Liste verrouillée'); return; }
    setAbsentIds(new Set());
    toast.success('Absences réinitialisées');
  };

  const saveAnnotation = (id: number, text: string) => {
    setAnnotations(prev => ({ ...prev, [id]: text }));
    setEditingAnnotationId(null);
    if (text.trim()) toast.success('Annotation enregistrée');
  };

  const handleWhatsApp = () => {
    const lines = filteredStudents.map((s, i) =>
      `${i + 1}. ${(s.last_name || '').toUpperCase()} ${s.first_name}${absentIds.has(s.id) ? ' ❌' : ' ✅'}`
    ).join('\n');
    const header = `*Appel ${selectedSeance} — ${seanceDate}*\n*${selectedSection?.group_code ?? ''} ${listMode === 'subgroup' ? `| Sous-groupe ${selectedSubGroup}` : '| Section Complète'}*\n${'─'.repeat(40)}\n`;
    const text = encodeURIComponent(header + lines);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  };

  const handlePreviewPdf = () => {
    if (!selectedGroupId) return;
    const params: Record<string, string> = {
      group_id: String(selectedGroupId),
      mode: pdfMode,
      orientation: pdfOrientation,
    };
    if (listMode === 'subgroup' && selectedSubGroup) params.sub_group = selectedSubGroup;
    if (selectedModuleId) params.module_id = String(selectedModuleId);
    if (absentIds.size > 0) params.absent_ids = Array.from(absentIds).join(',');
    const qs = new URLSearchParams(params);
    setPdfPreviewUrl(`/api/professor-portal/student-lists/pdf?${qs.toString()}`);
    setShowPdfPreview(true);
  };

  const handleCopyList = () => {
    const lines = filteredStudents.map((s, i) =>
      `${i + 1}. ${(s.last_name || '').toUpperCase()} ${s.first_name} | ${s.matricule || '—'} | ${s.cne || '—'}`
    ).join('\n');
    const header = `Liste d'étudiants — ${selectedSection?.group_code ?? ''} ${listMode === 'subgroup' ? `| Sous-groupe ${selectedSubGroup}` : '| Section Complète'}\n${'—'.repeat(60)}\n`;
    navigator.clipboard.writeText(header + lines).then(() => {
      toast.success(`${filteredStudents.length} étudiants copiés dans le presse-papiers`);
    }).catch(() => toast.error('Impossible de copier'));
  };

  const handleDownloadPdf = () => {
    if (!selectedGroupId) return;
    setDownloadingPdf(true);
    try {
      const params: Record<string, string> = {
        group_id: String(selectedGroupId),
        mode: pdfMode,
        orientation: pdfOrientation,
      };
      if (listMode === 'subgroup' && selectedSubGroup) params.sub_group = selectedSubGroup;
      if (selectedModuleId) params.module_id = String(selectedModuleId);
      // Send absent IDs if any
      if (absentIds.size > 0) params.absent_ids = Array.from(absentIds).join(',');
      const qs = new URLSearchParams(params);
      openAuthenticatedUrl(`/api/professor-portal/student-lists/pdf?${qs.toString()}`);
      toast.success('PDF téléchargé avec succès');
      setShowPdfModal(false);
      setShowPdfPreview(false);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!selectedGroupId) return;
    setDownloadingExcel(true);
    try {
      const params: Record<string, string> = { group_id: String(selectedGroupId) };
      if (listMode === 'subgroup' && selectedSubGroup) params.sub_group = selectedSubGroup;
      if (selectedModuleId) params.module_id = String(selectedModuleId);
      const qs = new URLSearchParams(params);
      openAuthenticatedUrl(`/api/professor-portal/student-lists/excel?${qs.toString()}`);
      toast.success('Fichier Excel exporté');
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* — Sticky Header — */}
      <div className="border-b border-slate-800/60 bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <ClipboardList className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  Listes d'Étudiants & Émargement
                </h1>
                <p className="text-sm text-slate-400">
                  لوائح الطلبة وأوراق الحضور الرسمية — {profName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View toggle */}
              <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                <button onClick={() => setViewMode('table')} className={cn('p-2 transition-all', viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white')}>
                  <LayoutList className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('cards')} className={cn('p-2 transition-all', viewMode === 'cards' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white')}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              {/* Stats toggle */}
              <button onClick={() => setShowStats(v => !v)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border', showStats ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white')}>
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Stats</span>
              </button>
              {/* QR toggle */}
              <button onClick={() => setShowQrCol(v => !v)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border', showQrCol ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white')}>
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR</span>
              </button>
              {/* Lock toggle */}
              <button
                onClick={() => { setIsLocked(v => !v); toast(isLocked ? 'Liste déverrouillée' : '🔒 Liste verrouillée — modifications bloquées'); }}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border', isLocked ? 'bg-amber-600/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white')}
                title={isLocked ? 'Déverrouiller' : 'Verrouiller la liste'}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span className="hidden sm:inline">{isLocked ? 'Verrouillé' : 'Verrou'}</span>
              </button>
              <button onClick={fetchStudents} disabled={loadingStudents || !selectedGroupId} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all disabled:opacity-40">
                <RefreshCw className={cn('w-4 h-4', loadingStudents && 'animate-spin')} />
              </button>
              <button onClick={() => setShowPdfModal(true)} disabled={!selectedGroupId || students.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-40">
                <Printer className="w-4 h-4" />
                <span>Imprimer PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {loadingOptions ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : !options?.modules?.length ? (
          <NoModulesPlaceholder />
        ) : (
          <>
            {/* — Séance Selector Banner — */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/60 rounded-2xl p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">Séance de cours :</span>
              </div>
              {/* Séance pills */}
              <div className="flex gap-1.5 flex-wrap">
                {SEANCES.map(s => (
                  <button key={s} onClick={() => setSelectedSeance(s)}
                    className={cn('px-3 py-1 rounded-full text-xs font-bold border transition-all', selectedSeance === s ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-300')}>
                    {s}
                  </button>
                ))}
              </div>
              {/* Date */}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs text-slate-500">Date :</label>
                <input type="date" value={seanceDate} onChange={e => setSeanceDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              {isLocked && (
                <span className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-full px-3 py-1">
                  <Lock className="w-3 h-3" /> Liste verrouillée
                </span>
              )}
            </div>

            {/* — Filters — */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Filtres de la liste</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Module / Cours</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select value={selectedModuleId ?? ''} onChange={e => setSelectedModuleId(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors">
                      {options.modules.map(m => <option key={m.module_id} value={m.module_id}>{m.module_code} — {m.module_name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Section (Filière / Semestre)</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select value={selectedGroupId ?? ''} onChange={e => setSelectedGroupId(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors">
                      {selectedModule?.sections.map(s => <option key={s.group_id} value={s.group_id}>{s.group_code} — {s.filiere_name} {s.semester}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Type d'enseignement</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                    <button onClick={() => setListMode('section')} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all', listMode === 'section' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700')}>
                      <Layers className="w-3.5 h-3.5" /><span>CM</span>
                    </button>
                    <button onClick={() => setListMode('subgroup')} disabled={availableSubGroups.length === 0} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all disabled:opacity-40', listMode === 'subgroup' ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700')}>
                      <Users className="w-3.5 h-3.5" /><span>TD / TP</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Sous-groupe</label>
                  {listMode === 'subgroup' && availableSubGroups.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {availableSubGroups.map(sg => (
                        <button key={sg} onClick={() => setSelectedSubGroup(sg)} className={cn('px-4 py-2 rounded-lg text-sm font-bold border transition-all', selectedSubGroup === sg ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-300')}>
                          {sg}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-10 flex items-center">
                      <span className="text-slate-500 text-sm italic">{listMode === 'section' ? 'Section complète (CM / Amphi)' : 'Aucun sous-groupe disponible'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* — Stats Panel — */}
            {showStats && students.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total inscrits" value={stats.total} color="emerald" icon="👥" />
                <StatCard label="Présents" value={stats.present} color="green" icon="✅" />
                <StatCard label="Absents marqués" value={stats.absent} color="red" icon="❌" />
                <StatCard label="Taux présence" value={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%`} color="blue" icon="📊" />
                {Object.entries(stats.subGroupBreakdown).map(([sg, count]) => (
                  <StatCard key={sg} label={`Sous-groupe ${sg}`} value={count} color="violet" icon="👥" />
                ))}
              </div>
            )}

            {/* — Toolbar — */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <StatPill color="emerald" label="Total" value={students.length} />
                {absentIds.size > 0 && <StatPill color="red" label="Absents" value={absentIds.size} />}
                {listMode === 'subgroup' && selectedSubGroup && <StatPill color="violet" label="Sous-groupe" value={selectedSubGroup} />}
                {selectedSection && <StatPill color="blue" label="Section" value={selectedSection.group_code} />}
                {searchQuery && <StatPill color="amber" label="Filtrés" value={filteredStudents.length} />}
                {absentIds.size > 0 && (
                  <button onClick={resetAbsences} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset absences
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Quick attendance filter */}
                <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800 text-xs">
                  {(['all', 'present', 'absent'] as AttendanceFilter[]).map(f => (
                    <button key={f} onClick={() => setAttendanceFilter(f)}
                      className={cn('px-3 py-2 font-medium transition-all flex items-center gap-1',
                        attendanceFilter === f
                          ? f === 'absent' ? 'bg-rose-600 text-white' : f === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-white'
                      )}>
                      <SlidersHorizontal className="w-3 h-3" />
                      {f === 'all' ? 'Tous' : f === 'present' ? '✅ Présents' : '❌ Absents'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" placeholder="Nom, Matricule, CNE…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors w-44" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-slate-500 hover:text-white" /></button>}
                </div>
                <button onClick={handleCopyList} disabled={filteredStudents.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all disabled:opacity-40" title="Copier la liste">
                  <Copy className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">Copier</span>
                </button>
                <button onClick={handleWhatsApp} disabled={students.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-green-800/60 border border-slate-700 hover:border-green-600/50 text-slate-300 hover:text-green-300 text-sm transition-all disabled:opacity-40" title="Partager sur WhatsApp">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
                <button onClick={handleDownloadExcel} disabled={downloadingExcel || students.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all disabled:opacity-40">
                  {downloadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-green-400" />}
                  <span className="hidden sm:inline">Excel</span>
                </button>
              </div>
            </div>

            {/* — Student List — */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden backdrop-blur-xl">
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-slate-400 text-sm">Chargement de la liste…</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <UserCheck className="w-12 h-12 text-slate-700" />
                  <p className="text-slate-400 text-sm">Aucun étudiant trouvé</p>
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="text-emerald-400 text-xs hover:underline">Effacer la recherche</button>}
                </div>
              ) : viewMode === 'cards' ? (
                /* — Cards View — */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredStudents.map((s, idx) => {
                    const isAbsent = absentIds.has(s.id);
                    return (
                      <div key={s.id} className={cn('rounded-xl border p-4 flex flex-col gap-3 transition-all', isAbsent ? 'bg-rose-950/30 border-rose-700/40' : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600')}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm', isAbsent ? 'bg-rose-700' : 'bg-gradient-to-br from-emerald-600 to-teal-600')}>
                              {(s.last_name?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm leading-tight">{(s.last_name || '').toUpperCase()} {s.first_name}</p>
                              <p className="text-slate-400 text-xs font-mono">{s.matricule || '—'}</p>
                            </div>
                          </div>
                          <span className="text-slate-600 text-xs font-mono">#{idx + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div className="bg-slate-900/50 rounded-lg p-2">
                            <p className="text-slate-500 text-[10px] uppercase mb-0.5">CNE</p>
                            <p className="text-slate-300 font-mono">{s.cne || '—'}</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-2">
                            <p className="text-slate-500 text-[10px] uppercase mb-0.5">CIN</p>
                            <p className="text-slate-300 font-mono">{s.cin || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">{s.section || selectedSection?.group_code || '—'}</span>
                            {s.sub_group && <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs">{s.sub_group}</span>}
                          </div>
                          <button onClick={() => toggleAbsent(s.id)} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all border', isAbsent ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-rose-500 hover:text-rose-400')}>
                            <UserX className="w-3 h-3" />
                            {isAbsent ? 'Absent' : 'Marquer'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* — Table View — */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">N°</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Matricule</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">CNE / Massar</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">CIN</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nom & Prénom</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Section / Groupe</th>
                        {showQrCol && <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">QR</th>}
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Note</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">Présence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => {
                        const isAbsent = absentIds.has(s.id);
                        return (
                          <tr key={s.id} className={cn('border-b border-slate-800/50 transition-all', isAbsent ? 'bg-rose-950/20 opacity-60' : idx % 2 === 0 ? 'hover:bg-slate-800/40' : 'bg-slate-900/30 hover:bg-slate-800/40')}>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-300">{s.matricule || '—'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-slate-300 text-xs font-mono">{s.cne || '—'}</span>
                                {s.massar_code && s.massar_code !== s.cne && <span className="text-slate-500 text-xs font-mono">{s.massar_code}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">{s.cin || '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', isAbsent ? 'bg-rose-700' : 'bg-gradient-to-br from-emerald-600 to-teal-600')}>
                                  <span className="text-white text-xs font-bold">{(s.last_name?.[0] || s.first_name?.[0] || '?').toUpperCase()}</span>
                                </div>
                                <p className={cn('font-semibold text-sm', isAbsent ? 'text-slate-500 line-through' : 'text-white')}>
                                  {(s.last_name || '').toUpperCase()} {s.first_name}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">{s.section || selectedSection?.group_code || '—'}</span>
                                {s.sub_group && <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">{s.sub_group}</span>}
                              </div>
                            </td>
                            {showQrCol && (
                              <td className="px-3 py-2 text-center">
                                <img
                                  src={generateQrDataUrl(s.matricule || String(s.id))}
                                  alt={`QR ${s.matricule}`}
                                  className="w-10 h-10 mx-auto rounded opacity-80"
                                  loading="lazy"
                                />
                              </td>
                            )}
                            {/* Annotation cell */}
                            <td className="px-3 py-2 text-center">
                              {editingAnnotationId === s.id ? (
                                <input
                                  autoFocus
                                  defaultValue={annotations[s.id] || ''}
                                  onBlur={e => saveAnnotation(s.id, e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveAnnotation(s.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingAnnotationId(null); }}
                                  className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                                  placeholder="Remarque…"
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingAnnotationId(s.id)}
                                  className={cn('flex items-center justify-center gap-1 text-xs rounded-lg px-2 py-1 transition-all', annotations[s.id] ? 'text-amber-300 bg-amber-900/20 border border-amber-700/30' : 'text-slate-600 hover:text-amber-400')}
                                  title={annotations[s.id] || 'Ajouter une note'}
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span className="max-w-[60px] truncate">{annotations[s.id] || ''}</span>
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleAbsent(s.id)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                  isAbsent
                                    ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 hover:bg-rose-600 hover:text-white'
                                    : 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-rose-600/10 hover:border-rose-500/30 hover:text-rose-400'
                                )}
                              >
                                {isAbsent ? <><UserX className="w-3 h-3" /> Absent</> : <><CheckCircle2 className="w-3 h-3" /> Présent</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-slate-800/60 bg-slate-900/50 flex items-center justify-between">
                    <p className="text-slate-400 text-xs">
                      {filteredStudents.length} étudiant{filteredStudents.length !== 1 ? 's' : ''}
                      {searchQuery ? ` (filtrés sur ${students.length})` : ' inscrits'}
                      {listMode === 'subgroup' && selectedSubGroup ? ` — Sous-groupe ${selectedSubGroup}` : ' — Section Complète (CM)'}
                      {absentIds.size > 0 && <span className="text-rose-400 ml-2">· {absentIds.size} absent{absentIds.size > 1 ? 's' : ''}</span>}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Info className="w-3 h-3" />
                      Tri alphabétique officiel (Nom ASC)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* — PDF Preview Modal — */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-semibold">Aperçu PDF — {selectedSection?.group_code} {selectedSeance} — {seanceDate}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium transition-all">
                <Download className="w-4 h-4" /> Télécharger
              </button>
              <button onClick={() => setShowPdfPreview(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <iframe
            src={pdfPreviewUrl}
            className="flex-1 w-full"
            title="Aperçu PDF"
          />
        </div>
      )}

      {/* — PDF Settings Modal — */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Imprimer Fiche Officielle</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Format PDF — ENCG Fès / USMBA</p>
                </div>
              </div>
              <button onClick={() => setShowPdfModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Summary */}
              <div className="bg-slate-800/60 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Section</span>
                  <span className="text-white font-medium">{selectedSection?.group_code} — {selectedSection?.filiere_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-medium">{listMode === 'section' ? 'Cours Magistral — Section Complète' : `TD — Sous-groupe ${selectedSubGroup}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Effectif</span>
                  <span className="text-emerald-400 font-bold">{students.length} étudiants</span>
                </div>
                {absentIds.size > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Absents marqués</span>
                    <span className="text-rose-400 font-bold">{absentIds.size} (seront indiqués sur le PDF)</span>
                  </div>
                )}
              </div>

              {/* Format picker */}
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-3">Format de la grille</p>
                <div className="grid grid-cols-2 gap-3">
                  <PdfModeCard active={pdfMode === 'emargement'} onClick={() => setPdfMode('emargement')} icon={<FileText className="w-5 h-5" />} title="Fiche d'Émargement" subtitle="Signature individuelle par séance" />
                  <PdfModeCard active={pdfMode === 'seances'} onClick={() => setPdfMode('seances')} icon={<BarChart3 className="w-5 h-5" />} title="Grille 10 Séances" subtitle="Présence / absence S1 → S10" />
                </div>
              </div>

              {/* Orientation picker */}
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-3">Orientation de la page</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPdfOrientation('portrait')} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all', pdfOrientation === 'portrait' ? 'bg-emerald-600/10 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600')}>
                    <div className={cn('w-6 h-8 rounded border-2 flex-shrink-0', pdfOrientation === 'portrait' ? 'border-emerald-400' : 'border-slate-600')} />
                    <div className="text-left">
                      <p className={cn('text-sm font-semibold', pdfOrientation === 'portrait' ? 'text-white' : 'text-slate-300')}>Portrait</p>
                      <p className="text-xs text-slate-500">A4 vertical</p>
                    </div>
                    {pdfOrientation === 'portrait' && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </button>
                  <button onClick={() => setPdfOrientation('paysage')} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all', pdfOrientation === 'paysage' ? 'bg-emerald-600/10 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600')}>
                    <div className={cn('w-8 h-6 rounded border-2 flex-shrink-0', pdfOrientation === 'paysage' ? 'border-emerald-400' : 'border-slate-600')} />
                    <div className="text-left">
                      <p className={cn('text-sm font-semibold', pdfOrientation === 'paysage' ? 'text-white' : 'text-slate-300')}>Paysage</p>
                      <p className="text-xs text-slate-500">A4 horizontal</p>
                    </div>
                    {pdfOrientation === 'paysage' && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800">
              <button onClick={() => setShowPdfModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">Annuler</button>
              <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-60">
                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                TÃ©lÃ©charger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs uppercase tracking-wide font-medium">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatPill({ color, label, value }: { color: 'emerald' | 'violet' | 'blue' | 'amber' | 'red'; label: string; value: string | number }) {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    red: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
  };
  return (
    <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium', map[color])}>
      <span className="text-slate-400">{label}:</span>
      <span className="font-bold">{value}</span>
    </span>
  );
}

function PdfModeCard({ active, onClick, icon, title, subtitle }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <button onClick={onClick} className={cn('relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all', active ? 'bg-emerald-600/10 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600')}>
      {active && <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-emerald-400" />}
      <div className={cn('p-1.5 rounded-lg', active ? 'text-emerald-400' : 'text-slate-500')}>{icon}</div>
      <div>
        <p className={cn('text-sm font-semibold', active ? 'text-white' : 'text-slate-300')}>{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
      </div>
    </button>
  );
}

function NoModulesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <ShieldAlert className="w-10 h-10 text-amber-400" />
      </div>
      <div className="text-center max-w-sm">
        <h3 className="text-white font-semibold text-lg mb-2">Aucun module affectÃ©</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Vous n'avez pas encore de modules pÃ©dagogiques affectÃ©s pour cette annÃ©e universitaire. Veuillez contacter l'administration.
        </p>
      </div>
    </div>
  );
}

