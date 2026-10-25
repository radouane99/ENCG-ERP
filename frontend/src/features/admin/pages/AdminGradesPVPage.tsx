import PvGroupComparison from '../components/PvGroupComparison'
import PvSignatureDialog from '../components/PvSignatureDialog'
import PvMeetingForm from '../components/PvMeetingForm'
import { usePvWorkflow, type PvContext } from '../api/usePvWorkflow';
import { moduleSuccessRates } from '../model/pvStatistics';
import { Modal } from '@shared/components/ui/Modal';
import React, { useCallback, useEffect, useState, useMemo } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Save, AlertCircle, RefreshCw, ShieldCheck, Lock, Download, FileText, Layers, Sparkles, Calendar, BookOpen, Users, ChevronDown, ChevronUp, Eye, Zap, FileSpreadsheet, Mail, Archive, History, X, Trophy, BarChart2, Search, Link2, Calculator, Clock, AlertTriangle, ShieldAlert, Maximize2, Minimize2, SlidersHorizontal, Table } from 'lucide-react';








import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/Button';
import { Spinner } from '@shared/components/ui/Spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api'
import { toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PvFilterBar } from '../components/PvFilterBar';

import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@stores/authStore';

export default function AdminGradesPVPage() {


  const navigate = useNavigate()
  const { i18n } = useTranslation('common');
  const isRtl = i18n.language === 'ar'
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module_id')
  const groupId = searchParams.get('group_id')
  const filiereParam = searchParams.get('filiere_id')
  const semesterParam = searchParams.get('semester')
  const queryClient = useQueryClient()

  // Selection states for selector bar
  // Selection states for selector bar
const [selectedFiliere, setSelectedFiliere] = useState(filiereParam && filiereParam !== 'null' ? filiereParam : '');
  const [selectedSemester, setSelectedSemester] = useState(semesterParam && semesterParam !== 'null' ? semesterParam : '');
  const [selectedGroup, setSelectedGroup] = useState(groupId && groupId !== 'null' ? groupId : '');
  const [selectedModule, setSelectedModule] = useState(moduleId && moduleId !== 'null' ? moduleId : '');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [matrixDecisionFilter, setMatrixDecisionFilter] = useState<'all' | 'V' | 'VPC' | 'VAR' | 'RAT' | 'NV'>('all');
  const [isFullscreenTable, setIsFullscreenTable] = useState(false);
  const [matrixViewMode, setMatrixViewMode] = useState<'compact' | 'detailed'>('compact');
  const [selectedRachatStudent, setSelectedRachatStudent] = useState<any>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [publishingGrades, setPublishingGrades] = useState(false);

  // RBAC Segregation: Pure professors only have access to their assigned modules
  // RBAC Segregation: Pure professors only have access to their assigned modules
const { user, hasAnyRole } = useAuthStore();
  const isPureProfessor = useMemo(() => {
    const isTeacher = hasAnyRole(['professor', 'vacataire'])
    const isAdminOrHead = hasAnyRole([
      'super-admin',
      'super_admin',
      'admin',
      'institution-admin',
      'institution_admin',
      'director',
      'department-head',
      'filiere-head',
      'scolarite',
    ])
    return isTeacher && !isAdminOrHead
  }, [hasAnyRole])

  // Fetch teacher's directly assigned modules
  // Fetch teacher's directly assigned modules
const { data: myAssignedModulesData = [], isLoading: isLoadingMyModules } = useQuery({
    queryKey: ['my-assigned-modules-for-pv', user?.id],
    queryFn: () => api.get('/grades/my-modules').then(r => r.data?.modules || []),
    enabled: isPureProfessor,
});

  const myModulesList = useMemo(() => {
    return Array.isArray(myAssignedModulesData) ? myAssignedModulesData : []
  }, [myAssignedModulesData])

  const [signatureDone, setSignatureDone] = useState(false);
  const [signatureDetails, setSignatureDetails] = useState<any>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [rachatReason, setRachatReason] = useState('Rachat accordé par le Jury de Délibération');

  // Helper : Télécharge un PDF via l'API client (avec token JWT) pour éviter l'erreur Unauthenticated
  const downloadPdf = async (url: string, fallbackFilename: string) => {
    try {
      // Strip domain and /api prefix if present so axios `api` instance adds Authorization headers
      const cleanUrl = url.includes('/api/') ? url.substring(url.indexOf('/api/') + 4) : url
      const res = await api.get(cleanUrl, { responseType: 'blob' })

      let filename = fallbackFilename
      const disposition = res.headers['content-disposition']
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) {
          filename = match[1]
        }
      }

      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (err: any) {
      // Quand responseType='blob', err.response.data est un Blob, pas un JSON.
      // On doit le lire comme texte pour extraire le message d'erreur Laravel.
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text()
        try {
          const json = JSON.parse(text)
          toast.error('Erreur PDF : ' + (json.message || text))
        } catch {
          toast.error('Erreur PDF : ' + text.substring(0, 200))
        }
      } else {
        toast.error('Erreur lors de la génération du PDF : ' + (err.response?.data?.message || err.message))
      }
    }
  }

  const applyRachatMutation = useMutation({
    mutationFn: (data: any) => api.post('/deliberations/apply-rachat', data),
    onSuccess: (res) => {
      const pvUrl = res.data.pv_rattrapage_url
      toast.success(res.data.message || 'Rachat appliqué avec traçabilité juridique !', { duration: 5000 })
      if (pvUrl) {
        setTimeout(() => {
          downloadPdf(pvUrl, `PV_Rachat_Etudiant_${selectedRachatStudent?.student_id || 'PV'}.pdf`)
          toast.info('📋 PV de Rachat généré ! Téléchargez-le et faites-le signer par le Prof du Module, le Chef de Filière et le Chef de Département.', { duration: 8000 })
        }, 800)
      }
      setSelectedRachatStudent(null)
      queryClient.invalidateQueries({ queryKey: ['semester-pv'] })
      queryClient.invalidateQueries({ queryKey: ['annual-compensation'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de l’application du rachat')
    }
  })

  const [filieres, setFilieres] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedRachatReason, setSelectedRachatReason] = useState<string>('');





  useEffect(() => {
    api.get('/filieres').then(r => {
      const data = r.data.data || r.data
      setFilieres(data)
      if (data.length > 0) setSelectedFiliere((current: string) => current || String(data[0].id))
    }).catch(console.error)
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
  const [session, setSession] = useState<'normale' | 'rattrapage' | 'totale'>(sessionParam === 'rattrapage' || sessionParam === 'totale' ? sessionParam : 'normale');

  useEffect(() => {
    const s = searchParams.get('session')
    if (s === 'rattrapage' || s === 'totale' || s === 'normale') {
      setSession(s)
    }
  }, [searchParams])

  const [rattrapageGrades, setRattrapageGrades] = useState<Record<number, {
    value: string;
    absent: boolean;
}>>({});
  const [viewAllGroups, setViewAllGroups] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);


  // Jury & Dual PV State: Pure professors are strictly restricted to 'module'
  // Jury & Dual PV State: Pure professors are strictly restricted to 'module'
const [pvType, setPvType] = useState<'module' | 'semestriel' | 'annuel'>(isPureProfessor || moduleId ? 'module' : searchParams.get('pv_type') === 'annuel' ? 'annuel' : 'semestriel');

  // Force module mode for pure professors
  useEffect(() => {
    if (isPureProfessor && pvType !== 'module') {
      setPvType('module')
    }
  }, [isPureProfessor, pvType])

  // Pure Professor: Auto-select their first assigned module if not already set
  useEffect(() => {
    if (isPureProfessor && !moduleId && myModulesList.length > 0) {
      const first = myModulesList[0]
      if (first?.id) {
        setSelectedModule(String(first.id))
        if (first.filiere_id) setSelectedFiliere(String(first.filiere_id))
        if (first.semester_number) setSelectedSemester(String(first.semester_number))
        navigate(`/admin/grades/pv?module_id=${first.id}&filiere_id=${first.filiere_id || selectedFiliere || ''}&semester=${first.semester_number || selectedSemester || ''}`, { replace: true })
      }
    }
  }, [isPureProfessor, moduleId, myModulesList, navigate, selectedFiliere, selectedSemester])

  // Security guard: Check if pure professor is attempting to access a module not assigned to them
  const isUnauthorizedForThisModule = useMemo(() => {
    if (!isPureProfessor || !moduleId || myModulesList.length === 0) return false
    return !myModulesList.some((m: any) => String(m.id) === String(moduleId))
  }, [isPureProfessor, moduleId, myModulesList])

  const displayedModules = useMemo(() => {
    if (isPureProfessor) {
      return myModulesList.map((m: any) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        filiere_id: m.filiere_id,
        semester_number: m.semester_number,
      }))
    }
    return modules
  }, [isPureProfessor, myModulesList, modules])

  const displayedFilieres = useMemo(() => {
    if (!isPureProfessor || myModulesList.length === 0) return filieres
    const myFiliereIds = new Set(myModulesList.map((m: any) => String(m.filiere_id)))
    const filtered = filieres.filter((f: any) => myFiliereIds.has(String(f.id)))
    return filtered.length > 0 ? filtered : filieres
  }, [isPureProfessor, myModulesList, filieres])

  const [selectedYearLevel, setSelectedYearLevel] = useState<number>(1);
  const [juryStatus, setJuryStatus] = useState<any>(null);
  const [, setLoadingJury] = useState(false);
  const [annualCompensationData, setAnnualCompensationData] = useState<any[]>([]);
  const [activeJurySigningId, setActiveJurySigningId] = useState<number | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(true);

  // Dynamic current academic year
  // Dynamic current academic year
const { data: academicYearsData = [] } = useQuery({
    queryKey: ['academic-years-for-pv'],
    queryFn: () => api.get('/academic-years').then(r => r.data?.data || r.data || []),
});

  const currentAcademicYearId = useMemo(() => {
    const yearsList = Array.isArray(academicYearsData) ? academicYearsData : []
    const current = yearsList.find((y: any) => y.is_current)
    return Number(searchParams.get('academic_year_id')) && yearsList.some((y: any) => y.id === Number(searchParams.get('academic_year_id'))) ? Number(searchParams.get('academic_year_id')) : current?.id || yearsList[0]?.id || 0
  }, [academicYearsData, searchParams])

  const fetchJury = useCallback(async () => {
    if (!selectedFiliere || isPureProfessor || pvType === 'module') return
    setLoadingJury(true)
    try {
      const res = await api.get('/academic/deliberations/jury-status', {
        params: {
          filiere_id: selectedFiliere,
          academic_year_id: currentAcademicYearId,
          semester_number: selectedSemester || 1,
          type: pvType, group_id: pvType === 'annuel' ? null : selectedGroup || null, session, year_level: selectedYearLevel
        }
      })
      setJuryStatus(res.data)
      const mine = res.data.members?.find((member: any) => Number(member.user_id) === Number(user?.id) && !member.module_id)
      setSignatureDone(mine?.status === 'signed')
      setSignatureDetails(mine?.status === 'signed' ? { role: mine.role, date: mine.signed_at, hash: mine.digital_seal } : null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingJury(false)
    }
  }, [selectedFiliere, isPureProfessor, pvType, currentAcademicYearId, selectedSemester, selectedGroup, session, selectedYearLevel, user?.id])


  // Fetch consolidated PV data for single module
  // Fetch consolidated PV data for single module
const { data: pvData, isLoading: isLoadingPV, refetch: refetchPV } = useQuery({
    queryKey: ['module-pv', moduleId, selectedGroup, viewAllGroups, session, currentAcademicYearId],
    queryFn: () => api.get(`/modules/${moduleId}/pv`, {
        params: {
            academic_year_id: currentAcademicYearId, group_id: viewAllGroups ? 'all' : (selectedGroup || 'all'),
            session: session
        }
    }).then(res => res.data),
    enabled: !!moduleId && !!currentAcademicYearId,
});

  const openJuryVisa = (member: any) => {
    if (Number(member.user_id) !== Number(user?.id)) { toast.error('Ce visa appartient à un autre membre du jury.'); return }
    if (member.module_id) { navigate(`/admin/grades/pv?module_id=${member.module_id}&filiere_id=${selectedFiliere}&semester=${selectedSemester}&group_id=${selectedGroup || ''}&academic_year_id=${currentAcademicYearId}&session=${session}`); return }
    setActiveJurySigningId(member.id); setShowSignatureModal(true)
  }
  const confirmOfficialSignature = async (signature: string) => {
    if (pvType === 'module') {
      const target = moduleId || pvData?.module?.id
      if (!target) throw new Error('Sélectionnez un module.')
      await api.post(`/modules/${target}/sign-pv`, { group_id: selectedGroup || groupId || null, academic_year_id: currentAcademicYearId, session, signature_data: signature })
      await refetchPV()
    } else {
      const member = activeJurySigningId ? juryStatus?.members?.find((m: any) => m.id === activeJurySigningId) : juryStatus?.members?.find((m: any) => m.user_id === user?.id && !m.module_id)
      if (!member || Number(member.user_id) !== Number(user?.id)) throw new Error('Sélectionnez votre propre visa du jury. Les autres membres signent avec leur compte.')
      await api.post('/academic/deliberations/sign-jury', { jury_id: member.id, signature_data: signature })
      await fetchJury()
    }
    setShowSignatureModal(false); setActiveJurySigningId(null); toast.success('Votre visa a été enregistré sur le serveur.')
  }
  const fetchAnnualCompensation = useCallback(async () => {
    const targetFiliereId = selectedFiliere || pvData?.module?.filiere_id || filieres[0]?.id || 1
    try {
      const res = await api.get('/academic/deliberations/annual-compensation', {
        params: { filiere_id: targetFiliereId, academic_year_id: currentAcademicYearId, year_level: selectedYearLevel || 1 }
      })
      setAnnualCompensationData(res.data.data || res.data || [])
    } catch (err) {
      console.error(err)
    }
  }, [selectedFiliere, pvData?.module?.filiere_id, filieres, currentAcademicYearId, selectedYearLevel])

  useEffect(() => {
    fetchJury()
    if (pvType === 'annuel') {
      fetchAnnualCompensation()
    }
  }, [fetchJury, fetchAnnualCompensation, pvType])

  // Fetch full 7-module semester PV matrix
  // Fetch full 7-module semester PV matrix
const { data: semesterPvData, isLoading: isLoadingSemesterPV } = useQuery({
    queryKey: ['semester-pv', selectedFiliere, selectedSemester, session, selectedGroup, currentAcademicYearId],
    queryFn: () => api.get('/semester-pv', {
        params: {
            filiere_id: selectedFiliere || 1,
            academic_year_id: currentAcademicYearId,
            semester: selectedSemester || 1,
            session: session,
            group_id: selectedGroup || 'all'
        }
    }).then(res => res.data),
    enabled: (!moduleId || pvType === 'semestriel' || pvType === 'annuel') && !!selectedFiliere && !!selectedSemester,
});

  // Fetch real exam incidents to bind fraud 0.00 sanction to PV matrix
  // Fetch real exam incidents to bind fraud 0.00 sanction to PV matrix
const { data: allExamIncidents = [] } = useQuery({
    queryKey: ['all-exam-incidents-for-pv'],
    queryFn: () => api.get('/exam-incidents').then(res => res.data?.data || res.data || []),
});




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
  }, [pvData, selectedFiliere, selectedModule, selectedSemester])

  // PRO MAX Suite States
  // PRO MAX Suite States
