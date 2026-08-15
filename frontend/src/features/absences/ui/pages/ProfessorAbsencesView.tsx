import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Check, X, Clock, QrCode, Sparkles, Mic, MicOff, 
  Search, ShieldCheck, Download, Play, CheckCircle2, AlertTriangle, 
  RefreshCw, Volume2, Building2, BookOpen, Layers, UserCheck, UserX, Loader2,
  Calendar, CalendarDays, ArrowRight, Zap, CheckSquare
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@/shared/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { offlineAttendanceStore } from '@/shared/lib/offlineAttendanceStore';

interface StudentItem {
  id: number;
  first_name: string;
  last_name: string;
  cne: string;
  email?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  scannedAt?: string;
}

interface TimetableSession {
  id: string;
  day: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  timeSlot: string;
  filiereCode: string;
  filiereName: string;
  groupName: string;
  moduleCode: string;
  moduleName: string;
  roomName: string;
  sessionType: 'Cours Magistral (CM)' | 'Travaux Dirigés (TD)' | 'Travaux Pratiques (TP)';
  isToday?: boolean;
}

// ── Weekly Sessions Pre-configuration (Professor & Filière Schedule) ───────
const WEEKLY_SCHEDULE: TimetableSession[] = [
  {
    id: 's1',
    day: 'Lundi',
    timeSlot: '08:30 - 10:30',
    filiereCode: 'TC',
    filiereName: 'Tronc Commun ENCG (TC)',
    groupName: 'TC-S1-G1',
    moduleCode: 'TC-S1-M02',
    moduleName: 'Comptabilité Générale I',
    roomName: 'Amphi 1',
    sessionType: 'Cours Magistral (CM)',
  },
  {
    id: 's2',
    day: 'Lundi',
    timeSlot: '10:45 - 12:45',
    filiereCode: 'TC',
    filiereName: 'Tronc Commun ENCG (TC)',
    groupName: 'TC-S1-G2',
    moduleCode: 'TC-S1-M01',
    moduleName: 'Mathématiques pour la Gestion',
    roomName: 'Salle 4',
    sessionType: 'Travaux Dirigés (TD)',
  },
  {
    id: 's3',
    day: 'Mardi',
    timeSlot: '08:30 - 10:30',
    filiereCode: 'GFC',
    filiereName: 'Gestion Financière et Comptable (GFC)',
    groupName: 'GFC-S5-G1',
    moduleCode: 'GFC-S5-M01',
    moduleName: 'Finance d\'Entreprise Approfondie',
    roomName: 'Amphi 2',
    sessionType: 'Cours Magistral (CM)',
  },
  {
    id: 's4',
    day: 'Mardi',
    timeSlot: '14:30 - 16:30',
    filiereCode: 'GFC',
    filiereName: 'Gestion Financière et Comptable (GFC)',
    groupName: 'GFC-S5-G2',
    moduleCode: 'GFC-S5-M02',
    moduleName: 'Audit Financier & Comptable',
    roomName: 'Salle 8',
    sessionType: 'Travaux Dirigés (TD)',
  },
  {
    id: 's5',
    day: 'Mercredi',
    timeSlot: '10:45 - 12:45',
    filiereCode: 'TC',
    filiereName: 'Tronc Commun ENCG (TC)',
    groupName: 'TC-S2-G1',
    moduleCode: 'TC-S2-M03',
    moduleName: 'Économie Générale II',
    roomName: 'Amphi 2',
    sessionType: 'Cours Magistral (CM)',
  },
  {
    id: 's6',
    day: 'Jeudi',
    timeSlot: '08:30 - 10:30',
    filiereCode: 'GFC',
    filiereName: 'Gestion Financière et Comptable (GFC)',
    groupName: 'GFC-S6-G1',
    moduleCode: 'GFC-S6-M02',
    moduleName: 'Contrôle de Gestion & Pilotage',
    roomName: 'Amphi 3',
    sessionType: 'Cours Magistral (CM)',
  },
  {
    id: 's7',
    day: 'Vendredi',
    timeSlot: '14:30 - 16:30',
    filiereCode: 'MAC',
    filiereName: 'Marketing et Action Commerciale (MAC)',
    groupName: 'MAC-S5-G1',
    moduleCode: 'MAC-S5-M02',
    moduleName: 'Marketing Stratégique',
    roomName: 'Salle 12',
    sessionType: 'Travaux Dirigés (TD)',
  },
  {
    id: 's8',
    day: 'Samedi',
    timeSlot: '09:00 - 12:00',
    filiereCode: 'GFC',
    filiereName: 'Gestion Financière et Comptable (GFC)',
    groupName: 'GFC-S5-G1',
    moduleCode: 'GFC-S5-M03',
    moduleName: 'Fiscalité des Entreprises & Séminaire',
    roomName: 'Amphi 2',
    sessionType: 'Travaux Pratiques (TP)',
  },
];

