import { QRCodeSVG } from 'qrcode.react'
import React,{ useState,useEffect,useCallback,useMemo } from 'react';
import {
Users,BookOpen,FileSpreadsheet,Search,Loader2,
ChevronDown,GraduationCap,Layers,ClipboardList,Filter,
UserCheck,ShieldAlert,RefreshCw,Printer,Info,
FileText,X,CheckCircle2,BarChart3,Download,Copy,
LayoutGrid,LayoutList,UserX,RotateCcw,QrCode,
Lock,Unlock,MessageCircle,Eye,Calendar,Pencil,
Tag,PrinterIcon,Save,Sparkles,AlertTriangle,Clock,
Radio,Smartphone,CheckCheck,Maximize2,Minimize2,Zap,
Mic,MicOff,Volume2,CheckSquare,CalendarDays,Play,Check,Wifi,WifiOff,
History,Plus,Trash2,ArrowRight
} from 'lucide-react';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@shared/lib/utils';
import { offlineAttendanceStore } from '@/shared/lib/offlineAttendanceStore';

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
type ViewMode = 'table' | 'cards' | 'voice';
type AttendanceFilter = 'all' | 'present' | 'absent' | 'annotated';
type AnnotationTag = 'justifie' | 'retard' | 'exclusion' | 'rattrapage' | 'remarque';

interface StudentAnnotation {
  text: string;
  tag?: AnnotationTag;
}

export interface RattrapageAttendanceRecord {
  studentId: number;
  status: 'present' | 'absent' | 'retard' | 'excuse';
  note?: string;
  regularized?: boolean;
}

export interface RattrapageSession {
  id: string;
  originalSeance: string;
  date: string;
  timeSlot: string;
  room: string;
  title: string;
  records: RattrapageAttendanceRecord[];
  createdAt: string;
}

interface SeanceData {
  absentIds: number[];
  annotations: Record<number, StudentAnnotation>;
  isLocked: boolean;
  date: string;
  savedAt?: string;
  isSavedToDb?: boolean;
  session_id?: number;
  rattrapages?: RattrapageSession[];
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

interface ScheduleItem {
  id: number;
  module_id: number;
  module_code: string;
  module_name: string;
  group_id: number;
  group_code: string;
  filiere_name?: string;
  semester?: string;
  day_of_week: number; // 1=Monday … 7=Sunday
  day_name: string;   // "Lundi", "Mardi"…
  start_time: string; // "08:00"
  end_time: string;
  room?: string;
  type: string;       // "CM", "TD", "TP"
  sub_groups?: string[];
}

/** Returns the date (YYYY-MM-DD) of the given ISO day within the current academic week (Monday to Saturday). */
function getDateForScheduleDay(dayOfWeek: number): string {
  const today = new Date();
  const todayJs = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const currentIsoDay = todayJs === 0 ? 7 : todayJs; // 1=Mon ... 7=Sun

  // Calculate Monday of current academic week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentIsoDay - 1));

  // Target day within current week
  const target = new Date(monday);
  target.setDate(monday.getDate() + (dayOfWeek - 1));

  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_COLORS: Record<number, { bg: string; border: string; text: string; dot: string }> = {
  1: { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300',   dot: 'bg-blue-400' },
  2: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-300', dot: 'bg-violet-400' },
  3: { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-300',dot: 'bg-emerald-400' },
  4: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-300',  dot: 'bg-amber-400' },
  5: { bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-300',   dot: 'bg-rose-400' },
  6: { bg: 'bg-pink-500/10',   border: 'border-pink-500/30',   text: 'text-pink-300',   dot: 'bg-pink-400' },
  7: { bg: 'bg-slate-500/10',  border: 'border-slate-500/30',  text: 'text-slate-300',  dot: 'bg-slate-400' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfessorStudentRosterPage() {
  const { user } = useAuthStore();
  const u = user as any;
  const profName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || '' : '';

  const [options, setOptions] = useState<OptionsPayload | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Schedule-based group selection
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

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

  // 8. Backend Persistence State & Textbook Sync
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingAttendanceHistory, setLoadingAttendanceHistory] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [syncTextbook, setSyncTextbook] = useState(true);
  const [customChapterTitle, setCustomChapterTitle] = useState('');
  const [customKeyConcepts, setCustomKeyConcepts] = useState('');

  // 9. AI Copilot & Predictive Attendance Risk
  const [isGeneratingAiSuggestion, setIsGeneratingAiSuggestion] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [loadingRiskAnalysis, setLoadingRiskAnalysis] = useState(false);
  const [riskData, setRiskData] = useState<any>(null);

  // 10. Solutions 1, 2, 3: Live Auto-Detection, Timeline & Smart QR Check-in
  const [showLiveQrModal, setShowLiveQrModal] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(15);
  const [qrRotator, setQrRotator] = useState(0);
  const [qrCheckedInIds, setQrCheckedInIds] = useState<Set<number>>(new Set());
  const [isFullscreenQr, setIsFullscreenQr] = useState(false);

  // 11. Voice Dictation IA (Mode Appel Vocal - merged from ProfessorAbsencesView)
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // 12. Live Session (4-status, backend QR token, offline sync)
  type StudentStatus = 'present' | 'absent' | 'retard' | 'excuse';
  interface LiveStudent {
    id: number; first_name: string; last_name: string; cne: string;
    status: StudentStatus; version?: number;
  }
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([]);
  const [liveSessionId, setLiveSessionId] = useState<number | null>(null);
  const [liveQrToken, setLiveQrToken] = useState('');
  const [liveQrExpiresAt, setLiveQrExpiresAt] = useState<string | null>(null);
  const [liveQrCountdown, setLiveQrCountdown] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [savingLive, setSavingLive] = useState(false);
  const [activeVoiceTab, setActiveVoiceTab] = useState<'trombi' | 'qr' | 'voice'>('trombi');
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');

  // 13. Rattrapage (Séance de Rattrapage & Appel des Absents)
  const [showRattrapageModal, setShowRattrapageModal] = useState(false);
  const [rattrapageTargetSeance, setRattrapageTargetSeance] = useState<string>('S1');
  const [rattrapageDate, setRattrapageDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rattrapageTime, setRattrapageTime] = useState<string>('14:00 - 16:00');
  const [rattrapageRoom, setRattrapageRoom] = useState<string>('Salle de Rattrapage');
  const [rattrapageTitle, setRattrapageTitle] = useState<string>('');
  const [rattrapageStudents, setRattrapageStudents] = useState<{
    student: StudentRow;
    status: 'present' | 'absent' | 'retard' | 'excuse';
    note: string;
    regularize: boolean;
  }[]>([]);
  const [rattrapageTab, setRattrapageTab] = useState<'call' | 'qr' | 'history'>('call');
  const [autoRegularizeOriginal, setAutoRegularizeOriginal] = useState<boolean>(true);
  const [savingRattrapage, setSavingRattrapage] = useState(false);
  const [rattrapageSearchQuery, setRattrapageSearchQuery] = useState('');
  const [rattrapageStatusFilter, setRattrapageStatusFilter] = useState<'all' | 'absent' | 'present'>('all');
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<number | null>(null);
  const [rattrapageQrCountdown, setRattrapageQrCountdown] = useState(15);
  const [rattrapageQrCheckedInIds, setRattrapageQrCheckedInIds] = useState<Set<number>>(new Set());
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
        // Only keep sessions with actual recorded data or saved in DB
        const cleaned: Record<string, SeanceData> = {};
        Object.entries(parsed).forEach(([code, data]: [string, any]) => {
          const isSaved = !!data.isSavedToDb || !!data.session_id;
          const hasAbsents = Array.isArray(data.absentIds) && data.absentIds.length > 0;
          const isLocked = !!data.isLocked;
          if (isSaved || hasAbsents || isLocked) {
            cleaned[code] = data;
          }
        });

        setSeanceStore(cleaned);
        const currentData = cleaned[selectedSeance];
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
    // Only persist previous session if it has actual data or was saved to DB
    if (storageKey) {
      const existing = seanceStore[selectedSeance];
      const isSaved = !!existing?.isSavedToDb || !!existing?.session_id;
      const hasActualData = absentIds.size > 0 || isLocked || isSaved;

      if (hasActualData) {
        const updatedStore = {
          ...seanceStore,
          [selectedSeance]: {
            absentIds: Array.from(absentIds),
            annotations,
            isLocked,
            date: seanceDate,
            savedAt: existing?.savedAt || (isSaved ? new Date().toISOString() : undefined),
            isSavedToDb: isSaved,
            session_id: existing?.session_id,
          }
        };
        setSeanceStore(updatedStore);
        try {
          localStorage.setItem(storageKey, JSON.stringify(updatedStore));
        } catch {}
      } else {
        // Remove empty unrecorded session from store
        if (seanceStore[selectedSeance]) {
          const updatedStore = { ...seanceStore };
          delete updatedStore[selectedSeance];
          setSeanceStore(updatedStore);
          try {
            localStorage.setItem(storageKey, JSON.stringify(updatedStore));
          } catch {}
        }
      }
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
    newDate: string,
    markSavedToDb: boolean = false
  ) => {
    if (!storageKey) return;
    const existing = seanceStore[selectedSeance];
    const isSaved = markSavedToDb || !!existing?.isSavedToDb || !!existing?.session_id;
    const hasActualData = newAbsentIds.size > 0 || newLocked || isSaved;

    if (hasActualData) {
      const updatedStore = {
        ...seanceStore,
        [selectedSeance]: {
          absentIds: Array.from(newAbsentIds),
          annotations: newAnnotations,
          isLocked: newLocked,
          date: newDate,
          savedAt: existing?.savedAt || (isSaved ? new Date().toISOString() : undefined),
          isSavedToDb: isSaved,
          session_id: existing?.session_id,
          rattrapages: existing?.rattrapages,
        }
      };
      setSeanceStore(updatedStore);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedStore));
      } catch {}
    } else {
      // Remove empty unrecorded session from store
      if (seanceStore[selectedSeance]) {
        const updatedStore = { ...seanceStore };
        delete updatedStore[selectedSeance];
        setSeanceStore(updatedStore);
        try {
          localStorage.setItem(storageKey, JSON.stringify(updatedStore));
        } catch {}
      }
    }
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
  const selectedSchedule = useMemo(
    () => schedules.find(s => s.id === selectedScheduleId) || null,
    [schedules, selectedScheduleId]
  );

  // ─── Solutions 1 & 2: Smart Auto-Detection & Progression Timeline ───
  // Strict rule: A session is ONLY considered completed if:
  // 1. Actually saved to database (isSavedToDb / session_id)
  // 2. Has recorded absences (absentIds.length > 0)
  // 3. Or locked by the professor (isLocked)
  const completedSeances = useMemo(() => {
    return SEANCES.filter(s => {
      const info = seanceStore[s];
      if (!info) return false;
      const isSaved = !!info.isSavedToDb || !!info.session_id;
      const hasAbsents = Array.isArray(info.absentIds) && info.absentIds.length > 0;
      const isLocked = !!info.isLocked;
      return isSaved || hasAbsents || isLocked;
    });
  }, [seanceStore]);

  const nextRecommendedSeance = useMemo(() => {
    const firstUncompleted = SEANCES.find(s => !completedSeances.includes(s));
    return firstUncompleted || 'S1';
  }, [completedSeances]);

  // Is the current selected timetable slot live right now?
  const isLiveSessionNow = useMemo(() => {
    if (!selectedSchedule) return false;
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();
    if (selectedSchedule.day_of_week && Number(selectedSchedule.day_of_week) === currentDay) {
      if (selectedSchedule.start_time && selectedSchedule.end_time) {
        const [startH, startM] = selectedSchedule.start_time.split(':').map(Number);
        const [endH, endM] = selectedSchedule.end_time.split(':').map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startH * 60 + startM - 30; // 30 mins before
        const endMinutes = endH * 60 + endM + 30; // 30 mins after
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      }
      return true;
    }
    return false;
  }, [selectedSchedule]);

  // ─── Solution 3: Dynamic Live QR Check-in Rotator & Simulator ───
  useEffect(() => {
    if (!showLiveQrModal) return;
    const interval = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          setQrRotator(r => r + 1);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showLiveQrModal]);

  // QR token changes dynamically every 15s to prevent sharing
  const qrPayloadUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    const token = btoa(`${selectedGroupId}:${selectedModuleId}:${selectedSeance}:${qrRotator}`);
    return `${baseUrl}/student/checkin?token=${token}`;
  }, [selectedGroupId, selectedModuleId, selectedSeance, qrRotator]);

  // Handle student check-in simulation / scan
  const handleSimulateQrScan = () => {
    const unscanned = students.filter(s => !qrCheckedInIds.has(s.id) && absentIds.has(s.id));
    if (unscanned.length === 0) {
      const anyUnscanned = students.filter(s => !qrCheckedInIds.has(s.id));
      if (anyUnscanned.length === 0) {
        toast.info('Tous les étudiants de ce groupe ont déjà scanné le QR Code !');
        return;
      }
      const randomSt = anyUnscanned[Math.floor(Math.random() * anyUnscanned.length)];
      setQrCheckedInIds(prev => new Set(prev).add(randomSt.id));
      toast.success(`⚡ Scan reçu : ${randomSt.first_name} ${randomSt.last_name} (${randomSt.matricule || 'Étudiant'})`);
      return;
    }
    const randomSt = unscanned[Math.floor(Math.random() * unscanned.length)];
    setQrCheckedInIds(prev => new Set(prev).add(randomSt.id));
    setAbsentIds(prev => {
      const next = new Set(prev);
      next.delete(randomSt.id);
      return next;
    });
    toast.success(`⚡ Présence validée par QR : ${randomSt.first_name} ${randomSt.last_name}`);
  };

  // Apply all QR check-ins
  const handleApplyLiveQr = () => {
    setAbsentIds(prev => {
      const next = new Set(prev);
      qrCheckedInIds.forEach(id => next.delete(id));
      return next;
    });
    persistCurrentSeance(
      new Set(Array.from(absentIds).filter(id => !qrCheckedInIds.has(id))),
      annotations,
      isLocked,
      seanceDate
    );
    setShowLiveQrModal(false);
    toast.success(`✨ Émargement QR validé : ${qrCheckedInIds.size} étudiant(s) pointé(s) présent(s) en direct !`);
  };

  // ─── Rattrapage (Séance de Rattrapage & Appel des Absents) Handlers ─────────
  const handleOpenRattrapageModal = (targetSeance?: string) => {
    const sCode = targetSeance || selectedSeance;
    setRattrapageTargetSeance(sCode);
    const today = new Date().toISOString().slice(0, 10);
    setRattrapageDate(today);
    setRattrapageTime('14:00 - 16:00');
    setRattrapageRoom('Salle de Rattrapage');
    setRattrapageTitle(`Séance de Rattrapage — ${sCode} (${selectedModule?.module_code || 'Module'})`);
    setRattrapageTab('call');
    setRattrapageSearchQuery('');
    setRattrapageStatusFilter('all');
    setSelectedStudentToAdd(null);
    setRattrapageQrCheckedInIds(new Set());

    // Target absent student IDs: if current séance, use active absentIds, else seanceStore
    const targetData = sCode === selectedSeance
      ? { absentIds: Array.from(absentIds) }
      : seanceStore[sCode];
    
    const targetAbsentIds = targetData?.absentIds || [];
    const absentStudentObjects = students.filter(st => targetAbsentIds.includes(st.id));

    // If absent students exist, default them to 'absent' status in the rattrapage list, waiting to be marked present during call
    setRattrapageStudents(
      absentStudentObjects.map(st => ({
        student: st,
        status: 'absent' as const,
        note: '',
        regularize: true,
      }))
    );

    setShowRattrapageModal(true);
  };

  const handleToggleRattrapageStatus = (studentId: number, status: 'present' | 'absent' | 'retard' | 'excuse') => {
    setRattrapageStudents(prev =>
      prev.map(item =>
        item.student.id === studentId ? { ...item, status } : item
      )
    );
  };

  const handleUpdateRattrapageNote = (studentId: number, note: string) => {
    setRattrapageStudents(prev =>
      prev.map(item =>
        item.student.id === studentId ? { ...item, note } : item
      )
    );
  };

  const handleSetAllRattrapageStatus = (status: 'present' | 'absent') => {
    setRattrapageStudents(prev =>
      prev.map(item => ({ ...item, status }))
    );
  };

  const handleAddStudentToRattrapage = (studentId: number) => {
    if (rattrapageStudents.some(item => item.student.id === studentId)) {
      toast.info('Cet étudiant est déjà inscrit dans la séance de rattrapage');
      return;
    }
    const studentObj = students.find(s => s.id === studentId);
    if (!studentObj) return;
    setRattrapageStudents(prev => [
      ...prev,
      { student: studentObj, status: 'present' as const, note: 'Ajouté manuellement', regularize: true }
    ]);
    setSelectedStudentToAdd(null);
    toast.success(`${studentObj.first_name} ${studentObj.last_name} ajouté à la séance`);
  };

  const handleRemoveStudentFromRattrapage = (studentId: number) => {
    setRattrapageStudents(prev => prev.filter(item => item.student.id !== studentId));
  };

  const handleSimulateRattrapageQrScan = () => {
    const unChecked = rattrapageStudents.filter(item => item.status === 'absent');
    if (unChecked.length === 0) {
      toast.info('Tous les étudiants de ce rattrapage sont déjà pointés présents !');
      return;
    }
    const randomItem = unChecked[Math.floor(Math.random() * unChecked.length)];
    setRattrapageStudents(prev =>
      prev.map(item =>
        item.student.id === randomItem.student.id ? { ...item, status: 'present' as const } : item
      )
    );
    setRattrapageQrCheckedInIds(prev => new Set(prev).add(randomItem.student.id));
    toast.success(`⚡ Scan QR Rattrapage validé : ${randomItem.student.first_name} ${randomItem.student.last_name}`);
  };

  const handleSaveRattrapageSession = async () => {
    if (rattrapageStudents.length === 0) {
      toast.error('Aucun étudiant dans cette séance de rattrapage.');
      return;
    }

    setSavingRattrapage(true);
    try {
      const presentCount = rattrapageStudents.filter(s => s.status === 'present').length;
      const newRattrapageRecord: RattrapageSession = {
        id: `rat_${Date.now()}`,
        originalSeance: rattrapageTargetSeance,
        date: rattrapageDate,
        timeSlot: rattrapageTime,
        room: rattrapageRoom,
        title: rattrapageTitle || `Rattrapage ${rattrapageTargetSeance}`,
        createdAt: new Date().toISOString(),
        records: rattrapageStudents.map(s => ({
          studentId: s.student.id,
          status: s.status,
          note: s.note,
          regularized: s.status === 'present' && autoRegularizeOriginal,
        })),
      };

      // Target session data
      const targetData = seanceStore[rattrapageTargetSeance] || {
        absentIds: rattrapageTargetSeance === selectedSeance ? Array.from(absentIds) : [],
        annotations: rattrapageTargetSeance === selectedSeance ? { ...annotations } : {},
        isLocked: rattrapageTargetSeance === selectedSeance ? isLocked : false,
        date: rattrapageTargetSeance === selectedSeance ? seanceDate : new Date().toISOString().slice(0, 10),
      };

      const updatedAbsentIds = new Set(targetData.absentIds);
      const updatedAnnotations = { ...targetData.annotations };

      if (autoRegularizeOriginal) {
        rattrapageStudents.forEach(item => {
          if (item.status === 'present') {
            // Regularize: remove from absentIds of original session
            updatedAbsentIds.delete(item.student.id);
            updatedAnnotations[item.student.id] = {
              text: `Absence rattrapée le ${rattrapageDate} (${rattrapageRoom})${item.note ? ` - ${item.note}` : ''}`,
              tag: 'rattrapage',
            };
          } else if (item.status === 'retard') {
            updatedAnnotations[item.student.id] = {
              text: `Rattrapage avec retard le ${rattrapageDate}${item.note ? ` - ${item.note}` : ''}`,
              tag: 'retard',
            };
          } else if (item.status === 'excuse') {
            updatedAnnotations[item.student.id] = {
              text: `Rattrapage justifié le ${rattrapageDate}${item.note ? ` - ${item.note}` : ''}`,
              tag: 'justifie',
            };
          }
        });
      }

      const existingRattrapages = targetData.rattrapages || [];
      const updatedRattrapages = [newRattrapageRecord, ...existingRattrapages];

      const newTargetData: SeanceData = {
        ...targetData,
        absentIds: Array.from(updatedAbsentIds),
        annotations: updatedAnnotations,
        rattrapages: updatedRattrapages,
        savedAt: new Date().toISOString(),
        isSavedToDb: true,
      };

      const nextStore = {
        ...seanceStore,
        [rattrapageTargetSeance]: newTargetData,
      };
      setSeanceStore(nextStore);

      // If target session is current active session, update active component states too
      if (rattrapageTargetSeance === selectedSeance) {
        setAbsentIds(updatedAbsentIds);
        setAnnotations(updatedAnnotations);
      }

      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(nextStore));
        } catch {}
      }

      // Persist to backend API
      try {
        await api.post('/professor-portal/student-lists/attendance', {
          group_id: selectedGroupId,
          module_id: selectedModuleId,
          sub_group: listMode === 'subgroup' ? selectedSubGroup : undefined,
          seance_code: `${rattrapageTargetSeance}-RAT`,
          session_date: rattrapageDate,
          is_locked: false,
          absent_ids: rattrapageStudents.filter(s => s.status === 'absent').map(s => s.student.id),
          annotations: updatedAnnotations,
          sync_textbook: false,
          chapter_title: `Séance de Rattrapage — ${rattrapageTargetSeance}`,
          key_concepts: `Rattrapage officiel pour ${rattrapageTargetSeance}. ${presentCount} étudiants régularisés. Salle: ${rattrapageRoom}.`,
        });
      } catch (err) {
        console.warn('Backend sync saved locally:', err);
      }

      toast.success(
        `✨ Appel de Rattrapage validé ! ${presentCount}/${rattrapageStudents.length} étudiant(s) ont régularisé leur absence de ${rattrapageTargetSeance}.`
      );
      setShowRattrapageModal(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement du rattrapage.');
    } finally {
      setSavingRattrapage(false);
    }
  };

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

