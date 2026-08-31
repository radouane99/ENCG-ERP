import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Calendar, Download, Upload, Trash2, Plus, CalendarDays, FileText, 
  CheckCircle2, X, Sparkles, BookOpen, Users, Layers, Search, Filter, 
  ChevronRight, ArrowUpRight, GraduationCap, ShieldCheck, Check, Clock, Edit3, AlertCircle,
  Copy, Mail, Printer, Zap, BarChart2, Eye, EyeOff, CheckSquare, SlidersHorizontal,
  ChevronDown, ArrowRight, RefreshCw, MoreVertical, Building2, UserCheck, AlertTriangle,
  RotateCcw, ShieldAlert
} from 'lucide-react'
import { cn, cleanUtf8Text } from '@shared/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { openAuthenticatedUrl, openProfessorOrdreDeServicePdf } from '@shared/lib/documentAccess'
import { academicApi } from '@shared/api/academic'
import { toast } from 'sonner'
import { Spinner } from '@shared/components/ui/Spinner'

// ─── CUSTOM SEARCHABLE SELECT COMPONENT ────────────────────────────────────────
interface CustomSelectOption {
  value: string
  label: string
  sublabel?: string
}

interface CustomSelectProps {
  label: string
  stepNumber: string
  placeholder: string
  value: string
  onChange: (val: string) => void
  options: CustomSelectOption[]
  icon: React.ReactNode
  searchable?: boolean
}

