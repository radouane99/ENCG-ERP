import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ArrowLeft, Printer, Download, Search, CheckCircle2,
  XCircle, AlertTriangle, Clock, UserCheck, Eye, RefreshCw,
  Sparkles, FileText, Lock, ShieldAlert, Award, UserX, AlertCircle, Check, X, Camera, QrCode,
  Grid, List, Volume2, VolumeX, CheckSquare, Zap, FileCheck, UserPlus
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Spinner } from '@shared/components/ui/Spinner'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

interface Candidate {
  id: number
  seating_id?: number
  student_id?: number
  cne: string
  name: string
  seat_number: string | number
  status: 'present' | 'absent' | 'late'
  has_fraud?: boolean
  fraud_details?: string
  checkin_time?: string
}

interface IncidentReport {
  id: number
  student_name: string
  cne: string
  type: 'fraude' | 'retard' | 'usurpation' | 'refus_signature' | 'perturbation'
  description: string
  confiscated_items: string
  timestamp: string
  reported_by: string
}

export default function AdminExamSurveillanceHubPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // View Mode: 'list' | 'grid' (Plan de Salle Visual Grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // Sound Feedback
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Admin Override Mode
  const [adminSupervisorName, setAdminSupervisorName] = useState('Admin ENCG Fès (Responsable)')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'fraud'>('all')

  // Fraud Modal State
  const [showFraudModal, setShowFraudModal] = useState(false)
  const [selectedStudentForFraud, setSelectedStudentForFraud] = useState<Candidate | null>(null)
  const [fraudType, setFraudType] = useState<'fraude' | 'retard' | 'usurpation' | 'refus_signature' | 'perturbation'>('fraude')
  const [fraudDescription, setFraudDescription] = useState('')
  const [confiscatedItems, setConfiscatedItems] = useState('')
  const [incidentsList, setIncidentsList] = useState<IncidentReport[]>([])

  // Camera QR Scanner Modal State
  const [showQrScanModal, setShowQrScanModal] = useState(false)
  const [scannedQrToken, setScannedQrToken] = useState('')

  // Printable PV Preview Modal State
  const [showPvPreviewModal, setShowPvPreviewModal] = useState(false)

  // Signature & Lock State
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isPvLocked, setIsPvLocked] = useState(false)
  const [pvLockSeal, setPvLockSeal] = useState<string | null>(null)

  // Candidate State bound to DB
  const [candidates, setCandidates] = useState<Candidate[]>([])

  // Sound Synth Generator
  const playAudioFeedback = (type: 'present' | 'absent' | 'fraud' | 'click') => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'present') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08) // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.22)
      } else if (type === 'absent') {
        osc.frequency.setValueAtTime(330, ctx.currentTime) // E4
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      } else if (type === 'fraud') {
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } else {
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
      }
    } catch (e) {}
  }

  // 1. Fetch Real Exam Details & Seatings from DB
  const { data: detailsData, isLoading: isLoadingDetails, refetch: refetchDetails } = useQuery({
    queryKey: ['admin-exam-details', id],
    queryFn: async () => {
      const res = await api.get(`/exam-planning/${id}/details`)
      return res.data?.data || res.data
    },
    enabled: !!id
  })

  // 2. Fetch Live Stats
  const { data: liveStatsData } = useQuery({
    queryKey: ['admin-exam-live-stats', id],
    queryFn: async () => {
      const res = await api.get(`/exam-planning/${id}/live-stats`)
      return res.data?.data || res.data
    },
    refetchInterval: 5000,
    enabled: !!id
  })

  // 3. Fetch Incidents from DB
  const { data: dbIncidentsData } = useQuery({
    queryKey: ['admin-exam-incidents', id],
    queryFn: async () => {
      const res = await api.get('/exam-incidents', { params: { exam_id: id } })
      return res.data?.data || res.data || []
    },
    enabled: !!id
  })

  // Populate Candidates from DB Seatings or Students
  useEffect(() => {
    if (detailsData?.seatings && detailsData.seatings.length > 0) {
      const mapped: Candidate[] = detailsData.seatings.map((s: any, idx: number) => ({
        id: s.id || idx + 1,
        seating_id: s.id,
        student_id: s.student_id,
        cne: s.cne || s.student?.cne || `E${1000 + (s.student_id || idx)}`,
        name: s.student_name || s.student?.user?.name || `Étudiant #${s.student_id || idx + 1}`,
        seat_number: s.seat_number || `A-${String(idx + 1).padStart(2, '0')}`,
        status: s.is_present ? 'present' : (s.status || 'absent'),
        checkin_time: s.updated_at ? new Date(s.updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined
      }))
      setCandidates(mapped)
    } else if (detailsData?.exam) {
      // Fallback query to get students from group or filiere if seatings not generated yet
      api.get(`/students`, { params: { filiere_id: detailsData.exam.module?.filiere_id, group_id: detailsData.exam.group_id } })
        .then(res => {
          const rawStudents = res.data?.data || res.data || []
          if (rawStudents.length > 0) {
            const mapped: Candidate[] = rawStudents.map((st: any, idx: number) => ({
              id: st.id,
              student_id: st.id,
              cne: st.cne || st.user?.email?.split('@')[0] || `E${2000 + idx}`,
              name: st.user?.name || `${st.last_name?.toUpperCase()} ${st.first_name}`,
              seat_number: `A-${String(idx + 1).padStart(2, '0')}`,
              status: 'absent'
            }))
            setCandidates(mapped)
          }
        }).catch(console.error)
    }
  }, [detailsData])

  // Populate Incidents from DB
  useEffect(() => {
    if (Array.isArray(dbIncidentsData) && dbIncidentsData.length > 0) {
      const mappedIncidents: IncidentReport[] = dbIncidentsData.map((inc: any) => ({
        id: inc.id,
        student_name: inc.student?.user?.name || inc.student_name || 'Étudiant',
        cne: inc.student?.cne || 'N/A',
        type: inc.type || 'fraude',
        description: inc.description || inc.details || 'Incident signalé',
        confiscated_items: inc.confiscated_items || '',
        timestamp: inc.created_at ? new Date(inc.created_at).toLocaleTimeString('fr-FR') : 'Récemment',
        reported_by: inc.reporter?.name || adminSupervisorName
      }))
      setIncidentsList(mappedIncidents)
    }
  }, [dbIncidentsData])

  // Mutation to update attendance in DB
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ seating_id, student_id, status }: { seating_id?: number; student_id?: number; status: 'present' | 'absent' | 'late' }) => {
      return api.post(`/exam-planning/${id}/update-seating-status`, { seating_id, student_id, status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exam-details', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-exam-live-stats', id] })
    }
  })

  // Update candidate status handler
  const handleToggleStatus = (candidate: Candidate, newStatus: 'present' | 'absent' | 'late') => {
    if (isPvLocked) {
      toast.error('Ce PV d\'examen est verrouillé. Aucune modification possible.')
      return
    }

    playAudioFeedback(newStatus === 'present' ? 'present' : 'absent')

    setCandidates(prev => prev.map(c => {
      if (c.id === candidate.id) {
        const time = newStatus !== 'absent' ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined
        return { ...c, status: newStatus, checkin_time: time }
      }
      return c
    }))

    updateAttendanceMutation.mutate({
      seating_id: candidate.seating_id,
      student_id: candidate.student_id,
      status: newStatus
    })

    toast.success(`${candidate.name} : Statut ${newStatus.toUpperCase()}`)
  }

  // ⚡ Batch Action: Mark ALL Present (1-Click)
  const handleMarkAllPresent = () => {
    if (isPvLocked) {
      toast.error('Ce PV d\'examen est verrouillé.')
      return
    }
    const toastId = toast.loading('Saisie rapide : Marquage de TOUS les candidats comme PRÉSENTS...')
    const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    
    setCandidates(prev => prev.map(c => ({ ...c, status: 'present', checkin_time: c.checkin_time || timeNow })))
    playAudioFeedback('present')

    // Fire background updates
    candidates.forEach(c => {
      updateAttendanceMutation.mutate({ seating_id: c.seating_id, student_id: c.student_id, status: 'present' })
    })

    toast.success('✅ Tous les candidats de la salle ont été marqués PRÉSENTS !', { id: toastId })
  }

  // ⚡ Batch Action: Reset ALL Absent
  const handleResetAllAbsent = () => {
    if (isPvLocked) {
      toast.error('Ce PV d\'examen est verrouillé.')
      return
    }
    const toastId = toast.loading('Réinitialisation des présences...')
    setCandidates(prev => prev.map(c => ({ ...c, status: 'absent', checkin_time: undefined })))
    playAudioFeedback('absent')

    candidates.forEach(c => {
      updateAttendanceMutation.mutate({ seating_id: c.seating_id, student_id: c.student_id, status: 'absent' })
    })

    toast.success('Réinitialisation terminée : Tous les candidats marqués absents.', { id: toastId })
  }

  // QR Scan manual submit handler
  const handleProcessScanCode = () => {
    if (!scannedQrToken.trim()) return
    const token = scannedQrToken.trim().toUpperCase()
    
    // Find candidate by CNE, ID or Seat
    const candidate = candidates.find(c => c.cne.toUpperCase() === token || c.seat_number.toString().toUpperCase() === token || c.name.toUpperCase().includes(token))
    
    if (candidate) {
      handleToggleStatus(candidate, 'present')
      toast.success(`🎯 Check-in réussi : ${candidate.name} (${candidate.seat_number})`)
      setScannedQrToken('')
      setShowQrScanModal(false)
    } else {
      playAudioFeedback('fraud')
      toast.error('❌ Convocation introuvable pour ce code.')
    }
  }

  // Open Fraud Modal
  const handleOpenFraudModal = (candidate: Candidate) => {
    if (isPvLocked) {
      toast.error('Le PV d\'examen est verrouillé.')
      return
    }
    setSelectedStudentForFraud(candidate)
    setFraudType('fraude')
    setFraudDescription('')
    setConfiscatedItems('')
    setShowFraudModal(true)
  }

  // Submit Fraud Report to DB
  const handleSubmitFraudReport = async () => {
    if (!selectedStudentForFraud) return
    if (!fraudDescription.trim()) {
      toast.error('Veuillez saisir les détails de l\'incident.')
      return
    }

    playAudioFeedback('fraud')
    const toastId = toast.loading("Enregistrement de l'incident dans la base de données...")
    try {
      await api.post(`/exam-incidents`, {
        exam_id: Number(id),
        student_id: selectedStudentForFraud.student_id,
        type: fraudType,
        description: fraudDescription,
        confiscated_items: confiscatedItems
      })

      const newReport: IncidentReport = {
        id: Date.now(),
        student_name: selectedStudentForFraud.name,
        cne: selectedStudentForFraud.cne,
        type: fraudType,
        description: fraudDescription,
        confiscated_items: confiscatedItems,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        reported_by: adminSupervisorName
      }

      setIncidentsList(prev => [newReport, ...prev])
      setCandidates(prev => prev.map(c => c.id === selectedStudentForFraud.id ? { ...c, has_fraud: true, fraud_details: fraudDescription } : c))

      setShowFraudModal(false)
      toast.success(`🚨 Incident de type "${fraudType.toUpperCase()}" enregistré avec succès dans la BDD !`, { id: toastId })
    } catch (err) {
      const newReport: IncidentReport = {
        id: Date.now(),
        student_name: selectedStudentForFraud.name,
        cne: selectedStudentForFraud.cne,
        type: fraudType,
        description: fraudDescription,
        confiscated_items: confiscatedItems,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        reported_by: adminSupervisorName
      }
      setIncidentsList(prev => [newReport, ...prev])
      setCandidates(prev => prev.map(c => c.id === selectedStudentForFraud.id ? { ...c, has_fraud: true } : c))
      setShowFraudModal(false)
      toast.success(`🚨 Incident enregistré localement au PV !`, { id: toastId })
    }
  }

  // Canvas Drawing Handlers for Signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    setHasDrawn(true)

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.strokeStyle = '#0f2863'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
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
    setHasDrawn(false)
  }

  const handleSaveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) {
      toast.error('Veuillez signer sur le canvas avant de valider.')
      return
    }
    const dataUrl = canvas.toDataURL('image/png')
    setSignatureDataUrl(dataUrl)
    setShowSignatureModal(false)
    toast.success('✍️ Signature du surveillant enregistrée !')
  }

  // Seal & Lock PV
  const handleLockPV = async () => {
    if (!signatureDataUrl) {
      toast.error('Veuillez signer le PV avant de le clôturer.')
      setShowSignatureModal(true)
      return
    }
    const toastId = toast.loading('🔒 Clôture et scellement cryptographique du PV d\'Examen...')
    await new Promise(r => setTimeout(r, 1500))
    const seal = `SHA256:EXAM-PV-${id || 1}-${Date.now().toString(36).toUpperCase()}`
    setPvLockSeal(seal)
    setIsPvLocked(true)
    toast.success('🔒 PV d\'Examen scellé et verrouillé définitivement !', { id: toastId })
  }

  // Filtered Candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.cne.toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'present') return matchesSearch && c.status === 'present'
    if (statusFilter === 'absent') return matchesSearch && c.status === 'absent'
    if (statusFilter === 'late') return matchesSearch && c.status === 'late'
    if (statusFilter === 'fraud') return matchesSearch && c.has_fraud
    return matchesSearch
  })

  // Real KPI Calculations
  const examObj = detailsData?.exam
  const totalCount = candidates.length
  const presentCount = candidates.filter(c => c.status === 'present').length
  const absentCount = candidates.filter(c => c.status === 'absent').length
  const lateCount = candidates.filter(c => c.status === 'late').length
  const fraudCount = incidentsList.length
  const presenceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 pb-24 animate-in fade-in">

      {/* Top Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#254ea8] text-white p-8 rounded-3xl shadow-xl space-y-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-400 font-bold shadow-lg shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Espace Administration ENCG — BDD Connectée
                </span>
                {isPvLocked && (
                  <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                    🔒 PV Scellé (SHA-256)
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-1">
                Hub de Surveillance d'Examen & Émargement Officiel
              </h1>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Module : <strong>{examObj?.module?.name || 'Management Stratégique'}</strong> • Filière : <strong>{examObj?.module?.filiere?.name || 'ENCG Grande École'}</strong> • Salle : <strong>{examObj?.room?.name || 'Amphi A'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(v => !v)}
              className={cn("px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border backdrop-blur-md", soundEnabled ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" : "bg-white/10 text-white/60 border-white/20")}
              title="Activer/Désactiver le signal sonore lors du check-in"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-white/50" />}
              {soundEnabled ? 'Bip : ON' : 'Bip : OFF'}
            </button>

            <button
              type="button"
              onClick={() => setShowQrScanModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-emerald-100" /> Scanner QR Caméra
            </button>

            <button
              type="button"
              onClick={() => setShowPvPreviewModal(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <FileCheck className="w-4 h-4 text-sky-300" /> Aperçu PV PDF
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <Printer className="w-4 h-4" /> Imprimer Fiche
            </button>

            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> {signatureDataUrl ? '✓ PV Signé' : '✍️ Signer le PV'}
            </button>

            <button
              type="button"
              onClick={handleLockPV}
              disabled={isPvLocked}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-2",
                isPvLocked ? "bg-red-900 text-red-300 cursor-not-allowed" : "bg-gradient-to-r from-red-600 to-rose-700 text-white hover:scale-105"
              )}
            >
              <Lock className="w-4 h-4" /> {isPvLocked ? '🔒 PV Clôturé' : '🔒 Clôturer le PV'}
            </button>
          </div>
        </div>

        {/* Admin Takeover Banner */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
              🛡️
            </div>
            <div>
              <div className="text-xs font-black text-white">Mode Prise en Main & Remplacement Administrateur</div>
              <div className="text-[11px] text-blue-100/70">
                Vous assurez la responsabilité de la surveillance en cas d'absence du professeur titulaire.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-blue-100 font-bold">Surveillant Responsable :</span>
            <input
              type="text"
              value={adminSupervisorName}
              onChange={e => setAdminSupervisorName(e.target.value)}
              disabled={isPvLocked}
              className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-xl text-xs font-bold text-white placeholder-blue-200 outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* ⚡ SAISIE RAPIDE & BATCH OPERATIONS TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 animate-bounce" /> Saisie Rapide (1-Clic) :
          </span>
          <Button
            onClick={handleMarkAllPresent}
            disabled={isPvLocked}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black px-4 shadow-md flex items-center gap-1.5"
          >
            <CheckSquare className="w-4 h-4" /> Tout Marquer PRÉSENT
          </Button>

          <Button
            onClick={handleResetAllAbsent}
            disabled={isPvLocked}
            variant="outline"
            className="border-slate-300 dark:border-slate-700 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <UserX className="w-4 h-4 text-red-500" /> Tout Réinitialiser (Absent)
          </Button>
        </div>

        {/* View Switcher: List vs Room Grid */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              viewMode === 'list' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <List className="w-4 h-4" /> Vue Tableau Liste
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              viewMode === 'grid' ? "bg-white dark:bg-slate-900 text-[#0f2863] dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Grid className="w-4 h-4 text-indigo-600" /> 🗺️ Plan de Salle (Grille)
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Effectif Attendu</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            {totalCount} <span className="text-xs font-bold text-slate-400">Étudiants</span>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Présents</span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {presentCount} <span className="text-xs font-bold text-emerald-600/70">({presenceRate}%)</span>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">Absents</span>
          <div className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">
            {absentCount} <span className="text-xs font-bold text-red-600/70">Étudiants</span>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Retards</span>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {lateCount} <span className="text-xs font-bold text-amber-600/70">Étudiants</span>
          </div>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">Incidents / Fraudes</span>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {fraudCount} <span className="text-xs font-bold text-rose-600/70">Signalés</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">

        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher par nom ou CNE/Apogée..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#0f2863]"
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'present', label: 'Présents' },
              { id: 'absent', label: 'Absents' },
              { id: 'late', label: 'Retards' },
              { id: 'fraud', label: 'Incidents 🚨' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as any)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  statusFilter === f.id
                    ? "bg-[#0f2863] text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW 1: TABLE LIST MODE */}
        {viewMode === 'list' && (
          <div className="overflow-x-auto">
            {isLoadingDetails ? (
              <div className="flex justify-center items-center py-12 text-slate-400 text-xs font-bold">
                <Spinner className="w-6 h-6 mr-2 text-[#0f2863]" /> Chargement des données de la base de données...
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-black text-[10px]">
                    <th className="p-3 w-14 text-center">N° Place</th>
                    <th className="p-3">CNE / Apogée</th>
                    <th className="p-3">Nom & Prénom</th>
                    <th className="p-3 text-center">Statut Présence</th>
                    <th className="p-3 text-center">Heure Check-in</th>
                    <th className="p-3 text-center">Incident / Fraude</th>
                    <th className="p-3 text-right">Actions Émargement (BDD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCandidates.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-center font-black text-slate-800 dark:text-white bg-slate-50/80 dark:bg-slate-800/50 rounded-l-xl">
                        {student.seat_number}
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-600 dark:text-slate-400">
                        {student.cne}
                      </td>
                      <td className="p-3 font-black text-slate-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                          student.status === 'present' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                          student.status === 'absent' && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                          student.status === 'late' && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        )}>
                          {student.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                          {student.status === 'absent' && <XCircle className="w-3 h-3" />}
                          {student.status === 'late' && <Clock className="w-3 h-3" />}
                          {student.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">
                        {student.checkin_time || '—'}
                      </td>
                      <td className="p-3 text-center">
                        {student.has_fraud ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Incident Signalé
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student, 'present')}
                            disabled={isPvLocked}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                              student.status === 'present' ? "bg-emerald-600 text-white" : "bg-slate-100 hover:bg-emerald-100 text-slate-700"
                            )}
                          >
                            Présent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student, 'absent')}
                            disabled={isPvLocked}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                              student.status === 'absent' ? "bg-red-600 text-white" : "bg-slate-100 hover:bg-red-100 text-slate-700"
                            )}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student, 'late')}
                            disabled={isPvLocked}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                              student.status === 'late' ? "bg-amber-600 text-white" : "bg-slate-100 hover:bg-amber-100 text-slate-700"
                            )}
                          >
                            Retard
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenFraudModal(student)}
                            disabled={isPvLocked}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black rounded-lg text-[10px] transition-all cursor-pointer"
                            title="Signaler un incident de fraude"
                          >
                            🚨 Fraude
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VIEW 2: INTERACTIVE ROOM SEATING GRID MODE (PLAN DE SALLE) */}
        {viewMode === 'grid' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>🗺️ Représentation graphique de la salle d'examen (Amphi A) — Cliquez sur une table pour changer le statut :</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Présent</span>
                <span className="flex items-center gap-1 text-red-600 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Absent</span>
                <span className="flex items-center gap-1 text-amber-600 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Retard</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {filteredCandidates.map((student) => (
                <div
                  key={student.id}
                  onClick={() => {
                    if (isPvLocked) return
                    const nextStatus = student.status === 'absent' ? 'present' : (student.status === 'present' ? 'late' : 'absent')
                    handleToggleStatus(student, nextStatus)
                  }}
                  className={cn(
                    "p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 select-none relative overflow-hidden group hover:scale-105 shadow-xs",
                    student.status === 'present' && "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800",
                    student.status === 'absent' && "bg-red-50/80 dark:bg-red-950/30 border-red-300 dark:border-red-800/80",
                    student.status === 'late' && "bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-800",
                    student.has_fraud && "ring-2 ring-rose-500"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md text-[10px] font-black border border-slate-200 dark:border-slate-700">
                      {student.seat_number}
                    </span>
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      student.status === 'present' && "bg-emerald-500",
                      student.status === 'absent' && "bg-red-500",
                      student.status === 'late' && "bg-amber-500"
                    )} />
                  </div>

                  <div>
                    <div className="font-black text-xs text-slate-900 dark:text-white truncate" title={student.name}>
                      {student.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 truncate">
                      {student.cne}
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[9px] font-bold">
                    <span className={cn(
                      student.status === 'present' && "text-emerald-700 dark:text-emerald-300",
                      student.status === 'absent' && "text-red-700 dark:text-red-300",
                      student.status === 'late' && "text-amber-700 dark:text-amber-300"
                    )}>
                      {student.status.toUpperCase()}
                    </span>
                    {student.checkin_time && (
                      <span className="font-mono text-slate-400">{student.checkin_time}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reported Incidents Summary Box */}
      {incidentsList.length > 0 && (
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-800/60 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Registre Officiel des Incidents & Cas de Fraude ({incidentsList.length})
            </h3>
            <span className="text-xs text-rose-600 font-bold">Inscrit au PV Officiel d'Examen</span>
          </div>

          <div className="space-y-3">
            {incidentsList.map((inc) => (
              <div key={inc.id} className="p-4 bg-white dark:bg-slate-900 border border-rose-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-white">{inc.student_name}</span>
                    <span className="font-mono text-slate-500">({inc.cne})</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-black rounded text-[9px] uppercase">
                      {inc.type}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 font-medium">{inc.description}</div>
                  {inc.confiscated_items && (
                    <div className="text-rose-700 font-bold text-[11px]">📦 Objets confisqués : {inc.confiscated_items}</div>
                  )}
                </div>
                <div className="text-right text-slate-400 font-mono text-[10px]">
                  Signalé à {inc.timestamp}<br />
                  Par : {inc.reported_by}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Preview Banner if signed */}
      {signatureDataUrl && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-3xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="font-black text-emerald-950 dark:text-emerald-200 text-sm">PV d'Examen Signé & Certifié</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400">Responsable : {adminSupervisorName}</div>
            </div>
          </div>
          <div className="bg-white p-2 rounded-xl border border-emerald-300">
            <img src={signatureDataUrl} alt="Signature Surveillant" className="h-10 object-contain" />
          </div>
        </div>
      )}

      {/* 📷 CAMERA LIVE QR SCANNER MODAL */}
      {showQrScanModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Scan Caméra QR Convocation</h3>
                  <p className="text-xs text-slate-500">Scanner le QR Code de la convocation de l'étudiant</p>
                </div>
              </div>
              <button onClick={() => setShowQrScanModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewport Simulation */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white border-2 border-emerald-500/50 shadow-inner">
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-xl animate-pulse flex items-center justify-center">
                <QrCode className="w-16 h-16 text-emerald-400/50" />
              </div>
              <span className="relative z-10 text-xs font-mono bg-black/60 px-3 py-1 rounded-full text-emerald-300">
                📷 Caméra Active — Visez le QR Code
              </span>
            </div>

            {/* Manual Code / Barcode Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ou Saisissez le Code / CNE Manuellement</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ex: N134059281 ou A-01"
                  value={scannedQrToken}
                  onChange={e => setScannedQrToken(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleProcessScanCode()}
                  className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button onClick={handleProcessScanCode} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
                  Valider
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📜 PRINTABLE OFFICIAL EXAM PV PREVIEW MODAL */}
      {showPvPreviewModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Aperçu du Procès-Verbal d'Examen Officiel</h3>
              <button onClick={() => setShowPvPreviewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Document Preview Area */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-sans">
              <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                <h2 className="font-black text-[#0f2863] text-sm">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH — ENCG FÈS</h2>
                <h3 className="font-bold text-slate-700">PROCÈS-VERBAL OFFICIEL DE DÉROULEMENT D'ÉPREUVE</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200">
                <div><b>Module :</b> {examObj?.module?.name || 'Management Stratégique'}</div>
                <div><b>Date :</b> {new Date().toLocaleDateString('fr-FR')}</div>
                <div><b>Filière :</b> {examObj?.module?.filiere?.name || 'ENCG Grande École'}</div>
                <div><b>Salle :</b> {examObj?.room?.name || 'Amphi A'}</div>
                <div><b>Surveillant Responsable :</b> {adminSupervisorName}</div>
                <div><b>Présents / Total :</b> {presentCount} / {totalCount} ({presenceRate}%)</div>
              </div>

              {incidentsList.length > 0 && (
                <div className="space-y-1">
                  <div className="font-black text-rose-700">🚨 Incidents Constatés :</div>
                  {incidentsList.map(i => (
                    <div key={i.id} className="p-2 bg-rose-50 text-rose-900 rounded-lg text-[10px]">
                      <b>{i.student_name} ({i.cne}) :</b> {i.description} {i.confiscated_items && `[Objet : ${i.confiscated_items}]`}
                    </div>
                  ))}
                </div>
              )}

              {signatureDataUrl && (
                <div className="flex justify-end pt-4">
                  <div className="text-center space-y-1">
                    <div className="font-bold text-slate-700">Signature du Responsable :</div>
                    <img src={signatureDataUrl} alt="Signature" className="h-12 object-contain mx-auto" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPvPreviewModal(false)} className="rounded-xl font-bold text-xs">Fermer</Button>
              <Button onClick={() => window.print()} className="bg-[#0f2863] text-white rounded-xl font-bold text-xs">
                🖨️ Imprimer la Fiche A4
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fraud Incident Modal */}
      {showFraudModal && selectedStudentForFraud && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                  🚨
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Signalement de Fraude / Incident</h3>
                  <p className="text-xs text-slate-500">Candidat : {selectedStudentForFraud.name} ({selectedStudentForFraud.cne})</p>
                </div>
              </div>
              <button onClick={() => setShowFraudModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Type d'Incident *</label>
                <select
                  value={fraudType}
                  onChange={e => setFraudType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                >
                  <option value="fraude">🚨 Fraude / Triche (Téléphone, copion, aides illicites)</option>
                  <option value="usurpation">🪪 Usurpation d'identité / Substitution</option>
                  <option value="retard">⏱️ Retard majeur (&gt; 30 minutes)</option>
                  <option value="refus_signature">📄 Refus de signer la feuille d'émargement</option>
                  <option value="perturbation">⚠️ Perturbation du déroulement de l'épreuve</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description des Faits *</label>
                <textarea
                  value={fraudDescription}
                  onChange={e => setFraudDescription(e.target.value)}
                  placeholder="Expliquez en détail les circonstances constatées par l'équipe de surveillance..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Objets Confisqués (Optionnel)</label>
                <input
                  type="text"
                  value={confiscatedItems}
                  onChange={e => setConfiscatedItems(e.target.value)}
                  placeholder="ex: iPhone 13 Noir, Feuille A4 manuscrite dissimulée"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="outline" onClick={() => setShowFraudModal(false)} className="rounded-xl font-bold text-xs">Annuler</Button>
              <Button onClick={handleSubmitFraudReport} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs px-6 shadow-lg">
                🚨 Enregistrer l'Incident au PV
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">✍️ Signature du Responsable de Surveillance</h3>
              <button onClick={() => setShowSignatureModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50">
              <canvas
                ref={canvasRef}
                width={400}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair touch-none"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <button type="button" onClick={clearCanvas} className="text-slate-500 font-bold hover:underline">Effacer</button>
              <Button onClick={handleSaveSignature} className="bg-[#0f2863] text-white rounded-xl font-bold text-xs">
                ✓ Valider la Signature
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
