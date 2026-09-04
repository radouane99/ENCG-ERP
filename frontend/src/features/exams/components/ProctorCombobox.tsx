import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Search,
  X,
  Check,
  ChevronDown,
  AlertTriangle,
  User,
  Shield,
  Users,
  UserPlus,
  Sparkles,
} from 'lucide-react'
import { cn } from '@shared/lib/utils'

export interface Proctor {
  id: number
  name: string
  email: string
  cin: string
  type: 'Permanent' | 'Vacataire' | 'Doctorant' | 'Chef de Département'
  department: string
}

export interface ExamSlot {
  id: number
  exam_date: string
  date_formatted: string
  start_time: string
  duration_minutes: number
  module_name: string
  module_code: string
  filiere_name: string
  group_name: string
  room_id: number | null
  room_name: string
  principal_id: number | null
  secondary_ids: number[]
}

interface ProctorComboboxProps {
  proctors: Proctor[]
  selectedId: number | null
  onSelect: (proctorId: number | null) => void
  workload: Map<
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
  >
  currentExam: ExamSlot
  excludeIds?: number[]
  placeholder?: string
  role?: 'principal' | 'secondary'
  checkOverlap: (
    dateA: string,
    timeA: string,
    durationA: number,
    dateB: string,
    timeB: string,
    durationB: number
  ) => boolean
  className?: string
}