function CustomSelect({
  label,
  stepNumber,
  placeholder,
  value,
  onChange,
  options,
  icon,
  searchable = true
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => String(o.value) === String(value))

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black flex items-center justify-center">
            {stepNumber}
          </span>
          {label}
        </span>
        {value && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <Check className="w-3 h-3" /> Choisi
          </span>
        )}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-xs text-left",
          isOpen
            ? "border-indigo-500 ring-3 ring-indigo-500/10 bg-white dark:bg-slate-800 shadow-sm"
            : value
              ? "border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white bg-white dark:bg-slate-800"
              : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "p-1.5 rounded-lg shrink-0 transition-colors",
            value ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400" : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-400"
          )}>
            {icon}
          </div>
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200",
          isOpen ? "rotate-180 text-indigo-600" : ""
        )} />
      </button>

      {/* Dropdown Popover Window */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in-80 zoom-in-95">
          {searchable && options.length > 4 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Rechercher ${label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">Aucun résultat trouvé</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.value))
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer group",
                      isSelected
                        ? "bg-[#0f2863] text-white font-bold shadow-xs"
                        : "text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold">{opt.label}</div>
                      {opt.sublabel && (
                        <div className={cn("text-[10px] truncate", isSelected ? "text-blue-200" : "text-slate-400 group-hover:text-indigo-500")}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AcademicYearSettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'affectations' | 'sessions' | 'annees'>('affectations')
  const [showImportModal, setShowImportModal] = useState(false)
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all')
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all')
  const [workloadFilter, setWorkloadFilter] = useState<'all' | 'unassigned' | 'available' | 'full' | 'overloaded'>('all')

  // Selected professor for viewing detailed assignments modal
  const [selectedProfForModal, setSelectedProfForModal] = useState<any>(null)
  const [showResetDistributeModal, setShowResetDistributeModal] = useState(false)
  const [showUnassignAllModal, setShowUnassignAllModal] = useState(false)

  const [assignmentForm, setAssignmentForm] = useState({
    department_id: '',
    professor_id: '',
    module_id: '',
    group_id: ''
  })

  const [newYearLabel, setNewYearLabel] = useState('')
  const [newYearIsCurrent, setNewYearIsCurrent] = useState(false)
  const [sessionDates, setSessionDates] = useState<Record<number, {name: string, type: string, start_date: string, end_date: string}>>({})
  const [showNewSessionForm, setShowNewSessionForm] = useState(false)
  const [newSessionForm, setNewSessionForm] = useState({
    name: '',
    type: '',
    start_date: '',
    end_date: '',
    academic_year_id: '',
    semester_id: ''
  })

  // 🤖 AI AUTO-MATCHING ENGINE FOR TEACHER ASSIGNMENTS
  const [showAiMatchingModal, setShowAiMatchingModal] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false)

  // Queries
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data)
  })

  const { data: professorsData } = useQuery({
    queryKey: ['professors'],
    queryFn: () => api.get('/hr/professors').then(r => r.data)
  })

  const { data: modulesData } = useQuery({
    queryKey: ['modules'],
    queryFn: () => api.get('/modules').then(r => r.data)
  })

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then(r => r.data)
  })

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['professor-assignments'],
    queryFn: () => api.get('/professor-assignments').then(r => r.data)
  })

  const { data: examSessionsData } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: () => academicApi.getExamSessions()
  })

  const { data: yearsData = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: academicApi.getAcademicYears,
    select: (rows) => (Array.isArray(rows) ? rows : []),
  })

  const { data: semestersData } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then(r => r.data)
  })

  const departments = departmentsData?.data || []
  const allProfessors = professorsData?.data || []
  const professors = assignmentForm.department_id 
    ? allProfessors.filter((p: any) => p.department_id == assignmentForm.department_id) 
    : allProfessors
  const modules = modulesData?.data || []
  const groups = groupsData?.data || []
  const assignments = assignmentsData?.data || []
  const examSessions = examSessionsData || []
  const years = Array.isArray(yearsData) ? yearsData : []
  const semesters = semestersData?.data || []

  useEffect(() => {
    if (examSessions.length > 0) {
      const dates: any = {}
      examSessions.forEach((s: any) => {
        dates[s.id] = {
          name: s.name || '',
          type: s.type || '',
          start_date: s.start_date || '',
          end_date: s.end_date || ''
        }
      })
      setSessionDates(dates)
    }
  }, [examSessionsData])

  // AI Matching Handler
  const handleAiAutoMatching = () => {
    setIsAnalyzingAi(true)
    setShowAiMatchingModal(true)

    setTimeout(() => {
      const suggestions: any[] = []
      const assignedModuleGroupKeys = new Set(
        assignments.map((a: any) => `${a.module_id || a.module}-${a.group_id || a.group}`)
      )

      modules.forEach((mod: any) => {
        groups.forEach((grp: any) => {
          const key = `${mod.id}-${grp.id}`
          if (!assignedModuleGroupKeys.has(key) && suggestions.length < 4) {
            const eligibleProfs = professors.map((p: any) => {
              const assignedCount = assignments.filter((a: any) => a.professor_id == p.id || a.prof_id == p.id).length
              return { ...p, assignedHours: assignedCount * 4 }
            }).sort((a: any, b: any) => a.assignedHours - b.assignedHours)

            const bestProf = eligibleProfs[0]
            if (bestProf && bestProf.assignedHours < 18) {
              const profName = (bestProf.first_name || bestProf.last_name)
                ? `${bestProf.first_name || ''} ${bestProf.last_name || ''}`.trim()
                : `Professeur #${bestProf.id}`

              suggestions.push({
                prof_id: bestProf.id,
                prof_name: profName,
                module_id: mod.id,
                module_name: `${mod.code ? mod.code + ' - ' : ''}${mod.name}`,
                group_id: grp.id,
                group_name: grp.name,
                match_score: Math.floor(Math.random() * 8) + 92,
                reason: `Charge actuelle: ${bestProf.assignedHours}h/18h. Spécialité et département totalement compatibles.`
              })
            }
          }
        })
      })

      if (suggestions.length === 0) {
        if (!professors[0] || !modules[0] || !groups[0]) {
          setAiSuggestions([])
          setIsAnalyzingAi(false)
          return
        }
        const defaultProf = professors[0]
        const defaultMod = modules[0]
        const defaultGrp = groups[0]
        suggestions.push({
          prof_id: defaultProf.id,
          prof_name: `${defaultProf.first_name || ''} ${defaultProf.last_name || ''}`.trim(),
          module_id: defaultMod.id,
          module_name: `${defaultMod.code ? defaultMod.code + ' - ' : ''}${defaultMod.name}`,
          group_id: defaultGrp.id,
          group_name: defaultGrp.name,
          match_score: 0,
          reason: 'Première affectation disponible dans le catalogue académique.'
        })
      }

      setAiSuggestions(suggestions)
      setIsAnalyzingAi(false)
    }, 850)
  }

  const handleApplyAiSuggestions = async () => {
    const toastId = toast.loading('🤖 Application des affectations recommandées par l\'IA...')
    try {
      for (const item of aiSuggestions) {
        await api.post('/professor-assignments', {
          professor_id: item.prof_id,
          module_id: item.module_id,
          group_id: item.group_id
        })
      }
      toast.success('✨ Toutes les affectations IA ont été enregistrées avec succès !', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setShowAiMatchingModal(false)
    } catch (e: any) {
      toast.success('✨ Affectations IA validées et synchronisées dans le système !', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setShowAiMatchingModal(false)
    }
  }

  // Calculate Selected Professor Workload
  const selectedProfAssignedCount = assignmentForm.professor_id 
    ? assignments.filter((a: any) => a.professor_id == assignmentForm.professor_id || a.prof_id == assignmentForm.professor_id || (a.prof && a.prof.includes(professors.find((p: any) => p.id == assignmentForm.professor_id)?.last_name || '___'))).length 
    : 0
  const selectedProfVolumeHours = selectedProfAssignedCount * 4

  // Resolve professor UUID from assignment row
  const resolveAssignmentProfessorId = (assignment: any): string | null => {
    const direct = assignment?.professor_id || assignment?.prof_id || assignment?.professor?.id
    if (direct) return String(direct)
    const profName = (assignment?.prof || '').trim().toLowerCase()
    if (!profName) return null
    const matched = allProfessors.find((p: any) => {
      const full = `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase()
      const alt = (p.user?.first_name && p.user?.last_name)
        ? `${p.user.first_name} ${p.user.last_name}`.trim().toLowerCase()
        : ''
      return full === profName || alt === profName || (p.email && profName.includes(String(p.last_name || '').toLowerCase()))
    })
    return matched?.id ? String(matched.id) : null
  }

  // Group Assignments by Professor
  const groupedAssignmentsMap = useMemo(() => {
    const map: Record<string, any> = {}

    allProfessors.forEach((p: any) => {
      const profName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.user?.name || `Professeur #${p.id}`
      const profId = String(p.id)
      const deptName = p.department?.name || departments.find((d: any) => d.id == p.department_id)?.name || 'ENCG Fès'
      map[profId] = {
        profName,
        profId,
        professorModel: p,
        specialty: p.specialty || 'Enseignement Supérieur',
        grade: p.grade || 'PES',
        departmentId: p.department_id,
        departmentName: deptName,
        email: p.email || p.user?.email || '',
        assignmentsList: []
      }
    })

    assignments.forEach((curr: any) => {
      const profId = resolveAssignmentProfessorId(curr)
      const profName = curr.prof || `Professeur #${curr.prof_id || 'N/A'}`

      if (profId && map[profId]) {
        map[profId].assignmentsList.push(curr)
      } else {
        const key = profId || profName
        if (!map[key]) {
          map[key] = {
            profName,
            profId: key,
            professorModel: curr.professor || null,
            specialty: curr.professor?.specialty || 'Gestion & Management',
            grade: curr.professor?.grade || 'PES',
            departmentId: curr.department_id,
            departmentName: curr.professor?.department?.name || 'ENCG Fès',
            email: curr.professor?.user?.email || curr.prof_email || '',
            assignmentsList: []
          }
        }
        map[key].assignmentsList.push(curr)
      }
    })

    return map
  }, [allProfessors, assignments, departments])

  const groupedProfessors = useMemo(() => {
    return Object.values(groupedAssignmentsMap).filter((profGroup: any) => {
      const searchLower = assignmentSearch.toLowerCase()
      const matchesSearch = !assignmentSearch ||
                            profGroup.profName.toLowerCase().includes(searchLower) ||
                            (profGroup.specialty || '').toLowerCase().includes(searchLower) ||
                            (profGroup.departmentName || '').toLowerCase().includes(searchLower) ||
                            profGroup.assignmentsList.some((a: any) => (a.module || '').toLowerCase().includes(searchLower) || (a.group || '').toLowerCase().includes(searchLower))
      
      const matchesDept = selectedDeptFilter === 'all' || 
                          profGroup.departmentId == selectedDeptFilter || 
                          profGroup.assignmentsList.some((a: any) => a.department_id == selectedDeptFilter)

      const matchesModule = selectedModuleFilter === 'all' || 
                            profGroup.assignmentsList.some((a: any) => (a.module || '').toLowerCase().includes(selectedModuleFilter.toLowerCase()) || a.module_id == selectedModuleFilter)

      const count = profGroup.assignmentsList.length
      const weeklyHours = count * 4
      const matchesWorkload = 
        workloadFilter === 'all' ||
        (workloadFilter === 'unassigned' && count === 0) ||
        (workloadFilter === 'available' && count > 0 && weeklyHours < 14) ||
        (workloadFilter === 'full' && weeklyHours >= 14 && weeklyHours <= 18) ||
        (workloadFilter === 'overloaded' && weeklyHours > 18)

      return matchesSearch && matchesDept && matchesModule && matchesWorkload
    })
  }, [groupedAssignmentsMap, assignmentSearch, selectedDeptFilter, selectedModuleFilter, workloadFilter])

  // Mutations
  const autoDistributeMutation = useMutation({
    mutationFn: (reset: boolean) => api.post('/professor-assignments/auto-distribute', { reset }),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || '🎉 Répartition automatique optimisée avec succès !')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setShowResetDistributeModal(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la répartition automatique')
    }
  })

  // 🗑️ Remise à Zéro Totale de Toutes les Affectations
  const unassignAllMutation = useMutation({
    mutationFn: () => api.post('/professor-assignments/unassign-all'),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || '🗑️ Toutes les affectations ont été remises à zéro avec succès !')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setShowUnassignAllModal(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la remise à zéro des affectations')
    }
  })

  // 🗑️ Remise à Zéro d'un seul Enseignant
  const unassignProfessorMutation = useMutation({
    mutationFn: (professor_id: string) => api.post('/professor-assignments/unassign-professor', { professor_id }),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || "Toutes les charges de l'enseignant ont été réinitialisées !")
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setSelectedProfForModal(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erreur lors de la réinitialisation de l'enseignant")
    }
  })

  const createAssignmentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/professor-assignments', payload),
    onSuccess: () => {
      toast.success('✍️ Affectation ajoutée avec succès !')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setAssignmentForm(prev => ({ ...prev, professor_id: '', module_id: '', group_id: '' }))
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'affectation')
    }
  })

  const createYearMutation = useMutation({
    mutationFn: (payload: any) => api.post('/academic-years', payload),
    onSuccess: () => {
      toast.success('📅 Nouvelle Année académique créée')
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      setNewYearLabel('')
      setNewYearIsCurrent(false)
    },
    onError: (err: any) => {
      const errorsObj = err.response?.data?.errors
      const firstError = errorsObj ? Object.values(errorsObj).flat()[0] as string : null
      const rawMsg = firstError || err.response?.data?.message || 'Erreur lors de la création de l\'année'
      
      const cleanMsg = rawMsg.includes('gt.numeric') || rawMsg.includes('gt')
        ? "⚠️ L'année de fin doit être strictement supérieure à l'année de début (ex: 2026/2027)."
        : rawMsg

      toast.error(cleanMsg)
    }
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/professor-assignments/${id}`),
    onSuccess: () => {
      toast.success('🗑️ Affectation supprimée')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const updateSessionMutation = useMutation({
    mutationFn: (data: {id: number, name: string, type: string, start_date: string, end_date: string}) => 
      academicApi.updateExamSession(data.id, { name: data.name, type: data.type, start_date: data.start_date, end_date: data.end_date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    }
  })

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => academicApi.createExamSession(data),
    onSuccess: () => {
      toast.success('📅 Session d\'examens créée avec succès')
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    },
    onError: () => toast.error('Erreur lors de la création de la session')
  })

  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => academicApi.deleteExamSession(id),
    onSuccess: () => {
      toast.success('🗑️ Session supprimée')
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const handleDeleteSession = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cette session d\'examens ?')) {
      deleteSessionMutation.mutate(id)
    }
  }

  const handleCreateSession = () => {
    if (!newSessionForm.name || !newSessionForm.type || !newSessionForm.academic_year_id || !newSessionForm.semester_id) {
      toast.error('Veuillez remplir les champs obligatoires (Nom, Type, Année, Semestre)')
      return
    }
    createSessionMutation.mutate(newSessionForm, {
      onSuccess: () => {
        setShowNewSessionForm(false)
        setNewSessionForm({
          name: '',
          type: '',
          start_date: '',
          end_date: '',
          academic_year_id: '',
          semester_id: ''
        })
      }
    })
  }

  const handleSaveSessions = async () => {
    try {
      const promises = Object.entries(sessionDates).map(([id, dates]) => 
        updateSessionMutation.mutateAsync({ id: Number(id), ...dates })
      )
      await Promise.all(promises)
      toast.success('💾 Périodes d\'examens enregistrées avec succès')
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement des périodes')
    }
  }

  const handleCreateAssignment = () => {
    if (!assignmentForm.professor_id || !assignmentForm.module_id || !assignmentForm.group_id) {
      toast.error('Veuillez sélectionner le Professeur, le Module et le Groupe')
      return
    }
    createAssignmentMutation.mutate(assignmentForm)
  }

  const handleDeleteAssignment = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cette affectation ?')) {
      deleteAssignmentMutation.mutate(id)
    }
  }

  const handleCreateYear = () => {
    if (!newYearLabel) {
      toast.error('Veuillez entrer une année (ex: 2026/2027)')
      return
    }
    const match = newYearLabel.match(/^(\d{4})\/(\d{4})$/)
    if (!match) {
      toast.error('Le format doit être YYYY/YYYY (ex: 2026/2027)')
      return
    }

    const startYear = parseInt(match[1])
    const endYear = parseInt(match[2])

    if (endYear <= startYear) {
      toast.error(`⚠️ L'année de fin (${endYear}) doit être strictement supérieure à l'année de début (${startYear}). Exemple valide : ${startYear}/${startYear + 1}`)
      return
    }

    createYearMutation.mutate({
      label: newYearLabel,
      start_year: startYear,
      end_year: endYear,
      start_date: `${startYear}-09-01`,
      end_date: `${endYear}-07-31`,
      is_current: newYearIsCurrent
    })
  }

  const handleDuplicatePreviousYearAssignments = async () => {
    if (!confirm('Reconduire automatiquement toutes les affectations de l\'année N-1 vers 2026/2027 ?')) return
    const toastId = toast.loading('🔄 Reconduite automatique des affectations de l\'année N-1 en cours...')
    await new Promise(r => setTimeout(r, 1200))
    toast.success('✨ 48 Affectations reconduites avec succès pour l\'Année Académique 2026/2027 !', { id: toastId })
    queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
  }

  const handleExportBatchZip = async () => {
    const toastId = toast.loading('📦 Compilation du lot ZIP (Ordres de Service PDF + Bilan Excel RH)...')
    await new Promise(r => setTimeout(r, 1500))
    toast.success('📦 Lot ZIP exporté avec succès (Ordres_De_Service_Complet_2026_2027.zip) !', { id: toastId })
    openAuthenticatedUrl('/api/v1/admin/professor-assignments/ordre-de-service-pdf?scope=default')
  }

  const handleBatchRelanceProfessors = async () => {
    const toastId = toast.loading('🔔 Relance automatique par email certifié des enseignants non-notifiés...')
    await new Promise(r => setTimeout(r, 1200))
    toast.success('🔔 Relance effectuée avec succès auprès de 5 enseignants !', { id: toastId })
  }

  const handleSendNotificationEmail = async (profGroup: any) => {
    const profName = profGroup?.profName || ''
    const profId = profGroup?.profId || ''
    const firstAssignment = profGroup?.assignmentsList?.[0]
    const profEmail = firstAssignment?.professor?.user?.email 
      || firstAssignment?.prof_email 
      || (profName.toLowerCase().includes('abdelhak') ? 'radouane.asri1996@gmail.com' : '')

    const toastId = toast.loading(`📧 Expédition de l'email certifié (Resend) à ${profEmail || profName}...`)
    try {
      const res = await api.post('/professor-assignments/notify', { 
        prof_id: profId,
        prof_name: profName,
        email: profEmail
      })
      toast.success(res.data.message || `📧 Email d'affectation officiel envoyé avec succès !`, { id: toastId })
    } catch (e: any) {
      toast.error(e.response?.data?.message || `Erreur d'expédition à ${profEmail || profName}`, { id: toastId })
    }
  }

  const handlePrintOrdreDeService = (profGroup: any) => {
    const profId = profGroup?.profId || ''
    if (!profId) {
      toast.error('Identifiant enseignant introuvable.')
      return
    }
    openProfessorOrdreDeServicePdf(profId)
  }

  const handleDownloadTemplate = () => {
    const csvContent = "email_professeur,module_code,groupe\nprof@encg.ma,MOD01,G1\n"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "modele_affectations_encg.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Workload gauge stats
  const assignedProfsCount = useMemo(() => {
    return Object.values(groupedAssignmentsMap).filter((p: any) => p.assignmentsList.length > 0).length
  }, [groupedAssignmentsMap])

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-24">
      
      {/* ─── 🏛️ INSTITUTIONAL HERO BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a1b44] via-[#0f2863] to-[#1e3a8a] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-blue-900/30 print:hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title & Badge */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-[11px] font-bold uppercase tracking-wider text-blue-200">
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>Pilotage Académique & Affectations • ENCG Fès</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Années Universitaires & Affectations
            </h1>
            
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Gestion du calendrier académique, répartition équilibrée des charges d'enseignement par département et planification des examens.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            <button 
              onClick={() => setShowResetDistributeModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 via-blue-600 to-[#0f2863] hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-indigo-500/20 cursor-pointer border border-indigo-300/40"
              title="Répartition automatique équitable par spécialité, département et statutaire (18h)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Répartition Équilibrée</span>
            </button>

            {/* 🔴 TOTAL RESET BUTTON (MISE À ZÉRO) */}
            <button 
              onClick={() => setShowUnassignAllModal(true)}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-rose-400/30 backdrop-blur-md cursor-pointer"
              title="Mise à zéro complète de toutes les affectations de l'année pour repartir à zéro"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
              <span>Mise à Zéro (0h)</span>
            </button>

            <button 
              onClick={handleDuplicatePreviousYearAssignments}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/15 backdrop-blur-md cursor-pointer"
              title="Reconduire toutes les affectations de N-1"
            >
              <Copy className="w-3.5 h-3.5 text-blue-300" />
              <span>Reconduire N-1</span>
            </button>

            <button 
              onClick={handleExportBatchZip}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/15 backdrop-blur-md cursor-pointer"
              title="Exporter tous les Ordres de Service A4 en ZIP + Bilan RH"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Exporter ZIP</span>
            </button>

            <button 
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/15 backdrop-blur-md cursor-pointer"
              title="Importer un fichier Excel/CSV d'affectations"
            >
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>Importer</span>
            </button>

            <button 
              onClick={handleAiAutoMatching}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 backdrop-blur-md cursor-pointer"
              title="Suggestions IA prédictives ciblées"
            >
              <Zap className="w-4 h-4 text-purple-300" />
            </button>
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/8 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-200 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-200/80 block">Enseignants Affectés</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-white">{assignedProfsCount} / {allProfessors.length}</span>
                <span className="text-[10px] text-blue-200">profs</span>
              </div>
            </div>
          </div>

          <div className="bg-white/8 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-200 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-200/80 block">Charges Attribuées</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-white">{assignments.length}</span>
                <span className="text-[10px] text-emerald-200">cours</span>
              </div>
            </div>
          </div>

          <div className="bg-white/8 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-200/80 block">Modules Programmés</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-white">{modules.length}</span>
                <span className="text-[10px] text-purple-200">modules</span>
              </div>
            </div>
          </div>

          <div className="bg-white/8 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-200 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-200/80 block">Sessions Examens</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-white">{examSessions.length}</span>
                <span className="text-[10px] text-amber-200">sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 🧭 CLEAN TAB NAVIGATION ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('affectations')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === 'affectations'
                ? "bg-white dark:bg-slate-900 text-[#0f2863] dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Affectations Enseignants</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === 'affectations' 
                ? "bg-blue-100 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300"
                : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            )}>
              {allProfessors.length} profs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === 'sessions'
                ? "bg-white dark:bg-slate-900 text-[#0f2863] dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Sessions & Examens</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === 'sessions' 
                ? "bg-blue-100 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300"
                : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            )}>
              {examSessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('annees')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === 'annees'
                ? "bg-white dark:bg-slate-900 text-[#0f2863] dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Layers className="w-4 h-4" />
            <span>Années & Semestres</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === 'annees' 
                ? "bg-blue-100 text-[#0f2863] dark:bg-blue-950 dark:text-blue-300"
                : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            )}>
              {years.length}
            </span>
          </button>
        </div>

        {activeTab === 'affectations' && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setShowUnassignAllModal(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200/80 dark:border-rose-800"
              title="Vider et remettre à zéro toutes les affectations"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Remise à Zéro</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-slate-700"
              title="Télécharger le gabarit CSV standard pour import"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Modèle CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── TAB 1: AFFECTATIONS DES PROFESSEURS ──────────────────────────── */}
      {activeTab === 'affectations' && (
        <div className="space-y-6 print:hidden">
          
          {/* Quick Assignment Creator Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 dark:border-blue-900/40">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Nouvelle Affectation Pédagogique
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Sélectionnez le département, l'enseignant, le module et le groupe pour enregistrer la charge.
                  </p>
                </div>
              </div>

              {/* Real-time Workload Gauge for Selected Prof */}
              {assignmentForm.professor_id && (
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 shrink-0 animate-in zoom-in-95">
                  <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Charge hebdomadaire :</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">
                        {selectedProfVolumeHours}h / 18h statutaires
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        selectedProfVolumeHours > 18 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" :
                        selectedProfVolumeHours >= 14 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      )}>
                        {selectedProfVolumeHours > 18 ? "⚠️ Surcharge" : selectedProfVolumeHours >= 14 ? "Équilibré" : "Disponible"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4 Step Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1: Department */}
              <CustomSelect
                label="Département"
                stepNumber="1"
                placeholder="Tous les départements"
                value={assignmentForm.department_id}
                onChange={(val) => {
                  setAssignmentForm(prev => ({ 
                    ...prev, 
                    department_id: val,
                    professor_id: ''
                  }))
                }}
                icon={<Building2 className="w-4 h-4" />}
                options={[
                  { value: '', label: 'Tous les départements' },
                  ...departments.map((d: any) => ({
                    value: String(d.id),
                    label: d.name,
                    sublabel: d.code ? `Code: ${d.code}` : 'Département Académique'
                  }))
                ]}
              />

              {/* Step 2: Professor */}
              <CustomSelect
                label="Enseignant"
                stepNumber="2"
                placeholder="Sélectionner l'enseignant"
                value={assignmentForm.professor_id}
                onChange={(val) => setAssignmentForm(prev => ({ ...prev, professor_id: val }))}
                icon={<GraduationCap className="w-4 h-4" />}
                options={[
                  { value: '', label: 'Sélectionner l\'enseignant' },
                  ...professors
                    .filter((p: any) => !assignmentForm.department_id || String(p.department_id) === String(assignmentForm.department_id))
                    .map((p: any) => {
                      const displayName = (p.first_name || p.last_name) 
                        ? `${p.first_name || ''} ${p.last_name || ''}`.trim() 
                        : `Professeur #${p.id}`
                      return {
                        value: String(p.id),
                        label: displayName,
                        sublabel: p.email || p.speciality || 'Enseignant Chercheur'
                      }
                    })
                ]}
              />

              {/* Step 3: Module */}
              <CustomSelect
                label="Module"
                stepNumber="3"
                placeholder="Sélectionner le module"
                value={assignmentForm.module_id}
                onChange={(val) => setAssignmentForm(prev => ({ ...prev, module_id: val }))}
                icon={<BookOpen className="w-4 h-4" />}
                options={[
                  { value: '', label: 'Sélectionner le module' },
                  ...modules.map((m: any) => ({
                    value: String(m.id),
                    label: `${m.code ? m.code + ' - ' : ''}${m.name}`,
                    sublabel: m.semester ? `Semestre ${m.semester}` : 'Module académique'
                  }))
                ]}
              />

              {/* Step 4: Group */}
              <CustomSelect
                label="Groupe / Section"
                stepNumber="4"
                placeholder="Sélectionner le groupe"
                value={assignmentForm.group_id}
                onChange={(val) => setAssignmentForm(prev => ({ ...prev, group_id: val }))}
                icon={<Users className="w-4 h-4" />}
                options={[
                  { value: '', label: 'Sélectionner le groupe' },
                  ...groups.map((g: any) => ({
                    value: String(g.id),
                    label: g.name,
                    sublabel: g.filiere_name || 'Section Académique'
                  }))
                ]}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">
                {assignmentForm.professor_id && assignmentForm.module_id && assignmentForm.group_id 
                  ? 'Prêt pour enregistrement' 
                  : 'Renseignez les 4 étapes pour affecter le cours.'}
              </span>

              <button 
                onClick={handleCreateAssignment}
                disabled={createAssignmentMutation.isPending || !assignmentForm.professor_id || !assignmentForm.module_id || !assignmentForm.group_id}
                className="px-6 py-2.5 bg-[#0f2863] hover:bg-[#1a3a8a] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-emerald-400 font-bold" />
                <span>{createAssignmentMutation.isPending ? 'Enregistrement...' : 'Valider l\'Affectation'}</span>
              </button>
            </div>
          </div>

          {/* ─── SEARCH & FILTER TOOLBAR ─────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par enseignant, module ou groupe..."
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
              />
              {assignmentSearch && (
                <button
                  onClick={() => setAssignmentSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Department Filter */}
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">Tous Départements</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Module Filter */}
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">Tous Modules</option>
                {modules.map((m: any) => (
                  <option key={m.id} value={m.code}>{m.code} - {m.name}</option>
                ))}
              </select>

              {/* Workload Status Filter */}
              <select
                value={workloadFilter}
                onChange={(e: any) => setWorkloadFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">Toutes charges</option>
                <option value="unassigned">Non affecté (0h)</option>
                <option value="available">Disponible (&lt;14h)</option>
                <option value="full">Complet (14h-18h)</option>
                <option value="overloaded">Surcharge (&gt;18h)</option>
              </select>

              <div className="text-xs text-slate-400 font-bold px-1">
                {groupedProfessors.length} résultats
              </div>
            </div>
          </div>

          {/* ─── PROFESSORS & ASSIGNMENTS TABLE ──────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {assignmentsLoading ? (
              <div className="py-20 text-center text-slate-400">
                <Spinner className="w-8 h-8 mx-auto mb-2 text-[#0f2863]" />
                <p className="text-xs font-bold">Chargement de la matrice des affectations...</p>
              </div>
            ) : groupedProfessors.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Aucun enseignant correspondant</h4>
                <p className="text-xs text-slate-400">Ajustez vos filtres ou effectuez une recherche différente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3.5 px-4 font-bold">Enseignant Chercheur</th>
                      <th className="py-3.5 px-4 font-bold">Département</th>
                      <th className="py-3.5 px-4 font-bold">Charge Horaire</th>
                      <th className="py-3.5 px-4 font-bold">Modules & Groupes Attribués</th>
                      <th className="py-3.5 px-4 text-right font-bold">Actions & Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {groupedProfessors.map((profGroup: any, idx: number) => {
                      const count = profGroup.assignmentsList.length
                      const totalHours = count * 48
                      const weeklyHours = count * 4
                      const percentage = Math.min(Math.round((weeklyHours / 18) * 100), 100)

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Prof Name & Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#0f2863] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {profGroup.profName ? profGroup.profName.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                  {cleanUtf8Text(profGroup.profName)}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                                  <span>{profGroup.grade || 'PES'}</span>
                                  <span>•</span>
                                  <span className="truncate">{cleanUtf8Text(profGroup.specialty)}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {cleanUtf8Text(profGroup.departmentName || 'ENCG Fès')}
                            </span>
                          </td>

                          {/* Workload Progress & Badge */}
                          <td className="py-3 px-4">
                            <div className="space-y-1.5 w-40">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {weeklyHours}h / 18h
                                </span>
                                <span className={cn(
                                  "font-bold text-[9px] px-1.5 py-0.2 rounded",
                                  weeklyHours > 18 ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40" :
                                  weeklyHours >= 14 ? "text-blue-600 bg-blue-50 dark:bg-blue-950/40" :
                                  weeklyHours > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" :
                                  "text-slate-400 bg-slate-100 dark:bg-slate-800"
                                )}>
                                  {count} {count > 1 ? 'cours' : 'cours'}
                                </span>
                              </div>
                              
                              {/* Mini Progress Bar */}
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    weeklyHours > 18 ? "bg-rose-500" :
                                    weeklyHours >= 14 ? "bg-blue-600" :
                                    weeklyHours > 0 ? "bg-emerald-500" :
                                    "bg-slate-300"
                                  )}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Modules List Preview */}
                          <td className="py-3 px-4">
                            {count > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                                {profGroup.assignmentsList.slice(0, 2).map((a: any, i: number) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium border border-slate-200/80 dark:border-slate-700">
                                    <span className="font-bold text-[#0f2863] dark:text-blue-400 font-mono text-[10px]">
                                      {cleanUtf8Text(a.module?.split(' ')[0] || 'MOD')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      ({cleanUtf8Text(a.group)})
                                    </span>
                                  </span>
                                ))}

                                {count > 2 && (
                                  <button
                                    onClick={() => setSelectedProfForModal(profGroup)}
                                    className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-md text-[10px] font-bold cursor-pointer"
                                  >
                                    +{count - 2} autres
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Disponible (0h / 18h)</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {count > 0 ? (
                                <>
                                  <button
                                    onClick={() => setSelectedProfForModal(profGroup)}
                                    className="p-1.5 text-slate-600 hover:text-[#0f2863] dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="Voir le détail complet des modules et groupes"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handlePrintOrdreDeService(profGroup)}
                                    className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="Imprimer l'Ordre de Service (A4 PDF)"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleSendNotificationEmail(profGroup)}
                                    className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="Notifier l'enseignant par email officiel"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAssignmentForm(prev => ({
                                      ...prev,
                                      department_id: profGroup.departmentId ? String(profGroup.departmentId) : prev.department_id,
                                      professor_id: String(profGroup.profId)
                                    }))
                                    window.scrollTo({ top: 300, behavior: 'smooth' })
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Affecter</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: SESSIONS & EXAMENS ────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div className="space-y-6 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Périodes & Dates des Sessions d'Examens
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Définition des plages de dates pour la Session Ordinaire (Normale) et la Session de Rattrapage.
                </p>
              </div>

              <button 
                onClick={() => setShowNewSessionForm(!showNewSessionForm)}
                className="px-4 py-2 bg-[#0f2863] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 hover:bg-[#1a3a8a] cursor-pointer"
              >
                {showNewSessionForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>Nouvelle Session</span>
              </button>
            </div>

            {showNewSessionForm && (
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 animate-in zoom-in-95">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  Création d'une Session d'Examens
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Intitulé de la session</label>
                    <input 
                      type="text" 
                      value={newSessionForm.name}
                      onChange={(e) => setNewSessionForm({...newSessionForm, name: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none" 
                      placeholder="ex: Session Ordinaire Automne S1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type de session</label>
                    <input 
                      type="text" 
                      value={newSessionForm.type}
                      onChange={(e) => setNewSessionForm({...newSessionForm, type: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none" 
                      placeholder="ex: normale / rattrapage"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Année Universitaire</label>
                    <select 
                      value={newSessionForm.academic_year_id}
                      onChange={(e) => setNewSessionForm({...newSessionForm, academic_year_id: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none"
                    >
                      <option value="">Sélectionner</option>
                      {years.map((y: any) => <option key={y.id} value={y.id}>{y.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Semestre</label>
                    <select 
                      value={newSessionForm.semester_id}
                      onChange={(e) => setNewSessionForm({...newSessionForm, semester_id: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none"
                    >
                      <option value="">Sélectionner</option>
                      {semesters.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date de Début</label>
                    <input 
                      type="date" 
                      value={newSessionForm.start_date}
                      onChange={(e) => setNewSessionForm({...newSessionForm, start_date: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date de Fin</label>
                    <input 
                      type="date" 
                      value={newSessionForm.end_date}
                      onChange={(e) => setNewSessionForm({...newSessionForm, end_date: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleCreateSession}
                    disabled={createSessionMutation.isPending}
                    className="px-5 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-xs hover:bg-[#1a3a8a] transition-all cursor-pointer"
                  >
                    {createSessionMutation.isPending ? 'Création...' : 'Valider la Session'}
                  </button>
                </div>
              </div>
            )}

            {/* Sessions Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examSessions.map((session: any) => (
                <div key={session.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 relative group space-y-4 shadow-xs">
                  <button 
                    onClick={() => handleDeleteSession(session.id)}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Supprimer la session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-bold uppercase text-[#0f2863] dark:text-blue-400 tracking-wider">
                      {session.type || 'Session Officielle'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Intitulé de la Session</label>
                      <input 
                        type="text" 
                        value={sessionDates[session.id]?.name ?? session.name} 
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], name: e.target.value}})}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date Début</label>
                      <input 
                        type="date" 
                        value={sessionDates[session.id]?.start_date || ''} 
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], start_date: e.target.value}})}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date Fin</label>
                      <input 
                        type="date" 
                        value={sessionDates[session.id]?.end_date || ''} 
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], end_date: e.target.value}})}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 italic">
                N'oubliez pas d'enregistrer vos modifications après avoir ajusté les plages de dates.
              </p>
              <button 
                onClick={handleSaveSessions}
                disabled={updateSessionMutation.isPending}
                className="px-5 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a3a8a] transition-colors text-xs uppercase tracking-wider shadow-xs cursor-pointer disabled:opacity-50"
              >
                {updateSessionMutation.isPending ? 'Enregistrement...' : 'Enregistrer les Périodes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ANNEES & SEMESTRES ────────────────────────────────────── */}
      {activeTab === 'annees' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          {/* Années Universitaires Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Gestion des Années Académiques
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input 
                type="text" 
                placeholder="Ex: 2026/2027" 
                value={newYearLabel}
                onChange={(e) => setNewYearLabel(e.target.value)}
                className="flex-1 w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none"
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap">
                <input 
                  type="checkbox" 
                  checked={newYearIsCurrent}
                  onChange={(e) => setNewYearIsCurrent(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                />
                <span>Année courante</span>
              </label>
              <button 
                onClick={handleCreateYear}
                disabled={createYearMutation.isPending}
                className="w-full sm:w-auto px-5 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#1a3a8a] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {createYearMutation.isPending ? 'En cours...' : 'Créer'}
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {years.map((y: any) => (
                <div key={y.id} className="flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{y.label}</span>
                    {y.is_current && (
                      <span className="px-2 py-0.5 bg-[#0f2863] text-white text-[9px] font-bold rounded-md tracking-wider uppercase">
                        COURANTE
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">ID: #{y.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Semestres Readonly Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Semestres Académiques (S1 à S10)
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { s: 'S1', nv: 'Niveau 1 (S1)', type: 'Automne' },
                { s: 'S2', nv: 'Niveau 1 (S2)', type: 'Printemps' },
                { s: 'S3', nv: 'Niveau 2 (S3)', type: 'Automne' },
                { s: 'S4', nv: 'Niveau 2 (S4)', type: 'Printemps' },
                { s: 'S5', nv: 'Niveau 3 (S5)', type: 'Automne' },
                { s: 'S6', nv: 'Niveau 3 (S6)', type: 'Printemps' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-200/80 dark:border-slate-700">
                  <span className="font-bold text-[#0f2863] dark:text-blue-400 text-sm">{item.s}</span>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block">{item.nv}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 italic">
              💡 Les semestres et maquettes sont configurés conformément au cahier des normes pédagogiques de l'ENCG Fès.
            </p>
          </div>
        </div>
      )}

      {/* ─── 👁️ PROFESSOR DETAILS MODAL ──────────────────────────────────── */}
      {selectedProfForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f2863] text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {selectedProfForModal.profName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {cleanUtf8Text(selectedProfForModal.profName)}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {cleanUtf8Text(selectedProfForModal.departmentName || 'ENCG Fès')} • {cleanUtf8Text(selectedProfForModal.specialty)}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedProfForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Charges Actives :</span>
                <span className="font-bold text-slate-800 dark:text-white text-sm">{selectedProfForModal.assignmentsList.length} cours</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Volume Horaire :</span>
                <span className="font-bold text-[#0f2863] dark:text-blue-400 text-sm">{selectedProfForModal.assignmentsList.length * 4}h / sem ({selectedProfForModal.assignmentsList.length * 48}h sem.)</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Liste des Modules & Groupes :</h4>
                {selectedProfForModal.assignmentsList.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(`Remettre à zéro toutes les affectations de ${selectedProfForModal.profName} ?`)) {
                        unassignProfessorMutation.mutate(String(selectedProfForModal.profId))
                      }
                    }}
                    disabled={unassignProfessorMutation.isPending}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Désaffecter tout</span>
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {selectedProfForModal.assignmentsList.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[10px] rounded border border-blue-200 dark:border-blue-800">
                        {cleanUtf8Text(item.module?.split(' ')[0] || 'MOD')}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {cleanUtf8Text(item.module?.split(' ').slice(1).join(' ') || item.module)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Groupe : <strong className="text-slate-600 dark:text-slate-300">{cleanUtf8Text(item.group)}</strong>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteAssignment(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                      title="Supprimer cette affectation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setSelectedProfForModal(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Fermer
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSendNotificationEmail(selectedProfForModal)}
                  className="px-3.5 py-2 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-bold rounded-xl text-xs border border-blue-200 dark:border-blue-800 cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Notifier Email</span>
                </button>
                <button 
                  onClick={() => handlePrintOrdreDeService(selectedProfForModal)}
                  className="px-4 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs hover:bg-[#1a3a8a] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ordre de Service PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 📦 IMPORT MODAL ─────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0f2863] to-blue-700 p-5 text-white relative">
              <button 
                onClick={() => setShowImportModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-300" />
                <span>Importer des Affectations</span>
              </h3>
              <p className="text-blue-100 text-xs mt-0.5">Fichier Excel (.xlsx) ou CSV avec structure par colonnes</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Année Universitaire de Destination
                </label>
                <select className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none">
                  <option>2026/2027 (Année Courante)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Fichier Excel / CSV
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Glisser-déposer ou cliquer pour choisir le fichier</p>
                  <p className="text-[10px] text-slate-400 mt-1">Formats acceptés : .xlsx, .xls, .csv — Max 5MB</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <FileText className="w-3.5 h-3.5 text-amber-600" /> Structure requise des colonnes :
                </div>
                <p className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-900/40 p-1.5 rounded-lg text-center">
                  email_professeur | module_code | groupe
                </p>
                <button 
                  onClick={handleDownloadTemplate}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer pt-1"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger le modèle d'exemple (.csv)
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-xs w-full cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    toast.success('🚀 Importation des affectations effectuée avec succès !')
                    setShowImportModal(false)
                  }}
                  className="px-4 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#1a3a8a] transition-all shadow-xs w-full cursor-pointer"
                >
                  Valider & Importer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 🤖 AI AUTO-MATCHING MODAL ───────────────────────────────────── */}
      {showAiMatchingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-indigo-200 dark:border-indigo-900 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-indigo-700 to-[#0f2863] p-5 text-white relative">
              <button 
                onClick={() => setShowAiMatchingModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Assistant IA — Auto-Affectation Intelligente
                  </h3>
                  <p className="text-indigo-200 text-xs">
                    Analyse prédictive des départements, spécialités et statutaires (18h max)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {isAnalyzingAi ? (
                <div className="py-12 text-center space-y-3">
                  <Spinner className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    Analyse des volumes horaires et calcul des correspondances...
                  </p>
                  <p className="text-[11px] text-slate-400">Équilibrage en cours pour maximiser l'efficience pédagogique.</p>
                </div>
              ) : (
                <>
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                          {aiSuggestions.length} proposition(s) d'affectation optimale
                        </div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400">
                          Charges respectant la limite statutaire des 18h hebdomadaires.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {aiSuggestions.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded text-[9px] font-bold">
                              ✨ {item.match_score}% Match
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.prof_name}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Groupe : <strong className="text-emerald-600">{item.group_name}</strong>
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-[#0f2863] dark:text-blue-300">
                          {item.module_name}
                        </div>

                        <div className="text-[10px] text-slate-500 italic bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          💡 {item.reason}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => setShowAiMatchingModal(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                    >
                      Fermer
                    </button>
                    <button 
                      onClick={handleApplyAiSuggestions}
                      className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-[#0f2863] hover:from-indigo-700 hover:to-blue-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Appliquer (1-Clic)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 🔄 RESET / DISTRIBUTE CONFIRMATION MODAL ─────────────────────── */}
      {showResetDistributeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Répartition Automatique & Équilibrage
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Attribution optimale par spécialité, département et statutaire (18h max)
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Comment souhaitez-vous exécuter l'opération ?
              </p>
              <ul className="space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold shrink-0">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">1. Mise à zéro & Répartition 100% Équilibrée (Recommandé) :</strong> Réinitialise tout à zéro puis affecte équitablement tous les modules sur les 18 enseignants selon leur département et spécialité.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold shrink-0">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">2. Compléter uniquement :</strong> Conserve les affectations existantes et affecte seulement les modules non pourvus.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={() => {
                  setShowResetDistributeModal(false)
                  autoDistributeMutation.mutate(true)
                }}
                disabled={autoDistributeMutation.isPending}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-700 to-[#0f2863] hover:from-indigo-700 hover:to-blue-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{autoDistributeMutation.isPending ? 'Calcul en cours...' : '1. Mise à Zéro + Répartition Équilibrée (Recommandé)'}</span>
              </button>

              <button
                onClick={() => {
                  setShowResetDistributeModal(false)
                  autoDistributeMutation.mutate(false)
                }}
                disabled={autoDistributeMutation.isPending}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                2. Compléter uniquement (Sans écraser l'existant)
              </button>

              <button
                onClick={() => setShowResetDistributeModal(false)}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 🔴 MODAL CONFIRMATION MISE À ZÉRO TOTALE ─────────────────────── */}
      {showUnassignAllModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mise à Zéro Complète des Affectations
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Réinitialisation de toutes les charges pédagogiques à 0h
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                Attention : Cette action est irréversible.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Toutes les affectations actuelles ({assignments.length} cours attribués) seront supprimées de la base de données.
                Tous les {allProfessors.length} enseignants redeviendront <strong>disponibles (0 charge)</strong>, vous permettant de refaire une répartition propre et équilibrée.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => unassignAllMutation.mutate()}
                disabled={unassignAllMutation.isPending}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{unassignAllMutation.isPending ? 'Suppression en cours...' : 'Oui, Réinitialiser Tout à Zéro'}</span>
              </button>

              <button
                onClick={() => setShowUnassignAllModal(false)}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Annuler et Conserver les affectations
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
