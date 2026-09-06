import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, BookOpen, FileSpreadsheet, Search, Loader2,
  ChevronDown, GraduationCap, Layers, ClipboardList, Filter,
  UserCheck, ShieldAlert, RefreshCw, Printer, Info,
  FileText, X, CheckCircle2, BarChart3, Download, Copy,
  LayoutGrid, LayoutList, UserX, RotateCcw, QrCode,
  Lock, Unlock, MessageCircle, Eye, Calendar, Pencil,
  Tag, PrinterIcon, Save
} from 'lucide-react';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@shared/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

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
type AttendanceFilter = 'all' | 'present' | 'absent' | 'annotated';
type AnnotationTag = 'justifie' | 'retard' | 'exclusion' | 'rattrapage' | 'remarque';

interface StudentAnnotation {
  text: string;
  tag?: AnnotationTag;
}

interface SeanceData {
  absentIds: number[];
  annotations: Record<number, StudentAnnotation>;
  isLocked: boolean;
  date: string;
  savedAt?: string;
}

const SEANCES = Array.from({ length: 12 }, (_, i) => `S${i + 1}`);

const TAG_CONFIG: Record<AnnotationTag, { label: string; bg: string; text: string; border: string }> = {
  justifie: { label: 'Justifié', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  retard: { label: 'Retard', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  exclusion: { label: 'Exclusion', bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  rattrapage: { label: 'Rattrapage', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  remarque: { label: 'Remarque', bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateQrDataUrl(text: string): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encoded}&bgcolor=0f172a&color=10b981&format=svg`;
}

// ─── Component ───────────────────────────────────────────────────────────────

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

  // View & display settings
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showQrCol, setShowQrCol] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // 1. Séance Selector & Storage per Séance
  const [selectedSeance, setSelectedSeance] = useState<string>('S1');
  const [seanceDate, setSeanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [seanceStore, setSeanceStore] = useState<Record<string, SeanceData>>({});

  // 2. Lock State
  const [isLocked, setIsLocked] = useState(false);

  // 3. Annotations State
  const [annotations, setAnnotations] = useState<Record<number, StudentAnnotation>>({});
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteTag, setEditNoteTag] = useState<AnnotationTag>('remarque');

  // 4. Quick Filters
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [absentIds, setAbsentIds] = useState<Set<number>>(new Set());

  // 5. PDF Modal & Live Preview Iframe
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewBlobUrl, setPdfPreviewBlobUrl] = useState<string | null>(null);
  const [loadingPdfPreview, setLoadingPdfPreview] = useState(false);
  const [pdfMode, setPdfMode] = useState<PdfMode>('emargement');
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('portrait');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // 6. WhatsApp Share Modal
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppType, setWhatsAppType] = useState<'absents_only' | 'full_roster'>('absents_only');

  // 7. Individual Student Sheet Modal
  const [individualStudent, setIndividualStudent] = useState<StudentRow | null>(null);

  // 8. Backend Persistence State
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingAttendanceHistory, setLoadingAttendanceHistory] = useState(false);

  // Storage key for caching séances locally
  const storageKey = useMemo(() => {
    if (!selectedGroupId || !selectedModuleId) return null;
    return `encg_roster_data_${selectedGroupId}_${selectedModuleId}_${listMode}_${selectedSubGroup || 'all'}`;
  }, [selectedGroupId, selectedModuleId, listMode, selectedSubGroup]);

  // Load séances data from local storage when key changes
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSeanceStore(parsed);
        const currentData = parsed[selectedSeance];
        if (currentData) {
          setAbsentIds(new Set(currentData.absentIds || []));
          setAnnotations(currentData.annotations || {});
          setIsLocked(!!currentData.isLocked);
          if (currentData.date) setSeanceDate(currentData.date);
        } else {
          setAbsentIds(new Set());
          setAnnotations({});
          setIsLocked(false);
        }
      } else {
        setSeanceStore({});
        setAbsentIds(new Set());
        setAnnotations({});
        setIsLocked(false);
      }
    } catch {
      // ignore parsing error
    }
  }, [storageKey]);

  // Switch séance and restore its state
  const handleSelectSeance = (seance: string) => {
    // Persist current séance before switching
    if (storageKey) {
      const updatedStore = {
        ...seanceStore,
        [selectedSeance]: {
          absentIds: Array.from(absentIds),
          annotations,
          isLocked,
          date: seanceDate,
          savedAt: new Date().toISOString(),
        }
      };
      setSeanceStore(updatedStore);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedStore));
      } catch {}
    }

    setSelectedSeance(seance);
    const targetData = seanceStore[seance];
    if (targetData) {
      setAbsentIds(new Set(targetData.absentIds || []));
      setAnnotations(targetData.annotations || {});
      setIsLocked(!!targetData.isLocked);
      if (targetData.date) setSeanceDate(targetData.date);
    } else {
      setAbsentIds(new Set());
      setAnnotations({});
      setIsLocked(false);
    }
  };

  // Sync current séance state back to localStorage
  const persistCurrentSeance = useCallback((
    newAbsentIds: Set<number>,
    newAnnotations: Record<number, StudentAnnotation>,
    newLocked: boolean,
    newDate: string
  ) => {
    if (!storageKey) return;
    const updatedStore = {
      ...seanceStore,
      [selectedSeance]: {
        absentIds: Array.from(newAbsentIds),
        annotations: newAnnotations,
        isLocked: newLocked,
        date: newDate,
        savedAt: new Date().toISOString(),
      }
    };
    setSeanceStore(updatedStore);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedStore));
    } catch {}
  }, [storageKey, selectedSeance, seanceStore]);

  // Derived options
  const selectedModule = useMemo(
    () => options?.modules.find(m => m.module_id === selectedModuleId) ?? null,
    [options, selectedModuleId]
  );
  const selectedSection = useMemo(
    () => selectedModule?.sections.find(s => s.group_id === selectedGroupId) ?? null,
    [selectedModule, selectedGroupId]
  );
  const availableSubGroups = useMemo(() => selectedSection?.sub_groups ?? [], [selectedSection]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = students;

    // Attendance quick filter
    if (attendanceFilter === 'absent') {
      list = list.filter(s => absentIds.has(s.id));
    } else if (attendanceFilter === 'present') {
      list = list.filter(s => !absentIds.has(s.id));
    } else if (attendanceFilter === 'annotated') {
      list = list.filter(s => !!annotations[s.id]?.text || !!annotations[s.id]?.tag);
    }

    if (!q) return list;
    return list.filter(s =>
      `${s.last_name} ${s.first_name}`.toLowerCase().includes(q) ||
      (s.matricule || '').toLowerCase().includes(q) ||
      (s.cne || '').toLowerCase().includes(q) ||
      (s.massar_code || '').toLowerCase().includes(q) ||
      (s.cin || '').toLowerCase().includes(q)
    );
  }, [students, searchQuery, attendanceFilter, absentIds, annotations]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = students.length;
    const absent = absentIds.size;
    const present = total - absent;
    const annotatedCount = Object.keys(annotations).filter(id => !!annotations[Number(id)]?.text || !!annotations[Number(id)]?.tag).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    const subGroupBreakdown: Record<string, number> = {};
    students.forEach(s => {
      const key = s.sub_group || 'N/A';
      subGroupBreakdown[key] = (subGroupBreakdown[key] || 0) + 1;
    });
    return { total, absent, present, annotatedCount, rate, subGroupBreakdown };
  }, [students, absentIds, annotations]);

  // Fetch Options
  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const res = await api.get('/professor-portal/student-lists/options');
      const payload = res.data?.data ?? res.data;
      let modulesList: ModuleOption[] = payload?.modules ?? [];

      // Si les modules ne sont pas directement regroupés mais les groupes existent
      if ((!modulesList || modulesList.length === 0) && payload?.groups?.length > 0) {
        const map: Record<number, ModuleOption> = {};
        payload.groups.forEach((g: any) => {
          const mId = g.module_id || 0;
          if (!map[mId]) {
            map[mId] = {
              module_id: mId,
              module_name: g.module_name || 'Module d\'Enseignement',
              module_code: g.module_code || 'MOD',
              sections: [],
            };
          }
          map[mId].sections.push({
            group_id: g.id,
            group_code: g.name,
            filiere_name: g.filiere_name || 'Filière',
            semester: `S${g.semester || 1}`,
            academic_year: '2025/2026',
            sub_groups: g.sub_groups || [],
          });
        });
        modulesList = Object.values(map);
      }

      setOptions({ modules: modulesList });
      const firstModule = modulesList[0];
      if (firstModule) {
        setSelectedModuleId(firstModule.module_id);
        const firstSection = firstModule.sections?.[0];
        if (firstSection) setSelectedGroupId(firstSection.group_id);
      }
    } catch {
      toast.error('Impossible de charger les modules affectés');
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    if (!selectedGroupId) return;
    setLoadingStudents(true);
    setStudents([]);
    try {
      const params: Record<string, string> = { group_id: String(selectedGroupId) };
      if (listMode === 'subgroup' && selectedSubGroup) params.sub_group = selectedSubGroup;
      const res = await api.get('/professor-portal/student-lists', { params });
      const rawList = res.data?.students ?? res.data?.data?.students ?? res.data?.data ?? [];
      const normalized: StudentRow[] = (Array.isArray(rawList) ? rawList : []).map((s: any) => ({
        id: s.id,
        matricule: s.matricule || s.student_number || '—',
        cne: s.cne || s.massar_code || '—',
        massar_code: s.massar_code || '',
        cin: s.cin || '—',
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        section: s.section || selectedSection?.group_code || '—',
        sub_group: s.sub_group || '',
        gender: s.gender,
      }));
      setStudents(normalized);
    } catch {
      toast.error('Erreur lors du chargement de la liste');
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedGroupId, listMode, selectedSubGroup, selectedSection]);

  // Fetch Attendance History from Backend
  const fetchAttendanceHistory = useCallback(async () => {
    if (!selectedGroupId || !selectedModuleId) return;
    setLoadingAttendanceHistory(true);
    try {
      const params: Record<string, string> = {
        group_id: String(selectedGroupId),
        module_id: String(selectedModuleId),
      };
      if (listMode === 'subgroup' && selectedSubGroup) params.sub_group = selectedSubGroup;
      const res = await api.get('/professor-portal/student-lists/attendance', { params });
      const backendSeances = res.data?.seances ?? res.data?.data?.seances ?? {};
      if (Object.keys(backendSeances).length > 0) {
        setSeanceStore(prev => {
          const merged = { ...prev };
          Object.entries(backendSeances).forEach(([code, sData]: [string, any]) => {
            merged[code] = {
              absentIds: sData.absent_ids || [],
              annotations: sData.annotations || {},
              isLocked: !!sData.is_locked,
              date: sData.date || new Date().toISOString().slice(0, 10),
              savedAt: sData.saved_at || new Date().toISOString(),
            };
          });
          return merged;
        });

        // Appliquer à la séance en cours si elle existe en BDD
        const currentData = backendSeances[selectedSeance];
        if (currentData) {
          setAbsentIds(new Set(currentData.absent_ids || []));
          setAnnotations(currentData.annotations || {});
          setIsLocked(!!currentData.is_locked);
          if (currentData.date) setSeanceDate(currentData.date);
        }
      }
    } catch {
      // Ignorer l'erreur réseau pour continuer avec le cache local
    } finally {
      setLoadingAttendanceHistory(false);
    }
  }, [selectedGroupId, selectedModuleId, listMode, selectedSubGroup, selectedSeance]);

  // Save attendance to Backend Database
  const handleSaveAttendanceToDb = async () => {
    if (!selectedGroupId || !selectedModuleId) {
      toast.error('Veuillez sélectionner un module et un groupe');
      return;
    }
    setSavingAttendance(true);
    try {
      const payload = {
        group_id: selectedGroupId,
        module_id: selectedModuleId,
        sub_group: listMode === 'subgroup' ? selectedSubGroup : undefined,
        seance_code: selectedSeance,
        session_date: seanceDate,
        is_locked: isLocked,
        absent_ids: Array.from(absentIds),
        annotations,
      };
      const res = await api.post('/professor-portal/student-lists/attendance', payload);
      toast.success(res.data?.message || `Feuille de présence ${selectedSeance} enregistrée en base de données`);
      persistCurrentSeance(absentIds, annotations, isLocked, seanceDate);
    } catch {
      toast.error('Erreur lors de l\'enregistrement en base de données');
    } finally {
      setSavingAttendance(false);
    }
  };

  useEffect(() => { fetchOptions(); }, [fetchOptions]);
  useEffect(() => { if (selectedGroupId) fetchStudents(); }, [selectedGroupId, listMode, selectedSubGroup]);
  useEffect(() => {
    if (selectedGroupId && selectedModuleId) {
      fetchAttendanceHistory();
    }
  }, [selectedGroupId, selectedModuleId, listMode, selectedSubGroup]);
  useEffect(() => { setSelectedSubGroup(availableSubGroups[0] ?? ''); }, [availableSubGroups]);
  useEffect(() => {
    const firstSection = selectedModule?.sections?.[0];
    setSelectedGroupId(firstSection?.group_id ?? null);
  }, [selectedModuleId]);

  // Actions: Absence Toggle
  const toggleAbsent = (id: number) => {
    if (isLocked) {
      toast.error('Liste verrouillée — Déverrouillez la séance pour modifier les présences');
      return;
    }
    const next = new Set(absentIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setAbsentIds(next);
    persistCurrentSeance(next, annotations, isLocked, seanceDate);
  };

  // Reset absences for current session
  const resetAbsences = () => {
    if (isLocked) {
      toast.error('Liste verrouillée — Déverrouillez pour réinitialiser');
      return;
    }
    const next = new Set<number>();
    setAbsentIds(next);
    persistCurrentSeance(next, annotations, isLocked, seanceDate);
    toast.success(`Absences de la séance ${selectedSeance} réinitialisées`);
  };

  // Lock / Unlock toggle
  const toggleLock = () => {
    const nextLock = !isLocked;
    setIsLocked(nextLock);
    persistCurrentSeance(absentIds, annotations, nextLock, seanceDate);
    if (nextLock) {
      toast.info(`🔒 Séance ${selectedSeance} verrouillée — Les présences sont figées`);
    } else {
      toast.success(`🔓 Séance ${selectedSeance} déverrouillée`);
    }
  };

  // Annotations Editor
  const openAnnotationEditor = (student: StudentRow) => {
    if (isLocked) {
      toast.error('Liste verrouillée — Déverrouillez d\'abord');
      return;
    }
    setEditingStudentId(student.id);
    const existing = annotations[student.id];
    setEditNoteText(existing?.text || '');
    setEditNoteTag(existing?.tag || 'remarque');
  };

  const saveAnnotation = () => {
    if (editingStudentId === null) return;
    const nextAnnotations = { ...annotations };
    if (!editNoteText.trim() && !editNoteTag) {
      delete nextAnnotations[editingStudentId];
    } else {
      nextAnnotations[editingStudentId] = {
        text: editNoteText.trim(),
        tag: editNoteTag,
      };
    }
    setAnnotations(nextAnnotations);
    persistCurrentSeance(absentIds, nextAnnotations, isLocked, seanceDate);
    setEditingStudentId(null);
    toast.success('Annotation enregistrée');
  };

  const removeAnnotation = (id: number) => {
    if (isLocked) {
      toast.error('Liste verrouillée');
      return;
    }
    const nextAnnotations = { ...annotations };
    delete nextAnnotations[id];
    setAnnotations(nextAnnotations);
    persistCurrentSeance(absentIds, nextAnnotations, isLocked, seanceDate);
    setEditingStudentId(null);
    toast.success('Annotation supprimée');
  };

  // ─── PDF Preview via Blob (Authenticated) ──────────────────────────────────
  const handleOpenPdfPreview = async () => {
    if (!selectedGroupId) return;
    setLoadingPdfPreview(true);
    setShowPdfPreview(true);

    try {
      const params: Record<string, string> = {
        group_id: String(selectedGroupId),
        mode: pdfMode,
        orientation: pdfOrientation,
      };
      if (listMode === 'subgroup' && selectedSubGroup) params.sub_group = selectedSubGroup;
      if (selectedModuleId) params.module_id = String(selectedModuleId);
      if (absentIds.size > 0) params.absent_ids = Array.from(absentIds).join(',');

      const qs = new URLSearchParams(params);
      const res = await api.get(`/professor-portal/student-lists/pdf?${qs.toString()}`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });

      if (pdfPreviewBlobUrl) {
        URL.revokeObjectURL(pdfPreviewBlobUrl);
      }
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setPdfPreviewBlobUrl(objectUrl);
    } catch {
      toast.error('Erreur lors de la génération de l\'aperçu PDF');
      setShowPdfPreview(false);
    } finally {
      setLoadingPdfPreview(false);
    }
  };

  const handleClosePdfPreview = () => {
    setShowPdfPreview(false);
    if (pdfPreviewBlobUrl) {
      URL.revokeObjectURL(pdfPreviewBlobUrl);
      setPdfPreviewBlobUrl(null);
    }
  };

  // Download PDF file
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
      if (absentIds.size > 0) params.absent_ids = Array.from(absentIds).join(',');
      const qs = new URLSearchParams(params);
      openAuthenticatedUrl(`/api/professor-portal/student-lists/pdf?${qs.toString()}`);
      toast.success('Téléchargement du PDF lancé');
      setShowPdfModal(false);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Download Excel
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

  // Copy List to Clipboard
  const handleCopyList = () => {
    const lines = filteredStudents.map((s, i) =>
      `${i + 1}. ${(s.last_name || '').toUpperCase()} ${s.first_name} | ${s.matricule || '—'} | ${s.cne || '—'}`
    ).join('\n');
    const header = `Liste d'étudiants — ${selectedSection?.group_code ?? ''} ${listMode === 'subgroup' ? `| Sous-groupe ${selectedSubGroup}` : '| Section Complète'}\n${'—'.repeat(60)}\n`;
    navigator.clipboard.writeText(header + lines).then(() => {
      toast.success(`${filteredStudents.length} étudiants copiés dans le presse-papiers`);
    }).catch(() => toast.error('Impossible de copier'));
  };

  // WhatsApp Message Generator
  const generatedWhatsAppText = useMemo(() => {
    const groupName = selectedSection?.group_code ?? 'Section';
    const filiereName = selectedSection?.filiere_name ?? '';
    const moduleName = selectedModule ? `${selectedModule.module_code} - ${selectedModule.module_name}` : 'Module';
    const subGrpStr = listMode === 'subgroup' ? ` | Sous-groupe: ${selectedSubGroup}` : ' | Section Complète (CM)';

    let text = `🏛️ *ÉCOLE NATIONALE DE COMMERCE ET DE GESTION — ENCG FÈS*\n`;
    text += `📋 *Feuille d'Appel & Présences — ${selectedSeance}*\n`;
    text += `📅 *Date* : ${seanceDate}\n`;
    text += `📚 *Module* : ${moduleName}\n`;
    text += `👥 *Groupe* : ${groupName} (${filiereName})${subGrpStr}\n`;
    if (profName) text += `👨‍🏫 *Enseignant* : Pr. ${profName}\n`;
    text += `────────────────────────────────\n`;
    text += `📊 *Statistiques Séance* :\n`;
    text += `• Inscrits : ${stats.total}\n`;
    text += `• Présents : ${stats.present} (${stats.rate}%)\n`;
    text += `• Absents : ${stats.absent}\n`;
    text += `────────────────────────────────\n`;

    if (whatsAppType === 'absents_only') {
      const absents = students.filter(s => absentIds.has(s.id));
      text += `❌ *LISTE DES ABSENTS (${absents.length})* :\n`;
      if (absents.length === 0) {
        text += `✨ Aucun absent ! 100% de présence enregistrée.\n`;
      } else {
        absents.forEach((s, idx) => {
          const ann = annotations[s.id];
          const tagInfo = ann?.tag ? ` [${TAG_CONFIG[ann.tag].label}]` : '';
          const noteInfo = ann?.text ? ` (${ann.text})` : '';
          text += `${idx + 1}. ${(s.last_name || '').toUpperCase()} ${s.first_name} (Matr: ${s.matricule || '—'})${tagInfo}${noteInfo}\n`;
        });
      }
    } else {
      text += `📝 *LISTE COMPLÈTE DE L'APPEL* :\n`;
      students.forEach((s, idx) => {
        const isAbs = absentIds.has(s.id);
        const ann = annotations[s.id];
        const status = isAbs ? '❌ ABSENT' : '✅ PRÉSENT';
        const tagInfo = ann?.tag ? ` [${TAG_CONFIG[ann.tag].label}]` : '';
        const noteInfo = ann?.text ? ` (${ann.text})` : '';
        text += `${idx + 1}. ${status} — ${(s.last_name || '').toUpperCase()} ${s.first_name}${tagInfo}${noteInfo}\n`;
      });
    }

    text += `────────────────────────────────\n`;
    text += `_Rapport certifié généré via Portail Enseignant ENCG Fès_`;
    return text;
  }, [selectedSection, selectedModule, listMode, selectedSubGroup, selectedSeance, seanceDate, profName, stats, whatsAppType, students, absentIds, annotations]);

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(generatedWhatsAppText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener');
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generatedWhatsAppText).then(() => {
      toast.success('Rapport WhatsApp copié dans le presse-papiers');
    }).catch(() => toast.error('Impossible de copier le message'));
  };

  // Print individual sheet
  const handlePrintIndividualSheet = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* ─── Sticky Header ────────────────────────────────────────────── */}
      <div className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Listes d'Étudiants & Émargement
                  </h1>
                  {isLocked && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> Verrouillé
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  لوائح الطلبة وأوراق الحضور الرسمية — {profName || 'Professeur ENCG'}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View layout toggle */}
              <div className="flex rounded-lg overflow-hidden border border-slate-700/80 bg-slate-800/80 p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  title="Vue Tableau"
                  className={cn(
                    'p-1.5 rounded transition-all',
                    viewMode === 'table' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  title="Vue Cartes / Trombinoscope"
                  className={cn(
                    'p-1.5 rounded transition-all',
                    viewMode === 'cards' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {/* Stats panel toggle */}
              <button
                onClick={() => setShowStats(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  showStats
                    ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stats</span>
              </button>

              {/* QR Code toggle */}
              <button
                onClick={() => setShowQrCol(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  showQrCol
                    ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
                )}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">QR</span>
              </button>

              {/* Lock Button */}
              <button
                onClick={toggleLock}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  isLocked
                    ? 'bg-amber-600/25 border-amber-500/50 text-amber-300 hover:bg-amber-600/35'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
                )}
                title={isLocked ? 'Déverrouiller la feuille de présence' : 'Geler la liste pour éviter les modifications accidentelles'}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isLocked ? 'Verrouillé' : 'Verrouiller'}</span>
              </button>

              {/* Refresh */}
              <button
                onClick={fetchStudents}
                disabled={loadingStudents || !selectedGroupId}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition-all disabled:opacity-40"
                title="Actualiser la liste"
              >
                <RefreshCw className={cn('w-4 h-4', loadingStudents && 'animate-spin')} />
              </button>

              {/* WhatsApp Share Button */}
              <button
                onClick={() => setShowWhatsAppModal(true)}
                disabled={students.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all disabled:opacity-40"
                title="Partager le compte-rendu sur WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">WhatsApp</span>
              </button>

              {/* PDF Preview Button */}
              <button
                onClick={handleOpenPdfPreview}
                disabled={!selectedGroupId || students.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all disabled:opacity-40"
                title="Aperçu du PDF officiel dans un lecteur intégré"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Aperçu PDF</span>
              </button>

              {/* Print / Export PDF Modal */}
              <button
                onClick={() => setShowPdfModal(true)}
                disabled={!selectedGroupId || students.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {loadingOptions ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : !options?.modules?.length ? (
          <NoModulesPlaceholder />
        ) : (
          <>
            {/* ─── 1. Sélecteur de Séance & Date ───────────────────────── */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Séance d'enseignement :</span>
                  </div>

                  {/* Séance pills S1 → S12 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {SEANCES.map(s => {
                      const seanceInfo = seanceStore[s];
                      const hasData = seanceInfo && (seanceInfo.absentIds?.length > 0 || Object.keys(seanceInfo.annotations || {}).length > 0);
                      const isCurrent = selectedSeance === s;

                      return (
                        <button
                          key={s}
                          onClick={() => handleSelectSeance(s)}
                          className={cn(
                            'relative px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5',
                            isCurrent
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                              : 'bg-slate-800/90 border-slate-700/80 text-slate-400 hover:border-emerald-500/60 hover:text-emerald-300'
                          )}
                        >
                          <span>{s}</span>
                          {hasData && (
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isCurrent ? 'bg-white' : 'bg-emerald-400'
                              )}
                              title="Données enregistrées pour cette séance"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Picker + Status */}
                <div className="flex items-center gap-3 ml-auto flex-wrap">
                  <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1">
                    <span className="text-xs text-slate-400 font-medium">Date :</span>
                    <input
                      type="date"
                      value={seanceDate}
                      disabled={isLocked}
                      onChange={e => {
                        const d = e.target.value;
                        setSeanceDate(d);
                        persistCurrentSeance(absentIds, annotations, isLocked, d);
                      }}
                      className="bg-transparent text-xs text-white focus:outline-none disabled:opacity-60 cursor-pointer"
                    />
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        const today = new Date().toISOString().slice(0, 10);
                        setSeanceDate(today);
                        persistCurrentSeance(absentIds, annotations, isLocked, today);
                      }}
                      className="text-[11px] text-emerald-400 hover:underline font-semibold ml-1 disabled:opacity-40"
                    >
                      Aujourd'hui
                    </button>
                  </div>

                  {/* Séance summary badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/70 text-slate-300 font-mono">
                      {absentIds.size === 0 ? (
                        <span className="text-emerald-400">Plein effectif (0 absent)</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">{absentIds.size} absent{absentIds.size > 1 ? 's' : ''}</span>
                      )}
                    </span>

                    {/* Save to DB Button */}
                    <button
                      onClick={handleSaveAttendanceToDb}
                      disabled={savingAttendance || !selectedGroupId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
                      title="Persister la feuille d'émargement en base de données"
                    >
                      {savingAttendance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingAttendance ? 'Enregistrement…' : 'Enregistrer en BDD'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Pedagogical Filters ──────────────────────────────────── */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Sélection Pédagogique (Modules & Groupes)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Module / Matière</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={selectedModuleId ?? ''}
                      onChange={e => setSelectedModuleId(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      {options.modules.map(m => (
                        <option key={m.module_id} value={m.module_id}>
                          {m.module_code} — {m.module_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Section (Amphi / Filière)</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={selectedGroupId ?? ''}
                      onChange={e => setSelectedGroupId(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      {selectedModule?.sections.map(s => (
                        <option key={s.group_id} value={s.group_id}>
                          {s.group_code} — {s.filiere_name} ({s.semester})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Format d'enseignement</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                    <button
                      onClick={() => setListMode('section')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all',
                        listMode === 'section'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      )}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Cours Magistral (CM)</span>
                    </button>
                    <button
                      onClick={() => setListMode('subgroup')}
                      disabled={availableSubGroups.length === 0}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all disabled:opacity-40',
                        listMode === 'subgroup'
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      )}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>TD / TP</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Sous-groupe TD Officiel</label>
                  {listMode === 'subgroup' && availableSubGroups.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {availableSubGroups.map(sg => (
                        <button
                          key={sg}
                          onClick={() => setSelectedSubGroup(sg)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-bold border transition-all',
                            selectedSubGroup === sg
                              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-300'
                          )}
                        >
                          {sg}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-10 flex items-center">
                      <span className="text-slate-500 text-xs italic">
                        {listMode === 'section' ? 'Section complète (Amphithéâtre)' : 'Aucun sous-groupe assigné'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Stats Panel ─────────────────────────────────────────── */}
            {showStats && students.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard label="Total inscrits" value={stats.total} icon="👥" color="slate" />
                <StatCard label="Présents" value={stats.present} icon="✅" color="emerald" />
                <StatCard label="Absents" value={stats.absent} icon="❌" color="rose" />
                <StatCard label="Taux de présence" value={`${stats.rate}%`} icon="📊" color="sky" />
                <StatCard label="Annotations / Notes" value={stats.annotatedCount} icon="📝" color="amber" />
              </div>
            )}

            {/* ─── 4. Toolbar & Quick Filters ─────────────────────────── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Quick Attendance Filter Buttons */}
                <div className="flex rounded-lg overflow-hidden border border-slate-700/80 bg-slate-800/80 p-0.5 text-xs">
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    className={cn(
                      'px-3 py-1.5 font-semibold rounded transition-all flex items-center gap-1.5',
                      attendanceFilter === 'all'
                        ? 'bg-slate-700 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    <span>Tous</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">{students.length}</span>
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('present')}
                    className={cn(
                      'px-3 py-1.5 font-semibold rounded transition-all flex items-center gap-1.5',
                      attendanceFilter === 'present'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-emerald-300'
                    )}
                  >
                    <span>✅ Présents</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">{stats.present}</span>
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('absent')}
                    className={cn(
                      'px-3 py-1.5 font-semibold rounded transition-all flex items-center gap-1.5',
                      attendanceFilter === 'absent'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-rose-300'
                    )}
                  >
                    <span>❌ Absents</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">{stats.absent}</span>
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('annotated')}
                    className={cn(
                      'px-3 py-1.5 font-semibold rounded transition-all flex items-center gap-1.5',
                      attendanceFilter === 'annotated'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-amber-300'
                    )}
                  >
                    <span>📝 Avec Note</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">{stats.annotatedCount}</span>
                  </button>
                </div>

                {absentIds.size > 0 && (
                  <button
                    onClick={resetAbsences}
                    disabled={isLocked}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-40 ml-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset séance {selectedSeance}</span>
                  </button>
                )}
              </div>

              {/* Search & Export Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nom, Matricule, CNE…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors w-48"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleCopyList}
                  disabled={filteredStudents.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 text-xs font-semibold transition-all disabled:opacity-40"
                  title="Copier la liste filtrée dans le presse-papiers"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Copier</span>
                </button>

                <button
                  onClick={handleDownloadExcel}
                  disabled={downloadingExcel || students.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 text-xs font-semibold transition-all disabled:opacity-40"
                >
                  {downloadingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className="hidden sm:inline">Excel</span>
                </button>
              </div>
            </div>

            {/* ─── Student List Section ────────────────────────────────── */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-slate-400 text-sm">Chargement de la liste officielle…</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <UserCheck className="w-12 h-12 text-slate-700" />
                  <p className="text-slate-400 text-sm">Aucun étudiant ne correspond aux filtres sélectionnés</p>
                  {(searchQuery || attendanceFilter !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setAttendanceFilter('all'); }}
                      className="text-emerald-400 text-xs hover:underline font-medium"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : viewMode === 'cards' ? (
                /* ─── Cards / Trombinoscope View ──────────────────────── */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredStudents.map((s, idx) => {
                    const isAbsent = absentIds.has(s.id);
                    const ann = annotations[s.id];
                    const tagStyle = ann?.tag ? TAG_CONFIG[ann.tag] : null;

                    return (
                      <div
                        key={s.id}
                        className={cn(
                          'rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all relative',
                          isAbsent
                            ? 'bg-rose-950/25 border-rose-700/40 shadow-inner'
                            : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 shadow-sm'
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow',
                                  isAbsent ? 'bg-rose-700' : 'bg-gradient-to-br from-emerald-600 to-teal-600'
                                )}
                              >
                                {(s.last_name?.[0] || '?').toUpperCase()}
                              </div>
                              <div>
                                <p className={cn('font-semibold text-sm leading-tight', isAbsent ? 'text-rose-200' : 'text-white')}>
                                  {(s.last_name || '').toUpperCase()} {s.first_name}
                                </p>
                                <p className="text-slate-400 text-xs font-mono">{s.matricule || '—'}</p>
                              </div>
                            </div>
                            <span className="text-slate-500 text-[11px] font-mono">#{idx + 1}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                            <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800">
                              <p className="text-slate-500 text-[9px] uppercase font-semibold">CNE / Massar</p>
                              <p className="text-slate-300 font-mono truncate">{s.cne || s.massar_code || '—'}</p>
                            </div>
                            <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800">
                              <p className="text-slate-500 text-[9px] uppercase font-semibold">CIN</p>
                              <p className="text-slate-300 font-mono truncate">{s.cin || '—'}</p>
                            </div>
                          </div>

                          {/* Annotation preview pill */}
                          {ann && (
                            <div
                              onClick={() => openAnnotationEditor(s)}
                              className={cn(
                                'cursor-pointer mb-2 px-2.5 py-1 rounded-lg border text-[11px] flex items-center justify-between gap-1.5 transition-all',
                                tagStyle ? `${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}` : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                              )}
                              title="Cliquer pour modifier la note"
                            >
                              <div className="flex items-center gap-1 truncate">
                                <span className="font-semibold">{tagStyle?.label || 'Note'} :</span>
                                <span className="truncate">{ann.text || '—'}</span>
                              </div>
                              <Pencil className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
                            </div>
                          )}
                        </div>

                        {/* Card bottom actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                          <div className="flex items-center gap-1.5">
                            {/* Individual Sheet button */}
                            <button
                              onClick={() => setIndividualStudent(s)}
                              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Fiche individuelle d'émargement / rattrapage"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            </button>

                            {/* Annotation trigger */}
                            <button
                              onClick={() => openAnnotationEditor(s)}
                              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
                              title="Ajouter / éditer une note"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Absence toggle */}
                          <button
                            onClick={() => toggleAbsent(s.id)}
                            disabled={isLocked}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border disabled:opacity-50',
                              isAbsent
                                ? 'bg-rose-600 border-rose-500 text-white'
                                : 'bg-slate-700/90 border-slate-600 text-slate-300 hover:border-rose-500 hover:text-rose-400'
                            )}
                          >
                            <UserX className="w-3 h-3" />
                            <span>{isAbsent ? 'Absent' : 'Présent'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ─── Official Table View ─────────────────────────────── */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">N°</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Matricule</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">CNE / Massar</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">CIN</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nom & Prénom</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Section / TD</th>
                        {showQrCol && (
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">QR</th>
                        )}
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Note / Justificatif</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Émargement ({selectedSeance})</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-12">Fiche</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => {
                        const isAbsent = absentIds.has(s.id);
                        const ann = annotations[s.id];
                        const tagStyle = ann?.tag ? TAG_CONFIG[ann.tag] : null;

                        return (
                          <tr
                            key={s.id}
                            className={cn(
                              'border-b border-slate-800/60 transition-colors',
                              isAbsent
                                ? 'bg-rose-950/20 text-rose-100 hover:bg-rose-950/30'
                                : idx % 2 === 0 ? 'hover:bg-slate-800/40' : 'bg-slate-900/30 hover:bg-slate-800/40'
                            )}
                          >
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-slate-800/90 border border-slate-700/80 rounded px-2 py-0.5 text-slate-300">
                                {s.matricule || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-slate-300 text-xs font-mono">{s.cne || '—'}</span>
                                {s.massar_code && s.massar_code !== s.cne && (
                                  <span className="text-slate-500 text-[10px] font-mono">{s.massar_code}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">{s.cin || '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                                    isAbsent ? 'bg-rose-700 text-white' : 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
                                  )}
                                >
                                  {(s.last_name?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                  <p className={cn('font-semibold text-sm', isAbsent ? 'text-rose-200 line-through' : 'text-white')}>
                                    {(s.last_name || '').toUpperCase()} {s.first_name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                                  {s.section || selectedSection?.group_code || '—'}
                                </span>
                                {s.sub_group && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
                                    {s.sub_group}
                                  </span>
                                )}
                              </div>
                            </td>

                            {showQrCol && (
                              <td className="px-3 py-2 text-center">
                                <img
                                  src={generateQrDataUrl(s.matricule || String(s.id))}
                                  alt={`QR ${s.matricule}`}
                                  className="w-9 h-9 mx-auto rounded opacity-85 border border-slate-700"
                                  loading="lazy"
                                />
                              </td>
                            )}

                            {/* Annotation Cell */}
                            <td className="px-3 py-2 text-center">
                              {ann ? (
                                <button
                                  onClick={() => openAnnotationEditor(s)}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-all max-w-[130px] truncate',
                                    tagStyle ? `${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}` : 'bg-slate-800 border-slate-700 text-slate-300'
                                  )}
                                  title={`${tagStyle?.label || 'Note'} : ${ann.text || ''}`}
                                >
                                  <span className="truncate">{tagStyle?.label || ann.text}</span>
                                  <Pencil className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => openAnnotationEditor(s)}
                                  disabled={isLocked}
                                  className="text-slate-600 hover:text-amber-400 p-1 rounded transition-colors disabled:opacity-30"
                                  title="Ajouter une remarque ou justificatif"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>

                            {/* Presence Toggle */}
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleAbsent(s.id)}
                                disabled={isLocked}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50',
                                  isAbsent
                                    ? 'bg-rose-600/25 border-rose-500/50 text-rose-300 hover:bg-rose-600 hover:text-white'
                                    : 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400 hover:bg-rose-600/15 hover:border-rose-500/30 hover:text-rose-400'
                                )}
                              >
                                {isAbsent ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Absent</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Présent</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Individual Sheet trigger */}
                            <td className="px-2 py-3 text-center">
                              <button
                                onClick={() => setIndividualStudent(s)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                                title="Générer la fiche d'émargement individuelle"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Table Footer */}
                  <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <p className="text-slate-400">
                      Affichage de <span className="text-white font-semibold">{filteredStudents.length}</span> étudiant{filteredStudents.length !== 1 ? 's' : ''}
                      {searchQuery && ` (sur un total de ${students.length})`}
                      {listMode === 'subgroup' && selectedSubGroup ? ` — Sous-groupe officiel ${selectedSubGroup}` : ' — Section Complète (Amphi CM)'}
                      {absentIds.size > 0 && (
                        <span className="text-rose-400 ml-2 font-semibold">· {absentIds.size} absent{absentIds.size > 1 ? 's' : ''} marqués pour {selectedSeance}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Info className="w-3.5 h-3.5" />
                      <span>Conforme nomenclature ministérielle MESRSFC & règlement intérieur ENCG Fès</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── 5. PDF Modal (Config & Options) ─────────────────────────── */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Fiche d'Émargement Officielle</h2>
                  <p className="text-slate-400 text-xs">Format PDF A4 conforme — ENCG Fès / USMBA</p>
                </div>
              </div>
              <button onClick={() => setShowPdfModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              {/* Summary info */}
              <div className="bg-slate-800/60 rounded-xl p-4 space-y-2 border border-slate-700/60">
                <div className="flex justify-between">
                  <span className="text-slate-400">Section / Groupe</span>
                  <span className="text-white font-medium">{selectedSection?.group_code} — {selectedSection?.filiere_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Format d'enseignement</span>
                  <span className="text-white font-medium">{listMode === 'section' ? 'Cours Magistral (Amphi)' : `TD — Sous-groupe ${selectedSubGroup}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Effectif à exporter</span>
                  <span className="text-emerald-400 font-bold">{students.length} étudiants</span>
                </div>
                {absentIds.size > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Absents actuels ({selectedSeance})</span>
                    <span className="text-rose-400 font-bold">{absentIds.size} absent(s) marqués</span>
                  </div>
                )}
              </div>

              {/* Mode picker */}
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2.5">Type de document</p>
                <div className="grid grid-cols-2 gap-3">
                  <PdfModeCard
                    active={pdfMode === 'emargement'}
                    onClick={() => setPdfMode('emargement')}
                    icon={<FileText className="w-5 h-5" />}
                    title="Fiche d'Émargement"
                    subtitle="Signature individuelle par séance"
                  />
                  <PdfModeCard
                    active={pdfMode === 'seances'}
                    onClick={() => setPdfMode('seances')}
                    icon={<BarChart3 className="w-5 h-5" />}
                    title="Grille 10 Séances"
                    subtitle="Présence S1 → S10 synthèse"
                  />
                </div>
              </div>

              {/* Orientation picker */}
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2.5">Orientation A4</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPdfOrientation('portrait')}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      pdfOrientation === 'portrait'
                        ? 'bg-emerald-600/15 border-emerald-500/60 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    <div className={cn('w-6 h-8 rounded border-2 flex-shrink-0', pdfOrientation === 'portrait' ? 'border-emerald-400' : 'border-slate-600')} />
                    <div className="text-left">
                      <p className={cn('text-sm font-semibold', pdfOrientation === 'portrait' ? 'text-white' : 'text-slate-300')}>Portrait</p>
                      <p className="text-[11px] text-slate-500">Vertical (Standard)</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPdfOrientation('paysage')}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      pdfOrientation === 'paysage'
                        ? 'bg-emerald-600/15 border-emerald-500/60 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    <div className={cn('w-8 h-6 rounded border-2 flex-shrink-0', pdfOrientation === 'paysage' ? 'border-emerald-400' : 'border-slate-600')} />
                    <div className="text-left">
                      <p className={cn('text-sm font-semibold', pdfOrientation === 'paysage' ? 'text-white' : 'text-slate-300')}>Paysage</p>
                      <p className="text-[11px] text-slate-500">Horizontal (Idéal grille)</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 border-t border-slate-800 bg-slate-900/90">
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  handleOpenPdfPreview();
                }}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <Eye className="w-4 h-4" />
                <span>Voir l'aperçu d'abord</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-60"
                >
                  {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Télécharger PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. PDF Live Preview Iframe Modal ───────────────────────── */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in">
          {/* Preview Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/95">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm">
                    Aperçu Fiche d'Émargement — {selectedSection?.group_code} ({selectedSeance})
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {pdfOrientation.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Visualisation directe avant impression ou téléchargement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </button>
              <button
                onClick={handleClosePdfPreview}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Fermer l'aperçu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Body */}
          <div className="flex-1 w-full relative bg-slate-950 flex items-center justify-center">
            {loadingPdfPreview ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-sm font-medium">Génération du document officiel en cours…</p>
              </div>
            ) : pdfPreviewBlobUrl ? (
              <iframe
                src={pdfPreviewBlobUrl}
                className="w-full h-full border-0"
                title="Aperçu PDF Émargement"
              />
            ) : (
              <div className="text-slate-400 text-sm">Impossible d'afficher le document</div>
            )}
          </div>
        </div>
      )}

      {/* ─── 6. WhatsApp Share Modal ─────────────────────────────────── */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Partage Rapport WhatsApp</h2>
                  <p className="text-slate-400 text-xs">Transmission immédiate aux délégués ou à la scolarité</p>
                </div>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              {/* Format selection */}
              <div>
                <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">
                  Format du rapport
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWhatsAppType('absents_only')}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      whatsAppType === 'absents_only'
                        ? 'bg-emerald-600/15 border-emerald-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    )}
                  >
                    <p className="font-semibold text-xs text-white">Rapport des Absents</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Idéal pour le délégué ({absentIds.size} absents)</p>
                  </button>

                  <button
                    onClick={() => setWhatsAppType('full_roster')}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      whatsAppType === 'full_roster'
                        ? 'bg-emerald-600/15 border-emerald-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    )}
                  >
                    <p className="font-semibold text-xs text-white">Appel Complet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tous les étudiants (✅ & ❌)</p>
                  </button>
                </div>
              </div>

              {/* Message preview */}
              <div>
                <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-1.5">
                  Aperçu du message formaté
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 max-h-52 overflow-y-auto whitespace-pre-wrap select-all">
                  {generatedWhatsAppText}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 border-t border-slate-800 bg-slate-900/90">
              <button
                onClick={handleCopyWhatsApp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Copier le texte</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ouvrir WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Annotation Editor Modal ─────────────────────────────── */}
      {editingStudentId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Annotation Étudiant</h3>
                  <p className="text-slate-400 text-xs">Séance {selectedSeance} — {seanceDate}</p>
                </div>
              </div>
              <button onClick={() => setEditingStudentId(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tag Quick Select */}
            <div>
              <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">
                Catégorie rapide
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(TAG_CONFIG) as [AnnotationTag, typeof TAG_CONFIG[AnnotationTag]][]).map(([t, cfg]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditNoteTag(t)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all text-center',
                      editNoteTag === t
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-amber-500/40`
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    )}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note text */}
            <div>
              <label className="block text-xs text-slate-400 uppercase font-semibold tracking-wider mb-1.5">
                Remarque ou motif (justificatif, retard…)
              </label>
              <textarea
                rows={3}
                value={editNoteText}
                onChange={e => setEditNoteText(e.target.value)}
                placeholder="Ex: Certificat médical déposé, retard de 20min autorisé, dispense exceptionnelle…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {annotations[editingStudentId] ? (
                <button
                  type="button"
                  onClick={() => removeAnnotation(editingStudentId)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Supprimer
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudentId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveAnnotation}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-950/40"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. Individual Student Sheet Modal (Export Individuel) ───── */}
      {individualStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm">
                    Fiche Individuelle d'Émargement & Rattrapage
                  </h2>
                  <p className="text-slate-400 text-xs">
                    {(individualStudent.last_name || '').toUpperCase()} {individualStudent.first_name} — Matricule: {individualStudent.matricule || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintIndividualSheet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>Imprimer (A4)</span>
                </button>
                <button
                  onClick={() => setIndividualStudent(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div id="individual-printable-sheet" className="p-6 overflow-y-auto bg-slate-950/60 text-slate-200 space-y-5">
              {/* Document Header (ENCG Fès Style) */}
              <div className="text-center pb-4 border-b border-slate-800">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Royaume du Maroc</p>
                <p className="text-xs text-slate-300 font-medium">Université Sidi Mohamed Ben Abdellah — Fès</p>
                <h3 className="text-sm font-bold text-emerald-400 mt-1">
                  École Nationale de Commerce et de Gestion de Fès
                </h3>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-white uppercase tracking-wider">
                  Fiche Individuelle de Présence & d'Émargement
                </div>
              </div>

              {/* Student & Course Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 mb-1">Identité Étudiant</p>
                  <div><span className="text-slate-400">Nom & Prénom :</span> <span className="text-white font-bold">{(individualStudent.last_name || '').toUpperCase()} {individualStudent.first_name}</span></div>
                  <div><span className="text-slate-400">Matricule :</span> <span className="text-white font-mono">{individualStudent.matricule || '—'}</span></div>
                  <div><span className="text-slate-400">CNE / Massar :</span> <span className="text-white font-mono">{individualStudent.cne || individualStudent.massar_code || '—'}</span></div>
                  <div><span className="text-slate-400">CIN :</span> <span className="text-white font-mono">{individualStudent.cin || '—'}</span></div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 mb-1">Affectation Pédagogique</p>
                  <div><span className="text-slate-400">Module :</span> <span className="text-white font-semibold">{selectedModule?.module_code} — {selectedModule?.module_name}</span></div>
                  <div><span className="text-slate-400">Section :</span> <span className="text-white font-medium">{selectedSection?.group_code} ({selectedSection?.filiere_name})</span></div>
                  <div><span className="text-slate-400">Sous-groupe TD :</span> <span className="text-white font-medium">{individualStudent.sub_group || selectedSubGroup || 'Section Complète'}</span></div>
                  <div><span className="text-slate-400">Enseignant :</span> <span className="text-white font-medium">Pr. {profName || 'ENCG Fès'}</span></div>
                </div>
              </div>

              {/* Status on current session */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Statut actuel ({selectedSeance} — {seanceDate}) :</p>
                  <p className="text-sm font-bold mt-0.5">
                    {absentIds.has(individualStudent.id) ? (
                      <span className="text-rose-400">❌ Absent non justifié</span>
                    ) : (
                      <span className="text-emerald-400">✅ Présent & Régulier</span>
                    )}
                  </p>
                  {annotations[individualStudent.id] && (
                    <p className="text-xs text-amber-300 mt-1">
                      Remarque : {annotations[individualStudent.id].text} ({annotations[individualStudent.id].tag || 'Note'})
                    </p>
                  )}
                </div>
                <img
                  src={generateQrDataUrl(individualStudent.matricule || String(individualStudent.id))}
                  alt="QR Étudiant"
                  className="w-14 h-14 rounded-lg border border-slate-700 bg-slate-900 p-1"
                />
              </div>

              {/* Grid 10 Sessions Emargement / Rattrapage Table */}
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-2">Grille de validation des séances (1 à 10) :</p>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {SEANCES.slice(0, 10).map(s => {
                    const seanceData = seanceStore[s];
                    const isAbs = seanceData?.absentIds?.includes(individualStudent.id);
                    const isPassed = !!seanceData;

                    return (
                      <div key={s} className="border border-slate-800 bg-slate-900/80 rounded-lg p-2 flex flex-col justify-between h-20">
                        <span className="font-bold text-slate-300">{s}</span>
                        <div className="text-[10px]">
                          {isPassed ? (
                            isAbs ? <span className="text-rose-400 font-bold">ABS</span> : <span className="text-emerald-400 font-bold">PRÉSENT</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </div>
                        <div className="border-t border-slate-800/80 pt-1 text-[9px] text-slate-500 italic">
                          Émargement
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signatures & Seal Zone */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs text-center">
                <div>
                  <p className="font-semibold text-slate-400 mb-10">Signature de l'Étudiant(e)</p>
                  <p className="text-[10px] text-slate-500">Précédé de la mention « Lu et approuvé »</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400 mb-10">Visa & Cachet de l'Enseignant</p>
                  <p className="text-[10px] text-slate-500">Fait à Fès, le {seanceDate}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
              <button
                onClick={() => setIndividualStudent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
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

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: 'slate' | 'emerald' | 'rose' | 'sky' | 'amber';
}) {
  const borderMap = {
    slate: 'border-slate-800/80',
    emerald: 'border-emerald-500/30',
    rose: 'border-rose-500/30',
    sky: 'border-sky-500/30',
    amber: 'border-amber-500/30',
  };

  return (
    <div className={cn('bg-slate-900/80 border rounded-xl p-4 flex flex-col gap-2 shadow', borderMap[color])}>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function PdfModeCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all',
        active
          ? 'bg-emerald-600/15 border-emerald-500/60 ring-1 ring-emerald-500/40'
          : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
      )}
    >
      {active && <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-emerald-400" />}
      <div className={cn('p-1.5 rounded-lg', active ? 'text-emerald-400' : 'text-slate-500')}>{icon}</div>
      <div>
        <p className={cn('text-sm font-semibold', active ? 'text-white' : 'text-slate-300')}>{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
      </div>
    </button>
  );
}

function NoModulesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
        <ShieldAlert className="w-12 h-12 text-amber-400" />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-white font-semibold text-lg mb-2">Aucun module affecté</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Vous n'avez pas encore de modules pédagogiques affectés pour cette année universitaire. Veuillez contacter la direction des études de l'ENCG Fès.
        </p>
      </div>
    </div>
  );
}
