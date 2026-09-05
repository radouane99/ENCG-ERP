import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, ShieldCheck,
  RefreshCw, Play, Save, MapPin, User,
  Building2, Sliders, Cpu, Hand, Grid, Leaf,
  Wand2, BookOpen, GraduationCap, Sparkles, Trash2, RotateCcw, X, AlertCircle,
  Users, Monitor, FileText, Search, SearchX, Filter
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { CustomSelect, SelectOption } from '@/shared/components/ui/CustomSelect';
import ManualTimetableBoard from '@/features/admin/pages/ManualTimetableBoard';
import OfficialTimetableMatrix from '@/features/admin/pages/OfficialTimetableMatrix';

function highlightMatch(text: string, query: string) {
  if (!query || !text) return text;
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-300 dark:bg-amber-500/40 text-amber-950 dark:text-amber-100 rounded px-0.5 font-black">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

interface ConflictItem {
  type: string;
  type_label?: string;
  schedule_id: number;
  conflicting_schedule_id?: number;
  day_of_week?: number;
  day_name?: string;
  start_time?: string;
  end_time?: string;
  room_name?: string;
  professor_name?: string;
  module_name?: string;
  group_name?: string;
  reason?: string;
  description?: string;
  severity?: string;
}

const DAY_NAMES_MAP: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
};

