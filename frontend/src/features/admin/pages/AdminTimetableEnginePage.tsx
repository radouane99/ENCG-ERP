import React, { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Building2,
  Check,
  FileText,
  Filter,
  GripVertical,
  Leaf,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Sparkles,
  Users,
} from 'lucide-react'
import api from '@/shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import ManualTimetableBoard from './ManualTimetableBoard'
import OfficialTimetableMatrix from './OfficialTimetableMatrix'

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
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [energyWeight, setEnergyWeight] = useState(DEFAULTS.energyWeight)
  const [profAvailWeight, setProfAvailWeight] = useState(DEFAULTS.profAvailWeight)
  const [maxDailyHours, setMaxDailyHours] = useState(DEFAULTS.maxDailyHours)
  const [workMode, setWorkMode] = useState<'filieres' | 'official' | 'result'>('filieres')
  const [viewTab, setViewTab] = useState<'grid' | 'energy' | 'audit'>('grid')
  const [simResult, setSimResult] = useState<SimulationData | null>(null)
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [previewDay, setPreviewDay] = useState('ALL')
  const [previewType, setPreviewType] = useState('ALL')
  const [previewSearch, setPreviewSearch] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [manualBoard, setManualBoard] = useState<{ versionId: number; label: string } | null>(null)
  const [busyFiliereId, setBusyFiliereId] = useState<number | null>(null)
  const [confirmPublishId, setConfirmPublishId] = useState<number | null>(null)

  const { data: workspace, refetch: refetchWorkspace } = useQuery({
    queryKey: ['edt-campaign-workspace'],
    queryFn: () => api.get('/admin/smart-scheduling/workspace').then((res) => res.data.data || res.data),
  })

  const { data: filieres = [] } = useQuery({
    queryKey: ['filieres-list'],
    queryFn: () => api.get('/filieres').then((res) => res.data.data || res.data || []),
  })

  const officialScope = selectedFiliere ? 'filiere' : 'all'
  const officialId = selectedFiliere || '0'
  const { data: officialMatrix, isFetching: matrixLoading } = useQuery({
    queryKey: ['edt-official-matrix', officialScope, officialId, selectedSemester],
    enabled: workMode === 'official',
    queryFn: () =>
      api.get(`/timetable/export/${officialScope}/${officialId}/matrix`, {
        params: selectedSemester ? { semester_number: Number(selectedSemester) } : {},
      }).then((res) => res.data.data),
  })

  const { refetch: refetchStats } = useQuery({
    queryKey: ['smart-scheduling-stats'],
    queryFn: () => api.get('/admin/smart-scheduling/stats').then((res) => res.data.data || res.data || null),
  })

  const openCampaignMutation = useMutation({
    mutationFn: () => api.post('/admin/smart-scheduling/campaign/open', { allow_saturday: false }),
    onSuccess: () => {
      toast.success('Campagne ouverte — lundi à vendredi, sans samedi.')
      refetchWorkspace()
    },
  })

  const draftMutation = useMutation({
    mutationFn: async (filiereId: number) => {
      setBusyFiliereId(filiereId)
      const res = await api.post('/admin/smart-scheduling/draft', {
        filiere_id: filiereId,
        include_saturday: false,
        max_daily_hours: maxDailyHours,
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
  })

  const publishVersionMutation = useMutation({
    mutationFn: (versionId: number) => api.post(`/admin/smart-scheduling/versions/${versionId}/publish`),
    onSuccess: () => {
      toast.success('Emploi du temps publié pour les étudiants.')
      setConfirmPublishId(null)
      refetchWorkspace()
      refetchStats()
    },
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
      })
      return res.data.data
    },
    onSuccess: (data: SimulationData) => {
      setSimResult(data)
      setWorkMode('result')
      toast.success(`${data.total_placed} séances simulées, sans conflit.`)
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

  const filiereCards = workspace?.filieres || []
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

  const statusBadge = (status: string) => {
    if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    if (status === 'PROPOSED') return 'bg-indigo-50 text-indigo-800 border-indigo-200'
    if (status === 'DRAFT') return 'bg-amber-50 text-amber-900 border-amber-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  const getFiliereColor = (code: string = '') => {
    const c = code.toUpperCase()
    if (c.includes('GFC') || c.includes('FINANCE')) return 'bg-indigo-600 border-l-indigo-900 text-white'
    if (c.includes('MCM') || c.includes('MARKETING')) return 'bg-purple-600 border-l-purple-900 text-white'
    if (c.includes('TC') || c.includes('TRONC')) return 'bg-emerald-600 border-l-emerald-900 text-white'
    if (c.includes('GRH') || c.includes('RH')) return 'bg-amber-600 border-l-amber-900 text-white'
    return 'bg-blue-600 border-l-blue-900 text-white'
  }

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

  const selectClass = 'h-11 w-full px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#001A4B]/20'

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

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 space-y-5 font-sans pb-28">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Direction des études · ENCG Fès</p>
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#001A4B] mt-1">Génération des emplois du temps</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            {workspace?.campaign_label || 'Campagne semestrielle'} · lundi–vendredi · une filière à la fois, puis publication.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold border',
            workspace?.campaign_open ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
          )}>
            <span className={cn('w-2 h-2 rounded-full', workspace?.campaign_open ? 'bg-emerald-500' : 'bg-amber-500')} />
            {workspace?.campaign_open ? 'Campagne ouverte' : 'Campagne fermée'}
          </span>
          {!workspace?.campaign_open && (
            <button
              onClick={() => openCampaignMutation.mutate()}
              disabled={openCampaignMutation.isPending}
              className="h-11 px-5 rounded-xl bg-[#001A4B] text-white text-sm font-semibold disabled:opacity-50"
            >
              {openCampaignMutation.isPending ? 'Ouverture…' : 'Ouvrir la campagne'}
            </button>
          )}
        </div>
      </header>

      <ol className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {STEPS.map((step) => (
          <li
            key={step.id}
            className={cn(
              'rounded-2xl border px-3 py-3',
              activeStep === step.id ? 'border-[#001A4B] bg-[#001A4B] text-white' : 'border-slate-200 bg-white text-slate-600'
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Étape {step.id}</p>
            <p className="text-sm font-semibold">{step.label}</p>
            <p className={cn('text-[11px] mt-0.5', activeStep === step.id ? 'text-indigo-100' : 'text-slate-400')}>{step.hint}</p>
          </li>
        ))}
      </ol>

      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 w-full md:w-fit">
        {([
          { id: 'filieres' as const, label: 'Filières à traiter' },
          { id: 'official' as const, label: 'Grille officielle' },
          { id: 'result' as const, label: 'Résultat IA' },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setWorkMode(tab.id)}
            className={cn(
              'flex-1 md:flex-none h-10 px-4 rounded-xl text-sm font-semibold',
              workMode === tab.id ? 'bg-white text-[#001A4B] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold">Périmètre de travail</h2>
          </div>
          <button type="button" onClick={handleResetAll} className="h-9 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Tout réinitialiser
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="TC, GFC, MCM…"
              className={cn(selectClass, 'pl-9')}
            />
          </div>
          <select value={selectedFiliere} onChange={(e) => setSelectedFiliere(e.target.value)} className={selectClass}>
            <option value="">Toutes les filières</option>
            {filieres.map((f: any) => (
              <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
            ))}
          </select>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className={selectClass}>
            <option value="">Tous les semestres</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>S{n} · {n % 2 === 1 ? 'automne' : 'printemps'}</option>
            ))}
          </select>
          <select value={String(maxDailyHours)} onChange={(e) => setMaxDailyHours(Number(e.target.value))} className={selectClass}>
            <option value="6">6 h max / jour</option>
            <option value="8">8 h max / jour</option>
            <option value="10">10 h max / jour</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'EMPTY', 'DRAFT', 'PROPOSED', 'PUBLISHED'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'h-8 px-3 rounded-full text-xs font-semibold border',
                statusFilter === s ? 'bg-[#001A4B] text-white border-[#001A4B]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {s === 'ALL' ? `Toutes (${counts.total})` : `${STATUS_LABEL[s]} (${s === 'EMPTY' ? counts.empty : s === 'DRAFT' ? counts.draft : s === 'PROPOSED' ? counts.proposed : counts.published})`}
            </button>
          ))}
        </div>
      </section>

      {workMode === 'filieres' && (
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{filteredCards.length} filière{filteredCards.length > 1 ? 's' : ''} · action principale selon l’étape</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => generateEmpty()}
                disabled={!workspace?.campaign_open || draftMutation.isPending}
                className="h-10 px-4 rounded-xl bg-[#001A4B] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40"
              >
                {draftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Générer les filières vides
              </button>
              <button
                type="button"
                onClick={() => simulateMutation.mutate()}
                disabled={simulateMutation.isPending}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold inline-flex items-center gap-2"
              >
                {simulateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Tester sans enregistrer
              </button>
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 text-sm">
              Aucune filière pour ce filtre. Cliquez <button type="button" onClick={handleResetAll} className="font-semibold text-[#001A4B] underline">Tout réinitialiser</button>.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                      <th className="px-4 py-3 font-semibold">Filière</th>
                      <th className="px-4 py-3 font-semibold">État</th>
                      <th className="px-4 py-3 font-semibold">Profs (confirmés)</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.map((card: any) => {
                      const busy = busyFiliereId === card.filiere_id
                      return (
                        <tr key={card.filiere_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-slate-900">{card.filiere_code}</p>
                            <p className="text-xs text-slate-500">{card.filiere_name}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={cn('inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border', statusBadge(card.status))}>
                              {STATUS_LABEL[card.status] || card.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            <p className="font-semibold">{card.confirmations?.confirmed || 0}/{card.confirmations?.total || 0}</p>
                            <p className="text-[11px] text-slate-400">
                              {card.confirmations?.sessions || 0} séance{(card.confirmations?.sessions || 0) > 1 ? 's' : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap justify-end gap-2">
                              {(card.status === 'EMPTY' || card.status === 'DRAFT') && (
                                <button
                                  onClick={() => draftMutation.mutate(card.filiere_id)}
                                  disabled={!workspace?.campaign_open || busy}
                                  className="h-9 px-3 rounded-lg bg-[#001A4B] text-white text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1.5"
                                >
                                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                  {card.status === 'EMPTY' ? 'Générer' : 'Regénérer'}
                                </button>
                              )}
                              {card.version_id && card.status === 'DRAFT' && (
                                <button onClick={() => proposeMutation.mutate(card.version_id)} className="h-9 px-3 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-semibold inline-flex items-center gap-1.5">
                                  <Send className="w-3.5 h-3.5" /> Aux profs
                                </button>
                              )}
                              {card.version_id && card.status === 'PROPOSED' && (
                                confirmPublishId === card.version_id ? (
                                  <span className="inline-flex items-center gap-1">
                                    <button onClick={() => publishVersionMutation.mutate(card.version_id)} className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Confirmer</button>
                                    <button onClick={() => setConfirmPublishId(null)} className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-500">Non</button>
                                  </span>
                                ) : (
                                  <button onClick={() => setConfirmPublishId(card.version_id)} className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5" /> Publier
                                  </button>
                                )
                              )}
                              <button
                                type="button"
                                onClick={() => openManual(card)}
                                disabled={emptyDraftMutation.isPending || (!card.version_id && !workspace?.campaign_open)}
                                className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-40"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                                {card.version_id ? 'Ajuster' : 'Manuel'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFiliere(String(card.filiere_id))
                                  setWorkMode('official')
                                }}
                                className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#001A4B]"
                              >
                                Voir
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

          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs font-semibold text-slate-500 inline-flex items-center gap-2 hover:text-[#001A4B]">
            <Sliders className="w-4 h-4" />
            {showAdvanced ? 'Masquer les options IA' : 'Options IA (énergie, disponibilités)'}
          </button>
          {showAdvanced && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="inline-flex items-center gap-1"><Leaf className="w-4 h-4 text-teal-600" /> Énergie campus</span>
                  <span>{energyWeight}%</span>
                </div>
                <input type="range" min="0" max="100" value={energyWeight} onChange={(e) => setEnergyWeight(Number(e.target.value))} className="w-full accent-teal-600" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="inline-flex items-center gap-1"><Users className="w-4 h-4 text-indigo-600" /> Disponibilités profs</span>
                  <span>{profAvailWeight}%</span>
                </div>
                <input type="range" min="0" max="100" value={profAvailWeight} onChange={(e) => setProfAvailWeight(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>
            </div>
          )}
        </section>
      )}

      {workMode === 'official' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Grille type PDF ENCG</h2>
              <p className="text-sm text-slate-500">Une page par filière et semestre. Filtrez ci-dessus, puis exportez.</p>
            </div>
            <button onClick={handleExportPdf} className="h-10 px-4 rounded-xl bg-[#001A4B] text-white text-sm font-semibold inline-flex items-center gap-2">
              <FileText className="w-4 h-4" /> Télécharger le PDF
            </button>
          </div>
          {matrixLoading ? (
            <div className="py-16 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <OfficialTimetableMatrix matrix={officialMatrix} />
          )}
        </section>
      )}

      {workMode === 'result' && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Conflits</p>
              <p className="text-2xl font-semibold text-emerald-600">0</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Séances</p>
              <p className="text-2xl font-semibold">{simResult ? simResult.total_placed : '—'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Énergie</p>
              <p className="text-2xl font-semibold text-teal-600">{simResult ? `${simResult.energy_efficiency_score}%` : '—'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Calcul</p>
              <p className="text-2xl font-semibold">{simResult ? `${simResult.execution_time_ms} ms` : '—'}</p>
            </div>
          </div>

          {suggestedSlots.length > 0 && (
            <div data-testid="suggested-slots" className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
              <h2 className="text-sm font-semibold">Créneaux suggérés</h2>
              {suggestedSlots.map((slot, i) => (
                <p key={i} className="text-sm">Jour {slot.day} · {slot.start_time}–{slot.end_time} · {slot.room_name}</p>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['grid', 'energy', 'audit'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setViewTab(tab)}
                  className={cn('h-9 px-3 rounded-lg text-xs font-semibold', viewTab === tab ? 'bg-[#001A4B] text-white' : 'bg-slate-100 text-slate-600')}
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
                    <option value="1">Lundi</option>
                    <option value="2">Mardi</option>
                    <option value="3">Mercredi</option>
                    <option value="4">Jeudi</option>
                    <option value="5">Vendredi</option>
                  </select>
                  <select value={previewType} onChange={(e) => setPreviewType(e.target.value)} className={selectClass}>
                    <option value="ALL">CM + TD</option>
                    <option value="cm">CM</option>
                    <option value="td">TD</option>
                  </select>
                </div>
                {!simResult ? (
                  <p className="py-12 text-center text-slate-400 text-sm">Lancez « Tester sans enregistrer » ou générez un brouillon.</p>
                ) : previewSessions.length === 0 ? (
                  <p className="py-12 text-center text-slate-400 text-sm">Aucun résultat.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {previewSessions.map((session) => (
                      <div key={session.id} className={cn('p-4 rounded-2xl border-l-4 space-y-2', getFiliereColor(session.filiere_code))}>
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>{session.day_name} {session.start_time?.substring(0, 5)}–{session.end_time?.substring(0, 5)}</span>
                          <span>{session.session_type?.toUpperCase()}</span>
                        </div>
                        <p className="font-semibold text-sm line-clamp-2">{session.module_name}</p>
                        <p className="text-[11px] opacity-90">{session.group_name} · {session.room_name} · {session.professor_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {viewTab === 'energy' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {simResult?.building_clustering && Object.entries(simResult.building_clustering).map(([building, count]) => (
                  <div key={building} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <Building2 className="w-5 h-5 text-teal-600 mb-2" />
                    <p className="font-semibold text-sm">{building}</p>
                    <p className="text-xl font-semibold">{Number(count)}</p>
                  </div>
                ))}
              </div>
            )}
            {viewTab === 'audit' && simResult && (
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 font-mono text-xs space-y-1">
                <p>Séances : {simResult.total_placed}/{simResult.total_variables}</p>
                <p>Conflits évités : {simResult.conflicts_prevented}</p>
                <p>Stratégie : {simResult.strategy}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
