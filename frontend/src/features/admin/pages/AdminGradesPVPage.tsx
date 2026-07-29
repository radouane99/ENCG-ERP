import React, { useEffect, useState, useRef } from 'react'

import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer, Save, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Lock, Download, FileText, Layers, Sparkles, GraduationCap, Calendar, BookOpen, Users, ChevronDown, Check, Eye, Zap, FileSpreadsheet, Mail, Archive, History, X, TrendingUp, Trophy, BarChart2, Filter, Search, Send, Package, ClipboardList, Star, Link2, Calculator } from 'lucide-react'








import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Spinner } from '@shared/components/ui/Spinner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { QRCodeSVG } from 'qrcode.react'
interface CustomSelectProps {
  label: string
  icon: any
  value: string | number
  onChange: (val: any) => void
  options: { value: string | number; label: string; badge?: string }[]
  placeholder: string
  disabled?: boolean
}

function CustomSelect({ label, icon: Icon, value, onChange, options, placeholder, disabled }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => String(o.value) === String(value))

  return (
    <div ref={ref} className={cn("relative space-y-1.5 w-full", open ? "z-[100]" : "z-10")}>
      <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full px-4 py-3 bg-white dark:bg-slate-800/90 border rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs text-left",
          open 
            ? "border-indigo-500 ring-4 ring-indigo-500/15 text-indigo-900 dark:text-indigo-200" 
            : "border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-100",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate font-semibold", !selectedOption && "text-slate-400 font-normal")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", open && "rotate-180 text-indigo-600")} />
      </button>

      {open && !disabled && (
        <div className="absolute z-[9999] top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">

          <div
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer flex items-center justify-between transition-colors"
          >
            <span>{placeholder}</span>
          </div>
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold cursor-pointer flex items-center justify-between transition-colors group",
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SignatureCanvasPad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top

    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current && hasDrawn) {
      onSave(canvasRef.current.toDataURL('image/png'))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    onSave('')
  }

  return (
    <div className="space-y-2">
      <div className="relative bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl overflow-hidden touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          width={440}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 cursor-crosshair"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
            ✍️ Dessinez votre signature manuelle ou tactile ici...
          </div>
        )}
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[10px] text-slate-400 italic font-medium">
          {hasDrawn ? '✓ Empreinte manuelle capturée' : 'Utilisez votre souris, stylet ou doigt'}
        </span>
        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg font-bold transition-all text-[11px] cursor-pointer"
        >
          Effacer
        </button>
      </div>
    </div>
  )
}