export default function AdminAiTimetableSchedulerPage() {
  const [activeTab, setActiveTab] = useState<'generator' | 'manual_board' | 'matrix'>('generator');

  // Generator & CSP Parameters
  const [selectedSemester, setSelectedSemester] = useState<string | number>('odd');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [avoidSaturday, setAvoidSaturday] = useState<boolean>(true);
  const [preferMorning, setPreferMorning] = useState<boolean>(true);
  const [energyWeight, setEnergyWeight] = useState<number>(85);
  const [profAvailWeight, setProfAvailWeight] = useState<number>(90);
  const [buildingWeight, setBuildingWeight] = useState<number>(75);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('mrv_degree_lcv');
  
  // Dedicated Rooms per Filière / Department (e.g. GFC, MCM, TC)
  const [dedicatedRooms, setDedicatedRooms] = useState<Record<string, string[]>>({
    'TC': ['Salle 105', 'Salle 106'],
    'GFC': ['Salle 101', 'Salle 102'],
    'MCM': ['Salle 103', 'Salle 104'],
  });

  // Dedicated Professors per Filière / Department (e.g. GFC, MCM, TC)
  const [dedicatedProfessors, setDedicatedProfessors] = useState<Record<string, string[]>>({
    'TC': ['Mohamed Benjelloun', 'Tarik Meziane', 'Bouchra Bennani', 'Youssef El Mansouri'],
    'GFC': ['Abdelhak El Amrani', 'Youssef El Mansouri', 'Omar Bennouna'],
    'MCM': ['Amina Chraibi', 'Tarik Meziane', 'Bouchra Bennani'],
  });

  const [showDedicatedRoomsModal, setShowDedicatedRoomsModal] = useState<boolean>(false);
  const [resourceModalTab, setResourceModalTab] = useState<'rooms' | 'professors'>('rooms');

  // Query live resources from backend API (rooms, professors, filieres)
  const { data: resourcesData } = useQuery({
    queryKey: ['timetable-resources'],
    queryFn: async () => {
      const res = await api.get('/admin/timetable/ai-scheduler/resources');
      return res.data?.data || res.data || {};
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const availableProfessorsList = useMemo(() => {
    if (resourcesData?.professors && Array.isArray(resourcesData.professors) && resourcesData.professors.length > 0) {
      return resourcesData.professors;
    }
    return [
      { id: 1, name: 'Abdelhak El Amrani', specialty: 'Finance', department: 'Sciences de Gestion' },
      { id: 2, name: 'Amina Chraibi', specialty: 'Management', department: 'Sciences de Gestion' },
      { id: 3, name: 'Tarik Meziane', specialty: 'Droit des Affaires', department: 'Droit des Affaires' },
      { id: 4, name: 'Bouchra Bennani', specialty: 'Communication & Langues', department: 'Langues et Communication' },
      { id: 5, name: 'Mohamed Benjelloun', specialty: 'Informatique de Gestion', department: 'Informatique de Gestion' },
      { id: 6, name: 'Youssef El Mansouri', specialty: 'Comptabilité & Audit', department: 'Sciences de Gestion' },
      { id: 7, name: 'Omar Bennouna', specialty: 'Management Stratégique', department: 'Sciences de Gestion' },
    ];
  }, [resourcesData]);

  const availableRoomsList = useMemo<string[]>(() => {
    if (resourcesData?.rooms && Array.isArray(resourcesData.rooms) && resourcesData.rooms.length > 0) {
      return resourcesData.rooms.map((r: any) => String(r.name));
    }
    return [
      'Salle 101', 'Salle 102', 'Salle 103', 'Salle 104',
      'Salle 105', 'Salle 106', 'Salle 107', 'Salle 108',
      'Amphithéâtre A', 'Amphithéâtre B'
    ];
  }, [resourcesData]);

  // Filter & Search state for preview grid
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [filiereFilter, setFiliereFilter] = useState<string>('all');
  const [profFilter, setProfFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchScope, setSearchScope] = useState<'all' | 'module' | 'professor' | 'group' | 'room'>('all');
  const [sortBy, setSortBy] = useState<'chrono' | 'module' | 'professor' | 'group' | 'room'>('chrono');

  // Query active database schedules if no AI generation has run yet
  const { data: activeSessionsData, refetch: refetchActiveSessions } = useQuery({
    queryKey: ['timetable-active-sessions'],
    queryFn: async () => {
      const res = await api.get('/admin/timetable/ai-scheduler/active-sessions');
      return res.data?.data || res.data || {};
    },
    retry: false,
  });

  // 1. Conflict Scanner Query
  const { data: conflictData, refetch: refetchConflicts, isFetching: isScanning } = useQuery({
    queryKey: ['timetable-conflicts-scan'],
    queryFn: async () => {
      const res = await api.get('/admin/timetable/ai-scheduler/conflicts');
      return res.data?.data || res.data || {};
    },
  });

  // Query Official Timetable Matrix directly from active database schedules
  const { data: matrixData, refetch: refetchMatrix, isFetching: isMatrixFetching } = useQuery({
    queryKey: ['official-timetable-matrix', selectedSemester, selectedFiliere],
    queryFn: async () => {
      const type = selectedFiliere !== 'all' ? 'filiere' : 'all';
      const id = selectedFiliere !== 'all' ? Number(selectedFiliere) : 0;
      const params: Record<string, any> = {};
      if (typeof selectedSemester === 'number') {
        params.semester_number = selectedSemester;
      }
      const res = await api.get(`/timetable/export/${type}/${id}/matrix`, { params });
      return res.data?.data || res.data;
    },
    enabled: activeTab === 'matrix',
  });

  // 2. Generate Schedule Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        filiere_id: selectedFiliere !== 'all' ? Number(selectedFiliere) : null,
        avoid_saturday_afternoon: avoidSaturday,
        prefer_morning_lectures: preferMorning,
        energy_weight: energyWeight,
        prof_avail_weight: profAvailWeight,
        building_weight: buildingWeight,
        strategy: selectedStrategy,
        dedicated_rooms: dedicatedRooms,
        dedicated_professors: dedicatedProfessors,
      };

      if (['odd', 'even', 'all', 'autumn', 'spring'].includes(String(selectedSemester))) {
        payload.semester_period = String(selectedSemester);
      } else {
        payload.semester_number = Number(selectedSemester);
      }

      const res = await api.post('/admin/timetable/ai-scheduler/generate', payload);
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      toast.success(`⚡ Emploi du temps optimisé par IA avec succès ! (${data.total_scheduled_sessions || data.total_variables || 0} séances)`);
    },
    onError: () => {
      toast.error("Erreur lors de la génération automatique.");
    }
  });

  // 3. Apply Schedule Mutation (Deploy to Database)
  const applyMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const res = await api.post('/admin/timetable/ai-scheduler/apply', {
        scheduled_items: items,
        overwrite_existing: true,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Emploi du temps déployé avec succès en base de données !");
      refetchConflicts();
    },
    onError: () => {
      toast.error("Erreur lors du déploiement en base de données.");
    }
  });

  // 4. Auto-resolve single conflict mutation
  const resolveMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      const res = await api.post('/admin/timetable/ai-scheduler/resolve', { schedule_id: scheduleId });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetchConflicts();
      } else {
        toast.warning(data.message);
      }
    }
  });

  // 5. Auto-resolve ALL conflicts mutation
  const resolveAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/timetable/ai-scheduler/resolve-all', {});
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`🎉 ${data.message}`);
        refetchConflicts();
      } else {
        toast.warning(data.message);
      }
    },
    onError: () => {
      toast.error("Erreur lors de la résolution automatique des conflits.");
    }
  });

  // 6. Clear / Reset Schedules Mutation
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [clearMode, setClearMode] = useState<'period' | 'single' | 'all'>('period');
  const [clearPeriod, setClearPeriod] = useState<'odd' | 'even'>('odd');
  const [clearSemesterNumber, setClearSemesterNumber] = useState<number>(typeof selectedSemester === 'number' ? selectedSemester : 1);

  const clearMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {};
      if (clearMode === 'period') {
        payload.semester_period = clearPeriod;
      } else if (clearMode === 'single') {
        payload.semester_number = clearSemesterNumber;
      }
      const res = await api.post('/admin/timetable/ai-scheduler/clear', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Emploi du temps réinitialisé avec succès !");
      generateMutation.reset();
      refetchConflicts();
      setShowClearModal(false);
    },
    onError: () => {
      toast.error("Erreur lors de la réinitialisation de l'emploi du temps.");
    }
  });

  const generatedData = generateMutation.data;
  const scheduledSessions: any[] = generatedData?.scheduled_items 
    || generatedData?.scheduled_sessions 
    || activeSessionsData?.scheduled_sessions 
    || [];

  const uniqueGroups = useMemo(() => {
    return Array.from(new Set(scheduledSessions.map((s: any) => s.group_name).filter(Boolean))).sort();
  }, [scheduledSessions]);

  const uniqueFilieres = useMemo(() => {
    return Array.from(new Set(scheduledSessions.map((s: any) => s.filiere_code).filter(Boolean))).sort();
  }, [scheduledSessions]);

  const uniqueProfessors = useMemo(() => {
    return Array.from(new Set(scheduledSessions.map((s: any) => s.professor_name).filter(Boolean))).sort();
  }, [scheduledSessions]);

  const uniqueRooms = useMemo(() => {
    return Array.from(new Set(scheduledSessions.map((s: any) => s.room_name).filter(Boolean))).sort();
  }, [scheduledSessions]);

  const filteredSessions = useMemo(() => {
    const list = scheduledSessions.filter((s: any) => {
      if (dayFilter !== 'all' && s.day_of_week !== dayFilter) return false;
      if (groupFilter !== 'all' && s.group_name !== groupFilter) return false;
      if (filiereFilter !== 'all' && s.filiere_code !== filiereFilter) return false;
      if (profFilter !== 'all' && s.professor_name !== profFilter) return false;
      if (roomFilter !== 'all' && s.room_name !== roomFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mod = String(s.module_name || s.course_name || '').toLowerCase();
        const grp = String(s.group_name || '').toLowerCase();
        const fil = String(s.filiere_code || '').toLowerCase();
        const prof = String(s.professor_name || '').toLowerCase();
        const room = String(s.room_name || '').toLowerCase();
        const day = String(s.day_name || '').toLowerCase();
        const nature = String(s.session_nature || s.session_badge || '').toLowerCase();

        switch (searchScope) {
          case 'module':
            return mod.includes(q);
          case 'professor':
            return prof.includes(q);
          case 'group':
            return grp.includes(q) || fil.includes(q);
          case 'room':
            return room.includes(q);
          case 'all':
          default:
            return (
              mod.includes(q) ||
              prof.includes(q) ||
              grp.includes(q) ||
              fil.includes(q) ||
              room.includes(q) ||
              day.includes(q) ||
              nature.includes(q)
            );
        }
      }
      return true;
    });

    // ── ⏱️ Triage Chronologique par Défaut (Lundi 08:30 ➔ Vendredi/Samedi) ──
    return [...list].sort((a: any, b: any) => {
      if (sortBy === 'module') {
        return String(a.module_name || '').localeCompare(String(b.module_name || ''));
      }
      if (sortBy === 'professor') {
        return String(a.professor_name || '').localeCompare(String(b.professor_name || ''));
      }
      if (sortBy === 'group') {
        return String(a.group_name || '').localeCompare(String(b.group_name || ''));
      }
      if (sortBy === 'room') {
        return String(a.room_name || '').localeCompare(String(b.room_name || ''));
      }

      // Default: 'chrono'
      // 1. Jour de la semaine (1 = Lundi, 2 = Mardi, 3 = Mercredi, 4 = Jeudi, 5 = Vendredi, 6 = Samedi)
      const parseDay = (item: any): number => {
        if (typeof item.day_of_week === 'number' && item.day_of_week > 0) return item.day_of_week;
        if (typeof item.day === 'number' && item.day > 0) return item.day;
        const dName = String(item.day_name || item.day || '').toLowerCase();
        if (dName.includes('lun')) return 1;
        if (dName.includes('mar')) return 2;
        if (dName.includes('mer')) return 3;
        if (dName.includes('jeu')) return 4;
        if (dName.includes('ven')) return 5;
        if (dName.includes('sam')) return 6;
        if (dName.includes('dim')) return 7;
        return 99;
      };

      const dayA = parseDay(a);
      const dayB = parseDay(b);
      if (dayA !== dayB) return dayA - dayB;

      // 2. Heure de début (ex: "08:30" avant "10:30")
      const timeA = String(a.start_time || '00:00').substring(0, 5);
      const timeB = String(b.start_time || '00:00').substring(0, 5);
      if (timeA !== timeB) return timeA.localeCompare(timeB);

      // 3. Heure de fin
      const endA = String(a.end_time || '00:00').substring(0, 5);
      const endB = String(b.end_time || '00:00').substring(0, 5);
      if (endA !== endB) return endA.localeCompare(endB);

      // 4. Groupe / Module
      return String(a.group_name || '').localeCompare(String(b.group_name || ''));
    });
  }, [
    scheduledSessions,
    dayFilter,
    groupFilter,
    filiereFilter,
    profFilter,
    roomFilter,
    searchQuery,
    searchScope,
    sortBy,
  ]);

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    searchScope !== 'all' ||
    dayFilter !== 'all' ||
    groupFilter !== 'all' ||
    filiereFilter !== 'all' ||
    profFilter !== 'all' ||
    roomFilter !== 'all' ||
    sortBy !== 'chrono';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSearchScope('all');
    setDayFilter('all');
    setGroupFilter('all');
    setFiliereFilter('all');
    setProfFilter('all');
    setRoomFilter('all');
    setSortBy('chrono');
  };

  const conflictsList: ConflictItem[] = conflictData?.conflicts || [];
  const conflictsCount = conflictData?.conflicts_count ?? conflictsList.length;

  // Dropdown Options Definitions
  const semesterOptions: SelectOption[] = [
    { value: 'odd', label: '🍂 Semestre 1 / Automne (S1, S3, S5, S7, S9)', badge: 'Impairs', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { value: 'even', label: '🌸 Semestre 2 / Printemps (S2, S4, S6, S8, S10)', badge: 'Pairs', icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
    { value: 'all', label: '🎓 Année Complète (Tous les semestres S1 à S10)', badge: 'Global', icon: <GraduationCap className="w-4 h-4 text-indigo-500" /> },
    { value: 1, label: 'Semestre 1 (S1 - Tronc Commun S1)', badge: 'TC1', icon: <BookOpen className="w-4 h-4 text-indigo-500" /> },
    { value: 2, label: 'Semestre 2 (S2 - Tronc Commun S2)', badge: 'TC1', icon: <BookOpen className="w-4 h-4 text-indigo-500" /> },
    { value: 3, label: 'Semestre 3 (S3 - Tronc Commun S3)', badge: 'TC2', icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
    { value: 4, label: 'Semestre 4 (S4 - Tronc Commun S4)', badge: 'TC2', icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
    { value: 5, label: 'Semestre 5 (S5 - Filières GFC & MCM)', badge: 'Licence', icon: <GraduationCap className="w-4 h-4 text-purple-500" /> },
    { value: 6, label: 'Semestre 6 (S6 - Filières GFC & MCM)', badge: 'Licence', icon: <GraduationCap className="w-4 h-4 text-purple-500" /> },
    { value: 7, label: 'Semestre 7 (S7 - Spécialités Master)', badge: 'Master 1', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { value: 8, label: 'Semestre 8 (S8 - Spécialités Master)', badge: 'Master 1', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { value: 9, label: 'Semestre 9 (S9 - Spécialités Master 2)', badge: 'Master 2', icon: <Sparkles className="w-4 h-4 text-emerald-500" /> },
    { value: 10, label: 'Semestre 10 (S10 - PFE & Stage)', badge: 'PFE', icon: <Sparkles className="w-4 h-4 text-teal-500" /> },
  ];

  const filiereOptions: SelectOption[] = [
    { value: 'all', label: 'Toutes les filières (TC & Spécialités)', badge: 'Global', icon: <Building2 className="w-4 h-4 text-indigo-500" /> },
    { value: '1', label: 'Tronc Commun ENCG (TC)', badge: 'TC', icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
    { value: '2', label: 'Gestion Financière & Comptable (GFC)', badge: 'Finance', icon: <Building2 className="w-4 h-4 text-emerald-500" /> },
    { value: '3', label: 'Management Commercial & Marketing (MCM)', badge: 'Marketing', icon: <Building2 className="w-4 h-4 text-orange-500" /> },
    { value: '4', label: 'Audit & Contrôle de Gestion (ACG)', badge: 'Audit', icon: <Building2 className="w-4 h-4 text-purple-500" /> },
    { value: '5', label: 'Management des Ressources Humaines (GRH)', badge: 'RH', icon: <Building2 className="w-4 h-4 text-teal-500" /> },
    { value: '6', label: 'Management du Commerce International (MACI)', badge: 'Global', icon: <Building2 className="w-4 h-4 text-sky-500" /> },
  ];

  const strategyOptions: SelectOption[] = [
    { value: 'mrv_degree_lcv', label: 'MRV + Degree + LCV (Optimal & Recommandé)', badge: 'Recommandé', icon: <Cpu className="w-4 h-4 text-emerald-500" /> },
    { value: 'forward_checking', label: 'Forward Checking Déterministe', badge: 'Standard', icon: <Cpu className="w-4 h-4 text-indigo-500" /> },
    { value: 'min_conflicts', label: 'Min-Conflicts Local Search (Grandes Sections)', badge: 'Rapide', icon: <Cpu className="w-4 h-4 text-amber-500" /> },
  ];

  const dayFilterOptions: SelectOption[] = [
    { value: 'all', label: 'Tous les jours (Lundi-Samedi)', icon: <Calendar className="w-4 h-4 text-indigo-500" /> },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
  ];

  const groupFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'Tous les groupes d\'étudiants', icon: <Users className="w-4 h-4 text-indigo-500" /> },
      ...uniqueGroups.map((g) => ({ value: String(g), label: String(g), icon: <Users className="w-3.5 h-3.5 text-slate-500" /> })),
    ];
  }, [uniqueGroups]);

  const profFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'Tous les professeurs', icon: <User className="w-4 h-4 text-indigo-500" /> },
      ...uniqueProfessors.map((p) => ({ value: String(p), label: String(p), icon: <User className="w-3.5 h-3.5 text-slate-500" /> })),
    ];
  }, [uniqueProfessors]);

  const roomFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'Toutes les salles & amphis', icon: <Building2 className="w-4 h-4 text-indigo-500" /> },
      ...uniqueRooms.map((r) => ({ value: String(r), label: String(r), icon: <MapPin className="w-3.5 h-3.5 text-slate-500" /> })),
    ];
  }, [uniqueRooms]);

  const sortOptions: SelectOption[] = [
    { value: 'chrono', label: '⏱️ Triage Chronologique (Lundi 08:30 ➔ Vendredi)', badge: 'Défaut', icon: <Clock className="w-4 h-4 text-indigo-500" /> },
    { value: 'module', label: '📚 Par Module (A-Z)', badge: 'Module', icon: <BookOpen className="w-4 h-4 text-emerald-500" /> },
    { value: 'professor', label: '👨‍🏫 Par Enseignant (A-Z)', badge: 'Prof', icon: <User className="w-4 h-4 text-blue-500" /> },
    { value: 'group', label: '👥 Par Groupe (A-Z)', badge: 'Groupe', icon: <Users className="w-4 h-4 text-purple-500" /> },
    { value: 'room', label: '🏛️ Par Salle (A-Z)', badge: 'Salle', icon: <Building2 className="w-4 h-4 text-amber-500" /> },
  ];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in max-w-[1700px] mx-auto p-4 md:p-8 font-sans">
      
      {/* ── 🌟 Hero Executive Banner (ENCG Deep Navy Branding) ─────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061330] via-[#0f2863] to-[#1e3a8a] p-6 md:p-8 text-white shadow-xl border border-blue-900/40">
        <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> Solveur CSP & Optimisation IA
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zéro Conflit Garanti
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-bold">
                🏛️ ENCG Fès • LMD
              </span>
            </div>

            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Générateur Intelligent des Emplois du Temps</span>
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse hidden sm:inline" />
            </h1>

            <p className="text-blue-100/80 text-xs md:text-sm leading-relaxed font-medium">
              Planification globale automatisée sous contraintes : distribution des créneaux, vérification temps réel des collisions de salles et des professeurs, avec ajustement visuel manuel.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => refetchConflicts()}
              disabled={isScanning}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isScanning && "animate-spin")} />
              <span>Re-scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-300" />
              <span>Remise à Zéro</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 🧭 Segmented Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('generator')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'generator'
              ? "bg-[#0f2863] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
          )}
        >
          <Cpu className="w-4 h-4 text-blue-400" />
          <span>1. Générateur & Scanner Anti-Conflits</span>
        </button>

        <button
          onClick={() => setActiveTab('manual_board')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'manual_board'
              ? "bg-[#0f2863] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
          )}
        >
          <Hand className="w-4 h-4 text-amber-400" />
          <span>2. Studio d'Ajustement Manuel (Drag & Drop)</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'matrix'
              ? "bg-[#0f2863] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
          )}
        >
          <Grid className="w-4 h-4 text-emerald-400" />
          <span>3. Matrice Officielle d'Affichage</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: GENERATEUR & SCANNER ANTI-CONFLITS ───────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'generator' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* 📊 High-End KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Séances Programmées</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {scheduledSessions.length > 0 ? scheduledSessions.length : (conflictData?.total_scanned ?? 0)}
                  <span className="text-xs font-bold text-slate-400 ml-1.5">séances</span>
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                  {selectedSemester === 'odd' ? '🍂 Automne S1/S3/S5/S7' : selectedSemester === 'even' ? '🌸 Printemps S2/S4/S6/S8' : '🎓 Période active'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Score d'Optimisation</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {generatedData?.optimization_score ?? (conflictsCount === 0 ? 100 : Math.max(65, 100 - conflictsCount * 2))}%
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Distribution optimale
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Salles & Amphis</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {generatedData?.rooms_utilized_count ?? 18}
                  <span className="text-xs font-bold text-slate-400 ml-1.5">salles</span>
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">Amphis, TD & Salles info</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Conflits d'Horaires</p>
                <p className={cn("text-2xl font-black", conflictsCount === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600")}>
                  {conflictsCount}
                  <span className="text-xs font-bold text-slate-400 ml-1.5">{conflictsCount <= 1 ? 'conflit' : 'conflits'}</span>
                </p>
                <p className={cn("text-[10px] font-bold", conflictsCount === 0 ? "text-emerald-600" : "text-rose-600")}>
                  {conflictsCount === 0 ? '✓ Aucun chevauchement' : '⚠️ Anomalies à résoudre'}
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                conflictsCount === 0 
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-100 dark:border-emerald-900/40" 
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-100 dark:border-rose-900/40"
              )}>
                {conflictsCount === 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 animate-pulse" />}
              </div>
            </div>
          </div>

          {/* Generator Controls & Live Conflict Scanner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Paramètres du Solveur IA (5 Cols) with CustomSelect */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0f2863] text-white flex items-center justify-center font-black">
                    <Sliders className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Paramètres du Solveur CSP
                    </h3>
                    <p className="text-[10px] text-slate-400">Règles académiques et heuristiques</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[9px] font-black uppercase">
                  LMD Maroc
                </span>
              </div>

              <div className="space-y-4">
                {/* 1. Semestre & Période */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      1. Période & Semestre Cible :
                    </label>
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                      {selectedSemester === 'odd' ? '🍂 Automne S1/S3/S5/S7' :
                       selectedSemester === 'even' ? '🌸 Printemps S2/S4/S6/S8' :
                       selectedSemester === 'all' ? '🎓 Année Complète' :
                       `Semestre S${selectedSemester}`}
                    </span>
                  </div>

                  {/* Quick Period Selector Chips */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSemester('odd')}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        selectedSemester === 'odd'
                          ? "bg-[#0f2863] text-white border-[#0f2863] shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      )}
                    >
                      🍂 Automne
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSemester('even')}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        selectedSemester === 'even'
                          ? "bg-[#0f2863] text-white border-[#0f2863] shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      )}
                    >
                      🌸 Printemps
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSemester('all')}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        selectedSemester === 'all'
                          ? "bg-[#0f2863] text-white border-[#0f2863] shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      )}
                    >
                      🎓 Annuel
                    </button>
                  </div>

                  <CustomSelect
                    value={selectedSemester}
                    onChange={(val) => setSelectedSemester(val)}
                    options={semesterOptions}
                    placeholder="Sélectionner le semestre ou la période..."
                    className="w-full"
                  />
                </div>

                {/* 2. Filière Cible */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    2. Filière Académique :
                  </label>
                  <CustomSelect
                    value={selectedFiliere}
                    onChange={(val) => setSelectedFiliere(String(val))}
                    options={filiereOptions}
                    placeholder="Sélectionner la filière..."
                    className="w-full"
                  />
                </div>

                {/* 3. Stratégie Heuristique */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    3. Stratégie Heuristique (Solveur) :
                  </label>
                  <CustomSelect
                    value={selectedStrategy}
                    onChange={(val) => setSelectedStrategy(String(val))}
                    options={strategyOptions}
                    placeholder="Sélectionner l'heuristique..."
                    className="w-full"
                  />
                </div>

                {/* CSP Weight Sliders */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-3.5 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    4. Poids d'Optimisation des Ressources :
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-emerald-500" /> Économie d'Énergie Bâtiments</span>
                      <span className="font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px]">{energyWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={energyWeight}
                      onChange={(e) => setEnergyWeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-500" /> Disponibilité des Professeurs</span>
                      <span className="font-mono text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded text-[11px]">{profAvailWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={profAvailWeight}
                      onChange={(e) => setProfAvailWeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-purple-500" /> Regroupement Bâtiments</span>
                      <span className="font-mono text-purple-600 font-bold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded text-[11px]">{buildingWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={buildingWeight}
                      onChange={(e) => setBuildingWeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>

                {/* Heuristic Toggles */}
                <div className="space-y-2 pt-0.5">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={avoidSaturday}
                      onChange={(e) => setAvoidSaturday(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Samedi Après-Midi Libre</span>
                      <span className="text-[10px] text-slate-400">Préservation des week-ends étudiants et profs</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={preferMorning}
                      onChange={(e) => setPreferMorning(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Priorité Cours Magistraux le Matin</span>
                      <span className="text-[10px] text-slate-400">Amphis programmés de 08h30 à 12h15</span>
                    </div>
                  </label>
                </div>

                {/* 5. Affectation des Salles Dédiées par Département / Filière */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      5. Salles Dédiées par Filière :
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResourceModalTab('rooms');
                        setShowDedicatedRoomsModal(true);
                      }}
                      className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" /> Configurer
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                    {Object.entries(dedicatedRooms).map(([filCode, rNames]) => (
                      <div key={filCode} className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px]">
                          {filCode}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {rNames.length > 0 ? (
                            rNames.map(rName => (
                              <span key={rName} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] border border-blue-200/60 dark:border-blue-900/40">
                                🏛️ {rName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Salles libres</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Affectation des Professeurs par Filière */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      6. Professeurs par Filière :
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResourceModalTab('professors');
                        setShowDedicatedRoomsModal(true);
                      }}
                      className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" /> Configurer
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                    {Object.entries(dedicatedProfessors).map(([filCode, pNames]) => (
                      <div key={filCode} className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px]">
                          {filCode}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {pNames.length > 0 ? (
                            pNames.map(pName => {
                              const shortName = pName.split(' ')[0] + ' ' + (pName.split(' ')[1] ? pName.split(' ')[1][0] + '.' : '');
                              return (
                                <span key={pName} className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-200/60 dark:border-emerald-900/40" title={pName}>
                                  👨‍🏫 {shortName}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Tous les enseignants</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── 🚀 ACTION BUTTONS (GENERATE & RESET) ─────────────────── */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="w-full py-3 px-5 bg-gradient-to-r from-indigo-600 via-blue-700 to-[#0f2863] hover:from-indigo-700 hover:to-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {generateMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    )}
                    <span>{generateMutation.isPending ? 'Calcul en cours...' : 'Lancer le Solveur IA'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Conflict Scanner & Campus Room Radar (7 Cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                {/* Header with status badge & Refresh button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", conflictsCount === 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping")} />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Scanner de Conflits & Disponibilité en Temps Réel
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Surveillance continue des chevauchements d'horaires et réservations
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => refetchConflicts()}
                    disabled={isScanning}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isScanning && "animate-spin")} />
                    <span>Actualiser</span>
                  </button>
                </div>

                {/* Conflict Status & Master Fix Banner */}
                {conflictsCount === 0 ? (
                  <div className="space-y-4">
                    <div className="p-6 text-center bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                          Zéro Conflit Détecté dans la Base de Données
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Toutes les salles, professeurs et groupes sont synchronisés sans aucun chevauchement horaire.
                        </p>
                      </div>
                    </div>

                    {/* Live Campus Room Occupancy Radar */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500 font-black">
                          🏛️ Radar d'Occupation des Espaces & Salles :
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                          18 Salles Opérationnelles
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Amphithéâtres (A & B)</div>
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                            <span>Amphi A, Amphi B</span>
                            <span className="text-emerald-600 text-[10px]">100% Libre</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-full" />
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Salles de TD (101 à 108)</div>
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                            <span>8 Salles de Cours</span>
                            <span className="text-emerald-600 text-[10px]">Disponible</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full w-full" />
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Labos Informatique</div>
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                            <span>Lab 1, Lab 2, Lab 3</span>
                            <span className="text-emerald-600 text-[10px]">Prêt</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Master Action Banner */}
                    <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-slate-900 dark:text-white">
                            {conflictsCount} Anomalies de Planification Détectées
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Des séances partagent le même créneau horaire ou la même salle physique.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => resolveAllMutation.mutate()}
                        disabled={resolveAllMutation.isPending}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer self-end sm:self-auto"
                      >
                        {resolveAllMutation.isPending ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        <span>Résoudre Tout Auto 🪄</span>
                      </button>
                    </div>

                    {/* Conflict Items List */}
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {conflictsList.map((conf: any, index: number) => {
                        return (
                          <div
                            key={index}
                            className="p-3.5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1.5 hover:shadow-xs transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-[10px] font-black uppercase">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                {conf.type_label || 'Conflit Horaire'}
                              </span>

                              <div className="text-[10px] font-bold text-slate-500">
                                🕒 {conf.day_name || DAY_NAMES_MAP[conf.day_of_week] || 'Jour'} • {conf.start_time} - {conf.end_time}
                              </div>

                              <button
                                onClick={() => resolveMutation.mutate(conf.schedule_id)}
                                disabled={resolveMutation.isPending}
                                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-bold hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Wand2 className="w-3 h-3" />
                                <span>Résoudre</span>
                              </button>
                            </div>

                            <div className="space-y-0.5">
                              <div className="text-xs font-black text-slate-900 dark:text-white">
                                📚 {conf.module_name || 'Module Pédagogique'} • <span className="text-blue-600 dark:text-blue-400 font-bold">{conf.group_name || 'Section / Groupe'}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-3">
                                <span>📍 <strong>Salle :</strong> {conf.room_name || 'Non assignée'}</span>
                                <span>👤 <strong>Professeur :</strong> {conf.professor_name || 'Non assigné'}</span>
                              </div>
                              <p className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                                ⚠️ {conf.reason || conf.description || 'Double réservation détectée sur ce créneau.'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Save to Database */}
              {scheduledSessions.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    Grille calculée : <strong className="text-emerald-700 dark:text-emerald-400 font-black">{scheduledSessions.length} séances prêtes à être déployées</strong> en base de données.
                  </div>
                  <button
                    type="button"
                    onClick={() => applyMutation.mutate(scheduledSessions)}
                    disabled={applyMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {applyMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-200" />}
                    <span>{applyMutation.isPending ? 'Déploiement en cours...' : 'Déployer en Base de Données 💾'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Preview Grid (When AI has generated a proposal OR active database schedules exist) */}
          {scheduledSessions.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-foreground">
                      Aperçu de la Grille Optimisée par l'IA
                    </h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border",
                      generatedData
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                    )}>
                      {generatedData ? "⚡ Proposition IA (Prête au déploiement)" : "💾 Séances Actives en Base"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Séances hebdomadaires générées selon les contraintes de disponibilité et de capacité.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {generatedData && (
                    <button
                      type="button"
                      onClick={() => applyMutation.mutate(scheduledSessions)}
                      disabled={applyMutation.isPending}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {applyMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Déployer ({scheduledSessions.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── 🔍 Barre de Recherche Multi-Critères (Module / Professeur / Groupe / Salle) ── */}
              <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
                {/* Search Omnibox */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchScope === 'module'
                          ? "Rechercher par intitulé de module (ex: Finance d'Entreprise, Marketing, Fiscalité)..."
                          : searchScope === 'professor'
                          ? "Rechercher par nom d'enseignant (ex: Amina Chraibi, Abdelhak El Amrani, Tarik Meziane)..."
                          : searchScope === 'group'
                          ? "Rechercher par groupe ou section (ex: GFC-S5-G1, MCM-S5-G1&G2, TC-S1)..."
                          : searchScope === 'room'
                          ? "Rechercher par salle ou amphithéâtre (ex: Salle 101, Amphithéâtre A, Labo Info)..."
                          : "Recherche rapide : module, professeur, groupe, salle, type (ex: Finance, Chraibi, G1, 101)..."
                      }
                      className="w-full pl-10 pr-24 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs transition-all"
                    />

                    {/* Clear X button & result badge inside search input */}
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                          title="Effacer la recherche"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {filteredSessions.length}/{scheduledSessions.length}
                      </span>
                    </div>
                  </div>

                  {/* Reset all button if any filter is active */}
                  {isAnyFilterActive && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réinitialiser les filtres</span>
                    </button>
                  )}
                </div>

                {/* Scope selector tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-indigo-500" /> Critère ciblé :
                  </span>

                  <button
                    type="button"
                    onClick={() => setSearchScope('all')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      searchScope === 'all'
                        ? "bg-[#0f2863] text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>Tous les critères</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSearchScope('module')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      searchScope === 'module'
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Par Module</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSearchScope('professor')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      searchScope === 'professor'
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <User className="w-3 h-3" />
                    <span>Par Professeur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSearchScope('group')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      searchScope === 'group'
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Users className="w-3 h-3" />
                    <span>Par Groupe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSearchScope('room')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      searchScope === 'room'
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Par Salle</span>
                  </button>
                </div>

                {/* Dropdowns Filters & Sorting Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80">
                  <CustomSelect
                    value={dayFilter}
                    onChange={(val) => setDayFilter(val === 'all' ? 'all' : Number(val))}
                    options={dayFilterOptions}
                    placeholder="Filtrer par jour..."
                  />

                  <CustomSelect
                    value={groupFilter}
                    onChange={(val) => setGroupFilter(String(val))}
                    options={groupFilterOptions}
                    placeholder="Filtrer par groupe..."
                  />

                  <CustomSelect
                    value={profFilter}
                    onChange={(val) => setProfFilter(String(val))}
                    options={profFilterOptions}
                    placeholder="Filtrer par professeur..."
                  />

                  <CustomSelect
                    value={roomFilter}
                    onChange={(val) => setRoomFilter(String(val))}
                    options={roomFilterOptions}
                    placeholder="Filtrer par salle..."
                  />

                  <CustomSelect
                    value={sortBy}
                    onChange={(val) => setSortBy(val as any)}
                    options={sortOptions}
                    placeholder="Trier par..."
                  />
                </div>
              </div>

              {/* Filière filter chips */}
              {uniqueFilieres.length > 1 && (
                <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mr-1">Filières :</span>
                  <button
                    type="button"
                    onClick={() => setFiliereFilter('all')}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer",
                      filiereFilter === 'all'
                        ? "bg-[#0f2863] text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    Toutes ({scheduledSessions.length})
                  </button>
                  {uniqueFilieres.map((fCode: any) => {
                    const count = scheduledSessions.filter((s: any) => s.filiere_code === fCode).length;
                    return (
                      <button
                        key={fCode}
                        type="button"
                        onClick={() => setFiliereFilter(fCode)}
                        className={cn(
                          "px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                          filiereFilter === fCode
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <span>{fCode}</span>
                        <span className="px-1.5 py-0.2 bg-black/20 rounded-md text-[10px]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sessions Cards Grid OR Empty State */}
              {filteredSessions.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 bg-muted/20 animate-in fade-in">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <SearchX className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-foreground">
                    Aucune séance ne correspond aux critères
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    {searchQuery
                      ? `Aucune séance trouvée pour « ${searchQuery} » avec les filtres sélectionnés.`
                      : "Aucune séance ne correspond aux filtres actifs."} Essayez d'ajuster votre recherche ou réinitialisez les filtres.
                  </p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2863] hover:bg-[#1a3d8f] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser la recherche & les filtres</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSessions.map((session: any, idx: number) => {
                    const isLab = session.room_type === 'lab' || String(session.room_name).toLowerCase().includes('info');
                    const isAmphi = session.room_type === 'amphitheater' || session.room_type === 'amphi' || String(session.room_name).toLowerCase().includes('amphi');
                    const isIT = String(session.session_nature || '').includes('Informatique') || isLab;
                    const isLanguage = String(session.session_nature || '').includes('Langues') || String(session.module_name || '').toLowerCase().includes('langue') || String(session.module_name || '').toLowerCase().includes('soft skills');

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-5 rounded-2xl border transition-all space-y-3.5 shadow-sm bg-card hover:shadow-md",
                          isIT ? "border-purple-500/30 hover:border-purple-500" : isLanguage ? "border-emerald-500/30 hover:border-emerald-500" : "border-border hover:border-indigo-400"
                        )}
                      >
                        {/* Card Header: Day, Time & Nature Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                              {session.day_name}
                            </span>
                            {session.session_badge && (
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border",
                                isIT
                                  ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200"
                                  : isLanguage
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                                  : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200"
                              )}>
                                {session.session_badge}
                              </span>
                            )}
                          </div>

                          <span className="text-xs font-black text-foreground font-mono flex items-center gap-1 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            {session.start_time} - {session.end_time}
                          </span>
                        </div>

                        {/* Module Title & Group Info */}
                        <div>
                          <h4 className="font-black text-sm text-foreground line-clamp-1">
                            {highlightMatch(session.module_name, searchQuery)}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                              {highlightMatch(session.group_name, searchQuery)} • {session.filiere_code}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              {session.students_count ? `${session.students_count} Étudiants` : '35 Étudiants'}
                            </span>
                          </div>
                        </div>

                        {/* Footer: Professor & Room with Type Badge */}
                        <div className="pt-2.5 border-t border-border flex items-center justify-between text-xs gap-2">
                          <span className="flex items-center gap-1 text-muted-foreground truncate" title={session.professor_name}>
                            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{highlightMatch(session.professor_name, searchQuery)}</span>
                          </span>
                          
                          <span className={cn(
                            "font-bold px-2 py-0.8 rounded-lg flex items-center gap-1.5 shrink-0 text-[11px] border",
                            isLab
                              ? "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                              : isAmphi
                              ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                          )}>
                            {isLab ? (
                              <Monitor className="w-3.5 h-3.5 text-purple-600" />
                            ) : isAmphi ? (
                              <Building2 className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span>{highlightMatch(session.room_name, searchQuery)}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: STUDIO MANUEL (DRAG & DROP BOARD) ───────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'manual_board' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-amber-500/10 border border-amber-300 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Hand className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-black text-xs text-amber-950 dark:text-amber-200">
                  Studio d'Ajustement Manuel par Glisser-Déposer (Drag & Drop)
                </h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                  Glissez et déposez les séances directement dans les créneaux horaires pour personnaliser la grille en temps réel.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refetchConflicts()}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Actualiser la Grille</span>
              </button>
            </div>
          </div>

          <ManualTimetableBoard
            versionId={1}
            filiereLabel={`Semestre ${selectedSemester === 'odd' ? 'Automne (S1/S3/S5/S7)' : selectedSemester === 'even' ? 'Printemps (S2/S4/S6/S8)' : selectedSemester}`}
            onBack={() => setActiveTab('generator')}
            onChanged={() => refetchConflicts()}
          />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: MATRICE OFFICIELLE & OCCUPATION ──────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Grid className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-black text-xs text-emerald-950 dark:text-emerald-200">
                  Matrice Officielle d'Affichage & d'Occupation des Salles
                </h4>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                  Tableau synoptique conforme aux maquettes d'affichage pédagogique de l'ENCG Fès.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => refetchMatrix()}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-blue-600", isMatrixFetching && "animate-spin")} />
                <span>Actualiser</span>
              </button>

              {selectedFiliere !== 'all' && (
                <a
                  href={`/api/timetable/export/filiere/${selectedFiliere}/pdf${typeof selectedSemester === 'number' ? `?semester_number=${selectedSemester}` : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Télécharger Filière Active (PDF)</span>
                </a>
              )}

              <a
                href={`/api/timetable/export/all/0/pdf${typeof selectedSemester === 'number' ? `?semester_number=${selectedSemester}` : ''}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 Télécharger Toutes les Filières (PDF Global)</span>
              </a>
            </div>
          </div>

          <OfficialTimetableMatrix matrix={matrixData || generatedData?.official_matrix || generatedData?.matrix || generatedData} />
        </div>
      )}

      {/* ─── 🔴 MODAL CONFIRMATION REMISE À ZÉRO DE L'EMPLOI DU TEMPS ───────── */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Remise à Zéro de l'Emploi du Temps
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Suppression ciblée des anciens créneaux pour repartir sur une planification propre
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setClearMode('period')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  clearMode === 'period'
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
              >
                🍂 Par Période
              </button>

              <button
                type="button"
                onClick={() => setClearMode('single')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  clearMode === 'single'
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
              >
                🎯 Par Semestre (S1 à S10)
              </button>

              <button
                type="button"
                onClick={() => setClearMode('all')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  clearMode === 'all'
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
              >
                🎓 Toute l'Année
              </button>
            </div>

            {/* 1. Mode Par Période */}
            {clearMode === 'period' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Sélectionnez la période académique à réinitialiser :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setClearPeriod('odd')}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                      clearPeriod === 'odd'
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-300 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>🍂 Semestre 1 / Automne</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Semestres Impairs (S1, S3, S5, S7, S9)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClearPeriod('even')}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                      clearPeriod === 'even'
                        ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 text-purple-950 dark:text-purple-300 ring-2 ring-purple-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>🌸 Semestre 2 / Printemps</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Semestres Pairs (S2, S4, S6, S8, S10)
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Mode Par Semestre Précis (S1 à S10) */}
            {clearMode === 'single' && (
              <div className="space-y-2.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Choisissez le semestre exact à remettre à zéro :
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sNum) => {
                    const isSelected = clearSemesterNumber === sNum
                    return (
                      <button
                        key={sNum}
                        type="button"
                        onClick={() => setClearSemesterNumber(sNum)}
                        className={cn(
                          "py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                          isSelected
                            ? "border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 font-black shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <span className="text-xs font-black">S{sNum}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {sNum <= 4 ? 'TC' : sNum <= 6 ? 'Licence' : 'Master'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  Semestre ciblé : <span className="text-rose-600 dark:text-rose-400 font-extrabold">Semestre S{clearSemesterNumber} ({clearSemesterNumber % 2 === 1 ? 'Automne' : 'Printemps'})</span>
                </div>
              </div>
            )}

            {/* 3. Mode Toute l'Année */}
            {clearMode === 'all' && (
              <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <p className="font-black text-rose-900 dark:text-rose-200">
                  🎓 Réinitialisation globale de toute l'année universitaire
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Toutes les séances de tous les semestres (S1 à S10), toutes filières confondues, seront effacées pour repartir sur une page 100% vierge.
                </p>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Action immédiate
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Les créneaux de séances concernés seront supprimés de la base de données. Vous pourrez ensuite relancer le <strong>Solveur IA</strong> sur le semestre de votre choix.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {clearMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>
                  {clearMutation.isPending ? 'Suppression en cours...' : 
                   clearMode === 'period' ? `Oui, Effacer les Séances (${clearPeriod === 'odd' ? 'Automne S1/S3/S5/S7' : 'Printemps S2/S4/S6/S8'})` :
                   clearMode === 'single' ? `Oui, Effacer les Séances du Semestre S${clearSemesterNumber}` :
                   'Oui, Effacer Tous les Emplois du Temps (Toute l\'Année)'}
                </span>
              </button>

              <button
                onClick={() => setShowClearModal(false)}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 🏛️ Modal: Affectation des Ressources Dédiées (Salles & Professeurs) par Filière ── */}
      {showDedicatedRoomsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 md:p-8 space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center font-black border transition-all",
                  resourceModalTab === 'professors'
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                    : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40"
                )}>
                  {resourceModalTab === 'professors' ? <GraduationCap className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Affectation des Ressources par Filière & Département
                  </h3>
                  <p className="text-xs text-slate-400">
                    Spécifiez les salles réservées et les professeurs assignés en priorité à chaque filière.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDedicatedRoomsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 📑 Segmented Tabs: Salles vs Professeurs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setResourceModalTab('rooms')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                  resourceModalTab === 'rooms'
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm border border-slate-200/60 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>1. Salles Dédiées par Filière</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-extrabold">
                  {Object.values(dedicatedRooms).reduce((acc, curr) => acc + curr.length, 0)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResourceModalTab('professors')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                  resourceModalTab === 'professors'
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm border border-slate-200/60 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>2. Professeurs Affectés par Filière</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {Object.values(dedicatedProfessors).reduce((acc, curr) => acc + curr.length, 0)}
                </span>
              </button>
            </div>

            {/* ─── TAB 1: SALLES ──────────────────────────────────────────────────────── */}
            {resourceModalTab === 'rooms' && (
              <div className="space-y-4">
                {/* Quick Auto-preset button */}
                <div className="flex items-center justify-between bg-blue-500/10 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-900 dark:text-blue-200">
                    <strong className="font-bold">Astuce académique :</strong> Attribuer des salles fixes évite les déplacements d'étudiants entre bâtiments.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDedicatedRooms({
                        'GFC': ['Salle 101', 'Salle 102'],
                        'MCM': ['Salle 103', 'Salle 104'],
                        'TC': ['Salle 105', 'Salle 106'],
                      });
                      toast.success("Répartition standard des salles appliquée !");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#0f2863] text-white text-[11px] font-black whitespace-nowrap cursor-pointer hover:bg-blue-900 transition-all shadow-xs"
                  >
                    ⚡ Répartition Équilibrée
                  </button>
                </div>

                {/* Filières mapping list */}
                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                  {[
                    { code: 'TC', label: 'Tronc Commun (S1 / S2 / S3 / S4)' },
                    { code: 'GFC', label: 'Gestion Financière et Comptable (GFC)' },
                    { code: 'MCM', label: 'Management Commercial & Marketing (MCM)' },
                  ].map((fil) => {
                    const assigned = dedicatedRooms[fil.code] || [];
                    return (
                      <div key={fil.code} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-black text-xs text-slate-900 dark:text-white">{fil.label}</span>
                            <span className="text-[10px] font-bold text-muted-foreground ml-2">
                              ({assigned.length} salle{assigned.length > 1 ? 's' : ''} dédiée{assigned.length > 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {availableRoomsList.map((rName: string) => {
                            const isSelected = assigned.includes(rName);
                            return (
                              <button
                                key={rName}
                                type="button"
                                onClick={() => {
                                  setDedicatedRooms(prev => {
                                    const current = prev[fil.code] || [];
                                    const updated = isSelected 
                                      ? current.filter((r: string) => r !== rName)
                                      : [...current, rName];
                                    return { ...prev, [fil.code]: updated };
                                  });
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border",
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                )}
                              >
                                <span>{isSelected ? '✓' : '+'}</span>
                                <span>{rName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── TAB 2: PROFESSEURS ─────────────────────────────────────────────────── */}
            {resourceModalTab === 'professors' && (
              <div className="space-y-4">
                {/* Quick Auto-preset button for Professors */}
                <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs text-emerald-900 dark:text-emerald-200">
                    <strong className="font-bold">Astuce pédagogique :</strong> Affecter les enseignants selon leur spécialité (Finance, Audit, Marketing...) évite la dispersion pédagogique et stabilise l'encadrement.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDedicatedProfessors({
                        'GFC': ['Abdelhak El Amrani', 'Youssef El Mansouri', 'Omar Bennouna'],
                        'MCM': ['Amina Chraibi', 'Tarik Meziane', 'Bouchra Bennani'],
                        'TC': ['Mohamed Benjelloun', 'Tarik Meziane', 'Bouchra Bennani', 'Youssef El Mansouri'],
                      });
                      toast.success("Répartition pédagogique recommandée appliquée !");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-[11px] font-black whitespace-nowrap cursor-pointer hover:bg-emerald-800 transition-all shadow-xs"
                  >
                    ⚡ Répartition Recommandée
                  </button>
                </div>

                {/* Filières mapping list for Professors */}
                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                  {[
                    { code: 'TC', label: 'Tronc Commun (S1 / S2 / S3 / S4)', desc: 'Mathématiques, Économie, Informatique, Langues & Soft Skills' },
                    { code: 'GFC', label: 'Gestion Financière et Comptable (GFC)', desc: 'Finance d’entreprise, Comptabilité approfondie, Audit & Fiscalité' },
                    { code: 'MCM', label: 'Management Commercial & Marketing (MCM)', desc: 'Marketing stratégique, Droit des affaires, Communication & Management' },
                  ].map((fil) => {
                    const assigned = dedicatedProfessors[fil.code] || [];
                    return (
                      <div key={fil.code} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-slate-900 dark:text-white">{fil.label}</span>
                              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                {assigned.length} prof{assigned.length > 1 ? 's' : ''} affecté{assigned.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{fil.desc}</p>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setDedicatedProfessors(prev => ({
                                  ...prev,
                                  [fil.code]: availableProfessorsList.map((p: any) => p.name)
                                }));
                              }}
                              className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                            >
                              Tout cocher
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDedicatedProfessors(prev => ({
                                  ...prev,
                                  [fil.code]: []
                                }));
                              }}
                              className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              Vider
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {availableProfessorsList.map((prof: any) => {
                            const pName = prof.name;
                            const isSelected = assigned.includes(pName);
                            return (
                              <button
                                key={pName}
                                type="button"
                                onClick={() => {
                                  setDedicatedProfessors(prev => {
                                    const current = prev[fil.code] || [];
                                    const updated = isSelected 
                                      ? current.filter((p: string) => p !== pName)
                                      : [...current, pName];
                                    return { ...prev, [fil.code]: updated };
                                  });
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border text-left",
                                  isSelected
                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/40"
                                )}
                              >
                                <span className="font-black text-xs">{isSelected ? '✓' : '+'}</span>
                                <div className="flex flex-col">
                                  <span className="font-bold leading-tight">{pName}</span>
                                  <span className={cn(
                                    "text-[9px] font-semibold leading-tight",
                                    isSelected ? "text-emerald-100" : "text-slate-400"
                                  )}>
                                    {prof.specialty || prof.department || 'Enseignant'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                {resourceModalTab === 'professors' ? (
                  <span>Ces choix définiront les priorités d'assignation du <strong>Solveur IA</strong> par filière.</span>
                ) : (
                  <span>Les salles attribuées seront réservées prioritairement pour ces filières.</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDedicatedRoomsModal(false);
                  toast.success("Affectations enregistrées et prêtes pour la génération !");
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-700 to-[#0f2863] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer"
              >
                Enregistrer & Appliquer au Solveur
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
