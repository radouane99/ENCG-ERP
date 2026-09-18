import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Gavel, AlertTriangle, CheckCircle2,
  Calendar, Search, FileText, Printer, Mail, Download,
  Scale, RefreshCw, Send, Plus, Trash2,
  Check, X, BookOpen, AlertOctagon, Info,
  FileSpreadsheet, Eye, Sparkles, ExternalLink
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Spinner } from '@shared/components/ui/Spinner'
import { toast } from 'sonner'

interface DisciplineCase {
  id: number
  student_id: number
  student_name: string
  student_name_ar?: string
  cne: string
  student: {
    id: number
    first_name: string
    last_name: string
    first_name_ar?: string
    last_name_ar?: string
    full_name_ar?: string
    cne: string
    apogee?: string
    email?: string
    filiere?: string
    phone?: string
    guardian_email?: string
  }
  exam_id?: number
  module_name?: string
  filiere_name?: string
  exam_date?: string
  type: string
  type_label?: string
  description: string
  confiscated_items?: string
  severity: 'low' | 'medium' | 'high'
  status: 'pending' | 'convoked' | 'auditioned' | 'resolved' | 'dismissed'
  decision?: string
  hearing_date?: string
  hearing_room?: string
  hearing_notes?: string
  sanction_scope?: 'module' | 'semestre' | 'blame' | 'avertissement' | 'exclusion' | 'dismissed'
  created_at: string
}