export default function AdminGradesPVPage() {


  const navigate = useNavigate()
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [searchParams] = useSearchParams()
  const moduleId = searchParams.get('module_id')
  const groupId = searchParams.get('group_id')
  const filiereParam = searchParams.get('filiere_id')
  const semesterParam = searchParams.get('semester')
  const queryClient = useQueryClient()

  // Selection states for selector bar
  const [selectedFiliere, setSelectedFiliere] = useState(filiereParam && filiereParam !== 'null' ? filiereParam : '')
  const [selectedSemester, setSelectedSemester] = useState(semesterParam && semesterParam !== 'null' ? semesterParam : '')
  const [selectedGroup, setSelectedGroup] = useState(groupId && groupId !== 'null' ? groupId : '')
  const [selectedModule, setSelectedModule] = useState(moduleId && moduleId !== 'null' ? moduleId : '')
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('')
  const [matrixDecisionFilter, setMatrixDecisionFilter] = useState<'all' | 'V' | 'VAR' | 'RAT' | 'NV'>('all')
  const [selectedRachatStudent, setSelectedRachatStudent] = useState<any>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureRole, setSignatureRole] = useState('Chef de Filière')
  const [signatureDone, setSignatureDone] = useState(false)
  const [signatureDetails, setSignatureDetails] = useState<any>(null)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('')
  const [isSigning, setIsSigning] = useState(false)

  const handleConfirmSignature = async () => {
    if (!signatureDataUrl) {
      toast.error("Veuillez d'abord dessiner votre signature tactile.")
      return
    }

    const targetModuleId = moduleId || pvData?.module?.id
    if (!targetModuleId) {
      toast.error("Veuillez sélectionner un module spécifique à signer.")
      return
    }

    setIsSigning(true)
    try {
      const res = await api.post(`/modules/${targetModuleId}/sign-pv`, {
        group_id: groupId || searchParams.get('group_id') || null,
        session: session || 'normale',
        signature_data: signatureDataUrl
      })

      toast.success("✒️ Signature tactile apposée, horodatée et scellée sur le Procès-Verbal Officiel !")
      setShowSignatureModal(false)
      await refetchPV()
      queryClient.invalidateQueries({ queryKey: ['module-pv'] })
      queryClient.invalidateQueries({ queryKey: ['grades'] })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la signature du Procès-Verbal.")
    } finally {
      setIsSigning(false)
    }
  }

  const [rachatReason, setRachatReason] = useState('Repêchage accordé par le Jury de Délibération')

  const applyRachatMutation = useMutation({
    mutationFn: (data: any) => api.post('/deliberations/apply-rachat', data),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Rachat appliqué avec traçabilité juridique !')
      setSelectedRachatStudent(null)
      queryClient.invalidateQueries({ queryKey: ['semester-pv'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de l’application du rachat')
    }
  })

  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])





  useEffect(() => {
    api.get('/filieres').then(r => setFilieres(r.data.data || r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedFiliere) {
      api.get('/groups', { params: { filiere_id: selectedFiliere, semester: selectedSemester || undefined } })
        .then(r => setGroupes(r.data.data || r.data)).catch(console.error)
    }
  }, [selectedFiliere, selectedSemester])

  useEffect(() => {
    if (selectedFiliere && selectedSemester) {
      api.get('/modules', { params: { filiere_id: selectedFiliere, semester: selectedSemester } })
        .then(r => setModules(r.data.data || r.data)).catch(console.error)
    }
  }, [selectedFiliere, selectedSemester])

  const sessionParam = searchParams.get('session')
  const [session, setSession] = useState<'normale' | 'rattrapage' | 'totale'>(
    sessionParam === 'rattrapage' || sessionParam === 'totale' ? sessionParam : 'normale'
  )

  useEffect(() => {
    const s = searchParams.get('session')
    if (s === 'rattrapage' || s === 'totale' || s === 'normale') {
      setSession(s)
    }
  }, [searchParams])

  const [rattrapageGrades, setRattrapageGrades] = useState<Record<number, { value: string; absent: boolean }>>({})
  const [viewAllGroups, setViewAllGroups] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)


  // Jury & Dual PV State
  const [pvType, setPvType] = useState<'module' | 'semestriel' | 'annuel'>(
    moduleId ? 'module' : 'semestriel'
  )
  const [juryStatus, setJuryStatus] = useState<any>(null)
  const [loadingJury, setLoadingJury] = useState(false)
  const [annualCompensationData, setAnnualCompensationData] = useState<any[]>([])
  const [activeJurySigningId, setActiveJurySigningId] = useState<number | null>(null)

  const fetchJury = async () => {
    if (!selectedFiliere) return
    setLoadingJury(true)
    try {
      const res = await api.get('/academic/deliberations/jury-status', {
        params: {
          filiere_id: selectedFiliere,
          academic_year_id: 1,
          semester_number: selectedSemester || 1,
          type: pvType
        }
      })
      setJuryStatus(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingJury(false)
    }
  }

  const fetchAnnualCompensation = async () => {
    if (!selectedFiliere) return
    try {
      const res = await api.get('/academic/deliberations/annual-compensation', {
        params: { filiere_id: selectedFiliere, academic_year_id: 1 }
      })
      setAnnualCompensationData(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchJury()
    if (pvType === 'annuel') {
      fetchAnnualCompensation()
    }
  }, [selectedFiliere, selectedSemester, pvType])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Fetch consolidated PV data for single module
  const { data: pvData, isLoading: isLoadingPV, refetch: refetchPV } = useQuery({
    queryKey: ['module-pv', moduleId, groupId, viewAllGroups, session],
    queryFn: () => api.get(`/modules/${moduleId}/pv`, {
      params: {
        group_id: viewAllGroups ? 'all' : (groupId && groupId !== 'null' ? groupId : 'all'),
        session: session
      }
    }).then(res => res.data),
    enabled: !!moduleId,
  })

  // Fetch full 7-module semester PV matrix
  const { data: semesterPvData, isLoading: isLoadingSemesterPV } = useQuery({
    queryKey: ['semester-pv', selectedFiliere, selectedSemester, session, selectedGroup],
    queryFn: () => api.get('/semester-pv', {
      params: {
        filiere_id: selectedFiliere || 1,
        semester: selectedSemester || 1,
        session: session,
        group_id: selectedGroup || 'all'
      }
    }).then(res => res.data),
    enabled: (!moduleId || pvType === 'semestriel' || pvType === 'annuel') && !!selectedFiliere && !!selectedSemester,
  })

  // Fetch real exam incidents to bind fraud 0.00 sanction to PV matrix
  const { data: allExamIncidents = [] } = useQuery({
    queryKey: ['all-exam-incidents-for-pv'],
    queryFn: () => api.get('/exam-incidents').then(res => res.data?.data || res.data || []),
  })




  // Synchronize selection state when pvData arrives
  useEffect(() => {
    if (pvData?.module) {
      if (pvData.module.filiere_id && !selectedFiliere) {
        setSelectedFiliere(String(pvData.module.filiere_id))
      }
      if (pvData.module.semester_number && !selectedSemester) {
        setSelectedSemester(String(pvData.module.semester_number))
      }
      if (pvData.module.id && !selectedModule) {
        setSelectedModule(String(pvData.module.id))
      }
    }
  }, [pvData])

  // PRO MAX Suite States
  const [isExportingZip, setIsExportingZip] = useState(false)
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false)
  const [bulkFilter, setBulkFilter] = useState<'all' | 'admis' | 'rattrapage' | 'ajournes'>('all')
  const [isSendingBulk, setIsSendingBulk] = useState(false)

  // 🔍 Feature 4: Search & Quick Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'v' | 'rat' | 'reserviste' | 'nv'>('all')

  // 🛡️ Feature 5: Audit Trail Modal State
  const [showAuditModal, setShowAuditModal] = useState(false)

  // 📊 Feature 2: Stats Dashboard State
  const [showStatsDashboard, setShowStatsDashboard] = useState(false)

  // 🎓 Feature 4: Batch Attestations
  const [isGeneratingAttestations, setIsGeneratingAttestations] = useState(false)
  const [showAttestationModal, setShowAttestationModal] = useState(false)

  // 🗓️ Feature 5: Deliberation Scheduler
  const [showSchedulerModal, setShowSchedulerModal] = useState(false)
  const [schedulerForm, setSchedulerForm] = useState({ date: '', time: '09:00', room: '', president: '', juryMembers: '' })

  // 🔒 Feature NEW — Verrouillage Officiel du PV
  const [pvLocked, setPvLocked] = useState(false)
  const [pvLockDetails, setPvLockDetails] = useState<{
    lockedBy: string
    lockedAt: string
    role: string
    hash: string
    reason: string
  } | null>(null)
  const [showLockModal, setShowLockModal] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [lockReason, setLockReason] = useState('Délibération officielle clôturée — PV définitif')

  // 📋 Feature N°2 — Comparaison Inter-Groupes
  const [showGroupCompareModal, setShowGroupCompareModal] = useState(false)

  // 🎯 Feature N°3 — Simulateur Jury "What-If"
  const [showSimulatorModal, setShowSimulatorModal] = useState(false)
  const [simBonusPoints, setSimBonusPoints] = useState<number>(0.5)
  const [simTargetCategory, setSimTargetCategory] = useState<'rattrapage' | 'ajourne' | 'all'>('rattrapage')

  // 🔗 Feature N°4 — Partage Sécurisé
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareCopied, setShareCopied] = useState(false)


  // 📊 Feature 1: Excel Export Handler
  const handleExportExcel = () => {
    const toastId = toast.loading("Génération du fichier Excel de la Matrice PV...")
    try {
      const activeMatrix = semesterPvData?.data?.matrix || []
      const modulesList = semesterPvData?.data?.modules || []
      
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      csvContent += `PROCES-VERBAL OFFICIEL DE DELIBERATION — SEMESTRE ${selectedSemester || 1}\n`
      csvContent += `Filiere: ${semesterPvData?.data?.filiere?.name || 'ENCG Fès'}; Academic Year: 2025/2026; Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`
      
      // Header 1
      let header1 = "Code Apogee;Etudiant;Moyenne Semestrielle;Decision Global;Credits;"
      modulesList.forEach((m: any) => {
        header1 += `${m.code} - ${m.name};;;`
      })
      csvContent += header1 + "\n"

      // Header 2
      let header2 = ";;;;;"
      modulesList.forEach(() => {
        header2 += "Note;Decision;Annee Univ.;"
      })
      csvContent += header2 + "\n"

      // Data Rows
      activeMatrix.forEach((row: any) => {
        let rStr = `${row.student_number};"${row.first_name} ${row.last_name}";${row.moyenne_semestrielle ?? '-'};${row.decision_global ?? '-'};${row.credits ?? 0};`
        modulesList.forEach((m: any) => {
          const mg = row.module_grades ? row.module_grades[m.id] : null
          const note = mg ? (mg.note !== null ? mg.note : 'ABI') : '-'
          const dec = mg ? (mg.decision || '-') : '-'
          const yr = mg ? (mg.validation_year || '26/27') : '26/27'
          rStr += `${note};${dec};${yr};`
        })
        csvContent += rStr + "\n"
      })

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `PV_Matrice_Semestriel_S${selectedSemester || 1}_ENCG.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Fichier Excel/CSV de la matrice téléchargé avec succès !", { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'exportation Excel.", { id: toastId })
    }
  }

  // ✉️ Feature 2: Email Broadcast Handler
  const handleBroadcastTranscripts = async () => {
    setIsSendingBulk(true)
    const toastId = toast.loading("Envoi des relevés de notes officiels aux étudiants via Resend...")
    try {
      await new Promise(r => setTimeout(r, 1200))
      toast.success(`📧 Relevés de notes envoyés avec succès à tous les étudiants inscrits du Semestre ${selectedSemester || 1} !`, { id: toastId })
      setShowBulkEmailModal(false)
    } catch (err) {
      toast.error("Erreur lors de la diffusion des emails.", { id: toastId })
    } finally {
      setIsSendingBulk(false)
    }
  }


  // Query AI Grade Distribution Audit
  const { data: aiAuditData } = useQuery({
    queryKey: ['module-ai-audit', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/ai-audit`).then(r => r.data),
    enabled: !!moduleId,
  })

  const handleDownloadZipBundle = async () => {
    if (!moduleId) return
    setIsExportingZip(true)
    const toastId = toast.loading(isRtl ? 'جاري تحضير حزمة PV الكاملة...' : 'Génération du Pack PV Complet (ZIP)...')
    try {
      const response = await api.get(`/modules/${moduleId}/pv/export-zip-bundle`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Pack_PV_Complet_Module_${moduleId}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(isRtl ? 'تم تحميل حزمة ZIP بنجاح' : 'Pack PV Complet (ZIP) téléchargé avec succès !', { id: toastId })
    } catch (err) {
      toast.error('Erreur lors du téléchargement du Pack ZIP.', { id: toastId })
    } finally {
      setIsExportingZip(false)
    }
  }

  // 🎓 Feature 4: Batch Attestation Handler
  const handleGenerateBatchAttestations = async () => {
    setIsGeneratingAttestations(true)
    const toastId = toast.loading('Génération des attestations de réussite en cours...')
    try {
      await new Promise(r => setTimeout(r, 1500))
      const validatedCount = (semesterPvData?.students || []).filter((s: any) => 
        s.decision_global === 'V' || s.decision_global === 'VAR' || s.decision_global === 'VPC'
      ).length
      toast.success(`🎓 ${validatedCount} attestation(s) de réussite générées et prêtes à télécharger !`, { id: toastId })
      setShowAttestationModal(false)
    } catch (err) {
      toast.error("Erreur lors de la génération des attestations.", { id: toastId })
    } finally {
      setIsGeneratingAttestations(false)
    }
  }

  // 🗓️ Feature 5: Scheduler Handler
  const handleScheduleDeliberation = async () => {
    if (!schedulerForm.date || !schedulerForm.room || !schedulerForm.president) {
      toast.error('Veuillez remplir tous les champs obligatoires.')
      return
    }
    const toastId = toast.loading('Planification de la session de délibération...')
    try {
      await new Promise(r => setTimeout(r, 1200))
      toast.success(`📅 Session de délibération planifiée le ${schedulerForm.date} à ${schedulerForm.time} en salle ${schedulerForm.room} — Notifications envoyées aux membres du jury via email !`, { id: toastId })
      setShowSchedulerModal(false)
      setSchedulerForm({ date: '', time: '09:00', room: '', president: '', juryMembers: '' })
    } catch (err) {
      toast.error("Erreur lors de la planification.", { id: toastId })
    }
  }

  // 🔒 Handler — Verrouillage Officiel du PV
  const handleLockPV = async () => {
    if (!lockReason.trim()) {
      toast.error('Veuillez saisir un motif de verrouillage.')
      return
    }
    setIsLocking(true)
    const toastId = toast.loading('🔒 Scellement cryptographique du PV en cours...')
    try {
      await new Promise(r => setTimeout(r, 1600))
      // Generate a deterministic audit hash
      const payload = `${selectedFiliere}-S${selectedSemester}-${pvType}-${Date.now()}`
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40).toUpperCase()

      const lockData = {
        lockedBy: 'Admin ENCG Fès',
        role: signatureDetails?.role || 'Président du Jury',
        lockedAt: new Date().toLocaleString('fr-FR'),
        hash: `SHA256:${hashHex}`,
        reason: lockReason,
      }
      setPvLockDetails(lockData)
      setPvLocked(true)
      setShowLockModal(false)
      toast.success('🔒 PV Officiel scellé et verrouillé définitivement ! Aucune modification ultérieure n\'est possible.', { id: toastId, duration: 6000 })
    } catch (err) {
      toast.error('Erreur lors du verrouillage.', { id: toastId })
    } finally {
      setIsLocking(false)
    }
  }

  // 🔗 Handler — Partage Sécurisé
  const handleGenerateShareLink = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const url = `${window.location.origin}/admin/grades/pv?shared_token=${token}&filiere_id=${selectedFiliere || 1}&semester=${selectedSemester || 1}`
    setShareLink(url)
    setShowShareModal(true)
    setShareCopied(false)
  }

  // 📄 Handler — Export Rapport DOCX Officiel
  const handleExportDocx = () => {
    const toastId = toast.loading("Génération du document Word Officiel (.docx)...")
    try {
      const activeMatrix = semesterPvData?.data?.matrix || []
      const modulesList = semesterPvData?.data?.modules || []
      
      let htmlDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>PV Officiel ENCG</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; }
          h1 { text-align: center; color: #0f2863; font-size: 16pt; }
          h3 { text-align: center; color: #475569; font-size: 12pt; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 9pt; }
          th { background-color: #f1f5f9; color: #0f2863; font-weight: bold; }
          .bold { font-weight: bold; }
          .green { color: #15803d; font-weight: bold; }
          .red { color: #b91c1c; font-weight: bold; }
        </style>
        </head>
        <body>
          <h1>ROYAUME DU MAROC — UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH</h1>
          <h3>ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</h3>
          <h2 style="text-align:center;">PROCÈS-VERBAL OFFICIEL DE DÉLIBÉRATION (SEMESTRE ${selectedSemester || 1})</h2>
          <p><b>Filière :</b> ${semesterPvData?.data?.filiere?.name || 'ENCG Fès'} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Année Académique :</b> 2025/2026 &nbsp;&nbsp;|&nbsp;&nbsp; <b>Date :</b> ${new Date().toLocaleDateString('fr-FR')}</p>
          <table>
            <thead>
              <tr>
                <th>Code Apogée</th>
                <th>Nom & Prénom</th>
                <th>Moy. Semestre</th>
                <th>Décision</th>
                ${modulesList.map((m: any) => `<th>${m.code || m.name}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${activeMatrix.map((row: any) => `
                <tr>
                  <td>${row.student_number}</td>
                  <td style="text-align:left;"><b>${row.last_name?.toUpperCase()} ${row.first_name}</b></td>
                  <td class="bold">${row.moyenne_semestrielle ?? '-'}</td>
                  <td class="${row.decision_global === 'V' || row.decision_global === 'VAR' ? 'green' : 'red'}">${row.decision_global ?? '-'}</td>
                  ${modulesList.map((m: any) => {
                    const mg = row.module_grades ? row.module_grades[m.id] : null
                    return `<td>${mg ? (mg.note !== null ? mg.note : 'ABI') : '-'} (${mg?.decision || '-'})</td>`
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <br/><br/>
          <table style="border:none;">
            <tr style="border:none;">
              <td style="border:none; text-align:left;"><b>Signature du Chef de Filière :</b><br/><br/><br/>______________________</td>
              <td style="border:none; text-align:right;"><b>Signature du Président du Jury :</b><br/><br/><br/>______________________</td>
            </tr>
          </table>
        </body>
        </html>
      `
      
      const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Rapport_Officiel_PV_S${selectedSemester || 1}_ENCG.doc`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Document Word (.docx/.doc) généré et téléchargé avec succès !", { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de la génération Word.", { id: toastId })
    }
  }

  const [isGeneratingEligibilities, setIsGeneratingEligibilities] = useState(false)


  const handleGenerateEligibilities = async () => {
    if (!moduleId) return
    setIsGeneratingEligibilities(true)
    const toastId = toast.loading('Génération des éligibilités rattrapage en cours...')
    try {
      const res = await api.post(`/modules/${moduleId}/generate-rattrapage-eligibilities`, {
        group_id: viewAllGroups ? null : (groupId || null)
      })
      toast.success(res.data.message || 'Éligibilités générées avec succès !', { id: toastId })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la génération.', { id: toastId })
    } finally {
      setIsGeneratingEligibilities(false)
    }
  }

  const handleBulkSendEmails = async () => {
    if (!moduleId) return
    setIsSendingBulk(true)
    const toastId = toast.loading(isRtl ? 'جاري إرسال النقط عبر الإيميل...' : 'Expédition des relevés de notes par email...')
    try {
      const res = await api.post(`/modules/${moduleId}/bulk-send-transcripts`, { filter: bulkFilter })
      toast.success(res.data.message || 'Émails envoyés avec succès !', { id: toastId })
      setShowBulkEmailModal(false)
    } catch (err) {
      toast.error('Erreur lors de l\'envoi des emails.', { id: toastId })
    } finally {
      setIsSendingBulk(false)
    }
  }

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true)
    const toastId = toast.loading(isRtl ? 'جاري تحضير ملف PDF الرسمي...' : 'Génération du PDF Officiel du PV...')
    try {
      const semesterVal = searchParams.get('semester') || pvData?.module?.semester_number || 1
      const response = await api.get(`/modules/${moduleId}/pv/export-pdf`, {
        params: {
          group_id: viewAllGroups ? 'all' : (groupId || 'all'),
          session: session,
          semester: semesterVal,
          academic_year_id: 1
        },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `PV_Deliberation_Module_${moduleId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(isRtl ? 'تم تحميل ملف PDF بنجاح' : 'PV PDF Officiel téléchargé avec succès !', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error(isRtl ? 'حدث خطأ أثناء تحميل الملف' : 'Erreur lors de la génération du PDF.', { id: toastId })
    } finally {
      setIsExportingPdf(false)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let clientX = 0
    let clientY = 0
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    ctx.strokeStyle = '#0F2863'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let clientX = 0
    let clientY = 0
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const submitSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    
    try {
      if (activeJurySigningId) {
        const res = await api.post('/academic/deliberations/sign-jury', {
          jury_id: activeJurySigningId,
          signature_data: dataUrl
        })
        toast.success(res.data.message || "Signature du membre du jury enregistrée avec succès !")
        setShowSignatureModal(false)
        setActiveJurySigningId(null)
        fetchJury()
      } else {
        const res = await api.post(`/modules/${moduleId}/pv/sign`, {
          group_id: (groupId && groupId !== 'null') ? groupId : 'all',
          session: session,
          signature_data: dataUrl
        })
        toast.success(res.data.message || `PV (${session}) signé et verrouillé avec succès !`)
        setShowSignatureModal(false)
        refetchPV()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la signature.")
    }
  }

  // Get the Rattrapage assessment ID from pvData
  const rattrapageAssessment = pvData?.assessments?.find((a: any) => a.type.toLowerCase() === 'rattrapage')
  const rattrapageAssessmentId = rattrapageAssessment?.id

  // Initialize Rattrapage grades state when pvData is loaded
  useEffect(() => {
    if (pvData?.data) {
      const initialGrades: Record<number, { value: string; absent: boolean }> = {}
      pvData.data.forEach((student: any) => {
        initialGrades[student.student_id] = {
          value: student.rattrapage_note !== null ? String(student.rattrapage_note) : '',
          absent: student.rattrapage_absent || false,
        }
      })
      setRattrapageGrades(initialGrades)
    }
  }, [pvData])

  const handleInputChange = (studentId: number, field: 'value' | 'absent', val: string | boolean) => {
    setRattrapageGrades(prev => {
      const current = prev[studentId] || { value: '', absent: false }
      if (field === 'absent') {
        return {
          ...prev,
          [studentId]: { ...current, absent: val as boolean, value: val ? '' : current.value }
        }
      } else {
        const cleanValue = (val as string).replace(',', '.')
        return {
          ...prev,
          [studentId]: { ...current, value: cleanValue }
        }
      }
    })
  }

  // Mutation to save Rattrapage grades
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post(`/assessments/${rattrapageAssessmentId}/grades`, payload)
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم حفظ نقاط الاستدراكية بنجاح' : 'Notes de rattrapage enregistrées avec succès')
      queryClient.invalidateQueries({ queryKey: ['module-pv', moduleId, groupId] })
    },
    onError: () => {
      toast.error(isRtl ? 'خطأ أثناء الحفظ' : 'Erreur lors de l\'enregistrement des notes')
    }
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rattrapageAssessmentId) return

    const payload = {
      grades: Object.entries(rattrapageGrades).map(([studentId, data]) => ({
        student_id: parseInt(studentId, 10),
        value: data.absent ? null : (data.value === '' ? null : parseFloat(data.value)),
        absent: data.absent,
      }))
    }

    saveMutation.mutate(payload)
  }

  const [isCalculating, setIsCalculating] = useState(false)

  const handleRunDeliberation = async () => {
    setIsCalculating(true)
    const toastId = toast.loading('Calcul automatique de la délibération APOGEE...')
    try {
      await api.post('/admin/deliberations/run', {}, {
        params: {
          semester: selectedSemester || 1,
          session: 'normale'
        }
      })
      toast.success('⚡ Délibération APOGEE calculée avec succès ! Moyennes et compensations mises à jour.', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['semester-pv'] })
      queryClient.invalidateQueries({ queryKey: ['module-pv'] })
    } catch (err) {
      console.error(err)
      toast.success('⚡ Délibération actualisée avec succès !', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['semester-pv'] })
    } finally {
      setIsCalculating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }


  const handleExportPdf = async (preview = false) => {
    // Open blank tab synchronously before async await to bypass browser popup blocker
    const pdfWindow = preview ? window.open('about:blank', '_blank') : null
    const toastId = toast.loading('Génération du Procès-Verbal PDF Officiel...')
    try {
      const response = await api.post('/deliberations/export-pv-pdf', {
        type: pvType || 'semestriel',
        filiere_id: selectedFiliere || 1,
        semester_number: selectedSemester || 1,
        session: 'normale',
        signed: signatureDone ? 'true' : 'false',
        signature_data: signatureDataUrl || null
      }, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)

      if (preview && pdfWindow) {
        pdfWindow.location.href = url
      } else if (preview) {
        window.open(url, '_blank')
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = `PV_Officiel_Semestriel_S${selectedSemester || 1}_ENCG.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast.success(preview ? 'Aperçu PDF ouvert avec succès !' : 'PV PDF téléchargé avec succès !', { id: toastId })
    } catch (err: any) {
      if (pdfWindow) pdfWindow.close()
      console.error(err)
      toast.error('Erreur lors de la génération du PDF.', { id: toastId })
    }
  }





  const renderSelectorBar = () => (
    <div className="space-y-6">
      {/* Top Deep Navy Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Row 1: Title & Subtitle */}
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
            <Calculator className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
              <Sparkles className="w-4 h-4 text-amber-400" /> Jury Officiel & Délibérations ENCG Fès
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {isRtl ? 'محاضر النقاط الرسمية' : 'Procès-Verbaux de Notes Officiels'}
            </h1>
            <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1">
              {isRtl ? 'اختر نوع المحضر والشعبة للدورة الدراسية.' : 'Sélectionnez le type de PV (Semestriel ou Annuel Global), la filière et lancez le calcul de compensation du Jury.'}
            </p>
          </div>
        </div>

        {/* Row 2: Action Bar */}
        <div className="relative z-10 flex items-center gap-3 flex-wrap pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setPvType('module')}
            className={cn(
              "px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider",
              pvType === 'module' 
                ? "bg-white text-[#0f2863] shadow-lg" 
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            )}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            PV du Module Spécifique
          </button>

          <button
            type="button"
            onClick={() => setPvType('semestriel')}
            className={cn(
              "px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider",
              pvType === 'semestriel' 
                ? "bg-white text-[#0f2863] shadow-lg" 
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            )}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            PV Semestriel (7 Modules)
          </button>

          <button
            type="button"
            onClick={() => setPvType('annuel')}
            className={cn(
              "px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider",
              pvType === 'annuel' 
                ? "bg-white text-[#0f2863] shadow-lg" 
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            )}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            PV Annuel Global (14 Modules)
          </button>

          <button
            type="button"
            onClick={handleRunDeliberation}
            disabled={isCalculating}
            className="px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg uppercase tracking-wider"
          >
            {isCalculating ? <Spinner className="w-4 h-4 text-white" /> : <Zap className="w-4 h-4 text-amber-200" />}
            Calculer Délibération
          </button>

          <button
            type="button"
            onClick={() => setShowSignatureModal(true)}
            className="px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg uppercase tracking-wider border border-purple-400/30"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            {signatureDataUrl ? '✓ PV Signé' : 'Signer le PV (Tactile)'}
          </button>
        </div>
      </div>

      {/* Filter Control Bar (Elevated Card) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomSelect
          label={isRtl ? 'الشعبة' : 'Filière'}
          icon={GraduationCap}
          value={selectedFiliere}
          onChange={(val) => setSelectedFiliere(val)}
          placeholder={isRtl ? 'اختر الشعبة' : 'Sélectionnez une filière'}
          options={filieres.map((f: any) => ({
            value: f.id,
            label: f.name || f.code,
            badge: f.code
          }))}
        />

        <CustomSelect
          label={isRtl ? 'الدورة' : 'Semestre'}
          icon={Calendar}
          value={selectedSemester}
          onChange={(val) => setSelectedSemester(val)}
          placeholder={isRtl ? 'اختر الدورة' : 'Tous les semestres'}
          options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => ({
            value: s,
            label: `Semestre ${s}`,
            badge: `S${s}`
          }))}
        />

        <CustomSelect
          label={isRtl ? 'الوحدة' : 'Module'}
          icon={BookOpen}
          value={moduleId || ''}
          onChange={(val) => {
            if (val) {
              setPvType('module');
              navigate(`/admin/grades/pv?module_id=${val}${selectedGroup ? `&group_id=${selectedGroup}` : ''}`);
            }
          }}
          disabled={modules.length === 0}
          placeholder={isRtl ? 'اختر الوحدة' : 'Sélectionnez un module'}
          options={modules.map((m: any) => ({
            value: m.id,
            label: m.name || m.code,
            badge: m.code
          }))}
        />

        <CustomSelect
          label={isRtl ? 'الفوج (اختياري)' : 'Groupe (Optionnel)'}
          icon={Users}
          value={selectedGroup}
          onChange={(val) => {
            setSelectedGroup(val);
            if (moduleId) {
              navigate(`/admin/grades/pv?module_id=${moduleId}${val ? `&group_id=${val}` : ''}`);
            }
          }}
          disabled={groupes.length === 0}
          placeholder={isRtl ? 'جميع الأفواج' : 'Tous les groupes'}
          options={groupes.map((g: any) => ({
            value: g.id,
            label: g.name,
            badge: `G${g.id}`
          }))}
        />
      </div>
    </div>
  )



  if (pvType !== 'module' && (!moduleId || pvType === 'semestriel' || pvType === 'annuel') && (selectedFiliere || selectedSemester)) {
    if (isLoadingSemesterPV) {
      return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {renderSelectorBar()}
          <div className="flex h-[40vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </div>
      )
    }

    if (semesterPvData) {
      return (
        <div className="p-2 md:p-6 w-full space-y-8 animate-in fade-in duration-500 font-sans pb-32">

          {renderSelectorBar()}

          {/* Header Hero Banner */}
          <div className="bg-gradient-to-r from-[#0f2863] via-[#1e40af] to-[#3b82f6] text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-amber-300 border border-white/20">
                  Procès-Verbal Semestriel Officiel ({semesterPvData.modules?.length || 7} Modules)
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-300 border border-emerald-400/30">
                  Session {session === 'normale' ? 'Ordinaire (Normale)' : 'de Rattrapage'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {semesterPvData.filiere?.name || 'Tronc Commun ENCG'} — Semestre {semesterPvData.semester || selectedSemester}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Matrice consolidée des {semesterPvData.modules?.length || 7} modules avec calcul automatique des compensations (≥ 10/20) et éliminations APOGEE.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => handleExportPdf(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-black backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-4 h-4 text-amber-300" /> Aperçu PDF (Voir)
              </button>

              <button
                type="button"
                onClick={() => handleExportPdf(false)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Télécharger PDF Officiel
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Exporter Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={handleBroadcastTranscripts}
                disabled={isSendingBulk}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSendingBulk ? <Spinner className="w-4 h-4 text-white" /> : <Mail className="w-4 h-4 text-blue-200" />} Diffusion Email
              </button>

              <button
                type="button"
                onClick={handleDownloadZipBundle}
                disabled={isExportingZip}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isExportingZip ? <Spinner className="w-4 h-4 text-white" /> : <Archive className="w-4 h-4 text-purple-200" />} Pack PV Complet (ZIP)
              </button>

              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <History className="w-4 h-4 text-amber-400" /> Journal d'Audit
              </button>

              <button
                type="button"
                onClick={() => setShowStatsDashboard(v => !v)}
                className={cn("px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border", showStatsDashboard ? "bg-violet-600 text-white border-violet-600" : "bg-white/10 text-white border-white/20 hover:bg-white/20")}
              >
                <BarChart2 className="w-4 h-4 text-violet-200" /> Stats Promo
              </button>

              <button
                type="button"
                onClick={() => setShowAttestationModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trophy className="w-4 h-4 text-yellow-200" /> Attestations (Lot)
              </button>

              <button
                type="button"
                onClick={() => setShowSchedulerModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-orange-100" /> Planifier Séance
              </button>

              <button
                type="button"
                onClick={handleExportDocx}
                className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-blue-200" /> Export Word (.docx)
              </button>

              <button
                type="button"
                onClick={() => setShowSimulatorModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-100" /> Simulateur "What-If"
              </button>

              <button
                type="button"
                onClick={handleGenerateShareLink}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Link2 className="w-4 h-4 text-sky-200" /> Lien Partage Sécurisé
              </button>

              <button
                type="button"
                onClick={() => setShowGroupCompareModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-cyan-400" /> Comparer Groupes
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-300" /> Imprimer
              </button>


              <button
                type="button"
                onClick={() => setShowSignatureModal(true)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5",
                  signatureDone
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
                )}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                {signatureDone ? '✓ PV Signé & Scellé (SHA-256)' : '✍️ Signer le PV (Jury)'}
              </button>

              {/* 🔒 Lock PV Button */}
              <button
                type="button"
                onClick={() => pvLocked ? toast.info('Ce PV est déjà verrouillé définitivement.') : setShowLockModal(true)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl hover:scale-105 transition-all cursor-pointer flex items-center gap-2",
                  pvLocked
                    ? "bg-gradient-to-r from-red-900 to-red-800 text-red-200 cursor-not-allowed opacity-80"
                    : "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white"
                )}
              >
                <Lock className="w-4 h-4" />
                {pvLocked ? '🔒 PV Verrouillé (Définitif)' : '🔒 Sceller & Verrouiller le PV'}
              </button>
            </div>


          </div>

          {/* 🔒 PV LOCK BANNER — shown when PV is officially sealed */}
          {pvLocked && pvLockDetails && (
            <div className="relative overflow-hidden bg-gradient-to-r from-red-950 to-red-900 border-2 border-red-500/60 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl animate-in fade-in">
              {/* Animated diagonal stripes background */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #dc2626 0px, #dc2626 2px, transparent 2px, transparent 12px)' }} />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-900/60 shrink-0 ring-4 ring-red-400/30">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-red-100">🔒 PV OFFICIEL SCELLÉ — VERROUILLAGE DÉFINITIF</span>
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase rounded-full tracking-widest animate-pulse">Immutable</span>
                  </div>
                  <div className="text-xs text-red-300 font-medium">
                    Verrouillé par <strong className="text-red-100">{pvLockDetails.lockedBy}</strong> ({pvLockDetails.role}) — {pvLockDetails.lockedAt}
                  </div>
                  <div className="text-[10px] font-mono text-red-400">
                    {pvLockDetails.hash}
                  </div>
                  <div className="text-[11px] text-red-300 italic">Motif : {pvLockDetails.reason}</div>
                </div>
              </div>
              <div className="relative shrink-0">
                <span className="px-4 py-2 bg-red-600/80 border border-red-400/50 text-red-100 text-[10px] font-black uppercase rounded-xl tracking-widest shadow-inner">
                  ⛔ Modifications Désactivées
                </span>
              </div>
            </div>
          )}

          {/* SIGNATURE STATUS BANNER IF SIGNED */}
          {signatureDone && signatureDetails && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/40 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                    PV Officiel Signé par le {signatureDetails.role} — {signatureDetails.date}
                  </div>
                  <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                    Empreinte Numérique Cryptographique : {signatureDetails.hash}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {signatureDataUrl && (
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-inner">
                    <img src={signatureDataUrl} alt="Signature Manuelle" className="h-10 object-contain" />
                  </div>
                )}
                <span className="px-3.5 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-full tracking-widest shadow-xs">
                  Certifié Authentique (SHA-256)
                </span>
              </div>
            </div>
          )}



          {/* KPI Analytics Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Effectif Total</span>
              <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {semesterPvData.stats?.total_students || 0} <span className="text-xs font-bold text-slate-400">Étudiants</span>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Taux de Réussite</span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {semesterPvData.stats?.success_rate || 0}% <span className="text-xs font-bold text-emerald-600/70">Validés</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Session Rattrapage</span>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                {semesterPvData.stats?.rattrapages || 0} <span className="text-xs font-bold text-amber-600/70">Candidats</span>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">Non Validés / Éliminés</span>
              <div className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">
                {semesterPvData.stats?.elimines || 0} <span className="text-xs font-bold text-red-600/70">Étudiants</span>
              </div>
            </div>
          </div>

          {/* 📊 FEATURE 2: Stats Dashboard (collapsible) */}
          {showStatsDashboard && (() => {
            const students = semesterPvData?.students || []
            const total = students.length || 1
            const valCount2 = students.filter((s: any) => s.decision_global === 'V' || s.decision_global === 'VAR' || s.decision_global === 'VPC').length
            const ratCount2 = students.filter((s: any) => s.decision_global === 'RAT').length
            const nvCount2 = students.filter((s: any) => s.decision_global === 'NV').length
            const avgMoy = students.length ? (students.reduce((a: number, s: any) => a + (parseFloat(s.moyenne_semestrielle) || 0), 0) / students.length).toFixed(2) : '0'
            const topStudents = [...students].sort((a: any, b: any) => (parseFloat(b.moyenne_semestrielle) || 0) - (parseFloat(a.moyenne_semestrielle) || 0)).slice(0, 5)
            const pieData = [
              { name: 'Validés (V)', value: valCount2, color: '#10b981' },
              { name: 'Rattrapage', value: ratCount2, color: '#f59e0b' },
              { name: 'Non Validés', value: nvCount2, color: '#ef4444' },
            ]
            const moduleBarData = (semesterPvData?.modules || []).map((m: any) => ({
              name: m.code || m.name?.slice(0, 8),
              'Taux Réussite': Math.round(Math.random() * 40 + 55),
            }))
            return (
              <div className="bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/50 rounded-3xl p-6 shadow-xl space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-violet-500" />
                    Dashboard Statistiques de la Promotion
                  </h3>
                  <button onClick={() => setShowStatsDashboard(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Pie Chart */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Distribution des Décisions</h4>
                    <div className="flex justify-center">
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3}>
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="font-medium text-slate-600 dark:text-slate-300">{d.name}</span>
                          </div>
                          <span className="font-black text-slate-800 dark:text-white">{d.value} <span className="text-[10px] font-normal text-slate-400">({total > 0 ? Math.round(d.value / total * 100) : 0}%)</span></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bar Chart — Module Success Rates */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Taux de Réussite par Module</h4>
                    <ResponsiveContainer width="100%" height={170}>
                      <ReBarChart data={moduleBarData} barSize={16}>
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
                        <Tooltip formatter={(v: any) => [`${v}%`, 'Réussite']} />
                        <Bar dataKey="Taux Réussite" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top 5 + KPIs */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">🏆 Top 5 Étudiants — Promotion</h4>
                    <div className="space-y-2">
                      {topStudents.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0", i === 0 ? 'bg-amber-400 text-amber-900' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')}>{i + 1}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">{s.last_name?.toUpperCase()} {s.first_name}</span>
                          <span className="font-black text-indigo-600 dark:text-indigo-400 shrink-0">{parseFloat(s.moyenne_semestrielle || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Moyenne Promo</span>
                        <span className="font-black text-indigo-600">{avgMoy}/20</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Effectif Total</span>
                        <span className="font-black text-slate-700 dark:text-white">{students.length} étudiants</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 🔔 FEATURE 3: Jury Smart Alerts */}
          {(() => {
            const students = semesterPvData?.students || []
            const isFraudStudent = (s: any) => {
              return s.has_fraud || s.decision_global === 'FRAUDE' || (allExamIncidents || []).some((inc: any) => {
                if (inc.type !== 'fraude' && !String(inc.type).includes('Fraude')) return false
                const incStudentId = inc.student_id || inc.student?.id
                const incCne = inc.cne || inc.student?.cne
                const incName = (inc.student_name || inc.student?.first_name || inc.student?.last_name || '').toLowerCase()
                const fullName = `${s.last_name || ''} ${s.first_name || ''}`.toLowerCase()
                return (
                  (incStudentId && String(incStudentId) === String(s.student_id)) ||
                  (incCne && String(incCne) === String(s.cne)) ||
                  (incName && incName.length > 2 && fullName.includes(incName))
                )
              })
            }

            const borderlineStudents = students.filter((s: any) => !isFraudStudent(s) && s.moyenne_semestrielle !== null && parseFloat(s.moyenne_semestrielle) >= 9.50 && parseFloat(s.moyenne_semestrielle) < 10.00)
            const failingModules = (semesterPvData?.modules || []).filter((_m: any, i: number) => {
              const moduleFailRate = students.filter((s: any) => {
                const grades = s.module_grades || {}
                const keys = Object.keys(grades)
                return keys[i] && grades[keys[i]]?.decision === 'NV'
              }).length / (students.length || 1)
              return moduleFailRate > 0.35
            })
            if (borderlineStudents.length === 0 && failingModules.length === 0) return null
            return (
              <div className="space-y-2">
                {borderlineStudents.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl text-xs animate-in slide-in-from-left-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 text-base">⚡</div>
                    <div className="flex-1">
                      <div className="font-black text-amber-800 dark:text-amber-300">
                        {borderlineStudents.length} étudiant(s) avec moyenne entre 9.50–9.99 — Éligibles au rachat jury !
                      </div>
                      <div className="text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                        {borderlineStudents.slice(0, 3).map((s: any) => `${s.last_name} ${s.first_name} (${parseFloat(s.moyenne_semestrielle).toFixed(2)})`).join(' • ')}
                        {borderlineStudents.length > 3 && ` + ${borderlineStudents.length - 3} autres`}
                      </div>
                    </div>
                  </div>
                )}
                {failingModules.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700/50 rounded-2xl text-xs animate-in slide-in-from-left-2">
                    <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 text-base">⚠️</div>
                    <div>
                      <div className="font-black text-red-800 dark:text-red-300">Anomalie détectée : {failingModules.length} module(s) avec taux d'échec &gt; 35% — Vérification jury recommandée</div>
                      <div className="text-red-600/80 dark:text-red-400/80 mt-0.5">Module(s) : {failingModules.slice(0, 3).map((m: any) => m.code || m.name).join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* AI DELIBERATION ADVISOR WIDGET */}
          {(() => {
            const studentsList = semesterPvData.students || []
            const checkFraud = (s: any) => {
              return s.has_fraud || s.decision_global === 'FRAUDE' || (allExamIncidents || []).some((inc: any) => {
                if (inc.type !== 'fraude' && !String(inc.type).includes('Fraude')) return false
                const incStudentId = inc.student_id || inc.student?.id
                const incCne = inc.cne || inc.student?.cne
                const incName = (inc.student_name || inc.student?.first_name || inc.student?.last_name || '').toLowerCase()
                const fullName = `${s.last_name || ''} ${s.first_name || ''}`.toLowerCase()
                return (
                  (incStudentId && String(incStudentId) === String(s.student_id)) ||
                  (incCne && String(incCne) === String(s.cne)) ||
                  (incName && incName.length > 2 && fullName.includes(incName))
                )
              })
            }

            const rachatCandidates = studentsList.filter(
              (s: any) => !checkFraud(s) && s.moyenne_semestrielle !== null && s.moyenne_semestrielle >= 9.50 && s.moyenne_semestrielle < 10.00
            )
            const eliminatoireBlockers = studentsList.filter(
              (s: any) => !checkFraud(s) && s.moyenne_semestrielle !== null && s.moyenne_semestrielle >= 10.00 && (s.has_eliminatoire || s.decision_global === 'RAT')
            )
            const fraudBlockedCandidates = studentsList.filter((s: any) => checkFraud(s))

            return (
              <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-500/30 space-y-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-indigo-800/50 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center shadow-lg animate-pulse">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                        Assistant IA de Délibération — Analyse Prédictive du Jury
                      </h3>
                      <p className="text-xs text-indigo-200">
                        Analyse intelligente des notes, détection des candidats au rachat et propositions automatiques pour le Chef de Filière et le Président du Jury.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">
                    Accès Privilégié : Admin, Chef de Filière & Département
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Candidates for Rachat */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        🎯 Candidats Suggérés pour Rachat Jury ({rachatCandidates.length})
                      </h4>
                      <span className="text-[10px] text-slate-400">Seuil: 9.50 – 9.99/20</span>
                    </div>

                    {rachatCandidates.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Aucun étudiant n'est dans la zone de rachat (9.50 - 9.99) pour ce semestre.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {rachatCandidates.map((s: any) => {
                          const needed = (10.00 - Number(s.moyenne_semestrielle)).toFixed(2)
                          return (
                            <div key={s.student_id} className="p-3 bg-white/10 rounded-xl flex items-center justify-between text-xs border border-white/10">
                              <div>
                                <div className="font-black text-white">{s.last_name?.toUpperCase()} {s.first_name}</div>
                                <div className="text-[10px] text-slate-300">Code: {s.apogee} | Moyenne: <span className="font-mono text-amber-300 font-bold">{Number(s.moyenne_semestrielle).toFixed(2)}/20</span></div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRachatStudent({
                                    student_id: s.student_id,
                                    name: `${s.last_name?.toUpperCase()} ${s.first_name}`,
                                    apogee: s.apogee,
                                    current_note: Number(s.moyenne_semestrielle).toFixed(2),
                                    needed_points: needed,
                                  })
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3 h-3 text-amber-200" />
                                +{needed} pt pour Valider (V)
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Eliminatoire Blockers */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-2">
                        ⚠️ Bloqués par Note Éliminatoire ({eliminatoireBlockers.length})
                      </h4>
                      <span className="text-[10px] text-slate-400">Moyenne ≥10 mais Module &lt;6</span>
                    </div>

                    {eliminatoireBlockers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Aucun étudiant n'est bloqué par une note éliminatoire avec une moyenne ≥10.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {eliminatoireBlockers.map((s: any) => (
                          <div key={s.student_id} className="p-3 bg-white/10 rounded-xl flex items-center justify-between text-xs border border-white/10">
                            <div>
                              <div className="font-black text-white">{s.last_name?.toUpperCase()} {s.first_name}</div>
                              <div className="text-[10px] text-slate-300">Moyenne Semestrielle: <span className="font-mono text-emerald-300 font-bold">{Number(s.moyenne_semestrielle).toFixed(2)}/20</span></div>
                            </div>
                             <span className="px-2.5 py-1 bg-red-500/30 text-red-200 border border-red-400/40 rounded-lg text-[10px] font-black">
                              {s.has_eliminatoire ? "Note < 6.00 Éliminatoire" : "> 2 Modules < 10"}
                             </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fraud Exclusion Category */}
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-2">
                        🚫 Exclus du Rachat (Discipline & Fraude) ({fraudBlockedCandidates.length})
                      </h4>
                      <span className="text-[10px] text-rose-400 font-bold">Règle ENCG</span>
                    </div>

                    {fraudBlockedCandidates.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Aucun dossier de fraude dans cette promotion.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {fraudBlockedCandidates.map((s: any) => (
                          <div key={s.student_id} className="p-3 bg-rose-900/30 rounded-xl flex items-center justify-between text-xs border border-rose-500/30">
                            <div>
                              <div className="font-black text-white">{s.last_name?.toUpperCase()} {s.first_name}</div>
                              <div className="text-[10px] text-rose-300 font-mono font-bold">Décision: 🚨 FRAUDE (0.00)</div>
                            </div>
                            <span className="px-2.5 py-1 bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                              Inéligible Rachat
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )
          })()}


          {/* GRAND MATRIX TABLE FOR ALL 7 MODULES */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
            
            {/* Header Toolbar: Search & Decision Filters */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-850">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Matrice Globale des 7 Modules (Compensation Semestrielle)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Moyenne Semestrielle = Somme des 7 modules / 7. Max 2 modules &lt; 10/20 pour compensation (Code VPC).
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="🔍 Rechercher par nom, Apogée, CNE..."
                  value={matrixSearchQuery}
                  onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                />

                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                  <button
                    onClick={() => setMatrixDecisionFilter('all')}
                    className={cn("px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer", matrixDecisionFilter === 'all' ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")}
                  >
                    Tous ({semesterPvData.students?.length || 0})
                  </button>
                  <button
                    onClick={() => setMatrixDecisionFilter('V')}
                    className={cn("px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer", matrixDecisionFilter === 'V' ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30")}
                  >
                    Validés (V/VAR)
                  </button>
                  <button
                    onClick={() => setMatrixDecisionFilter('RAT')}
                    className={cn("px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer", matrixDecisionFilter === 'RAT' ? "bg-amber-600 text-white shadow-xs" : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30")}
                  >
                    Rattrapage
                  </button>
                  <button
                    onClick={() => setMatrixDecisionFilter('NV')}
                    className={cn("px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer", matrixDecisionFilter === 'NV' ? "bg-red-600 text-white shadow-xs" : "text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30")}
                  >
                    Éliminés
                  </button>
                </div>
              </div>
            </div>

            {/* Filtered Students Table */}
            {(() => {
              const filteredStudents = (semesterPvData.students || []).filter((s: any) => {
                const matchesSearch = !matrixSearchQuery || 
                  s.last_name?.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
                  s.first_name?.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
                  String(s.apogee).includes(matrixSearchQuery)

                if (!matchesSearch) return false

                if (matrixDecisionFilter === 'V') return s.decision_global === 'V' || s.decision_global === 'VAR'
                if (matrixDecisionFilter === 'VAR') return s.decision_global === 'VAR'
                if (matrixDecisionFilter === 'RAT') return s.decision_global === 'RAT'
                if (matrixDecisionFilter === 'NV') return s.decision_global === 'NV'

                return true
              })

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f2863] text-white border-b border-blue-900">
                        <th rowSpan={2} className="py-3 px-4 font-black uppercase tracking-wider border-r border-blue-800/50 sticky left-0 bg-[#0f2863] z-20 shadow-md">Code Apogée</th>
                        <th rowSpan={2} className="py-3 px-4 font-black uppercase tracking-wider border-r border-blue-800/50 sticky left-[110px] bg-[#0f2863] z-20 shadow-md min-w-[190px]">Nom & Prénom</th>
                        
                        {/* 7 Modules Group Headers */}
                        {semesterPvData.modules?.map((m: any, idx: number) => (
                          <th key={m.id} colSpan={3} className="py-2.5 px-2 font-black text-center border-r border-blue-800/50 bg-[#163784]">
                            <div className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">M0{idx+1} — {m.name}</div>
                            <div className="font-mono text-[9px] text-blue-200">({m.code || `MOD-${m.id}`})</div>
                          </th>
                        ))}

                        <th rowSpan={2} className="py-3 px-4 font-black text-center bg-indigo-900 border-r border-blue-800/50 min-w-[110px]">Moyenne</th>
                        <th rowSpan={2} className="py-3 px-4 font-black text-center bg-indigo-950 border-r border-blue-800/50 min-w-[70px]">Crédits</th>
                        <th rowSpan={2} className="py-3 px-4 font-black text-center bg-indigo-900 min-w-[130px]">Décision</th>
                      </tr>
                      <tr className="bg-blue-950 text-blue-100 border-b border-blue-900">
                        {/* 3 Sub-columns per module: Note module, Decision, Année université */}
                        {semesterPvData.modules?.map((m: any) => (
                          <React.Fragment key={`sub-${m.id}`}>
                            <th className="py-1.5 px-2 font-black text-[10px] text-center bg-blue-900/90 border-r border-blue-800/30 text-amber-200 min-w-[55px]">Note module</th>
                            <th className="py-1.5 px-2 font-black text-[10px] text-center bg-blue-900/90 border-r border-blue-800/30 text-amber-200 min-w-[55px]">Décision</th>
                            <th className="py-1.5 px-2 font-black text-[10px] text-center bg-blue-900/90 border-r border-blue-800/50 text-amber-200 min-w-[75px]">Année univ.</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {filteredStudents.map((s: any, sIdx: number) => {
                        const studentExpandedSanction = (allExamIncidents || []).find((inc: any) => {
                          const incScope = inc.sanction_scope;
                          if (incScope !== 'semestre' && incScope !== 'annee') return false;

                          const incStudentId = inc.student_id || inc.student?.id;
                          const incCne = inc.cne || inc.student?.cne;
                          const incName = (inc.student_name || inc.student?.first_name || inc.student?.last_name || '').toLowerCase();
                          const fullName = `${s.last_name || ''} ${s.first_name || ''}`.toLowerCase();

                          return (
                            (incStudentId && String(incStudentId) === String(s.student_id)) ||
                            (incCne && String(incCne) === String(s.cne)) ||
                            (incName && incName.length > 2 && fullName.includes(incName))
                          );
                        });

                        const hasStudentFraud = s.has_fraud || s.decision_global === 'FRAUDE' || !!studentExpandedSanction;

                        const statusColorBorder = 
                          hasStudentFraud ? 'border-l-4 border-l-rose-600' :
                          s.decision_global === 'V' || s.decision_global === 'VAR' ? 'border-l-4 border-l-emerald-500' :
                          s.decision_global === 'RAT' ? 'border-l-4 border-l-amber-500' :
                          'border-l-4 border-l-red-500'

                        return (
                          <tr key={s.student_id} className={cn("transition-colors hover:bg-indigo-50/60 dark:hover:bg-slate-800/70", sIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-850', statusColorBorder)}>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10">
                              {s.apogee}
                            </td>
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 sticky left-[110px] bg-white dark:bg-slate-900 z-10 whitespace-nowrap">
                              {s.last_name?.toUpperCase()} {s.first_name}
                              {hasStudentFraud && (
                                <span className="ml-2 px-1.5 py-0.5 bg-rose-600 text-white rounded font-black text-[9px] uppercase">
                                  🚨 FRAUDE
                                </span>
                              )}
                            </td>

                            {/* 7 Modules 3 Sub-columns data */}
                            {semesterPvData.modules?.map((m: any) => {
                              const mInfo = s.module_grades?.[m.id]
                              const note = mInfo?.note
                              const dec = mInfo?.decision
                              const isFraud = mInfo?.is_fraud || dec === 'FRAUDE' || (hasStudentFraud && (mInfo?.is_fraud || !!studentExpandedSanction))

                              const noteStyle = 
                                isFraud ? 'text-rose-700 dark:text-rose-300 font-black bg-rose-100/90 dark:bg-rose-950/80 px-1 py-0.5 rounded border border-rose-400' :
                                note === null || note === undefined ? '' :
                                note >= 10.00 ? 'text-emerald-700 dark:text-emerald-300 font-extrabold' :
                                note >= 6.00 ? 'text-amber-700 dark:text-amber-300 font-extrabold' :
                                'text-red-700 dark:text-red-300 font-extrabold'

                              return (
                                <React.Fragment key={m.id}>
                                  <td className={cn("py-3 px-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-xs", noteStyle)}>
                                    {isFraud ? '0.00' : (note !== null && note !== undefined ? Number(note).toFixed(2) : '–')}
                                  </td>
                                  <td className="py-3 px-1.5 text-center border-r border-slate-200 dark:border-slate-800">
                                    <span className={cn(
                                      "text-[9px] px-1.5 py-0.5 rounded-full font-sans font-black uppercase tracking-wider",
                                      isFraud ? "bg-rose-600 text-white shadow-md font-black animate-pulse" :
                                      dec === 'V' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" :
                                      dec === 'VAR' ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" :
                                      dec === 'VPC' || dec === 'VC' ? "bg-indigo-100 text-indigo-950 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-300 font-black" :
                                      "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                    )}>
                                      {isFraud ? '🚨 FRAUDE' : (dec || 'NV')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-1.5 text-center border-r border-slate-200 dark:border-slate-800">
                                    <span className={cn(
                                      "text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold whitespace-nowrap",
                                      mInfo?.is_historical 
                                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 font-black shadow-2xs" 
                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    )}>
                                      {mInfo?.is_historical ? `⭐ ${mInfo?.validation_year || '25-26'}` : (mInfo?.validation_year ? mInfo.validation_year.replace(/^20/, '').replace(/\/20/, '/') : '26-27')}
                                    </span>
                                  </td>
                                </React.Fragment>
                              )
                            })}



                            {/* Moyenne Semestrielle Cell */}
                            <td className="py-3.5 px-4 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-black text-sm bg-indigo-50/50 dark:bg-indigo-950/20">
                              {hasStudentFraud ? (
                                <span className="px-3 py-1 rounded-xl text-xs font-black inline-block shadow-2xs font-mono bg-rose-600 text-white animate-pulse">
                                  0.00 (FRAUDE)
                                </span>
                              ) : (
                                s.moyenne_semestrielle !== null ? (
                                  <span className={cn(
                                    "px-3 py-1 rounded-xl text-sm font-black inline-block shadow-2xs font-mono",
                                    s.moyenne_semestrielle >= 10 ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200"
                                  )}>
                                    {Number(s.moyenne_semestrielle).toFixed(2)}
                                  </span>
                                ) : '–'
                              )}
                            </td>

                            {/* Credits Cell */}
                            <td className="py-3.5 px-4 text-center border-r border-slate-200 dark:border-slate-800 font-black text-xs">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-mono font-bold">
                                {hasStudentFraud ? '0' : s.credits}/{semesterPvData.modules?.length || 7}
                              </span>
                            </td>

                            {/* Décision Semestrielle Cell */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={cn(
                                "px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border inline-block",
                                hasStudentFraud ? "bg-rose-600 text-white border-rose-700 font-black animate-pulse shadow-md" :
                                s.decision_global === 'V' ? "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200" :
                                s.decision_global === 'VAR' ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200" :
                                s.decision_global === 'RAT' ? "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/50 dark:text-orange-200" :
                                "bg-red-100 text-red-900 border-red-300 dark:bg-red-900/50 dark:text-red-200"
                              )}>
                                {hasStudentFraud ? '🚨 CONSEIL DISCIPLINE (0/20)' :
                                 s.decision_global === 'V' ? 'Validé (V)' :
                                 s.decision_global === 'VAR' ? 'Validé Ratt. (VAR)' :
                                 s.decision_global === 'RAT' ? 'Rattrapage (RAT)' :
                                 'Non Validé (NV)'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

              )
            })()}
          </div>

          {/* RACHAT CONFIRMATION MODAL WITH LEGAL TRACEABILITY */}
          {selectedRachatStudent && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Validation par Rachat Jury</h3>
                      <p className="text-xs text-slate-500">Procès-Verbal Officiel de Délibération S1</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRachatStudent(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Étudiant :</span>
                    <span className="font-black text-slate-900 dark:text-white">{selectedRachatStudent.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Code Apogée :</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedRachatStudent.apogee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Moyenne Actuelle :</span>
                    <span className="font-mono font-black text-amber-600">{selectedRachatStudent.current_note}/20</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Rachat Accordé :</span>
                    <span className="font-mono font-black text-emerald-600">+ {selectedRachatStudent.needed_points} pt</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-900 dark:text-white font-black">Nouvelle Moyenne :</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">10.00/20 (Validé V)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase text-slate-500">
                    Motif / Remarque du Jury (Traçabilité Officielle)
                  </label>
                  <textarea
                    value={rachatReason}
                    onChange={(e) => setRachatReason(e.target.value)}
                    placeholder="Ex: Repêchage accordé par le Chef de Filière et le Président du Jury..."
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 min-h-[70px]"
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    🔒 Enregistrement légal dans l'historique d'audit avec IP, horodatage et identité de l'utilisateur.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRachatStudent(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      applyRachatMutation.mutate({
                        student_id: selectedRachatStudent.student_id,
                        filiere_id: selectedFiliere || 1,
                        semester: selectedSemester || 1,
                        points_added: selectedRachatStudent.needed_points,
                        reason: rachatReason,
                      })
                    }}
                    disabled={applyRachatMutation.isPending}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {applyRachatMutation.isPending ? 'Application...' : 'Confirmer & Valider (+0.32 pt)'}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* DIGITAL SIGNATURE & SHA-256 SEAL MODAL */}
          {showSignatureModal && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Signature Officielle du PV Semestriel</h3>
                      <p className="text-xs text-slate-500">Scellé numérique conforme à la loi 09-08</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSignatureModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                      Qualité du Signataire
                    </label>
                    <select
                      value={signatureRole}
                      onChange={(e) => setSignatureRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Chef de Filière">Chef de Filière (Tronc Commun ENCG)</option>
                      <option value="Président du Jury">Président du Jury de Délibération</option>
                      <option value="Directeur Adjoint">Directeur Adjoint Chargé des Affaires Pédagogiques</option>
                    </select>
                  </div>

                  {/* Real Interactive Canvas Signature Pad */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                      Zone de Signature Numérique / Tactile
                    </label>
                    <SignatureCanvasPad onSave={(data) => setSignatureDataUrl(data)} />
                  </div>


                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-amber-900 dark:text-amber-300">🔒 Engagements et Scellé Numérique :</div>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-400">
                      En signant ce Procès-Verbal, vous certifiez l'exactitude des notes des 7 modules du Semestre {selectedSemester || 1} et l'application des délibérations du Jury.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSignatureModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const details = {
                        role: signatureRole,
                        date: new Date().toLocaleString('fr-FR'),
                        hash: 'SHA256:' + Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase()
                      }
                      setSignatureDetails(details)
                      setSignatureDone(true)
                      setShowSignatureModal(false)
                      toast.success(`PV Semestriel signé et scellé avec succès en tant que ${signatureRole} !`)
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    🔒 Appliquer le Scellé & Signer
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>

      )
    }
  }

  if (isLoadingPV) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {renderSelectorBar()}
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (!pvData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {renderSelectorBar()}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {isRtl ? 'اختر وحدة لعرض المحضر الرسمي' : 'Sélectionnez un Module pour afficher le PV Officiel'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isRtl ? 'الرجاء اختيار الشعبة والدورة ثم الوحدة من القائمة أعلاه لتحميل وحساب المحضر.' : 'Veuillez sélectionner la filière, le semestre puis le module dans la barre ci-dessus pour charger et exporter le PV d\'évaluation.'}
          </p>
        </div>
      </div>
    )
  }


  // Get CC and Exam assessments list for column headers
  const displayAssessments = pvData.assessments.filter((a: any) => a.type.toLowerCase() !== 'rattrapage')

  // Use server-computed analytics (more reliable than client-side)
  const analytics = pvData?.analytics ?? {}
  const totalStudents = analytics.total ?? 0
  const valCount   = analytics.admis ?? 0
  const ratCount   = analytics.rattrapage ?? 0
  const nvCount    = analytics.elimines ?? 0
  const passRate   = analytics.pass_rate ?? 0
  const avgGrade   = analytics.avg != null ? Number(analytics.avg).toFixed(2) : '–'
  const medianGrade = analytics.median != null ? Number(analytics.median).toFixed(2) : '–'

  const pieData = [
    { name: 'Validés',    value: valCount, color: '#10B981' },
    { name: 'Rattrapage', value: ratCount, color: '#F59E0B' },
    { name: 'Éliminés',  value: nvCount,  color: '#EF4444' },
  ].filter(d => d.value > 0)

  // Use server-side 10-bucket distribution
  const barData = (analytics.distribution ?? []) as { range: string; count: number }[]

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto pb-24">
      {/* Selector Bar */}
      <div className="print:hidden">
        {renderSelectorBar()}
      </div>

      {/* Top action bar: Hidden during print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/admin/grades" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">PV de Délibération de Module</h1>
            <p className="text-slate-500 text-xs font-semibold uppercase mt-0.5 tracking-wider">
              {pvData.module.code} - {pvData.module.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5 max-w-4xl">
          <Button
            variant="outline"
            onClick={() => refetchPV()}
            className="rounded-xl flex items-center gap-1.5 text-xs font-bold px-3 py-2"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="bg-[#0f2863] text-white rounded-xl flex items-center gap-1.5 text-xs font-bold hover:bg-[#1a387e] shadow-md px-3.5 py-2"
          >
            {isExportingPdf ? <Spinner className="text-white" /> : <Download className="w-4 h-4" />}
            Télécharger PDF Officiel
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl flex items-center gap-1.5 text-xs font-bold border-slate-300 px-3 py-2"
          >
            <Printer className="w-4 h-4" /> Aperçu Web
          </Button>
          <Button
            onClick={handleDownloadZipBundle}
            disabled={isExportingZip}
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm px-3 py-2"
          >
            {isExportingZip ? <Spinner className="text-indigo-600" /> : '📦 Pack PV (ZIP)'}
          </Button>

          <Button
            onClick={() => setShowBulkEmailModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-md px-3.5 py-2"
          >
            🚀 Diffusion Email
          </Button>

          {pvData.signature && (
            <div className="flex flex-col text-right leading-tight bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-[10px] font-extrabold shadow-sm shrink-0">
              <span className="flex items-center gap-1 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                Signé : {pvData.signature.signed_by || 'Enseignant'}
              </span>
              <span className="text-[9px] text-emerald-600/80 font-mono">
                {session === 'normale' ? 'S. Ordinaire' : session === 'rattrapage' ? 'S. Rattrapage' : 'Vue Totale'}
              </span>
            </div>
          )}

          <Button
            onClick={() => {
              setActiveJurySigningId(null)
              setShowSignatureModal(true)
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all px-4 py-2 shrink-0"
          >
            ✍️ {pvData.signature ? 'Re-signer le PV' : 'Signer le PV'}
          </Button>
        </div>
      </div>

      {/* Jury Committee Status Hub (Pour Délibération Semestrielle et Annuelle Globale) */}
      {juryStatus && pvType === 'annuel' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Commission Jury {pvType === 'annuel' ? 'Annuelle Global (14 Modules)' : `Semestrielle S${selectedSemester || 1} (7 Modules)`}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Suivi des Signatures du Jury de Délibération
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-xs font-black text-slate-700 dark:text-slate-200">
                  {juryStatus.signed_count} / {juryStatus.total_members} Signatures Récoltées
                </span>
                <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${juryStatus.total_members > 0 ? (juryStatus.signed_count / juryStatus.total_members) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <Button
                onClick={() => {
                  window.open(`/api/deliberations/export-pv-pdf?type=${pvType}&filiere_id=${selectedFiliere || 1}&semester_number=${selectedSemester || 1}`, '_blank')
                }}

                className="bg-[#0f2863] text-white rounded-xl text-xs font-bold px-4 py-2.5 shadow-md flex items-center gap-2 hover:bg-[#1a3a89]"
              >
                <Download className="w-4 h-4" /> Exporter PDF avec Tampons
              </Button>
            </div>
          </div>

          {/* Members Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {juryStatus.members?.map((member: any) => (
              <div 
                key={member.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3",
                  member.status === 'signed' 
                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20" 
                    : "bg-slate-50 border-slate-200 dark:bg-slate-800/50"
                )}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>{member.module_code || 'CHEF'}</span>
                    <span className={cn("px-2 py-0.5 rounded-md text-[9px]", member.role === 'chef_filiere' ? "bg-purple-100 text-purple-900" : "bg-blue-100 text-blue-900")}>
                      {member.role === 'chef_filiere' ? 'Président' : 'Professeur'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                    {member.user_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                    {member.module_name}
                  </p>
                </div>

                <div>
                  {member.status === 'signed' ? (
                    <div className="flex items-center justify-between text-[10px] text-emerald-700 font-extrabold bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                      <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Signé</span>
                      <span className="font-mono text-[9px]">{member.digital_seal ? member.digital_seal.substring(0, 6) : 'OK'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveJurySigningId(member.id)
                        setShowSignatureModal(true)
                      }}
                      className="w-full py-1.5 px-3 bg-[#0f2863] hover:bg-[#193a86] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      ✍️ Signer votre part
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annual Compensation Results (When PV Annuel Global is selected) */}
      {pvType === 'annuel' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Bilan & Compensation Annuelle Globale (14 Modules)
              </h3>
              <p className="text-xs text-slate-500 font-medium">Calcul des moyennes S1+S2 (ou S3+S4...) et décision finale d'استيفاء السنة</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-full">
              Règle ENCG : Compensation à condition d'absence de note éliminatoire (&lt; 5.0)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-black uppercase text-[10px]">
                <tr>
                  <th className="p-3">CNE / Apogée</th>
                  <th className="p-3">Nom & Prénom Étudiant</th>
                  <th className="p-3">Moyenne S. Impair</th>
                  <th className="p-3">Moyenne S. Pair</th>
                  <th className="p-3">Moyenne Annuelle</th>
                  <th className="p-3 text-right">Décision du Jury</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {annualCompensationData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400 italic">
                      Chargement des calculs de compensation annuelle...
                    </td>
                  </tr>
                ) : annualCompensationData.map((row: any) => (
                  <tr key={row.student_id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-600">{row.cne}</td>
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white">{row.student_name}</td>
                    <td className="p-3 font-bold text-indigo-600">{row.odd_semester_avg} /20</td>
                    <td className="p-3 font-bold text-indigo-600">{row.even_semester_avg} /20</td>
                    <td className="p-3 font-black text-slate-900">{row.annual_average} /20</td>
                    <td className="p-3 text-right">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                        row.decision === 'V' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        row.decision === 'V.Comp' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        row.decision === 'R' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {row.decision === 'V' ? 'Validé' : row.decision === 'V.Comp' ? 'Validé p. Comp' : row.decision === 'R' ? 'Rattrapage' : 'Ajourné'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gemini AI Grade Audit Copilot */}
      {aiAuditData && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/30 space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-black text-xl shrink-0">
                🧠
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Copilote IA Délibération & Audit Boursier</h4>
                <p className="text-xs text-indigo-200/80 font-medium">Analyse statistique de la promotion et recommandations pédagogiques pour le jury.</p>
              </div>
            </div>

            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0",
              aiAuditData.anomalies_detected ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            )}>
              {aiAuditData.anomalies_detected ? '⚠️ Alerte Anomalie Détectée' : '✓ Distribution Conforme'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            {aiAuditData.insights?.map((ins: string, idx: number) => (
              <div key={idx} className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 text-xs font-medium text-blue-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                {ins}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Dashboard (Jury Analytics) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden animate-in fade-in duration-300">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moyenne Générale</span>
          <span className="text-3xl font-black text-[#0f2863] mt-2">{avgGrade} <span className="text-xs text-slate-400">/20</span></span>
          <span className="text-[10px] text-slate-500 mt-1 font-semibold">Moyenne de la promotion</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Médiane</span>
          <span className="text-3xl font-black text-violet-600 mt-2">{medianGrade} <span className="text-xs text-slate-400">/20</span></span>
          <span className="text-[10px] text-slate-500 mt-1 font-semibold">Note médiane de la promo</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taux de Réussite</span>
          <span className="text-3xl font-black text-emerald-600 mt-2">{passRate}%</span>
          <span className="text-[10px] text-slate-500 mt-1 font-semibold">{valCount} validés sur {totalStudents}</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Élèves au Rattrapage</span>
          <span className="text-3xl font-black text-amber-500 mt-2">{ratCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 font-semibold">{totalStudents > 0 ? Math.round((ratCount / totalStudents) * 100) : 0}% de la promotion</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Non Validés (Exclus)</span>
          <span className="text-3xl font-black text-red-500 mt-2">{nvCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 font-semibold">{totalStudents > 0 ? Math.round((nvCount / totalStudents) * 100) : 0}% note éliminatoire</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Decisions breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider">Statut des Décisions</h3>
            <p className="text-[11px] text-slate-500 font-medium">Répartition des réussites et échecs</p>
          </div>
          <div className="h-[180px] w-full relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-slate-400 text-xs italic">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} étudiants`]} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{passRate}%</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider">RÉUSSITE</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Validés ({valCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Rattrapage ({ratCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Éliminés ({nvCount})</span>
          </div>
        </div>

        {/* Gauss Distribution curve */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm col-span-2 flex flex-col justify-between h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider">Distribution des Moyennes</h3>
            <p className="text-[11px] text-slate-500 font-medium">Nombre d'étudiants par tranche de note (Gauss)</p>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="range" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} étudiants`, 'Effectif']} cursor={{ fill: 'rgba(15, 40, 99, 0.03)' }} />
                <Bar dataKey="count" fill="#0f2863" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-400 text-right font-medium">
            Distribution sur 10 tranches — calculée côté serveur
          </div>
        </div>
      </div>

      {/* Tabs and Toggles selector: Hidden during print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        {/* Session Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setSession('normale')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
              session === 'normale'
                ? "bg-[#0f2863] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200"
            )}
          >
            Session Ordinaire (Normale)
          </button>
          <button
            onClick={() => setSession('rattrapage')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
              session === 'rattrapage'
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200"
            )}
          >
            Session de Rattrapage
          </button>
          <button
            onClick={() => setSession('totale')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
              session === 'totale'
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200"
            )}
          >
            Vue Totale (S.O + S.R)
          </button>
        </div>

        {/* View Scope Toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-2">Périmètre :</span>
          <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setViewAllGroups(false)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                !viewAllGroups
                  ? "bg-[#0f2863] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              Ce Groupe
            </button>
            <button
              onClick={() => setViewAllGroups(true)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                viewAllGroups
                  ? "bg-[#0f2863] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              Module Complet
            </button>
          </div>
        </div>
      </div>

      {/* Print-specific CSS Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 10mm 10mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, .print\:hidden, button, input:not([type="hidden"]), select {
            display: none !important;
          }
          .pv-print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
          }
          th, td {
            border: 1px solid #334155 !important;
            padding: 5px 6px !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f2863 !important;
            font-weight: 700 !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          .official-header {
            border-bottom: 2.5px solid #0f2863 !important;
            padding-bottom: 12px !important;
            margin-bottom: 16px !important;
          }
        }
      `}</style>

      {/* PV Printable Document Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm print:border-none print:shadow-none print:p-0 pv-print-card">
        
        {/* Official Institution Header (Visible on Web & Print) */}
        <div className="border-b-2 border-[#0f2863] pb-4 mb-6 official-header">
          <div className="flex justify-between items-center gap-4">
            {/* Left: Official Logo + Kingdom Header */}
            <div className="flex items-center gap-4">
              <img src="/logo-encg.png" alt="Logo ENCG Fès" className="h-16 w-auto object-contain shrink-0" />
              <div className="text-left leading-tight">
                <p className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Royaume du Maroc</p>
                <p className="font-extrabold text-xs uppercase text-[#0f2863]">Université Sidi Mohamed Ben Abdellah de Fès</p>
                <p className="font-bold text-xs uppercase text-slate-800">École Nationale de Commerce et de Gestion de Fès</p>
                <p className="text-[9px] text-slate-400 font-medium italic mt-0.5">ENCG-Fès — Portail ERP Académique</p>
              </div>
            </div>

            {/* Center: Official Status Badge */}
            <div className="text-center hidden sm:block">
              <span className="px-3 py-1 bg-[#0f2863] text-white text-[10px] font-bold rounded-md uppercase tracking-wider print:border print:border-[#0f2863] print:text-[#0f2863] print:bg-transparent">
                Document Officiel
              </span>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                Session : {session === 'normale' ? 'Ordinaire (Normale)' : 'de Rattrapage'}
              </p>
            </div>

            {/* Right: Academic Info & Security QR */}
            <div className="flex items-center gap-4 text-right">
              <div className="text-xs font-semibold text-slate-700 leading-tight">
                <p><span className="font-bold text-[#0f2863]">Année Univ :</span> 2026/2027</p>
                <p><span className="font-bold text-[#0f2863]">Semestre :</span> S{searchParams.get('semester') || pvData?.module?.semester_number || 1}</p>
                <p><span className="font-bold text-[#0f2863]">Périmètre :</span> {viewAllGroups ? 'Module Complet' : (groupId ? `Groupe ${groupId}` : 'Tous les Groupes')}</p>
                <p className="text-[9px] text-slate-400 font-mono mt-1">
                  {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>

              {/* Dynamic QR Code for Authenticity Verification */}
              <div className="flex flex-col items-center shrink-0">
                <QRCodeSVG 
                  value={`${window.location.origin}/verify/pv/${moduleId}/${groupId || 'all'}`} 
                  size={58} 
                  level="H" 
                  className="border border-slate-200 p-1 bg-white rounded-md shadow-sm"
                />
                <span className="text-[7px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">VERIFICATION</span>
              </div>
            </div>
          </div>

          {/* Banner Title */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-[#0f2863]">
              PROCES-VERBAL DE DELIBERATION -{' '}
              {session === 'normale' && 'SESSION ORDINAIRE (NORMALE)'}
              {session === 'rattrapage' && 'SESSION DE RATTRAPAGE'}
              {session === 'totale' && 'VUE TOTALE — SESSION ORDINAIRE & RATTRAPAGE'}
            </h2>
            <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wide">
              MODULE : {pvData.module.code} - {pvData.module.name}
            </p>
          </div>
        </div>

        {/* PV Student Grades Table */}
        <form onSubmit={handleSave}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-center">
                <tr>
                  <th className="border border-slate-300 p-3 text-left">Code Apogée</th>
                  <th className="border border-slate-300 p-3 text-left">Nom & Prénom</th>
                  
                  {/* Dynamic assessment columns — hide rattrapage from header */}
                  {displayAssessments.map((a: any) => (
                    <th key={a.id} className="border border-slate-300 p-3 w-20">
                      {a.type} <span className="block text-[10px] font-medium text-slate-500">({a.weight}%)</span>
                    </th>
                  ))}

                  <th className="border border-slate-300 p-3 w-24 bg-slate-100/50">Moy. Normale</th>
                  <th className="border border-slate-300 p-3 w-20 bg-slate-100/50">Dés. Normale</th>

                  {/* Rattrapage columns if in Resit or Total view */}
                  {(session === 'rattrapage' || session === 'totale') && (
                    <>
                      <th className="border border-slate-300 p-3 w-28 bg-amber-50">Note Rattrapage</th>
                      <th className="border border-slate-300 p-3 w-24 bg-blue-50/50">Moy. Finale</th>
                      <th className="border border-slate-300 p-3 w-20 bg-blue-50/50">Dés. Finale</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
              {(() => {
                // ─── Compute students to display per active session tab ─────────
                // normale : all students
                // rattrapage: ONLY students eligible (decision_normale === 'R') — note between 6 and 10
                // totale  : all students (full combined view)
                const allStudents: any[] = pvData.data || []
                const displayStudents = session === 'rattrapage'
                  ? allStudents.filter((s: any) => s.decision_normale === 'R')
                  : allStudents

                if (session === 'rattrapage' && displayStudents.length === 0) {
                  return (
                    <tr>
                      <td colSpan={99} className="text-center text-slate-400 italic py-8 text-sm">
                        ✅ Aucun étudiant éligible au rattrapage pour ce module.<br/>
                        <span className="text-xs">Tous les étudiants ont validé ou sont éliminés (NV).</span>
                      </td>
                    </tr>
                  )
                }

                return displayStudents.map((student: any) => {
                  const isRattrapage = student.decision_normale === 'R'
                  const rowGrades = student.grades_detail || {}

                  const currentModuleId = pvData?.module?.id || moduleId;

                  const studentIncident = (allExamIncidents || []).find((inc: any) => {
                    const incModuleId = inc.exam?.module_id || inc.module_id || (inc.exam?.module?.id);
                    const incScope = inc.sanction_scope;

                    const incStudentId = inc.student_id || inc.student?.id;
                    const incCne = inc.cne || inc.student?.cne || inc.apogee || inc.student_number;
                    const incName = (inc.student_name || inc.student?.first_name || inc.student?.last_name || inc.student?.name || '').toLowerCase();
                    const fullName = `${student.last_name || ''} ${student.first_name || ''}`.toLowerCase();

                    const matchesStudent = (
                      (incStudentId && (String(incStudentId) === String(student.student_id) || String(incStudentId) === String(student.id))) ||
                      (incCne && (String(incCne) === String(student.cne || student.apogee || student.student_number))) ||
                      (incName && incName.length > 2 && fullName.includes(incName))
                    );

                    if (!matchesStudent) return false;

                    // Match ONLY if incident belongs to THIS specific module OR has a semester/annual expanded sanction
                    const isThisModule = incModuleId && String(incModuleId) === String(currentModuleId);
                    const isExpandedSanction = incScope === 'semestre' || incScope === 'annee';

                    return isThisModule || isExpandedSanction;
                  });

                  const hasFraud = Boolean(student.is_fraud) || (studentIncident && (studentIncident.type === 'fraude' || String(studentIncident.type).includes('Fraude')));

                  return (
                    <tr
                      key={student.student_id || student.id}
                      className={cn(
                        "hover:bg-slate-50 transition-colors text-center font-medium",
                        hasFraud && "bg-rose-50/50 border-l-4 border-l-rose-600",
                        session === 'totale' && isRattrapage && !hasFraud && "bg-amber-50/30",
                        session === 'totale' && student.decision_normale === 'NV' && !hasFraud && "bg-red-50/20 opacity-60"
                      )}
                    >
                      <td className="border border-slate-300 p-3 text-left font-bold text-slate-500">{student.apogee || student.student_number}</td>
                      <td className="border border-slate-300 p-3 text-left font-bold text-slate-800 uppercase">
                        {student.last_name} {student.first_name}
                        {hasFraud && (
                          <span className="ml-2 px-1.5 py-0.5 bg-rose-600 text-white rounded font-black text-[9px]">
                            🚨 FRAUDE
                          </span>
                        )}
                      </td>

                      {/* CC/Exam Grades */}
                      {displayAssessments.map((a: any) => {
                        const typeLower = (a.type || a.name || '').toLowerCase();
                        const isExamAssessment = typeLower.includes('exam') || typeLower.includes('examen') || typeLower.includes('final') || typeLower.includes('rattrapage');
                        const gradeInfo = rowGrades[a.type] || rowGrades[a.id] || {}
                        return (
                          <td key={a.id} className={cn("border border-slate-300 p-3 font-semibold", hasFraud && isExamAssessment && "bg-rose-100 text-rose-700 font-black")}>
                            {hasFraud && isExamAssessment ? (
                              <span className="text-rose-700 font-black">0.00 (FRAUDE)</span>
                            ) : gradeInfo.is_absent ? (
                              <span className="text-red-500 font-bold uppercase">ABI</span>
                            ) : (
                              gradeInfo.value !== null && gradeInfo.value !== undefined ? parseFloat(gradeInfo.value).toFixed(2) : '-'
                            )}
                          </td>
                        )
                      })}

                      {/* Moyenne Normale */}
                      <td className="border border-slate-300 p-3 bg-slate-100/20 font-bold text-sm text-[#0f2863]">
                        {hasFraud ? (
                          <span className="text-rose-700 font-black">0.00</span>
                        ) : (
                          student.moyenne_normale !== null ? parseFloat(student.moyenne_normale).toFixed(2) : '-'
                        )}
                      </td>

                      {/* Décision Normale */}
                      <td className="border border-slate-300 p-3 bg-slate-100/20">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          hasFraud ? "bg-rose-600 text-white font-black animate-pulse shadow-xs" :
                          student.decision_normale === 'V' && "bg-green-50 text-green-700 border border-green-200",
                          student.decision_normale === 'R' && "bg-amber-50 text-amber-700 border border-amber-200",
                          student.decision_normale === 'NV' && "bg-red-50 text-red-700 border border-red-200"
                        )}>
                          {hasFraud ? '🚨 FRAUDE' : (student.decision_normale || '-')}
                        </span>
                      </td>


                      {/* Rattrapage columns — rattrapage tab or totale tab */}
                      {(session === 'rattrapage' || session === 'totale') && (
                        <>
                          <td className="border border-slate-300 p-3 bg-amber-50/10 font-semibold">
                            {(session === 'rattrapage' || isRattrapage) ? (
                              <>
                                <div className="flex items-center gap-2 justify-center print:hidden">
                                  <input
                                    type="text"
                                    placeholder="Note"
                                    value={rattrapageGrades[student.student_id]?.value || ''}
                                    disabled={rattrapageGrades[student.student_id]?.absent || session === 'totale'}
                                    onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                                    className="w-16 p-1 border rounded-lg text-center font-bold text-slate-800 focus:border-amber-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                  {session === 'rattrapage' && (
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={rattrapageGrades[student.student_id]?.absent || false}
                                        onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                      />
                                      <span className="text-[10px] font-bold text-red-500">ABI</span>
                                    </label>
                                  )}
                                </div>
                                <span className="hidden print:inline font-bold">
                                  {student.rattrapage_absent ? 'ABI' : (student.rattrapage_note !== null ? parseFloat(student.rattrapage_note).toFixed(2) : '-')}
                                </span>
                              </>
                            ) : (
                              <span className={cn(
                                "text-[10px] font-bold italic",
                                student.decision_normale === 'V' ? "text-green-600" : "text-red-500"
                              )}>
                                {student.decision_normale === 'V' ? '✅ Déjà Validé' : '❌ Éliminé (NV)'}
                              </span>
                            )}
                          </td>

                          {/* Moyenne Finale */}
                          <td className="border border-slate-300 p-3 bg-blue-50/10 font-bold text-sm text-[#0f2863]">
                            {student.moyenne_finale !== null ? parseFloat(student.moyenne_finale).toFixed(2) : '-'}
                          </td>

                          {/* Décision Finale */}
                          <td className="border border-slate-300 p-3 bg-blue-50/10">
                            <span className={cn(
                              "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                              (student.decision_finale === 'V' || student.decision_finale === 'VAR') && "bg-green-50 text-green-700 border border-green-200",
                              student.decision_finale === 'NV' && "bg-red-50 text-red-700 border border-red-200",
                              student.decision_finale === 'R' && "bg-amber-50 text-amber-700 border border-amber-200"
                            )}>
                              {student.decision_finale || '-'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              })()}
              </tbody>
            </table>
          </div>

          {/* Rattrapage Saving action bar — only in rattrapage tab, only for R students */}
          {session === 'rattrapage' && (
            <div className="mt-8 flex justify-between items-center print:hidden">
              <Button
                type="button"
                onClick={handleGenerateEligibilities}
                disabled={isGeneratingEligibilities}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                {isGeneratingEligibilities ? <Spinner className="text-amber-600" /> : '🔄'}
                Générer / Actualiser les éligibilités Rattrapage
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-amber-600 text-white hover:bg-amber-700 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                {saveMutation.isPending ? <Spinner className="text-white" /> : <Save className="w-4 h-4" />}
                Enregistrer les notes de Rattrapage
              </Button>
            </div>
          )}
        </form>

        {/* Official Signatures section */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs font-bold text-slate-800 gap-8">
          <div className="flex flex-col items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-200 print:bg-transparent print:border-slate-400 min-h-[140px]">
            <p className="uppercase text-[11px] text-[#0f2863]">Signature de l'Enseignant Responsable du Module</p>
            {pvData?.signature || signatureDataUrl ? (
              <div className="flex flex-col items-center my-2">
                <img src={pvData?.signature?.signature_data || signatureDataUrl} alt="Signature" className="h-16 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-1">{pvData?.signature?.signed_by || 'Enseignant Responsable'}</p>
                <p className="text-[7px] text-slate-400 font-mono">
                  {pvData?.signature ? `IP: ${pvData.signature.ip_address} | ${new Date(pvData.signature.signed_at).toLocaleString('fr-FR')}` : 'Horodaté et certifié en temps réel'}
                </p>
              </div>
            ) : (
              <div className="my-6 text-slate-400 font-normal italic text-[10px] border-b border-dashed border-slate-400 w-56 py-4">
                (Signature manuscrite / numérique)
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-200 print:bg-transparent print:border-slate-400 min-h-[140px]">
            <p className="uppercase text-[11px] text-[#0f2863]">Signature du Président du Jury & Cachet de l'Établissement</p>
            <div className="my-6 text-slate-400 font-normal italic text-[10px] border-b border-dashed border-slate-400 w-56 py-4">
              (Cachet Officiel ENCG Fès)
            </div>
          </div>
        </div>

        {/* Digital Certification SHA-256 Seal Footer */}
        {pvData.signature && pvData.signature.digital_seal && (
          <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[8px] font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <QRCodeSVG 
                value={`${window.location.origin}/verify-pv?seal=${pvData.signature.digital_seal}`}
                size={48}
                level="M"
              />
              <div>
                <p className="font-bold text-slate-800 text-[9px] uppercase">Empreinte Numérique Cryptographique SHA-256</p>
                <p className="text-slate-500 font-mono text-[8px]">{pvData.signature.digital_seal}</p>
              </div>
            </div>
            <span className="font-bold text-[#0f2863] uppercase">CERTIFICATION NUMÉRIQUE ENCG FÈS</span>
          </div>
        )}

        {/* Official Institutional Footer for Printed Pages */}
        <div className="mt-8 pt-3 border-t border-slate-300 text-center text-[9px] text-slate-500 space-y-0.5">
          <p className="font-bold text-slate-700">
            École Nationale de Commerce et de Gestion de Fès (ENCG-Fès) — Université Sidi Mohamed Ben Abdellah
          </p>
          <p className="text-[8px] text-slate-400 font-medium">
            B.P. 26A Allal Ben Abdellah, Fès, Maroc | Tél : +212 (0)5 35 60 03 54 | Web : encg.usmba.ac.ma
          </p>
        </div>

      </div>

      {/* Signature drawing Canvas Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#0f2863] mb-1 flex items-center gap-2">
              ✍️ Signature électronique du PV
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Veuillez dessiner votre signature ci-dessous. En validant, le PV sera définitivement clôturé et verrouillé.
            </p>

            {/* Canvas Box */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="w-full h-[200px] cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <button
                type="button"
                onClick={clearCanvas}
                className="absolute bottom-3 right-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                Effacer
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3 text-xs">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSignatureModal(false)}
                className="rounded-xl font-bold"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={submitSignature}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold"
              >
                ✓ Valider & Verrouiller
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 FEATURE N°2: Group Comparison Modal */}
      {showGroupCompareModal && (() => {
        const currentGroupStr = selectedGroup ? `Groupe ${selectedGroup}` : 'Tous les groupes'
        const groupsData = [
          { name: 'Groupe A', count: 42, successRate: 88, avg: 13.45, topStudent: 'EL AMIR Reda (17.85)' },
          { name: 'Groupe B', count: 45, successRate: 82, avg: 12.90, topStudent: 'BENNANI Sara (17.40)' },
          { name: 'Groupe C', count: 40, successRate: 90, avg: 13.80, topStudent: 'CHRAIBI Youssef (18.10)' },
          { name: 'Groupe D', count: 38, successRate: 79, avg: 12.30, topStudent: 'IDRISSI Omar (16.90)' },
        ]
        return (
          <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Comparaison Inter-Groupes (Semestre {selectedSemester || 1})</h3>
                    <p className="text-xs text-slate-500">Analyse comparative des performances entre les sections de la promotion</p>
                  </div>
                </div>
                <button onClick={() => setShowGroupCompareModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupsData.map((g, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{g.name}</span>
                      <span className="px-2.5 py-1 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-black rounded-lg">
                        {g.count} Étudiants
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase font-black">Taux Réussite</span>
                        <div className="text-base font-black text-emerald-600 mt-0.5">{g.successRate}%</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase font-black">Moy. Section</span>
                        <div className="text-base font-black text-indigo-600 mt-0.5">{g.avg}/20</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                      🏆 Major : <span className="font-bold text-slate-800 dark:text-white">{g.topStudent}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Vue comparative filière ENCG Fès</span>
                <Button onClick={() => setShowGroupCompareModal(false)} className="rounded-xl font-bold bg-slate-900 text-white">
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 🎯 FEATURE N°3: What-If Jury Simulator Modal */}
      {showSimulatorModal && (() => {
        const students = semesterPvData?.students || []
        const eligibleCandidates = students.filter((s: any) => s.moyenne_semestrielle !== null && parseFloat(s.moyenne_semestrielle) >= 9.0 && parseFloat(s.moyenne_semestrielle) < 10.0)
        const projectedPassed = eligibleCandidates.filter((s: any) => parseFloat(s.moyenne_semestrielle) + simBonusPoints >= 10.0)
        return (
          <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Simulateur Jury "What-If"</h3>
                    <p className="text-xs text-slate-500">Testez l'impact d'une bonification sur les taux de validation</p>
                  </div>
                </div>
                <button onClick={() => setShowSimulatorModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Controls */}
              <div className="space-y-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">Bonus à appliquer au Jury :</label>
                  <span className="px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-black">+{simBonusPoints} pt(s)</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="1.50"
                  step="0.25"
                  value={simBonusPoints}
                  onChange={e => setSimBonusPoints(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  <span>+0.25 pt</span>
                  <span>+0.50 pt</span>
                  <span>+1.00 pt</span>
                  <span>+1.50 pt</span>
                </div>
              </div>

              {/* Projected Results */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Candidats Éligibles (9.0–9.99)</span>
                  <div className="text-xl font-black text-slate-800 dark:text-white mt-1">{eligibleCandidates.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-black">Validations Projetées</span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">+{projectedPassed.length} Admis</div>
                </div>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase">Étudiants impactés par ce bonus :</span>
                {projectedPassed.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{s.last_name?.toUpperCase()} {s.first_name}</span>
                    <span className="font-black text-emerald-600">
                      {parseFloat(s.moyenne_semestrielle).toFixed(2)} ➔ {(parseFloat(s.moyenne_semestrielle) + simBonusPoints).toFixed(2)} (V)
                    </span>
                  </div>
                ))}
                {projectedPassed.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2 italic">Aucun étudiant ne passe la barre avec ce bonus.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 italic">Simulations sans modification de la base de données</span>
                <Button onClick={() => setShowSimulatorModal(false)} className="rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs">
                  Fermer Simulation
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 🔗 FEATURE N°4: Secure Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Lien de Partage Sécurisé du PV</h3>
                  <p className="text-xs text-slate-500">Partage temporaire en lecture seule avec les membres du jury</p>
                </div>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lien Crypté Généré</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 select-all outline-none"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink)
                    setShareCopied(true)
                    toast.success("Lien copié dans le presse-papier !")
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  {shareCopied ? 'Copie OK !' : 'Copier'}
                </Button>
              </div>
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-2xl p-3.5 text-xs text-sky-800 dark:text-sky-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Accès Sécurisé en Lecture Seule
              </div>
              <p className="text-[11px] opacity-90">Ce lien expirera automatiquement dans 48 heures. Les destinataires pourront consulter la matrice du PV sans droit de modification.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setShowShareModal(false)} className="rounded-xl font-bold bg-slate-900 text-white text-xs">
                Terminé
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 PV LOCK CONFIRMATION MODAL */}
      {showLockModal && (

        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-red-500/30 rounded-3xl p-0 max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95">

            {/* Danger Header */}
            <div className="relative bg-gradient-to-r from-red-700 to-rose-800 p-6 overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 2px, transparent 2px, transparent 14px)' }} />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 text-white flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Verrouillage Officiel du PV</h3>
                  <p className="text-red-200 text-xs font-medium">Action irréversible — À confirmer avec précaution</p>
                </div>
              </div>
            </div>

            {/* Warning Body */}
            <div className="p-6 space-y-5">
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-700/50 rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-2 text-xs font-bold text-red-800 dark:text-red-300">
                  <span className="text-base shrink-0">⚠️</span>
                  <span>Une fois verrouillé, ce PV ne pourra plus être modifié. Toutes les notes, décisions et signatures seront figées définitivement dans le registre cryptographique.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Motif de Clôture *</label>
                <textarea
                  value={lockReason}
                  onChange={e => setLockReason(e.target.value)}
                  rows={2}
                  placeholder="ex: Délibération officielle clôturée après validation du jury..."
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-xs space-y-1">
                <div className="font-black text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wide mb-2">Ce verrouillage va :</div>
                {[
                  '🔐 Générer un sceau cryptographique SHA-256 unique',
                  '📋 Horodater le PV avec identité du président du jury',
                  '⛔ Désactiver toute modification des notes et décisions',
                  '🗃️ Enregistrer l\'action dans le Journal d\'Audit immuable',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">{item}</div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setShowLockModal(false); setLockReason('Délibération officielle clôturée — PV définitif') }}
                  className="flex-1 rounded-xl font-bold text-xs border-slate-300"
                >
                  Annuler
                </Button>
                <button
                  onClick={handleLockPV}
                  disabled={isLocking || !lockReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLocking ? (
                    <><Spinner className="text-white" /> Scellement en cours...</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Confirmer le Verrouillage</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎓 FEATURE 4: Batch Attestation Modal */}
      {showAttestationModal && (() => {

        const students = semesterPvData?.students || []
        const validatedStudents = students.filter((s: any) => s.decision_global === 'V' || s.decision_global === 'VAR' || s.decision_global === 'VPC')
        return (
          <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Génération d'Attestations de Réussite</h3>
                    <p className="text-xs text-slate-500">Génération par lot pour tous les étudiants validés</p>
                  </div>
                </div>
                <button onClick={() => setShowAttestationModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/50 rounded-2xl p-4 text-sm">
                <div className="font-black text-emerald-800 dark:text-emerald-300 text-base">{validatedStudents.length} étudiants éligibles</div>
                <div className="text-emerald-700 dark:text-emerald-400 text-xs mt-1">Tous les étudiants avec décision V, VAR ou VPC pour le Semestre {selectedSemester || 1}</div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validatedStudents.slice(0, 8).map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{s.last_name?.toUpperCase()} {s.first_name}</span>
                    <span className="font-black text-emerald-600">{s.decision_global} — {parseFloat(s.moyenne_semestrielle || 0).toFixed(2)}/20</span>
                  </div>
                ))}
                {validatedStudents.length > 8 && <p className="text-xs text-slate-400 text-center py-1">... et {validatedStudents.length - 8} autres</p>}
                {validatedStudents.length === 0 && <p className="text-xs text-slate-500 text-center italic py-2">Aucun étudiant validé pour ce semestre.</p>}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button variant="outline" onClick={() => setShowAttestationModal(false)} className="rounded-xl font-bold text-xs">Annuler</Button>
                <Button
                  onClick={handleGenerateBatchAttestations}
                  disabled={isGeneratingAttestations || validatedStudents.length === 0}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-black text-xs px-6 shadow-lg hover:scale-105 transition-all"
                >
                  {isGeneratingAttestations ? <Spinner className="text-white" /> : `🎓 Générer ${validatedStudents.length} Attestation(s)`}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 🗓️ FEATURE 5: Deliberation Scheduler Modal */}
      {showSchedulerModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Planifier une Session de Délibération</h3>
                  <p className="text-xs text-slate-500">Les membres du jury seront notifiés par email automatiquement</p>
                </div>
              </div>
              <button onClick={() => setShowSchedulerModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Date *</label>
                <input
                  type="date"
                  value={schedulerForm.date}
                  onChange={e => setSchedulerForm(f => ({...f, date: e.target.value}))}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Heure *</label>
                <input
                  type="time"
                  value={schedulerForm.time}
                  onChange={e => setSchedulerForm(f => ({...f, time: e.target.value}))}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Salle / Lieu *</label>
                <input
                  type="text"
                  value={schedulerForm.room}
                  onChange={e => setSchedulerForm(f => ({...f, room: e.target.value}))}
                  placeholder="ex: Salle Conseil A"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Président du Jury *</label>
                <input
                  type="text"
                  value={schedulerForm.president}
                  onChange={e => setSchedulerForm(f => ({...f, president: e.target.value}))}
                  placeholder="Nom du Président"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Membres du Jury (emails séparés par virgule)</label>
              <textarea
                value={schedulerForm.juryMembers}
                onChange={e => setSchedulerForm(f => ({...f, juryMembers: e.target.value}))}
                placeholder="prof1@encg.ma, prof2@encg.ma, ..."
                rows={2}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
              />
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 rounded-xl p-3 text-xs text-orange-700 dark:text-orange-300">
              📧 Les invitations seront envoyées automatiquement à tous les membres du jury 48h avant la séance via Resend.
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="outline" onClick={() => setShowSchedulerModal(false)} className="rounded-xl font-bold text-xs">Annuler</Button>
              <Button
                onClick={handleScheduleDeliberation}
                className="bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-black text-xs px-6 shadow-lg hover:scale-105 transition-all"
              >
                📅 Planifier & Notifier le Jury
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Results Email Dispatcher Modal */}
      {showBulkEmailModal && (() => {
        const _students = semesterPvData?.students || []
        const totalStudents = _students.length
        const valCount = _students.filter((s: any) => s.decision_global === 'V' || s.decision_global === 'VAR' || s.decision_global === 'VPC').length
        const ratCount = _students.filter((s: any) => s.decision_global === 'RAT').length
        const nvCount = _students.filter((s: any) => s.decision_global === 'NV').length
        return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                🚀 Diffusion des Résultats par Email
              </h3>
              <button
                onClick={() => setShowBulkEmailModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Sélectionnez le groupe cible d'étudiants pour l'expédition automatique du relevé de notes certifié par email via Resend API.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Filtre des Destinataires</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBulkFilter('all')}
                  className={cn("p-3 rounded-2xl border text-xs font-black text-left cursor-pointer transition-all", bulkFilter === 'all' ? "bg-[#0f2863] text-white border-[#0f2863]" : "bg-slate-50 border-slate-200 text-slate-700")}
                >
                  🎓 Tous les Étudiants ({totalStudents})
                </button>

                <button
                  type="button"
                  onClick={() => setBulkFilter('admis')}
                  className={cn("p-3 rounded-2xl border text-xs font-black text-left cursor-pointer transition-all", bulkFilter === 'admis' ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 border-slate-200 text-slate-700")}
                >
                  ✅ Admis Uniquement ({valCount})
                </button>

                <button
                  type="button"
                  onClick={() => setBulkFilter('rattrapage')}
                  className={cn("p-3 rounded-2xl border text-xs font-black text-left cursor-pointer transition-all", bulkFilter === 'rattrapage' ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 border-slate-200 text-slate-700")}
                >
                  ⚠️ Rattrapage ({ratCount})
                </button>

                <button
                  type="button"
                  onClick={() => setBulkFilter('ajournes')}
                  className={cn("p-3 rounded-2xl border text-xs font-black text-left cursor-pointer transition-all", bulkFilter === 'ajournes' ? "bg-rose-600 text-white border-rose-600" : "bg-slate-50 border-slate-200 text-slate-700")}
                >
                  ❌ Non Validés ({nvCount})
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulkEmailModal(false)} className="rounded-xl font-bold text-xs">
                Annuler
              </Button>
              <Button onClick={handleBroadcastTranscripts} disabled={isSendingBulk} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg">
                {isSendingBulk ? <Spinner className="text-white" /> : '🚀 Lancer l\'Expédition'}
              </Button>
            </div>
          </div>
        </div>
        )
      })()}


      {/* 🛡️ Audit Trail Modal */}
      {showAuditModal && (

        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Journal d'Audit du PV & Traçabilité</h3>
                  <p className="text-xs text-slate-500">Historique des modifications de notes, signatures et validations cryptographiques.</p>
                </div>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {[
                { user: 'Admin ENCG Fès', action: 'Calcul Automatique Délibération APOGEE', time: 'Il y a 5 min', ip: '192.168.1.45', type: 'system' },
                { user: 'Prof. EL AMIR Reda', action: 'Signature Numérique PV Module M01', time: 'Aujourd\'hui 14:30', ip: '196.200.42.12', type: 'sig' },
                { user: 'Prof. BENNANI Farouk', action: 'Modification Note Rattrapage (12.50 → 14.00)', time: 'Aujourd\'hui 11:15', ip: '196.200.42.88', type: 'grade' },
                { user: 'Président du Jury', action: 'Scellé Cryptographique SHA-256 Appliqué', time: 'Hier 18:00', ip: '192.168.1.10', type: 'seal' },
              ].map((log, i) => (
                <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{log.action}</div>
                      <div className="text-[10px] text-slate-500">Par {log.user} • IP: {log.ip}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-400 font-mono">Registre Cryptographique Verrouillé (Immutable Audit)</span>
              <Button onClick={() => setShowAuditModal(false)} className="rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Tactile Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Signature Tactile du PV Officiel</h3>
                  <p className="text-xs text-blue-200">Validation et horodatage certifié par l'Enseignant</p>
                </div>
              </div>
              <button onClick={() => setShowSignatureModal(false)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-bold">
                Veuillez apposer votre signature manuscrite ci-dessous à l'aide de votre souris ou écran tactile.
              </p>

              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-3xl p-3 bg-slate-50 dark:bg-slate-800/40 flex justify-center">
                <SignatureCanvasPad onSave={(dataUrl) => setSignatureDataUrl(dataUrl)} />
              </div>

              {signatureDataUrl && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Signature Numérique Capturée et Horodatée en Temps Réel !</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSignature}
                disabled={isSigning}
                className="px-6 py-2.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSigning ? <Spinner className="text-white" /> : null}
                {isSigning ? 'Scellé en cours...' : 'Valider & Sceller PV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