export function ProctorCombobox({
  proctors,
  selectedId,
  onSelect,
  workload,
  currentExam,
  excludeIds = [],
  placeholder = 'Sélectionner un surveillant...',
  role = 'principal',
  checkOverlap,
  className,
}: ProctorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Permanent' | 'Vacataire' | 'Doctorant'>('all')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedProctor = useMemo(
    () => (selectedId ? proctors.find((p) => p.id === selectedId) : null),
    [selectedId, proctors]
  )

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearch('')
      setCategoryFilter('all')
    }
  }, [isOpen])

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'PR'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Get styling colors based on proctor type
  const getTypeBadgeStyles = (type: Proctor['type']) => {
    switch (type) {
      case 'Doctorant':
        return {
          badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800',
          avatar: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20',
          dot: 'bg-amber-500',
        }
      case 'Vacataire':
        return {
          badge: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300/80 dark:border-purple-800',
          avatar: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20',
          dot: 'bg-purple-500',
        }
      case 'Chef de Département':
        return {
          badge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800',
          avatar: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20',
          dot: 'bg-rose-500',
        }
      case 'Permanent':
      default:
        return {
          badge: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-800',
          avatar: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20',
          dot: 'bg-blue-500',
        }
    }
  }

  // Helper to check if a proctor has a time overlap with this specific currentExam
  const getProctorConflict = (proctorId: number) => {
    const data = workload.get(proctorId)
    if (!data || !data.slots || data.slots.length === 0) return null

    for (const s of data.slots) {
      // Ignore conflict with the very same exam slot
      if (s.examId === currentExam.id) continue

      if (
        checkOverlap(
          currentExam.exam_date,
          currentExam.start_time,
          currentExam.duration_minutes,
          s.date,
          s.start_time,
          s.duration
        )
      ) {
        return {
          module: s.module,
          room: s.room,
          time: `${s.date} à ${s.start_time}`,
        }
      }
    }
    return null
  }

  // Filter proctors for the popover list
  const filteredProctors = useMemo(() => {
    return proctors
      .filter((p) => !excludeIds.includes(p.id))
      .filter((p) => {
        if (categoryFilter !== 'all' && p.type !== categoryFilter) return false
        if (search.trim()) {
          const q = search.toLowerCase()
          return (
            p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            (p.department && p.department.toLowerCase().includes(q))
          )
        }
        return true
      })
      .sort((a, b) => {
        // Sort: first proctors without conflicts, then by lowest workload count
        const confA = getProctorConflict(a.id) ? 1 : 0
        const confB = getProctorConflict(b.id) ? 1 : 0
        if (confA !== confB) return confA - confB

        const countA = workload.get(a.id)?.count || 0
        const countB = workload.get(b.id)?.count || 0
        return countA - countB
      })
  }, [proctors, excludeIds, categoryFilter, search, workload, currentExam])

  const selectedLoad = selectedProctor ? workload.get(selectedProctor.id)?.count || 0 : 0
  const selectedTypeStyles = selectedProctor ? getTypeBadgeStyles(selectedProctor.type) : null
  const selectedConflict = selectedProctor ? getProctorConflict(selectedProctor.id) : null

  return (
    <div ref={containerRef} className={cn('relative w-full text-left', className)}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full min-h-[46px] px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 outline-none select-none text-left',
          selectedProctor
            ? role === 'principal'
              ? 'bg-amber-500/10 hover:bg-amber-500/15 border border-amber-300 dark:border-amber-800/80 text-slate-900 dark:text-white shadow-xs'
              : 'bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-300 dark:border-indigo-800/80 text-slate-900 dark:text-white shadow-xs'
            : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
          isOpen &&
            (role === 'principal'
              ? 'ring-2 ring-amber-500/30 border-amber-500 shadow-md'
              : 'ring-2 ring-indigo-500/30 border-indigo-500 shadow-md')
        )}
      >
        {selectedProctor && selectedTypeStyles ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Avatar */}
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm',
                selectedTypeStyles.avatar
              )}
            >
              {getInitials(selectedProctor.name)}
            </div>

            {/* Name and Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[170px]">
                  {selectedProctor.name}
                </span>
                <span
                  className={cn(
                    'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border',
                    selectedTypeStyles.badge
                  )}
                >
                  {selectedProctor.type}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {selectedProctor.department || 'ENCG Fès'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 py-0.5">
            {role === 'principal' ? (
              <Shield className="w-4 h-4 text-amber-500/80" />
            ) : (
              <UserPlus className="w-4 h-4 text-indigo-500/80" />
            )}
            <span className="text-xs font-medium">{placeholder}</span>
          </div>
        )}

        {/* Right side: workload badge, conflict alert & actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedConflict && (
            <span
              title={`Conflit horaire avec ${selectedConflict.module} (${selectedConflict.time})`}
              className="p-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}

          {selectedProctor && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-lg text-[10px] font-black',
                selectedLoad === 1
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : selectedLoad === 2
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
              )}
            >
              {selectedLoad} {selectedLoad > 1 ? 'séances' : 'séance'}
            </span>
          )}

          {selectedProctor && role === 'principal' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(null)
              }}
              title="Retirer ce surveillant"
              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-amber-500'
            )}
          />
        </div>
      </button>

      {/* FLOATING RICH DROPDOWN POPOVER */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[320px] max-w-[460px] max-h-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/30 overflow-hidden z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md shrink-0 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chercher nom, département..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px]">
              {(
                [
                  { id: 'all', label: 'Tous' },
                  { id: 'Permanent', label: 'Permanents' },
                  { id: 'Vacataire', label: 'Vacataires' },
                  { id: 'Doctorant', label: 'Doctorants' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={cn(
                    'px-2 py-0.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer',
                    categoryFilter === tab.id
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proctors List */}
          <div className="flex-1 overflow-y-auto p-1.5 divide-y divide-slate-100/60 dark:divide-slate-800/60">
            {filteredProctors.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <User className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs font-semibold">Aucun enseignant trouvé</p>
                <p className="text-[10px] text-slate-500">Essayez un autre terme de recherche.</p>
              </div>
            ) : (
              filteredProctors.map((proctor) => {
                const isSelected = selectedId === proctor.id
                const conflict = getProctorConflict(proctor.id)
                const typeStyle = getTypeBadgeStyles(proctor.type)
                const count = workload.get(proctor.id)?.count || 0

                return (
                  <div
                    key={proctor.id}
                    onClick={() => {
                      onSelect(isSelected && role === 'principal' ? null : proctor.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 group my-0.5 select-none',
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800'
                        : conflict
                        ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0',
                          typeStyle.avatar
                        )}
                      >
                        {getInitials(proctor.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'font-bold text-xs truncate',
                              isSelected
                                ? 'text-amber-900 dark:text-amber-200'
                                : 'text-slate-900 dark:text-white'
                            )}
                          >
                            {proctor.name}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border',
                              typeStyle.badge
                            )}
                          >
                            {proctor.type}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {proctor.department || 'ENCG Fès'}
                        </p>

                        {/* Conflict Warning inside item */}
                        {conflict && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              ⚠️ Conflit : {conflict.module} ({conflict.time})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Workload Badge & Selected Check */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-lg text-[10px] font-black text-center min-w-[54px]',
                          count === 0
                            ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            : count === 1
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : count === 2
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        )}
                      >
                        {count} {count > 1 ? 'séances' : 'séance'}
                      </span>

                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Quick footer with count hint */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
            <span>
              <strong className="text-slate-700 dark:text-slate-300 font-bold">
                {filteredProctors.length}
              </strong>{' '}
              surveillants
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Trié par dispo
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProctorCombobox
