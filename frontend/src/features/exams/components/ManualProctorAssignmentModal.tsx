import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  X,
  Users,
  Shield,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Search,
  RotateCcw,
  Trash2,
  Loader2,
  Save,
  ChevronDown,
  UserPlus,
  Filter,
  GraduationCap,
  Sparkles,
  Info,
  Check,
  Building,
  UserCheck,
  Activity,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import { examsApi } from '@shared/api/exams'
import ProctorCombobox, { Proctor, ExamSlot } from './ProctorCombobox'

interface ManualProctorAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: number
  onSuccess?: () => void
}

export default function ManualProctorAssignmentModal({
  isOpen,
  onClose,
  sessionId,
  onSuccess,
}: ManualProctorAssignmentModalProps) {
  // 1. Fetch all data for this session
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['proctor-assignment-data', sessionId],
    queryFn: () => examsApi.getProctorAssignmentData(sessionId),
    enabled: isOpen && !!sessionId,
  })

  const proctors: Proctor[] = useMemo(() => data?.data?.proctors || [], [data])
  const exams: ExamSlot[] = useMemo(() => data?.data?.exams || [], [data])
  const sessionName: string = data?.data?.session_name || 'Session'

  // Local state for assignments: exam_id -> { principal_id, secondary_ids }
  const [assignments, setAssignments] = useState<
    Record<number, { principal_id: number | null; secondary_ids: number[] }>
  >({})

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [filiereFilter, setFiliereFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'unassigned'>('all')

  // Proctor panel search and filters
  const [proctorSearch, setProctorSearch] = useState('')
  const [proctorTypeFilter, setProctorTypeFilter] = useState('all')
  const [highlightedProctorId, setHighlightedProctorId] = useState<number | null>(null)

  // Initialize assignments map when data loads
  useEffect(() => {
    if (exams.length > 0) {
      const initial: Record<number, { principal_id: number | null; secondary_ids: number[] }> = {}
      exams.forEach((ex) => {
        initial[ex.id] = {
          principal_id: ex.principal_id ?? null,
          secondary_ids: Array.isArray(ex.secondary_ids) ? [...ex.secondary_ids] : [],
        }
      })
      setAssignments(initial)
    }
  }, [exams])

  // Map for quick proctor lookup
  const proctorsMap = useMemo(() => {
    const map = new Map<number, Proctor>()
    proctors.forEach((p) => map.set(p.id, p))
    return map
  }, [proctors])

  // Calculate live workload per proctor
  const proctorWorkload = useMemo(() => {
    const workload = new Map<
      number,
      {
        count: number
        asPrincipal: number
        asSecondary: number
        slots: Array<{
          examId: number
          date: string
          start_time: string
          duration: number
          module: string
          room: string
          role: string
        }>
      }
    >()

    proctors.forEach((p) => {
      workload.set(p.id, { count: 0, asPrincipal: 0, asSecondary: 0, slots: [] })
    })

    Object.entries(assignments).forEach(([examIdStr, assign]) => {
      const examId = Number(examIdStr)
      const exam = exams.find((e) => e.id === examId)
      if (!exam) return

      if (assign.principal_id) {
        const p = workload.get(assign.principal_id) || { count: 0, asPrincipal: 0, asSecondary: 0, slots: [] }
        p.count += 1
        p.asPrincipal += 1
        p.slots.push({
          examId,
          date: exam.exam_date,
          start_time: exam.start_time,
          duration: exam.duration_minutes,
          module: exam.module_name,
          room: exam.room_name,
          role: 'Principal',
        })
        workload.set(assign.principal_id, p)
      }

      assign.secondary_ids.forEach((secId) => {
        const p = workload.get(secId) || { count: 0, asPrincipal: 0, asSecondary: 0, slots: [] }
        p.count += 1
        p.asSecondary += 1
        p.slots.push({
          examId,
          date: exam.exam_date,
          start_time: exam.start_time,
          duration: exam.duration_minutes,
          module: exam.module_name,
          room: exam.room_name,
          role: 'Secondaire',
        })
        workload.set(secId, p)
      })
    })

    return workload
  }, [assignments, exams, proctors])

  // Helper: check time overlap between two exam intervals
  const checkOverlap = (
    dateA: string,
    timeA: string,
    durationA: number,
    dateB: string,
    timeB: string,
    durationB: number
  ) => {
    if (dateA !== dateB) return false
    const parseMins = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }
    const startA = parseMins(timeA)
    const endA = startA + (durationA || 120)
    const startB = parseMins(timeB)
    const endB = startB + (durationB || 120)
    return startA < endB && startB < endA
  }

  // Conflict detection across all assigned exams
  const conflicts = useMemo(() => {
    const conflictsByExam: Record<number, Array<{ proctorName: string; otherModule: string; time: string }>> = {}
    const conflictingProctorIds = new Set<number>()

    proctorWorkload.forEach((data, proctorId) => {
      const slots = data.slots
      if (slots.length < 2) return

      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const s1 = slots[i]
          const s2 = slots[j]

          if (checkOverlap(s1.date, s1.start_time, s1.duration, s2.date, s2.start_time, s2.duration)) {
            conflictingProctorIds.add(proctorId)
            const pName = proctorsMap.get(proctorId)?.name || 'Surveillant'

            if (!conflictsByExam[s1.examId]) conflictsByExam[s1.examId] = []
            conflictsByExam[s1.examId].push({
              proctorName: pName,
              otherModule: s2.module,
              time: `${s2.date} à ${s2.start_time}`,
            })

            if (!conflictsByExam[s2.examId]) conflictsByExam[s2.examId] = []
            conflictsByExam[s2.examId].push({
              proctorName: pName,
              otherModule: s1.module,
              time: `${s1.date} à ${s1.start_time}`,
            })
          }
        }
      }
    })

    return {
      conflictsByExam,
      conflictingProctorIds,
      totalConflicts: conflictingProctorIds.size,
    }
  }, [proctorWorkload, proctorsMap])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = Object.entries(assignments).map(([examIdStr, assign]) => {
        const exam = exams.find((e) => e.id === Number(examIdStr))
        return {
          exam_id: Number(examIdStr),
          room_id: exam?.room_id ?? null,
          principal_id: assign.principal_id,
          secondary_ids: assign.secondary_ids,
        }
      })
      return examsApi.saveManualProctorAssignments(sessionId, payload)
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Affectation manuelle enregistrée avec succès !')
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement de l'affectation.")
    },
  })

  // Handlers for modifying assignments
  const handleSetPrincipal = (examId: number, principalId: number | null) => {
    setAssignments((prev) => {
      const current = prev[examId] || { principal_id: null, secondary_ids: [] }
      const newSecondaries = current.secondary_ids.filter((id) => id !== principalId)
      return {
        ...prev,
        [examId]: {
          principal_id: principalId,
          secondary_ids: newSecondaries,
        },
      }
    })
  }

  const handleAddSecondary = (examId: number, secondaryId: number) => {
    setAssignments((prev) => {
      const current = prev[examId] || { principal_id: null, secondary_ids: [] }
      if (current.secondary_ids.includes(secondaryId) || current.principal_id === secondaryId) {
        return prev
      }
      return {
        ...prev,
        [examId]: {
          ...current,
          secondary_ids: [...current.secondary_ids, secondaryId],
        },
      }
    })
  }

  const handleRemoveSecondary = (examId: number, secondaryId: number) => {
    setAssignments((prev) => {
      const current = prev[examId] || { principal_id: null, secondary_ids: [] }
      return {
        ...prev,
        [examId]: {
          ...current,
          secondary_ids: current.secondary_ids.filter((id) => id !== secondaryId),
        },
      }
    })
  }

  const handleResetToInitial = () => {
    const initial: Record<number, { principal_id: number | null; secondary_ids: number[] }> = {}
    exams.forEach((ex) => {
      initial[ex.id] = {
        principal_id: ex.principal_id ?? null,
        secondary_ids: Array.isArray(ex.secondary_ids) ? [...ex.secondary_ids] : [],
      }
    })
    setAssignments(initial)
    toast.info("Affectation réinitialisée à l'état sauvegardé.")
  }

  const handleClearAll = () => {
    const empty: Record<number, { principal_id: number | null; secondary_ids: number[] }> = {}
    exams.forEach((ex) => {
      empty[ex.id] = {
        principal_id: null,
        secondary_ids: [],
      }
    })
    setAssignments(empty)
    toast.info('Toutes les affectations ont été vidées pour cette session.')
  }

  // Unique filieres and dates for filtering
  const availableDates = useMemo(() => {
    return Array.from(new Set(exams.map((e) => e.exam_date))).filter(Boolean).sort()
  }, [exams])

  const availableFilieres = useMemo(() => {
    return Array.from(new Set(exams.map((e) => e.filiere_name))).filter(Boolean).sort()
  }, [exams])

  // Filtered exams list
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (dateFilter !== 'all' && exam.exam_date !== dateFilter) return false
      if (filiereFilter !== 'all' && exam.filiere_name !== filiereFilter) return false

      const assign = assignments[exam.id] || { principal_id: null, secondary_ids: [] }
      const isComplete = assign.principal_id !== null && assign.secondary_ids.length > 0
      const isUnassigned = assign.principal_id === null && assign.secondary_ids.length === 0

      if (statusFilter === 'incomplete' && isComplete) return false
      if (statusFilter === 'unassigned' && !isUnassigned) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const principalName = assign.principal_id ? proctorsMap.get(assign.principal_id)?.name?.toLowerCase() : ''
        const secNames = assign.secondary_ids
          .map((id) => proctorsMap.get(id)?.name?.toLowerCase() || '')
          .join(' ')

        const matches =
          exam.module_name.toLowerCase().includes(q) ||
          exam.room_name.toLowerCase().includes(q) ||
          exam.filiere_name.toLowerCase().includes(q) ||
          (principalName && principalName.includes(q)) ||
          secNames.includes(q)

        if (!matches) return false
      }

      if (highlightedProctorId !== null) {
        const isAssigned =
          assign.principal_id === highlightedProctorId || assign.secondary_ids.includes(highlightedProctorId)
        if (!isAssigned) return false
      }

      return true
    })
  }, [exams, assignments, dateFilter, filiereFilter, statusFilter, searchQuery, highlightedProctorId, proctorsMap])

  // Filtered proctors list for the right sidebar
  const filteredProctors = useMemo(() => {
    return proctors.filter((p) => {
      if (proctorTypeFilter !== 'all' && p.type !== proctorTypeFilter) return false
      if (proctorSearch.trim()) {
        const q = proctorSearch.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.department && p.department.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [proctors, proctorTypeFilter, proctorSearch])

  // Global coverage metrics
  const coverageStats = useMemo(() => {
    let complete = 0
    let partial = 0
    let empty = 0
    let totalAssignedSlots = 0

    exams.forEach((ex) => {
      const a = assignments[ex.id] || { principal_id: null, secondary_ids: [] }
      const count = (a.principal_id ? 1 : 0) + a.secondary_ids.length
      totalAssignedSlots += count
      if (a.principal_id && a.secondary_ids.length > 0) {
        complete++
      } else if (count > 0) {
        partial++
      } else {
        empty++
      }
    })

    return { complete, partial, empty, totalAssignedSlots }
  }, [exams, assignments])

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return 'PR'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const getTypeBadgeStyles = (type: Proctor['type']) => {
    switch (type) {
      case 'Doctorant':
        return {
          badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800',
          avatar: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20',
        }
      case 'Vacataire':
        return {
          badge: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300/80 dark:border-purple-800',
          avatar: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20',
        }
      case 'Chef de Département':
        return {
          badge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800',
          avatar: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20',
        }
      case 'Permanent':
      default:
        return {
          badge: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-800',
          avatar: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20',
        }
    }
  }

  const highlightedProctor = highlightedProctorId ? proctorsMap.get(highlightedProctorId) : null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-[1560px] h-[94vh] flex flex-col overflow-hidden ring-1 ring-slate-900/10">
        {/* MODAL HEADER */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Affectation Manuelle & Sur-Mesure des Surveillants
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shadow-xs">
                  Liberté Totale Admin ✍️
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Session : <span className="font-bold text-slate-700 dark:text-slate-200">{sessionName}</span> •
                Assignez librement chaque salle à un président et des surveillants avec détection automatique de conflits.
              </p>
            </div>
          </div>

          {/* Quick Header Badges & Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-2 bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 px-3.5 py-1.5 rounded-2xl shadow-2xs">
              <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Couverture :</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {coverageStats.complete} / {exams.length} complètes
              </span>
              {conflicts.totalConflicts > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 flex items-center gap-1 animate-pulse border border-rose-200 dark:border-rose-900">
                  <AlertTriangle className="w-3 h-3" />
                  {conflicts.totalConflicts} conflit(s)
                </span>
              )}
            </div>

            <button
              onClick={handleResetToInitial}
              type="button"
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Restaurer les affectations actuellement sauvegardées"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pré-charger existant</span>
            </button>

            <button
              onClick={handleClearAll}
              type="button"
              className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200/60 dark:border-rose-900/40 shadow-2xs"
              title="Vider toutes les séances pour repartir de zéro"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tout vider</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SPLIT VIEW) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50/60 dark:bg-slate-950/40">
          {/* LEFT: EXAM SLOTS LIST (68%) */}
          <div className="flex-1 flex flex-col border-r border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {/* Filter toolbar */}
            <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Chercher module, salle, prof..."
                    className="w-full pl-9 pr-7 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Date Filter */}
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer shadow-2xs text-xs appearance-none"
                  >
                    <option value="all">📅 Toutes les dates ({availableDates.length})</option>
                    {availableDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Filiere Filter */}
                <div className="relative">
                  <select
                    value={filiereFilter}
                    onChange={(e) => setFiliereFilter(e.target.value)}
                    className="px-3 py-2 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer shadow-2xs text-xs appearance-none max-w-[200px] truncate"
                  >
                    <option value="all">🎓 Toutes les filières</option>
                    {availableFilieres.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Status Filter Segmented Button */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer',
                      statusFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    Tous ({exams.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('incomplete')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer',
                      statusFilter === 'incomplete'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    Incomplets ({exams.length - coverageStats.complete})
                  </button>
                  <button
                    onClick={() => setStatusFilter('unassigned')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer',
                      statusFilter === 'unassigned'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    Vides ({coverageStats.empty})
                  </button>
                </div>
              </div>
            </div>

            {/* Active Highlight Banner if clicked on a proctor */}
            {highlightedProctor && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>
                    Filtre actif sur l'enseignant : <strong>{highlightedProctor.name}</strong> ({highlightedProctor.type})
                  </span>
                </div>
                <button
                  onClick={() => setHighlightedProctorId(null)}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 underline cursor-pointer"
                >
                  Afficher toutes les séances
                </button>
              </div>
            )}

            {/* Exam slots scrollable area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
                  <p className="text-sm font-semibold">Chargement des séances et des enseignants...</p>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 text-slate-400">
                    <Filter className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Aucune séance ne correspond</p>
                  <p className="text-xs text-slate-500 mt-1">Modifiez vos critères de recherche ou filtres.</p>
                </div>
              ) : (
                filteredExams.map((exam, index) => {
                  const assign = assignments[exam.id] || { principal_id: null, secondary_ids: [] }
                  const examConflicts = conflicts.conflictsByExam[exam.id] || []
                  const hasConflict = examConflicts.length > 0
                  const isHighlighted =
                    highlightedProctorId !== null &&
                    (assign.principal_id === highlightedProctorId ||
                      assign.secondary_ids.includes(highlightedProctorId))

                  return (
                    <div
                      key={exam.id}
                      className={cn(
                        'bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-4.5 relative shadow-xs',
                        hasConflict
                          ? 'border-rose-300 dark:border-rose-900 bg-rose-50/[0.15] dark:bg-rose-950/[0.15]'
                          : isHighlighted
                          ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/30 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                      )}
                      style={{ zIndex: filteredExams.length - index + 5 }}
                    >
                      {/* Conflict Alert Banner */}
                      {hasConflict && (
                        <div className="mb-3 px-3.5 py-2 rounded-xl bg-rose-100/80 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            Conflit d'horaire détecté :{' '}
                            {examConflicts.map((c, i) => (
                              <span key={i} className="font-black">
                                {c.proctorName} ({c.otherModule}){i < examConflicts.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}

                      {/* Header of Exam Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {exam.date_formatted}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/60 flex items-center gap-1.5 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {exam.start_time} ({exam.duration_minutes} min)
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 flex items-center gap-1.5 shadow-2xs">
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            {exam.room_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {exam.filiere_name && (
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-slate-500" />
                              {exam.filiere_name} {exam.group_name ? `• ${exam.group_name}` : ''}
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                            #EX-{exam.id}
                          </span>
                        </div>
                      </div>

                      {/* Module Title */}
                      <div className="mt-3 mb-3">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{exam.module_name}</span>
                          {exam.module_code && (
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                              {exam.module_code}
                            </span>
                          )}
                        </h4>
                      </div>

                      {/* Proctor Selectors Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        {/* 1. Surveillant Principal (Président de Salle) */}
                        <div className="p-3.5 rounded-2xl bg-amber-500/[0.04] dark:bg-amber-950/[0.15] border border-amber-200/70 dark:border-amber-900/50 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-amber-600 fill-amber-500/20" />
                              Président de Salle (Principal)
                            </span>
                            {assign.principal_id && (
                              <button
                                onClick={() => handleSetPrincipal(exam.id, null)}
                                className="text-[10px] text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer"
                              >
                                Retirer
                              </button>
                            )}
                          </div>

                          <ProctorCombobox
                            proctors={proctors}
                            selectedId={assign.principal_id}
                            onSelect={(id) => handleSetPrincipal(exam.id, id)}
                            workload={proctorWorkload}
                            currentExam={exam}
                            role="principal"
                            placeholder="Choisir le Président de salle..."
                            checkOverlap={checkOverlap}
                          />
                        </div>

                        {/* 2. Surveillants Secondaires */}
                        <div className="p-3.5 rounded-2xl bg-indigo-500/[0.04] dark:bg-indigo-950/[0.15] border border-indigo-200/70 dark:border-indigo-900/50 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-400 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              Surveillant(s) Secondaire(s) ({assign.secondary_ids.length})
                            </span>
                          </div>

                          {/* List of active secondary chips */}
                          {assign.secondary_ids.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {assign.secondary_ids.map((secId) => {
                                const secProctor = proctorsMap.get(secId)
                                if (!secProctor) return null
                                const styles = getTypeBadgeStyles(secProctor.type)
                                const count = proctorWorkload.get(secId)?.count || 0

                                return (
                                  <span
                                    key={secId}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs"
                                  >
                                    <span
                                      className={cn(
                                        'w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black',
                                        styles.avatar
                                      )}
                                    >
                                      {getInitials(secProctor.name)}
                                    </span>
                                    <span className="truncate max-w-[120px]">{secProctor.name}</span>
                                    <span
                                      className={cn(
                                        'text-[8px] font-black uppercase px-1 py-0.2 rounded-md border',
                                        styles.badge
                                      )}
                                    >
                                      {secProctor.type}
                                    </span>
                                    <button
                                      onClick={() => handleRemoveSecondary(exam.id, secId)}
                                      type="button"
                                      className="text-slate-400 hover:text-rose-600 ml-0.5 transition-colors cursor-pointer"
                                      title="Retirer ce surveillant secondaire"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </span>
                                )
                              })}
                            </div>
                          )}

                          {/* Dropdown to add another secondary */}
                          <ProctorCombobox
                            proctors={proctors}
                            selectedId={null}
                            onSelect={(id) => {
                              if (id) handleAddSecondary(exam.id, id)
                            }}
                            excludeIds={[
                              ...(assign.principal_id ? [assign.principal_id] : []),
                              ...assign.secondary_ids,
                            ]}
                            workload={proctorWorkload}
                            currentExam={exam}
                            role="secondary"
                            placeholder="+ Ajouter un surveillant secondaire..."
                            checkOverlap={checkOverlap}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: PROCTORS WORKLOAD & QUOTAS PANEL (32%) */}
          <div className="w-full lg:w-[460px] flex flex-col bg-white dark:bg-slate-900 overflow-hidden shrink-0 border-t lg:border-t-0">
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  Quotas & Charge des Surveillants
                </h3>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {proctors.length} éligibles
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Contrôlez en temps réel le nombre de séances attribuées à chaque enseignant (permanents, vacataires,
                doctorants). Cliquez sur un prof pour filtrer ses séances à gauche.
              </p>

              {/* Search proctors */}
              <div className="relative mt-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={proctorSearch}
                  onChange={(e) => setProctorSearch(e.target.value)}
                  placeholder="Rechercher un professeur..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                {proctorSearch && (
                  <button
                    onClick={() => setProctorSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter by proctor type tabs */}
              <div className="flex gap-1 mt-2.5 overflow-x-auto pb-0.5">
                {(['all', 'Permanent', 'Vacataire', 'Doctorant'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setProctorTypeFilter(type)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer',
                      proctorTypeFilter === type
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    )}
                  >
                    {type === 'all' ? 'Tous' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* List of proctors with live counter */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
              {filteredProctors.map((proctor) => {
                const workload = proctorWorkload.get(proctor.id) || {
                  count: 0,
                  asPrincipal: 0,
                  asSecondary: 0,
                  slots: [],
                }
                const hasConflict = conflicts.conflictingProctorIds.has(proctor.id)
                const isHighlighted = highlightedProctorId === proctor.id
                const styles = getTypeBadgeStyles(proctor.type)

                return (
                  <div
                    key={proctor.id}
                    onClick={() => {
                      setHighlightedProctorId(isHighlighted ? null : proctor.id)
                    }}
                    className={cn(
                      'p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group select-none',
                      isHighlighted
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0',
                          styles.avatar
                        )}
                      >
                        {getInitials(proctor.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {proctor.name}
                          </p>
                          <span
                            className={cn(
                              'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border',
                              styles.badge
                            )}
                          >
                            {proctor.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {proctor.department || 'ENCG Fès'} • {proctor.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasConflict && (
                        <span
                          title="Conflit d'horaires sur 2 séances en simultané !"
                          className="p-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      )}

                      {/* Live Counter Badge */}
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-xl text-xs font-black min-w-[70px] text-center transition-all shadow-2xs',
                          workload.count === 0
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            : workload.count === 1
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : workload.count === 2
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black'
                        )}
                      >
                        {workload.count} {workload.count > 1 ? 'séances' : 'séance'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:px-8 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Total surveillances attribuées :{' '}
              <strong className="text-slate-900 dark:text-white font-black">{coverageStats.totalAssignedSlots}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {coverageStats.complete} complètes
            </span>
            {coverageStats.empty > 0 && (
              <span className="flex items-center gap-1.5 text-rose-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {coverageStats.empty} sans surveillant
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Annuler
            </button>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              type="button"
              className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 fill-white" />
              )}
              <span>Appliquer & Enregistrer l'Affectation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