export default function DisciplinePage(): React.ReactElement {
  const { t, i18n } = useTranslation('common')
  const queryClient = useQueryClient()

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  // Selected Case for Modal Operations
  const [selectedCase, setSelectedCase] = useState<DisciplineCase | null>(null)

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConvocationModal, setShowConvocationModal] = useState(false)
  const [showHearingModal, setShowHearingModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState<DisciplineCase | null>(null)

  // Real PDF State for Live Modal Previewer
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Convocation Modal Form
  const [convocationDate, setConvocationDate] = useState('2026-09-28')
  const [convocationTime, setConvocationTime] = useState('10:00')
  const [convocationRoom, setConvocationRoom] = useState('Salle des Actes — ENCG Fès')
  const [sendEmailToGuardian, setSendEmailToGuardian] = useState(true)

  // Deliberation Hearing Modal Form
  const [finalSanction, setFinalSanction] = useState<'module' | 'semestre' | 'blame' | 'avertissement' | 'exclusion' | 'dismissed'>('module')
  const [hearingObservations, setHearingObservations] = useState('')
  const [votesFor, setVotesFor] = useState(5)
  const [votesAgainst, setVotesAgainst] = useState(0)

  // Printable Document Modal Type
  const [printDocumentType, setPrintDocumentType] = useState<'convocation' | 'pv_decision'>('convocation')

  // Create Case Modal Form
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [createInfractionType, setCreateInfractionType] = useState<string>('fraude_antiseche')
  const [createSeverity, setCreateSeverity] = useState<'high' | 'medium' | 'low'>('high')
  const [createConfiscated, setCreateConfiscated] = useState<string>('')
  const [createDescription, setCreateDescription] = useState<string>('')
  const [studentSearchInModal, setStudentSearchInModal] = useState<string>('')

  // 1. Fetch Discipline Cases
  const { data: disciplineCases, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['discipline-cases'],
    queryFn: async () => {
      try {
        const res = await api.get('/discipline')
        return res.data?.data || []
      } catch (e) {
        const res = await api.get('/admin/discipline')
        return res.data?.data || []
      }
    }
  })

  // 2. Fetch Students & Exams for Case Creation
  const { data: creationData } = useQuery({
    queryKey: ['discipline-students-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/discipline/students-list')
        return res.data || { students: [], exams: [] }
      } catch (e) {
        const res = await api.get('/admin/discipline/students-list')
        return res.data || { students: [], exams: [] }
      }
    },
    enabled: showCreateModal
  })

  // 3. Create Case Mutation
  const createCaseMutation = useMutation({
    mutationFn: async (payload: {
      student_id: number
      exam_id?: number
      type: string
      severity: string
      description: string
      confiscated_items?: string
    }) => {
      return api.post('/discipline', payload)
    },
    onSuccess: () => {
      toast.success('⚖️ Dossier disciplinaire ouvert avec succès.')
      setShowCreateModal(false)
      resetCreateForm()
      queryClient.invalidateQueries({ queryKey: ['discipline-cases'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création du dossier.')
    }
  })

  // 4. Send Convocation Mutation
  const sendConvocationMutation = useMutation({
    mutationFn: async (payload: { case_id: number; hearing_date: string; hearing_room: string; send_email: boolean }) => {
      return api.post(`/discipline/${payload.case_id}/convoke`, payload)
    },
    onSuccess: () => {
      toast.success('✉️ Convocation officielle émise & notifiée à l\'étudiant et son tuteur.')
      setShowConvocationModal(false)
      queryClient.invalidateQueries({ queryKey: ['discipline-cases'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'émission de la convocation.')
    }
  })

  // 5. Submit Disciplinary Hearing Decision Mutation
  const decideSanctionMutation = useMutation({
    mutationFn: async (payload: { case_id: number; sanction: string; observations: string; votes_for: number }) => {
      return api.post(`/discipline/${payload.case_id}/decide`, payload)
    },
    onSuccess: () => {
      toast.success('⚖️ Délibération du Conseil scellée et enregistrée.')
      setShowHearingModal(false)
      queryClient.invalidateQueries({ queryKey: ['discipline-cases'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'enregistrement de la décision.')
    }
  })

  // 6. Delete Case Mutation
  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      return api.delete(`/discipline/${caseId}`)
    },
    onSuccess: () => {
      toast.success('Dossier disciplinaire retiré avec succès.')
      setShowDeleteConfirm(false)
      setCaseToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['discipline-cases'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression.')
    }
  })

  // 7. Seed Demonstration Cases Mutation
  const seedSamplesMutation = useMutation({
    mutationFn: async () => {
      return api.post('/discipline/seed-samples')
    },
    onSuccess: () => {
      toast.success('✨ 5 dossiers disciplinaires types réinitialisés avec succès !')
      queryClient.invalidateQueries({ queryKey: ['discipline-cases'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la réinitialisation.')
    }
  })

  // 8. Load Real PDF Blob for Modal Live Preview
  useEffect(() => {
    let activeUrl: string | null = null
    if (showPrintModal && selectedCase) {
      setIsPdfLoading(true)
      const endpoint = `/discipline/${selectedCase.id}/${printDocumentType === 'convocation' ? 'convocation-pdf' : 'decision-pdf'}`
      
      api.get(endpoint, { responseType: 'blob' })
        .then(res => {
          const blob = new Blob([res.data], { type: 'application/pdf' })
          const url = window.URL.createObjectURL(blob)
          activeUrl = url
          setPdfBlobUrl(url)
        })
        .catch(() => {
          toast.error('Erreur de génération du PDF certifié.')
        })
        .finally(() => {
          setIsPdfLoading(false)
        })
    } else {
      setPdfBlobUrl(null)
    }

    return () => {
      if (activeUrl) {
        window.URL.revokeObjectURL(activeUrl)
      }
    }
  }, [showPrintModal, selectedCase, printDocumentType])

  // Helper to trigger direct download of a certified PDF
  const handleDownloadPdf = async (type: 'convocation' | 'decision', id: number, studentName?: string) => {
    const toastId = toast.loading('Génération du document PDF certifié par le serveur...')
    try {
      const endpoint = `/discipline/${id}/${type === 'convocation' ? 'convocation-pdf' : 'decision-pdf'}`
      const res = await api.get(endpoint, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = studentName ? studentName.replace(/[^a-zA-Z0-9]/g, '_') : `Dossier_${id}`
      a.download = `${type === 'convocation' ? 'Convocation' : 'PV_Decision'}_Conseil_Discipline_${safeName}_ENCG.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Document PDF officiel téléchargé avec succès !', { id: toastId })
    } catch (e) {
      toast.error('Erreur lors du téléchargement du PDF certifié.', { id: toastId })
    }
  }

  // Helper to trigger direct download of the Batch PDF (Bordereau + all convocations)
  const handleDownloadBatchPdf = async () => {
    setIsBatchGenerating(true)
    const toastId = toast.loading('Génération du lot officiel des convocations & bordereau (A4)...')
    try {
      const res = await api.get('/discipline/batch-pdf', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Lot_Convocations_Bordereau_Conseil_Discipline_ENCG_Fes_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Lot officiel des convocations (PDF A4) généré et téléchargé !', { id: toastId })
    } catch (e) {
      toast.error('Erreur lors de la génération du lot PDF.', { id: toastId })
    } finally {
      setIsBatchGenerating(false)
    }
  }

  // Helper to open PDF in a new tab safely using authenticated blob
  const handleOpenPdfTab = async (type: 'convocation' | 'decision', id: number) => {
    if (pdfBlobUrl && selectedCase?.id === id && (
      (type === 'convocation' && printDocumentType === 'convocation') ||
      (type === 'decision' && printDocumentType === 'pv_decision')
    )) {
      window.open(pdfBlobUrl, '_blank')
      return
    }

    const toastId = toast.loading('Chargement du PDF...')
    try {
      const endpoint = `/discipline/${id}/${type === 'convocation' ? 'convocation-pdf' : 'decision-pdf'}`
      const res = await api.get(endpoint, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      toast.dismiss(toastId)
      window.open(url, '_blank')
    } catch {
      toast.error('Erreur lors de l\'ouverture du document PDF.', { id: toastId })
    }
  }

  const resetCreateForm = () => {
    setSelectedStudentId('')
    setSelectedExamId('')
    setCreateInfractionType('fraude_antiseche')
    setCreateSeverity('high')
    setCreateConfiscated('')
    setCreateDescription('')
    setStudentSearchInModal('')
  }

  const dataList: DisciplineCase[] = useMemo(() => {
    return disciplineCases || []
  }, [disciplineCases])

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(c => {
      const q = search.toLowerCase()
      const matchesSearch = (
        (c.student?.first_name || '').toLowerCase().includes(q) ||
        (c.student?.last_name || '').toLowerCase().includes(q) ||
        (c.student_name || '').toLowerCase().includes(q) ||
        (c.student_name_ar || '').includes(q) ||
        (c.student?.cne || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (c.module_name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      )

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter

      return matchesSearch && matchesStatus && matchesSeverity
    })
  }, [dataList, search, statusFilter, severityFilter])

  // KPIs
  const stats = useMemo(() => {
    const total = dataList.length
    const pending = dataList.filter(c => c.status === 'pending').length
    const convoked = dataList.filter(c => c.status === 'convoked').length
    const resolved = dataList.filter(c => c.status === 'resolved').length
    const dismissed = dataList.filter(c => c.status === 'dismissed').length
    return { total, pending, convoked, resolved, dismissed }
  }, [dataList])

  // Filtered students for creation modal search
  const modalStudents = useMemo(() => {
    const list = creationData?.students || []
    if (!studentSearchInModal) return list.slice(0, 25)
    const q = studentSearchInModal.toLowerCase()
    return list.filter((s: any) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.name_ar || '').includes(q) ||
      (s.cne || '').toLowerCase().includes(q)
    ).slice(0, 25)
  }, [creationData, studentSearchInModal])

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900/60 font-bold">
            <AlertOctagon size={12} className="me-1 text-red-600" /> Majeure
          </Badge>
        )
      case 'medium':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/60 font-bold">
            <AlertTriangle size={12} className="me-1 text-amber-600" /> Moyenne
          </Badge>
        )
      case 'low':
        return (
          <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-900/60 font-bold">
            <Info size={12} className="me-1 text-sky-600" /> Mineure
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border border-slate-300 font-bold">
            Ordinaire
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 me-1.5 animate-ping" />
            🚨 À Convoquer
          </span>
        )
      case 'convoked':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 shadow-xs">
            <Calendar size={12} className="me-1 text-amber-600" />
            📅 Convoqué au Conseil
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 shadow-xs">
            <Gavel size={12} className="me-1 text-emerald-600" />
            ⚖️ Sanctionné
          </span>
        )
      case 'dismissed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 shadow-xs">
            <CheckCircle2 size={12} className="me-1 text-slate-500" />
            Classé Sans Suite
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in">

      {/* Executive Institutional Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#2a0707] via-[#480f0f] to-[#681818] text-white p-7 md:p-8 rounded-3xl shadow-2xl border border-rose-900/30 space-y-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-10 w-72 h-72 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-rose-600/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-amber-400/30 shadow-xl text-amber-400 shrink-0">
              <Gavel className="w-9 h-9 drop-shadow" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xs">
                  <Scale className="w-3 h-3" /> Instance Juridictionnelle ENCG Fès
                </span>
                <span className="text-[10px] text-rose-200/70 font-arabic hidden sm:inline">
                  المملكة المغربية • جامعة سيدي محمد بن عبد الله
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                Conseil de Discipline & Convocations Officielles
              </h1>
              <p className="text-xs text-rose-100/80 max-w-2xl leading-relaxed">
                Instruction des infractions d'examen, convocations certifiées (Email + PDF A4), auditions contradictoires et délibérations des sanctions (Loi 01-00).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => {
                resetCreateForm()
                setShowCreateModal(true)
              }}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs px-4 py-2.5 border border-amber-300 shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouveau Dossier
            </Button>

            <Button
              onClick={handleDownloadBatchPdf}
              disabled={isBatchGenerating}
              className="bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs px-3.5 py-2.5 border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {isBatchGenerating ? <Spinner className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />}
              <span>Lot Convocations & Bordereau (PDF A4)</span>
            </Button>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20 backdrop-blur-md cursor-pointer"
              title="Actualiser les dossiers"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Voulez-vous réinitialiser les 5 dossiers disciplinaires de démonstration ENCG Fès ?')) {
                  seedSamplesMutation.mutate()
                }
              }}
              disabled={seedSamplesMutation.isPending}
              className="p-2.5 bg-white/5 hover:bg-white/15 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
              title="Réinitialiser avec 5 dossiers types ENCG Fès"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-200">Total Signalés</span>
              <FileText className="w-3.5 h-3.5 text-rose-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <span className="text-[10px] text-rose-200/70 font-medium">Dossiers d'examen</span>
          </div>

          <div className="bg-gradient-to-br from-rose-950/40 to-red-900/40 backdrop-blur-md p-3 rounded-2xl border border-red-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-200">À Convoquer</span>
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{stats.pending}</div>
            <span className="text-[10px] text-amber-200/70 font-medium">Audience urgente requise</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-sky-200">Convoqués</span>
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
            </div>
            <div className="text-2xl font-black text-sky-200 mt-1">{stats.convoked}</div>
            <span className="text-[10px] text-sky-200/70 font-medium">Séance programmée</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-200">Sanctionnés</span>
              <Gavel className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{stats.resolved}</div>
            <span className="text-[10px] text-emerald-200/70 font-medium">Sanction prononcée</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-300">Classés Sans Suite</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-200 mt-1">{stats.dismissed}</div>
            <span className="text-[10px] text-slate-300/70 font-medium">Charges non retenues</span>
          </div>
        </div>
      </div>

      {/* Search, Filter Tabs & Severity Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher par étudiant, nom arabe, CNE, module..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-700 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Sévérité :</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">Toutes les sévérités</option>
              <option value="high">🚨 Majeure (Fraude flagrante)</option>
              <option value="medium">⚠️ Moyenne (Perturbation / Tentative)</option>
              <option value="low">ℹ️ Mineure / Suspicion</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'Tous les dossiers', count: stats.total },
            { id: 'pending', label: '🚨 À Convoquer', count: stats.pending },
            { id: 'convoked', label: '📅 Convoqués', count: stats.convoked },
            { id: 'resolved', label: '⚖️ Sanctionnés', count: stats.resolved },
            { id: 'dismissed', label: '✅ Classés sans suite', count: stats.dismissed },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
                statusFilter === tab.id
                  ? "bg-[#4a1010] text-white shadow-md font-black"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold",
                statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Table of Disciplinary Cases */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 text-xs font-bold space-y-3">
            <Spinner className="w-7 h-7 mx-auto text-rose-700" />
            <p>Chargement des dossiers du Conseil de Discipline...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 px-4 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Gavel className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Aucun dossier disciplinaire trouvé</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {search || statusFilter !== 'all' || severityFilter !== 'all'
                  ? "Aucun résultat ne correspond aux filtres appliqués. Essayez d'élargir votre recherche."
                  : "Aucun cas d'infraction ou de fraude n'est actuellement consigné pour cette session."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => {
                  resetCreateForm()
                  setShowCreateModal(true)
                }}
                className="bg-[#4a1010] hover:bg-[#681818] text-white font-bold text-xs rounded-xl px-4"
              >
                <Plus className="w-4 h-4 me-1.5" /> Nouveau Dossier
              </Button>
              <Button
                variant="outline"
                onClick={() => seedSamplesMutation.mutate()}
                className="text-xs rounded-xl font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 me-1.5 text-amber-500" /> Charger 5 cas types
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-black text-[10px]">
                  <th className="p-4">Étudiant Poursuivi</th>
                  <th className="p-4">Épreuve & Contexte</th>
                  <th className="p-4">Infraction & Faits Signalés</th>
                  <th className="p-4 text-center">Sévérité</th>
                  <th className="p-4 text-center">Statut Procédural</th>
                  <th className="p-4 text-right">Actions Juridictionnelles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Étudiant Cell with Arabic & French Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-700 to-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                          {item.student?.last_name ? item.student.last_name.substring(0, 2).toUpperCase() : 'ET'}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <span>{item.student?.last_name?.toUpperCase()} {item.student?.first_name}</span>
                            {item.student_name_ar && (
                              <span className="text-xs font-arabic text-amber-700 dark:text-amber-400 font-bold">
                                ({item.student_name_ar})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              CNE: {item.cne || item.student?.cne}
                            </span>
                            {item.student?.email && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {item.student.email}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold mt-0.5">
                            {item.filiere_name || item.student?.filiere || 'Tronc Commun ENCG'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Épreuve & Contexte Cell */}
                    <td className="p-4 font-medium">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                        <span>{item.module_name || 'Épreuve Semestrielle'}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Date : {item.exam_date || item.created_at}</span>
                      </div>
                      <div className="text-[9.5pt] text-slate-400 font-mono mt-0.5">
                        Dossier N° CD-2026/{item.id}
                      </div>
                    </td>

                    {/* Motif & Infraction Cell */}
                    <td className="p-4 max-w-xs">
                      <div className="font-black text-rose-700 dark:text-rose-400 flex items-center gap-1 text-xs">
                        {item.type_label || item.type}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium text-[11px] line-clamp-2 mt-0.5 leading-snug">
                        {item.description}
                      </div>
                      {item.confiscated_items && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-md border border-rose-200 dark:border-rose-900/60 font-bold text-[10px] mt-1.5">
                          <span>📦 Saisie : {item.confiscated_items}</span>
                        </div>
                      )}
                    </td>

                    {/* Sévérité Cell */}
                    <td className="p-4 text-center">
                      {getSeverityBadge(item.severity)}
                    </td>

                    {/* Statut Procédural Cell */}
                    <td className="p-4 text-center space-y-1">
                      {getStatusBadge(item.status)}
                      {item.hearing_date && item.status !== 'resolved' && (
                        <div className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 mt-1">
                          📅 {item.hearing_date}
                        </div>
                      )}
                      {item.decision && (
                        <div className="text-[9.5px] text-slate-600 dark:text-slate-400 font-medium max-w-[170px] truncate mx-auto" title={item.decision}>
                          {item.decision}
                        </div>
                      )}
                    </td>

                    {/* Actions Cell */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">

                        {/* Action 1: Convoquer */}
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCase(item)
                              setShowConvocationModal(true)
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Émettre la convocation officielle"
                          >
                            <Mail className="w-3.5 h-3.5" /> Convoquer
                          </button>
                        )}

                        {/* Action 2: Statuer (Conseil de Discipline) */}
                        {item.status === 'convoked' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCase(item)
                              setFinalSanction(item.sanction_scope as any || 'module')
                              setHearingObservations(item.hearing_notes || '')
                              setShowHearingModal(true)
                            }}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Délibérer et prononcer la sanction"
                          >
                            <Gavel className="w-3.5 h-3.5" /> Statuer
                          </button>
                        )}

                        {/* Action 3: Réviser if resolved or dismissed */}
                        {(item.status === 'resolved' || item.status === 'dismissed') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCase(item)
                              setFinalSanction(item.sanction_scope as any || 'module')
                              setHearingObservations(item.hearing_notes || '')
                              setShowHearingModal(true)
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                            title="Modifier la délibération"
                          >
                            <Scale className="w-3.5 h-3.5" /> Réviser
                          </button>
                        )}

                        {/* Action 4: Visualiseur & Générateur de Vrai PDF */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCase(item)
                            setPrintDocumentType(item.status === 'resolved' ? 'pv_decision' : 'convocation')
                            setShowPrintModal(true)
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black rounded-xl text-[10px] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Visualiser et générer le vrai PDF officiel"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400 dark:text-rose-700" />
                          <span>PDF</span>
                        </button>

                        {/* Action 5: Téléchargement Direct 1-Clic du PDF Certifié */}
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(item.status === 'resolved' ? 'decision' : 'convocation', item.id, item.student?.last_name)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-rose-700 dark:text-rose-400 rounded-xl transition-all cursor-pointer"
                          title="Télécharger directement le PDF officiel"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Action 6: Supprimer / Archiver */}
                        <button
                          type="button"
                          onClick={() => {
                            setCaseToDelete(item)
                            setShowDeleteConfirm(true)
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                          title="Supprimer ce dossier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: NOUVEAU DOSSIER DISCIPLINAIRE */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 md:p-7 max-w-xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-700 text-white flex items-center justify-center font-bold shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Nouveau Dossier Disciplinaire</h3>
                  <p className="text-xs text-slate-500">Signalement d'infraction aux examens pour instruction</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Search & Select Student */}
              <div className="space-y-1.5">
                <label className="font-black uppercase text-slate-500 text-[10px] flex items-center justify-between">
                  <span>1. Étudiant Poursuivi *</span>
                  <span className="text-slate-400 font-normal">Rechercher par nom ou CNE</span>
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Tapez pour filtrer les étudiants (ex: Berrada, N13000...)"
                    value={studentSearchInModal}
                    onChange={e => setStudentSearchInModal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
                  />
                </div>

                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                >
                  <option value="">-- Sélectionner l'étudiant concerné ({modalStudents.length} affichés) --</option>
                  {modalStudents.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.name_ar ? `(${s.name_ar})` : ''} — CNE: {s.cne}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Exam / Module */}
              <div className="space-y-1.5">
                <label className="font-black uppercase text-slate-500 text-[10px]">2. Épreuve & Module Concerné</label>
                <select
                  value={selectedExamId}
                  onChange={e => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none"
                >
                  <option value="">-- Sélectionner l'examen / module (optionnel) --</option>
                  {(creationData?.exams || []).map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.module_name} (Date : {e.exam_date || 'Session courante'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Infraction Type & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-black uppercase text-slate-500 text-[10px]">3. Type d'Infraction *</label>
                  <select
                    value={createInfractionType}
                    onChange={e => setCreateInfractionType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="fraude_antiseche">📝 Fraude Antisèche / Documents</option>
                    <option value="fraude_smartphone">📱 Usage Smartphone / IA / ChatGPT</option>
                    <option value="usurpation">👤 Usurpation d'Identité</option>
                    <option value="perturbation">⚠️ Perturbation & Refus d'Obtempérer</option>
                    <option value="plagiat">📑 Plagiat de Travaux</option>
                    <option value="suspicion_fraude">🔍 Suspicion de Fraude</option>
                    <option value="autre">ℹ️ Autre incident</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-black uppercase text-slate-500 text-[10px]">4. Niveau de Sévérité *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'high', label: 'Majeure', color: 'border-red-400 text-red-700' },
                      { id: 'medium', label: 'Moyenne', color: 'border-amber-400 text-amber-700' },
                      { id: 'low', label: 'Mineure', color: 'border-sky-400 text-sky-700' },
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCreateSeverity(s.id as any)}
                        className={cn(
                          "py-2 rounded-xl text-[11px] font-black border transition-all cursor-pointer text-center",
                          createSeverity === s.id
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confiscated Items */}
              <div className="space-y-1.5">
                <label className="font-black uppercase text-slate-500 text-[10px]">5. Pièces à Conviction & Éléments Confisqués</label>
                <input
                  type="text"
                  placeholder="Ex: 3 fiches cartonnées manuscrites, iPhone 13 noir, brouillon annoté..."
                  value={createConfiscated}
                  onChange={e => setCreateConfiscated(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none"
                />
              </div>

              {/* Description of Facts */}
              <div className="space-y-1.5">
                <label className="font-black uppercase text-slate-500 text-[10px]">6. Rapport Circonstancié des Surveillants *</label>
                <textarea
                  rows={3}
                  placeholder="Circonstances précises du constat, attitude du candidat, heure de l'incident et mesures immédiates prises en salle..."
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl font-bold text-xs"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (!selectedStudentId) {
                    toast.error('Veuillez sélectionner un étudiant.')
                    return
                  }
                  if (!createDescription.trim()) {
                    toast.error('Veuillez saisir le rapport des faits.')
                    return
                  }
                  createCaseMutation.mutate({
                    student_id: Number(selectedStudentId),
                    exam_id: selectedExamId ? Number(selectedExamId) : undefined,
                    type: createInfractionType,
                    severity: createSeverity,
                    description: createDescription,
                    confiscated_items: createConfiscated || undefined,
                  })
                }}
                disabled={createCaseMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs px-6 shadow-md"
              >
                {createCaseMutation.isPending ? <Spinner className="w-4 h-4 me-1" /> : <Check className="w-4 h-4 me-1" />}
                Enregistrer le Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: CONVOCATION GENERATOR MODAL */}
      {/* ------------------------------------------------------------- */}
      {showConvocationModal && selectedCase && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 md:p-7 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Convocation Officielle au Conseil</h3>
                  <p className="text-xs text-slate-500">
                    Candidat : {selectedCase.student?.last_name?.toUpperCase()} {selectedCase.student?.first_name} ({selectedCase.student?.cne})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConvocationModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-black uppercase text-slate-500 text-[10px]">Date de Séance *</label>
                  <input
                    type="date"
                    value={convocationDate}
                    onChange={e => setConvocationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-black uppercase text-slate-500 text-[10px]">Heure d'Audience *</label>
                  <input
                    type="time"
                    value={convocationTime}
                    onChange={e => setConvocationTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-black uppercase text-slate-500 text-[10px]">Lieu de Réunion *</label>
                <input
                  type="text"
                  value={convocationRoom}
                  onChange={e => setConvocationRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none"
                />
                <div className="flex gap-2 pt-1">
                  {['Salle des Actes', 'Salle du Conseil', 'Bureau Direction'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setConvocationRoom(`${r} — ENCG Fès`)}
                      className="text-[10px] text-slate-500 hover:text-amber-700 underline cursor-pointer"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-amber-600" /> Notifications Automatiques (Resend Mailable)
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={sendEmailToGuardian}
                    onChange={e => setSendEmailToGuardian(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Envoyer la convocation PDF officielle par email à l'étudiant et son tuteur</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowConvocationModal(false)}
                className="rounded-xl font-bold text-xs"
              >
                Annuler
              </Button>
              <Button
                onClick={() => sendConvocationMutation.mutate({
                  case_id: selectedCase.id,
                  hearing_date: `${convocationDate} à ${convocationTime}`,
                  hearing_room: convocationRoom,
                  send_email: sendEmailToGuardian
                })}
                disabled={sendConvocationMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs px-6 shadow-md"
              >
                {sendConvocationMutation.isPending ? <Spinner className="w-4 h-4 me-1" /> : <Send className="w-4 h-4 me-1" />}
                Émettre & Notifier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: DELIBERATION HEARING MODAL */}
      {/* ------------------------------------------------------------- */}
      {showHearingModal && selectedCase && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 md:p-7 max-w-xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-700 to-red-900 text-white flex items-center justify-center font-bold shadow-md">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Séance Délibérative du Conseil</h3>
                  <p className="text-xs text-slate-500">
                    Dossier : {selectedCase.student?.last_name?.toUpperCase()} {selectedCase.student?.first_name} ({selectedCase.type_label || selectedCase.type})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHearingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-black uppercase text-slate-500 text-[10px]">Sanction Prononcée par le Conseil *</label>
                <select
                  value={finalSanction}
                  onChange={e => setFinalSanction(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                >
                  <option value="module">📘 Note 0.00 / 20 au Module concerné (Sanction standard fraude)</option>
                  <option value="semestre">📚 Annulation du Semestre S1/S2 (Note 0.00 à tous les modules)</option>
                  <option value="blame">📜 Blâme officiel avec inscription irréversible au dossier académique</option>
                  <option value="avertissement">⚠️ Avertissement écrit solennel notifié au dossier</option>
                  <option value="exclusion">🚫 Exclusion temporaire (1 an universitaire sans réinscription)</option>
                  <option value="dismissed">✅ Classement sans suite (Candidat innocenté / non coupable)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-black uppercase text-slate-500 text-[10px]">Procès-Verbal des Débats & Motifs de la Décision *</label>
                <textarea
                  value={hearingObservations}
                  onChange={e => setHearingObservations(e.target.value)}
                  placeholder="Synthèse de l'audition contradictoire du candidat, explications fournies, délibérations des membres du Conseil et circonstances retenues..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-700 dark:text-emerald-400">Votes Pour la Sanction :</label>
                  <input
                    type="number"
                    min={0}
                    value={votesFor}
                    onChange={e => setVotesFor(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-black text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-red-700 dark:text-red-400">Votes Contre :</label>
                  <input
                    type="number"
                    min={0}
                    value={votesAgainst}
                    onChange={e => setVotesAgainst(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-black text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowHearingModal(false)}
                className="rounded-xl font-bold text-xs"
              >
                Annuler
              </Button>
              <Button
                onClick={() => decideSanctionMutation.mutate({
                  case_id: selectedCase.id,
                  sanction: finalSanction,
                  observations: hearingObservations,
                  votes_for: votesFor
                })}
                disabled={decideSanctionMutation.isPending}
                className="bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl text-xs px-6 shadow-lg"
              >
                {decideSanctionMutation.isPending ? <Spinner className="w-4 h-4 me-1" /> : <Scale className="w-4 h-4 me-1" />}
                Sceller la Délibération
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: VRAI GÉNÉRATEUR & VISIONNEUSE PDF OFFICIEL */}
      {/* ------------------------------------------------------------- */}
      {showPrintModal && selectedCase && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-7 max-w-4xl w-full shadow-2xl space-y-4 my-6">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-rose-700" />
                  <span>Document Officiel Certifié (PDF A4) — Conseil de Discipline</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Candidat : <strong>{selectedCase.student?.last_name?.toUpperCase()} {selectedCase.student?.first_name}</strong> (CNE : {selectedCase.cne})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl self-end sm:self-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Type Switcher Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setPrintDocumentType('convocation')}
                className={cn(
                  "flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer text-center",
                  printDocumentType === 'convocation'
                    ? "bg-[#4a1010] text-white shadow-sm font-black"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                ✉️ Convocation Officielle d'Audience (PDF)
              </button>
              <button
                type="button"
                onClick={() => setPrintDocumentType('pv_decision')}
                className={cn(
                  "flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer text-center",
                  printDocumentType === 'pv_decision'
                    ? "bg-[#881337] text-white shadow-sm font-black"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                📜 Procès-Verbal de Délibération & Décision (PDF)
              </button>
            </div>

            {/* Live High-Definition PDF Stream Iframe */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950/5 min-h-[580px] flex items-center justify-center">
              {isPdfLoading ? (
                <div className="text-center py-24 space-y-3">
                  <Spinner className="w-8 h-8 mx-auto text-rose-700" />
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Génération du document PDF certifié par le moteur DomPDF...
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Application des sceaux de sécurité, signatures et QR code de vérification
                  </div>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  ref={iframeRef}
                  src={`${pdfBlobUrl}#toolbar=1`}
                  className="w-full h-[580px] border-none"
                  title="Document Officiel PDF"
                />
              ) : (
                <div className="text-center py-20 text-slate-400 text-xs">
                  Impossible de charger le document PDF.
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleDownloadPdf(printDocumentType === 'convocation' ? 'convocation' : 'decision', selectedCase.id, selectedCase.student?.last_name)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs px-5 py-2 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le Fichier PDF</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleOpenPdfTab(printDocumentType === 'convocation' ? 'convocation' : 'decision', selectedCase.id)}
                  className="rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Plein Écran</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPrintModal(false)}
                  className="rounded-xl font-bold text-xs"
                >
                  Fermer
                </Button>

                <Button
                  onClick={() => {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.print()
                    } else {
                      handleOpenPdfTab(printDocumentType === 'convocation' ? 'convocation' : 'decision', selectedCase.id)
                    }
                  }}
                  className="bg-[#4a1010] hover:bg-[#681818] text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer px-4"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le PDF</span>
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: DELETE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showDeleteConfirm && caseToDelete && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Supprimer ce dossier ?</h3>
                <p className="text-xs text-slate-500">Dossier N° CD-2026/{caseToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Êtes-vous sûr de vouloir supprimer définitivement le dossier disciplinaire de <strong>{caseToDelete.student?.last_name} {caseToDelete.student?.first_name}</strong> ? Cette action est irréversible.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl text-xs font-bold"
              >
                Annuler
              </Button>
              <Button
                onClick={() => deleteCaseMutation.mutate(caseToDelete.id)}
                disabled={deleteCaseMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                {deleteCaseMutation.isPending ? <Spinner className="w-3.5 h-3.5 me-1" /> : null}
                Confirmer la Suppression
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