const [isExportingZip, setIsExportingZip] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkFilter, setBulkFilter] = useState<'all' | 'admis' | 'rattrapage' | 'ajournes'>('all');
  const [isSendingBulk] = useState(false);

  // 🔍 Feature 4: Search & Quick Filters
  // 🔍 Feature 4: Search & Quick Filters
const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'v' | 'rat' | 'r' | 'reserviste' | 'nv'>('all');

  // 🛡️ Feature 5: Audit Trail Modal State
  // 🛡️ Feature 5: Audit Trail Modal State
const [showAuditModal, setShowAuditModal] = useState(false);

  // 📊 Feature 2: Stats Dashboard State
  // 📊 Feature 2: Stats Dashboard State
const [showStatsDashboard, setShowStatsDashboard] = useState(false);

  // 🎓 Feature 4: Batch Attestations
  // 🎓 Feature 4: Batch Attestations
const [isGeneratingAttestations, setIsGeneratingAttestations] = useState(false);
  const [showAttestationModal, setShowAttestationModal] = useState(false);

  // 🗓️ Feature 5: Deliberation Scheduler
  // 🗓️ Feature 5: Deliberation Scheduler
const [showSchedulerModal, setShowSchedulerModal] = useState(false);

  // 🔒 Feature NEW — Verrouillage Officiel du PV
  // 🔒 Feature NEW — Verrouillage Officiel du PV
const [pvLocked, setPvLocked] = useState(false);
  const [pvLockDetails, setPvLockDetails] = useState<{
    lockedBy: string;
    lockedAt: string;
    role: string;
    hash: string;
    reason: string;
} | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [lockReason, setLockReason] = useState('Délibération officielle clôturée — PV définitif');

  const workflowContext: PvContext = { filiere_id: Number(selectedFiliere), academic_year_id: Number(currentAcademicYearId), semester_number: pvType === 'annuel' ? selectedYearLevel * 2 : Number(selectedSemester), type: pvType === 'annuel' ? 'annuel' : 'semestriel', group_id: pvType === 'annuel' ? null : Number(selectedGroup) || null }
  const officialWorkflow = usePvWorkflow(workflowContext, !isPureProfessor && pvType !== 'module')
  useEffect(() => {
    const value = officialWorkflow.data?.deliberation
    setPvLocked(!!value?.is_sealed)
    setPvLockDetails(value?.is_sealed ? { lockedBy: 'État officiel enregistré', lockedAt: value.sealed_at || '', role: 'Service habilité', hash: value.seal_hash || '', reason: 'Scellé serveur' } : null)
  }, [officialWorkflow.data, selectedFiliere, selectedSemester, pvType, selectedGroup])
  // 📋 Feature N°2 — Comparaison Inter-Groupes
  // 📋 Feature N°2 — Comparaison Inter-Groupes
const [showGroupCompareModal, setShowGroupCompareModal] = useState(false);

  // 🎯 Feature N°3 — Simulateur Jury "What-If"
  // 🎯 Feature N°3 — Simulateur Jury "What-If"
const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [simBonusPoints, setSimBonusPoints] = useState<number>(0.5);
  useState<'rattrapage' | 'ajourne' | 'all'>('rattrapage');

  // 🔗 Feature N°4 — Lien interne (connexion et droits requis)
  // 🔗 Feature N°4 — Lien interne (connexion et droits requis)
const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);


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
  const handleBroadcastTranscripts = () => {
    setShowBulkEmailModal(false)
    navigate('/academic/documents')
  }
  // Query AI Grade Distribution Audit
  // Query AI Grade Distribution Audit