  // Fetch Options (with Redis caching & refresh bypass)
  const fetchOptions = useCallback(async (refresh = false) => {
    setLoadingOptions(true);
    try {
      const res = await api.get('/professor-portal/student-lists/options', {
        params: refresh ? { refresh: 1 } : {},
      });
      const payload = res.data?.data ?? res.data;
      let modulesList: ModuleOption[] = payload?.modules ?? [];

      if ((!modulesList || modulesList.length === 0) && payload?.groups?.length > 0) {
        const map: Record<number, ModuleOption> = {};
        payload.groups.forEach((g: any) => {
          const mId = g.module_id || 0;
          if (!map[mId]) {
            map[mId] = {
              module_id: mId,
              module_name: g.module_name || "Module d'Enseignement",
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
      if (modulesList.length > 0 && !selectedGroupId) {
        const firstMod = modulesList[0];
        setSelectedModuleId(firstMod.module_id);
        if (firstMod.sections && firstMod.sections.length > 0) {
          setSelectedGroupId(firstMod.sections[0].group_id);
          if (firstMod.sections[0].sub_groups && firstMod.sections[0].sub_groups.length > 0) {
            setSelectedSubGroup(firstMod.sections[0].sub_groups[0]);
          }
        }
      }
    } catch {
      toast.error('Impossible de charger les modules affectés');
    } finally {
      setLoadingOptions(false);
    }
  }, [selectedGroupId]);

  // ── Fetch schedules from timetable ──────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const res = await api.get('/professor-portal/schedule');
      const raw: any[] = res.data?.data ?? res.data?.schedules ?? res.data ?? [];
      const items: ScheduleItem[] = (Array.isArray(raw) ? raw : []).map((s: any) => ({
        id: s.id,
        module_id: s.module_id,
        module_code: s.module_code || '',
        module_name: s.module_name || s.title || '',
        group_id: s.group_id,
        group_code: s.group_code || s.group || '',
        filiere_name: s.filiere_name || '',
        semester: s.semester ? `S${s.semester}` : '',
        day_of_week: s.day_of_week ?? 1,
        day_name: s.day_name || ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][s.day_of_week ?? 1],
        start_time: (s.start_time || '').slice(0, 5) || (s.time ? s.time.split(' - ')[0]?.slice(0, 5) : ''),
        end_time: (s.end_time || '').slice(0, 5) || (s.time ? s.time.split(' - ')[1]?.slice(0, 5) : ''),
        room: s.room || s.classroom || '',
        type: (s.type || s.session_type || 'CM').toUpperCase(),
        sub_groups: s.sub_groups || [],
      }));
      setSchedules(items);
      // Auto-select schedule: prioritize today's slot if present, otherwise first slot of the week
      if (items.length > 0 && !selectedScheduleId) {
        const todayJs = new Date().getDay();
        const currentIsoDay = todayJs === 0 ? 7 : todayJs; // 1=Mon ... 7=Sun
        const todaySlot = items.find(s => s.day_of_week === currentIsoDay);
        const chosen = todaySlot || items[0];

        setSelectedScheduleId(chosen.id);
        setSelectedModuleId(chosen.module_id);
        setSelectedGroupId(chosen.group_id);
        setListMode(chosen.type === 'TD' || chosen.type === 'TP' ? 'subgroup' : 'section');
        if (chosen.sub_groups?.length) setSelectedSubGroup(chosen.sub_groups[0]);
        setSeanceDate(getDateForScheduleDay(chosen.day_of_week));
      }
    } catch {
      // fallback: use options-based selection
    } finally {
      setLoadingSchedules(false);
    }
  }, [selectedScheduleId]);

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
              isSavedToDb: true,
              session_id: sData.session_id,
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

  // Save attendance to Backend Database & optionally sync with Textbook
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
        sync_textbook: syncTextbook,
        chapter_title: customChapterTitle.trim() || undefined,
        key_concepts: customKeyConcepts.trim() || undefined,
      };
      const res = await api.post('/professor-portal/student-lists/attendance', payload);
      const isSynced = res.data?.data?.textbook_synced;
      toast.success(
        isSynced
          ? `Feuille de présence ${selectedSeance} et Cahier de Texte enregistrés avec succès !`
          : (res.data?.message || `Feuille de présence ${selectedSeance} enregistrée en base de données`)
      );
      persistCurrentSeance(absentIds, annotations, isLocked, seanceDate, true);
      setShowSaveModal(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement en base de données');
    } finally {
      setSavingAttendance(false);
    }
  };

  // 🪄 AI Auto-complete attendance session content for Textbook
  const handleAiSuggestAttendanceTextbook = async () => {
    if (!selectedModuleId) {
      toast.error('Veuillez d\'abord sélectionner un module');
      return;
    }
    setIsGeneratingAiSuggestion(true);
    try {
      const res = await api.post('/v1/professor/copilot/attendance-textbook-suggestion', {
        module_id: selectedModuleId,
        seance_code: selectedSeance,
        session_type: listMode === 'subgroup' ? 'TD' : 'CM',
      });
      if (res.data?.data) {
        setCustomChapterTitle(res.data.data.chapter_title);
        setCustomKeyConcepts(res.data.data.key_concepts);
        toast.success('✨ Contenu de la séance suggéré avec succès par l\'IA !');
      }
    } catch {
      toast.error('Impossible de générer le contenu avec l\'IA.');
    } finally {
      setIsGeneratingAiSuggestion(false);
    }
  };

  // 🛡️ Fetch AI Attendance Risk & Early Warning Analysis
  const handleFetchAttendanceRisk = async () => {
    if (!selectedGroupId) {
      toast.error('Veuillez sélectionner un groupe d\'étudiants');
      return;
    }
    setShowRiskModal(true);
    setLoadingRiskAnalysis(true);
    try {
      const res = await api.post('/v1/professor/copilot/attendance-risk-analysis', {
        group_id: selectedGroupId,
        module_id: selectedModuleId || undefined,
        sub_group: listMode === 'subgroup' ? selectedSubGroup : undefined,
      });
      setRiskData(res.data?.data);
    } catch {
      toast.error('Erreur lors de l\'analyse prédictive d\'assiduité.');
    } finally {
      setLoadingRiskAnalysis(false);
    }
  };

  useEffect(() => { fetchOptions(); fetchSchedules(); }, [fetchOptions, fetchSchedules]);
  useEffect(() => { if (selectedGroupId) fetchStudents(); }, [selectedGroupId, listMode, selectedSubGroup]);
  useEffect(() => {
    if (selectedGroupId && selectedModuleId) {
      fetchAttendanceHistory();
    }
  }, [selectedGroupId, selectedModuleId, listMode, selectedSubGroup]);
  useEffect(() => { setSelectedSubGroup(availableSubGroups[0] ?? ''); }, [availableSubGroups]);

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


  // Quick Action: Mark All Present (remove all absences)
  const handleMarkAllPresent = () => {
    if (isLocked) { toast.error('Liste verrouillée'); return; }
    const next = new Set<number>();
    setAbsentIds(next);
    persistCurrentSeance(next, annotations, isLocked, seanceDate);
    toast.success(`✨ Tous les ${students.length} étudiants marqués Présents !`);
  };

  // Voice Dictation IA — Appel vocal par reconnaissance de noms
  const handleToggleVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("La reconnaissance vocale n'est pas supportée sur ce navigateur (Chrome/Edge requis).");
      return;
    }
    if (isListening) { setIsListening(false); return; }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('🎙️ En écoute... Prononcez les noms des absents.');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setVoiceTranscript(text);
      setIsListening(false);

      let markedCount = 0;
      const next = new Set(absentIds);
      students.forEach(s => {
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        const lastName = s.last_name.toLowerCase();
        if (text.includes(lastName) || text.includes(fullName)) {
          next.add(s.id);
          markedCount++;
        }
      });

      if (markedCount > 0) {
        setAbsentIds(next);
        persistCurrentSeance(next, annotations, isLocked, seanceDate);
        toast.success(`🎙️ ${markedCount} absence(s) détectée(s) et cochée(s) par l'IA vocale !`);
      } else {
        toast.warning("Aucun nom d'étudiant reconnu. Réessayez en prononçant clairement le nom de famille.");
      }
    };

    recognition.onerror = () => { setIsListening(false); toast.error("Erreur de reconnaissance vocale."); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // ─── Live Session Handlers (4-status + QR backend + offline sync) ────────

  // QR Countdown rotation from backend expires_at
  useEffect(() => {
    if (!isSessionActive || !liveQrExpiresAt) return;
    const update = () => setLiveQrCountdown(Math.max(0, Math.floor((new Date(liveQrExpiresAt).getTime() - Date.now()) / 1000)));
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [isSessionActive, liveQrExpiresAt]);

  // Start Live Session (from schedule card or current selection)
  const handleStartLiveSession = async (overrideGroupId?: number, overrideModuleId?: number) => {
    const gid = overrideGroupId ?? selectedGroupId;
    const mid = overrideModuleId ?? selectedModuleId;
    if (!gid || !mid) { toast.error('Sélectionnez un module et un groupe.'); return; }
    setSavingLive(true);
    try {
      const res = await api.post('/professor/attendance/start', {
        module_id: mid,
        group_id: gid,
        room_name: 'En cours',
        date: seanceDate,
      });
      const session = res.data.session;
      if (!session?.id) throw new Error('Session non créée.');
      const roster = await api.get('/professor/attendance/students', { params: { attendance_session_id: session.id } });
      const mapped = (roster.data.data ?? []).map((s: any) => ({
        id: s.id,
        first_name: s.name?.split(' ')[0] ?? s.first_name ?? '',
        last_name: s.name?.split(' ').slice(1).join(' ') ?? s.last_name ?? '',
        cne: s.cne ?? '',
        status: 'present' as const,
        version: s.version,
      }));
      setLiveStudents(mapped);
      setLiveSessionId(session.id);
      setLiveQrToken(session.qr_token ?? '');
      setLiveQrExpiresAt(session.expires_at ?? null);
      setIsSessionActive(true);
      toast.success('🚀 Session live démarrée !', { description: `${mapped.length} étudiants chargés.` });
    } catch {
      toast.error('Impossible de démarrer la session. Vérifiez le module et le groupe.');
    } finally {
      setSavingLive(false);
    }
  };

  // Toggle live student status: présent → absent → retard → excusé → présent
  const handleToggleLiveStatus = (id: number) => {
    const cycle: Record<string, 'present' | 'absent' | 'retard' | 'excuse'> = {
      present: 'absent', absent: 'retard', retard: 'excuse', excuse: 'present',
    };
    setLiveStudents(prev => prev.map(s => s.id === id ? { ...s, status: cycle[s.status] } : s));
  };

  // Mark all present instantly
  const handleLiveMarkAllPresent = () => {
    setLiveStudents(prev => prev.map(s => ({ ...s, status: 'present' as const })));
    toast.success(`✨ Tous les ${liveStudents.length} étudiants marqués Présents !`);
  };

  // Voice recognition for live students
  const handleVoiceLive = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Reconnaissance vocale non supportée (Chrome/Edge requis)."); return;
    }
    if (isListening) { setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fr-FR'; rec.continuous = false; rec.interimResults = false;
    rec.onstart = () => { setIsListening(true); toast.info('🎙️ En écoute... Prononcez les noms des absents.'); };
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript.toLowerCase();
      setVoiceTranscript(text); setIsListening(false);
      let count = 0;
      setLiveStudents(prev => prev.map(s => {
        const full = `${s.first_name} ${s.last_name}`.toLowerCase();
        if (text.includes(s.last_name.toLowerCase()) || text.includes(full)) { count++; return { ...s, status: 'absent' as const }; }
        return s;
      }));
      if (count > 0) toast.success(`🎙️ ${count} absence(s) détectée(s) par l'IA vocale !`);
      else toast.warning("Aucun nom reconnu. Parlez plus clairement.");
    };
    rec.onerror = () => { setIsListening(false); toast.error("Erreur de reconnaissance vocale."); };
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  // Save + close live session (with offline fallback)
  const handleSaveLiveSession = async () => {
    setSavingLive(true);
    const payload = {
      session_id: liveSessionId,
      close_session: true,
      module_id: selectedModuleId ?? undefined,
      group_id: selectedGroupId ?? undefined,
      date: seanceDate,
      records: liveStudents.map(s => ({
        student_id: s.id,
        status: (s.status === 'retard' ? 'late' : s.status === 'excuse' ? 'excused' : s.status) as 'present' | 'absent' | 'late' | 'excused',
        version: s.version,
      })),
    };
    if (!window.navigator.onLine) {
      offlineAttendanceStore.saveOffline(payload);
      toast.warning('📶 Hors-ligne : appel sauvegardé localement. Synchronisation automatique au retour du réseau.');
      setIsSessionActive(false); setSavingLive(false); return;
    }
    try {
      await api.post('/professor/attendance/save', payload);
      const present = liveStudents.filter(s => s.status === 'present').length;
      const absent = liveStudents.filter(s => s.status === 'absent').length;
      toast.success('✅ Feuille d\'appel certifiée et enregistrée.', { description: `Présents: ${present} · Absents: ${absent}` });
      setIsSessionActive(false);
    } catch (err: any) {
      if (!err.response) {
        offlineAttendanceStore.saveOffline(payload);
        toast.warning('📶 Erreur réseau — appel sauvegardé hors-ligne.');
        setIsSessionActive(false);
      } else {
        toast.error(err.response?.data?.message ?? 'Erreur lors de la sauvegarde.');
      }
    } finally { setSavingLive(false); }
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
    <div className="space-y-6 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-20 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ── Top Role & Institution Header Pill ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 pl-1">
          <GraduationCap className="w-4 h-4 text-[#001A4B] dark:text-blue-400 shrink-0" />
          <span>Espace Enseignant :</span>
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60">
            Listes d'Étudiants & Émargement Officiel
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-600 dark:text-slate-400">{profName || 'Professeur ENCG'}</span>
          {isLocked && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full ml-1">
              <Lock className="w-3 h-3 text-amber-500" /> Verrouillé
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold text-slate-400 pr-1">
          ENCG Fès · Année Académique 2026–2027
        </span>
      </div>

      {/* ── Hero Banner (Unified ENCG Design System) ── */}
      <div className="rounded-3xl p-6 sm:p-8 text-white shadow-xl border bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] border-indigo-900/60 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30 text-white font-black flex items-center justify-center shadow-lg shrink-0">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1 border bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Module Apogée & LMD
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Listes d'Étudiants & Feuille d'Émargement
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
              Pointage des présences par séance, gestion des absences, synchronisation avec le Cahier de Texte et exports certifiés.
            </p>
          </div>
        </div>

        {/* Hero Quick Action Buttons */}
        <div className="flex items-center gap-2 relative z-10 flex-wrap">
          {/* Table / Cards View Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/20 bg-white/10 p-0.5 backdrop-blur-md">
            <button
              onClick={() => setViewMode('table')}
              title="Vue Tableau Officiel"
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'table' ? 'bg-white text-[#001A4B] shadow font-bold' : 'text-slate-300 hover:text-white'
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Vue Cartes / Trombinoscope"
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'cards' ? 'bg-white text-[#001A4B] shadow font-bold' : 'text-slate-300 hover:text-white'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('voice')}
              title="Appel Vocal IA"
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'voice' ? 'bg-rose-500 text-white shadow font-bold' : 'text-slate-300 hover:text-white'
              )}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowStats(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-md cursor-pointer',
              showStats ? 'bg-violet-500 text-white border-violet-400' : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Stats</span>
          </button>

          <button
            onClick={() => setShowQrCol(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-md cursor-pointer',
              showQrCol ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
            )}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR</span>
          </button>

          <button
            onClick={toggleLock}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-md cursor-pointer',
              isLocked
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
            )}
            title={isLocked ? 'Déverrouiller la feuille de présence' : 'Geler la liste pour éviter les modifications accidentelles'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5 text-slate-950" /> : <Unlock className="w-3.5 h-3.5 text-slate-300" />}
            <span>{isLocked ? 'Verrouillé' : 'Verrouiller'}</span>
          </button>

          <button
            onClick={handleOpenPdfPreview}
            disabled={!selectedGroupId || students.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-40"
          >
            <Eye className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">Aperçu PDF</span>
          </button>

          <button
            onClick={() => setShowPdfModal(true)}
            disabled={!selectedGroupId || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>

          <button
            onClick={() => setShowWhatsAppModal(true)}
            disabled={students.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-xs font-bold text-emerald-200 transition-all cursor-pointer disabled:opacity-40"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {loadingOptions ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : !options?.modules?.length ? (
          <NoModulesPlaceholder />
        ) : (
          <>
            {/* ─── Solution 1: Live Intelligent Auto-Detection Banner ─── */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                    isLiveSessionNow
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-[#001A4B] text-amber-300 dark:bg-emerald-600 dark:text-white"
                  )}>
                    {isLiveSessionNow ? <Radio className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        isLiveSessionNow
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                      )}>
                        <span className={cn("w-2 h-2 rounded-full", isLiveSessionNow ? "bg-rose-500 animate-ping" : "bg-blue-500")}></span>
                        {isLiveSessionNow ? "Cours en direct en ce moment" : "Créneau Officiel Détecté"}
                      </span>

                      {selectedSchedule && (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {selectedSchedule.day_name} {selectedSchedule.start_time} - {selectedSchedule.end_time} • {selectedSchedule.room || 'Salle Dédiée'}
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm sm:text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                      <span>{selectedModule?.module_name || 'Module Pédagogique'}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        {selectedSection?.group_code || 'Filière'}
                      </span>
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Suggestion IA : <span className="font-bold text-emerald-600 dark:text-emerald-400">Séance {selectedSeance}</span> ({completedSeances.length} validée{completedSeances.length > 1 ? 's' : ''} sur 12 • {students.length} inscrits).
                    </p>
                  </div>
                </div>

                {/* Live Quick Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Solution 3 Launcher Button */}
                  <button
                    type="button"
                    onClick={() => setShowLiveQrModal(true)}
                    disabled={students.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    title="Lancer le QR Code dynamique en direct pour l'amphi"
                  >
                    <Smartphone className="w-4 h-4 text-amber-300 animate-bounce" />
                    <span>Flash QR Amphi</span>
                  </button>

                  {/* AI Risk Modal Button */}
                  <button
                    onClick={handleFetchAttendanceRisk}
                    disabled={!selectedGroupId}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all shadow-2xs hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 cursor-pointer"
                    title="Analyse prédictive des risques d'absence et d'exclusion (Art. 14 ENCG Fès)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Risque IA</span>
                  </button>

                  {/* Catch-up Session (Rattrapage) Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenRattrapageModal(selectedSeance)}
                    disabled={students.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs font-bold transition-all shadow-2xs hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50 cursor-pointer"
                    title="Organiser une séance de rattrapage et faire l'appel pour les absents"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Rattrapage</span>
                    {absentIds.size > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] font-black">
                        {absentIds.size}
                      </span>
                    )}
                  </button>

                  {/* Save to DB Button */}
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={savingAttendance || !selectedGroupId}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                    title="Enregistrer la feuille de présence et synchroniser avec le Cahier de Texte"
                  >
                    {savingAttendance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-amber-300" />}
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Solution 2: Interactive Semester Timeline (Progression S1 → S12) ─── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#001A4B] dark:text-blue-400" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Progression Pédagogique du Semestre (12 Séances)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cliquez sur une séance pour naviguer dans l'historique ou pointer le créneau actuel.
                  </p>
                </div>

                {/* Progress Stats Badge */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-[#001A4B] dark:text-white">
                      {completedSeances.length} / 12 validées
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1">
                      ({Math.round((completedSeances.length / 12) * 100)}%)
                    </span>
                  </div>
                  <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((completedSeances.length / 12) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Timeline Track */}
              <div className="overflow-x-auto pb-2 pt-1 -mx-2 px-2 scrollbar-thin">
                <div className="flex items-center gap-2 min-w-[780px]">
                  {SEANCES.map((s, index) => {
                    const seanceInfo = seanceStore[s];
                    const isCompleted = completedSeances.includes(s);
                    const isSelected = selectedSeance === s;
                    const absentCount = seanceInfo?.absentIds?.length ?? 0;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSelectSeance(s)}
                        className={cn(
                          "flex-1 relative flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer group",
                          isSelected
                            ? "bg-[#001A4B] text-white border-[#001A4B] shadow-md ring-2 ring-blue-500/30 scale-[1.02]"
                            : isCompleted
                              ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white hover:border-emerald-400"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        {/* Status Icon Indicator */}
                        <div className="flex items-center justify-center mb-1">
                          {isSelected ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                          )}
                        </div>

                        {/* Séance Label */}
                        <span className={cn(
                          "text-xs font-black",
                          isSelected ? "text-amber-300" : isCompleted ? "text-emerald-800 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {s}
                        </span>

                        {/* Sub-label Date / Absences */}
                        <span className={cn(
                          "text-[10px] mt-0.5 truncate max-w-full font-medium",
                          isSelected
                            ? "text-blue-200"
                            : isCompleted
                              ? absentCount > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-slate-400 dark:text-slate-500"
                        )}>
                          {isSelected ? (
                            "En cours"
                          ) : isCompleted ? (
                            absentCount > 0 ? `${absentCount} abs` : "Plein"
                          ) : (
                            "À venir"
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Quick Status Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Date effective de {selectedSeance} :</span>
                  </span>

                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                    <input
                      type="date"
                      value={seanceDate}
                      disabled={isLocked}
                      onChange={e => {
                        const d = e.target.value;
                        setSeanceDate(d);
                        persistCurrentSeance(absentIds, annotations, isLocked, d);
                      }}
                      className="bg-transparent text-xs text-slate-900 dark:text-white font-bold focus:outline-none disabled:opacity-60 cursor-pointer"
                    />
                    {selectedSchedule && (
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          const schedDate = getDateForScheduleDay(selectedSchedule.day_of_week);
                          setSeanceDate(schedDate);
                          persistCurrentSeance(absentIds, annotations, isLocked, schedDate);
                        }}
                        className="text-[11px] text-blue-600 dark:text-sky-400 hover:underline font-bold ml-1 disabled:opacity-40 cursor-pointer"
                        title="Réinitialiser à la date du créneau de l'emploi pour cette semaine"
                      >
                        Date créneau
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        const today = new Date().toISOString().slice(0, 10);
                        setSeanceDate(today);
                        persistCurrentSeance(absentIds, annotations, isLocked, today);
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold ml-1 disabled:opacity-40 cursor-pointer"
                    >
                      Aujourd'hui
                    </button>
                  </div>
                </div>

                {/* Effectif Status Badge & Rattrapage Button */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    {absentIds.size === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Plein effectif (0 absent)
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        {students.length - absentIds.size} présents • {absentIds.size} absent{absentIds.size > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>

                  {/* Trigger Rattrapage for this séance */}
                  <button
                    type="button"
                    onClick={() => handleOpenRattrapageModal(selectedSeance)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                    title={`Organiser une séance de rattrapage et faire l'appel pour ${selectedSeance}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Appel Rattrapage</span>
                    {absentIds.size > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] font-black">
                        {absentIds.size} absents
                      </span>
                    ) : (seanceStore[selectedSeance]?.rattrapages?.length ?? 0) > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                        {seanceStore[selectedSeance]?.rattrapages?.length} effectué
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Schedule-based Group Selector ───────────────────────── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Mes Créneaux d'Enseignement & Groupes</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {schedules.length} créneau{schedules.length > 1 ? 'x' : ''} officiel{schedules.length > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => { fetchSchedules(); fetchOptions(true); }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> <span>Actualiser</span>
                </button>
              </div>

              {loadingSchedules ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                  <span className="ml-2 text-sm text-slate-500">Chargement des créneaux officiels...</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Module / Matière</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select value={selectedModuleId ?? ''} onChange={e => setSelectedModuleId(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-900 dark:text-white font-medium appearance-none focus:outline-none focus:border-emerald-500 transition-colors">
                        {options.modules.map(m => (<option key={m.module_id} value={m.module_id}>{m.module_code} -- {m.module_name}</option>))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Section (Amphi / Filière)</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select value={selectedGroupId ?? ''} onChange={e => setSelectedGroupId(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-900 dark:text-white font-medium appearance-none focus:outline-none focus:border-emerald-500 transition-colors">
                        {selectedModule?.sections.map(s => (<option key={s.group_id} value={s.group_id}>{s.group_code} -- {s.filiere_name} ({s.semester})</option>))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Format</label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
                      <button onClick={() => setListMode('section')} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-all', listMode === 'section' ? 'bg-[#001A4B] text-white shadow dark:bg-emerald-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900')}><Layers className="w-3.5 h-3.5" /><span>CM</span></button>
                      <button onClick={() => setListMode('subgroup')} disabled={availableSubGroups.length === 0} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-all disabled:opacity-40', listMode === 'subgroup' ? 'bg-[#001A4B] text-white shadow dark:bg-violet-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900')}><Users className="w-3.5 h-3.5" /><span>TD / TP</span></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Sous-groupe TD</label>
                    {listMode === 'subgroup' && availableSubGroups.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {availableSubGroups.map(sg => (<button key={sg} onClick={() => setSelectedSubGroup(sg)} className={cn('px-3.5 py-1.5 rounded-lg text-sm font-bold border transition-all cursor-pointer', selectedSubGroup === sg ? 'bg-[#001A4B] border-[#001A4B] text-white dark:bg-violet-600 dark:border-violet-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#001A4B]')}>{sg}</button>))}
                      </div>
                    ) : (
                      <div className="h-10 flex items-center"><span className="text-slate-400 text-xs italic">{listMode === 'section' ? 'Section complète (Amphithéâtre)' : 'Aucun sous-groupe'}</span></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {schedules.map(sch => {
                    const isSelected = selectedScheduleId === sch.id;
                    const schedDate = getDateForScheduleDay(sch.day_of_week);
                    const dateLabel = new Date(schedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
                    const isTd = sch.type === 'TD' || sch.type === 'TP';
                    return (
                      <button
                        key={sch.id}
                        onClick={() => {
                          setSelectedScheduleId(sch.id);
                          setSelectedModuleId(sch.module_id);
                          setSelectedGroupId(sch.group_id);
                          setListMode(isTd ? 'subgroup' : 'section');
                          if (sch.sub_groups?.length) setSelectedSubGroup(sch.sub_groups[0]);
                          else setSelectedSubGroup('');
                          setSeanceDate(schedDate);
                        }}
                        className={cn(
                          'relative text-left p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] cursor-pointer overflow-hidden shadow-2xs',
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-emerald-950/30 border-2 border-[#001A4B] dark:border-emerald-500 shadow-md ring-2 ring-[#001A4B]/10'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/70'
                        )}
                      >
                        {isSelected && <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#001A4B] dark:bg-emerald-400 animate-pulse" />}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', isTd ? 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800')}>{sch.type || 'CM'}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{sch.module_code}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1.5 truncate" title={sch.module_name}>{sch.module_name}</div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{sch.group_code}</span>
                          {sch.filiere_name && <span className="text-[11px] text-slate-500 truncate">• {sch.filiere_name}</span>}
                        </div>
                        <div className={cn('flex items-center gap-2 text-xs rounded-xl px-2.5 py-1.5 flex-wrap border', isSelected ? 'bg-white dark:bg-slate-800 border-[#001A4B]/20' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700')}>
                          <span className={cn('font-bold', isSelected ? 'text-[#001A4B] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200')}>{sch.day_name}</span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">{sch.start_time} - {sch.end_time}</span>
                          {sch.room && <><span className="text-slate-300 dark:text-slate-600">|</span><span className="text-slate-600 dark:text-slate-400 font-medium truncate">📍 {sch.room}</span></>}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{dateLabel}</span>
                        </div>
                        {isTd && sch.sub_groups && sch.sub_groups.length > 0 && (
                          <div className="mt-2.5 flex gap-1.5 flex-wrap">
                            {sch.sub_groups.map(sg => (
                              <span key={sg} onClick={e => { e.stopPropagation(); if (isSelected) setSelectedSubGroup(sg); }} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all', isSelected && selectedSubGroup === sg ? 'bg-[#001A4B] border-[#001A4B] text-white dark:bg-violet-600 dark:border-violet-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#001A4B]')}>{sg}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs shadow-2xs">
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    className={cn(
                      'px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                      attendanceFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span>Tous</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-900/60 font-mono font-bold">{students.length}</span>
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('present')}
                    className={cn(
                      'px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                      attendanceFilter === 'present'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300'
                    )}
                  >
                    <span>✅ Présents</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-800/40 text-emerald-100 font-mono font-bold">{stats.present}</span>
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('absent')}
                    className={cn(
                      'px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                      attendanceFilter === 'absent'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
                    )}
                  >
                    <span>❌ Absents</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-800/40 text-rose-100 font-mono font-bold">{stats.absent}</span>
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('annotated')}
                    className={cn(
                      'px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                      attendanceFilter === 'annotated'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300'
                    )}
                  >
                    <span>📝 Avec Note</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-800/40 text-amber-100 font-mono font-bold">{stats.annotatedCount}</span>
                  </button>
                </div>

                {absentIds.size > 0 && (
                  <button
                    onClick={resetAbsences}
                    disabled={isLocked}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 font-semibold transition-colors disabled:opacity-40 ml-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset séance {selectedSeance}</span>
                  </button>
                )}
              </div>

              {/* Search & Export Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nom, Matricule, CNE…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors w-48 shadow-2xs"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleCopyList}
                  disabled={filteredStudents.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-40 shadow-2xs cursor-pointer"
                  title="Copier la liste filtrée dans le presse-papiers"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span className="hidden sm:inline">Copier</span>
                </button>

                <button
                  onClick={handleDownloadExcel}
                  disabled={downloadingExcel || students.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-40 shadow-2xs cursor-pointer"
                >
                  {downloadingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  <span className="hidden sm:inline">Excel</span>
                </button>
              </div>
            </div>

            {/* ─── Student List Section ────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  <p className="text-slate-500 text-sm font-medium">Chargement de la liste officielle…</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Aucun étudiant ne correspond aux filtres sélectionnés</p>
                  {(searchQuery || attendanceFilter !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setAttendanceFilter('all'); }}
                      className="text-blue-600 dark:text-emerald-400 text-xs hover:underline font-bold cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : viewMode === 'voice' ? (
                /* ─── Présence Live — Cockpit Unifié ─────────────────────── */
                <div className="divide-y divide-slate-100 dark:divide-slate-800">

                  {/* ── Planning hebdomadaire 1-clic (avant session) ── */}
                  {!isSessionActive && (
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <CalendarDays size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">Planning de la Semaine — Démarrage 1-Clic</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Cliquez sur ⚡ pour charger les étudiants et lancer l'appel immédiatement</p>
                          </div>
                        </div>
                        {/* Day filter pills */}
                        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto text-xs font-black">
                          {['all', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(d => (
                            <button key={d} onClick={() => setSelectedDayFilter(d)}
                              className={cn('px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap',
                                selectedDayFilter === d ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                              )}>{d === 'all' ? 'Toute la Semaine' : d.slice(0, 3)}</button>
                          ))}
                        </div>
                      </div>
                      {/* Schedule cards grid */}
                      {schedules.filter(s => selectedDayFilter === 'all' || s.day_name?.toLowerCase().startsWith(selectedDayFilter.toLowerCase())).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {schedules
                            .filter(s => selectedDayFilter === 'all' || s.day_name?.toLowerCase().startsWith(selectedDayFilter.toLowerCase()))
                            .map(session => {
                              const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                              const todayName = days[new Date().getDay() === 0 ? 7 : new Date().getDay()] ?? '';
                              const isToday = session.day_name?.toLowerCase() === todayName.toLowerCase();
                              return (
                                <div key={session.id}
                                  onClick={() => { setSelectedModuleId(session.module_id); setSelectedGroupId(session.group_id); }}
                                  className={cn('p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 group hover:-translate-y-0.5',
                                    selectedModuleId === session.module_id && selectedGroupId === session.group_id
                                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-400/20 shadow-md'
                                      : isToday
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500'
                                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                  )}>
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-xs font-black text-slate-700 dark:text-slate-200">
                                      <Clock size={12} className="text-indigo-500" />{session.day_name} · {session.start_time}–{session.end_time}
                                    </span>
                                    {isToday && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white animate-pulse">Aujourd'hui</span>}
                                  </div>
                                  <div>
                                    <p className="font-black text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">{session.module_name}</p>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                      <span className="px-2 py-0.5 text-[10px] font-mono font-black rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">{session.group_code}</span>
                                      {session.room && <span className="text-[11px] text-slate-500">📍 {session.room}</span>}
                                      <span className={cn('px-2 py-0.5 text-[9px] font-black rounded', session.type === 'CM' ? 'bg-blue-100 text-blue-700' : session.type === 'TD' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700')}>{session.type}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-end pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                    <button onClick={e => { e.stopPropagation(); handleStartLiveSession(session.group_id, session.module_id); }}
                                      disabled={savingLive}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black cursor-pointer transition-all active:scale-95 disabled:opacity-60">
                                      <Zap size={12} className="text-amber-300" /> Faire l'Appel
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                          <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="text-sm font-bold text-slate-500">Aucune séance trouvée pour ce filtre</p>
                          <p className="text-xs text-slate-400">Sélectionnez un autre jour ou choisissez un module manuellement ci-dessous</p>
                        </div>
                      )}
                      {/* Manual start */}
                      <div className="flex items-center justify-center pt-2">
                        <button onClick={() => handleStartLiveSession()} disabled={savingLive || !selectedGroupId || !selectedModuleId}
                          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#001A4B] hover:bg-indigo-900 text-white font-black text-sm shadow-lg transition-all disabled:opacity-40 cursor-pointer">
                          {savingLive ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="text-amber-300" />}
                          Démarrer l'Appel (Sélection Manuelle)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Session Active : Cockpit ── */}
                  {isSessionActive && (
                    <div className="space-y-0">
                      {/* Live stats bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-slate-100 dark:border-slate-800">
                        {[
                          { label: 'Total', val: liveStudents.length, color: 'text-slate-900 dark:text-white', bg: '' },
                          { label: 'Présents', val: liveStudents.filter(s => s.status === 'present').length, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
                          { label: 'Absents', val: liveStudents.filter(s => s.status === 'absent').length, color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-950/20' },
                          { label: 'Retard/Excusé', val: liveStudents.filter(s => s.status === 'retard' || s.status === 'excuse').length, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-950/20' },
                        ].map(stat => (
                          <div key={stat.label} className={cn('p-4 text-center', stat.bg)}>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
                            <p className={cn('text-2xl font-black font-mono', stat.color)}>{stat.val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Tab selector + toolbar */}
                      <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black">
                          {([['trombi', Users, 'Trombinoscope'], ['qr', QrCode, 'QR Projecteur'], ['voice', Mic, 'Appel Vocal IA']] as const).map(([tab, Icon, label]) => (
                            <button key={tab} onClick={() => setActiveVoiceTab(tab)}
                              className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer',
                                activeVoiceTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              )}>
                              <Icon size={14} />{label}
                            </button>
                          ))}
                        </div>
                        {activeVoiceTab === 'trombi' && (
                          <button onClick={handleLiveMarkAllPresent}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all cursor-pointer">
                            <CheckSquare size={14} /> Tout Marquer Présent
                          </button>
                        )}
                      </div>

                      {/* TAB: Trombinoscope 4-statuts */}
                      {activeVoiceTab === 'trombi' && (
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          <p className="col-span-full text-[10px] text-slate-400 font-bold mb-1">
                            💡 Cliquez pour cycler : <span className="text-emerald-600">Présent</span> → <span className="text-rose-600">Absent</span> → <span className="text-amber-600">Retard</span> → <span className="text-blue-600">Excusé</span>
                          </p>
                          {liveStudents.map(s => {
                            const statusMap = {
                              present: { label: 'Présent', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800', avatar: 'bg-emerald-600', badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200' },
                              absent: { label: 'Absent', bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800', avatar: 'bg-rose-600', badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200' },
                              retard: { label: 'Retard', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800', avatar: 'bg-amber-600', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200' },
                              excuse: { label: 'Excusé', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800', avatar: 'bg-blue-600', badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200' },
                            };
                            const st = statusMap[s.status];
                            return (
                              <div key={s.id} onClick={() => handleToggleLiveStatus(s.id)}
                                className={cn('p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none hover:scale-[1.01] active:scale-[0.98]', st.bg)}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0', st.avatar)}>
                                    {s.last_name?.[0]?.toUpperCase() ?? '?'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                      {(s.last_name || '').toUpperCase()} {s.first_name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono truncate">{s.cne}</p>
                                  </div>
                                </div>
                                <span className={cn('px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0', st.badge)}>
                                  {st.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TAB: QR Code Projecteur (backend token) */}
                      {activeVoiceTab === 'qr' && (
                        <div className="p-8 text-center space-y-6 max-w-sm mx-auto">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">QR Code Projecteur</h3>
                            <p className="text-xs text-slate-500 mt-1">Les étudiants scannent ce QR depuis l'app ENCG pour s'enregistrer instantanément</p>
                          </div>
                          <div className="relative p-6 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-indigo-500 inline-block shadow-2xl mx-auto">
                            {liveQrToken && liveQrCountdown > 0
                              ? <QRCodeSVG value={liveQrToken} size={220} className="mx-auto rounded-xl bg-white p-2" />
                              : <div className="w-[220px] h-[220px] flex items-center justify-center text-slate-400 text-xs font-bold">Token expiré — relancez la session</div>
                            }
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-300">
                              <Clock size={14} className="animate-spin" />
                              <span>Validité : {liveQrCountdown}s</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB: Voice IA */}
                      {activeVoiceTab === 'voice' && (
                        <div className="p-8 text-center space-y-6 max-w-lg mx-auto">
                          <div
                            onClick={handleVoiceLive}
                            className={cn('w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl transition-all cursor-pointer',
                              isListening ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/30' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            )}>
                            {isListening ? <Mic size={40} /> : <MicOff size={40} />}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">
                              {isListening ? '🎙️ En écoute...' : 'Appel Vocal IA'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                              {isListening
                                ? 'Prononcez clairement les noms de famille. L\'IA coche automatiquement les absences.'
                                : 'Cliquez sur le micro et dictez les noms des absents. L\'IA les marque dans la liste.'}
                            </p>
                          </div>
                          <button onClick={handleVoiceLive}
                            className={cn('flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-lg cursor-pointer mx-auto',
                              isListening ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-[#001A4B] hover:bg-indigo-900 text-white'
                            )}>
                            {isListening ? <><MicOff size={18} /> Arrêter</> : <><Mic size={18} /> Démarrer</>}
                          </button>
                          {voiceTranscript && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Volume2 size={11} /> Dictée :</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{voiceTranscript}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Sticky Save Bar ── */}
                      <div className="sticky bottom-0 z-30 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs">
                          {window.navigator.onLine
                            ? <span className="flex items-center gap-1 text-emerald-600 font-bold"><Wifi size={13} /> En ligne</span>
                            : <span className="flex items-center gap-1 text-amber-600 font-bold"><WifiOff size={13} /> Hors-ligne (sync auto)</span>
                          }
                          <span className="text-slate-400">· {liveStudents.filter(s => s.status === 'present').length}/{liveStudents.length} présents</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setIsSessionActive(false)}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer transition-all">
                            Annuler
                          </button>
                          <button onClick={handleSaveLiveSession} disabled={savingLive}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer transition-all disabled:opacity-60">
                            {savingLive ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Clôturer &amp; Certifier l'Appel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : viewMode === 'cards' ? (
                /* ─── Cards / Trombinoscope View ──────────────────────── */
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {filteredStudents.map((s, idx) => {
                    const isAbsent = absentIds.has(s.id);
                    const ann = annotations[s.id];
                    const tagStyle = ann?.tag ? TAG_CONFIG[ann.tag] : null;

                    return (
                      <div
                        key={s.id}
                        className={cn(
                          'rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all relative',
                          isAbsent
                            ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-300 dark:border-rose-700/50 shadow-inner'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs hover:shadow-md'
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-xs shadow-xs',
                                  isAbsent ? 'bg-rose-600' : 'bg-gradient-to-br from-emerald-600 to-teal-600'
                                )}
                              >
                                {(s.last_name?.[0] || '?').toUpperCase()}
                              </div>
                              <div>
                                <p className={cn('font-bold text-sm leading-tight', isAbsent ? 'text-rose-900 dark:text-rose-200' : 'text-slate-900 dark:text-white')}>
                                  {(s.last_name || '').toUpperCase()} {s.first_name}
                                </p>
                                <p className="text-slate-500 text-xs font-mono font-medium">{s.matricule || '—'}</p>
                              </div>
                            </div>
                            <span className="text-slate-400 text-[11px] font-mono">#{idx + 1}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-200 dark:border-slate-700/60">
                              <p className="text-slate-400 text-[9px] uppercase font-bold">CNE / Massar</p>
                              <p className="text-slate-800 dark:text-slate-200 font-mono font-medium truncate">{s.cne || s.massar_code || '—'}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-200 dark:border-slate-700/60">
                              <p className="text-slate-400 text-[9px] uppercase font-bold">CIN</p>
                              <p className="text-slate-800 dark:text-slate-200 font-mono font-medium truncate">{s.cin || '—'}</p>
                            </div>
                          </div>

                          {/* Annotation preview pill */}
                          {ann && (
                            <div
                              onClick={() => openAnnotationEditor(s)}
                              className={cn(
                                'cursor-pointer mb-2 px-2.5 py-1 rounded-xl border text-[11px] flex items-center justify-between gap-1.5 transition-all',
                                tagStyle ? `${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}` : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                              )}
                              title="Cliquer pour modifier la note"
                            >
                              <div className="flex items-center gap-1 truncate">
                                <span className="font-bold">{tagStyle?.label || 'Note'} :</span>
                                <span className="truncate">{ann.text || '—'}</span>
                              </div>
                              <Pencil className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
                            </div>
                          )}
                        </div>

                        {/* Card bottom actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <div className="flex items-center gap-1.5">
                            {/* Individual Sheet button */}
                            <button
                              onClick={() => setIndividualStudent(s)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Fiche individuelle d'émargement / rattrapage"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                            </button>

                            {/* Annotation trigger */}
                            <button
                              onClick={() => openAnnotationEditor(s)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors cursor-pointer"
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
                              'flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border disabled:opacity-50 cursor-pointer',
                              isAbsent
                                ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'
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
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-10">N°</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Matricule</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">CNE / Massar</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">CIN</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Nom & Prénom</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Section / TD</th>
                        {showQrCol && (
                          <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-20">QR</th>
                        )}
                        <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Note / Justificatif</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-36">Émargement ({selectedSeance})</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-12">Fiche</th>
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
                              'border-b transition-colors',
                              isAbsent
                                ? 'bg-rose-50/60 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 border-rose-100 dark:border-rose-900/40 hover:bg-rose-100/60'
                                : 'border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100'
                            )}
                          >
                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-200 font-bold">
                                {s.matricule || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-slate-800 dark:text-slate-200 text-xs font-mono font-medium">{s.cne || '—'}</span>
                                {s.massar_code && s.massar_code !== s.cne && (
                                  <span className="text-slate-400 text-[10px] font-mono">{s.massar_code}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs font-mono">{s.cin || '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-2xs',
                                    isAbsent ? 'bg-rose-600' : 'bg-gradient-to-br from-emerald-600 to-teal-600'
                                  )}
                                >
                                  {(s.last_name?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                  <p className={cn('font-bold text-sm', isAbsent ? 'text-rose-800 dark:text-rose-300 line-through' : 'text-slate-900 dark:text-white')}>
                                    {(s.last_name || '').toUpperCase()} {s.first_name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-xs font-bold">
                                  {s.section || selectedSection?.group_code || '—'}
                                </span>
                                {s.sub_group && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800 text-xs font-bold">
                                    {s.sub_group}
                                  </span>
                                )}
                              </div>
                            </td>

                            {showQrCol && (
                              <td className="px-3 py-2 text-center">
                                <QRCodeSVG value={s.matricule || String(s.id)} size={34} className="mx-auto" title={`QR ${s.matricule}`} />
                              </td>
                            )}

                            {/* Annotation Cell */}
                            <td className="px-3 py-2 text-center">
                              {ann ? (
                                <button
                                  onClick={() => openAnnotationEditor(s)}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold transition-all max-w-[130px] truncate cursor-pointer',
                                    tagStyle ? `${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}` : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
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
                                  className="text-slate-400 hover:text-amber-500 p-1.5 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
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
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 cursor-pointer',
                                  isAbsent
                                    ? 'bg-rose-600 border-rose-600 text-white shadow-2xs hover:bg-rose-700'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'
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
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      Affichage de <span className="text-slate-900 dark:text-white font-bold">{filteredStudents.length}</span> étudiant{filteredStudents.length !== 1 ? 's' : ''}
                      {searchQuery && ` (sur un total de ${students.length})`}
                      {listMode === 'subgroup' && selectedSubGroup ? ` — Sous-groupe officiel ${selectedSubGroup}` : ' — Section Complète (Amphithéâtre)'}
                      {absentIds.size > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 ml-2 font-bold">· {absentIds.size} absent{absentIds.size > 1 ? 's' : ''} marqués pour {selectedSeance}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-slate-900 dark:text-white font-bold text-base">Fiche d'Émargement Officielle</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Format PDF A4 conforme — ENCG Fès / USMBA</p>
                </div>
              </div>
              <button onClick={() => setShowPdfModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              {/* Summary info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-2 border border-slate-200 dark:border-slate-700/60">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Section / Groupe</span>
                  <span className="text-slate-900 dark:text-white font-semibold text-xs">{selectedSection?.group_code} — {selectedSection?.filiere_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Format d'enseignement</span>
                  <span className="text-slate-900 dark:text-white font-semibold text-xs">{listMode === 'section' ? 'Cours Magistral (Amphi)' : `TD — Sous-groupe ${selectedSubGroup}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Effectif à exporter</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{students.length} étudiants</span>
                </div>
                {absentIds.size > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Absents actuels ({selectedSeance})</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold text-xs">{absentIds.size} absent(s) marqués</span>
                  </div>
                )}
              </div>

              {/* Mode picker */}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2.5">Type de document</p>
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
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2.5">Orientation A4</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPdfOrientation('portrait')}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                      pdfOrientation === 'portrait'
                        ? 'bg-blue-50/80 dark:bg-emerald-600/15 border-[#001A4B] dark:border-emerald-500/60 ring-1 ring-[#001A4B]/20 dark:ring-emerald-500/40'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    )}
                  >
                    <div className={cn('w-6 h-8 rounded border-2 flex-shrink-0', pdfOrientation === 'portrait' ? 'border-[#001A4B] dark:border-emerald-400' : 'border-slate-400 dark:border-slate-600')} />
                    <div className="text-left">
                      <p className={cn('text-xs font-bold', pdfOrientation === 'portrait' ? 'text-[#001A4B] dark:text-white' : 'text-slate-700 dark:text-slate-300')}>Portrait</p>
                      <p className="text-[11px] text-slate-500">Vertical (Standard)</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPdfOrientation('paysage')}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                      pdfOrientation === 'paysage'
                        ? 'bg-blue-50/80 dark:bg-emerald-600/15 border-[#001A4B] dark:border-emerald-500/60 ring-1 ring-[#001A4B]/20 dark:ring-emerald-500/40'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    )}
                  >
                    <div className={cn('w-8 h-6 rounded border-2 flex-shrink-0', pdfOrientation === 'paysage' ? 'border-[#001A4B] dark:border-emerald-400' : 'border-slate-400 dark:border-slate-600')} />
                    <div className="text-left">
                      <p className={cn('text-xs font-bold', pdfOrientation === 'paysage' ? 'text-[#001A4B] dark:text-white' : 'text-slate-700 dark:text-slate-300')}>Paysage</p>
                      <p className="text-[11px] text-slate-500">Horizontal (Idéal grille)</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90">
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  handleOpenPdfPreview();
                }}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Voir l'aperçu d'abord</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#001A4B] hover:bg-[#082663] dark:bg-gradient-to-r dark:from-emerald-600 dark:to-teal-600 text-white text-xs font-bold transition-all shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-amber-300" />}
                  <span>Télécharger PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. PDF Live Preview Iframe Modal ───────────────────────── */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/85 backdrop-blur-md animate-in fade-in">
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </button>
              <button
                onClick={handleClosePdfPreview}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-slate-900 dark:text-white font-bold text-base">Partage Rapport WhatsApp</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Transmission immédiate aux délégués ou à la scolarité</p>
                </div>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              {/* Format selection */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2">
                  Format du rapport
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWhatsAppType('absents_only')}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                      whatsAppType === 'absents_only'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-white ring-1 ring-emerald-500/40'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    )}
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white">Rapport des Absents</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Idéal pour le délégué ({absentIds.size} absents)</p>
                  </button>

                  <button
                    onClick={() => setWhatsAppType('full_roster')}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                      whatsAppType === 'full_roster'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-white ring-1 ring-emerald-500/40'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    )}
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white">Appel Complet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tous les étudiants (✅ & ❌)</p>
                  </button>
                </div>
              </div>

              {/* Message preview */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1.5">
                  Aperçu du message formaté
                </label>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-300 max-h-52 overflow-y-auto whitespace-pre-wrap select-all">
                  {generatedWhatsAppText}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90">
              <button
                onClick={handleCopyWhatsApp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>Copier le texte</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-sm">Annotation Étudiant</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Séance {selectedSeance} — {seanceDate}</p>
                </div>
              </div>
              <button onClick={() => setEditingStudentId(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tag Quick Select */}
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2">
                Catégorie rapide
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(TAG_CONFIG) as [AnnotationTag, typeof TAG_CONFIG[AnnotationTag]][]).map(([t, cfg]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditNoteTag(t)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer',
                      editNoteTag === t
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-amber-500/40`
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    )}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note text */}
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1.5">
                Remarque ou motif (justificatif, retard…)
              </label>
              <textarea
                rows={3}
                value={editNoteText}
                onChange={e => setEditNoteText(e.target.value)}
                placeholder="Ex: Certificat médical déposé, retard de 20min autorisé, dispense exceptionnelle…"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {annotations[editingStudentId] ? (
                <button
                  type="button"
                  onClick={() => removeAnnotation(editingStudentId)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                >
                  Supprimer
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudentId(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveAnnotation}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-slate-900 dark:text-white font-bold text-sm">
                    Fiche Individuelle d'Émargement & Rattrapage
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {(individualStudent.last_name || '').toUpperCase()} {individualStudent.first_name} — Matricule: {individualStudent.matricule || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintIndividualSheet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>Imprimer (A4)</span>
                </button>
                <button
                  onClick={() => setIndividualStudent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div id="individual-printable-sheet" className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 space-y-5">
              {/* Document Header (ENCG Fès Style) */}
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Royaume du Maroc</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Université Sidi Mohamed Ben Abdellah — Fès</p>
                <h3 className="text-sm font-black text-[#001A4B] dark:text-emerald-400 mt-1">
                  École Nationale de Commerce et de Gestion de Fès
                </h3>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-[#001A4B] dark:text-white uppercase tracking-wider shadow-2xs">
                  Fiche Individuelle de Présence & d'Émargement
                </div>
              </div>

              {/* Student & Course Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 mb-1">Identité Étudiant</p>
                  <div><span className="text-slate-500 dark:text-slate-400">Nom & Prénom :</span> <span className="text-slate-900 dark:text-white font-bold">{(individualStudent.last_name || '').toUpperCase()} {individualStudent.first_name}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Matricule :</span> <span className="text-slate-900 dark:text-white font-mono font-bold">{individualStudent.matricule || '—'}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">CNE / Massar :</span> <span className="text-slate-900 dark:text-white font-mono">{individualStudent.cne || individualStudent.massar_code || '—'}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">CIN :</span> <span className="text-slate-900 dark:text-white font-mono">{individualStudent.cin || '—'}</span></div>
                </div>

                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 mb-1">Affectation Pédagogique</p>
                  <div><span className="text-slate-500 dark:text-slate-400">Module :</span> <span className="text-slate-900 dark:text-white font-semibold">{selectedModule?.module_code} — {selectedModule?.module_name}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Section :</span> <span className="text-slate-900 dark:text-white font-medium">{selectedSection?.group_code} ({selectedSection?.filiere_name})</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Sous-groupe TD :</span> <span className="text-slate-900 dark:text-white font-medium">{individualStudent.sub_group || selectedSubGroup || 'Section Complète'}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Enseignant :</span> <span className="text-slate-900 dark:text-white font-medium">Pr. {profName || 'ENCG Fès'}</span></div>
                </div>
              </div>

              {/* Status on current session */}
              <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Statut actuel ({selectedSeance} — {seanceDate}) :</p>
                  <p className="text-sm font-bold mt-0.5">
                    {absentIds.has(individualStudent.id) ? (
                      <span className="text-rose-600 dark:text-rose-400">❌ Absent non justifié</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">✅ Présent & Régulier</span>
                    )}
                  </p>
                  {annotations[individualStudent.id] && (
                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                      Remarque : {annotations[individualStudent.id].text} ({annotations[individualStudent.id].tag || 'Note'})
                    </p>
                  )}
                </div>
                <QRCodeSVG value={individualStudent.matricule || String(individualStudent.id)} size={56} title="QR Étudiant" />
              </div>

              {/* Grid 10 Sessions Emargement / Rattrapage Table */}
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Grille de validation des séances (1 à 10) :</p>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {SEANCES.slice(0, 10).map(s => {
                    const seanceData = seanceStore[s];
                    const isAbs = seanceData?.absentIds?.includes(individualStudent.id);
                    const isPassed = !!seanceData;

                    return (
                      <div key={s} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 rounded-xl p-2 flex flex-col justify-between h-20 shadow-2xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{s}</span>
                        <div className="text-[10px]">
                          {isPassed ? (
                            isAbs ? <span className="text-rose-600 dark:text-rose-400 font-bold">ABS</span> : <span className="text-emerald-600 dark:text-emerald-400 font-bold">PRÉSENT</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">—</span>
                          )}
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-1 text-[9px] text-slate-400 dark:text-slate-500 italic">
                          Émargement
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signatures & Seal Zone */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs text-center">
                <div>
                  <p className="font-bold text-slate-600 dark:text-slate-400 mb-10">Signature de l'Étudiant(e)</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Précédé de la mention « Lu et approuvé »</p>
                </div>
                <div>
                  <p className="font-bold text-slate-600 dark:text-slate-400 mb-10">Visa & Cachet de l'Enseignant</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Fait à Fès, le {seanceDate}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 flex justify-end">
              <button
                onClick={() => setIndividualStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Save to DB & Sync Textbook ─────────────────────────── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Enregistrement & Synergie Pédagogique</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sauvegarde de la présence et liaison avec le Cahier de Texte</p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Session Recap */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Séance & Date :</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded">
                    {selectedSeance} • {seanceDate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Module :</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                    {selectedModule?.module_code} - {selectedModule?.module_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Groupe / Section :</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {selectedSection?.group_code} {listMode === 'subgroup' && selectedSubGroup ? `(${selectedSubGroup})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Effectif présent :</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {students.length - absentIds.size} / {students.length} ({absentIds.size} absent{absentIds.size > 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {/* Textbook Sync Toggle Card */}
              <div className={cn(
                'rounded-xl border p-4 transition-all',
                syncTextbook
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
              )}>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncTextbook}
                    onChange={(e) => setSyncTextbook(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-400 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Enregistrer en même temps dans le Cahier de Texte Numérique
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Crée automatiquement une séance de 2.0h avec statut « Réalisé » dans votre cahier de texte officiel ENCG Fès.
                    </p>
                  </div>
                </label>

                {/* Additional Textbook Inputs */}
                {syncTextbook && (
                  <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-500/20 space-y-3 animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Intitulé du Chapitre / Séance <span className="text-slate-400">(optionnel)</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAiSuggestAttendanceTextbook}
                          disabled={isGeneratingAiSuggestion || !selectedModuleId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                          title="Suggérer le chapitre et les concepts clés de cette séance avec Gemini AI"
                        >
                          {isGeneratingAiSuggestion ? (
                            <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-amber-500" />
                          )}
                          <span>{isGeneratingAiSuggestion ? 'Génération IA…' : '🪄 Auto-compléter avec l\'IA'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={customChapterTitle}
                        onChange={(e) => setCustomChapterTitle(e.target.value)}
                        placeholder={`Ex: Séance ${selectedSeance} — Concepts fondamentaux & Études de cas`}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Notions abordées & Activités <span className="text-slate-400">(optionnel)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={customKeyConcepts}
                        onChange={(e) => setCustomKeyConcepts(e.target.value)}
                        placeholder="Ex: Présentation du cours magistral, exercices d'application en sous-groupes..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                disabled={savingAttendance}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAttendanceToDb}
                disabled={savingAttendance}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {savingAttendance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savingAttendance ? 'Enregistrement en cours…' : 'Confirmer & Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: AI Attendance Risk & Early Warning ─────────────────── */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Détection Prédictive Décrochage & Risque d'Absence (IA)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full font-bold">Art. 14 ENCG Fès</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Analyse de conformité réglementaire LMD & Alerte d'assiduité précoce</p>
                </div>
              </div>
              <button
                onClick={() => setShowRiskModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {loadingRiskAnalysis ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Analyse de l'assiduité par l'IA en cours…</p>
                  <p className="text-xs text-slate-500">Examen des 12 séances d'émargement et seuils légaux ENCG</p>
                </div>
              ) : riskData ? (
                <>
                  {/* KPIs Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-rose-50/70 dark:bg-slate-950/60 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold">
                        <span>Risque Critique</span>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-rose-950 dark:text-white">{riskData.critical_count ?? 0}</p>
                      <p className="text-[11px] text-rose-600/80 dark:text-slate-400 font-medium">≥ 3 absences (Exclusion Art. 14)</p>
                    </div>

                    <div className="bg-amber-50/70 dark:bg-slate-950/60 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
                        <span>Zone Vigilance</span>
                        <Info className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-amber-950 dark:text-white">{riskData.warning_count ?? 0}</p>
                      <p className="text-[11px] text-amber-600/80 dark:text-slate-400 font-medium">2 absences non justifiées</p>
                    </div>

                    <div className="bg-emerald-50/70 dark:bg-slate-950/60 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <span>Assiduité Globale</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-emerald-950 dark:text-white">{riskData.global_attendance_rate ?? 100}%</p>
                      <p className="text-[11px] text-emerald-600/80 dark:text-slate-400 font-medium">{riskData.total_sessions_evaluated ?? 1} séances évaluées</p>
                    </div>
                  </div>

                  {/* AI Diagnosis */}
                  <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Diagnostic Synthétique du Copilote IA</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {riskData.ai_summary}
                    </p>
                  </div>

                  {/* Critical Students Table */}
                  <div>
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Étudiants exposés à l'élimination ({riskData.critical_students?.length ?? 0})</span>
                    </h4>
                    {riskData.critical_students?.length === 0 ? (
                      <div className="bg-emerald-50 dark:bg-slate-950/40 border border-emerald-200 dark:border-slate-800 rounded-xl p-4 text-center text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                        ✅ Aucun étudiant en situation critique d'exclusion pour ce groupe.
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="p-2.5">Étudiant(e)</th>
                              <th className="p-2.5">Matricule / CNE</th>
                              <th className="p-2.5 text-center">Absences Non-Justifiées</th>
                              <th className="p-2.5 text-center">Taux Présence</th>
                              <th className="p-2.5">Statut Légal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
                            {riskData.critical_students.map((st: any) => (
                              <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">{st.name}</td>
                                <td className="p-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{st.matricule} • {st.cne}</td>
                                <td className="p-2.5 text-center font-bold text-rose-600 dark:text-rose-400">{st.unexcused_absences} séance{st.unexcused_absences > 1 ? 's' : ''}</td>
                                <td className="p-2.5 text-center font-bold text-slate-900 dark:text-white">{st.attendance_rate}%</td>
                                <td className="p-2.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                                    Éliminatoire Art. 14
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* AI Recommendations */}
                  {riskData.ai_recommendations?.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-300 uppercase tracking-wider">
                        💡 Recommandations Opérationnelles du Modèle IA :
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside font-medium">
                        {riskData.ai_recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500">
                  Aucune donnée d'assiduité disponible pour ce groupe.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Conforme à la Charte des Études ENCG Fès</span>
              <button
                type="button"
                onClick={() => setShowRiskModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Solution 3: Dynamic Live QR Code Check-in Modal (Amphi & Salle) ───── */}
      {showLiveQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Flash Émargement Live (Amphi & Salle)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60">
                      Séance {selectedSeance}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Les étudiants scannent ce QR Code avec leur smartphone pour pointer leur présence en direct.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.documentElement;
                    if (!document.fullscreenElement) {
                      el.requestFullscreen?.();
                      setIsFullscreenQr(true);
                    } else {
                      document.exitFullscreen?.();
                      setIsFullscreenQr(false);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Plein écran (Idéal pour Vidéoprojecteur d'Amphithéâtre)"
                >
                  {isFullscreenQr ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiveQrModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Dynamic QR Display & Live Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Code Centerpiece */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl relative shadow-inner">
                  <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200">
                    <QRCodeSVG
                      value={qrPayloadUrl}
                      size={240}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  {/* Anti-fraud rotating timer badge */}
                  <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Renouvellement dans <strong className="font-mono">{qrCountdown}s</strong> (Anti-Partage WhatsApp)</span>
                  </div>
                </div>

                {/* Live Stats & Instructions */}
                <div className="space-y-4">
                  {/* Realtime Attendance Counter */}
                  <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      <span>Pointages Validés en Direct</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Direct
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {students.length - absentIds.size + qrCheckedInIds.size}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        / {students.length} étudiants ({Math.round(((students.length - absentIds.size + qrCheckedInIds.size) / Math.max(1, students.length)) * 100)}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round(((students.length - absentIds.size + qrCheckedInIds.size) / Math.max(1, students.length)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Projection Instructions for students */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 text-xs space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Consigne de projection en Amphi :</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                      <li>Affichez cette fenêtre en plein écran sur le vidéoprojecteur.</li>
                      <li>Les étudiants ouvrent leur appareil photo ou l'application ENCG.</li>
                      <li>La présence est enregistrée instantanément sur votre écran.</li>
                    </ol>
                  </div>

                  {/* Simulator button for quick test */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSimulateQrScan}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer"
                      title="Simuler un scan étudiant instantané pour tester le fonctionnement"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Simuler un scan étudiant (Test Immédiat)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {qrCheckedInIds.size} pointage(s) live effectué(s) pendant cette session
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLiveQrModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleApplyLiveQr}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Valider & Appliquer la Présence</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Séance de Rattrapage & Appel des Absents ──────────── */}
      {showRattrapageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-purple-100 dark:border-purple-950/60 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Séance de Rattrapage & Appel des Absents
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                      Régularisation Officielle
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Séance d'origine : <strong className="text-purple-700 dark:text-purple-300">{rattrapageTargetSeance}</strong> • {selectedModule?.module_name || 'Module'} ({selectedSection?.group_code || 'Groupe'})
                  </p>
                </div>
              </div>

              {/* Quick Séance Selector & Close */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-bold">
                  <span className="text-slate-400 text-[11px]">Cible :</span>
                  <select
                    value={rattrapageTargetSeance}
                    onChange={e => handleOpenRattrapageModal(e.target.value)}
                    className="bg-transparent text-purple-700 dark:text-purple-300 font-black focus:outline-none cursor-pointer"
                  >
                    {SEANCES.map(s => (
                      <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {s} ({seanceStore[s]?.absentIds?.length ?? 0} abs.)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRattrapageModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Header & Metadata Configuration Ribbon */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Date du Rattrapage
                </label>
                <input
                  type="date"
                  value={rattrapageDate}
                  onChange={e => setRattrapageDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Créneau Horaire
                </label>
                <input
                  type="text"
                  value={rattrapageTime}
                  onChange={e => setRattrapageTime(e.target.value)}
                  placeholder="ex: 14:00 - 16:00"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Salle / Local
                </label>
                <input
                  type="text"
                  value={rattrapageRoom}
                  onChange={e => setRattrapageRoom(e.target.value)}
                  placeholder="ex: Salle 14 ou Amphi 2"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Intitulé / Motif
                </label>
                <input
                  type="text"
                  value={rattrapageTitle}
                  onChange={e => setRattrapageTitle(e.target.value)}
                  placeholder="ex: Rattrapage TD / Chapitre 3"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Mode Tabs (Feuille d'Appel / QR Code Flash / Historique) */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setRattrapageTab('call')}
                className={cn(
                  "flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer",
                  rattrapageTab === 'call'
                    ? "border-purple-600 text-purple-700 dark:text-purple-300 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Feuille d'Appel ({rattrapageStudents.length} convoqués)</span>
              </button>

              <button
                type="button"
                onClick={() => setRattrapageTab('qr')}
                className={cn(
                  "flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer",
                  rattrapageTab === 'qr'
                    ? "border-purple-600 text-purple-700 dark:text-purple-300 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Smartphone className="w-4 h-4" />
                <span>Flash QR Présence</span>
              </button>

              <button
                type="button"
                onClick={() => setRattrapageTab('history')}
                className={cn(
                  "flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer",
                  rattrapageTab === 'history'
                    ? "border-purple-600 text-purple-700 dark:text-purple-300 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <History className="w-4 h-4" />
                <span>Historique ({seanceStore[rattrapageTargetSeance]?.rattrapages?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* TAB 1: FEUILLE D'APPEL */}
              {rattrapageTab === 'call' && (
                <div className="space-y-4">
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Convoqués</span>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{rattrapageStudents.length}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Présents (Rattrapés)</span>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {rattrapageStudents.filter(s => s.status === 'present').length}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Toujours Absents</span>
                      <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                        {rattrapageStudents.filter(s => s.status === 'absent').length}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Retards / Excusés</span>
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                        {rattrapageStudents.filter(s => s.status === 'retard' || s.status === 'excuse').length}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Filters Ribbon */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/70">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSetAllRattrapageStatus('present')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Tous Présents (Régularisés)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetAllRattrapageStatus('absent')}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>Tous Absents</span>
                      </button>

                      {/* Status Filter */}
                      <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setRattrapageStatusFilter('all')}
                          className={cn("px-2.5 py-1 rounded-lg transition-colors cursor-pointer", rattrapageStatusFilter === 'all' && "bg-purple-600 text-white")}
                        >
                          Tous ({rattrapageStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRattrapageStatusFilter('absent')}
                          className={cn("px-2.5 py-1 rounded-lg transition-colors cursor-pointer", rattrapageStatusFilter === 'absent' && "bg-rose-600 text-white")}
                        >
                          Absents ({rattrapageStudents.filter(s => s.status === 'absent').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRattrapageStatusFilter('present')}
                          className={cn("px-2.5 py-1 rounded-lg transition-colors cursor-pointer", rattrapageStatusFilter === 'present' && "bg-emerald-600 text-white")}
                        >
                          Présents ({rattrapageStudents.filter(s => s.status === 'present').length})
                        </button>
                      </div>
                    </div>

                    {/* Search & Add other student */}
                    <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                      <div className="relative min-w-[180px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={rattrapageSearchQuery}
                          onChange={e => setRattrapageSearchQuery(e.target.value)}
                          placeholder="Rechercher étudiant..."
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Dropdown to add a non-listed student */}
                      <div className="relative">
                        <select
                          value={selectedStudentToAdd ?? ''}
                          onChange={e => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            if (val) handleAddStudentToRattrapage(val);
                          }}
                          className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer max-w-[160px] truncate"
                        >
                          <option value="">+ Ajouter étudiant...</option>
                          {students
                            .filter(st => !rattrapageStudents.some(item => item.student.id === st.id))
                            .map(st => (
                              <option key={st.id} value={st.id}>
                                {st.last_name} {st.first_name} ({st.sub_group || 'G1'})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Student List */}
                  {rattrapageStudents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                      <UserCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Aucun absent sur la séance {rattrapageTargetSeance}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Tous les étudiants étaient présents lors de cette séance principale. Vous pouvez néanmoins ajouter manuellement un étudiant qui souhaite rattraper un cours.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {rattrapageStudents
                        .filter(item => {
                          if (rattrapageStatusFilter === 'absent' && item.status !== 'absent') return false;
                          if (rattrapageStatusFilter === 'present' && item.status !== 'present') return false;
                          if (!rattrapageSearchQuery) return true;
                          const q = rattrapageSearchQuery.toLowerCase();
                          return `${item.student.last_name} ${item.student.first_name}`.toLowerCase().includes(q) ||
                            (item.student.matricule || '').toLowerCase().includes(q) ||
                            (item.student.cne || '').toLowerCase().includes(q);
                        })
                        .map(item => {
                          const isPres = item.status === 'present';
                          const isAbs = item.status === 'absent';
                          const isRet = item.status === 'retard';
                          const isExc = item.status === 'excuse';

                          return (
                            <div
                              key={item.student.id}
                              className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all",
                                isPres
                                  ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80"
                                  : isAbs
                                    ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                              )}
                            >
                              {/* Student Info */}
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0",
                                  isPres ? "bg-emerald-600 text-white" : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                )}>
                                  {item.student.last_name.slice(0, 1)}{item.student.first_name.slice(0, 1)}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {item.student.last_name} {item.student.first_name}
                                    </span>
                                    {item.student.sub_group && (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">
                                        {item.student.sub_group}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {item.student.matricule || item.student.cne || 'ENCG Fès'}
                                  </span>
                                </div>
                              </div>

                              {/* 4-Status Selector */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRattrapageStatus(item.student.id, 'present')}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                                    isPres
                                      ? "bg-emerald-600 text-white shadow-xs font-black ring-2 ring-emerald-500/30"
                                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                                  )}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Présent (Régularisé)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleRattrapageStatus(item.student.id, 'absent')}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                                    isAbs
                                      ? "bg-rose-600 text-white shadow-xs font-black ring-2 ring-rose-500/30"
                                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-400"
                                  )}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Non régularisé</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleRattrapageStatus(item.student.id, 'retard')}
                                  className={cn(
                                    "px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    isRet
                                      ? "bg-amber-500 text-white shadow-xs font-black"
                                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400"
                                  )}
                                >
                                  Retard
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleRattrapageStatus(item.student.id, 'excuse')}
                                  className={cn(
                                    "px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    isExc
                                      ? "bg-sky-600 text-white shadow-xs font-black"
                                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-400"
                                  )}
                                >
                                  Excusé
                                </button>

                                {/* Student Note */}
                                <input
                                  type="text"
                                  value={item.note}
                                  onChange={e => handleUpdateRattrapageNote(item.student.id, e.target.value)}
                                  placeholder="Note / Observation..."
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white max-w-[140px] focus:outline-none focus:border-purple-500"
                                />

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudentFromRattrapage(item.student.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Retirer de cette séance de rattrapage"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Regularization Options Checkbox */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={autoRegularizeOriginal}
                        onChange={e => setAutoRegularizeOriginal(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>
                        Régulariser automatiquement l'absence de la séance d'origine ({rattrapageTargetSeance}) pour les étudiants présents au rattrapage
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: FLASH QR PRÉSENCE (RATTRAPAGE) */}
              {rattrapageTab === 'qr' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-2">
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 border border-purple-200 dark:border-purple-900/60 rounded-3xl relative shadow-inner">
                    <div className="p-4 bg-white rounded-2xl shadow-lg border border-purple-200">
                      <QRCodeSVG
                        value={`${window.location.origin}/student/attendance/check-in?seance=${rattrapageTargetSeance}-RAT&group=${selectedGroupId}&date=${rattrapageDate}&time=${Date.now()}`}
                        size={220}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>QR Code Séance de Rattrapage — {rattrapageTargetSeance}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/30 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                        <span>Pointages en Direct (Rattrapage)</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                          Direct
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">
                          {rattrapageStudents.filter(s => s.status === 'present').length}
                        </span>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          / {rattrapageStudents.length} étudiants convoqués
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs space-y-2">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Consignes pour les étudiants en rattrapage :</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Projetez ce QR Code dans la salle de rattrapage ({rattrapageRoom || 'Salle dédiée'}). Les étudiants absents le scannent pour valider leur présence et régulariser automatiquement leur absence de {rattrapageTargetSeance}.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateRattrapageQrScan}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Simuler un scan étudiant (Test Immédiat)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: HISTORIQUE DES RATTRAPAGES */}
              {rattrapageTab === 'history' && (
                <div className="space-y-3">
                  {(!seanceStore[rattrapageTargetSeance]?.rattrapages || seanceStore[rattrapageTargetSeance]?.rattrapages?.length === 0) ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                      <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Aucun rattrapage enregistré pour {rattrapageTargetSeance}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Les séances de rattrapage effectuées pour cette séance seront archivées ici avec la liste des étudiants régularisés.
                      </p>
                    </div>
                  ) : (
                    seanceStore[rattrapageTargetSeance]?.rattrapages?.map((rat, idx) => {
                      const presentCount = rat.records.filter(r => r.status === 'present').length;
                      return (
                        <div
                          key={rat.id || idx}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs">
                                Rattrapage #{idx + 1}
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {rat.title || `Rattrapage ${rat.originalSeance}`}
                              </span>
                            </div>

                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                              Date : {rat.date} • {rat.timeSlot} • {rat.room}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              Bilan de présence : <strong className="text-emerald-600 dark:text-emerald-400">{presentCount} régularisé(s)</strong> sur {rat.records.length} convoqué(s)
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Enregistré le {new Date(rat.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-purple-100 dark:border-purple-950/60 bg-slate-50/50 dark:bg-slate-900/90 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {rattrapageStudents.filter(s => s.status === 'present').length} présence(s) à régulariser
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRattrapageModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSaveRattrapageSession}
                  disabled={savingRattrapage}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingRattrapage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  <span>Valider & Enregistrer l'Appel de Rattrapage</span>
                </button>
              </div>
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
  const colorMap = {
    slate: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white',
    emerald: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300',
    rose: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300',
    sky: 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/60 text-sky-700 dark:text-sky-300',
    amber: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300',
  };

  return (
    <div className={cn('border rounded-2xl p-4 flex flex-col gap-2 shadow-2xs transition-all', colorMap[color])}>
      <div className="flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <p className="text-2xl font-black">{value}</p>
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
        'relative flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all cursor-pointer',
        active
          ? 'bg-blue-50/80 dark:bg-emerald-950/30 border-[#001A4B] dark:border-emerald-500 ring-2 ring-[#001A4B]/20 dark:ring-emerald-500/40 shadow-sm'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
      )}
    >
      {active && <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-[#001A4B] dark:text-emerald-400" />}
      <div className={cn('p-1.5 rounded-lg', active ? 'text-[#001A4B] dark:text-emerald-400' : 'text-slate-400')}>{icon}</div>
      <div>
        <p className={cn('text-sm font-bold', active ? 'text-[#001A4B] dark:text-white' : 'text-slate-700 dark:text-slate-300')}>{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
      </div>
    </button>
  );
}

function NoModulesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
        <ShieldAlert className="w-12 h-12 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Aucun module affecté</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Vous n'avez pas encore de modules pédagogiques affectés pour cette année universitaire. Veuillez contacter la direction des études de l'ENCG Fès.
        </p>
      </div>
    </div>
  );
}
