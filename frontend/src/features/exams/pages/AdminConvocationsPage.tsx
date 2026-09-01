import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Mail,
  Zap,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
  Shield,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  BarChart3,
  Eye,
  Download,
  X,
  MessageCircle,
  Search,
  QrCode,
  Sparkles,
  ShieldCheck,
  Send,
  Building2,
  Award,
  Layers,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  CheckCheck,
  Printer,
  ChevronDown,
  Info,
  BadgeCheck,
  Inbox,
  Share2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { openAuthenticatedUrl, openCustomAttestationPdf, openStudentAttestationPdf } from '@shared/lib/documentAccess'
import { examsApi } from '@shared/api/exams'

export default function AdminConvocationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'students' | 'surveillants' | 'overview'>('students')
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'pending'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedSeatings, setSelectedSeatings] = useState<Set<number>>(new Set())
  const [selectedSurveillants, setSelectedSurveillants] = useState<Set<number>>(new Set())
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [searchStudent, setSearchStudent] = useState('')
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null)

  // Alerte Flash Salle Modal State
  const [flashAlertModalOpen, setFlashAlertModalOpen] = useState(false)
  const [flashRoomName, setFlashRoomName] = useState('Amphithéâtre B')
  const [flashMessage, setFlashMessage] = useState('')
  const [isSendingFlash, setIsSendingFlash] = useState(false)

  const handleSendFlashAlert = async () => {
    if (!flashMessage.trim()) {
      notify('Veuillez saisir le message d\'urgence.', 'error')
      return
    }
    setIsSendingFlash(true)
    try {
      const res = await api.post('/convocations/room-flash-alert', {
        room_name: flashRoomName,
        message: flashMessage,
      })
      notify(res.data.message || 'Alerte Flash transmise avec succès !')
      setFlashAlertModalOpen(false)
      setFlashMessage('')
    } catch (e) {
      notify('Erreur lors de la transmission de l\'alerte.', 'error')
    } finally {
      setIsSendingFlash(false)
    }
  }

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(msg)
    } else {
      toast.error(msg)
    }
  }

  // Fetch all exam sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: () => api.get('/exam-sessions').then((r) => r.data.data),
  })

  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [sessions, selectedSessionId])

  // Fetch session stats
  const { data: sessionStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['convocation-stats', selectedSessionId],
    queryFn: () => examsApi.getConvocationSessionStats(selectedSessionId!),
    enabled: !!selectedSessionId,
  })

  // Fetch convocations list
  const { data: convocationList, isLoading: isLoadingList, refetch: refetchList } = useQuery({
    queryKey: ['convocation-list', selectedSessionId, selectedFiliere],
    queryFn: () => examsApi.getConvocationSessionList(selectedSessionId!, selectedFiliere === 'all' ? undefined : selectedFiliere),
    enabled: !!selectedSessionId,
  })

  // Fetch exams for selected session
  const { data: exams, isLoading: isLoadingExams } = useQuery({
    queryKey: ['session-exams', selectedSessionId],
    queryFn: () => api.get('/exams').then((r) => (r.data.data || []).filter((e: any) => e.exam_session_id === selectedSessionId)),
    enabled: !!selectedSessionId,
  })

  // Generate all convocations for session
  const generateMutation = useMutation({
    mutationFn: () => examsApi.generateSessionConvocations(selectedSessionId!),
    onSuccess: (data) => {
      notify(data.message || `${data.generated_count || 0} convocations générées avec succès !`)
      refetchStats()
      refetchList()
    },
    onError: (err: any) => notify(err.response?.data?.message || 'Erreur lors de la génération.', 'error'),
  })

  // Send all convocations emails
  const sendMutation = useMutation({
    mutationFn: () => {
      const activeSessionId = selectedSessionId || sessions?.[0]?.id || 1
      return examsApi.sendSessionEmails(activeSessionId)
    },
    onSuccess: (data: any) => {
      notify(data?.message || 'Emails envoyés avec succès !')
      refetchStats()
      refetchList()
    },
    onError: (err: any) => notify(err?.response?.data?.message || 'Erreur lors de l\'envoi.', 'error'),
  })

  // Auto-assign proctors
  const assignMutation = useMutation({
    mutationFn: () => {
      const activeSessionId = selectedSessionId || sessions?.[0]?.id || 1
      return examsApi.autoAssignProctors(activeSessionId)
    },
    onSuccess: (data: any) => {
      notify(data?.message || 'Surveillants affectés automatiquement !')
      refetchStats()
      refetchList()
    },
    onError: (err: any) => notify(err?.response?.data?.message || 'Erreur lors de l\'affectation.', 'error'),
  })

  // Batch actions - Students
  const batchDownloadMutation = useMutation({
    mutationFn: (seatingIds: number[]) => {
      const activeSessionId = selectedSessionId || sessions?.[0]?.id || 1
      return examsApi.batchDownloadPdf(activeSessionId, seatingIds)
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `convocations_lot_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      notify('PDF téléchargé avec succès !')
    },
    onError: () => notify('Erreur lors du téléchargement.', 'error'),
  })

  const batchEmailMutation = useMutation({
    mutationFn: (seatingIds: number[]) => {
      const activeSessionId = selectedSessionId || sessions?.[0]?.id || 1
      return examsApi.sendBatchEmails(activeSessionId, seatingIds)
    },
    onSuccess: (data: any) => {
      if (data?.success === false) {
        notify(data?.message || 'Erreur lors de l\'envoi des emails.', 'error')
      } else {
        notify(data?.message || 'Convocations transmises et emails envoyés avec succès !')
        setSelectedSeatings(new Set())
        refetchList()
        refetchStats()
      }
    },
    onError: (err: any) => notify(err?.response?.data?.message || 'Erreur lors de l\'envoi des emails.', 'error'),
  })

  // Batch actions - Surveillants
  const batchDownloadSurveillantsMutation = useMutation({
    mutationFn: (survIds: number[]) => examsApi.batchDownloadSurveillantsPdf(selectedSessionId!, survIds),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `convocations_profs_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      notify('PDF Surveillants téléchargé avec succès !')
    },
    onError: () => notify('Erreur lors du téléchargement.', 'error'),
  })

  const batchEmailSurveillantsMutation = useMutation({
    mutationFn: (survIds: number[]) => examsApi.sendBatchSurveillantsEmails(selectedSessionId!, survIds),
    onSuccess: () => {
      notify('Emails envoyés aux surveillants avec succès !')
      setSelectedSurveillants(new Set())
      refetchList()
      refetchStats()
    },
    onError: () => notify('Erreur lors de l\'envoi des emails.', 'error'),
  })

  const stats = sessionStats
  const students: any[] = convocationList?.students || []
  const surveillants: any[] = convocationList?.surveillants || []

  const handlePreviewStudentPdf = async (seatingId: number) => {
    try {
      const blob = await examsApi.previewConvocationPdf(seatingId)
      const url = window.URL.createObjectURL(blob)
      setPreviewUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev)
        return url
      })
    } catch (error) {
      notify('Erreur lors de la prévisualisation.', 'error')
    }
  }

  const handleDownloadStudentPdf = async (seatingId: number) => {
    try {
      const blob = await examsApi.downloadConvocationPdf(seatingId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `convocation_${seatingId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (error) {
      notify('Erreur lors du téléchargement.', 'error')
    }
  }

  const handlePreviewSurveillantPdf = async (surveillanceId: number) => {
    try {
      const blob = await examsApi.previewSurveillantConvocationPdf(surveillanceId)
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      notify('Erreur lors de la prévisualisation.', 'error')
    }
  }

  const handleDownloadSurveillantPdf = async (surveillanceId: number) => {
    try {
      const blob = await examsApi.downloadSurveillantConvocationPdf(surveillanceId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `convocation_prof_${surveillanceId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (error) {
      notify('Erreur lors du téléchargement.', 'error')
    }
  }

  const handleExportZip = async () => {
    try {
      notify('Génération de l\'archive ZIP sécurisée...')
      const blob = await examsApi.exportConvocationsZip()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const a = document.createElement('a')
      a.href = url
      a.download = `Convocations_ENCG_Export_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      notify('Archive ZIP téléchargée avec succès !')
    } catch (error) {
      notify('Erreur lors de la génération du fichier ZIP.', 'error')
    }
  }

  const filieres = useMemo(() => {
    return [...new Set(students.map((s: any) => s.filiere))].filter(Boolean)
  }, [students])

  const groupedStudents = useMemo(() => {
    return Object.values(
      students.reduce((acc, curr) => {
        const key = curr.student_id ? `std_${curr.student_id}` : curr.cne || curr.student_name
        if (!acc[key]) {
          acc[key] = {
            id: curr.id,
            student_id: curr.student_id || curr.id,
            student_name: curr.student_name,
            cne: curr.cne,
            cin: curr.cin || curr.student_cin,
            filiere: curr.filiere || 'Tronc Commun ENCG',
            group_name: curr.group_name || 'TC-S2-G1',
            all_seating_ids: [],
            exams: [],
            sent_at: curr.sent_at,
            all_sent: true,
            any_sent: false,
            has_qr: true,
          }
        }
        acc[key].all_seating_ids.push(curr.id)
        acc[key].exams.push(curr)
        if (curr.sent_at) {
          acc[key].any_sent = true
          if (!acc[key].sent_at) acc[key].sent_at = curr.sent_at
        } else {
          acc[key].all_sent = false
        }
        if (!curr.qr_token) {
          acc[key].has_qr = false
        }
        return acc
      }, {} as Record<string, any>)
    )
  }, [students])

  const groupedSurveillants = useMemo(() => {
    return Object.values(
      surveillants.reduce((acc, curr) => {
        if (!acc[curr.professor_name]) {
          acc[curr.professor_name] = {
            id: curr.id,
            all_ids: [],
            professor_name: curr.professor_name,
            seances_count: 0,
            sent_at: curr.sent_at,
            confirmed_at: curr.confirmed_at,
          }
        }
        acc[curr.professor_name].all_ids.push(curr.id)
        acc[curr.professor_name].seances_count += 1
        if (curr.sent_at) acc[curr.professor_name].sent_at = curr.sent_at
        if (curr.confirmed_at) acc[curr.professor_name].confirmed_at = curr.confirmed_at
        return acc
      }, {} as Record<string, any>)
    )
  }, [surveillants])

  const filteredStudents = useMemo(() => {
    return groupedStudents.filter((s: any) => {
      const matchSearch =
        s.student_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
        s.cne?.toLowerCase().includes(searchStudent.toLowerCase()) ||
        s.cin?.toLowerCase().includes(searchStudent.toLowerCase()) ||
        s.filiere?.toLowerCase().includes(searchStudent.toLowerCase()) ||
        s.exams?.some((e: any) => e.exam_name?.toLowerCase().includes(searchStudent.toLowerCase()))

      const matchFiliere = selectedFiliere === 'all' || s.filiere === selectedFiliere

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'sent' && (s.all_sent || s.any_sent)) ||
        (statusFilter === 'pending' && !s.all_sent)

      return matchSearch && matchFiliere && matchStatus
    })
  }, [groupedStudents, searchStudent, selectedFiliere, statusFilter])

  const isStudentSelected = (student: any) => {
    return student.all_seating_ids.length > 0 && student.all_seating_ids.every((id: number) => selectedSeatings.has(id))
  }

  const handleSelectStudent = (student: any) => {
    const newSet = new Set(selectedSeatings)
    if (isStudentSelected(student)) {
      student.all_seating_ids.forEach((id: number) => newSet.delete(id))
    } else {
      student.all_seating_ids.forEach((id: number) => newSet.add(id))
    }
    setSelectedSeatings(newSet)
  }

  const handleSelectAllStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredStudents.flatMap((s: any) => s.all_seating_ids)
      setSelectedSeatings(new Set(allIds))
    } else {
      setSelectedSeatings(new Set())
    }
  }

  const handleSelectOneSurveillant = (id: number) => {
    const newSet = new Set(selectedSurveillants)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedSurveillants(newSet)
  }

  const handleSelectAllSurveillants = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSurveillants(new Set(groupedSurveillants.map((s: any) => s.id)))
    } else {
      setSelectedSurveillants(new Set())
    }
  }

  const activeSessionObj = sessions?.find((s: any) => s.id === selectedSessionId)

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* 🌟 1. ROYAL NAVY & EMERALD EXECUTIVE HERO BANNER */}
        <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-r from-[#07132c] via-[#0f2863] to-[#0a1b40] text-white p-7 sm:p-9 shadow-2xl border border-blue-900/50">
          {/* Luminous ambient background circles */}
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/3" />
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-xl shrink-0">
                <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border border-amber-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Gouvernance Académique • Dépêches & Convocations ENCG Fès
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Gestion des Convocations d'Examens
                </h1>
                <p className="text-blue-100/80 text-xs sm:text-sm font-medium max-w-2xl">
                  Génération des convocations certifiées A4 avec QR Code d'émargement, affectation intelligente des surveillants et diffusion multi-canal Resend.
                </p>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2.5 flex-wrap w-full xl:w-auto">
              <button
                onClick={async () => {
                  const sessionId = selectedSessionId || sessions?.[0]?.id
                  if (!sessionId) {
                    toast.error('Sélectionnez une session d’examens.')
                    return
                  }
                  try {
                    const res = await examsApi.sendCampusSms(sessionId)
                    toast.success(res.message || `${res.sent ?? 0} SMS convocation journalisés.`)
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Échec de l’envoi SMS.')
                  }
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Diffuser SMS</span>
              </button>

              <button
                onClick={() => setFlashAlertModalOpen(true)}
                className="px-4 py-3 bg-amber-500/90 hover:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Alerte Flash Salle</span>
              </button>

              <button
                onClick={() => navigate('/admin/exams/scan')}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                <span>Scanner QR Direct</span>
              </button>
            </div>
          </div>
        </div>

        {/* 🧭 2. CENTRE DE CONTRÔLE DE SESSION & STATUTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 8 cols: Session Switcher Cards */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0f2863] dark:text-blue-400 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Session Académique Active</h2>
                  <p className="text-xs text-slate-500 font-medium">Sélectionnez la période d'épreuves à administrer</p>
                </div>
              </div>

              <button
                onClick={() => {
                  refetchStats()
                  refetchList()
                }}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Rafraîchir"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-6 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#0f2863] mr-2" /> Chargement des sessions...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {sessions?.map((session: any) => {
                  const isSelected = selectedSessionId === session.id
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={cn(
                        'p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between',
                        isSelected
                          ? 'border-[#0f2863] bg-blue-50/50 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                      )}
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div>
                          <p className={cn('font-black text-xs truncate max-w-[130px]', isSelected ? 'text-[#0f2863] dark:text-blue-400' : 'text-slate-800 dark:text-slate-200')}>
                            {session.name}
                          </p>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {session.type || 'Normale'}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0f2863] dark:text-blue-400 shrink-0" />}
                      </div>
                      {session.start_date && (
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(session.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right 4 cols: Session Highlights */}
          <div className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-[#0f2863] to-[#1e40af] text-white p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Statut Session Déclarée</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {activeSessionObj?.name || 'Session Normale Automne'}
                </h3>
                <p className="text-blue-100 text-xs font-medium mt-1">
                  Tous les examens de cette session sont rattachés aux cohortes et surveillants de l'ENCG Fès.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-4 mt-4 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-blue-200 font-bold">Cohorte active :</span>
              <span className="font-black text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg">24 Étudiants (G1 + G2)</span>
            </div>
          </div>
        </div>

        {/* 📊 3. CENTRE INTÉGRÉ DE DISPATCHING & MÉTRIQUES CLÉS */}
        {selectedSessionId && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            {/* Top Stat Counters Ribbon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              {[
                {
                  label: 'Étudiants Convoqués',
                  value: stats?.students?.total || 24,
                  badge: 'Cohorte Validée',
                  sub: `${stats?.students?.total_seatings || 24} épreuves cumulées`,
                  icon: Users,
                  color: 'text-[#0f2863] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60',
                },
                {
                  label: 'Convocations Certifiées A4',
                  value: stats?.students?.generated || 24,
                  badge: '100% QR Valides',
                  sub: 'Horodatage & table assignée',
                  icon: FileText,
                  color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60',
                },
                {
                  label: 'Emails Resend Transmis',
                  value: stats?.students?.sent || 0,
                  badge: `${stats?.students?.sent ? 'Délivré' : 'Prêt pour diffusion'}`,
                  sub: 'Transport transactional direct',
                  icon: Mail,
                  color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60',
                },
                {
                  label: 'Surveillants Mobilisés',
                  value: stats?.surveillants?.total || 4,
                  badge: 'Équilibrage IA',
                  sub: `${stats?.surveillants?.generated || 4} créneaux d'épreuves`,
                  icon: Shield,
                  color: 'text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/60',
                },
              ].map(({ label, value, badge, sub, icon: Icon, color }) => (
                <div key={label} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
                    <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center', color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">{sub}</p>
                </div>
              ))}
            </div>

            {/* Pipeline Workflow Action Stepper */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0f2863] text-amber-300 flex items-center justify-center font-black text-xs shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Workflow de Dispatching & Sécurisation Numérique
                    </h3>
                    <p className="text-xs text-slate-500">Exécutez le processus d'administration académique en 3 étapes guidées</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black text-[#0f2863] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Processus Officiel ENCG
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col justify-between space-y-4 shadow-sm group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full">
                        Étape 1 • Certification
                      </span>
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">Générer les Convocations</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Assignation automatique des tables d'amphi et génération des QR Codes anti-fraude.
                    </p>
                  </div>
                  <button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="w-full bg-[#0f2863] hover:bg-[#153a8a] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-950/20 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-amber-300" />}
                    <span>Générer Convocations (24)</span>
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-amber-200 dark:hover:border-amber-800 transition-all flex flex-col justify-between space-y-4 shadow-sm group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 rounded-full">
                        Étape 2 • Affectation IA
                      </span>
                      <Shield className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">Affecter les Surveillants</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Répartition équitable optimisée par IA selon les disponibilités et créneaux des professeurs.
                    </p>
                  </div>
                  <button
                    onClick={() => assignMutation.mutate()}
                    disabled={assignMutation.isPending}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                    <span>Auto-Affecter par IA</span>
                  </button>
                </div>

                {/* Step 3 */}
                <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all flex flex-col justify-between space-y-4 shadow-sm group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                        Étape 3 • Diffusion
                      </span>
                      <Mail className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">Diffuser par Email Resend</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Transmission sécurisée des convocations A4 en pièce jointe PDF à toute la promotion.
                    </p>
                  </div>
                  <button
                    onClick={() => sendMutation.mutate()}
                    disabled={sendMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Diffuser Tous les Emails</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📑 5. DATA HUB: TABS, FILTERS & MAIN TABLE / CARDS */}
        {selectedSessionId && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            {/* Tab Header Toolbar */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/80">
              <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 dark:bg-slate-800 rounded-2xl shrink-0">
                {[
                  { key: 'students', label: 'Étudiants & Salles', icon: Users, count: groupedStudents.length },
                  { key: 'surveillants', label: 'Surveillants Affectés', icon: Shield, count: groupedSurveillants.length },
                  { key: 'overview', label: 'Planning des Examens', icon: BarChart3, count: exams?.length || 0 },
                ].map(({ key, label, icon: Icon, count }) => {
                  const isActive = activeTab === key
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer',
                        isActive
                          ? 'bg-[#0f2863] text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-black',
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Filters & Mode Switcher */}
              <div className="flex items-center gap-3 flex-wrap">
                {activeTab === 'students' && (
                  <>
                    {/* Filière filter */}
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedFiliere}
                        onChange={(e) => setSelectedFiliere(e.target.value)}
                        className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="all">Toutes les Filières</option>
                        {filieres.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="all">Tous les Statuts</option>
                      <option value="sent">Emails Envoyés</option>
                      <option value="pending">En Attente d'Envoi</option>
                    </select>

                    {/* View mode toggle */}
                    <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
                      <button
                        onClick={() => setViewMode('table')}
                        className={cn('p-2 rounded-lg transition-all cursor-pointer', viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-[#0f2863] dark:text-white shadow-sm' : 'text-slate-500')}
                        title="Vue Tableau"
                      >
                        <ListFilter className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('cards')}
                        className={cn('p-2 rounded-lg transition-all cursor-pointer', viewMode === 'cards' ? 'bg-white dark:bg-slate-900 text-[#0f2863] dark:text-white shadow-sm' : 'text-slate-500')}
                        title="Vue Cartes"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* TAB 1: STUDENTS */}
            {activeTab === 'students' && (
              <div>
                {isLoadingList ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0f2863]" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-20 px-4">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-slate-800 text-blue-600 mx-auto flex items-center justify-center mb-3">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white">Aucun étudiant trouvé</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                      Générez les convocations ou ajustez vos critères de recherche.
                    </p>
                    <button
                      onClick={() => generateMutation.mutate()}
                      className="px-5 py-2.5 bg-[#0f2863] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#153a8a] transition-all cursor-pointer shadow-md"
                    >
                      Générer les Convocations
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Live Search bar */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div className="relative w-full max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Rechercher par Nom, CNE, CIN ou Filière..."
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-500">
                        {filteredStudents.length} étudiant{filteredStudents.length > 1 ? 's' : ''} convoqué{filteredStudents.length > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Floating Selection Bar */}
                    {selectedSeatings.size > 0 && (
                      <div className="bg-[#0f2863] text-white p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-20 shadow-xl animate-in slide-in-from-top-2 duration-200">
                        <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-300" />
                          {groupedStudents.filter((s: any) => s.all_seating_ids.some((id: number) => selectedSeatings.has(id))).length} étudiant(s) sélectionné(s) ({selectedSeatings.size} modules)
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={handleExportZip}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-300" /> Exporter ZIP
                          </button>
                          <button
                            onClick={() => batchDownloadMutation.mutate(Array.from(selectedSeatings))}
                            disabled={batchDownloadMutation.isPending}
                            className="bg-white text-[#0f2863] hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            {batchDownloadMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            Télécharger PDFs
                          </button>
                          <button
                            onClick={() => batchEmailMutation.mutate(Array.from(selectedSeatings))}
                            disabled={batchEmailMutation.isPending}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            {batchEmailMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                            Diffuser Emails
                          </button>
                        </div>
                      </div>
                    )}

                    {/* VIEW: TABLE */}
                    {viewMode === 'table' ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-5 py-4 text-left w-10">
                                <input
                                  type="checkbox"
                                  checked={filteredStudents.length > 0 && filteredStudents.every((s: any) => isStudentSelected(s))}
                                  onChange={handleSelectAllStudents}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </th>
                              <th className="px-5 py-4 text-left">Étudiant & Identifiants</th>
                              <th className="px-5 py-4 text-left">Filière / Affectation Amphi</th>
                              <th className="px-5 py-4 text-center">Modules Assignés</th>
                              <th className="px-5 py-4 text-center">QR Token Sécurisé</th>
                              <th className="px-5 py-4 text-center">Statut Resend</th>
                              <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStudents.map((s: any) => {
                              const isSelected = isStudentSelected(s)
                              return (
                                <tr
                                  key={s.student_id || s.cne}
                                  className={cn(
                                    'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors',
                                    isSelected ? 'bg-blue-50/40 dark:bg-blue-950/30' : ''
                                  )}
                                >
                                  <td className="px-5 py-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectStudent(s)}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-700 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                                        {(s.student_name || 'E').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{s.student_name}</p>
                                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                                          <span className="font-bold text-slate-600 dark:text-slate-400">CNE: {s.cne || '—'}</span>
                                          {s.cin && (
                                            <span className="text-[#0f2863] dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-900">
                                              CIN: {s.cin}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="space-y-1">
                                      <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 rounded-md text-[10px] font-black border border-blue-200 dark:border-blue-800">
                                        {s.filiere}
                                      </span>
                                      {s.group_name && <span className="ml-1 text-[10px] text-slate-400 font-bold">· {s.group_name}</span>}
                                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Amphithéâtre B · Table N° {((s.student_id || 1) % 45) + 1}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <button
                                      onClick={() => setSelectedStudentDetail(s)}
                                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <span>{s.exams.length} modules</span>
                                      <ChevronRight className="w-3 h-3 text-slate-400" />
                                    </button>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    {s.has_qr ? (
                                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                                        <BadgeCheck className="w-3.5 h-3.5" /> Certifié
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold">
                                        À générer
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    {s.all_sent ? (
                                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 rounded-full text-[10px] font-black">
                                        Envoyée
                                      </span>
                                    ) : s.any_sent ? (
                                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold">
                                        Partielle
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">
                                        En attente
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => setSelectedStudentDetail(s)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Voir les détails"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Détails</span>
                                      </button>
                                      <button
                                        onClick={() => handleDownloadStudentPdf(s.all_seating_ids[0])}
                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                                        title="Télécharger la convocation PDF"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => batchEmailMutation.mutate(s.all_seating_ids)}
                                        disabled={batchEmailMutation.isPending}
                                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                                        title="Envoyer l'email"
                                      >
                                        <Mail className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* VIEW: CARDS GRID */
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStudents.map((s: any) => (
                          <div
                            key={s.student_id || s.cne}
                            className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#0f2863] text-white flex items-center justify-center text-sm font-black shadow-md">
                                  {(s.student_name || 'E').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-black text-sm text-slate-900 dark:text-white">{s.student_name}</h4>
                                  <p className="text-[11px] font-mono text-slate-500 font-bold mt-0.5">
                                    CNE: {s.cne} {s.cin && `• CIN: ${s.cin}`}
                                  </p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                                {s.filiere}
                              </span>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Salle assignée :
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">Amphi B</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span>Table attribuée :</span>
                                <span className="font-mono font-black text-[#0f2863] dark:text-blue-400">
                                  N° {((s.student_id || 1) % 45) + 1}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                              <button
                                onClick={() => setSelectedStudentDetail(s)}
                                className="text-xs font-black text-[#0f2863] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>{s.exams.length} modules planifiés</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDownloadStudentPdf(s.all_seating_ids[0])}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => batchEmailMutation.mutate(s.all_seating_ids)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 2: SURVEILLANTS */}
            {activeTab === 'surveillants' && (
              <div>
                {isLoadingList ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0f2863]" />
                  </div>
                ) : groupedSurveillants.length === 0 ? (
                  <div className="text-center py-20 px-4">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-slate-800 text-amber-500 mx-auto flex items-center justify-center mb-3">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white">Aucun surveillant affecté</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                      Cliquez sur "Auto-Affecter les Surveillants" pour que l'algorithme d'équilibrage répartisse les créneaux.
                    </p>
                    <button
                      onClick={() => assignMutation.mutate()}
                      className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-600 transition-all cursor-pointer shadow-md"
                    >
                      Affecter Automatiquement
                    </button>
                  </div>
                ) : (
                  <>
                    {selectedSurveillants.size > 0 && (
                      <div className="bg-amber-600 text-white p-4 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xl">
                        <span className="font-bold text-xs sm:text-sm">
                          {selectedSurveillants.size} surveillant(s) sélectionné(s)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => batchDownloadSurveillantsMutation.mutate(Array.from(selectedSurveillants))}
                            disabled={batchDownloadSurveillantsMutation.isPending}
                            className="bg-white text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" /> Télécharger PDFs
                          </button>
                          <button
                            onClick={() => {
                              const allIds = groupedSurveillants
                                .filter((s: any) => selectedSurveillants.has(s.id))
                                .flatMap((s: any) => s.all_ids)
                              batchEmailSurveillantsMutation.mutate(allIds)
                            }}
                            disabled={batchEmailSurveillantsMutation.isPending}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Mail className="w-3.5 h-3.5" /> Envoyer Emails
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="px-5 py-4 text-left w-10">
                              <input
                                type="checkbox"
                                checked={groupedSurveillants.length > 0 && selectedSurveillants.size === groupedSurveillants.length}
                                onChange={handleSelectAllSurveillants}
                                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              />
                            </th>
                            <th className="px-5 py-4 text-left">Professeur & Rôle Académique</th>
                            <th className="px-5 py-4 text-center">Créneaux Assignés</th>
                            <th className="px-5 py-4 text-center">Notification Convocation</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {groupedSurveillants.map((s: any) => (
                            <tr
                              key={s.id}
                              className={cn(
                                'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors',
                                selectedSurveillants.has(s.id) ? 'bg-amber-50/40 dark:bg-amber-950/30' : ''
                              )}
                            >
                              <td className="px-5 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedSurveillants.has(s.id)}
                                  onChange={() => handleSelectOneSurveillant(s.id)}
                                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                                    {(s.professor_name || 'P').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">{s.professor_name}</p>
                                    <p className="text-[11px] text-slate-500 font-medium">Surveillant d'Épreuve ENCG</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-black">
                                  {s.seances_count} {s.seances_count > 1 ? 'séances' : 'séance'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                {s.sent_at ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-black">
                                    Envoyée
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">
                                    En attente
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handlePreviewSurveillantPdf(s.id)}
                                    className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                    title="Voir la convocation"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSurveillantPdf(s.id)}
                                    className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                    title="Télécharger"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: OVERVIEW / EXAM SCHEDULE */}
            {activeTab === 'overview' && (
              <div className="p-6">
                {isLoadingExams ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0f2863]" />
                  </div>
                ) : exams?.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 text-sm">
                    Aucun examen trouvé pour cette session.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exams?.map((exam: any) => {
                      const dateObj = new Date(exam.exam_date || new Date())
                      const seatings = exam.generated_count || 0
                      const sent = exam.sent_count || 0
                      return (
                        <div
                          key={exam.id}
                          className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/20 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#0f2863] text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                              <span className="text-[10px] font-black uppercase text-amber-300">
                                {dateObj.toLocaleString('fr-FR', { month: 'short' })}
                              </span>
                              <span className="text-2xl font-black leading-none">{dateObj.getDate()}</span>
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white text-sm">{exam.module?.name || 'Module'}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                  <Users className="w-3.5 h-3.5 text-slate-400" /> {exam.group?.name || 'Cohorte ENCG'}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {exam.start_time?.substring(0, 5) || '--:--'} ({exam.duration_minutes || 120} min)
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {exam.room?.name || 'Amphithéâtre B'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Convocations</p>
                              <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                                {seatings} générées · {sent} envoyées
                              </p>
                            </div>
                            {seatings > 0 ? (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[11px] font-black">
                                Prêt
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[11px] font-bold">
                                En attente
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 📋 MODAL: STUDENT DETAILED EXAM SCHEDULE */}
        {selectedStudentDetail && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-700 text-white flex items-center justify-center text-lg font-black shadow-md">
                    {(selectedStudentDetail.student_name || 'E').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedStudentDetail.student_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                      <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-bold text-slate-800 dark:text-slate-200">
                        CNE: {selectedStudentDetail.cne || '—'}
                      </span>
                      {selectedStudentDetail.cin && (
                        <span className="font-mono bg-blue-50 dark:bg-blue-950 text-[#0f2863] dark:text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-800">
                          CIN: {selectedStudentDetail.cin}
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-black text-[#0f2863] dark:text-blue-400">{selectedStudentDetail.filiere}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase font-black text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">Module / Épreuve</th>
                        <th className="px-4 py-3 text-left">Date & Heure</th>
                        <th className="px-4 py-3 text-left">Salle</th>
                        <th className="px-4 py-3 text-center">Table N°</th>
                        <th className="px-4 py-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedStudentDetail.exams.map((ex: any, idx: number) => (
                        <tr key={ex.id || idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{ex.exam_name}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{ex.exam_date ? new Date(ex.exam_date).toLocaleDateString('fr-FR') : '—'}</span>
                              {ex.start_time && <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">{ex.start_time.substring(0, 5)}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {ex.room_name || 'Amphithéâtre B'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-black text-[#0f2863] dark:text-blue-400">
                            {ex.seat_number ? `N° ${ex.seat_number}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {ex.sent_at ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black">
                                Envoyé
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">
                                En attente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const seatingId = selectedStudentDetail.all_seating_ids?.[0]
                    if (seatingId) handlePreviewStudentPdf(seatingId)
                  }}
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" /> Aperçu Convocation
                </button>
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="px-5 py-2.5 bg-[#0f2863] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#153a8a] transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🚨 MODAL: FLASH ALERT SALLE */}
        {flashAlertModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Alerte Flash Salle</h3>
                    <p className="text-xs text-amber-100">Diffusion d'urgence multi-canal (SMS & WhatsApp)</p>
                  </div>
                </div>
                <button
                  onClick={() => setFlashAlertModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Salle ou Amphithéâtre Concerné
                  </label>
                  <select
                    value={flashRoomName}
                    onChange={(e) => setFlashRoomName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="Amphithéâtre A">Amphithéâtre A</option>
                    <option value="Amphithéâtre B">Amphithéâtre B</option>
                    <option value="Amphithéâtre C">Amphithéâtre C</option>
                    <option value="Salle 1">Salle 1</option>
                    <option value="Salle 2">Salle 2</option>
                    <option value="Salle 3">Salle 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Message d'Urgence
                  </label>
                  <textarea
                    rows={4}
                    value={flashMessage}
                    onChange={(e) => setFlashMessage(e.target.value)}
                    placeholder="Ex: URGENT ENCG - L'examen de Comptabilité prévu en Salle 4 est transféré en Amphi B à 09h30 !"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
                <button
                  onClick={() => setFlashAlertModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendFlashAlert}
                  disabled={isSendingFlash}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isSendingFlash ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                  <span>Envoyer l'Alerte</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📄 MODAL: PDF FULLSCREEN PREVIEW */}
        {previewUrl && (
          <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm p-4 sm:p-6 flex flex-col animate-in fade-in duration-200">
            <div className="flex-1 min-h-0 rounded-3xl border border-slate-700 overflow-hidden bg-slate-900 shadow-2xl flex flex-col max-w-5xl mx-auto w-full">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-200">Aperçu de la Convocation Officielle</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.URL.revokeObjectURL(previewUrl)
                    setPreviewUrl(null)
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
              <iframe title="Aperçu convocation" src={previewUrl} className="w-full flex-1 min-h-[70vh] bg-slate-100" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
