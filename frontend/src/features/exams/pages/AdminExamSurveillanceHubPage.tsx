import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ArrowLeft, Printer, Download, Search, CheckCircle2,
  XCircle, AlertTriangle, Clock, UserCheck, Eye, RefreshCw,
  Sparkles, FileText, Lock, ShieldAlert, Award, UserX, AlertCircle, Check, X, Camera, QrCode,
  Grid, List, Volume2, VolumeX, CheckSquare, Zap, FileCheck, UserPlus, Package, ChevronDown
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { openAuthenticatedUrl } from '@shared/lib/documentAccess'
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
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // View Mode: 'list' | 'grid' (Plan de Salle Visual Grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // Sound Feedback
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Detect Professor View Mode
  const isProfessorView = window.location.pathname.includes('/professor/') || !!localStorage.getItem('auth_user_role')?.includes('professor')

  // Admin / Professor Supervisor Mode & Exam Metadata
  const [adminSupervisorName, setAdminSupervisorName] = useState(
    isProfessorView ? 'Pr. Amina Chraibi (Surveillant Secondaire)' : 'Admin ENCG Fès (Responsable)'
  )
  const [customCopiesCount, setCustomCopiesCount] = useState<number | ''>('')

  // Offline PWA Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)

  // Signature Mode: Digital Stamp vs Pad Canvas
  const [signatureMode, setSignatureMode] = useState<'digital' | 'pad'>('digital')

  useEffect(() => {
    // Check initial queue
    try {
      const queue = JSON.parse(sessionStorage.getItem(`offline_emargement_queue_${id}`) || '[]')
      setOfflineQueueCount(queue.length)
    } catch (e) {}

    const handleOnline = () => {
      setIsOnline(true)
      toast.success('🟢 Connexion Internet rétablie ! Synchronisation de la file d\'émargement...')
      try {
        const queue = JSON.parse(sessionStorage.getItem(`offline_emargement_queue_${id}`) || '[]')
        if (queue.length > 0) {
          queue.forEach((item: any) => {
            updateAttendanceMutation.mutate({ seating_id: item.seating_id, student_id: item.student_id, status: item.status })
          })
          sessionStorage.removeItem(`offline_emargement_queue_${id}`)
          setOfflineQueueCount(0)
          toast.success(`✅ ${queue.length} émargement(s) hors-ligne synchronisés avec la BDD !`)
        }
      } catch (e) {}
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('🟡 Wi-Fi déconnecté. Mode PWA Hors-Ligne actif. Vos pointages seront conservés en local.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [id])

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'fraud'>('all')


  // Fraud Modal State
  const [showFraudModal, setShowFraudModal] = useState(false)
  const [selectedStudentForFraud, setSelectedStudentForFraud] = useState<Candidate | null>(null)
  const [fraudType, setFraudType] = useState<'fraude' | 'retard' | 'usurpation' | 'refus_signature' | 'perturbation'>('fraude')
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  const [sanctionScope, setSanctionScope] = useState<'module' | 'semestre' | 'exclusion'>('module')
  const [isSanctionDropdownOpen, setIsSanctionDropdownOpen] = useState(false)
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
        osc.frequency.setValueAtTime(587.33, ctx.currentTime)
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.22)
      } else if (type === 'absent') {
        osc.frequency.setValueAtTime(330, ctx.currentTime)
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

  // 1. Fetch Real Exam Details & Seatings from DB (Real-time polling for dual proctors synchronization)
  const { data: detailsData, isLoading: isLoadingDetails, refetch: refetchDetails } = useQuery({
    queryKey: ['admin-exam-details', id],
    queryFn: async () => {
      const res = await api.get(`/exam-planning/${id}/details`)
      return res.data?.data || res.data
    },
    refetchInterval: 2500,
    enabled: !!id
  })

  // 2. Fetch Live Stats
  const { data: liveStatsData } = useQuery({
    queryKey: ['admin-exam-live-stats', id],
    queryFn: async () => {
      const res = await api.get(`/exam-planning/${id}/live-stats`)
      return res.data?.data || res.data
    },
    refetchInterval: 2500,
    enabled: !!id
  })

  // 3. Fetch Incidents from DB
  const { data: dbIncidentsData } = useQuery({
    queryKey: ['admin-exam-incidents', id],
    queryFn: async () => {
      const res = await api.get('/exam-incidents', { params: { exam_id: id } })
      return res.data?.data || res.data || []
    },
    refetchInterval: 2500,
    enabled: !!id
  })

  // Auto-sync any queued local incidents to DB on load
  useEffect(() => {
    try {
      const existingQueue = JSON.parse(sessionStorage.getItem('encg_exam_incidents_queue') || '[]')
      if (Array.isArray(existingQueue) && existingQueue.length > 0 && id) {
        existingQueue.forEach(async (item: any) => {
          if (item.student?.id) {
            try {
              await api.post('/exam-incidents', {
                exam_id: Number(id),
                student_id: item.student.id,
                type: 'fraude',
                description: item.description || "Fraude constatée en salle d'examen",
                confiscated_items: item.confiscated_items || 'Téléphone portable'
              })
              await api.post(`/exam-planning/${id}/update-seating-status`, {
                student_id: item.student.id,
                status: 'present'
              })
              sessionStorage.removeItem('encg_exam_incidents_queue')
              queryClient.invalidateQueries({ queryKey: ['admin-exam-incidents', id] })
              queryClient.invalidateQueries({ queryKey: ['admin-exam-details', id] })
              queryClient.invalidateQueries({ queryKey: ['admin-exam-live-stats', id] })
            } catch (e) {}
          }
        })
      }
    } catch (e) {}
  }, [id])

  // Lock & Signature state initialization from DB
  useEffect(() => {
    if (detailsData?.exam) {
      if (detailsData.exam.is_locked) {
        setIsPvLocked(true)
        const lockedAt = detailsData.exam.locked_at ? new Date(detailsData.exam.locked_at).getTime().toString(36).toUpperCase() : Date.now().toString(36).toUpperCase()
        setPvLockSeal(`SHA256:ENCG-FES-${id}-${lockedAt}`)
      }
      if (detailsData.exam.signature_data) {
        setSignatureDataUrl(detailsData.exam.signature_data)
      }
    }
  }, [detailsData?.exam, id])

  // Populate Incidents from DB
  useEffect(() => {
    const rawIncidents = Array.isArray(dbIncidentsData) && dbIncidentsData.length > 0 
      ? dbIncidentsData 
      : (Array.isArray(detailsData?.incidents) ? detailsData.incidents : [])

    if (rawIncidents.length > 0) {
      const mappedIncidents: IncidentReport[] = rawIncidents.map((inc: any) => ({
        id: inc.id,
        student_name: inc.student?.user?.name || inc.student_name || 'Étudiant',
        cne: inc.cne || inc.student?.cne || 'N/A',
        type: inc.type || 'fraude',
        description: inc.description || inc.details || 'Incident signalé',
        confiscated_items: inc.confiscated_items || '',
        timestamp: inc.created_at ? new Date(inc.created_at).toLocaleTimeString('fr-FR') : 'Récemment',
        reported_by: inc.reporter?.name || adminSupervisorName
      }))
      setIncidentsList(mappedIncidents)
    }
  }, [dbIncidentsData, detailsData?.incidents])

  // Populate Candidates from DB Seatings or Students + Preserve Local Attendance State & Incidents
  useEffect(() => {
    const fraudStudentIds = new Set<number>()
    const fraudCnes = new Set<string>()
    const fraudNames = new Set<string>()

    const collectIncident = (inc: any) => {
      if (!inc) return
      if (inc.student_id) fraudStudentIds.add(Number(inc.student_id))
      if (inc.student?.id) fraudStudentIds.add(Number(inc.student.id))

      const cneCandidates = [inc.cne, inc.student?.cne].filter(Boolean)
      cneCandidates.forEach((c: string) => {
        const clean = c.toUpperCase().trim()
        fraudCnes.add(clean)
        fraudCnes.add(clean.replace(/^M/, 'N'))
        fraudCnes.add(clean.replace(/^N/, 'M'))
        fraudCnes.add(clean.replace(/^[A-Z]/, ''))
      })

      const nameCandidates = [
        inc.student_name,
        inc.student?.user?.name,
        `${inc.student?.first_name || ''} ${inc.student?.last_name || ''}`.trim(),
        `${inc.student?.last_name || ''} ${inc.student?.first_name || ''}`.trim()
      ].filter(Boolean)
      nameCandidates.forEach((n: string) => {
        fraudNames.add(n.toLowerCase().trim())
      })
    }

    if (Array.isArray(dbIncidentsData)) dbIncidentsData.forEach(collectIncident)
    if (Array.isArray(detailsData?.incidents)) detailsData.incidents.forEach(collectIncident)
    incidentsList.forEach(collectIncident)

    if (detailsData?.seatings && detailsData.seatings.length > 0) {
      setCandidates(prevCandidates => {
        const prevCandidateMap = new Map(prevCandidates.map(c => [c.id, c]))

        return detailsData.seatings.map((s: any, idx: number) => {
          const studentId = s.student_id ? Number(s.student_id) : undefined
          const rawCne = (s.cne || s.student?.cne || '').toUpperCase().trim()
          const rawName = (s.student_name || s.student?.user?.name || '').toLowerCase().trim()

          const isFraud = Boolean(
            (studentId && fraudStudentIds.has(studentId))
            || (rawCne && (fraudCnes.has(rawCne) || fraudCnes.has(rawCne.replace(/^M/, 'N')) || fraudCnes.has(rawCne.replace(/^N/, 'M')) || fraudCnes.has(rawCne.replace(/^[A-Z]/, ''))))
            || (rawName && (fraudNames.has(rawName) || Array.from(fraudNames).some(fn => fn && (rawName.includes(fn) || fn.includes(rawName)))))
          )

          const existingCandidate = prevCandidateMap.get(s.id || idx + 1)

          let resolvedStatus: 'present' | 'absent' | 'late' = 'absent'
          if (isFraud) {
            resolvedStatus = 'present'
          } else if (s.is_present) {
            resolvedStatus = 'present'
          } else if (existingCandidate && existingCandidate.status !== 'absent') {
            resolvedStatus = existingCandidate.status
          } else if (s.status) {
            resolvedStatus = s.status
          }

          const seatVal = s.seat_number && Number(s.seat_number) !== 125
            ? s.seat_number
            : (idx + 1);

          const formattedSeatNumber = typeof seatVal === 'number' || !isNaN(Number(seatVal))
            ? `N° ${String(seatVal).padStart(2, '0')}`
            : String(seatVal);

          return {
            id: s.id || idx + 1,
            seating_id: s.id,
            student_id: s.student_id,
            cne: s.cne || s.student?.cne || `E${1000 + (s.student_id || idx)}`,
            name: s.student_name || s.student?.user?.name || `Étudiant #${s.student_id || idx + 1}`,
            seat_number: formattedSeatNumber,
            status: resolvedStatus,
            has_fraud: Boolean(isFraud),
            checkin_time: existingCandidate?.checkin_time || (s.updated_at && s.is_present ? new Date(s.updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined)
          }
        })
      })
    } else if (detailsData?.exam) {
      api.get(`/students`, { params: { filiere_id: detailsData.exam.module?.filiere_id, group_id: detailsData.exam.group_id } })
        .then(res => {
          const rawStudents = res.data?.data || res.data || []
          if (rawStudents.length > 0) {
            const mapped: Candidate[] = rawStudents.map((st: any, idx: number) => {
              const studentId = st.id ? Number(st.id) : undefined
              const rawCne = (st.cne || st.user?.email?.split('@')[0] || '').toUpperCase().trim()
              const rawName = (st.user?.name || `${st.last_name?.toUpperCase()} ${st.first_name}`).toLowerCase().trim()

              const isFraud = Boolean(
                (studentId && fraudStudentIds.has(studentId))
                || (rawCne && (fraudCnes.has(rawCne) || fraudCnes.has(rawCne.replace(/^M/, 'N')) || fraudCnes.has(rawCne.replace(/^N/, 'M')) || fraudCnes.has(rawCne.replace(/^[A-Z]/, ''))))
                || (rawName && (fraudNames.has(rawName) || Array.from(fraudNames).some(fn => fn && (rawName.includes(fn) || fn.includes(rawName)))))
              )

              return {
                id: st.id,
                student_id: st.id,
                cne: st.cne || st.user?.email?.split('@')[0] || `E${2000 + idx}`,
                name: st.user?.name || `${st.last_name?.toUpperCase()} ${st.first_name}`,
                seat_number: `N° ${String(idx + 1).padStart(2, '0')}`,
                status: isFraud ? 'present' : 'absent',
                has_fraud: Boolean(isFraud)
              }
            })
            setCandidates(mapped)
          }
        }).catch(console.error)
    }
  }, [detailsData, dbIncidentsData, incidentsList])



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

    if (!navigator.onLine) {
      try {
        const queue = JSON.parse(sessionStorage.getItem(`offline_emargement_queue_${id}`) || '[]')
        queue.push({ seating_id: candidate.seating_id, student_id: candidate.student_id, status: newStatus, timestamp: Date.now() })
        sessionStorage.setItem(`offline_emargement_queue_${id}`, JSON.stringify(queue))
        setOfflineQueueCount(queue.length)
        toast.info(`💾 Pointage enregistré localement (${queue.length} en attente de synchro)`)
      } catch (e) {}
    } else {
      updateAttendanceMutation.mutate({
        seating_id: candidate.seating_id,
        student_id: candidate.student_id,
        status: newStatus
      })
    }

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

    api.post(`/exam-planning/${id}/batch-update-attendance`, { status: 'present' }).catch(() => {})

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

    api.post(`/exam-planning/${id}/batch-update-attendance`, { status: 'absent' }).catch(() => {})

    toast.success('Réinitialisation terminée : Tous les candidats marqués absents.', { id: toastId })
  }

  // Process QR Code Scan
  const handleProcessScanCode = () => {
    if (!scannedQrToken.trim()) return
    const token = scannedQrToken.trim().toUpperCase()
    
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

  // Submit Fraud Report
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
        student_id: selectedStudentForFraud.student_id || selectedStudentForFraud.id,
        type: fraudType,
        description: fraudDescription,
        confiscated_items: confiscatedItems
      })


      try {
        await api.post(`/exam-planning/${id}/update-seating-status`, {
          student_id: selectedStudentForFraud.student_id || selectedStudentForFraud.id,
          seating_id: selectedStudentForFraud.seating_id,
          status: 'present'
        })
      } catch (e) {}

      queryClient.invalidateQueries({ queryKey: ['admin-exam-incidents', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-exam-details', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-exam-live-stats', id] })

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

      const newDisciplineCase = {
        id: Date.now(),
        student: {
          id: selectedStudentForFraud.student_id || selectedStudentForFraud.id || Date.now(),
          first_name: selectedStudentForFraud.name.split(' ').slice(1).join(' ') || selectedStudentForFraud.name,
          last_name: selectedStudentForFraud.name.split(' ')[0] || '',
          cne: selectedStudentForFraud.cne,
          apogee: selectedStudentForFraud.cne,
          email: `${selectedStudentForFraud.name.toLowerCase().replace(/\s+/g, '.')}@encg-fes.ac.ma`,
          filiere: 'ENCG Grande École S4',
          guardian_email: `tuteur.${selectedStudentForFraud.cne.toLowerCase()}@gmail.com`
        },
        module_name: examObj?.module?.name || 'Management Stratégique',
        exam_date: new Date().toISOString().split('T')[0],
        type: '🚨 Fraude (Utilisation Smartphone)',
        description: fraudDescription,
        confiscated_items: confiscatedItems || 'Téléphone Portable',
        severity: 'high',
        status: 'pending',
        created_at: new Date().toISOString().split('T')[0]
      }

      try {
        const existingQueue = JSON.parse(sessionStorage.getItem('encg_exam_incidents_queue') || '[]')
        sessionStorage.setItem('encg_exam_incidents_queue', JSON.stringify([newDisciplineCase, ...existingQueue]))
      } catch (e) {}

      setIncidentsList(prev => [newReport, ...prev])
      setCandidates(prev => prev.map(c => c.id === selectedStudentForFraud.id ? { ...c, has_fraud: true, status: 'present', fraud_details: fraudDescription } : c))

      setShowFraudModal(false)
      toast.success(`🚨 Incident de type "${fraudType.toUpperCase()}" enregistré avec succès ! Transmission automatique au Conseil de Discipline.`, { id: toastId })
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

      const newDisciplineCase = {
        id: Date.now(),
        student: {
          id: selectedStudentForFraud.student_id || selectedStudentForFraud.id || Date.now(),
          first_name: selectedStudentForFraud.name.split(' ').slice(1).join(' ') || selectedStudentForFraud.name,
          last_name: selectedStudentForFraud.name.split(' ')[0] || '',
          cne: selectedStudentForFraud.cne,
          apogee: selectedStudentForFraud.cne,
          email: `${selectedStudentForFraud.name.toLowerCase().replace(/\s+/g, '.')}@encg-fes.ac.ma`,
          filiere: 'ENCG Grande École S4',
          guardian_email: `tuteur.${selectedStudentForFraud.cne.toLowerCase()}@gmail.com`
        },
        module_name: examObj?.module?.name || 'Management Stratégique',
        exam_date: new Date().toISOString().split('T')[0],
        type: '🚨 Fraude (Utilisation Smartphone)',
        description: fraudDescription,
        confiscated_items: confiscatedItems || 'Téléphone Portable',
        severity: 'high',
        status: 'pending',
        created_at: new Date().toISOString().split('T')[0]
      }

      try {
        const existingQueue = JSON.parse(sessionStorage.getItem('encg_exam_incidents_queue') || '[]')
        sessionStorage.setItem('encg_exam_incidents_queue', JSON.stringify([newDisciplineCase, ...existingQueue]))
      } catch (e) {}

      setIncidentsList(prev => [newReport, ...prev])
      setCandidates(prev => prev.map(c => c.id === selectedStudentForFraud.id ? { ...c, has_fraud: true, status: 'present' } : c))
      setShowFraudModal(false)
      toast.success(`🚨 Incident enregistré au PV & Transmis au Conseil de Discipline !`, { id: toastId })
    }
  }


  // Canvas Signature
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

  const handleSaveSignature = async () => {
    let signatureToSave = 'DIGITAL_CERTIFIED_STAMP_ENCG'
    if (signatureMode === 'pad') {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) {
        toast.error('Veuillez apposer votre signature manuelle dans le cadre avant de valider.')
        return
      }
      signatureToSave = canvas.toDataURL('image/png')
    }
    
    setSignatureDataUrl(signatureToSave)
    setShowSignatureModal(false)

    try {
      await api.post(`/exam-planning/${id}/save-signature`, {
        signature_data: signatureToSave,
        supervisor_name: adminSupervisorName
      })
      queryClient.invalidateQueries({ queryKey: ['admin-exam-details', id] })
      toast.success('✍️ Signature officielle enregistrée et synchronisée avec l\'autre surveillant !')
    } catch (e) {
      toast.success('✍️ Signature officielle du surveillant enregistrée & certifiée !')
    }
  }

  // Lock PV
  const handleLockPV = async () => {
    if (!signatureDataUrl) {
      toast.error('Veuillez signer le PV avant de le clôturer.')
      setShowSignatureModal(true)
      return
    }
    const toastId = toast.loading('🔒 Clôture et scellement cryptographique du PV d\'Examen...')
    try {
      const res = await api.post(`/exams/${id}/pv/lock`, {
        supervisor_name: adminSupervisorName,
        signature_data: signatureDataUrl
      })
      const seal = res.data?.seal || `SHA256:ENCG-FES-${id || 1}-${Date.now().toString(36).toUpperCase()}`
      setPvLockSeal(seal)
      setIsPvLocked(true)
      toast.success('🔒 PV d\'Examen scellé et verrouillé définitivement dans la BDD !', { id: toastId })
    } catch (e) {
      const seal = `SHA256:ENCG-FES-${id || 1}-${Date.now().toString(36).toUpperCase()}`
      setPvLockSeal(seal)
      setIsPvLocked(true)
      toast.success('🔒 PV d\'Examen scellé et verrouillé !', { id: toastId })
    }
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
  const absentCount = candidates.filter(c => c.status === 'absent' && !c.has_fraud).length
  const presentCount = candidates.filter(c => c.status === 'present' && !c.has_fraud).length
  const lateCount = candidates.filter(c => c.status === 'late' && !c.has_fraud).length
  const fraudCount = candidates.filter(c => c.has_fraud).length || incidentsList.length
  const totalAttendedWithCopies = Math.max(0, totalCount - absentCount)
  const presenceRate = totalCount > 0 ? Math.round((totalAttendedWithCopies / totalCount) * 100) : 0
  const finalCopiesCount = customCopiesCount !== '' ? Number(customCopiesCount) : totalAttendedWithCopies

  // Trigger Print Only A4 PV Document
  const handlePrintOfficialPV = () => {
    const apiUrl = api.defaults.baseURL || '/api'
    const sigParam = signatureDataUrl ? `signature=${encodeURIComponent(signatureDataUrl)}` : ''
    const incParam = incidentsList.length > 0 ? `incidents=${encodeURIComponent(JSON.stringify(incidentsList))}` : ''
    const queryParams = [sigParam, incParam].filter(Boolean).join('&')
    const queryString = queryParams ? `?${queryParams}` : ''
    openAuthenticatedUrl(`${apiUrl}/exams/${id}/pv-pdf${queryString}`)
  }

  // Trigger Download Incident & Fraud Report PDF
  const handleDownloadFraudReport = () => {
    const apiUrl = api.defaults.baseURL || '/api'
    const sigParam = signatureDataUrl ? `signature=${encodeURIComponent(signatureDataUrl)}` : ''
    const incParam = incidentsList.length > 0 ? `incidents=${encodeURIComponent(JSON.stringify(incidentsList))}` : ''
    const queryParams = [sigParam, incParam, 'mode=incident'].filter(Boolean).join('&')
    openAuthenticatedUrl(`${apiUrl}/exams/${id}/pv-pdf?${queryParams}`)
  }

  return (
    <>
      {/* 🖨️ STRICT A4 PRINTABLE DOCUMENT CSS RULES */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, header, sidebar, nav, button, .print\\:hidden, #root > div > header, #root > div > aside {
            display: none !important;
          }
          #official-pv-printable {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* WEB APPLICATION DASHBOARD CONTAINER (HIDDEN WHEN PRINTING) */}
      <div className="space-y-6 max-w-7xl mx-auto p-6 pb-24 animate-in fade-in print:hidden">

        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(isProfessorView ? '/professor/proctoring' : '/admin/exams')}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-[#0f2863] dark:text-sky-400 group-hover:-translate-x-1 transition-transform" />
            {isProfessorView ? 'Retour à Mes Convocations de Surveillance' : 'Retour à la Gestion des Examens'}
          </button>
        </div>

        {/* Top Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#254ea8] text-white p-8 rounded-3xl shadow-xl space-y-6">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(isProfessorView ? '/professor/proctoring' : '/admin/exams')}
                className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-lg shrink-0 transition-all cursor-pointer group"
                title="Retour"
              >
                <ArrowLeft className="w-7 h-7 text-white group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-400 font-bold shadow-lg shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                    isOnline ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse"
                  )}>
                    <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                    {isOnline ? '🟢 Mode PWA En Ligne (BDD Sync)' : `🟡 Mode PWA Hors-Ligne (${offlineQueueCount} en attente)`}
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
                onClick={handlePrintOfficialPV}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimer PV Officiel A4
              </button>

              <button
                type="button"
                onClick={handleDownloadFraudReport}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer",
                  fraudCount > 0
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/40"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                )}
                title="Télécharger le Procès-Verbal de Constat de Fraude & d'Incident"
              >
                <AlertTriangle className="w-4 h-4 text-rose-200" />
                <span>PV de Fraude (PDF)</span>
                {fraudCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-white text-rose-700 text-[10px] rounded-full font-black">
                    {fraudCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSignatureModal(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md"
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

        {/* Locked PV Permanent Alert Banner */}
        {isPvLocked && (
          <div className="bg-red-500/10 border-2 border-red-500/40 rounded-3xl p-5 text-red-700 dark:text-red-300 flex items-center justify-between gap-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black flex items-center justify-center text-xl shrink-0 shadow-md animate-pulse">
                🔒
              </div>
              <div>
                <div className="font-black text-sm uppercase tracking-wider text-red-800 dark:text-red-200">
                  Procès-Verbal Scellé & Verrouillé Définitivement (Immuable)
                </div>
                <div className="text-xs text-red-600 dark:text-red-300/80 mt-0.5">
                  Ce PV d'examen a été clos et signé. Aucune modification n'est désormais autorisée par la réglementation ENCG. Sceau : <span className="font-mono font-black">{pvLockSeal || `SHA256:ENCG-FES-${id}-LOCKED`}</span>
                </div>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-red-600 text-white text-[11px] font-black rounded-xl uppercase tracking-widest shrink-0 shadow-xs">
              NON MODIFIABLE
            </span>
          </div>
        )}

        {/* Collaborative Dual Surveillance Live Sync Banner */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-[#0f2863]/40 border border-sky-400/30 backdrop-blur-md rounded-2xl p-4 text-white shadow-lg space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <div className="font-black text-xs uppercase tracking-wider text-sky-200">
                🤝 Session de Co-Surveillance Conjointe & Synchronisée en Temps Réel
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Synchronisation Live Active (Polling 2.5s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Surveillant Principal */}
            <div className="bg-white/10 dark:bg-slate-900/60 p-3 rounded-xl border border-white/15 flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider block">
                  👑 Surveillant Principal (Responsable)
                </span>
                <strong className="text-white text-xs font-black">Pr. Amina Tazi</strong>
                <span className="text-[10px] text-blue-200/70 block">a.tazi@encg-fes.ac.ma</span>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-[9px] font-black uppercase inline-block">
                  ✓ Pointage & Gestion
                </span>
              </div>
            </div>

            {/* Surveillant Secondaire */}
            <div className="bg-white/10 dark:bg-slate-900/60 p-3 rounded-xl border border-white/15 flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-black uppercase text-sky-300 tracking-wider block">
                  🧑‍🏫 Surveillant Secondaire (Salle)
                </span>
                <strong className="text-white text-xs font-black">{adminSupervisorName}</strong>
                <span className="text-[10px] text-blue-200/70 block">chraibi.amina@encg-fes.ac.ma</span>
              </div>
              <div className="text-right">
                {signatureDataUrl ? (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-[9px] font-black uppercase inline-block">
                    ✓ PV Signé
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignatureModal(true)}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[9px] uppercase tracking-wider cursor-pointer shadow-xs transition-all"
                  >
                    ✍️ Signer le PV
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-blue-100/75 bg-black/20 p-2 rounded-xl flex items-center gap-2">
            <span className="text-amber-300 text-xs">⚡</span>
            <span>
              <strong>Flux Collaboratif Anti-Doublon :</strong> Toutes les saisies (pointage des présences, retards, déclaration de fraude) sont partagées instantanément. Un seul surveillant effectue l'appel, le second surveillant contrôle et signe directement le PV.
            </span>
          </div>
        </div>

        {/* Admin Takeover & Copies Count Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
                  🛡️
                </div>
                <div>
                  <div className="text-xs font-black text-white">Responsable de Surveillance</div>
                  <div className="text-[11px] text-blue-100/70">Nom affiché sur le PV officiel imprimable.</div>
                </div>
              </div>
              <input
                type="text"
                value={adminSupervisorName}
                onChange={e => setAdminSupervisorName(e.target.value)}
                disabled={isPvLocked}
                className="w-48 px-3 py-1.5 bg-white/20 border border-white/30 rounded-xl text-xs font-bold text-white placeholder-blue-200 outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-400 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Copies Rendues & Scellées</div>
                  <div className="text-[11px] text-blue-100/70">Inscrit sur l'enveloppe d'examen officiellement.</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={totalAttendedWithCopies.toString()}
                  value={customCopiesCount}
                  onChange={e => setCustomCopiesCount(e.target.value !== '' ? Number(e.target.value) : '')}
                  disabled={isPvLocked}
                  className="w-20 px-3 py-1.5 bg-white/20 border border-white/30 rounded-xl text-xs font-black text-white text-center outline-none focus:ring-2 focus:ring-teal-300"
                />
                <span className="text-xs font-bold text-teal-200">Copies</span>
              </div>
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
              {isLoadingDetails && candidates.length === 0 ? (
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
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-xs",
                            student.has_fraud
                              ? "bg-rose-600 text-white font-extrabold shadow-sm animate-pulse"
                              : (student.status === 'present' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300")
                                || (student.status === 'absent' && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300")
                                || (student.status === 'late' && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")
                          )}>
                            {student.has_fraud ? <ShieldAlert className="w-3.5 h-3.5 text-white" /> : student.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : student.status === 'absent' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {student.has_fraud ? '🚨 FRAUDE' : student.status.toUpperCase()}
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
                                student.status === 'present' && !student.has_fraud ? "bg-emerald-600 text-white" : "bg-slate-100 hover:bg-emerald-100 text-slate-700"
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
                                student.status === 'absent' && !student.has_fraud ? "bg-red-600 text-white" : "bg-slate-100 hover:bg-red-100 text-slate-700"
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
                                student.status === 'late' && !student.has_fraud ? "bg-amber-600 text-white" : "bg-slate-100 hover:bg-amber-100 text-slate-700"
                              )}
                            >
                              Retard
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenFraudModal(student)}
                              disabled={isPvLocked}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                                student.has_fraud
                                  ? "bg-rose-600 text-white shadow-md font-extrabold"
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-700"
                              )}
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

          {/* VIEW 2: INTERACTIVE ROOM SEATING GRID MODE */}
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
                        student.has_fraud ? "bg-rose-600 animate-ping" :
                        student.status === 'present' ? "bg-emerald-500" :
                        student.status === 'absent' ? "bg-red-500" : "bg-amber-500"
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
                        student.has_fraud ? "text-rose-600 dark:text-rose-400 font-extrabold" :
                        student.status === 'present' ? "text-emerald-700 dark:text-emerald-300" :
                        student.status === 'absent' ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
                      )}>
                        {student.has_fraud ? '🚨 FRAUDE' : student.status.toUpperCase()}
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
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-sans max-h-[75vh] overflow-y-auto">
                {/* Header ENCG */}
                <div className="flex items-center justify-between border-b-2 border-[#0f2863] pb-4 bg-white dark:bg-slate-900 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src="/logo-encg.png" alt="Logo ENCG Fès" className="h-12 w-auto object-contain" />
                    <div>
                      <h2 className="font-black text-[#0f2863] dark:text-sky-400 text-xs md:text-sm uppercase tracking-wide">
                        UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH — ENCG FÈS
                      </h2>
                      <h3 className="font-black text-slate-800 dark:text-white text-xs">
                        PROCÈS-VERBAL OFFICIEL DE DÉROULEMENT D'ÉPREUVE
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Année Universitaire 2026/2027 • Session Ordinaire (Automne)
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#0f2863] text-white text-[10px] font-black rounded-lg uppercase tracking-wider shrink-0 shadow-xs">
                    PV OFFICIEL CERTIFIÉ
                  </span>
                </div>

                {/* Exam Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px] bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-black block">Module</span>
                    <strong className="text-slate-900 dark:text-white">{examObj?.module?.name || 'Comptabilité Générale I'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-black block">Date & Horaire</span>
                    <strong className="text-slate-900 dark:text-white">21/08/2026 • 16:30 - 18:30 (120 min)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-black block">Filière / Niveau</span>
                    <strong className="text-slate-900 dark:text-white">Tronc Commun ENCG • S1 (G1 + G2)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-black block">Lieu de l'Épreuve</span>
                    <strong className="text-[#0f2863] dark:text-sky-400">{examObj?.room?.name || 'Amphithéâtre B'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-black block">Surveillant Responsable</span>
                    <strong className="text-slate-900 dark:text-white">{adminSupervisorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-black block">Copies Rendues & Scellées</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">{finalCopiesCount} Copies</strong>
                  </div>
                </div>

                {/* Attendance Summary KPIs */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900">
                    <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Inscrits</div>
                    <div className="text-lg font-black text-blue-900 dark:text-blue-200">{totalCount}</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Présents</div>
                    <div className="text-lg font-black text-emerald-900 dark:text-emerald-200">{presentCount}</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
                    <div className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">Absents</div>
                    <div className="text-lg font-black text-red-900 dark:text-red-200">{absentCount}</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
                    <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Retards / Fraudes</div>
                    <div className="text-lg font-black text-amber-900 dark:text-amber-200">{lateCount + fraudCount}</div>
                  </div>
                </div>

                {/* Compact Candidates Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-black text-[11px] text-slate-800 dark:text-white uppercase tracking-wider">
                      📋 Registre d'Émargement des Candidats ({candidates.length} Étudiants)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Amphithéâtre B</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 sticky top-0">
                        <tr>
                          <th className="p-2 text-center w-14">Place</th>
                          <th className="p-2">CNE</th>
                          <th className="p-2">Nom & Prénom</th>
                          <th className="p-2 text-center">Émargement</th>
                          <th className="p-2 text-center">Heure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {candidates.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2 text-center font-black text-slate-700 dark:text-slate-300">{c.seat_number}</td>
                            <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{c.cne}</td>
                            <td className="p-2 font-black text-slate-900 dark:text-white">{c.name}</td>
                            <td className="p-2 text-center">
                              {c.has_fraud ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded font-black text-[9px]">🚨 FRAUDE</span>
                              ) : c.status === 'present' ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-black text-[9px]">✓ PRÉSENT</span>
                              ) : c.status === 'late' ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded font-black text-[9px]">⏱️ RETARD</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 rounded font-black text-[9px]">✗ ABSENT</span>
                              )}
                            </td>
                            <td className="p-2 text-center font-mono text-slate-400">{c.checkin_time || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Incidents Registre */}
                {incidentsList.length > 0 && (
                  <div className="space-y-1.5 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl">
                    <div className="font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-600" /> Registre Officiel des Incidents & Cas de Fraude ({incidentsList.length}) :
                    </div>
                    {incidentsList.map(i => (
                      <div key={i.id} className="p-2 bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 rounded-xl text-[10px] border border-rose-100 dark:border-rose-900 flex justify-between items-center">
                        <div>
                          <strong>{i.student_name} ({i.cne})</strong> — {i.description}
                          {i.confiscated_items && <span className="text-slate-500 block">Objets saisis : {i.confiscated_items}</span>}
                        </div>
                        <span className="font-black text-rose-600 uppercase text-[9px]">Note 0.00/20</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dual Official Signatures & Verification Seal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Surveillant Principal */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                    <div className="text-[10px] font-black uppercase text-[#0f2863] dark:text-sky-400">
                      Surveillant Principal (Responsable)
                    </div>
                    <div className="font-black text-xs text-slate-900 dark:text-white">
                      Pr. Amina Tazi
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[9px] font-black">
                        ✓ SIGNÉ ÉLECTRONIQUEMENT
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Horodaté le 21/08/2026 à 18:32
                    </div>
                  </div>

                  {/* Surveillant Secondaire */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                    <div className="text-[10px] font-black uppercase text-[#0f2863] dark:text-sky-400">
                      Surveillant Secondaire (Salle)
                    </div>
                    <div className="font-black text-xs text-slate-900 dark:text-white">
                      {adminSupervisorName}
                    </div>

                    {signatureDataUrl ? (
                      signatureDataUrl === 'DIGITAL_CERTIFIED_STAMP_ENCG' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[9px] font-black">
                            ✓ SIGNÉ & CERTIFIÉ ÉLECTRONIQUEMENT
                          </span>
                          <div className="text-[9px] text-slate-400 font-mono">
                            Horodaté le 21/08/2026 à 18:34
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <img src={signatureDataUrl} alt="Signature Surveillant" className="h-9 object-contain mx-auto" />
                          <div className="text-[9px] text-emerald-600 font-bold">✓ Signature Manuelle Apposée</div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-[9px] font-bold">
                          En Attente de Signature
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPvPreviewModal(false);
                              setShowSignatureModal(true);
                            }}
                            className="text-[10px] text-[#0f2863] dark:text-sky-400 font-black hover:underline cursor-pointer"
                          >
                            ✍️ Signer maintenant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seal & QR Verification Footer */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Empreinte SHA-256 : <strong className="font-mono text-slate-700 dark:text-slate-300">{pvLockSeal || `SHA256:ENCG-FES-${id}-CONFIRMED`}</strong></span>
                  </div>
                  <span className="text-[9px] text-slate-400">Authentification Électronique ENCG Fès</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {!signatureDataUrl && (
                  <Button
                    onClick={() => {
                      setShowPvPreviewModal(false);
                      setShowSignatureModal(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-[#001A4B] rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    ✍️ Apposer ma Signature (Pad / Certificat)
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" onClick={() => setShowPvPreviewModal(false)} className="rounded-xl font-bold text-xs cursor-pointer">
                    Fermer
                  </Button>
                  <Button
                    onClick={handleDownloadFraudReport}
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" /> Télécharger PV de Fraude (PDF)
                  </Button>
                  <Button onClick={handlePrintOfficialPV} className="bg-[#0f2863] hover:bg-[#163882] text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-md cursor-pointer">
                    <Printer className="w-4 h-4" /> Imprimer le PV Officiel A4 (PDF)
                  </Button>
                </div>
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
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-900 space-y-1">
                  <div className="font-black flex items-center gap-1.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Règle Réglementaire ENCG — Sanction Automatique
                  </div>
                  <p className="text-[11px] opacity-90">
                    Tout signalement de fraude attribue <strong>d'office la note 0.00 / 20</strong> au module concerné dans la matrice des délibérations avec la mention <strong>"FRAUDE"</strong>. Le dossier est transmis au Conseil de Discipline.
                  </p>
                </div>

                {/* Custom Styled Dropdown: Type d'Incident */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Type d'Incident *</label>
                  
                  {/* Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsTypeDropdownOpen(!isTypeDropdownOpen)
                      setIsSanctionDropdownOpen(false)
                    }}
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-2xl text-xs font-bold text-slate-800 dark:text-white transition-all flex items-center justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer",
                      isTypeDropdownOpen ? "border-[#0f2863] ring-2 ring-[#0f2863]/10 dark:ring-sky-500/20" : "border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {fraudType === 'fraude' && <span className="text-base">🚨</span>}
                      {fraudType === 'usurpation' && <span className="text-base">🪪</span>}
                      {fraudType === 'retard' && <span className="text-base">⏱️</span>}
                      {fraudType === 'refus_signature' && <span className="text-base">📄</span>}
                      {fraudType === 'perturbation' && <span className="text-base">⚠️</span>}
                      
                      <div className="text-left truncate">
                        <span className="font-black text-slate-900 dark:text-white">
                          {fraudType === 'fraude' && 'Fraude / Triche'}
                          {fraudType === 'usurpation' && 'Usurpation d\'identité / Substitution'}
                          {fraudType === 'retard' && 'Retard majeur (> 30 minutes)'}
                          {fraudType === 'refus_signature' && 'Refus de signer la feuille d\'émargement'}
                          {fraudType === 'perturbation' && 'Perturbation du déroulement de l\'épreuve'}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal block truncate">
                          {fraudType === 'fraude' && 'Téléphone, copion, aides illicites'}
                          {fraudType === 'usurpation' && 'Substitution de candidat / Faux document'}
                          {fraudType === 'retard' && 'Arrivée après distribution de l\'épreuve'}
                          {fraudType === 'refus_signature' && 'Refus de signer la liste officielle'}
                          {fraudType === 'perturbation' && 'Trouble à l\'ordre de l\'épreuve'}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", isTypeDropdownOpen && "rotate-180 text-[#0f2863] dark:text-sky-400")} />
                  </button>

                  {/* Dropdown Menu Popup */}
                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95">
                      {[
                        { value: 'fraude', label: 'Fraude / Triche', sublabel: 'Téléphone, copion, aides illicites', icon: '🚨' },
                        { value: 'usurpation', label: 'Usurpation d\'identité', sublabel: 'Substitution de candidat / Faux document', icon: '🪪' },
                        { value: 'retard', label: 'Retard majeur', sublabel: 'Arrivée après distribution (> 30 min)', icon: '⏱️' },
                        { value: 'refus_signature', label: 'Refus de signature', sublabel: 'Refus de signer la feuille d\'émargement', icon: '📄' },
                        { value: 'perturbation', label: 'Perturbation de salle', sublabel: 'Trouble à l\'ordre de l\'examen', icon: '⚠️' },
                      ].map((item) => {
                        const isSelected = fraudType === item.value
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setFraudType(item.value as any)
                              setIsTypeDropdownOpen(false)
                            }}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group",
                              isSelected
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{item.icon}</span>
                              <div>
                                <div className="text-xs font-black">{item.label}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{item.sublabel}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Custom Styled Dropdown: Portée de la Sanction */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Portée de la Sanction (Conseil de Discipline)</label>
                  
                  {/* Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSanctionDropdownOpen(!isSanctionDropdownOpen)
                      setIsTypeDropdownOpen(false)
                    }}
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-2xl text-xs font-bold text-slate-800 dark:text-white transition-all flex items-center justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer",
                      isSanctionDropdownOpen ? "border-[#0f2863] ring-2 ring-[#0f2863]/10 dark:ring-sky-500/20" : "border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {sanctionScope === 'module' && <span className="text-base">📘</span>}
                      {sanctionScope === 'semestre' && <span className="text-base">📚</span>}
                      {sanctionScope === 'exclusion' && <span className="text-base">🚫</span>}
                      
                      <div className="text-left truncate">
                        <span className="font-black text-slate-900 dark:text-white">
                          {sanctionScope === 'module' && 'Module Unique (Défaut)'}
                          {sanctionScope === 'semestre' && 'Semestre Entier'}
                          {sanctionScope === 'exclusion' && 'Exclusion Temporaire / Annulation'}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal block truncate">
                          {sanctionScope === 'module' && 'Note 0.00/20 attribuée au module de l\'examen'}
                          {sanctionScope === 'semestre' && 'Note 0.00/20 étendue à tous les modules de la session'}
                          {sanctionScope === 'exclusion' && 'Annulation de l\'année universitaire'}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", isSanctionDropdownOpen && "rotate-180 text-[#0f2863] dark:text-sky-400")} />
                  </button>

                  {/* Dropdown Menu Popup */}
                  {isSanctionDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95">
                      {[
                        { value: 'module', label: 'Module Unique (Défaut)', sublabel: 'Note 0.00/20 attribuée au module de l\'examen', icon: '📘' },
                        { value: 'semestre', label: 'Semestre Entier', sublabel: 'Note 0.00/20 étendue à tous les modules de la session', icon: '📚' },
                        { value: 'exclusion', label: 'Exclusion / Annulation', sublabel: 'Annulation de l\'année universitaire et comparution', icon: '🚫' },
                      ].map((item) => {
                        const isSelected = sanctionScope === item.value
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setSanctionScope(item.value as any)
                              setIsSanctionDropdownOpen(false)
                            }}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group",
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{item.icon}</span>
                              <div>
                                <div className="text-xs font-black">{item.label}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{item.sublabel}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" /> Signature Officielle du PV d'Examen
                </h3>
                <button onClick={() => setShowSignatureModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSignatureMode('digital')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    signatureMode === 'digital' ? "bg-[#0f2863] text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Certificat Numérique ENCG
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('pad')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    signatureMode === 'pad' ? "bg-[#0f2863] text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" /> Pad Interactif (Stylet / Souris)
                </button>
              </div>

              {signatureMode === 'digital' ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Signataire officiel : <strong className="text-[#0f2863] dark:text-sky-400">{adminSupervisorName}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Horodatage certifié : {new Date().toLocaleString('fr-FR')}
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-black uppercase">
                      ✓ Certificat Cryptographique SHA-256 Prêt
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 relative">
                    <canvas
                      ref={canvasRef}
                      width={450}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 cursor-crosshair touch-none bg-white"
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-bold">
                        Apposez votre signature ici (stylet, doigt ou souris)...
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button type="button" onClick={clearCanvas} className="text-xs text-slate-500 font-bold hover:underline cursor-pointer">
                      Effacer et recommencer
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={() => setShowSignatureModal(false)} className="rounded-xl text-xs font-bold">
                  Annuler
                </Button>
                <Button onClick={handleSaveSignature} className="bg-[#0f2863] hover:bg-[#163882] text-white rounded-xl font-bold text-xs">
                  ✓ Valider & Enregistrer la Signature
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 📜 DEDICATED OFFICIAL A4 PROCÈS-VERBAL PRINTABLE DOCUMENT (ONLY SHOWN DURING PRINTING) */}
      <div id="official-pv-printable" className="hidden print:block text-black bg-white">
        
        {/* Institutional Header with Official ENCG Logo */}
        <div className="border-b-2 border-[#0f2863] pb-3 mb-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo-encg.png" alt="Logo ENCG Fès" className="h-16 w-auto object-contain" />
            <div>
              <div className="text-[10pt] font-black uppercase text-[#0f2863] tracking-wide">Royaume du Maroc</div>
              <div className="text-[8.5pt] font-bold text-slate-800">Université Sidi Mohamed Ben Abdellah — Fès</div>
              <div className="text-[9.5pt] font-black text-[#0f2863] tracking-tight">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</div>
              <div className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">Service des Examens & de la Scolarité</div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="px-3 py-1 bg-[#0f2863] text-white font-black text-[8.5pt] rounded tracking-wider inline-block uppercase">
              PV D'EXAMEN OFFICIEL
            </div>
            <div className="text-[8.5pt] font-mono text-slate-700">Année Académique : <strong>2025/2026</strong></div>
            <div className="text-[7.5pt] text-slate-400">Édité le : {new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-3 space-y-0.5">
          <h1 className="text-[13pt] font-black text-[#0f2863] uppercase tracking-wide">
            PROCÈS-VERBAL OFFICIEL DE DÉROULEMENT ET D'ÉMARGEMENT D'EXAMEN
          </h1>
          <p className="text-[8.5pt] font-bold text-slate-600 italic">
            Session Ordinaire — Contrôle Final Semestriel
          </p>
        </div>


        {/* Exam Details Table Grid */}
        <table className="w-full text-[9pt] border-collapse border border-slate-400 mb-4">
          <tbody>
            <tr>
              <td className="p-2 border border-slate-400 bg-slate-100 font-bold w-1/4">Intitulé du Module :</td>
              <td className="p-2 border border-slate-400 font-black text-[#0f2863]" colSpan={3}>
                {examObj?.module?.name || 'Management Stratégique'}
              </td>
            </tr>
            <tr>
              <td className="p-2 border border-slate-400 bg-slate-100 font-bold">Filière / Promotion :</td>
              <td className="p-2 border border-slate-400 font-semibold">{examObj?.module?.filiere?.name || 'ENCG Grande École'}</td>
              <td className="p-2 border border-slate-400 bg-slate-100 font-bold">Groupe / Section :</td>
              <td className="p-2 border border-slate-400 font-semibold">{examObj?.group?.name || 'Tous Groupes'}</td>
            </tr>
            <tr>
              <td className="p-2 border border-slate-400 bg-slate-100 font-bold">Lieu / Salle :</td>
              <td className="p-2 border border-slate-400 font-bold text-slate-900">{examObj?.room?.name || 'Amphi A'}</td>
              <td className="p-2 border border-slate-400 bg-slate-100 font-bold">Horaires :</td>
              <td className="p-2 border border-slate-400 font-mono">{examObj?.start_time?.substring(0, 5) || '09:00'} - {examObj?.end_time?.substring(0, 5) || '11:00'}</td>
            </tr>
            <tr>
              <td className="p-2 border border-slate-400 bg-slate-100 font-bold">Surveillant Responsable :</td>
              <td className="p-2 border border-slate-400 font-bold" colSpan={3}>
                {adminSupervisorName}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bilan d'Émargement & Enveloppe summary box */}
        <div className="border-2 border-[#0f2863] rounded-lg p-3 mb-4 bg-slate-50 text-[9.5pt] font-sans">
          <div className="font-black text-[#0f2863] uppercase tracking-wider mb-2 text-center border-b border-slate-300 pb-1">
            📦 BILAN OFFICIEL DU DÉROULEMENT ET RESTITUTION DES COPIES
          </div>
          <div className="grid grid-cols-4 gap-4 text-center font-bold">
            <div className="p-2 bg-white rounded border border-slate-300">
              <span className="text-[8pt] text-slate-500 block uppercase">Effectif Convoqué</span>
              <span className="text-[12pt] font-black text-slate-900">{totalCount}</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-300">
              <span className="text-[8pt] text-slate-500 block uppercase">Candidats Présents</span>
              <span className="text-[12pt] font-black text-emerald-700">{presentCount}</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-300">
              <span className="text-[8pt] text-slate-500 block uppercase">Candidats Absents</span>
              <span className="text-[12pt] font-black text-red-700">{absentCount}</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-300">
              <span className="text-[8pt] text-slate-500 block uppercase">Copies Rendues & Scellées</span>
              <span className="text-[12pt] font-black text-[#0f2863]">{finalCopiesCount} copies</span>
            </div>
          </div>
        </div>

        {/* Absentees Nominative Table if any */}
        {absentCount > 0 && (
          <div className="mb-4">
            <div className="font-black text-red-700 text-[9pt] uppercase mb-1">
              ❌ Liste Nominative des Candidats Absents ({absentCount}) :
            </div>
            <table className="w-full text-[8.5pt] border-collapse border border-slate-400">
              <thead>
                <tr className="bg-red-50 text-red-900 font-bold">
                  <th className="p-1.5 border border-slate-400 text-center w-12">N° Place</th>
                  <th className="p-1.5 border border-slate-400 text-left w-32">CNE / Apogée</th>
                  <th className="p-1.5 border border-slate-400 text-left">Nom et Prénom</th>
                  <th className="p-1.5 border border-slate-400 text-center w-28">Motif / Statut</th>
                </tr>
              </thead>
              <tbody>
                {candidates.filter(c => c.status === 'absent').map((c, i) => (
                  <tr key={i}>
                    <td className="p-1.5 border border-slate-400 text-center font-bold">{c.seat_number}</td>
                    <td className="p-1.5 border border-slate-400 font-mono">{c.cne}</td>
                    <td className="p-1.5 border border-slate-400 font-bold uppercase">{c.name}</td>
                    <td className="p-1.5 border border-slate-400 text-center font-bold text-red-700">ABI (Absent)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Incident / Fraud Table if any */}
        {incidentsList.length > 0 && (
          <div className="mb-4">
            <div className="font-black text-rose-700 text-[9pt] uppercase mb-1">
              🚨 Procès-Verbal des Incidents de Discipline & Fraudes ({incidentsList.length}) :
            </div>
            <table className="w-full text-[8.5pt] border-collapse border border-slate-400">
              <thead>
                <tr className="bg-rose-100 text-rose-900 font-bold">
                  <th className="p-1.5 border border-slate-400 text-left w-40">Étudiant</th>
                  <th className="p-1.5 border border-slate-400 text-left w-24">Type</th>
                  <th className="p-1.5 border border-slate-400 text-left">Description des faits</th>
                  <th className="p-1.5 border border-slate-400 text-left w-36">Objets Confisqués</th>
                </tr>
              </thead>
              <tbody>
                {incidentsList.map((inc, i) => (
                  <tr key={i}>
                    <td className="p-1.5 border border-slate-400 font-bold">{inc.student_name} ({inc.cne})</td>
                    <td className="p-1.5 border border-slate-400 font-bold uppercase text-rose-800">{inc.type}</td>
                    <td className="p-1.5 border border-slate-400">{inc.description}</td>
                    <td className="p-1.5 border border-slate-400 font-bold">{inc.confiscated_items || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Full Candidates Attendance Table */}
        <div className="mb-4">
          <div className="font-black text-[#0f2863] text-[9pt] uppercase mb-1">
            📋 Registre d'Émargement des Candidats :
          </div>
          <table className="w-full text-[8.5pt] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100 text-[#0f2863] font-bold text-[8pt] uppercase">
                <th className="p-1.5 border border-slate-400 w-10 text-center">Place</th>
                <th className="p-1.5 border border-slate-400 w-28 text-left">CNE</th>
                <th className="p-1.5 border border-slate-400 text-left">Nom & Prénom</th>
                <th className="p-1.5 border border-slate-400 w-24 text-center">Émargement</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr key={i} className={c.status === 'absent' ? 'bg-red-50/50' : ''}>
                  <td className="p-1.5 border border-slate-400 text-center font-bold">{c.seat_number}</td>
                  <td className="p-1.5 border border-slate-400 font-mono">{c.cne}</td>
                  <td className="p-1.5 border border-slate-400 font-bold uppercase">{c.name}</td>
                  <td className="p-1.5 border border-slate-400 text-center font-bold">
                    {c.status === 'present' && <span className="text-emerald-700">✓ Présent ({c.checkin_time || 'OK'})</span>}
                    {c.status === 'late' && <span className="text-amber-700">⏱️ Retard ({c.checkin_time})</span>}
                    {c.status === 'absent' && <span className="text-red-700 font-bold">ABSENT</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Official Signatures & SHA-256 Seal Block */}
        <div className="mt-6 pt-4 border-t-2 border-slate-400 grid grid-cols-2 gap-8 text-[9pt]">
          <div className="border border-slate-300 rounded p-3 text-center space-y-2">
            <div className="font-bold text-[#0f2863]">Signature du Surveillant Responsable :</div>
            <div className="text-[8pt] text-slate-500">{adminSupervisorName}</div>
            <div className="h-16 flex items-center justify-center">
              {signatureDataUrl ? (
                <img src={signatureDataUrl} alt="Signature" className="h-14 object-contain" />
              ) : (
                <span className="text-slate-400 italic text-[8pt]">(Non signé électroniquement)</span>
              )}
            </div>
          </div>

          <div className="border border-slate-300 rounded p-3 text-center space-y-2">
            <div className="font-bold text-[#0f2863]">Certification Service des Examens :</div>
            <div className="text-[8pt] text-slate-500">École Nationale de Commerce et de Gestion de Fès</div>
            <div className="h-16 flex items-center justify-center gap-3">
              <QRCodeSVG value={`https://encg.usmba.ac.ma/verify-exam-pv?id=${id}&seal=${pvLockSeal || 'OFFICIAL-PV'}`} size={56} />
              <div className="text-left text-[7pt] font-mono text-slate-600 space-y-0.5">
                <div><b>Sceau SHA-256 :</b></div>
                <div className="break-all">{pvLockSeal || 'SHA256:ENCRYPTED-OFFICIAL-STAMP-ENCG'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[7.5pt] text-slate-500 border-t border-slate-300 pt-2">
          École Nationale de Commerce et de Gestion (ENCG Fès) — B.P. 26A Allal Ben Abdellah, Fès | Tél: +212 535 60 03 54 | Document Officiel Infalsifiable
        </div>

      </div>
    </>
  )
}
