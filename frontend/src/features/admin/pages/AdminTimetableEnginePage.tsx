import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Building2, Check, ChevronRight, Clock, FileText, Filter,
  GripVertical, Leaf, Loader2, Play, RotateCcw, Search,
  Send, Sliders, Sparkles, Users, Zap, CalendarDays,
  ArrowRight, Layers, Eye, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import api from '@/shared/lib/api'
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import ManualTimetableBoard from './ManualTimetableBoard'
import OfficialTimetableMatrix from './OfficialTimetableMatrix'
import SemesterReadinessPanel from '../components/SemesterReadinessPanel'

interface ScheduledSession {
  id: number | string
  day_of_week: number
  day_name: string
  start_time: string
  end_time: string
  group_name: string
  module_name: string
  filiere_code: string
  professor_name: string
  room_name: string
  room_building: string
  session_type: string
  energy_score: number
}

interface SimulationData {
  input_issues?: string[]
  unplaced_count?: number
  total_variables: number
  total_placed: number
  satisfaction_rate: number
  energy_efficiency_score: number
  conflicts_prevented: number
  building_clustering: Record<string, number>
  scheduled_sessions: ScheduledSession[]
  execution_time_ms: number
  strategy?: string
  heuristics?: string[]
  load_balance_score?: number
}

const DEFAULTS = {
  energyWeight: 85,
  profAvailWeight: 90,
  maxDailyHours: 8,
}

const STATUS_LABEL: Record<string, string> = {
  EMPTY: 'À générer',
  DRAFT: 'Brouillon',
  PROPOSED: 'Chez les profs',
  PUBLISHED: 'Publié',
}

const STEPS = [
  { id: 1, label: 'Campagne', hint: 'Ouvrir le semestre' },
  { id: 2, label: 'Générer', hint: 'Brouillon par filière' },
  { id: 3, label: 'Ajuster', hint: 'IA ou glisser-déposer' },
  { id: 4, label: 'Profs', hint: 'Ils confirment' },
  { id: 5, label: 'Publier', hint: 'Visible étudiants' },
]