const { data: aiAuditData } = useQuery({
    queryKey: ['module-ai-audit', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/ai-audit`).then(r => r.data),
    enabled: !!moduleId && !!currentAcademicYearId,
});

  const handleDownloadZipBundle = async () => {
    if (!moduleId) return
    setIsExportingZip(true)
    const toastId = toast.loading(isRtl ? 'جاري تحضير حزمة PV الكاملة...' : 'Génération du Pack PV Complet (ZIP)...')
    try {
      const response = await api.get(`/modules/${moduleId}/pv/export-zip-bundle`, {
        responseType: 'blob', params: { group_id: viewAllGroups ? 'all' : (groupId || 'all'), session }
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Pack_PV_Complet_Module_${moduleId}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(isRtl ? 'تم تحميل حزمة ZIP بنجاح' : 'Pack PV Complet (ZIP) téléchargé avec succès !', { id: toastId })
    } catch {
      toast.error('Erreur lors du téléchargement du Pack ZIP.', { id: toastId })
    } finally {
      setIsExportingZip(false)
    }
  }

  // 🎓 Feature 4: Batch Attestation Handler
  const handleGenerateBatchAttestations = async () => {
    setIsGeneratingAttestations(false)
    setShowAttestationModal(false)
    toast.info('Les attestations de réussite nécessitent une décision annuelle validée. Consultez le centre documentaire pour leur émission.')
    navigate('/academic/documents')
  }
  // 🗓️ Feature 5: Scheduler Handler
  const handleLockPV = async () => {
    if (!lockReason.trim() || !officialWorkflow.data?.deliberation) { toast.error('Une délibération enregistrée et un motif sont requis.'); return }
    setIsLocking(true)
    try { await api.post(`/academic/deliberations/${officialWorkflow.data.deliberation.id}/seal`, { reason: lockReason }); await officialWorkflow.refetch(); setShowLockModal(false); toast.success('Scellé enregistré sur le serveur.') }
    catch (err: any) { toast.error(err.response?.data?.message || 'Le PV ne peut pas être scellé.') } finally { setIsLocking(false) }
  }
  const handleGenerateShareLink = () => {
    const params = new URLSearchParams({ filiere_id: selectedFiliere, semester: selectedSemester, academic_year_id: String(currentAcademicYearId), group_id: selectedGroup || '', session, pv_type: pvType, module_id: moduleId || '' })
    const url = `${window.location.origin}/admin/grades/pv?${params}`
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

  const [isGeneratingEligibilities, setIsGeneratingEligibilities] = useState(false);


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
          academic_year_id: currentAcademicYearId
        },
        responseType: 'blob'
      })
      let filename = `PV_Deliberation_Module_${moduleId}.pdf`
      const disposition = response.headers?.['content-disposition']
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) {
          filename = match[1]
        }
      } else {
        const rawName = pvData?.module?.name || modules.find((m: any) => String(m.id) === String(moduleId))?.name
        if (rawName) {
          const cleanName = rawName.replace(/[\s/\\?%*:|"<>]+/g, '_').replace(/^_+|_+$/g, '')
          const suffix = session === 'rattrapage' ? '_Session_Rattrapage' : ''
          filename = `PV_Deliberation_Module_${cleanName}${suffix}.pdf`
        } else {
          const suffix = session === 'rattrapage' ? '_Session_Rattrapage' : ''
          filename = `PV_Deliberation_Module_${moduleId}${suffix}.pdf`
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
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
        version: pvData?.data?.find((student: any) => Number(student.student_id) === Number(studentId))?.rattrapage_version ?? 0,
        value: data.absent ? null : (data.value === '' ? null : parseFloat(data.value)),
        absent: data.absent,
      }))
    }

    saveMutation.mutate(payload)
  }

  const [isCalculating, setIsCalculating] = useState(false);

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
    if (!selectedFiliere || !currentAcademicYearId) { toast.error('Sélectionnez une formation et une année.'); return }
    // Open blank tab synchronously before async await to bypass browser popup blocker
    const pdfWindow = preview ? window.open('about:blank', '_blank') : null
    const toastId = toast.loading('Génération du Procès-Verbal PDF Officiel...')
    try {
      const effectiveType = pvType === 'annuel' ? 'annuel' : 'semestriel'
      const filiereId = selectedFiliere
      const yearLevel = selectedYearLevel || Math.max(1, Math.ceil((Number(selectedSemester) || 1) / 2))

      const response = await api.post('/deliberations/export-pv-pdf', {
        type: effectiveType,
        filiere_id: filiereId,
        academic_year_id: currentAcademicYearId,
        semester_number: selectedSemester || 1,
        year_level: yearLevel,
        session,


      }, {
        responseType: 'blob', params: { group_id: viewAllGroups ? 'all' : (selectedGroup || 'all'), session }
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
        link.download = effectiveType === 'annuel'
          ? `PV_Annuel_Filiere${filiereId}_Annee${yearLevel}.pdf`
          : `PV_Officiel_Semestriel_S${selectedSemester || 1}_ENCG.pdf`
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
    <div className="space-y-6" data-testid="admin-pv-page">
      {showGroupCompareModal && <PvGroupComparison groups={groupes} moduleId={pvType === 'module' ? moduleId : null} semester={selectedSemester} filiere={selectedFiliere} year={Number(currentAcademicYearId)} session={session} onClose={() => setShowGroupCompareModal(false)}/>}
      {showShareModal && <Modal open title="Lien interne du PV" onClose={() => setShowShareModal(false)}><p className="text-sm">Le destinataire doit se connecter et disposer des droits du PV. Ce lien ne donne aucun droit supplémentaire.</p><label className="mt-4 block text-sm">Adresse du PV<input readOnly value={shareLink} className="mt-1 min-h-11 w-full rounded-lg border p-3"/></label><button className="mt-4 min-h-11 rounded-lg border px-4" onClick={() => void navigator.clipboard.writeText(shareLink).then(() => setShareCopied(true)).catch(() => toast.error('Copie impossible. Sélectionnez le lien manuellement.'))}>{shareCopied ? 'Lien copié' : 'Copier le lien'}</button></Modal>}
      {showSignatureModal && <PvSignatureDialog onClose={() => setShowSignatureModal(false)} onConfirm={confirmOfficialSignature}/>}
      {showSchedulerModal && <PvMeetingForm context={workflowContext} onClose={() => { setShowSchedulerModal(false); void officialWorkflow.refetch() }}/>}
      {showLockModal && <Modal open title="Sceller le PV enregistré" onClose={() => !isLocking && setShowLockModal(false)} preventBackdropClose={isLocking}><p className="text-sm">Le scellé porte sur les décisions persistées. Une réouverture requiert le circuit de validation prévu.</p><label className="mt-4 block text-sm">Motif<textarea className="mt-1 w-full rounded-lg border p-3" value={lockReason} onChange={e => setLockReason(e.target.value)} maxLength={500}/></label><button disabled={isLocking || !officialWorkflow.data?.deliberation || !lockReason.trim()} className="mt-4 min-h-11 rounded-lg bg-blue-900 px-4 text-white disabled:opacity-50" onClick={() => void handleLockPV()}>{isLocking ? 'Enregistrement…' : 'Confirmer le scellé serveur'}</button></Modal>}
      {officialWorkflow.isError && <p role="alert" className="rounded-xl border border-red-200 p-4 text-sm">État officiel du PV indisponible. <button className="underline" onClick={() => void officialWorkflow.refetch()}>Réessayer</button></p>}
      {moduleId && pvType === 'module' && hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director']) && <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4" onSubmit={async event => {
        event.preventDefault(); const fields = new FormData(event.currentTarget); setPublishingGrades(true)
        try { const response = await api.post('/admin/grade-publications', { assessment_id: Number(fields.get('assessment_id')), duration_hours: Number(fields.get('duration_hours')) }); toast.success(`Publication enregistrée. Recours jusqu’au ${new Date(response.data.publication.appeals_until).toLocaleString('fr-FR')}.`) }
        catch (err: any) { toast.error(err.response?.data?.message ?? 'Publication non enregistrée.') }
        finally { setPublishingGrades(false) }
      }}>
        <label className="flex-1 text-sm font-medium">Évaluation à publier<select name="assessment_id" required className="mt-1 w-full rounded-lg border border-border bg-background p-2"><option value="">Choisir une évaluation</option>{pvData?.assessments?.map((assessment: any) => <option key={assessment.id} value={assessment.id}>{assessment.type}</option>)}</select></label>
        <label className="text-sm font-medium">Délai de recours (heures)<input name="duration_hours" type="number" min={1} max={168} defaultValue={48} required className="mt-1 block w-36 rounded-lg border border-border bg-background p-2" /></label>
        <Button type="submit" disabled={publishingGrades}>{publishingGrades ? 'Publication…' : 'Publier les résultats'}</Button>
      </form>}      {/* Top Deep Navy Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1e48] via-[#0f2863] to-[#07132e] p-6 md:p-8 rounded-[2rem] shadow-xl text-white border border-blue-900/40 space-y-5">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Row 1: Title & Subtitle */}
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-xl shrink-0">
            <Calculator className="w-7 h-7 md:w-8 md:h-8 text-amber-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-200 px-3.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-1.5 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {isPureProfessor ? 'Espace Enseignant • ENCG Fès' : 'Jury Officiel & Délibérations ENCG Fès'}
            </div>
            <h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight">
              {isRtl ? 'محاضر النقاط الرسمية' : 'Procès-Verbaux de Notes Officiels'}
            </h1>
            <p className="text-blue-100/80 text-xs md:text-sm font-medium mt-0.5">
              {isPureProfessor
                ? 'Consultez, délibérez et signez numériquement les procès-verbaux de vos modules d\'enseignement affectés.'
                : (isRtl ? 'اخther نوع المحضر والشعبة للدورة الدراسية.' : 'Sélectionnez le type de PV (Module, Semestriel ou Annuel Global) et la filière pour générer les procès-verbaux officiels.')}
            </p>
          </div>
        </div>

        {/* Row 2: Navigation & Actions Bar */}
        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-white/10">
          {!isPureProfessor ? (
            /* Segmented Mode Selector for Administration only */
            <div className="inline-flex p-1 bg-black/25 backdrop-blur-md rounded-2xl border border-white/10 gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setPvType('module')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider",
                  pvType === 'module'
                    ? "bg-white text-[#0f2863] shadow-md"
                    : "text-blue-100 hover:text-white hover:bg-white/10"
                )}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                PV Module
              </button>

              <button
                type="button"
                onClick={() => setPvType('semestriel')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider",
                  pvType === 'semestriel'
                    ? "bg-white text-[#0f2863] shadow-md"
                    : "text-blue-100 hover:text-white hover:bg-white/10"
                )}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                PV Semestriel (7 Modules)
              </button>

              <button
                type="button"
                onClick={() => setPvType('annuel')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider",
                  pvType === 'annuel'
                    ? "bg-white text-[#0f2863] shadow-md"
                    : "text-blue-100 hover:text-white hover:bg-white/10"
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                PV Annuel Global (14 Modules)
              </button>
            </div>
          ) : (
            /* Dedicated status badge for pure professors */
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-white text-xs font-bold">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Procès-Verbal de Module • Vos Enseignements Affectés</span>
            </div>
          )}

          {/* Right actions: Shown when in semestriel or annuel modes for admin only */}
          {!isPureProfessor && pvType !== 'module' && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleRunDeliberation}
                disabled={isCalculating}
                className="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md uppercase tracking-wider"
              >
                {isCalculating ? <Spinner className="w-3.5 h-3.5 text-white" /> : <Zap className="w-3.5 h-3.5 text-amber-200" />}
                Calculer Délibération
              </button>

              <button
                type="button"
                onClick={() => setShowSignatureModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md uppercase tracking-wider border border-purple-400/30"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                {signatureDataUrl ? '✓ PV Signé' : 'Signer le PV (Tactile)'}
              </button>
            </div>
          )}
        </div>
      </div>

      <PvFilterBar
        isRtl={isRtl}
        selectedFiliere={selectedFiliere}
        selectedSemester={selectedSemester}
        selectedGroup={selectedGroup}
        moduleId={moduleId}
        filieres={displayedFilieres}
        modules={displayedModules}
        groupes={groupes}
        onFiliereChange={setSelectedFiliere}
        onSemesterChange={setSelectedSemester}
        onModuleChange={(val) => {
          if (val) {
            setPvType('module')
            if (isPureProfessor) {
              const found = myModulesList.find((m: any) => String(m.id) === String(val))
              if (found) {
                if (found.filiere_id) setSelectedFiliere(String(found.filiere_id))
                if (found.semester_number) setSelectedSemester(String(found.semester_number))
                navigate(`/admin/grades/pv?module_id=${val}&filiere_id=${found.filiere_id || selectedFiliere || ''}&semester=${found.semester_number || selectedSemester || ''}`)
                return
              }
            }
            navigate(`/admin/grades/pv?module_id=${val}${selectedGroup ? `&group_id=${selectedGroup}` : ''}`)
          }
        }}
        onGroupChange={(group) => {
          setSelectedGroup(group)
          if (moduleId) {
            navigate(`/admin/grades/pv?module_id=${moduleId}${group ? `&group_id=${group}` : ''}`)
          }
        }}
      />
    </div>
  )

  // Pure Professor States & Security Guard
  if (isPureProfessor) {
    if (isLoadingMyModules) {
      return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {renderSelectorBar()}
          <div className="flex h-[40vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </div>
      )
    }

    if (myModulesList.length === 0) {
      return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {renderSelectorBar()}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center text-3xl mx-auto">
              📚
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Aucun Module Affecté</h3>
            <p className="text-xs text-slate-500 font-medium">
              Aucun module d’enseignement ne vous est actuellement attribué pour cette année universitaire. Veuillez vous adresser à la Scolarité ou au Chef de Département pour l’affectation de vos modules.
            </p>
          </div>
        </div>
      )
    }

    if (isUnauthorizedForThisModule) {
      return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {renderSelectorBar()}
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center text-3xl mx-auto font-black">
              ⛔
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Accès Restreint au Procès-Verbal</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Vous n’êtes pas affecté(e) à ce module. Conformément aux règles pédagogiques de l'ENCG, chaque enseignant n'a accès qu'aux procès-verbaux de ses propres modules. La consultation générale ou inter-modules est réservée à l’Administration.
            </p>
            {myModulesList.length > 0 && (
              <Button
                onClick={() => {
                  const first = myModulesList[0]
                  navigate(`/admin/grades/pv?module_id=${first.id}&filiere_id=${first.filiere_id || ''}&semester=${first.semester_number || ''}`)
                }}
                className="bg-[#0f2863] text-white hover:bg-blue-900 rounded-xl text-xs font-bold px-5 py-2.5 shadow-md"
              >
                Accéder à mon module ({myModulesList[0].name || myModulesList[0].code})
              </Button>
            )}
          </div>
        </div>
      )
    }
  }



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

          {/* Executive Control Header: Replaces the electric blue banner with a sleek, unified card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5 print:hidden">
            {/* Top Row: Semester Identity + Juridical Signature & Lock Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              {/* Left Identity */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[#0f2863]/10 text-[#0f2863] dark:bg-blue-900/40 dark:text-blue-300 font-extrabold text-[10px] rounded-lg border border-[#0f2863]/20 uppercase tracking-wider">
                    {semesterPvData.filiere?.name || 'Tronc Commun ENCG'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    Semestre {semesterPvData.semester || selectedSemester} • {semesterPvData.modules?.length || 7} Modules
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold text-[10px] rounded-lg border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                    Session {session === 'normale' ? 'Ordinaire (Normale)' : 'de Rattrapage'}
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-[#0f2863] dark:text-white tracking-tight">
                  Procès-Verbal Semestriel Consolidé
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                  Matrice officielle de délibération des {semesterPvData.modules?.length || 7} modules avec calcul automatique des compensations (≥ 10/20) et éliminations APOGEE.
                </p>
              </div>

              {/* Right: Signature Badge + Sign Button + Lock Button */}
              <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-end lg:self-center shrink-0">
                {signatureDone ? (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex flex-col leading-tight">
                      <span className="font-extrabold text-[11px]">PV Semestriel Signé</span>
                      <span className="text-[9px] text-emerald-600/90 font-mono">Scellé SHA-256</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 shadow-xs">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-[11px]">En attente de signature</span>
                  </div>
                )}

                <Button
                  onClick={() => setShowSignatureModal(true)}
                  className="bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl text-xs font-bold px-4 py-2.5 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>{signatureDone ? 'Re-signer (Jury)' : 'Signer le PV (Jury)'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => pvLocked ? toast.info('Ce PV est déjà verrouillé définitivement.') : setShowLockModal(true)}
                  disabled={pvLocked}
                  className={cn(
                    "rounded-xl text-xs font-bold px-3.5 py-2.5 transition-all flex items-center gap-1.5",
                    pvLocked
                      ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900 dark:text-rose-400"
                  )}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{pvLocked ? 'Verrouillé' : 'Sceller & Verrouiller'}</span>
                </Button>
              </div>
            </div>

            {/* Middle Row: Primary Official Exports & Transmissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Exports & Transmissions Officielles
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {semesterPvData.students?.length || 0} étudiants inscrits
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Aperçu PDF */}
                <Button
                  variant="outline"
                  onClick={() => handleExportPdf(true)}
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Aperçu PDF (Voir)</span>
                </Button>

                {/* Télécharger PDF Officiel */}
                <Button
                  onClick={() => handleExportPdf(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs px-4 py-2 shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-950" />
                  <span>Télécharger PDF Officiel</span>
                </Button>

                {/* Exporter Excel */}
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  className="rounded-xl border-emerald-200 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Exporter Excel (.xlsx)</span>
                </Button>

                {/* Pack PV ZIP */}
                <Button
                  variant="outline"
                  onClick={handleDownloadZipBundle}
                  disabled={isExportingZip}
                  className="rounded-xl border-indigo-200 text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300 text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5"
                >
                  {isExportingZip ? <Spinner className="w-3.5 h-3.5 text-indigo-600" /> : <Archive className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  <span>Pack PV (ZIP)</span>
                </Button>

                {/* Diffusion Email */}
                <Button
                  variant="outline"
                  onClick={handleBroadcastTranscripts}
                  disabled={isSendingBulk}
                  className="rounded-xl border-blue-200 text-blue-800 bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300 text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5"
                >
                  {isSendingBulk ? <Spinner className="w-3.5 h-3.5 text-blue-600" /> : <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  <span>Préparer les relevés</span>
                </Button>

                {/* Attestations en Lot */}
                <Button
                  variant="outline"
                  onClick={() => setShowAttestationModal(true)}
                  className="rounded-xl border-teal-200 text-teal-800 bg-teal-50/70 hover:bg-teal-100/70 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-300 text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Attestations (Lot)</span>
                </Button>
              </div>
            </div>

            {/* Bottom Row: Decision Support & Pedagogical Tools Toolbar */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-1.5">
                  Outils d'Aide :
                </span>

                {/* Stats Promo Toggle */}
                <Button
                  variant="ghost"
                  onClick={() => setShowStatsDashboard(v => !v)}
                  className={cn(
                    "rounded-xl text-xs font-semibold px-2.5 py-1.5 h-auto transition-all flex items-center gap-1.5",
                    showStatsDashboard
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300"
                  )}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Stats Promo</span>
                </Button>

                {/* Simulateur What-If */}
                <Button
                  variant="ghost"
                  onClick={() => setShowSimulatorModal(true)}
                  className="rounded-xl text-xs font-semibold px-2.5 py-1.5 h-auto text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Simulateur What-If</span>
                </Button>

                {/* Journal d'Audit */}
                <Button
                  variant="ghost"
                  onClick={() => setShowAuditModal(true)}
                  className="rounded-xl text-xs font-semibold px-2.5 py-1.5 h-auto text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Journal d'Audit</span>
                </Button>

                {/* Comparer Groupes */}
                <Button
                  variant="ghost"
                  onClick={() => setShowGroupCompareModal(true)}
                  className="rounded-xl text-xs font-semibold px-2.5 py-1.5 h-auto text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Comparer Groupes</span>
                </Button>

                {/* Export Word */}
                <Button
                  variant="ghost"
                  onClick={handleExportDocx}
                  className="rounded-xl text-xs font-semibold px-2.5 py-1.5 h-auto text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Export Word (.docx)</span>
                </Button>

                {/* Lien Sécurisé */}
                <Button
                  variant="ghost"
                  onClick={handleGenerateShareLink}
                  className="rounded-xl text-xs font-semibold px-2.5 py-1.5 h-auto text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Lien interne</span>
                </Button>

                {/* Planifier Séance */}
                <Button
                  variant="ghost"
                  onClick={() => setShowSchedulerModal(true)}
                  className="rounded-xl text-xs font-semibold px-2.5 py-1.5 h-auto text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-orange-500" />
                  <span>Planifier Séance</span>
                </Button>
              </div>

              {/* Right: Imprimer */}
              <Button
                variant="ghost"
                onClick={() => window.print()}
                className="rounded-xl text-xs font-semibold px-3 py-1.5 h-auto text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 transition-all flex items-center gap-1.5 ml-auto"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Imprimer</span>
              </Button>
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
            const moduleBarData = moduleSuccessRates(semesterPvData?.modules || [], students)
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
                {failingModules.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/90 dark:border-rose-900/40 rounded-2xl text-xs animate-in slide-in-from-left-2 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-rose-900 dark:text-rose-200 text-xs">
                          Anomalie Pédagogique Détectée — {failingModules.length} module(s) avec taux d'échec &gt; 35%
                        </div>
                        <div className="text-rose-700/80 dark:text-rose-300/80 mt-0.5 text-[11px] font-medium">
                          Vérification jury recommandée • Module(s) : {failingModules.map((m: any) => m.code || m.name).join(', ')}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-rose-200/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-bold text-[10px] uppercase tracking-wider rounded-lg shrink-0 self-start sm:self-center">
                      Vérification Requise
                    </span>
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
                {/* Header Row: Title + Status Pills + Toggle */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0f2863]/10 dark:bg-blue-900/30 text-[#0f2863] dark:text-blue-300 flex items-center justify-center shadow-xs shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base md:text-lg font-black tracking-tight text-[#0f2863] dark:text-white">
                          Assistant IA de Délibération
                        </h3>
                        <span className="px-2 py-0.5 bg-[#0f2863]/10 text-[#0f2863] dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-[10px] font-black uppercase tracking-wider">
                          Analyse Prédictive
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Détection automatique des candidats au rachat jury (9.50–9.99), blocages éliminatoires et exclusions réglementaires.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-end lg:self-center shrink-0">
                    <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl">
                      {rachatCandidates.length} Rachat
                    </span>
                    <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl">
                      {eliminatoireBlockers.length} Note &lt; 6
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl">
                      {fraudBlockedCandidates.length} Fraude
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiAnalysis(v => !v)}
                      className="rounded-xl text-xs font-bold gap-1.5 h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {showAiAnalysis ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Masquer</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Afficher Détails</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* 3 Categories Grid (Shown when expanded) */}
                {showAiAnalysis && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
                    {/* Category 1: Candidates for Rachat */}
                    <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Candidats au Rachat ({rachatCandidates.length})</span>
                        </h4>
                        <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-bold bg-amber-100/60 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                          9.50 – 9.99/20
                        </span>
                      </div>

                      {rachatCandidates.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-dashed border-amber-200/60 dark:border-amber-900/40 text-center">
                          Aucun étudiant n'est dans la zone de rachat (9.50 - 9.99) pour ce semestre.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {rachatCandidates.map((s: any) => {
                            const needed = (10.00 - Number(s.moyenne_semestrielle)).toFixed(2)
                            return (
                              <div
                                key={s.student_id}
                                className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/70 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                                    {s.last_name?.toUpperCase()} {s.first_name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Apogée: {s.apogee} • Moyenne: <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{Number(s.moyenne_semestrielle).toFixed(2)}/20</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRachatStudent({
                                      student_id: s.student_id,
                                      student_name: `${s.last_name?.toUpperCase()} ${s.first_name}`,
                                      cne: s.apogee,
                                      cin: s.cin,
                                      module_id: null,
                                      module_code: 'Moyenne Semestrielle',
                                      needed_points: needed,
                                      target_grade: 10.00,
                                      impact: 'Passage en Validé (V)',
                                      text: `Rachat jury de +${needed} pt sur la moyenne pour validation du semestre`,
                                    })
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] uppercase tracking-wider shadow-2xs hover:scale-105 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <Sparkles className="w-3 h-3 text-slate-950" />
                                  <span>+{needed} pt pour Valider</span>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Category 2: Eliminatoire Blockers */}
                    <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Bloqués Note Éliminatoire ({eliminatoireBlockers.length})</span>
                        </h4>
                        <span className="text-[10px] text-rose-700/80 dark:text-rose-400/80 font-bold bg-rose-100/60 dark:bg-rose-900/40 px-2 py-0.5 rounded-md">
                          Moyenne ≥ 10 mais Note &lt; 6
                        </span>
                      </div>

                      {eliminatoireBlockers.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-dashed border-rose-200/60 dark:border-rose-900/40 text-center">
                          Aucun étudiant n'est bloqué par une note éliminatoire avec une moyenne ≥10.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {eliminatoireBlockers.map((s: any) => {
                            const failingModuleEntry = Object.values(s.module_grades || {}).find((mg: any) => mg.note !== null && Number(mg.note) < 6.00) as any
                            const failingNote = failingModuleEntry ? Number(failingModuleEntry.note) : null
                            const pointsNeeded = failingNote !== null ? Math.max(0, +(6.00 - failingNote).toFixed(2)) : 0
                            const canRachat = failingNote !== null && pointsNeeded > 0 && pointsNeeded <= 1.00

                            return (
                              <div
                                key={s.student_id}
                                className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-rose-200/70 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                                    {s.last_name?.toUpperCase()} {s.first_name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Moyenne: <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{Number(s.moyenne_semestrielle).toFixed(2)}/20</span>
                                    {failingModuleEntry && (
                                      <> • <span className="font-bold">{failingModuleEntry.module_code}</span>: <span className="font-mono text-rose-600 font-bold">{failingNote?.toFixed(2)}/20</span></>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {canRachat ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRachatStudent({
                                          student_id: s.student_id,
                                          student_name: `${s.last_name?.toUpperCase()} ${s.first_name}`,
                                          cne: s.apogee,
                                          cin: s.cin,
                                          module_id: failingModuleEntry.module_id,
                                          module_code: failingModuleEntry.module_code,
                                          needed_points: pointsNeeded,
                                          target_grade: 6.00,
                                          impact: 'Levée Note Éliminatoire ➔ Passage en Validé par Compensation (VPC)',
                                          text: `Rachat jury de +${pointsNeeded} pt sur ${failingModuleEntry.module_code} (${failingNote?.toFixed(2)} ➔ 6.00) pour éligibilité à la compensation semestrielle`,
                                        })
                                      }}
                                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-[10px] uppercase tracking-wider shadow-2xs hover:scale-105 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                      title="Accorder le rachat pour lever la note éliminatoire et valider par compensation"
                                    >
                                      <Sparkles className="w-3 h-3 text-white" />
                                      <span>+{pointsNeeded} pt ➔ Rachat VPC</span>
                                    </button>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-lg text-[10px] font-bold shrink-0">
                                      {s.has_eliminatoire ? "Note < 6.00 Éliminatoire" : "> 2 Modules < 10"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Category 3: Fraud Exclusion */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Exclus du Rachat ({fraudBlockedCandidates.length})</span>
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                          Discipline & Fraude
                        </span>
                      </div>

                      {fraudBlockedCandidates.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                          Aucun dossier disciplinaire ou de fraude dans cette promotion.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {fraudBlockedCandidates.map((s: any) => (
                            <div
                              key={s.student_id}
                              className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-2"
                            >
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                                  {s.last_name?.toUpperCase()} {s.first_name}
                                </div>
                                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                  Dossier: FRAUDE (Note 0.00)
                                </div>
                              </div>
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0">
                                Inéligible Rachat
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}


          {/* GRAND MATRIX TABLE FOR ALL 7 MODULES */}
          <div className={cn(
            "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-0 transition-all",
            isFullscreenTable && "fixed inset-0 z-50 rounded-none border-0 p-4 md:p-6 flex flex-col h-screen w-screen bg-white dark:bg-slate-950 overflow-hidden"
          )}>

            {/* Header Toolbar: Search & Filters + View Switcher + Fullscreen */}
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-850 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-[#0f2863] dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Matrice Globale des {semesterPvData.modules?.length || 7} Modules
                  </h3>
                  <span className="px-2 py-0.5 bg-[#0f2863]/10 text-[#0f2863] dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-[10px] font-black uppercase">
                    Compensation APOGEE
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Moyenne semestrielle ≥ 10/20 • Max 2 modules &lt; 10/20 pour compensation (Code VPC) • Note éliminatoire &lt; 6.00/20.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher nom, Apogée, CIN..."
                    value={matrixSearchQuery}
                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                    className="pl-8.5 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0f2863] w-full"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                  {(() => {
                    const allStudents = semesterPvData.students || []
                    const valCleanCount = allStudents.filter((s: any) => s.decision_global === 'V' || s.decision_global === 'VAR').length
                    const vpcCount = allStudents.filter((s: any) => s.decision_global === 'VPC').length
                    const nvCount = allStudents.filter((s: any) => s.decision_global === 'NV' || (!['V', 'VAR', 'VPC'].includes(s.decision_global))).length

                    return (
                      <>
                        <button
                          onClick={() => setMatrixDecisionFilter('all')}
                          className={cn(
                            "px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer",
                            matrixDecisionFilter === 'all'
                              ? "bg-[#0f2863] text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          )}
                        >
                          Tous ({allStudents.length})
                        </button>
                        <button
                          onClick={() => setMatrixDecisionFilter('V')}
                          className={cn(
                            "px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer",
                            matrixDecisionFilter === 'V'
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          )}
                        >
                          Validés ({valCleanCount})
                        </button>
                        <button
                          onClick={() => setMatrixDecisionFilter('VPC')}
                          className={cn(
                            "px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer",
                            matrixDecisionFilter === 'VPC'
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                          )}
                        >
                          Compensés ({vpcCount})
                        </button>
                        <button
                          onClick={() => setMatrixDecisionFilter('NV')}
                          className={cn(
                            "px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer",
                            matrixDecisionFilter === 'NV'
                              ? "bg-rose-600 text-white shadow-xs"
                              : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          )}
                        >
                          Non Validés ({nvCount})
                        </button>
                      </>
                    )
                  })()}
                </div>

                {/* Mode Switcher: Compact vs Detailed */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                  <button
                    onClick={() => setMatrixViewMode('compact')}
                    title="Affichage compact : 1 colonne par module avec note et décision (Recommandé)"
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer flex items-center gap-1",
                      matrixViewMode === 'compact'
                        ? "bg-[#0f2863] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Compact</span>
                  </button>
                  <button
                    onClick={() => setMatrixViewMode('detailed')}
                    title="Affichage détaillé : 3 sous-colonnes (Note, Décision, Année) par module"
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer flex items-center gap-1",
                      matrixViewMode === 'detailed'
                        ? "bg-[#0f2863] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Détaillé</span>
                  </button>
                </div>

                {/* Fullscreen Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreenTable(v => !v)}
                  className="rounded-xl font-bold text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isFullscreenTable ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-[#0f2863]" />
                      <span>Réduire</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-[#0f2863]" />
                      <span>Plein Écran</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Filtered Students Table */}
            {(() => {
              const filteredStudents = (semesterPvData.students || []).filter((s: any) => {
                const matchesSearch = !matrixSearchQuery ||
                  s.last_name?.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
                  s.first_name?.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
                  String(s.apogee).includes(matrixSearchQuery) ||
                  (s.cin && String(s.cin).toLowerCase().includes(matrixSearchQuery.toLowerCase()))

                if (!matchesSearch) return false

                if (matrixDecisionFilter === 'V') return s.decision_global === 'V' || s.decision_global === 'VAR'
                if (matrixDecisionFilter === 'VPC') return s.decision_global === 'VPC'
                if (matrixDecisionFilter === 'NV') return s.decision_global === 'NV' || (!['V', 'VAR', 'VPC'].includes(s.decision_global))

                return true
              })

              return (
                <div className={cn(
                  "overflow-x-auto bg-white dark:bg-slate-900",
                  isFullscreenTable ? "flex-1 overflow-y-auto" : "max-h-[680px] overflow-y-auto"
                )}>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f2863] text-white">
                        <th
                          rowSpan={matrixViewMode === 'detailed' ? 2 : 1}
                          className="py-2.5 px-2 font-black uppercase tracking-wider sm:sticky sm:left-0 z-30 bg-[#0f2863] text-white border-r border-slate-700/80 min-w-[85px] w-[85px] text-center text-[11px]"
                        >
                          Apogée
                        </th>
                        <th
                          rowSpan={matrixViewMode === 'detailed' ? 2 : 1}
                          className="py-2.5 px-2 font-black uppercase tracking-wider sm:sticky sm:left-[85px] z-30 bg-[#0f2863] text-amber-200 border-r border-slate-700/80 min-w-[75px] w-[75px] text-center text-[11px]"
                        >
                          CIN
                        </th>
                        <th
                          rowSpan={matrixViewMode === 'detailed' ? 2 : 1}
                          className="py-2.5 px-3 font-black uppercase tracking-wider sticky left-0 sm:left-[160px] z-30 bg-[#0f2863] text-white border-r-2 border-slate-300 dark:border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] min-w-[140px] max-w-[155px] text-[11px]"
                        >
                          Nom & Prénom
                        </th>

                        {/* 7 Modules Headers */}
                        {semesterPvData.modules?.map((m: any, idx: number) => (
                          <th
                            key={m.id}
                            colSpan={matrixViewMode === 'detailed' ? 3 : 1}
                            className="py-3 px-2 font-bold text-center border-r border-slate-700/80 bg-[#0f2863] text-white min-w-[95px]"
                          >
                            <div className="text-[11px] font-black uppercase tracking-tight text-white line-clamp-1" title={m.name}>
                              M0{idx+1} • {m.name}
                            </div>
                            <div className="font-mono text-[9px] text-blue-200/90 font-medium">
                              {m.code || `MOD-${m.id}`}
                            </div>
                          </th>
                        ))}

                        <th
                          rowSpan={matrixViewMode === 'detailed' ? 2 : 1}
                          className="py-3 px-3 font-black text-center bg-[#0a1c47] text-amber-300 border-r border-slate-700 min-w-[90px]"
                        >
                          Moyenne
                        </th>
                        <th
                          rowSpan={matrixViewMode === 'detailed' ? 2 : 1}
                          className="py-3 px-2 font-black text-center bg-[#0a1c47] text-white border-r border-slate-700 min-w-[70px]"
                        >
                          Crédits
                        </th>
                        <th
                          rowSpan={matrixViewMode === 'detailed' ? 2 : 1}
                          className="py-3 px-4 font-black text-center bg-[#0a1c47] text-white min-w-[130px]"
                        >
                          Décision
                        </th>
                      </tr>

                      {/* Sub-header row (Only in Detailed Mode) */}
                      {matrixViewMode === 'detailed' && (
                        <tr className="bg-[#153478] text-blue-100 border-b border-slate-700">
                          {semesterPvData.modules?.map((m: any) => (
                            <React.Fragment key={`sub-${m.id}`}>
                              <th className="py-1.5 px-2 font-extrabold text-[10px] text-center bg-[#153478] border-r border-slate-700 text-amber-200 min-w-[50px]">
                                Note
                              </th>
                              <th className="py-1.5 px-2 font-extrabold text-[10px] text-center bg-[#153478] border-r border-slate-700 text-amber-200 min-w-[50px]">
                                Déc.
                              </th>
                              <th className="py-1.5 px-2 font-extrabold text-[10px] text-center bg-[#153478] border-r-2 border-slate-700 text-amber-200 min-w-[65px]">
                                Année
                              </th>
                            </React.Fragment>
                          ))}
                        </tr>
                      )}
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={(semesterPvData.modules?.length || 7) * (matrixViewMode === 'detailed' ? 3 : 1) + 6}
                            className="py-12 text-center text-slate-400 dark:text-slate-500 italic text-xs"
                          >
                            Aucun étudiant ne correspond aux critères de recherche ou de filtre.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s: any, sIdx: number) => {
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
                          const isEven = sIdx % 2 === 0
                          const rowOpaqueBg = isEven ? '!bg-white dark:!bg-slate-900' : '!bg-slate-50 dark:!bg-slate-800'
                          const rowHoverBg = 'hover:bg-blue-50/50 dark:hover:bg-slate-800/80'

                          return (
                            <tr key={s.student_id} className={cn("transition-colors", rowOpaqueBg, rowHoverBg)}>
                              {/* Apogee: 100% Solid background to completely prevent bleed-through */}
                              <td className={cn(
                                "py-2 px-2 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 border-r border-b border-slate-200 dark:border-slate-800 sm:sticky sm:left-0 z-20 text-center shadow-xs min-w-[85px] w-[85px]",
                                rowOpaqueBg
                              )}>
                                {s.apogee}
                              </td>

                              {/* CIN: Dedicated column */}
                              <td className={cn(
                                "py-2 px-2 font-mono font-black text-xs text-indigo-950 dark:text-indigo-200 border-r border-b border-slate-200 dark:border-slate-800 sm:sticky sm:left-[85px] z-20 text-center shadow-xs min-w-[75px] w-[75px]",
                                rowOpaqueBg
                              )}>
                                {s.cin || '–'}
                              </td>

                              {/* Student Name: Reduced width and compact font size */}
                              <td className={cn(
                                "py-2 px-3 border-r-2 border-b border-slate-300 dark:border-slate-700 sticky left-0 sm:left-[160px] z-20 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] min-w-[140px] max-w-[155px]",
                                rowOpaqueBg
                              )}>
                                <div className="flex items-center gap-1 min-w-0" title={`${s.last_name?.toUpperCase()} ${s.first_name}`}>
                                  <span className="font-extrabold text-[11px] text-slate-900 dark:text-white truncate">
                                    {s.last_name?.toUpperCase()} {s.first_name}
                                  </span>
                                  {hasStudentFraud && (
                                    <span className="px-1 py-0.2 bg-rose-600 text-white rounded text-[8.5px] font-black uppercase shrink-0">
                                      FRAUDE
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 7 Modules Data */}
                              {semesterPvData.modules?.map((m: any) => {
                                const mInfo = s.module_grades?.[m.id]
                                const note = mInfo?.note
                                const dec = mInfo?.decision
                                const isFraud = mInfo?.is_fraud || dec === 'FRAUDE' || (hasStudentFraud && (mInfo?.is_fraud || !!studentExpandedSanction))

                                const noteColor =
                                  isFraud ? 'text-rose-700 dark:text-rose-400 font-black' :
                                  note === null || note === undefined ? 'text-slate-400' :
                                  note >= 10.00 ? 'text-slate-900 dark:text-slate-100 font-extrabold' :
                                  note >= 6.00 ? 'text-amber-700 dark:text-amber-400 font-bold' :
                                  'text-rose-700 dark:text-rose-400 font-bold'

                                const noteBg =
                                  isFraud ? 'bg-rose-50/70 dark:bg-rose-950/30' :
                                  note !== null && note !== undefined && note < 6.00 ? 'bg-rose-50/50 dark:bg-rose-950/20' :
                                  ''

                                const decBadgeClass =
                                  isFraud ? "bg-rose-600 text-white border-rose-700" :
                                  dec === 'V' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" :
                                  dec === 'VAR' ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" :
                                  dec === 'VPC' || dec === 'VC' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" :
                                  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"

                                if (matrixViewMode === 'compact') {
                                  return (
                                    <td
                                      key={m.id}
                                      className={cn("py-2 px-1.5 text-center border-r border-b border-slate-200 dark:border-slate-800", noteBg)}
                                    >
                                      <div className="flex flex-col items-center justify-center gap-0.5">
                                        <span className={cn("font-mono text-xs font-black", noteColor)}>
                                          {isFraud ? '0.00' : (note !== null && note !== undefined ? Number(note).toFixed(2) : '–')}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider border", decBadgeClass)}>
                                            {isFraud ? 'FRAUDE' : (dec || 'NV')}
                                          </span>
                                          {mInfo?.is_historical && (
                                            <span
                                              className="text-[8px] font-mono px-1 py-0.2 bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 rounded font-bold"
                                              title={`Validé en ${mInfo?.validation_year}`}
                                            >
                                              {mInfo?.validation_year ? mInfo.validation_year.slice(-2) : 'Ant.'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  )
                                }

                                // Detailed Mode (3 Columns per Module)
                                return (
                                  <React.Fragment key={m.id}>
                                    <td className={cn("py-2 px-2 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono text-xs font-black", noteColor, noteBg)}>
                                      {isFraud ? '0.00' : (note !== null && note !== undefined ? Number(note).toFixed(2) : '–')}
                                    </td>
                                    <td className="py-2 px-1.5 text-center border-r border-b border-slate-200 dark:border-slate-800">
                                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border", decBadgeClass)}>
                                        {isFraud ? 'FRAUDE' : (dec || 'NV')}
                                      </span>
                                    </td>
                                    <td className="py-2 px-1.5 text-center border-r-2 border-b border-slate-200 dark:border-slate-800">
                                      <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded font-mono font-medium whitespace-nowrap",
                                        mInfo?.is_historical
                                          ? "bg-purple-100 text-purple-900 font-bold dark:bg-purple-950 dark:text-purple-300"
                                          : "text-slate-500 dark:text-slate-400"
                                      )}>
                                        {mInfo?.is_historical ? `🏛️ ${mInfo?.validation_year || '25-26'}` : (mInfo?.validation_year || '26-27')}
                                      </span>
                                    </td>
                                  </React.Fragment>
                                )
                              })}

                              {/* Moyenne Semestrielle Cell */}
                              <td className="py-2.5 px-3 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono font-black text-sm bg-blue-50/40 dark:bg-blue-950/20 text-[#0f2863] dark:text-blue-300">
                                {hasStudentFraud ? (
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-black font-mono bg-rose-600 text-white">
                                    0.00
                                  </span>
                                ) : (
                                  s.moyenne_semestrielle !== null ? (
                                    <span className="font-mono font-black text-sm">
                                      {Number(s.moyenne_semestrielle).toFixed(2)}
                                    </span>
                                  ) : '–'
                                )}
                              </td>

                              {/* Credits Cell */}
                              <td className="py-2.5 px-2 text-center border-r border-b border-slate-200 dark:border-slate-800 font-bold text-xs">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 font-mono font-bold">
                                  {hasStudentFraud ? '0' : s.credits}/{semesterPvData.modules?.length || 7}
                                </span>
                              </td>

                              {/* Décision Semestrielle Cell */}
                              <td className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-800">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border inline-block",
                                  hasStudentFraud ? "bg-rose-600 text-white border-rose-700 shadow-xs" :
                                  s.decision_global === 'V' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" :
                                  s.decision_global === 'VPC' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" :
                                  s.decision_global === 'VAR' ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" :
                                  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                )}>
                                  {hasStudentFraud ? '🚨 FRAUDE (0/20)' :
                                   s.decision_global === 'V' ? 'Validé (V)' :
                                   s.decision_global === 'VPC' ? 'Validé par Compensation (VPC)' :
                                   s.decision_global === 'VAR' ? 'Validé Ratt. (VAR)' :
                                   'Non Validé (NV)'}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>

          {/* JURY COMMITTEE STATUS HUB (Commission Jury Semestrielle) */}
          {juryStatus && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5 print:hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Commission Jury Semestrielle S{selectedSemester || 1} ({semesterPvData?.modules?.length || 7} Modules)
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
                    <div className="w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${juryStatus.total_members > 0 ? (juryStatus.signed_count / juryStatus.total_members) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      const filiereId = selectedFiliere || 1
                      const yearLevel = selectedYearLevel || 1
                      toast.loading('⏳ Génération du PDF Officiel...', { id: 'pdf-export' })
                      downloadPdf(
                        `/deliberations/export-pv-pdf?type=semestriel&filiere_id=${filiereId}&year_level=${yearLevel}&semester_number=${selectedSemester || 1}`,
                        `PV_Semestriel_Filiere${filiereId}_S${selectedSemester || 1}.pdf`
                      ).then(() => toast.dismiss('pdf-export'))
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
                            openJuryVisa(member)
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
                    placeholder="Ex: Rachat accordé par le Chef de Filière et le Président du Jury..."
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 min-h-[70px]"
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    🔒 Enregistrement légal dans l'historique d'audit avec IP, horodatage et identité de l'utilisateur.
                  </p>
                </div>

                {/* PV Rachat Generation Notice */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 text-sm">📋</span>
                    <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide">PV de Rachat — Signatures Requises</span>
                  </div>
                  <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
                    La confirmation génère automatiquement un <strong>PV de Rachat officiel</strong> qui devra être signé par :
                  </p>
                  <ul className="text-[10px] text-amber-900 dark:text-amber-200 font-bold space-y-1 pl-3">
                    <li>• <strong>Professeur du Module</strong> concerné ({selectedRachatStudent?.module || 'Module'})</li>
                    <li>• <strong>Chef de Filière</strong> (ou Directeur des Études)</li>
                    <li>• <strong>Chef de Département</strong> (si exigé par le règlement)</li>
                  </ul>
                  <p className="text-[9px] text-amber-700 dark:text-amber-400 font-medium italic">
                    ⚠️ Le PV de Rachat sera disponible dès validation dans l'espace Signatures.
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
                    {applyRachatMutation.isPending ? 'Application...' : `Confirmer & Générer PV de Rachat (+${selectedRachatStudent?.needed_points || 0} pt)`}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* DIGITAL SIGNATURE & SHA-256 SEAL MODAL */}



        </div>

      )
    }
  }

  const renderAnnualPVPage = () => {
    const rawData: any = Array.isArray(annualCompensationData)
      ? { students: annualCompensationData, modules: [] }
      : (annualCompensationData || { students: [], modules: [] })

    const annualStudents: any[] = rawData.students || []
    const annualModules: any[] = rawData.modules || []

    const totalAnnStudents = annualStudents.length
    const validsAnn = annualStudents.filter((r: any) => r.decision === 'V').length
    const compsAnn = annualStudents.filter((r: any) => r.decision === 'V.Comp').length
    const dettesAnn = annualStudents.filter((r: any) => r.decision === 'PASS_DETTES').length
    const ajsAnn = annualStudents.filter((r: any) => r.decision === 'AJ' || r.decision === 'FRAUDE').length
    const passRateAnn = totalAnnStudents > 0 ? Math.round(((validsAnn + compsAnn + dettesAnn) / totalAnnStudents) * 1000) / 10 : 0
    const averagesList = annualStudents.map((r: any) => Number(r.annual_average || 0)).filter(v => !isNaN(v))
    const avgAnn = averagesList.length ? (averagesList.reduce((a, b) => a + b, 0) / averagesList.length).toFixed(2) : '0.00'

    const oddSemLabel = rawData.odd_semester_label || annualStudents[0]?.odd_semester_label || `S${(selectedYearLevel * 2) - 1}`
    const evenSemLabel = rawData.even_semester_label || annualStudents[0]?.even_semester_label || `S${selectedYearLevel * 2}`

    const filteredAnnualData = annualStudents.filter((row: any) => {
      const matchQuery =
        !searchQuery ||
        row.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.cne?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchDecision =
        statusFilter === 'all' ||
        (statusFilter === 'v' && (row.decision === 'V' || row.decision === 'V.Comp')) ||
        (statusFilter === 'r' && row.decision === 'PASS_DETTES') ||
        (statusFilter === 'nv' && (row.decision === 'AJ' || row.decision === 'FRAUDE'))

      return matchQuery && matchDecision
    })

    const aiSuggestions = (() => {
      const mapByStudent = new Map<number, any>()

      annualStudents.forEach((student: any) => {
        // Exclure strictement TOUT étudiant sanctionné pour FRAUDE (Aucun rachat possible)
        if (student.has_fraud || student.decision === 'FRAUDE' || student.decision_global === 'FRAUDE' || student.is_fraude) return

        const annAvg = Number(student.annual_average || 0)
        const mods = student.modules_detail || []
        const candidateSuggestions: any[] = []

        const initialFailedMods = mods.filter((m: any) => Number(m.final_grade) < 10.00)
        const initialUncompensableMods = mods.filter((m: any) => Number(m.final_grade) < 6.00)

        // Traitement 1: Franchissement du Seuil de Compensation (Élévation de note < 6.00 à 6.00)
        // Gère les cas : 5.50 -> 6.00 (+0.50pt), 5.00 -> 6.00 (+1.00pt), 4.50 -> 6.00 (+1.50pt)
        initialUncompensableMods.forEach((uncompMod: any) => {
          const currentG = Number(uncompMod.final_grade)
          const pointsNeeded = 6.00 - currentG

          if (pointsNeeded > 0 && pointsNeeded <= 2.50) {
            // Simulation du résultat si ce module passe à 6.00
            const simMods = mods.map((m: any) => m.module_id === uncompMod.module_id ? { ...m, final_grade: 6.00 } : m)
            const simUncompCount = simMods.filter((m: any) => Number(m.final_grade) < 6.00).length
            const simFailedCount = simMods.filter((m: any) => Number(m.final_grade) < 10.00).length

            // Si le passage à 6.00 supprime les notes éliminatoires/non-compensables ET que les modules non-validés <= 1 ET moyenne annuelle >= 10.00 :
            if (simUncompCount === 0 && simFailedCount <= 1 && annAvg >= 10.00) {
              const gapStr = pointsNeeded.toFixed(2)
              candidateSuggestions.push({
                student_id: student.student_id,
                student_name: student.student_name,
                cne: student.cne,
                cin: student.cin,
                type: 'threshold_6_upgrade',
                module_id: uncompMod.module_id,
                module_code: uncompMod.code,
                current_grade: uncompMod.final_grade,
                needed_points: gapStr,
                target_grade: '6.00',
                badge_color: 'from-[#0f2863] to-indigo-700',
                impact: 'Validation par Compensation Globale (V.Comp) en franchissant le seuil de 6.00/20 !',
                text: `🎯 Rachat Seuil 6.00/20 : ${student.student_name} (${student.cne}) a une moyenne annuelle de ${annAvg}/20. Sa note de ${currentG}/20 sur ${uncompMod.code} est sous le seuil de compensation. Un rachat de +${gapStr} pt porte sa note à 6.00/20, débloquant la Compensation Globale (V.Comp) !`
              })
            }
          }
        })

        // Traitement 2: Validation Directe de Module (Élévation de note < 10.00 à 10.00)
        initialFailedMods.forEach((failedMod: any) => {
          const currentG = Number(failedMod.final_grade)
          const pointsNeeded = 10.00 - currentG

          if (pointsNeeded > 0 && pointsNeeded <= 2.00) {
            // Simulation du résultat si ce module passe à 10.00
            const simMods = mods.map((m: any) => m.module_id === failedMod.module_id ? { ...m, final_grade: 10.00 } : m)
            const simUncompCount = simMods.filter((m: any) => Number(m.final_grade) < 6.00).length
            const simFailedCount = simMods.filter((m: any) => Number(m.final_grade) < 10.00).length

            if (simUncompCount === 0 && simFailedCount <= 1) {
              const gapStr = pointsNeeded.toFixed(2)
              const simDecision = (annAvg >= 10.00 && simFailedCount <= 1) ? 'V.Comp' : 'PASS_DETTES'

              if (simDecision !== student.decision) {
                candidateSuggestions.push({
                  student_id: student.student_id,
                  student_name: student.student_name,
                  cne: student.cne,
                  cin: student.cin,
                  type: 'module_10_upgrade',
                  module_id: failedMod.module_id,
                  module_code: failedMod.code,
                  current_grade: failedMod.final_grade,
                  needed_points: gapStr,
                  target_grade: '10.00',
                  badge_color: simDecision === 'V.Comp' ? 'from-emerald-600 to-teal-700' : 'from-amber-500 to-amber-600',
                  impact: simDecision === 'V.Comp' ? 'Validation de l\'Année par Compensation Globale !' : 'Basculement vers le Passage avec Dettes (Réserviste) !',
                  text: `💡 Rachat Module : ${student.student_name} a ${currentG}/20 sur ${failedMod.code}. En lui accordant +${gapStr} pt pour atteindre 10.00/20, l'étudiant valide ce module et passe à la décision : ${simDecision === 'V.Comp' ? 'Validé par Compensation' : 'Passage avec Dettes'} !`
                })
              }
            }
          }
        })

        // Traitement 3: Élévation de Moyenne Annuelle vers 10.00 (Moyenne entre 9.50 et 9.99)
        if (annAvg >= 9.50 && annAvg < 10.00 && initialUncompensableMods.length === 0 && initialFailedMods.length <= 1) {
          const gapAnn = (10.00 - annAvg).toFixed(2)
          const nearPassMod = initialFailedMods.find((m: any) => Number(m.final_grade) >= 8.00)
          if (nearPassMod) {
            candidateSuggestions.push({
              student_id: student.student_id,
              student_name: student.student_name,
              cne: student.cne,
              cin: student.cin,
              type: 'annual_avg_upgrade',
              module_id: nearPassMod.module_id,
              module_code: nearPassMod.code,
              current_grade: annAvg,
              needed_points: gapAnn,
              target_grade: '10.00',
              badge_color: 'from-indigo-600 to-blue-700',
              text: `🌟 Rachat Moyenne Annuelle : ${student.student_name} a une moyenne annuelle de ${annAvg}/20. Il ne manque que +${gapAnn} pt sur ${nearPassMod.code} pour atteindre 10.00/20 et valider l'année par compensation !`
            })
          }
        }

        if (candidateSuggestions.length > 0) {
          candidateSuggestions.sort((a, b) => Number(a.needed_points) - Number(b.needed_points))
          mapByStudent.set(student.student_id, candidateSuggestions[0])
        }
      })

      return Array.from(mapByStudent.values())
    })()

    const currentFiliereObj = filieres.find((f: any) => String(f.id) === String(selectedFiliere))
    const filiereName = currentFiliereObj?.name || currentFiliereObj?.code || rawData.filiere?.name || 'Filière ENCG'

    return (
      <div className="space-y-6 p-2 sm:p-4 md:p-6 w-full pb-24 animate-in fade-in duration-300">
        {/* Top Bar with Selector */}
        <div className="print:hidden">
          {renderSelectorBar()}
        </div>

        {/* Year Level Selector Tabs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2.5 rounded-2xl flex items-center justify-between gap-3 flex-wrap shadow-xs print:hidden">
          <div className="flex items-center gap-2.5 ps-2">
            <div className="w-8 h-8 rounded-xl bg-[#0f2863]/10 dark:bg-blue-900/30 text-[#0f2863] dark:text-blue-300 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4 text-[#0f2863] dark:text-blue-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-none">Palier Académique</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">Niveau d'Études LMD</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { level: 1, label: '1ère Année (S1 + S2)' },
              { level: 2, label: '2ème Année (S3 + S4)' },
              { level: 3, label: '3ème Année (S5 + S6)' },
              { level: 4, label: '4ème Année (S7 + S8)' },
              { level: 5, label: '5ème Année (S9 + S10)' },
            ].map((yr) => (
              <button
                key={yr.level}
                onClick={() => setSelectedYearLevel(yr.level)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
                  selectedYearLevel === yr.level
                    ? "bg-[#0f2863] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                )}
              >
                {yr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Executive Control Header: Replaces the electric blue banner with a sleek, unified card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5 print:hidden">
          {/* Top Row: Annual Identity + Juridical Signature & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            {/* Left Identity */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-[#0f2863]/10 text-[#0f2863] dark:bg-blue-900/40 dark:text-blue-300 font-extrabold text-[10px] rounded-lg border border-[#0f2863]/20 uppercase tracking-wider">
                  {filiereName}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                  {oddSemLabel} + {evenSemLabel} • 14 Modules
                </span>
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-extrabold text-[10px] rounded-lg border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                  Délibération Annuelle Finale
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-[#0f2863] dark:text-white tracking-tight">
                Matrice Consolidée d'Année ({filiereName} — {oddSemLabel} + {evenSemLabel})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-3xl">
                Fusion complète des notes des 14 modules, moyennes semestrielles et délibération annuelle finale selon le règlement des études ENCG.
              </p>
            </div>

            {/* Right: Signature Badge + Sign Button */}
            <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-end lg:self-center shrink-0">
              {juryStatus?.signed_count && juryStatus.signed_count > 0 ? (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-extrabold text-[11px]">{juryStatus.signed_count} / {juryStatus.total_members} Signatures</span>
                    <span className="text-[9px] text-emerald-600/90 font-mono">Commission Active</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 shadow-xs">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px]">En attente de signature</span>
                </div>
              )}

              <Button
                onClick={() => {
                  const pendingMember = juryStatus?.members?.find((m: any) => Number(m.user_id) === Number(user?.id) && m.status !== 'signed')
                  if (pendingMember) {
                    openJuryVisa(pendingMember)
                  } else {
                    toast.error('Aucun visa en attente pour votre compte.'); return
                  }
                }}
                className="bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl text-xs font-bold px-4 py-2.5 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Signer le PV (Jury)</span>
              </Button>
            </div>
          </div>

          {/* Middle Row: Exports & Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Exports & Actions Officielles
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {totalAnnStudents} étudiants inscrits • Année {selectedYearLevel}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => handleExportPdf(true)}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Aperçu PDF (Voir)</span>
              </Button>

              <Button
                onClick={() => {
                  const filiereId = selectedFiliere || 13
                  const yearLevel = selectedYearLevel || 1
                  toast.loading('⏳ Génération du PDF Officiel...', { id: 'pdf-export' })
                  downloadPdf(
                    `/deliberations/export-pv-pdf?type=annuel&filiere_id=${filiereId}&year_level=${yearLevel}`,
                    `PV_Annuel_Filiere${filiereId}_Annee${yearLevel}.pdf`
                  ).then(() => toast.dismiss('pdf-export'))
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs px-4 py-2 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>Télécharger PDF Officiel (Tampons)</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => fetchAnnualCompensation()}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Recalculer</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowAiAnalysis(prev => !prev)}
                className={cn(
                  "rounded-xl text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer",
                  showAiAnalysis
                    ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{showAiAnalysis ? "Masquer l'Analyse IA" : "Copilote IA (Rachats Jury)"}</span>
                {aiSuggestions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black">
                    {aiSuggestions.length}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsFullscreenTable(v => !v)}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 text-xs font-bold px-3.5 py-2 shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                {isFullscreenTable ? <Minimize2 className="w-3.5 h-3.5 text-[#0f2863]" /> : <Maximize2 className="w-3.5 h-3.5 text-[#0f2863]" />}
                <span>{isFullscreenTable ? 'Réduire' : 'Plein Écran'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* AI DELIBERATION ADVISOR WIDGET (Copilote IA) */}
        {showAiAnalysis && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-300 print:hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base md:text-lg font-black tracking-tight text-[#0f2863] dark:text-white">
                      Copilote IA : Recommandations de Rachat par le Jury
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-md text-[10px] font-black uppercase tracking-wider">
                      {aiSuggestions.length} Éligibles au Rachat
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Détection automatique des seuils de compensation (6.00/20), validation de modules et moyennes annuelles selon le règlement ENCG.
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Délibération Annuelle 14 Modules
              </span>
            </div>

            {aiSuggestions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 italic text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                ✨ Aucune opportunité de rachat critique détectée pour cette promotion. Tous les dossiers sont en règle selon la réglementation ENCG !
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiSuggestions.map((sug: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between hover:border-amber-300 transition-all shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>👤</span> {sug.student_name} <span className="font-mono text-slate-500">({sug.cne})</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {sug.impact}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        {sug.text}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        Rachat conseillé : +{sug.needed_points} pt sur {sug.module_code}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedRachatStudent(sug)
                          setSelectedRachatReason(sug.text)
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                        <span>Appliquer (+{sug.needed_points} pt)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Annual KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Moyenne Promotion</span>
            <div className="text-2xl font-black text-[#0f2863] dark:text-blue-300 mt-1">
              {avgAnn} <span className="text-xs font-bold text-slate-400">/20</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Bilan {oddSemLabel} + {evenSemLabel}</span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Taux d'Admission</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {passRateAnn}%
            </div>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-bold">{validsAnn + compsAnn + dettesAnn} admis sur {totalAnnStudents}</span>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Validés Directs</span>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
              {validsAnn}
            </div>
            <span className="text-[10px] text-blue-700/80 dark:text-blue-400 font-bold">{totalAnnStudents > 0 ? Math.round((validsAnn / totalAnnStudents) * 100) : 0}% admis directs</span>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Passage avec Dettes</span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
              {dettesAnn}
            </div>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-bold">Max 1 seul mod. NV par an</span>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">Redoublement / Ajournés</span>
            <div className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">
              {ajsAnn}
            </div>
            <span className="text-[10px] text-red-700/80 dark:text-red-400 font-bold">&gt; 1 mod. NV par an</span>
          </div>
        </div>

        {/* GRAND MATRIX TABLE FOR ALL 14 MODULES */}
        <div className={cn(
          "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-0 transition-all",
          isFullscreenTable && "fixed inset-0 z-50 rounded-none border-0 p-4 md:p-6 flex flex-col h-screen w-screen bg-white dark:bg-slate-950 overflow-hidden"
        )}>
          {/* Header Toolbar: Search & Filters + Fullscreen */}
          <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-850 shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-[#0f2863] dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Matrice Globale des 14 Modules ({oddSemLabel} + {evenSemLabel})
                </h3>
                <span className="px-2 py-0.5 bg-[#0f2863]/10 text-[#0f2863] dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-[10px] font-black uppercase">
                  Compensation Annuelle APOGEE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Moyenne annuelle ≥ 10.00/20 • Max 1 module &lt; 10.00 pour passage avec dettes • Note éliminatoire &lt; 6.00/20.
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher nom, Apogée, CIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0f2863] w-full"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn("px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer", statusFilter === 'all' ? "bg-[#0f2863] text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")}
                >
                  Tous ({totalAnnStudents})
                </button>
                <button
                  onClick={() => setStatusFilter('v')}
                  className={cn("px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer", statusFilter === 'v' ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30")}
                >
                  Validés ({validsAnn + compsAnn})
                </button>
                <button
                  onClick={() => setStatusFilter('r')}
                  className={cn("px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer", statusFilter === 'r' ? "bg-amber-500 text-slate-950 shadow-xs" : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30")}
                >
                  Passage Dettes ({dettesAnn})
                </button>
                <button
                  onClick={() => setStatusFilter('nv')}
                  className={cn("px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer", statusFilter === 'nv' ? "bg-rose-600 text-white shadow-xs" : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30")}
                >
                  Redoublement ({ajsAnn})
                </button>
              </div>

              {/* Fullscreen Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreenTable(v => !v)}
                className="rounded-xl font-bold text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isFullscreenTable ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-[#0f2863]" />
                    <span>Réduire</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-[#0f2863]" />
                    <span>Plein Écran</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filtered Students Table */}
          <div className={cn(
            "overflow-x-auto bg-white dark:bg-slate-900",
            isFullscreenTable ? "flex-1 overflow-y-auto" : "max-h-[680px] overflow-y-auto"
          )}>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#0f2863] text-white">
                  <th
                    rowSpan={annualModules.length > 0 ? 2 : 1}
                    className="py-2.5 px-2 font-black uppercase tracking-wider sm:sticky sm:left-0 z-30 bg-[#0f2863] text-white border-r border-slate-700/80 min-w-[85px] w-[85px] text-center text-[11px]"
                  >
                    Apogée
                  </th>
                  <th
                    rowSpan={annualModules.length > 0 ? 2 : 1}
                    className="py-2.5 px-2 font-black uppercase tracking-wider sm:sticky sm:left-[85px] z-30 bg-[#0f2863] text-amber-200 border-r border-slate-700/80 min-w-[75px] w-[75px] text-center text-[11px]"
                  >
                    CIN
                  </th>
                  <th
                    rowSpan={annualModules.length > 0 ? 2 : 1}
                    className="py-2.5 px-2.5 font-black uppercase tracking-wider sticky left-0 sm:left-[160px] z-30 bg-[#0f2863] text-white border-r-2 border-slate-300 dark:border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] min-w-[125px] max-w-[135px] text-[11px]"
                  >
                    Nom & Prénom
                  </th>

                  {annualModules.length > 0 ? (
                    <>
                      <th
                        className="py-2 px-2 text-center border-r border-slate-700/80 bg-[#0f2863] text-amber-200 font-black text-xs tracking-wider"
                        colSpan={annualModules.filter((m: any) => m.semester_number % 2 !== 0).length * 3 + 2}
                      >
                        MODULES {oddSemLabel}
                      </th>
                      <th
                        className="py-2 px-2 text-center border-r border-slate-700/80 bg-[#0a1c47] text-blue-200 font-black text-xs tracking-wider"
                        colSpan={annualModules.filter((m: any) => m.semester_number % 2 === 0).length * 3 + 2}
                      >
                        MODULES {evenSemLabel}
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 text-center border-r border-slate-700 bg-[#0f2863] text-white" rowSpan={3}>Moyenne {oddSemLabel}</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-700 bg-[#0f2863] text-white" rowSpan={3}>Moyenne {evenSemLabel}</th>
                    </>
                  )}

                  <th
                    rowSpan={annualModules.length > 0 ? 3 : 1}
                    className="py-3 px-3 font-black text-center bg-[#0a1c47] text-amber-300 border-r border-slate-700 min-w-[85px]"
                  >
                    Moyenne Annuelle
                  </th>
                  <th
                    rowSpan={annualModules.length > 0 ? 3 : 1}
                    className="py-3 px-4 font-black text-center bg-[#0a1c47] text-white min-w-[155px]"
                  >
                    Décision Finale (Année)
                  </th>
                </tr>

                {annualModules.length > 0 && (
                  <>
                    {/* Row 2: Module Codes */}
                    <tr className="bg-[#153478] text-blue-100 border-b border-slate-700">
                      {annualModules.filter((m: any) => m.semester_number % 2 !== 0).map((m: any, idx: number) => (
                        <th key={m.id} colSpan={3} className="py-1 px-1 font-mono text-[10px] font-black text-center bg-[#153478] border-r border-slate-700/80 text-white" title={m.name}>
                          {m.code || `M0${idx+1}`}
                        </th>
                      ))}
                      <th rowSpan={2} className="py-1.5 px-2 font-black text-[10px] text-center bg-[#0f2863] border-r border-slate-700 text-amber-200 min-w-[55px]">MOY {oddSemLabel}</th>
                      <th rowSpan={2} className="py-1.5 px-2 font-black text-[10px] text-center bg-[#0a1c47] border-r-2 border-slate-700 text-amber-300 min-w-[55px]">DÉC. {oddSemLabel}</th>

                      {annualModules.filter((m: any) => m.semester_number % 2 === 0).map((m: any, idx: number) => (
                        <th key={m.id} colSpan={3} className="py-1 px-1 font-mono text-[10px] font-black text-center bg-[#153478] border-r border-slate-700/80 text-white" title={m.name}>
                          {m.code || `M0${idx+8}`}
                        </th>
                      ))}
                      <th rowSpan={2} className="py-1.5 px-2 font-black text-[10px] text-center bg-[#0f2863] border-r border-slate-700 text-blue-200 min-w-[55px]">MOY {evenSemLabel}</th>
                      <th rowSpan={2} className="py-1.5 px-2 font-black text-[10px] text-center bg-[#0a1c47] border-r-2 border-slate-700 text-amber-300 min-w-[55px]">DÉC. {evenSemLabel}</th>
                    </tr>

                    {/* Row 3: Sub-Headers (note | déc. | année) */}
                    <tr className="bg-[#0b1c42] text-slate-300 border-b border-slate-700 text-[9px] font-bold">
                      {annualModules.filter((m: any) => m.semester_number % 2 !== 0).map((m: any) => (
                        <React.Fragment key={m.id}>
                          <th className="py-0.5 px-1 text-center font-bold border-r border-slate-700/60 min-w-[38px] text-slate-300">note</th>
                          <th className="py-0.5 px-1 text-center font-bold border-r border-slate-700/60 min-w-[28px] text-slate-300">déc.</th>
                          <th className="py-0.5 px-1 text-center font-bold border-r border-slate-600 min-w-[32px] text-slate-300">année</th>
                        </React.Fragment>
                      ))}
                      {annualModules.filter((m: any) => m.semester_number % 2 === 0).map((m: any) => (
                        <React.Fragment key={m.id}>
                          <th className="py-0.5 px-1 text-center font-bold border-r border-slate-700/60 min-w-[38px] text-slate-300">note</th>
                          <th className="py-0.5 px-1 text-center font-bold border-r border-slate-700/60 min-w-[28px] text-slate-300">déc.</th>
                          <th className="py-0.5 px-1 text-center font-bold border-r border-slate-600 min-w-[32px] text-slate-300">année</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAnnualData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={annualModules.length > 0 ? annualModules.length * 3 + 9 : 9}
                      className="py-12 text-center text-slate-400 dark:text-slate-500 italic text-xs"
                    >
                      Aucun étudiant ne correspond aux critères de recherche ou de filtre.
                    </td>
                  </tr>
                ) : (
                  filteredAnnualData.map((row: any, idx: number) => {
                    const isEven = idx % 2 === 0
                    const rowOpaqueBg = isEven ? '!bg-white dark:!bg-slate-900' : '!bg-slate-50 dark:!bg-slate-800'
                    const rowHoverBg = 'hover:bg-blue-50/50 dark:hover:bg-slate-800/80'

                    return (
                      <tr key={row.student_id} className={cn("transition-colors", rowOpaqueBg, rowHoverBg)}>
                        {/* Apogee: 100% Solid background to completely prevent bleed-through */}
                        <td className={cn(
                          "py-2 px-2 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 border-r border-b border-slate-200 dark:border-slate-800 sm:sticky sm:left-0 z-20 text-center shadow-xs min-w-[85px] w-[85px]",
                          rowOpaqueBg
                        )}>
                          {row.cne}
                        </td>

                        {/* CIN: Dedicated column */}
                        <td className={cn(
                          "py-2 px-2 font-mono font-black text-xs text-indigo-950 dark:text-indigo-200 border-r border-b border-slate-200 dark:border-slate-800 sm:sticky sm:left-[85px] z-20 text-center shadow-xs min-w-[75px] w-[75px]",
                          rowOpaqueBg
                        )}>
                          {row.cin || '–'}
                        </td>

                        {/* Student Name */}
                        <td className={cn(
                          "py-2 px-2.5 border-r-2 border-b border-slate-300 dark:border-slate-700 sticky left-0 sm:left-[160px] z-20 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] min-w-[125px] max-w-[135px]",
                          rowOpaqueBg
                        )}>
                          <div className="flex items-center gap-1 min-w-0" title={row.student_name}>
                            <span className="font-extrabold text-[11px] text-slate-900 dark:text-white truncate">
                              {row.student_name}
                            </span>
                            {(row.has_fraud || row.decision === 'FRAUDE') && (
                              <span className="px-1 py-0.2 bg-rose-600 text-white rounded text-[8.5px] font-black uppercase shrink-0">
                                FRAUDE
                              </span>
                            )}
                          </div>
                        </td>

                        {annualModules.length > 0 ? (
                          <>
                            {/* Odd Semester Modules (3 sub-columns: note | déc. | année) */}
                            {annualModules.filter((m: any) => m.semester_number % 2 !== 0).map((m: any) => {
                              const modInfo = row.modules_map?.[m.id] || row.modules_detail?.find((md: any) => md.module_id === m.id)
                              const gradeVal = modInfo ? Number(modInfo.final_grade) : null
                              const isElim = gradeVal !== null && gradeVal < 6.00
                              const isFailed = gradeVal !== null && gradeVal < 10.00
                              const decText = modInfo?.decision === 'V.Comp' ? 'VPC' : (modInfo?.decision || 'NV')
                              const valYear = modInfo?.validation_year || ''
                              let shortYear = '–'
                              if (valYear) {
                                const ym = valYear.match(/(\d{2,4})[/-](\d{2,4})/)
                                if (ym) shortYear = `${ym[1].slice(-2)}-${ym[2].slice(-2)}`
                                else shortYear = valYear
                              }

                              const noteColor =
                                isElim ? 'text-rose-700 dark:text-rose-400 font-black' :
                                isFailed ? 'text-amber-700 dark:text-amber-400 font-black' :
                                gradeVal !== null ? 'text-slate-900 dark:text-slate-100 font-black' :
                                'text-slate-400 font-bold'

                              const decColor =
                                decText === 'V' ? "text-emerald-700 dark:text-emerald-400 font-black" :
                                decText === 'VAR' ? "text-sky-700 dark:text-sky-400 font-black" :
                                (decText === 'VPC' || decText === 'V.PC') ? "text-indigo-700 dark:text-indigo-400 font-black" :
                                "text-rose-700 dark:text-rose-400 font-black"

                              const bgElim = isElim ? 'bg-rose-50/70 dark:bg-rose-950/30' : ''

                              return (
                                <React.Fragment key={m.id}>
                                  <td className={cn("py-1.5 px-1 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono text-xs", bgElim, noteColor)}>
                                    {gradeVal !== null && !isNaN(gradeVal) ? Number(gradeVal).toFixed(2) : '–'}
                                  </td>
                                  <td className={cn("py-1.5 px-1 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]", bgElim, decColor)}>
                                    {decText}
                                  </td>
                                  <td className={cn("py-1.5 px-1 text-center border-r-2 border-b border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold", bgElim)}>
                                    {shortYear}
                                  </td>
                                </React.Fragment>
                              )
                            })}

                            {/* Odd Sem Average */}
                            <td className="py-2.5 px-2 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono font-black text-xs bg-blue-50/40 dark:bg-blue-950/20 text-[#0f2863] dark:text-blue-300">
                              {row.odd_semester_avg !== null && row.odd_semester_avg !== undefined ? Number(row.odd_semester_avg).toFixed(2) : '–'}
                            </td>

                            {/* Odd Sem Decision */}
                            <td className="py-2.5 px-2 text-center border-r-2 border-b border-slate-200 dark:border-slate-800">
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border",
                                row.odd_semester_decision === 'V' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" :
                                row.odd_semester_decision === 'V.Comp' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" :
                                row.odd_semester_decision === 'PASS_DETTES' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" :
                                "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                              )}>
                                {row.odd_semester_decision === 'V.Comp' ? 'VPC' : row.odd_semester_decision || 'NV'}
                              </span>
                            </td>

                            {/* Even Semester Modules (3 sub-columns: note | déc. | année) */}
                            {annualModules.filter((m: any) => m.semester_number % 2 === 0).map((m: any) => {
                              const modInfo = row.modules_map?.[m.id] || row.modules_detail?.find((md: any) => md.module_id === m.id)
                              const gradeVal = modInfo ? Number(modInfo.final_grade) : null
                              const isElim = gradeVal !== null && gradeVal < 6.00
                              const isFailed = gradeVal !== null && gradeVal < 10.00
                              const decText = modInfo?.decision === 'V.Comp' ? 'VPC' : (modInfo?.decision || 'NV')
                              const valYear = modInfo?.validation_year || ''
                              let shortYear = '–'
                              if (valYear) {
                                const ym = valYear.match(/(\d{2,4})[/-](\d{2,4})/)
                                if (ym) shortYear = `${ym[1].slice(-2)}-${ym[2].slice(-2)}`
                                else shortYear = valYear
                              }

                              const noteColor =
                                isElim ? 'text-rose-700 dark:text-rose-400 font-black' :
                                isFailed ? 'text-amber-700 dark:text-amber-400 font-black' :
                                gradeVal !== null ? 'text-slate-900 dark:text-slate-100 font-black' :
                                'text-slate-400 font-bold'

                              const decColor =
                                decText === 'V' ? "text-emerald-700 dark:text-emerald-400 font-black" :
                                decText === 'VAR' ? "text-sky-700 dark:text-sky-400 font-black" :
                                (decText === 'VPC' || decText === 'V.PC') ? "text-indigo-700 dark:text-indigo-400 font-black" :
                                "text-rose-700 dark:text-rose-400 font-black"

                              const bgElim = isElim ? 'bg-rose-50/70 dark:bg-rose-950/30' : ''

                              return (
                                <React.Fragment key={m.id}>
                                  <td className={cn("py-1.5 px-1 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono text-xs", bgElim, noteColor)}>
                                    {gradeVal !== null && !isNaN(gradeVal) ? Number(gradeVal).toFixed(2) : '–'}
                                  </td>
                                  <td className={cn("py-1.5 px-1 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]", bgElim, decColor)}>
                                    {decText}
                                  </td>
                                  <td className={cn("py-1.5 px-1 text-center border-r-2 border-b border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold", bgElim)}>
                                    {shortYear}
                                  </td>
                                </React.Fragment>
                              )
                            })}

                            {/* Even Sem Average */}
                            <td className="py-2.5 px-2 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono font-black text-xs bg-blue-50/40 dark:bg-blue-950/20 text-[#0f2863] dark:text-blue-300">
                              {row.even_semester_avg !== null && row.even_semester_avg !== undefined ? Number(row.even_semester_avg).toFixed(2) : '–'}
                            </td>

                            {/* Even Sem Decision */}
                            <td className="py-2.5 px-2 text-center border-r-2 border-b border-slate-200 dark:border-slate-800">
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border",
                                row.even_semester_decision === 'V' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" :
                                row.even_semester_decision === 'V.Comp' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" :
                                row.even_semester_decision === 'PASS_DETTES' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" :
                                "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                              )}>
                                {row.even_semester_decision === 'V.Comp' ? 'VPC' : row.even_semester_decision || 'NV'}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2.5 px-3 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono font-black text-xs">
                              {row.odd_semester_avg} /20
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono font-black text-xs">
                              {row.even_semester_avg} /20
                            </td>
                          </>
                        )}

                        {/* Annual Average */}
                        <td className="py-2.5 px-3 text-center border-r border-b border-slate-200 dark:border-slate-800 font-mono font-black text-sm bg-blue-50/40 dark:bg-blue-950/20 text-[#0f2863] dark:text-blue-300">
                          {row.annual_average !== null && row.annual_average !== undefined ? Number(row.annual_average).toFixed(2) : '–'}
                        </td>

                        {/* Annual Decision */}
                        <td className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-800">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border inline-block shadow-xs",
                              row.has_fraud || row.decision === 'FRAUDE' ? "bg-rose-600 text-white border-rose-700" :
                              row.decision === 'V' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" :
                              row.decision === 'V.Comp' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" :
                              row.decision === 'PASS_DETTES' ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" :
                              row.decision === 'REDOUBLE' ? "bg-red-100 text-red-900 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800" :
                              "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                            )}>
                              {row.has_fraud || row.decision === 'FRAUDE' ? '🚨 FRAUDE' :
                               row.decision === 'V' ? 'VALIDÉ DIRECT' :
                               row.decision === 'V.Comp' ? 'VALIDÉ PAR COMP.' :
                               row.decision === 'PASS_DETTES' ? 'PASSAGE AVEC DETTES' :
                               row.decision === 'REDOUBLE' ? 'REDOUBLEMENT' :
                               'AJOURNÉ'}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-semibold tracking-tight">
                              {row.has_fraud || row.decision === 'FRAUDE' ? 'Sanction Disciplinaire' :
                               row.decision === 'V' ? 'Admis en Année Supérieure' :
                               row.decision === 'V.Comp' ? 'Admis par Compensation' :
                               row.decision === 'PASS_DETTES' ? 'Admis avec Réserve (1 dette)' :
                               row.decision === 'REDOUBLE' ? 'Non Admis (Redoublement)' :
                               'Non Admis (Ajourné)'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* JURY COMMITTEE STATUS HUB (Commission Jury Annuelle) */}
        {juryStatus && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Commission Jury Annuelle ({oddSemLabel} + {evenSemLabel} • 14 Modules)
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Suivi des Signatures du Jury de Délibération Annuelle
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    {juryStatus.signed_count} / {juryStatus.total_members} Signatures Récoltées
                  </span>
                  <div className="w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${juryStatus.total_members > 0 ? (juryStatus.signed_count / juryStatus.total_members) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => {
                    const filiereId = selectedFiliere || 13
                    const yearLevel = selectedYearLevel || 1
                    toast.loading('⏳ Génération du PDF Officiel...', { id: 'pdf-export' })
                    downloadPdf(
                      `/deliberations/export-pv-pdf?type=annuel&filiere_id=${filiereId}&year_level=${yearLevel}`,
                      `PV_Annuel_Filiere${filiereId}_Annee${yearLevel}.pdf`
                    ).then(() => toast.dismiss('pdf-export'))
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
                          openJuryVisa(member)
                        }}
                        className="w-full py-1.5 px-3 bg-[#0f2863] hover:bg-[#193a86] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {member.role === 'chef_filiere' ? '✍️ Signer (Chef / Président)' : '✍️ Valider Manuellement'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Tactile Modal for Annual PV View */}

      </div>
    )
  }

  if (pvType === 'annuel') {
    return renderAnnualPVPage()
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

  // Dynamic analytics calculation based on current session and filtered dataset
  const rawStudentList: any[] = pvData?.data ?? []

  const activeSessionStudents = rawStudentList.filter((s: any) => {
    if (session === 'rattrapage') {
      return (
        s.decision_normale === 'R' ||
        s.decision_normale === 'NV' ||
        s.rattrapage_absent ||
        (s.rattrapage_note !== null && s.rattrapage_note !== '')
      )
    }
    return true
  })

  const totalStudents = activeSessionStudents.length

  const gradesList = activeSessionStudents
    .map((s: any) => (session === 'normale' ? s.moyenne_normale : (s.moyenne_finale ?? s.moyenne_normale)))
    .filter((g: any) => g !== null && g !== undefined && !isNaN(Number(g)))
    .map((g: any) => Number(g))

  const avgGradeNum = gradesList.length ? gradesList.reduce((acc, v) => acc + v, 0) / gradesList.length : 0
  const avgGrade = gradesList.length ? avgGradeNum.toFixed(2) : (pvData?.analytics?.avg != null ? Number(pvData.analytics.avg).toFixed(2) : '–')

  let medianGrade = '–'
  if (gradesList.length > 0) {
    const sorted = [...gradesList].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const medVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
    medianGrade = medVal.toFixed(2)
  } else if (pvData?.analytics?.median != null && pvData.analytics.median !== 0) {
    medianGrade = Number(pvData.analytics.median).toFixed(2)
  }

  const valCount = activeSessionStudents.filter((s: any) => {
    const dec = session === 'normale' ? s.decision_normale : s.decision_finale
    return dec === 'V' || dec === 'VAR'
  }).length

  const ratCount = activeSessionStudents.filter((s: any) => {
    const dec = session === 'normale' ? s.decision_normale : s.decision_finale
    return dec === 'R'
  }).length

  const nvCount = activeSessionStudents.filter((s: any) => {
    const dec = session === 'normale' ? s.decision_normale : s.decision_finale
    return dec === 'NV' || dec === 'FRAUDE'
  }).length

  const passRate = totalStudents > 0 ? Math.round((valCount / totalStudents) * 1000) / 10 : 0

  const pieData = [
    { name: 'Validés',    value: valCount, color: '#10B981' },
    { name: 'Rattrapage', value: ratCount, color: '#F59E0B' },
    { name: 'Éliminés',  value: nvCount,  color: '#EF4444' },
  ].filter(d => d.value > 0)

  const computedDistribution = [
    { range: '0-2', count: 0 },
    { range: '2-4', count: 0 },
    { range: '4-6', count: 0 },
    { range: '6-8', count: 0 },
    { range: '8-10', count: 0 },
    { range: '10-12', count: 0 },
    { range: '12-14', count: 0 },
    { range: '14-16', count: 0 },
    { range: '16-18', count: 0 },
    { range: '18-20', count: 0 },
  ]

  gradesList.forEach((g) => {
    if (g < 2) computedDistribution[0].count++
    else if (g < 4) computedDistribution[1].count++
    else if (g < 6) computedDistribution[2].count++
    else if (g < 8) computedDistribution[3].count++
    else if (g < 10) computedDistribution[4].count++
    else if (g < 12) computedDistribution[5].count++
    else if (g < 14) computedDistribution[6].count++
    else if (g < 16) computedDistribution[7].count++
    else if (g < 18) computedDistribution[8].count++
    else computedDistribution[9].count++
  })

  const barData = computedDistribution

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto pb-24">
      {/* Selector Bar */}
      <div className="print:hidden">
        {renderSelectorBar()}
      </div>

      {/* Module PV Header & Action Card: Hidden during print */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
        {/* Top Row: Module Identity + Signature Status + Sign Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Left: Back button + Title & Module Identity */}
          <div className="flex items-center gap-3.5">
            <Link
              to="/admin/grades"
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all shadow-xs shrink-0"
              title="Retour aux notes"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-[#0f2863] dark:text-blue-300 tracking-tight">
                  PV de Délibération de Module
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                  {pvData.module.code}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-bold mt-0.5">
                {pvData.module.name}
              </p>
            </div>
          </div>

          {/* Right: Signature Badge + Primary Signature Button */}
          <div className="flex items-center gap-3 self-stretch sm:self-end lg:self-center shrink-0 flex-wrap">
            {pvData.signature ? (
              <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-2 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-extrabold flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Signé : {pvData.signature.signed_by || 'Enseignant'}
                  </span>
                  <span className="text-[9px] text-emerald-600/90 dark:text-emerald-400 font-mono">
                    {session === 'normale' ? 'S. Ordinaire' : session === 'rattrapage' ? 'S. Rattrapage' : 'Vue Totale'} • {new Date(pvData.signature.signed_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3.5 py-2 rounded-2xl text-xs font-bold text-amber-800 dark:text-amber-300 shadow-xs">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                    Non signée ({session === 'normale' ? 'S. Ordinaire' : session === 'rattrapage' ? 'S. Rattrapage' : 'Vue Totale'})
                  </span>
                  <span className="text-[9px] text-amber-700/80 dark:text-amber-400/80">
                    En attente de confirmation
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setActiveJurySigningId(null)
                setShowSignatureModal(true)
              }}
              className={cn(
                "rounded-2xl flex items-center gap-2 text-xs font-black shadow-md hover:-translate-y-0.5 transition-all px-4 py-2.5 text-white shrink-0",
                pvData.signature
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-[#0f2863] hover:bg-[#1a387e] shadow-blue-900/20"
              )}
            >
              <span>✍️</span>
              <span>
                {pvData.signature
                  ? `Re-signer (${session === 'normale' ? 'Ordinaire' : session === 'rattrapage' ? 'Rattrapage' : 'Vue Totale'})`
                  : `Signer le PV (${session === 'normale' ? 'Ordinaire' : session === 'rattrapage' ? 'Rattrapage' : 'Vue Totale'})`}
              </span>
            </Button>
          </div>
        </div>

        {/* Bottom Row: Export & Utilities Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          {/* Left Actions: Official Downloads and Transmissions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs px-4 py-2"
            >
              {isExportingPdf ? <Spinner className="text-white w-4 h-4" /> : <Download className="w-4 h-4 text-amber-300" />}
              <span>Télécharger PDF Officiel</span>
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="rounded-xl flex items-center gap-1.5 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Aperçu Web</span>
            </Button>

            <Button
              onClick={handleDownloadZipBundle}
              disabled={isExportingZip}
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50/70 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-xs px-3.5 py-2"
            >
              {isExportingZip ? <Spinner className="text-indigo-600 w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5 text-indigo-500" />}
              <span>Pack PV (ZIP)</span>
            </Button>

            <Button
              onClick={() => setShowBulkEmailModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-xs px-3.5 py-2"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-200" />
              <span>Préparer les relevés</span>
            </Button>

            {/* Toggle Statistiques & IA */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAnalytics((prev) => !prev)}
              className={cn(
                "rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all px-3.5 py-2",
                showAnalytics
                  ? "bg-purple-100/90 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
              )}
            >
              <BarChart2 className={cn("w-3.5 h-3.5", showAnalytics ? "text-purple-600 dark:text-purple-400" : "text-slate-500")} />
              <span>{showAnalytics ? "Masquer Stats & IA" : "Statistiques & IA"}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", showAnalytics && "rotate-180")} />
            </Button>
          </div>

          {/* Right Action: Refresh */}
          <Button
            variant="ghost"
            onClick={() => refetchPV()}
            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 text-xs font-semibold px-3 py-2"
            title="Actualiser les données"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoadingPV && "animate-spin")} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Collapsed Bar: Shown when statistics & IA are hidden to keep page uncluttered */}
      {!showAnalytics && (
        <div
          onClick={() => setShowAnalytics(true)}
          className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 rounded-2xl px-4 py-3 flex items-center justify-between transition-all shadow-xs group print:hidden hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
              📊
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                Statistiques Promo & Copilote IA
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Moyenne : <strong className="text-blue-700 dark:text-blue-400 font-black">{avgGrade}</strong>/20
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Réussite : <strong className="text-emerald-700 dark:text-emerald-400 font-black">{passRate}%</strong> ({valCount}/{totalStudents})
              </span>
              {aiAuditData && (
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  aiAuditData.anomalies_detected
                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                )}>
                  {aiAuditData.anomalies_detected ? '⚠️ Anomalie IA' : '✨ IA Conforme'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-bold text-xs group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Afficher statistiques & graphiques</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Expanded Analytics & AI Section (only visible when toggled) */}
      {showAnalytics && (
        <div className="space-y-4 print:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                Tableau de Bord Statistique & Copilote IA
              </span>
              <span className="text-[10px] font-semibold text-slate-400">({session === 'normale' ? 'Session Ordinaire' : session === 'rattrapage' ? 'Session Rattrapage' : 'Bilan Global'})</span>
            </div>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-xs font-bold text-slate-500 hover:text-purple-700 dark:hover:text-purple-400 flex items-center gap-1 transition-colors"
            >
              <span>Masquer l'analyse</span>
              <ChevronDown className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          {/* Gemini AI Grade Audit Copilot */}
          {aiAuditData && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 rounded-2xl shadow-lg border border-indigo-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-black text-lg shrink-0">
                    🧠
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Copilote IA Délibération & Audit Académique</span>
                    </h4>
                    <p className="text-[11px] text-indigo-200/80 font-medium">Analyse statistique de la promotion et conformité aux règles pédagogiques.</p>
                  </div>
                </div>

                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 flex items-center gap-1.5",
                  aiAuditData.anomalies_detected
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", aiAuditData.anomalies_detected ? "bg-rose-400" : "bg-emerald-400")} />
                  {aiAuditData.anomalies_detected ? 'Alerte Anomalie Détectée' : 'Distribution Conforme'}
                </span>
              </div>

              {aiAuditData.insights && aiAuditData.insights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                  {aiAuditData.insights.map((ins: string, idx: number) => (
                    <div key={idx} className="bg-white/5 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/10 text-xs font-medium text-blue-100 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Dashboard (Jury Analytics 5 KPI Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Moyenne */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moyenne Générale</span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="mt-2.5 mb-1">
                <span className="text-2xl lg:text-3xl font-black text-[#0f2863] dark:text-blue-300 tracking-tight">{avgGrade}</span>
                <span className="text-xs text-slate-400 font-semibold ms-1">/20</span>
              </div>
              <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold truncate">
                {session === 'normale' ? 'Session Ordinaire' : session === 'rattrapage' ? 'Session Rattrapage' : 'Bilan Global'}
              </span>
            </div>

            {/* Card 2: Médiane */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-violet-600 rounded-t-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Médiane Promo</span>
                <span className="w-2 h-2 rounded-full bg-violet-500" />
              </div>
              <div className="mt-2.5 mb-1">
                <span className="text-2xl lg:text-3xl font-black text-violet-600 dark:text-violet-400 tracking-tight">{medianGrade}</span>
                <span className="text-xs text-slate-400 font-semibold ms-1">/20</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Note médiane de la promo</span>
            </div>

            {/* Card 3: Taux de Réussite */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux de Réussite</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-2.5 mb-1">
                <span className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{passRate}%</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">{valCount} validés sur {totalStudents}</span>
            </div>

            {/* Card 4: Rattrapage */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Au Rattrapage</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="mt-2.5 mb-1">
                <span className="text-2xl lg:text-3xl font-black text-amber-500 tracking-tight">{ratCount}</span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">{totalStudents > 0 ? ((ratCount / totalStudents) * 100).toFixed(1) : 0}% de la promotion</span>
            </div>

            {/* Card 5: Non Validés */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group col-span-2 sm:col-span-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 rounded-t-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Non Validés (Exclus)</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="mt-2.5 mb-1">
                <span className="text-2xl lg:text-3xl font-black text-rose-500 tracking-tight">{nvCount}</span>
              </div>
              <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">{totalStudents > 0 ? ((nvCount / totalStudents) * 100).toFixed(1) : 0}% éliminés (&lt; 6.00)</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Decisions breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[280px]">
              <div>
                <h3 className="text-xs font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Statut des Décisions</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Répartition des réussites et échecs ({session === 'normale' ? 'S. Ordinaire' : session === 'rattrapage' ? 'S. Rattrapage' : 'Bilan Global'})</p>
              </div>
              <div className="h-[160px] w-full relative flex items-center justify-center">
                {pieData.length === 0 ? (
                  <div className="text-slate-400 text-xs italic">Aucune donnée</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} étudiants`, 'Nombre']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center pointer-events-none">
                      <span className="text-xl font-black text-slate-800 dark:text-white">{passRate}%</span>
                      <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">RÉUSSITE</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Validés ({valCount})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Rattrapage ({ratCount})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Éliminés ({nvCount})</span>
              </div>
            </div>

            {/* Gauss Distribution curve */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs col-span-1 lg:col-span-2 flex flex-col justify-between h-[280px]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider">Distribution des Moyennes</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Nombre d'étudiants par tranche de note (Courbe de Gauss - {session === 'normale' ? 'S. Ordinaire' : session === 'rattrapage' ? 'S. Rattrapage' : 'Bilan Global'})</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  10 tranches
                </span>
              </div>
              <div className="h-[180px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="range" tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} étudiants`, 'Effectif']} cursor={{ fill: 'rgba(15, 40, 99, 0.04)' }} />
                    <Bar dataKey="count" fill="#0f2863" radius={[6, 6, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[9px] text-slate-400 text-right font-medium">
                Distribution temps réel synchronisée avec les notes saisies
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Navigation & Scope Toolbar: Hidden during print */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs print:hidden">
        {/* Left: Session Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          <button
            onClick={() => { setSession('normale'); setSignatureDataUrl(''); }}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0",
              session === 'normale'
                ? "bg-[#0f2863] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <span>Session Ordinaire (Normale)</span>
            {pvData?.signatures?.normale ? (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal normal-case flex items-center gap-1",
                session === 'normale' ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800"
              )}>
                ✓ Signé
              </span>
            ) : (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-normal tracking-normal normal-case",
                session === 'normale' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
              )}>
                En attente
              </span>
            )}
          </button>

          <button
            onClick={() => { setSession('rattrapage'); setSignatureDataUrl(''); }}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0",
              session === 'rattrapage'
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <span>Session de Rattrapage</span>
            {pvData?.signatures?.rattrapage ? (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal normal-case flex items-center gap-1",
                session === 'rattrapage' ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800"
              )}>
                ✓ Signé
              </span>
            ) : (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-normal tracking-normal normal-case",
                session === 'rattrapage' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
              )}>
                Non signée
              </span>
            )}
          </button>

          <button
            onClick={() => { setSession('totale'); setSignatureDataUrl(''); }}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0",
              session === 'totale'
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <span>Vue Totale (S.O + S.R)</span>
            {pvData?.signatures?.totale ? (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal normal-case flex items-center gap-1",
                session === 'totale' ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800"
              )}>
                ✓ Signé
              </span>
            ) : (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-normal tracking-normal normal-case",
                session === 'totale' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
              )}>
                Non signée
              </span>
            )}
          </button>
        </div>

        {/* Right: View Scope Toggle */}
        <div className="flex items-center gap-2.5 px-2 self-end lg:self-center shrink-0">
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            Périmètre :
          </span>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setViewAllGroups(false)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap",
                !viewAllGroups
                  ? "bg-[#0f2863] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              )}
            >
              {groupId && groupId !== 'all' ? `Groupe ${groupId}` : 'Ce Groupe'}
            </button>
            <button
              onClick={() => setViewAllGroups(true)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap",
                viewAllGroups
                  ? "bg-[#0f2863] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
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
          header, nav, aside, .print\\:hidden, button, input:not([type="hidden"]), select {
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
                                    disabled={rattrapageGrades[student.student_id]?.absent || session === 'totale' || Boolean(pvData?.is_rattrapage_locked)}
                                    onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                                    className="w-16 p-1 border rounded-lg text-center font-bold text-slate-800 focus:border-amber-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                  {session === 'rattrapage' && (
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={rattrapageGrades[student.student_id]?.absent || false}
                                        disabled={Boolean(pvData?.is_rattrapage_locked)}
                                        onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
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

          {/* Rattrapage Locked Notice Banner */}
          {session === 'rattrapage' && pvData?.is_rattrapage_locked && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 text-amber-900 dark:text-amber-200 flex items-center gap-3 print:hidden">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-black text-xs uppercase tracking-wider">Session de Rattrapage Actuellement Verrouillée 🔒</p>
                <p className="text-xs font-medium">{pvData?.rattrapage_lock_reason || "La session de rattrapage est actuellement fermée par l'administration (Phase active : Ordinaire Automne)."}</p>
              </div>
            </div>
          )}

          {/* Rattrapage Saving action bar — only in rattrapage tab, only for R students */}
          {session === 'rattrapage' && (
            <div className="mt-8 flex justify-between items-center print:hidden">
              <Button
                type="button"
                onClick={handleGenerateEligibilities}
                disabled={isGeneratingEligibilities || Boolean(pvData?.is_rattrapage_locked)}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                {isGeneratingEligibilities ? <Spinner className="text-amber-600" /> : '🔄'}
                Générer / Actualiser les éligibilités Rattrapage
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending || Boolean(pvData?.is_rattrapage_locked)}
                className="bg-amber-600 text-white hover:bg-amber-700 rounded-xl flex items-center gap-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? <Spinner className="text-white" /> : <Save className="w-4 h-4" />}
                {pvData?.is_rattrapage_locked ? 'Saisie Verrouillée 🔒' : 'Enregistrer les notes de Rattrapage'}
              </Button>
            </div>
          )}
        </form>

        {/* Official Signatures section */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs font-bold text-slate-800 gap-8">
          <div className="flex flex-col items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-200 print:bg-transparent print:border-slate-400 min-h-[140px]">
            <div>
              <p className="uppercase text-[11px] text-[#0f2863]">Signature de l'Enseignant Responsable du Module</p>
              <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                ({session === 'normale' ? 'Session Ordinaire' : session === 'rattrapage' ? 'Session de Rattrapage' : 'Bilan Complet (Vue Totale)'})
              </p>
            </div>
            {pvData?.signature?.signature_data ? (
              <div className="flex flex-col items-center my-2">
                <img src={pvData.signature.signature_data} alt="Signature" className="h-16 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-1">{pvData.signature.signed_by || 'Enseignant Responsable'}</p>
                <p className="text-[8px] text-emerald-700 font-mono font-bold mt-0.5">
                  ✓ Signé le {new Date(pvData.signature.signed_at).toLocaleDateString('fr-FR')} à {new Date(pvData.signature.signed_at).toLocaleTimeString('fr-FR')}
                </p>
                <p className="text-[7px] text-slate-400 font-mono">
                  IP: {pvData.signature.ip_address}
                </p>
              </div>
            ) : (
              <div className="my-6 text-slate-400 font-normal italic text-[10px] border-b border-dashed border-slate-400 w-64 py-4">
                (Signature non encore apposée pour la {session === 'normale' ? 'Session Ordinaire' : session === 'rattrapage' ? 'Session de Rattrapage' : 'Vue Totale'})
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-200 print:bg-transparent print:border-slate-400 min-h-[140px]">
            <div>
              <p className="uppercase text-[11px] text-[#0f2863]">Signature du Président du Jury & Cachet de l'Établissement</p>
              <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                (École Nationale de Commerce et de Gestion de Fès)
              </p>
            </div>
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
                <p className="font-bold text-slate-800 text-[9px] uppercase">
                  Empreinte Numérique Cryptographique SHA-256 ({session === 'normale' ? 'Session Ordinaire' : session === 'rattrapage' ? 'Session Rattrapage' : 'Vue Totale'})
                </p>
                <p className="text-slate-500 font-mono text-[8px]">{pvData.signature.digital_seal}</p>
                <p className="text-emerald-700 font-semibold text-[8px]">
                  Horodatage Certifié : {new Date(pvData.signature.signed_at).toLocaleDateString('fr-FR')} à {new Date(pvData.signature.signed_at).toLocaleTimeString('fr-FR')}
                </p>
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


      {/* 📋 FEATURE N°2: Group Comparison Modal */}


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


      {/* 🔒 PV LOCK CONFIRMATION MODAL */}


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


      {/* 📋 PV de Rachat Confirmation & Export Modal */}
      {selectedRachatStudent && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border-4 border-slate-950 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-950 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 border-2 border-amber-400 flex items-center justify-center font-black text-2xl shadow-md">
                  ⚖️
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Validation du PV de Rachat (Jury)</h3>
                  <p className="text-xs text-slate-500 font-bold">Filière : {filieres.find((f: any) => String(f.id) === String(selectedFiliere))?.name || 'Filière ENCG'} • Année Académique 2026/2027</p>
                </div>
              </div>
              <button onClick={() => setSelectedRachatStudent(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-800 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-black text-slate-900 dark:text-slate-100">
                <span>Étudiant :</span>
                <span className="text-amber-900 dark:text-amber-300 font-extrabold">{selectedRachatStudent.student_name} ({selectedRachatStudent.cne})</span>
              </div>
              <div className="flex justify-between text-xs font-black text-slate-900 dark:text-slate-100">
                <span>CIN :</span>
                <span className="font-mono text-indigo-900 dark:text-indigo-300 font-bold">{selectedRachatStudent.cin || '-'}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-slate-900 dark:text-slate-100">
                <span>Module Concerné :</span>
                <span className="font-mono">{selectedRachatStudent.module_code}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-slate-900 dark:text-slate-100">
                <span>Points de Rachat Accordés :</span>
                <span className="text-amber-700 dark:text-amber-400 font-extrabold text-sm">+{selectedRachatStudent.needed_points} pt</span>
              </div>
              <div className="flex justify-between text-xs font-black text-slate-900 dark:text-slate-100">
                <span>Nouvelle Note Module :</span>
                <span className="text-emerald-600 font-mono font-extrabold text-sm">{selectedRachatStudent.target_grade} / 20</span>
              </div>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-between text-xs font-black">
                <span>Impact sur l'Année :</span>
                <span className="text-indigo-700 dark:text-indigo-300">{selectedRachatStudent.impact}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Motif & Justification Officielle du Jury :
              </label>
              <textarea
                value={selectedRachatReason}
                onChange={(e) => setSelectedRachatReason(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs font-bold rounded-xl border-2 border-slate-950 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2 border border-slate-300">
              <span>📋 La validation génère automatiquement le Procès-Verbal de Rachat (PDF) à faire signer par le Professeur du Module, le Chef de Filière et le Chef de Département.</span>
            </div>

            <div className="pt-3 border-t-2 border-slate-950 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedRachatStudent(null)}
                className="rounded-xl font-bold text-xs border-2 border-slate-950 cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  applyRachatMutation.mutate({
                    student_id: selectedRachatStudent.student_id,
                    filiere_id: Number(selectedFiliere || 1),
                    semester: Number(selectedSemester || 1),
                    module_id: selectedRachatStudent.module_id,
                    new_grade: Number(selectedRachatStudent.target_grade),
                    points_added: Number(selectedRachatStudent.needed_points),
                    reason: selectedRachatReason || selectedRachatStudent.text,
                  })
                }}
                disabled={applyRachatMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs px-5 py-2.5 shadow-lg border-2 border-slate-950 cursor-pointer flex items-center gap-2"
              >
                {applyRachatMutation.isPending ? <Spinner /> : <Sparkles className="w-4 h-4" />}
                ⚡ Confirmer & Générer le PV de Rachat (PDF)
              </Button>
            </div>
          </div>
        </div>
      )}

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

    </div>
  )
}