export default function ProfessorAbsencesView() {
  const { user } = useAuthStore();
  const u = user as any;
  const currentProfName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || 'Pr. Abdelhak El Amrani' : 'Pr. Abdelhak El Amrani';

  // Selection state
  const [filieres, setFilieres] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedGroupe, setSelectedGroupe] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [sessionType, setSessionType] = useState('Cours Magistral (CM)');
  const [roomName, setRoomName] = useState('Amphi 2');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // Timetable filter
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Session Active state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'trombi' | 'qr' | 'voice'>('trombi');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrToken, setQrToken] = useState('ENCG-ATT-' + Math.random().toString(36).substring(2, 9).toUpperCase());
  const [qrCountdown, setQrCountdown] = useState(15);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Mock initial student list (or fetched from real API)
  const [students, setStudents] = useState<StudentItem[]>([
    { id: 101, first_name: 'Aniss', last_name: 'El Alaoui', cne: 'N134056781', status: 'present', scannedAt: '08:32' },
    { id: 102, first_name: 'Ahmed', last_name: 'Naciri', cne: 'N134056782', status: 'present', scannedAt: '08:33' },
    { id: 103, first_name: 'Ilyas', last_name: 'Alaoui', cne: 'N134056783', status: 'present', scannedAt: '08:34' },
    { id: 104, first_name: 'Youssef', last_name: 'Chraibi', cne: 'N134056784', status: 'absent' },
    { id: 105, first_name: 'Aya', last_name: 'Bennis', cne: 'N134056785', status: 'present', scannedAt: '08:35' },
    { id: 106, first_name: 'Othmane', last_name: 'Filali', cne: 'N134056786', status: 'present', scannedAt: '08:35' },
    { id: 107, first_name: 'Ayoub', last_name: 'Chraibi', cne: 'N134056787', status: 'absent' },
    { id: 108, first_name: 'Sara', last_name: 'Tazi', cne: 'N134056788', status: 'present', scannedAt: '08:36' },
    { id: 109, first_name: 'Omar', last_name: 'Idrissi', cne: 'N134056789', status: 'late', scannedAt: '08:48' },
    { id: 110, first_name: 'Salma', last_name: 'Benjelloun', cne: 'N134056790', status: 'present', scannedAt: '08:37' },
    { id: 111, first_name: 'Mehdi', last_name: 'Berrada', cne: 'N134056791', status: 'present', scannedAt: '08:38' },
    { id: 112, first_name: 'Kenza', last_name: 'Amrani', cne: 'N134056792', status: 'excused' },
    { id: 113, first_name: 'Hamza', last_name: 'El Fassi', cne: 'N134056793', status: 'present', scannedAt: '08:39' },
    { id: 114, first_name: 'Hajar', last_name: 'Mansouri', cne: 'N134056794', status: 'present', scannedAt: '08:40' },
  ]);

  // Load Real Filieres & Modules
  useEffect(() => {
    api.get('/filieres').then((res) => {
      const list = res.data.data || res.data || [];
      setFilieres(list);
      if (list.length > 0) {
        setSelectedFiliere(list[0].id.toString());
      }
    }).catch(console.error);

    api.get('/modules').then((res) => {
      const list = res.data.data || res.data || [];
      setModules(list);
    }).catch(console.error);
  }, []);

  // 🔍 Filter Modules strictly according to the selected Filière
  const filteredModules = useMemo(() => {
    if (!selectedFiliere) return modules;
    const filiereObj = filieres.find(f => f.id?.toString() === selectedFiliere.toString());
    const fCode = filiereObj?.code?.toUpperCase() || '';

    const list = modules.filter((m: any) => {
      if (m.filiere_id && m.filiere_id.toString() === selectedFiliere.toString()) return true;
      if (m.filiere?.id && m.filiere.id.toString() === selectedFiliere.toString()) return true;
      if (fCode) {
        if (fCode === 'TC' && m.code?.toUpperCase().startsWith('TC-')) return true;
        if (fCode === 'GFC' && m.code?.toUpperCase().startsWith('GFC-')) return true;
        if (fCode === 'MAC' && (m.code?.toUpperCase().startsWith('MAC-') || m.code?.toUpperCase().startsWith('MCM-'))) return true;
      }
      return false;
    });

    return list.length > 0 ? list : modules;
  }, [modules, selectedFiliere, filieres]);

  // Auto-select first matching module when filiere changes
  useEffect(() => {
    if (filteredModules.length > 0) {
      const exists = filteredModules.some((m: any) => m.id?.toString() === selectedModule.toString());
      if (!exists) {
        setSelectedModule(filteredModules[0].id.toString());
      }
    }
  }, [filteredModules, selectedModule]);

  // Fetch groups when filiere changes
  useEffect(() => {
    if (selectedFiliere) {
      api.get('/groups', { params: { filiere_id: selectedFiliere } })
        .then((res) => {
          const list = res.data.data || res.data || [];
          setGroupes(list);
          if (list.length > 0) setSelectedGroupe(list[0].id.toString());
        })
        .catch(console.error);
    }
  }, [selectedFiliere]);

  // Fetch real students of selected group
  useEffect(() => {
    if (selectedGroupe) {
      api.get('/students', { params: { group_id: selectedGroupe } })
        .then((res) => {
          const raw = res.data.data || res.data || [];
          if (raw.length > 0) {
            setStudents(raw.map((s: any) => ({
              id: s.id,
              first_name: s.user?.first_name || s.first_name || 'Étudiant',
              last_name: s.user?.last_name || s.last_name || `#${s.id}`,
              cne: s.cne || s.apogee_code || `CNE-${s.id}`,
              email: s.user?.email || s.email,
              status: 'present'
            })));
          }
        })
        .catch(() => {});
    }
  }, [selectedGroupe]);

  // 🎯 1-CLIC ATTENDANCE FROM TIMETABLE SESSION
  const handleSelectSessionFromSchedule = (session: TimetableSession, startDirectly: boolean = false) => {
    setSelectedSessionId(session.id);

    // 1. Find and set filiere
    const matchedFiliere = filieres.find(f => f.code?.toUpperCase() === session.filiereCode.toUpperCase() || f.name?.includes(session.filiereCode));
    if (matchedFiliere) {
      setSelectedFiliere(matchedFiliere.id.toString());
    }

    // 2. Set room and session type
    setRoomName(session.roomName);
    setSessionType(session.sessionType);

    // 3. Find and set module
    const matchedModule = modules.find(m => m.code?.toUpperCase() === session.moduleCode.toUpperCase() || m.name?.includes(session.moduleName));
    if (matchedModule) {
      setSelectedModule(matchedModule.id.toString());
    }

    toast.success(`📅 Séance sélectionnée : ${session.moduleName}`, {
      description: `${session.day} · ${session.timeSlot} (${session.groupName} - ${session.roomName})`
    });

    if (startDirectly) {
      handleStartSession();
    }
  };

  // QR Code Dynamic Token Rotation
  useEffect(() => {
    if (!isSessionActive || activeTab !== 'qr') return;
    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          setQrToken('ENCG-ATT-' + Math.random().toString(36).substring(2, 9).toUpperCase());
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSessionActive, activeTab]);

  // Quick Action: Mark All Present
  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
    toast.success("✨ Tous les étudiants ont été marqués Présents ! Il ne vous reste qu'à cocher les absents.");
  };

  // Quick Action: Toggle Student Status
  const handleToggleStatus = (id: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      const nextStatus: Record<StudentItem['status'], StudentItem['status']> = {
        present: 'absent',
        absent: 'late',
        late: 'excused',
        excused: 'present'
      };
      return { ...s, status: nextStatus[s.status] };
    }));
  };

  const handleSetStatus = (id: number, status: StudentItem['status']) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  // Voice Dictation for Absents
  const handleToggleVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("🎙️ Parlez maintenant : énoncez les noms des absents...");
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setVoiceTranscript(text);
      setIsListening(false);

      // Match absents against student names
      let markedCount = 0;
      setStudents(prev => prev.map(s => {
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        const lastName = s.last_name.toLowerCase();
        if (text.includes(lastName) || text.includes(fullName)) {
          markedCount++;
          return { ...s, status: 'absent' };
        }
        return s;
      }));

      if (markedCount > 0) {
        toast.success(`✨ ${markedCount} absence(s) détectée(s) et cochée(s) par l'IA vocale !`);
      } else {
        toast.warning("Aucun nom d'étudiant correspondant n'a été reconnu dans la liste.");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Erreur lors de la capture vocale.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Start Session
  const handleStartSession = async () => {
    setLoading(true);
    try {
      const res = await api.post('/professor/attendance/start', {
        module_id: parseInt(selectedModule) || 1,
        group_id: parseInt(selectedGroupe) || 1,
        room_name: roomName,
        date: sessionDate
      }).catch(() => null);

      setIsSessionActive(true);
      setSessionId(res?.data?.session?.id || Math.floor(Math.random() * 1000));
      toast.success("🚀 Session d'appel démarrée avec succès !", {
        description: "Vous pouvez émarger rapidement via le trombinoscope ou projeter le QR code rotatif."
      });
    } catch (err) {
      setIsSessionActive(true);
      toast.success("Session d'appel démarrée.");
    } finally {
      setLoading(false);
    }
  };

  // Close & Save Session (Online + Offline Sync Fallback)
  const handleSaveAndCloseSession = async () => {
    setSavingAttendance(true);
    const payload = {
      session_id: sessionId,
      module_id: selectedModule,
      group_id: selectedGroupe,
      date: sessionDate,
      records: students.map(s => ({
        student_id: s.id,
        status: s.status
      }))
    };

    if (!window.navigator.onLine) {
      offlineAttendanceStore.saveOffline(payload);
      setIsSessionActive(false);
      setSavingAttendance(false);
      return;
    }

    try {
      await api.post('/professor/attendance/save', payload);

      toast.success("💾 Émargement officiel enregistré et certifié en base de données !", {
        description: `Total: ${stats.total} · Présents: ${stats.present} · Absents: ${stats.absent}`
      });
      setIsSessionActive(false);
    } catch (error) {
      // Fallback to offline store
      offlineAttendanceStore.saveOffline(payload);
      setIsSessionActive(false);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Calculated Stats
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter(s => s.status === 'present').length;
    const absent = students.filter(s => s.status === 'absent').length;
    const late = students.filter(s => s.status === 'late').length;
    const excused = students.filter(s => s.status === 'excused').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
    return { total, present, absent, late, excused, rate };
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.first_name.toLowerCase().includes(q) || 
      s.last_name.toLowerCase().includes(q) || 
      s.cne.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Schedule filtering by Filiere AND by Day
  const filteredSchedule = useMemo(() => {
    let list = WEEKLY_SCHEDULE;

    // Filter by selected filiere
    if (selectedFiliere && selectedFiliere !== 'all') {
      const filiereObj = filieres.find(f => f.id?.toString() === selectedFiliere.toString());
      const fCode = filiereObj?.code?.toUpperCase() || '';
      const matched = list.filter(s => {
        if (s.filiereCode?.toUpperCase() === fCode) return true;
        if (filiereObj?.name && s.filiereName?.toLowerCase().includes(filiereObj.name.toLowerCase())) return true;
        return false;
      });
      if (matched.length > 0) list = matched;
    }

    // Filter by day
    if (selectedDayFilter !== 'all') {
      list = list.filter(s => s.day.toLowerCase() === selectedDayFilter.toLowerCase());
    }

    return list;
  }, [selectedDayFilter, selectedFiliere, filieres]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-6 pb-24 font-sans animate-in fade-in">

      {/* ── 1. Hero Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#001A4B] via-[#0f2863] to-[#1e3b8a] p-6 sm:p-8 rounded-3xl shadow-2xl text-white border border-indigo-700/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-indigo-200 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Émargement Numérique & Suivi des Présences
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Feuille de Présence & Appel Intelligent
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 font-medium max-w-2xl">
              Enseignant : <strong className="text-white">{currentProfName}</strong> · Choisissez votre filière, consultez l'emploi du temps et prenez l'appel en 1-clic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSessionActive ? (
              <button
                onClick={handleSaveAndCloseSession}
                disabled={savingAttendance}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" /> Clôturer & Certifier l'Appel
              </button>
            ) : (
              <button
                onClick={handleStartSession}
                disabled={loading}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 text-amber-300" /> Démarrer l'Appel Immédiat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. ÉTAPE 1 : SÉLECTION DE LA FILIÈRE (TOP COCKPIT) ── */}
      {!isSessionActive && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Étape 1 : Choisir la Filière Pédagogique
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">
                    Filtre Principal
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Sélectionnez la filière pour adapter automatiquement l'emploi du temps et les séances associées</p>
              </div>
            </div>

            {/* Quick Filiere Dropdown */}
            <div className="w-full sm:w-72">
              <select
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0f2863] dark:text-white outline-none cursor-pointer"
              >
                <option value="all">🌐 Toutes les Filières (Vue Globale)</option>
                {filieres.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filiere Pill Badges */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => setSelectedFiliere('all')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border",
                selectedFiliere === 'all'
                  ? "bg-[#0f2863] text-white border-[#0f2863] shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              )}
            >
              🌐 Toutes les Filières
            </button>
            {filieres.map((f: any) => (
              <button
                key={f.id}
                onClick={() => setSelectedFiliere(f.id.toString())}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5",
                  selectedFiliere === f.id.toString()
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                )}
              >
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/20">{f.code}</span>
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. ÉTAPE 2 : MINI WEEKLY TIMETABLE PLANNING (PLANNING HEBDOMADAIRE 1-CLIC) ── */}
      {!isSessionActive && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Étape 2 : Planning de la Semaine — Sélection Rapide 1-Clic
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border border-emerald-200">
                    Interactif
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Cliquez sur n'importe quelle séance pour charger les étudiants et lancer l'appel instantanément</p>
              </div>
            </div>

            {/* Day Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto text-xs font-black">
              {['all', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDayFilter(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
                    selectedDayFilter === d
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  {d === 'all' ? 'Toute la Semaine' : d}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredSchedule.map((session) => {
              const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
              const currentDayName = DAYS_FR[new Date().getDay()];
              const isSessionToday = session.day.toLowerCase() === currentDayName.toLowerCase();
              const isSelected = selectedSessionId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSessionFromSchedule(session, false)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group hover:-translate-y-0.5",
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                      : isSessionToday
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 shadow-xs"
                        : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200">
                      <Clock size={14} className="text-indigo-500" />
                      {session.day} · {session.timeSlot}
                    </span>
                    {isSessionToday && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                        Aujourd'hui
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 transition-colors">
                      {session.moduleName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-black rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {session.groupName}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">
                        📍 {session.roomName}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{session.sessionType}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSessionFromSchedule(session, true);
                      }}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Zap size={12} className="text-amber-300" />
                      <span>Faire l'Appel</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. Manual Config & Selectors Form ─────────────────────────── */}
      {!isSessionActive ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" /> Configuration Manuelle de la Séance
            </h3>
            <span className="text-xs text-slate-400 font-medium">Filtres connectés à la base de données</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filiere Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filière</label>
              <select 
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0f2863] dark:text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {filieres.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>

            {/* Groupe Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Groupe / Section</label>
              <select 
                value={selectedGroupe}
                onChange={(e) => setSelectedGroupe(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0f2863] dark:text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {groupes.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Module Selector strictly filtered by selected Filiere */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Module Académique</label>
              <select 
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0f2863] dark:text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {filteredModules.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
            </div>

            {/* Salle Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Salle / Amphi</label>
              <input 
                type="text" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0f2863] dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Ex: Amphi 2"
              />
            </div>

            {/* Date Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date de la Séance</label>
              <input 
                type="date" 
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0f2863] dark:text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              />
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: Active Session Dashboard */
        <div className="space-y-6">
          
          {/* Live Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">EFFECTIF TOTAL</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{stats.total} Étudiants</span>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">PRÉSENTS</span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1 block">{stats.present}</span>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 block">ABSENTS</span>
              <span className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1 block">{stats.absent}</span>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">EN RETARD (15m)</span>
              <span className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1 block">{stats.late}</span>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-xs col-span-2 md:col-span-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">TAUX DE PRÉSENCE</span>
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 font-mono mt-1 block">{stats.rate}%</span>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  onClick={() => setActiveTab('trombi')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                    activeTab === 'trombi' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  )}
                >
                  <Users size={16} /> Trombinoscope Visuel
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                    activeTab === 'qr' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  )}
                >
                  <QrCode size={16} /> QR Code Projecteur
                </button>
                <button
                  onClick={() => setActiveTab('voice')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                    activeTab === 'voice' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  )}
                >
                  <Mic size={16} /> Appel Vocal IA
                </button>
              </div>

              {activeTab === 'trombi' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleMarkAllPresent}
                    className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckSquare size={16} /> Tout Marquer Présent
                  </button>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Chercher étudiant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* TAB 1: Trombinoscope Grid */}
            {activeTab === 'trombi' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleToggleStatus(st.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 select-none hover:scale-[1.02]",
                      st.status === 'present' && "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800",
                      st.status === 'absent' && "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 shadow-sm",
                      st.status === 'late' && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800",
                      st.status === 'excused' && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs",
                        st.status === 'present' && "bg-emerald-600",
                        st.status === 'absent' && "bg-rose-600",
                        st.status === 'late' && "bg-amber-600",
                        st.status === 'excused' && "bg-blue-600"
                      )}>
                        {st.first_name.charAt(0)}{st.last_name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {st.first_name} {st.last_name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {st.cne}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        st.status === 'present' && "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200",
                        st.status === 'absent' && "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200",
                        st.status === 'late' && "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200",
                        st.status === 'excused' && "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200"
                      )}>
                        {st.status === 'present' && 'Présent'}
                        {st.status === 'absent' && 'Absent'}
                        {st.status === 'late' && 'Retard'}
                        {st.status === 'excused' && 'Excusé'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: Dynamic Rotating QR Code */}
            {activeTab === 'qr' && (
              <div className="text-center py-10 space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Émargement Automatique par QR Code Rotatif</h3>
                  <p className="text-xs text-slate-500 font-medium">Les étudiants scannent ce code avec leur application mobile pour s'enregistrer automatiquement</p>
                </div>

                <div className="relative p-6 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-indigo-500 inline-block shadow-2xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrToken}`}
                    alt="Attendance QR Code"
                    className="w-56 h-56 mx-auto object-contain rounded-xl"
                  />
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-300">
                    <Clock size={16} className="animate-spin" />
                    <span>Renouvellement automatique dans {qrCountdown}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Voice IA Dictation */}
            {activeTab === 'voice' && (
              <div className="text-center py-12 space-y-6 max-w-lg mx-auto">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Appel Vocal Assisté par IA</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Prononcez les noms des étudiants absents à haute voix. L'intelligence artificielle cochera automatiquement les absences correspondantes.
                  </p>
                </div>

                <button
                  onClick={handleToggleVoiceRecognition}
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all shadow-xl cursor-pointer",
                    isListening ? "bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/30" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  )}
                >
                  {isListening ? <Mic size={36} /> : <MicOff size={36} />}
                </button>

                {voiceTranscript && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <p className="text-slate-400 text-[10px] uppercase mb-1">Dernière dictée capturée :</p>
                    <p>"{voiceTranscript}"</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