export default function AdminTimetableEnginePage() {
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [energyWeight, setEnergyWeight] = useState(DEFAULTS.energyWeight);
  const [profAvailWeight, setProfAvailWeight] = useState(DEFAULTS.profAvailWeight);
  const [maxDailyHours, setMaxDailyHours] = useState(DEFAULTS.maxDailyHours);
  const [teachingWeeks, setTeachingWeeks] = useState(15);
  const [workMode, setWorkMode] = useState<'filieres' | 'official' | 'result'>('filieres');
  const [viewTab, setViewTab] = useState<'grid' | 'energy' | 'audit'>('grid');
  const [simResult, setSimResult] = useState<SimulationData | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [previewDay, setPreviewDay] = useState('ALL');
  const [previewType, setPreviewType] = useState('ALL');
  const [previewSearch, setPreviewSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualBoard, setManualBoard] = useState<{
    versionId: number;
    label: string;
} | null>(null);
  const [busyFiliereId, setBusyFiliereId] = useState<number | null>(null);
  const [confirmPublishId, setConfirmPublishId] = useState<number | null>(null);

  const { data: workspace, refetch: refetchWorkspace, isError: workspaceError } = useQuery({
    queryKey: ['edt-campaign-workspace'],
    queryFn: () => api.get('/admin/smart-scheduling/workspace').then((res) => res.data.data || res.data),
});

  const { data: filieres = [] } = useQuery({
    queryKey: ['filieres-list'],
    queryFn: () => api.get('/filieres').then((res) => res.data.data || res.data || []),
});

  const officialScope = selectedFiliere ? 'filiere' : 'all'
  const officialId = selectedFiliere || '0'
  const { data: officialMatrix, isFetching: matrixLoading } = useQuery({
    queryKey: ['edt-official-matrix', officialScope, officialId, selectedSemester],
    enabled: workMode === 'official',
    queryFn: () => api.get(`/timetable/export/${officialScope}/${officialId}/matrix`, {
        params: selectedSemester ? { semester_number: Number(selectedSemester) } : {},
    }).then((res) => res.data.data),
});

  const { refetch: refetchStats } = useQuery({
    queryKey: ['smart-scheduling-stats'],
    queryFn: () => api.get('/admin/smart-scheduling/stats').then((res) => res.data.data || res.data || null),
});

  const openCampaignMutation = useMutation({
    mutationFn: () => api.post('/admin/smart-scheduling/campaign/open', { allow_saturday: false }),
    onSuccess: () => {
      toast.success('Campagne ouverte — lundi à vendredi, sans samedi.')
      refetchWorkspace()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ouverture de campagne impossible.'),
  })

  const draftMutation = useMutation({
    mutationFn: async (filiereId: number) => {
      setBusyFiliereId(filiereId)
      const res = await api.post('/admin/smart-scheduling/draft', {
        filiere_id: filiereId,
        include_saturday: false,
        max_daily_hours: maxDailyHours,
        teaching_weeks: teachingWeeks,
        energy_weight: energyWeight,
        semester_number: selectedSemester ? Number(selectedSemester) : undefined,
      })
      return res.data.data
    },
    onSuccess: (data: any) => {
      setSimResult(data.simulation || data)
      toast.success(data.message || 'Brouillon prêt — pas encore visible des étudiants.')
      refetchWorkspace()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.data?.message || err.response?.data?.message || 'Génération impossible')
    },
    onSettled: () => setBusyFiliereId(null),
  })

  const proposeMutation = useMutation({
    mutationFn: (versionId: number) => api.post(`/admin/smart-scheduling/versions/${versionId}/propose`),
    onSuccess: () => {
      toast.success('Proposition envoyée aux enseignants.')
      refetchWorkspace()
    },
    onError: (err: any) => toast.error(err.response?.data?.data?.message || err.response?.data?.message || 'Proposition impossible.'),
  })

  const publishVersionMutation = useMutation({
    mutationFn: (versionId: number) => api.post(`/admin/smart-scheduling/versions/${versionId}/publish`),
    onSuccess: () => {
      toast.success('Emploi du temps publié pour les étudiants.')
      setConfirmPublishId(null)
      refetchWorkspace()
      refetchStats()
    },
    onError: (err: any) => toast.error(err.response?.data?.data?.message || err.response?.data?.message || 'Publication impossible.'),
  })

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/smart-scheduling/simulate', {
        filiere_id: selectedFiliere ? Number(selectedFiliere) : undefined,
        semester_number: selectedSemester ? Number(selectedSemester) : undefined,
        energy_weight: energyWeight,
        prof_avail_weight: profAvailWeight,
        include_saturday: false,
        max_daily_hours: maxDailyHours,
        teaching_weeks: teachingWeeks,
      })
      return res.data.data
    },
    onSuccess: (data: SimulationData) => {
      setSimResult(data)
      setWorkMode('result')
      toast.success(`${data.total_placed} séances placées. Vérifiez les éventuels éléments non planifiés.`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message)
    },
  })

  const emptyDraftMutation = useMutation({
    mutationFn: async ({ filiereId }: { filiereId: number; label: string }) => {
      const res = await api.post('/admin/smart-scheduling/draft/empty', { filiere_id: filiereId })
      return res.data.data
    },
    onSuccess: (data: any, vars) => {
      refetchWorkspace()
      if (data.version_id) {
        setManualBoard({ versionId: data.version_id, label: vars.label })
        toast.success(data.message || 'Grille manuelle prête.')
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.data?.message || err.response?.data?.message || 'Impossible d’ouvrir la grille')
    },
  })

  const openManual = (card: any) => {
    if (card.version_id) {
      setManualBoard({ versionId: card.version_id, label: card.filiere_code })
      return
    }
    emptyDraftMutation.mutate({ filiereId: card.filiere_id, label: card.filiere_code })
  }

  const handleResetAll = () => {
    setSelectedFiliere('')
    setSelectedSemester('')
    setEnergyWeight(DEFAULTS.energyWeight)
    setProfAvailWeight(DEFAULTS.profAvailWeight)
    setMaxDailyHours(DEFAULTS.maxDailyHours)
    setWorkMode('filieres')
    setViewTab('grid')
    setSimResult(null)
    setSuggestedSlots([])
    setSearch('')
    setStatusFilter('ALL')
    setPreviewDay('ALL')
    setPreviewType('ALL')
    setPreviewSearch('')
    setShowAdvanced(false)
    setManualBoard(null)
    setConfirmPublishId(null)
    toast.success('Filtres remis à zéro.')
  }

  const handleExportPdf = async () => {
    const type = selectedFiliere ? 'filiere' : 'all'
    const id = selectedFiliere || '0'
    try {
      toast.loading('PDF officiel…', { id: 'timetable-pdf' })
      const res = await api.get(`/timetable/export/${type}/${id}/pdf`, {
        responseType: 'blob',
        params: selectedSemester ? { semester_number: Number(selectedSemester) } : {},
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
      toast.success('PDF ouvert.', { id: 'timetable-pdf' })
    } catch {
      toast.error('Export PDF impossible.', { id: 'timetable-pdf' })
    }
  }

  const filiereCards = useMemo(() => (workspace?.filieres || []), [workspace])
  const filteredCards = useMemo(() => {
    return filiereCards.filter((card: any) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || `${card.filiere_code} ${card.filiere_name}`.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'ALL' || card.status === statusFilter
      const matchesSelect = !selectedFiliere || String(card.filiere_id) === selectedFiliere
      return matchesSearch && matchesStatus && matchesSelect
    })
  }, [filiereCards, search, statusFilter, selectedFiliere])

  const counts = useMemo(() => {
    const all = filiereCards as any[]
    return {
      total: all.length,
      empty: all.filter((c) => c.status === 'EMPTY').length,
      draft: all.filter((c) => c.status === 'DRAFT').length,
      proposed: all.filter((c) => c.status === 'PROPOSED').length,
      published: all.filter((c) => c.status === 'PUBLISHED').length,
    }
  }, [filiereCards])

  const previewSessions = useMemo(() => {
    const list = simResult?.scheduled_sessions || []
    return list.filter((s) => {
      const q = previewSearch.trim().toLowerCase()
      const matchesQ = !q || `${s.module_name} ${s.group_name} ${s.professor_name} ${s.room_name}`.toLowerCase().includes(q)
      const matchesDay = previewDay === 'ALL' || String(s.day_of_week) === previewDay
      const matchesType = previewType === 'ALL' || s.session_type === previewType
      return matchesQ && matchesDay && matchesType
    })
  }, [simResult, previewSearch, previewDay, previewType])





  const generateEmpty = async () => {
    const empties = filteredCards.filter((c: any) => c.status === 'EMPTY')
    if (empties.length === 0) {
      toast.info('Aucune filière vide dans le filtre actuel.')
      return
    }
    if (!workspace?.campaign_open) {
      toast.error('Ouvrez d’abord la campagne.')
      return
    }
    for (const card of empties) {
      try {
        await draftMutation.mutateAsync(card.filiere_id)
      } catch {
        break
      }
    }
  }

  const activeStep = !workspace?.campaign_open ? 1 : counts.empty === counts.total ? 2 : counts.proposed > 0 ? 4 : counts.published > 0 ? 5 : 3

  const selectClass = 'h-10 w-full px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all'

  if (manualBoard) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 pb-16">
        <ManualTimetableBoard
          versionId={manualBoard.versionId}
          filiereLabel={manualBoard.label}
          onBack={() => {
            setManualBoard(null)
            refetchWorkspace()
          }}
          onChanged={() => refetchWorkspace()}
        />
      </div>
    )
  }

  const STEP_ICONS = [Clock, Sparkles, Sliders, Users, Check]

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 font-sans pb-28">

      {/* ══════════════════════════════════════════════════════
          HERO HEADER
      ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #001A4B 0%, #003087 50%, #001A4B 100%)' }}>
        <div className="absolute top-0 right-0 w-72 h-72 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 opacity-8 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />

        <div className="relative z-10 px-6 py-7 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/80">Direction des études · ENCG Fès</span>
            </div>
            <h1 className="text-white erp-page-title">
              Génération des Emplois du Temps
            </h1>
            <p className="text-sm text-blue-200/70 font-medium max-w-xl">
              {workspace?.campaign_label || 'Campagne semestrielle'} · lundi–vendredi · une filière à la fois, puis publication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Campaign status */}
            <div className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border',
              workspace?.campaign_open
                ? 'text-emerald-300 border-emerald-500/30'
                : 'text-amber-300 border-amber-500/30'
            )} style={{ background: workspace?.campaign_open ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }}>
              <span className={cn('w-2 h-2 rounded-full', workspace?.campaign_open ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
              {workspace?.campaign_open ? 'Campagne ouverte' : 'Campagne fermée'}
            </div>

            {!workspace?.campaign_open && (
              <button
                onClick={() => openCampaignMutation.mutate()}
                disabled={openCampaignMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}
              >
                <Zap className="w-4 h-4" />
                {openCampaignMutation.isPending ? 'Ouverture…' : 'Ouvrir la campagne'}
              </button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />
      </div>

      {workspaceError && <div role="alert" className="rounded-xl border border-red-200 p-4 text-red-700">Le suivi du semestre est indisponible. <button onClick={() => refetchWorkspace()} className="underline">Réessayer</button></div>}
      {workspace?.readiness && <SemesterReadinessPanel data={workspace.readiness} />}
      {!!simResult?.input_issues?.length && <div role="alert" className="rounded-xl border border-amber-300 p-4 text-sm text-amber-800 dark:text-amber-300"><p className="font-bold">Données à compléter avant génération</p><ul className="list-disc pl-5">{simResult.input_issues.slice(0, 10).map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
      {!!simResult?.unplaced_count && <p role="status" className="text-sm text-amber-800 dark:text-amber-300">{simResult.unplaced_count} séances non placées : revoir les disponibilités, capacités et plafonds de charge.</p>}
      {/* Teaching Weeks Configuration Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-700 text-white shadow-xs shrink-0">
            <CalendarDays className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Semaines d'enseignement prévues
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Génération d'une semaine type calibrée en créneaux de 2h pour respecter les volumes affectés.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            {[14, 15, 16].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setTeachingWeeks(w)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer",
                  teachingWeeks === w
                    ? "bg-[#0f2863] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                {w} sem. {w === 15 && '(Standard)'}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setTeachingWeeks(prev => Math.max(1, prev - 1))}
              className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-slate-600 hover:bg-white hover:shadow-xs dark:text-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              -
            </button>
            <span className="w-16 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
              {teachingWeeks} sem.
            </span>
            <button
              type="button"
              onClick={() => setTeachingWeeks(prev => Math.min(30, prev + 1))}
              className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-slate-600 hover:bg-white hover:shadow-xs dark:text-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PROGRESS STEPPER
      ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/80 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === step.id
            const isDone = activeStep > step.id
            const StepIcon = STEP_ICONS[idx]
            return (
              <div
                key={step.id}
                className={cn(
                  'relative flex flex-col items-center px-3 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-gradient-to-br from-[#0f2863] via-blue-900 to-indigo-900 text-white shadow-lg shadow-blue-950/20 ring-1 ring-white/20'
                    : isDone
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-400'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 text-xs font-black shadow-xs transition-transform',
                    isActive
                      ? 'bg-white/20 text-white backdrop-blur ring-1 ring-white/30 scale-105'
                      : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  )}
                >
                  {isDone ? <Check size={14} className="stroke-[3]" /> : <StepIcon size={14} />}
                </div>
                <p className={cn('text-[9px] font-black uppercase tracking-widest mb-0.5', isActive ? 'text-amber-300' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')}>
                  Étape {step.id}
                </p>
                <p className={cn('text-xs font-black text-center leading-tight', isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200')}>
                  {step.label}
                </p>
                <p className={cn('text-[10px] text-center mt-0.5 font-medium hidden md:block', isActive ? 'text-blue-100/80' : 'text-slate-400')}>
                  {step.hint}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB SWITCHER
      ══════════════════════════════════════════════════════ */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 w-full md:w-fit shadow-xs">
        {([
          { id: 'filieres' as const, label: 'Filières à traiter', icon: Filter },
          { id: 'official' as const, label: 'Grille officielle', icon: FileText },
          { id: 'result' as const, label: 'Résultat IA', icon: Sparkles },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setWorkMode(tab.id)}
            className={cn(
              'flex items-center gap-2 flex-1 md:flex-none h-9 px-4 rounded-xl text-xs font-black transition-all cursor-pointer',
              workMode === tab.id
                ? 'bg-gradient-to-r from-[#0f2863] to-blue-700 text-white shadow-md shadow-blue-950/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          FILTER BAR
      ══════════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-blue-950 dark:text-blue-300">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Périmètre de travail
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Tout réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher TC, GFC, MCM…"
              className={cn(selectClass, "pl-9 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-medium")}
            />
          </div>
          <select value={selectedFiliere} onChange={(e) => setSelectedFiliere(e.target.value)} className={cn(selectClass, "rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-medium")}>
            <option value="">Toutes les filières</option>
            {filieres.map((f: any) => (
              <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
            ))}
          </select>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className={cn(selectClass, "rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-medium")}>
            <option value="">Tous les semestres</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>S{n} · {n % 2 === 1 ? 'Automne' : 'Printemps'}</option>
            ))}
          </select>
          <select value={String(maxDailyHours)} onChange={(e) => setMaxDailyHours(Number(e.target.value))} className={cn(selectClass, "rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-medium")}>
            <option value="6">6 h max / jour</option>
            <option value="8">8 h max / jour</option>
            <option value="10">10 h max / jour</option>
          </select>
        </div>

        {/* Status pill filters */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {[
            { key: 'ALL', label: `Toutes`, count: counts.total, color: 'bg-[#0f2863] text-white border-[#0f2863] shadow-xs', inactive: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200' },
            { key: 'EMPTY', label: 'À générer', count: counts.empty, color: 'bg-slate-700 text-white border-slate-700 shadow-xs', inactive: 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100' },
            { key: 'DRAFT', label: 'Brouillon', count: counts.draft, color: 'bg-amber-600 text-white border-amber-600 shadow-xs', inactive: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200/80 dark:border-amber-800 hover:bg-amber-100' },
            { key: 'PROPOSED', label: 'Chez les profs', count: counts.proposed, color: 'bg-indigo-600 text-white border-indigo-600 shadow-xs', inactive: 'bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800 hover:bg-indigo-100' },
            { key: 'PUBLISHED', label: 'Publié', count: counts.published, color: 'bg-emerald-600 text-white border-emerald-600 shadow-xs', inactive: 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100' },
          ].map(({ key, label, count, color, inactive }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                'h-8 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5',
                statusFilter === key ? color : inactive
              )}
            >
              <span>{label}</span>
              <span className={cn("px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black", statusFilter === key ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10")}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FILIERES TABLE VIEW
      ══════════════════════════════════════════════════════ */}
      {workMode === 'filieres' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0f2863] text-white text-xs font-black shadow-xs">
                {filteredCards.length}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                filière{filteredCards.length > 1 ? 's' : ''} répertoriée{filteredCards.length > 1 ? 's' : ''} · actions contextuelles selon l'état d'avancement
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => generateEmpty()}
                disabled={!workspace?.campaign_open || draftMutation.isPending}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-md shadow-indigo-950/20"
                style={{ background: 'linear-gradient(135deg, #0f2863 0%, #4f46e5 100%)' }}
              >
                {draftMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>Générer les filières vides</span>
              </button>
              <button
                type="button"
                onClick={() => simulateMutation.mutate()}
                disabled={simulateMutation.isPending}
                className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                {simulateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                <span>Tester sans enregistrer</span>
              </button>
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center bg-white dark:bg-slate-900/60">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Filter className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Aucune filière ne correspond à ce filtre.</p>
              <p className="text-xs text-slate-400 mt-1">Modifiez vos critères de recherche ou réinitialisez le périmètre.</p>
              <button type="button" onClick={handleResetAll} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition cursor-pointer">
                <RotateCcw className="w-3 h-3" /> Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100/90 via-slate-50/70 to-slate-100/90 dark:from-slate-800/90 dark:via-slate-900/70 dark:to-slate-800/90 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200/80 dark:border-slate-700/80">
                      <th className="px-5 py-3.5 text-left">Filière</th>
                      <th className="px-5 py-3.5 text-left">État d'avancement</th>
                      <th className="px-5 py-3.5 text-left">Confirmations Enseignants</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredCards.map((card: any) => {
                      const busy = busyFiliereId === card.filiere_id
                      const avatarGradient = card.filiere_code?.toUpperCase().includes('GFC') ? 'from-blue-600 to-indigo-700'
                        : card.filiere_code?.toUpperCase().includes('MCM') ? 'from-purple-600 to-pink-700'
                        : card.filiere_code?.toUpperCase().includes('TC') ? 'from-emerald-600 to-teal-700'
                        : card.filiere_code?.toUpperCase().includes('GRH') ? 'from-amber-500 to-orange-600'
                        : 'from-[#0f2863] to-blue-700'

                      const confirmed = card.confirmations?.confirmed || 0
                      const total = card.confirmations?.total || 0
                      const sessions = card.confirmations?.sessions || 0
                      const progressPct = total > 0 ? Math.round((confirmed / total) * 100) : 0

                      return (
                        <tr key={card.filiere_id} className="group hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/20 hover:to-transparent dark:hover:from-blue-950/20 dark:hover:via-slate-800/40 dark:hover:to-transparent transition-all">
                          {/* Filière info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3.5">
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md ring-2 ring-white/20 transition-transform group-hover:scale-105 bg-gradient-to-br",
                                avatarGradient
                              )}>
                                {(card.filiere_code || '??').substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>{card.filiere_code}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs">{card.filiere_name}</p>
                              </div>
                            </div>
                          </td>

                          {/* Status Pill */}
                          <td className="px-5 py-4">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full border shadow-2xs',
                              card.status === 'PUBLISHED'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : card.status === 'PROPOSED'
                                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                  : card.status === 'DRAFT'
                                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            )}>
                              <span className={cn(
                                'w-2 h-2 rounded-full',
                                card.status === 'PUBLISHED' ? 'bg-emerald-500 animate-pulse'
                                : card.status === 'PROPOSED' ? 'bg-indigo-500'
                                : card.status === 'DRAFT' ? 'bg-amber-500'
                                : 'bg-slate-400'
                              )} />
                              <span>{STATUS_LABEL[card.status] || card.status}</span>
                            </span>
                          </td>

                          {/* Confirmations Progress */}
                          <td className="px-5 py-4">
                            <div className="space-y-1.5 w-40">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono font-black text-slate-900 dark:text-white">
                                  {confirmed} <span className="text-slate-400 font-normal">/ {total} profs</span>
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                  {sessions} séance{sessions > 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    confirmed === total && total > 0
                                      ? "bg-emerald-500"
                                      : confirmed > 0
                                        ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                                        : "bg-slate-300 dark:bg-slate-700"
                                  )}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Row Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {(card.status === 'EMPTY' || card.status === 'DRAFT') && (
                                <button
                                  type="button"
                                  onClick={() => draftMutation.mutate(card.filiere_id)}
                                  disabled={!workspace?.campaign_open || busy}
                                  className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-black text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs hover:scale-102"
                                  style={{ background: 'linear-gradient(135deg, #0f2863 0%, #4f46e5 100%)' }}
                                >
                                  {busy ? <Loader2 className="w-3 h-3 animate-spin text-amber-300" /> : <Sparkles className="w-3 h-3 text-amber-300" />}
                                  <span>{card.status === 'EMPTY' ? 'Générer' : 'Régénérer'}</span>
                                </button>
                              )}

                              {card.version_id && card.status === 'DRAFT' && (
                                <button
                                  type="button"
                                  onClick={() => proposeMutation.mutate(card.version_id)}
                                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Aux profs</span>
                                </button>
                              )}

                              {card.version_id && card.status === 'PROPOSED' && (
                                confirmPublishId === card.version_id ? (
                                  <span className="inline-flex items-center gap-1">
                                    <button onClick={() => publishVersionMutation.mutate(card.version_id)} className="h-8 px-3 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer shadow-xs">Confirmer</button>
                                    <button onClick={() => setConfirmPublishId(null)} className="h-8 px-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Non</button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmPublishId(card.version_id)}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Publier</span>
                                  </button>
                                )
                              )}

                              <button
                                type="button"
                                onClick={() => openManual(card)}
                                disabled={emptyDraftMutation.isPending || (!card.version_id && !workspace?.campaign_open)}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                              >
                                <GripVertical className="w-3 h-3 text-slate-400" />
                                <span>{card.version_id ? 'Ajuster' : 'Manuel'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => { setSelectedFiliere(String(card.filiere_id)); setWorkMode('official') }}
                                className="flex items-center gap-1 h-8 px-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-[#0f2863] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                              >
                                <span>Voir</span>
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Options panel */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showAdvanced ? 'Masquer les options IA' : 'Options IA avancées (énergie, disponibilités)'}
          </button>

          {showAdvanced && (
            <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 bg-card dark:bg-card p-5 grid grid-cols-1 md:grid-cols-2 gap-6"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.02), rgba(139,92,246,0.02))' }}>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400"><Leaf className="w-3.5 h-3.5" /> Énergie campus</span>
                  <span className="font-bold text-slate-700 dark:text-foreground">{energyWeight}%</span>
                </div>
                <input type="range" min="0" max="100" value={energyWeight} onChange={(e) => setEnergyWeight(Number(e.target.value))} className="w-full accent-teal-600 h-1.5" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-primary dark:text-indigo-400"><Users className="w-3.5 h-3.5" /> Disponibilités profs</span>
                  <span className="font-bold text-slate-700 dark:text-foreground">{profAvailWeight}%</span>
                </div>
                <input type="range" min="0" max="100" value={profAvailWeight} onChange={(e) => setProfAvailWeight(Number(e.target.value))} className="w-full accent-indigo-600 h-1.5" />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          OFFICIAL TIMETABLE VIEW
      ══════════════════════════════════════════════════════ */}
      {workMode === 'official' && (
        <section className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground dark:text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Grille Officielle PDF · ENCG
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Une page par filière et semestre. Filtrez ci-dessus, puis exportez.</p>
            </div>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #001A4B, #003087)' }}
            >
              <FileText className="w-3.5 h-3.5" /> Télécharger le PDF
            </button>
          </div>
          {matrixLoading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Chargement de la grille…</span>
            </div>
          ) : (
            <OfficialTimetableMatrix matrix={officialMatrix} />
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          AI SIMULATION RESULTS
      ══════════════════════════════════════════════════════ */}
      {workMode === 'result' && (
        <section className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Conflits', value: '0', sub: 'Zéro conflit détecté', color: '#10b981', accent: 'rgba(16,185,129,0.08)' },
              { label: 'Séances placées', value: simResult ? String(simResult.total_placed) : '—', sub: `sur ${simResult?.total_variables ?? '?'} variables`, color: '#6366f1', accent: 'rgba(99,102,241,0.08)' },
              { label: 'Score énergie', value: simResult ? `${simResult.energy_efficiency_score}%` : '—', sub: 'Clustering bâtiments', color: '#06b6d4', accent: 'rgba(6,182,212,0.08)' },
              { label: 'Temps calcul', value: simResult ? `${simResult.execution_time_ms} ms` : '—', sub: 'Heuristiques IA', color: '#f59e0b', accent: 'rgba(245,158,11,0.08)' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="relative overflow-hidden rounded-2xl p-4 border border-border dark:border-border bg-card dark:bg-card">
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color}80, ${color}00)` }} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {suggestedSlots.length > 0 && (
            <div data-testid="suggested-slots" className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card p-5 space-y-3">
              <h2 className="text-sm font-bold text-foreground dark:text-foreground">Créneaux suggérés</h2>
              {suggestedSlots.map((slot, i) => (
                <p key={i} className="text-sm text-muted-foreground dark:text-muted-foreground">Jour {slot.day} · {slot.start_time}–{slot.end_time} · {slot.room_name}</p>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card p-5 space-y-4">
            <div className="flex gap-1 p-1 bg-muted dark:bg-card rounded-xl w-fit">
              {(['grid', 'energy', 'audit'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setViewTab(tab)}
                  className={cn(
                    'h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    viewTab === tab ? "bg-card dark:bg-slate-700 text-primary dark:text-indigo-400 shadow-sm" : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  {tab === 'grid' ? 'Séances' : tab === 'energy' ? 'Bâtiments' : 'Audit'}
                </button>
              ))}
            </div>

            {viewTab === 'grid' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} placeholder="Module, groupe, prof, salle…" className={selectClass} />
                  <select value={previewDay} onChange={(e) => setPreviewDay(e.target.value)} className={selectClass}>
                    <option value="ALL">Tous les jours</option>
                    {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((d, i) => (
                      <option key={i + 1} value={String(i + 1)}>{d}</option>
                    ))}
                  </select>
                  <select value={previewType} onChange={(e) => setPreviewType(e.target.value)} className={selectClass}>
                    <option value="ALL">CM + TD</option>
                    <option value="cm">CM</option>
                    <option value="td">TD</option>
                  </select>
                </div>
                {!simResult ? (
                  <div className="py-16 text-center">
                    <Play className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Lancez « Tester sans enregistrer » ou générez un brouillon.</p>
                  </div>
                ) : previewSessions.length === 0 ? (
                  <p className="py-12 text-center text-slate-400 text-sm">Aucun résultat pour ce filtre.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {previewSessions.map((session) => {
                      const color = session.filiere_code?.toUpperCase().includes('GFC') ? '#4f46e5'
                        : session.filiere_code?.toUpperCase().includes('MCM') ? '#9333ea'
                        : session.filiere_code?.toUpperCase().includes('TC') ? '#059669'
                        : session.filiere_code?.toUpperCase().includes('GRH') ? '#d97706'
                        : '#2563eb'
                      return (
                        <div key={session.id} className="rounded-xl p-4 border-l-4 bg-card dark:bg-card border border-border dark:border-border space-y-2 hover:shadow-sm transition-all" style={{ borderLeftColor: color }}>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
                            <span>{session.day_name} {session.start_time?.substring(0, 5)}–{session.end_time?.substring(0, 5)}</span>
                            <span className="px-1.5 py-0.5 rounded bg-muted dark:bg-card text-muted-foreground">{session.session_type?.toUpperCase()}</span>
                          </div>
                          <p className="font-bold text-sm text-foreground dark:text-foreground line-clamp-2">{session.module_name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{session.group_name} · {session.room_name} · {session.professor_name}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {viewTab === 'energy' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {simResult?.building_clustering && Object.entries(simResult.building_clustering).map(([building, count]) => (
                  <div key={building} className="p-4 rounded-xl border border-teal-200 dark:border-teal-800" style={{ background: 'rgba(20,184,166,0.05)' }}>
                    <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
                    <p className="text-sm font-bold text-foreground dark:text-foreground">{building}</p>
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{Number(count)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">séances groupées</p>
                  </div>
                ))}
              </div>
            )}

            {viewTab === 'audit' && simResult && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-300 p-4 font-mono text-xs space-y-1.5">
                <p><span className="text-muted-foreground">séances :</span> <span className="text-emerald-400 font-bold">{simResult.total_placed}</span><span className="text-muted-foreground">/{simResult.total_variables}</span></p>
                <p><span className="text-muted-foreground">conflits évités :</span> <span className="text-emerald-400 font-bold">{simResult.conflicts_prevented}</span></p>
                <p><span className="text-muted-foreground">stratégie :</span> <span className="text-indigo-400">{simResult.strategy}</span></p>
                {simResult.heuristics && <p><span className="text-muted-foreground">heuristiques :</span> <span className="text-amber-400">{simResult.heuristics.join(', ')}</span></p>}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
