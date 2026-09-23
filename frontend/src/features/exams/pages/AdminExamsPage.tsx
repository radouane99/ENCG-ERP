import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  Loader2,
  Sliders,
  Sparkles,
  Clock,
  Layers,
  Zap,
  Archive,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  FileText,
  Mail,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Search,
  Building2,
  CheckSquare,
  BarChart3,
  ScanLine,
  DoorOpen,
  UserCheck,
  Edit3,
  X,
  Filter
} from 'lucide-react'

import { cn, cleanUtf8Text } from '@shared/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { academicApi } from '@shared/api/academic'
import { examsApi } from '@shared/api/exams'
import api from '@shared/lib/api'
import { openExamEmargementPdf, openExamDoorSignPdf } from '@shared/lib/documentAccess'
import { toast } from 'sonner'
import { CustomSelect, SelectOption } from '@shared/components/ui'

// Helper for date formatting in French
function parseExamDate(dateStr?: string) {
  if (!dateStr) return { day: '--', month: '---', weekday: '--', year: '----', fullDate: '--', isToday: false }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { day: '--', month: '---', weekday: '--', year: '----', fullDate: dateStr, isToday: false }

  const today = new Date()
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()

  const day = String(d.getDate()).padStart(2, '0')
  const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC']
  const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  return {
    day,
    month: months[d.getMonth()],
    weekday: weekdays[d.getDay()],
    year: d.getFullYear(),
    fullDate: `${day}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
    isToday
  }
}

// Helper for end time calculation
function getExamTimes(startTime?: string, durationMinutes: number = 120) {
  if (!startTime) return { start: '08:30', end: '10:30', duration: `${durationMinutes} min` }
  const [hStr, mStr] = startTime.split(':')
  const startMins = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0)
  const endMins = startMins + durationMinutes
  const endH = String(Math.floor(endMins / 60) % 24).padStart(2, '0')
  const endM = String(endMins % 60).padStart(2, '0')
  return {
    start: startTime.substring(0, 5),
    end: `${endH}:${endM}`,
    duration: `${durationMinutes} min`
  }
}

export default function AdminExamsPage() {
  const navigate = useNavigate()
  const { t: _t } = useTranslation('exams')
  const queryClient = useQueryClient()

  // Filter States
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<number | ''>('')
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('')
  const [selectedFiliereId, setSelectedFiliereId] = useState<number | ''>('')
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Loading States
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)
  const [isAssigningProctors, setIsAssigningProctors] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Custom planning modal state
  const [showCustomGenModal, setShowCustomGenModal] = useState(false)
  const [modulesPerDay, setModulesPerDay] = useState<number>(2)
  const [daySlotMode, setDaySlotMode] = useState<'matin' | 'pm' | 'split'>('matin')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [orderedModuleList, setOrderedModuleList] = useState<any[]>([])
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<number>>(new Set())
  const [moduleSearchQuery, setModuleSearchQuery] = useState('')

  // Queries
  const { data: filieres } = useQuery({
    queryKey: ['filieres'],
    queryFn: academicApi.getFilieres
  })

  const { data: exams, isLoading: isLoadingExams } = useQuery({
    queryKey: ['admin-exams', selectedFiliereId, selectedSessionId, selectedSemesterNum],
    queryFn: () => examsApi.getExams({
      filiere_id: selectedFiliereId,
      session_id: selectedSessionId,
      semester_number: selectedSemesterNum
    })
  })

  const { data: modules } = useQuery({
    queryKey: ['modules'],
    queryFn: academicApi.getModules
  })

  const { data: examSessions } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: async () => {
      const res = await api.get('/exam-sessions')
      return res.data.data
    }
  })

  const handleNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(msg)
    } else {
      toast.error(msg)
    }
  }

  // Filter options
  const filiereOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Toutes les filières académiques', badge: 'Global', icon: <Layers className="w-3.5 h-3.5 text-indigo-500" /> },
    ...(filieres?.map((f: any) => ({
      value: String(f.id),
      label: `${f.code ? f.code + ' — ' : ''}${cleanUtf8Text(f.name)}`,
      badge: f.code || 'FIL',
      icon: <Building2 className="w-3.5 h-3.5 text-indigo-500" />
    })) || [])
  ], [filieres])

  const sessionOptions: SelectOption[] = useMemo(() => [
    { value: '', label: "Toutes les sessions d'examen", badge: 'Global', icon: <Calendar className="w-3.5 h-3.5 text-amber-500" /> },
    ...(examSessions?.map((s: any) => ({
      value: String(s.id),
      label: `${cleanUtf8Text(s.name)} (${s.academic_year || '2026/2027'})`,
      badge: s.session_type || 'Session',
      icon: <Calendar className="w-3.5 h-3.5 text-amber-500" />
    })) || [])
  ], [examSessions])

  const semesterOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Tous Semestres (S1–S10)', badge: 'S1-S10', icon: <Clock className="w-3.5 h-3.5 text-emerald-500" /> },
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => ({
      value: String(s),
      label: `Semestre S${s}`,
      badge: `S${s}`,
      icon: <Clock className="w-3.5 h-3.5 text-emerald-500" />
    }))
  ], [])

  // Primary filtering
  const filteredExams = useMemo(() => {
    return (exams || []).filter((exam: any) => {
      if (selectedFiliereId && exam.module?.filiere_id && Number(exam.module.filiere_id) !== Number(selectedFiliereId)) {
        return false
      }
      if (selectedSessionId && exam.exam_session_id && Number(exam.exam_session_id) !== Number(selectedSessionId)) {
        return false
      }
      if (selectedSemesterNum) {
        const examSem = exam.module?.semester_number
          || (exam.module?.semester ? Number(String(exam.module.semester).replace(/\D/g, '')) : null)
        if (examSem && Number(examSem) !== Number(selectedSemesterNum)) {
          return false
        }
      }
      if (selectedDateFilter) {
        const examDateStr = exam.exam_date ? exam.exam_date.substring(0, 10) : ''
        if (examDateStr !== selectedDateFilter) {
          return false
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const title = (exam.module?.name || exam.module || '').toLowerCase()
        const room = (exam.room?.name || exam.room || '').toLowerCase()
        const group = (exam.group?.name || exam.group || '').toLowerCase()
        const surveillants = (exam.surveillants || '').toLowerCase()
        const filiereCode = (exam.module?.filiere?.code || '').toLowerCase()
        if (!title.includes(q) && !room.includes(q) && !group.includes(q) && !surveillants.includes(q) && !filiereCode.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [exams, selectedFiliereId, selectedSessionId, selectedSemesterNum, selectedDateFilter, searchQuery])

  // Available exam dates for dynamic day-by-day tabs
  const availableDates = useMemo(() => {
    const datesMap = new Map<string, number>()
    ;(exams || []).forEach((e: any) => {
      if (selectedFiliereId && e.module?.filiere_id && Number(e.module.filiere_id) !== Number(selectedFiliereId)) return
      if (selectedSessionId && e.exam_session_id && Number(e.exam_session_id) !== Number(selectedSessionId)) return
      if (selectedSemesterNum) {
        const sNum = e.module?.semester_number || (e.module?.semester ? Number(String(e.module.semester).replace(/\D/g, '')) : null)
        if (sNum && Number(sNum) !== Number(selectedSemesterNum)) return
      }

      if (e.exam_date) {
        const dStr = e.exam_date.substring(0, 10)
        datesMap.set(dStr, (datesMap.get(dStr) || 0) + 1)
      }
    })

    return Array.from(datesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, count]) => {
        const parsed = parseExamDate(dateStr)
        return {
          dateStr,
          count,
          label: `${parsed.weekday.substring(0, 3)} ${parsed.day} ${parsed.month}`
        }
      })
  }, [exams, selectedFiliereId, selectedSessionId, selectedSemesterNum])

  // Statistics calculation
  const totalExams = filteredExams.length
  const uniqueRooms = new Set(filteredExams.map((e: any) => e.room?.id || e.room_id || e.room).filter(Boolean)).size

  const uniqueStudentIds = useMemo(() => {
    const ids = new Set<number>()
    filteredExams.forEach((e: any) => {
      if (Array.isArray(e.student_ids) && e.student_ids.length > 0) {
        e.student_ids.forEach((id: number) => ids.add(id))
      }
    })
    return ids
  }, [filteredExams])

  const uniqueSentStudentIds = useMemo(() => {
    const ids = new Set<number>()
    filteredExams.forEach((e: any) => {
      if (Array.isArray(e.sent_student_ids) && e.sent_student_ids.length > 0) {
        e.sent_student_ids.forEach((id: number) => ids.add(id))
      }
    })
    return ids
  }, [filteredExams])

  const totalConvocations = useMemo(() => {
    if (uniqueStudentIds.size > 0) {
      return uniqueStudentIds.size
    }
    const maxInSingleExam = Math.max(0, ...filteredExams.map((e: any) => e.generated_count || 0))
    return maxInSingleExam > 0 ? maxInSingleExam : 0
  }, [uniqueStudentIds, filteredExams])

  const totalSent = useMemo(() => {
    if (uniqueSentStudentIds.size > 0) {
      return uniqueSentStudentIds.size
    }
    return 0
  }, [uniqueSentStudentIds])

  // Custom Generator Modal handlers
  const openCustomGenModal = () => {
    if (!selectedSessionId) {
      toast.error("Veuillez sélectionner une session d'examen d'abord dans les filtres.")
      return
    }

    const sessionObj = examSessions?.find((s: any) => s.id === Number(selectedSessionId))
    if (sessionObj?.start_date) {
      setCustomStartDate(sessionObj.start_date.substring(0, 10))
    } else {
      setCustomStartDate(new Date().toISOString().substring(0, 10))
    }

    const filtered = (modules || []).filter((m: any) => {
      if (selectedFiliereId && m.filiere_id !== Number(selectedFiliereId)) return false
      if (selectedSemesterNum && m.semester_number !== Number(selectedSemesterNum)) return false
      return true
    })

    setOrderedModuleList(filtered)
    setSelectedModuleIds(new Set(filtered.map((m: any) => m.id)))
    setShowCustomGenModal(true)
  }

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const newList = [...orderedModuleList]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newList.length) return
    const temp = newList[index]
    newList[index] = newList[targetIndex]
    newList[targetIndex] = temp
    setOrderedModuleList(newList)
  }

  const toggleModuleSelection = (id: number) => {
    const newSet = new Set(selectedModuleIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedModuleIds(newSet)
  }

  const toggleSelectAllModules = () => {
    if (selectedModuleIds.size === orderedModuleList.length) {
      setSelectedModuleIds(new Set())
    } else {
      setSelectedModuleIds(new Set(orderedModuleList.map(m => m.id)))
    }
  }

  const handleRunCustomAutoGenerate = async () => {
    if (selectedModuleIds.size === 0) {
      toast.error("Veuillez sélectionner au moins un module à planifier.")
      return
    }

    try {
      setIsAutoGenerating(true)
      const toastId = toast.loading("Génération du calendrier sur mesure ENCG Fès...")

      const orderedSelectedModules = orderedModuleList.filter(m => selectedModuleIds.has(m.id))
      const res = await api.post('/exam-planning/custom-generate', {
        filiere_id: selectedFiliereId ? Number(selectedFiliereId) : null,
        exam_session_id: Number(selectedSessionId),
        semester_number: selectedSemesterNum ? Number(selectedSemesterNum) : null,
        start_date: customStartDate,
        modules_per_day: modulesPerDay,
        day_slot_mode: daySlotMode,
        ordered_module_ids: orderedSelectedModules.map(m => m.id)
      })

      toast.dismiss(toastId)
      toast.success(res.data.message || `Planning sur-mesure généré avec succès (${res.data.created_count || 0} examens créés) !`)
      setShowCustomGenModal(false)
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] })
    } catch (err: any) {
      toast.dismiss()
      toast.error(err.response?.data?.message || "Erreur lors de la génération du planning sur-mesure.")
    } finally {
      setIsAutoGenerating(false)
    }
  }

  const handleAutoGenerateExams = async () => {
    if (!selectedSessionId) {
      toast.error("Veuillez sélectionner une session d'examen d'abord.")
      return
    }

    const isAllFilieres = !selectedFiliereId
    const filiereObj = filieres?.find((f: any) => f.id === Number(selectedFiliereId))
    const targetLabel = isAllFilieres ? "TOUTES les filières" : (filiereObj?.name || filiereObj?.code || "la filière")

    try {
      setIsAutoGenerating(true)
      const toastId = toast.loading(
        isAllFilieres
          ? "Calcul anti-chevauchement & génération automatique pour TOUTES les filières..."
          : `Calcul anti-chevauchement & génération automatique (${targetLabel})...`
      )
      const res = await api.post('/exam-planning/auto-generate', {
        filiere_id: selectedFiliereId ? Number(selectedFiliereId) : null,
        exam_session_id: Number(selectedSessionId),
        semester_number: selectedSemesterNum ? Number(selectedSemesterNum) : null
      })

      toast.dismiss(toastId)
      toast.success(res.data.message || `Planning généré avec succès ! ${res.data.created_count || 0} examens créés.`)
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] })
    } catch (err: any) {
      toast.dismiss()
      toast.error(err.response?.data?.message || "Erreur lors de la génération automatique.")
    } finally {
      setIsAutoGenerating(false)
    }
  }

  const handleAutoAssignProctors = async () => {
    if (!selectedSessionId) {
      toast.error("Veuillez sélectionner une session d'examen pour affecter les surveillants.")
      return
    }

    try {
      setIsAssigningProctors(true)
      const toastId = toast.loading("Affectation intelligente des surveillants (équité & charge)...")
      const res = await examsApi.autoAssignProctors(Number(selectedSessionId))
      toast.dismiss(toastId)
      toast.success(res.message || "Surveillants affectés avec succès sur l'ensemble de la session !")
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] })
    } catch (err: any) {
      toast.dismiss()
      toast.error(err.response?.data?.message || "Erreur lors de l'affectation automatique des surveillants.")
    } finally {
      setIsAssigningProctors(false)
    }
  }

  const handleResetExams = async () => {
    try {
      setIsResetting(true)
      const toastId = toast.loading("Réinitialisation du calendrier...", { id: 'exam-reset' })
      const res = await api.post('/exam-planning/reset', {
        filiere_id: selectedFiliereId ? Number(selectedFiliereId) : null,
        session_id: selectedSessionId ? Number(selectedSessionId) : null,
        exam_session_id: selectedSessionId ? Number(selectedSessionId) : null,
        semester_number: selectedSemesterNum ? Number(selectedSemesterNum) : null
      })

      toast.dismiss(toastId)
      toast.success(res.data.message || "Planning réinitialisé avec succès.", { id: 'exam-reset' })
      setShowResetConfirm(false)
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] })
    } catch (err: any) {
      toast.dismiss('exam-reset')
      toast.error(err.response?.data?.message || "Erreur lors de la réinitialisation.")
    } finally {
      setIsResetting(false)
    }
  }

  const hasActiveFilters = selectedFiliereId !== '' || selectedSessionId !== '' || selectedSemesterNum !== '' || selectedDateFilter !== '' || searchQuery !== ''

  const clearAllFilters = () => {
    setSelectedFiliereId('')
    setSelectedSessionId('')
    setSelectedSemesterNum('')
    setSelectedDateFilter('')
    setSearchQuery('')
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-7 font-sans pb-28">

      {/* 🌟 Luxury ENCG Institutional Hero Banner */}
      <div className="relative bg-gradient-to-r from-[#061126] via-[#0b1f4d] to-[#07132c] p-6 md:p-9 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 overflow-hidden">
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-blue-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Calendar className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-200 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Organisation & Planification des Sessions ENCG Fès
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" /> Anti-Chevauchement IA
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Gestion des Examens & Convocations
              </h1>
              <p className="text-blue-100/80 text-xs md:text-sm max-w-2xl font-medium mt-1">
                Planification des épreuves, répartition automatique des amphis, impression des bordereaux d'émargement et convocations QR certifiées.
              </p>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              to="/admin/exams/scan"
              className="px-4 py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-[#091838] font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-amber-400/30 shrink-0 cursor-pointer"
              title="Ouvrir le scanner de code QR pour valider les présences en salle"
            >
              <ScanLine className="w-4 h-4" />
              <span>Scanner QR Présences</span>
            </Link>

            <Link
              to="/admin/exams/pv-archive"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/20 shadow-sm cursor-pointer"
            >
              <Archive className="w-4 h-4 text-amber-300" />
              <span>Archives PVs</span>
            </Link>
          </div>
        </div>

        {/* 📊 Executive KPI Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-7 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3.5 rounded-2xl border border-white/15 shadow-sm transition-all hover:bg-white/15">
            <div className="flex items-center justify-between text-blue-200 text-xs font-bold mb-1">
              <span className="uppercase tracking-wider text-[10px]">Épreuves</span>
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white font-mono">{totalExams}</div>
            <div className="text-[10px] text-blue-200/80 font-medium mt-0.5">
              {filteredExams.length !== (exams || []).length ? `${filteredExams.length} filtrées sur ${(exams || []).length}` : 'Créneaux programmés'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3.5 rounded-2xl border border-white/15 shadow-sm transition-all hover:bg-white/15">
            <div className="flex items-center justify-between text-blue-200 text-xs font-bold mb-1">
              <span className="uppercase tracking-wider text-[10px]">Amphis & Salles</span>
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-amber-300 font-mono">{uniqueRooms}</div>
            <div className="text-[10px] text-blue-200/80 font-medium mt-0.5">
              Locaux mobilisés
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3.5 rounded-2xl border border-white/15 shadow-sm transition-all hover:bg-white/15">
            <div className="flex items-center justify-between text-blue-200 text-xs font-bold mb-1">
              <span className="uppercase tracking-wider text-[10px]">Étudiants Convoqués</span>
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-emerald-300 font-mono">{totalConvocations}</div>
            <div className="text-[10px] text-blue-200/80 font-medium mt-0.5">
              Étudiants uniques inscrits
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3.5 rounded-2xl border border-white/15 shadow-sm transition-all hover:bg-white/15">
            <div className="flex items-center justify-between text-blue-200 text-xs font-bold mb-1">
              <span className="uppercase tracking-wider text-[10px]">Diffusion Convocations</span>
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl md:text-3xl font-black text-cyan-300 font-mono">
                {totalConvocations > 0 ? Math.round((totalSent / totalConvocations) * 100) : 0}%
              </div>
              <span className="text-[10px] text-cyan-200 font-bold">({totalSent}/{totalConvocations})</span>
            </div>
            <div className="text-[10px] text-blue-200/80 font-medium mt-0.5">
              Transmises par e-mail
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Dedicated Control & Filter Center */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-7 rounded-[2.5rem] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
        
        {/* Row 1: Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
              FILIÈRE ACADÉMIQUE
            </label>
            <CustomSelect
              value={selectedFiliereId ? String(selectedFiliereId) : ''}
              onChange={(val) => setSelectedFiliereId(val ? Number(val) : '')}
              options={filiereOptions}
              placeholder="Toutes les filières"
              icon={<Layers className="w-4 h-4 text-indigo-500" />}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
              SESSION D'EXAMEN
            </label>
            <CustomSelect
              value={selectedSessionId ? String(selectedSessionId) : ''}
              onChange={(val) => setSelectedSessionId(val ? Number(val) : '')}
              options={sessionOptions}
              placeholder="Toutes les sessions d'examen"
              icon={<Calendar className="w-4 h-4 text-amber-500" />}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
              SEMESTRE
            </label>
            <CustomSelect
              value={selectedSemesterNum ? String(selectedSemesterNum) : ''}
              onChange={(val) => setSelectedSemesterNum(val ? Number(val) : '')}
              options={semesterOptions}
              placeholder="Tous Semestres (S1–S10)"
              icon={<Clock className="w-4 h-4 text-emerald-500" />}
              className="w-full"
            />
          </div>
        </div>

        {/* Dynamic Day-by-Day Date Tabs (When available) */}
        {availableDates.length > 1 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Filtrer par jour :
              </span>
              <button
                type="button"
                onClick={() => setSelectedDateFilter('')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  selectedDateFilter === ''
                    ? "bg-[#0f2863] text-white shadow-xs font-black"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                )}
              >
                Tous les jours <span className="text-[10px] opacity-75">({(exams || []).length})</span>
              </button>
              {availableDates.map(d => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDateFilter(selectedDateFilter === d.dateStr ? '' : d.dateStr)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                    selectedDateFilter === d.dateStr
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-black"
                      : "bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span>{d.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 dark:bg-slate-700 font-mono">
                    {d.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 2: Search Input + Actions & View Switcher */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par module, salle, surveillant, groupe..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons & Switcher */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Auto-Générer IA */}
            <button
              onClick={handleAutoGenerateExams}
              disabled={isAutoGenerating}
              className="px-4 py-2.5 bg-gradient-to-r from-[#0f2863] to-[#1e40af] hover:from-[#16357d] hover:to-[#2563eb] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 border border-indigo-400/20"
              title={selectedFiliereId ? "Générer automatiquement les examens de cette filière avec algorithme anti-chevauchement" : "Générer automatiquement les examens de TOUTES les filières en un seul clic"}
            >
              {isAutoGenerating ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : <Zap className="w-4 h-4 text-amber-300" />}
              <span>{selectedFiliereId ? "Auto-Générer IA" : "Auto-Générer Tout (IA)"}</span>
            </button>

            {/* Sur Mesure */}
            <button
              onClick={openCustomGenModal}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
              title="Configurer l'ordre des modules, date de début et créneaux (2 examens par jour)"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sur Mesure</span>
            </button>

            {/* Affecter Surveillants IA (if session selected) */}
            {selectedSessionId && (
              <button
                onClick={handleAutoAssignProctors}
                disabled={isAssigningProctors}
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all border border-emerald-200/80 dark:border-emerald-800 shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                title="Affecter automatiquement les professeurs surveillants avec équité de charge"
              >
                {isAssigningProctors ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                <span>Surveillants IA</span>
              </button>
            )}

            {/* Clear filters button if active */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="p-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Effacer tous les filtres"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Effacer filtres</span>
              </button>
            )}

            {/* Reset planning button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold rounded-2xl text-xs transition-all border border-rose-200 dark:border-rose-800 cursor-pointer active:scale-95"
              title="Réinitialiser le planning des examens"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            {/* View switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  viewMode === 'cards'
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <FileText className="w-3.5 h-3.5" /> Cartes
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  viewMode === 'table'
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Tableau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingExams ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Chargement de la planification des examens...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Calendar className="w-10 h-10" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Aucun examen programmé pour ces critères</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sélectionnez une filière et une session dans les filtres ci-dessus, puis lancez la génération automatique ou sur mesure pour bâtir le calendrier d'épreuves.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleAutoGenerateExams}
              className="px-5 py-2.5 bg-[#0f2863] hover:bg-[#1a387e] text-white text-xs font-black rounded-2xl shadow-md uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300" /> Lancer l'Auto-Générateur IA
            </button>
            <button
              onClick={openCustomGenModal}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-2xl uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
            >
              <Sliders className="w-4 h-4 text-indigo-500" /> Mode Sur Mesure
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Synoptic Table View */
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4 pl-6">Date & Horaire</th>
                  <th className="p-4">Module & Filière</th>
                  <th className="p-4">Groupe</th>
                  <th className="p-4">Salle / Amphi</th>
                  <th className="p-4">Surveillants</th>
                  <th className="p-4 text-center">Convocations</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredExams.map((exam: any) => {
                  const dateInfo = parseExamDate(exam.exam_date)
                  const times = getExamTimes(exam.start_time, exam.duration_minutes)

                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black",
                            dateInfo.isToday
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          )}>
                            {dateInfo.day}/{dateInfo.month}
                          </span>
                          <span>{times.start}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-slate-900 dark:text-white line-clamp-1">{cleanUtf8Text(exam.module?.name || exam.module)}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{exam.module?.filiere?.code || 'ENCG'} · Semestre S{exam.module?.semester_number || 1}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold">
                          {exam.group?.name || exam.group || 'Tous'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[#0f2863] dark:text-blue-300 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-amber-500" />
                          {cleanUtf8Text(exam.room?.name || exam.room || 'À affecter')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 font-medium">
                          {cleanUtf8Text(Array.isArray(exam.proctors) && exam.proctors.length > 0 ? exam.proctors.join(', ') : exam.surveillants || 'À affecter')}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {exam.sent_count || 0} / {exam.convocations_generated || exam.generated_count || 0}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              void openExamEmargementPdf(exam.id)
                            }}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95"
                            title="Feuille d'Émargement A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              void openExamDoorSignPdf(exam.id)
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
                            title="Affiche de Porte Salle"
                          >
                            <DoorOpen className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/admin/exams/${exam.id}/surveillance`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                          >
                            <ShieldCheck className="w-3 h-3 text-amber-400" /> Live
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Luxury Cards View */
        <div className="grid grid-cols-1 gap-5">
          {filteredExams.map((exam: any) => {
            const dateInfo = parseExamDate(exam.exam_date)
            const times = getExamTimes(exam.start_time, exam.duration_minutes)

            const proctorsText = Array.isArray(exam.proctors) && exam.proctors.length > 0
              ? exam.proctors.join(', ')
              : (typeof exam.surveillants === 'string' && !exam.surveillants.toLowerCase().includes('inconnu') && exam.surveillants.trim() !== 'Aucun' ? exam.surveillants : 'À affecter')

            return (
              <ExamCard
                key={exam.id}
                id={exam.id}
                title={cleanUtf8Text(typeof exam.module === 'object' ? (exam.module?.name || '—') : (exam.module || '—'))}
                group={typeof exam.group === 'object' ? (exam.group?.name || '—') : (exam.group || '—')}
                filiereCode={
                  exam.module?.filiere?.code ||
                  exam.group?.filiere?.code ||
                  (typeof exam.group === 'string' ? exam.group.split('-')[0] : exam.group?.name?.split('-')[0]) ||
                  'ENCG'
                }
                semester={exam.module?.semester_number || 1}
                time={`${times.start} – ${times.end}`}
                duration={times.duration}
                room={cleanUtf8Text(typeof exam.room === 'object' ? (exam.room?.name || '—') : (exam.room || '—'))}
                surveillants={proctorsText}
                day={dateInfo.day}
                month={dateInfo.month}
                dayName={dateInfo.weekday}
                isToday={dateInfo.isToday}
                type={exam.type || 'EXAMEN FINAL'}
                generated={exam.convocations_generated ?? exam.generated_count ?? 0}
                sent={exam.sent_count ?? 0}
                onNotify={handleNotify}
              />
            )
          })}
        </div>
      )}

      {/* ⚙️ Modal Custom Planning 2 Exams / Day */}
      {showCustomGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-[#061126] via-[#0f2863] to-[#07132c] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <Sliders className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Génération Sur Mesure (Rythme 2 Ex/Jour)</h3>
                  <p className="text-xs text-blue-200">Configuration fine du cadencement des épreuves</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomGenModal(false)}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    NOMBRE D'EXAMENS / JOUR
                  </label>
                  <CustomSelect
                    value={String(modulesPerDay)}
                    onChange={(val) => setModulesPerDay(Number(val))}
                    options={[
                      { value: '1', label: '1 Examen / Jour (Allégé)', badge: '1 Ex/J', icon: <Calendar className="w-3.5 h-3.5 text-blue-500" /> },
                      { value: '2', label: '2 Examens / Jour (Standard ENCG Fès)', badge: 'Recommandé', icon: <Zap className="w-3.5 h-3.5 text-amber-500" /> },
                      { value: '3', label: '3 Examens / Jour (Intensif)', badge: 'Intensif', icon: <Clock className="w-3.5 h-3.5 text-rose-500" /> },
                    ]}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    DATE DE DÉBUT DES ÉPREUVES
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Créneaux horaires par défaut</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'matin', label: 'Matinée (08:30 & 10:30)' },
                    { id: 'pm', label: 'Après-midi (14:30 & 16:30)' },
                    { id: 'split', label: 'Matin & Soir (08:30 / 14:30)' }
                  ].map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setDaySlotMode(slot.id as any)}
                      className={cn(
                        "p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        daySlotMode === slot.id
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs font-black"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Ordre & Sélection des Modules ({selectedModuleIds.size}/{orderedModuleList.length})
                    </label>
                    <button
                      type="button"
                      onClick={toggleSelectAllModules}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      {selectedModuleIds.size === orderedModuleList.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Utiliser les flèches pour ordonner</span>
                </div>

                {/* Module search in modal */}
                {orderedModuleList.length > 5 && (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={moduleSearchQuery}
                      onChange={(e) => setModuleSearchQuery(e.target.value)}
                      placeholder="Filtrer les modules..."
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                    />
                  </div>
                )}

                <div className="max-h-56 overflow-y-auto space-y-2 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40">
                  {orderedModuleList
                    .filter(mod => !moduleSearchQuery || (mod.name || '').toLowerCase().includes(moduleSearchQuery.toLowerCase()))
                    .map((mod, idx) => (
                      <div key={mod.id} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedModuleIds.has(mod.id)}
                            onChange={() => toggleModuleSelection(mod.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{cleanUtf8Text(mod.name)}</span>
                          {(mod.filiere?.code || filieres?.find((f: any) => f.id === mod.filiere_id)?.code) && (
                            <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded uppercase shrink-0">
                              {mod.filiere?.code || filieres?.find((f: any) => f.id === mod.filiere_id)?.code}
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded shrink-0">
                            S{mod.semester_number || 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveModule(idx, 'up')}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                            title="Monter"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === orderedModuleList.length - 1}
                            onClick={() => handleMoveModule(idx, 'down')}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                            title="Descendre"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-500">
                {selectedModuleIds.size} module(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomGenModal(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isAutoGenerating || selectedModuleIds.size === 0}
                  onClick={handleRunCustomAutoGenerate}
                  className="px-5 py-2 bg-[#0f2863] hover:bg-[#1a387e] text-white text-xs font-black rounded-xl uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                >
                  {isAutoGenerating ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : <Zap className="w-4 h-4 text-amber-400" />}
                  Lancer la Planification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Réinitialiser le Planning des Examens ?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cette action supprimera tous les examens planifiés, les attributions de salles et les surveillances pour les filtres sélectionnés (Session / Filière). Cette action est irréversible.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetExams}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 📇 Redesigned Premium ExamCard Component
function ExamCard({
  id,
  title,
  group,
  filiereCode,
  semester,
  time,
  duration,
  room,
  surveillants,
  day,
  month,
  dayName,
  isToday,
  type,
  generated,
  sent,
  onNotify
}: {
  id: number
  title: string
  group: string
  filiereCode: string
  semester: number
  time: string
  duration: string
  room: string
  surveillants: string
  day: string
  month: string
  dayName: string
  isToday: boolean
  type: string
  generated: number
  sent: number
  onNotify: (msg: string, type?: 'success' | 'error') => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)

  const cleanTitle = cleanUtf8Text(title)
  const cleanRoom = cleanUtf8Text(room)

  const generateMutation = useMutation({
    mutationFn: (examId: number) => examsApi.generateConvocations(examId),
    onSuccess: (data) => {
      onNotify(data.message || `Convocations générées avec succès pour l'examen ${id}.`)
      setIsGenerating(false)
    },
    onError: (error: any) => {
      onNotify(error.response?.data?.message || `Erreur lors de la génération pour l'examen ${id}.`, 'error')
      setIsGenerating(false)
    }
  })

  const sendMutation = useMutation({
    mutationFn: (examId: number) => examsApi.sendConvocations(examId),
    onSuccess: (data) => {
      onNotify(data.message || `Emails envoyés avec succès pour l'examen ${id}.`)
    },
    onError: (error: any) => {
      onNotify(error.response?.data?.message || `Erreur lors de l'envoi pour l'examen ${id}.`, 'error')
    }
  })

  const notifyAbsentsMutation = useMutation({
    mutationFn: (examId: number) => examsApi.notifyAbsents(examId),
    onSuccess: (data) => {
      onNotify(data.message || `Absents notifiés avec succès.`)
    },
    onError: (error: any) => {
      onNotify(error.response?.data?.message || `Erreur lors de la notification.`, 'error')
    }
  })

  const handleGenerateClick = () => {
    setIsGenerating(true)
    generateMutation.mutate(id)
  }

  const handleExportEmargementPdf = () => {
    toast.loading(`Génération de la Liste d'Émargement A4...`)
    void openExamEmargementPdf(id)
      .then(() => {
        toast.dismiss()
        toast.success(`📜 Feuille d'Émargement A4 générée pour ${cleanTitle} !`)
      })
      .catch(() => {
        toast.dismiss()
        toast.error(`Impossible de générer la feuille d'émargement.`)
      })
  }

  const handleExportDoorSignPdf = () => {
    toast.loading(`Génération de l'Affiche de Porte A4/A3...`)
    void openExamDoorSignPdf(id)
      .then(() => {
        toast.dismiss()
        toast.success(`🚪 Affiche de Porte générée pour ${cleanTitle} !`)
      })
      .catch(() => {
        toast.dismiss()
        toast.error(`Impossible de générer l'affiche de porte.`)
      })
  }

  const percentSent = generated > 0 ? Math.min(100, Math.round((sent / generated) * 100)) : 0
  const isRetake = type?.toLowerCase().includes('rattrapage')
  const hasSurveillants = surveillants && surveillants !== 'À affecter' && !surveillants.toLowerCase().includes('inconnu') && surveillants.trim() !== 'Aucun'

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col xl:flex-row hover:border-indigo-300 dark:hover:border-indigo-700/60">
      
      {/* 📅 Left Date Ribbon Badge */}
      <div className={cn(
        "w-full xl:w-44 text-white flex flex-col items-center justify-center p-6 shrink-0 border-b xl:border-b-0 xl:border-r border-blue-900/30 relative overflow-hidden",
        isToday
          ? "bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a]"
          : "bg-gradient-to-br from-[#061126] via-[#0f2863] to-[#081530]"
      )}>
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

        {isToday && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-400 text-[#091838]">
            Aujourd'hui
          </span>
        )}

        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-0.5">
          {month}
        </span>
        <span className="text-4xl xl:text-5xl font-black tracking-tight mb-0.5 font-mono text-white">
          {day}
        </span>
        <span className="text-xs font-bold text-blue-200 mb-3 capitalize">
          {dayName}
        </span>

        {/* Exam type pill */}
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-2xs text-center",
          isRetake
            ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
            : "bg-white/15 text-blue-100 border-white/20"
        )}>
          {type}
        </span>
      </div>

      {/* 📄 Middle Details Body */}
      <div className="p-6 md:p-7 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Top badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {filiereCode && filiereCode !== '—' ? `${filiereCode} · ` : ''}S{semester}
            </span>

            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700 shadow-2xs">
              Groupe : {group}
            </span>

            {generated > 0 && (
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-emerald-500" />
                {generated} Inscrits
              </span>
            )}
          </div>

          {/* Module Title */}
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {cleanTitle}
          </h2>

          {/* Time & Room Meta */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{time}</span>
              <span className="text-slate-400 font-normal">({duration})</span>
            </div>

            <div className="inline-flex items-center gap-2 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 px-3.5 py-2 rounded-2xl border border-amber-200/90 dark:border-amber-800/80 text-xs font-black shadow-2xs">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Salle / Amphi : {cleanRoom}</span>
            </div>
          </div>
        </div>

        {/* Proctors Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Surveillants :
          </span>
          {hasSurveillants ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                {surveillants}
              </span>
            </div>
          ) : (
            <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              ⏳ À affecter par l'administration
            </span>
          )}
        </div>

        {/* Convocations Progress Tracker */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span className="text-slate-800 dark:text-slate-200 font-extrabold">{generated} convocations</span>
              <span className="text-slate-400 font-normal">({sent} transmises)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                percentSent === 100
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                  : percentSent > 0
                  ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}>
                {percentSent}% Envoyées
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                percentSent === 100
                  ? "bg-emerald-500"
                  : percentSent > 0
                  ? "bg-indigo-600"
                  : "bg-slate-400"
              )}
              style={{ width: `${percentSent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 🛠️ Right Action Suite */}
      <div className="bg-slate-50/90 dark:bg-slate-800/50 p-6 flex flex-col gap-2.5 w-full xl:w-72 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 justify-center">
        {/* Primary CTA: Hub Surveillance Live */}
        <Link
          to={`/admin/exams/${id}/surveillance`}
          className="w-full bg-gradient-to-r from-[#0f2863] to-[#1e40af] hover:from-[#16357d] hover:to-[#2563eb] text-white py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95 text-center group border border-indigo-400/20"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Hub Surveillance Live</span>
        </Link>

        {/* Official Documents Pair (A4) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportEmargementPdf}
            className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Télécharger la feuille d'émargement officielle pour l'examen"
          >
            <Printer className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Émargement</span>
          </button>

          <button
            onClick={handleExportDoorSignPdf}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Affiche de porte A4/A3 de la salle d'examen"
          >
            <DoorOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Affiche Porte</span>
          </button>
        </div>

        {/* Convocations Actions */}
        {generated === 0 ? (
          <button
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-indigo-500" />}
            <span>Générer Convocations</span>
          </button>
        ) : (
          <button
            onClick={() => sendMutation.mutate(id)}
            disabled={sendMutation.isPending}
            className="w-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
          >
            {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 text-emerald-600" />}
            <span>Envoyer Convocations</span>
          </button>
        )}

        {/* Quick Footer Links */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          <Link
            to={`/admin/exams/${id}/edit`}
            className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            <span>Modifier</span>
          </Link>

          <button
            onClick={() => notifyAbsentsMutation.mutate(id)}
            disabled={notifyAbsentsMutation.isPending}
            className="text-rose-600 hover:text-rose-700 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            {notifyAbsentsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
            <span>Notifier Absents</span>
          </button>
        </div>
      </div>
    </div>
  )
}
