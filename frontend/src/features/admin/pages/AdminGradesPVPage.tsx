import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer, Save, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Lock, Download, FileText, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Spinner } from '@shared/components/ui/Spinner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { QRCodeSVG } from 'qrcode.react'

export default function AdminGradesPVPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [searchParams] = useSearchParams()
  const moduleId = searchParams.get('module_id')
  const groupId = searchParams.get('group_id')
  const queryClient = useQueryClient()

  // Selection states for selector bar
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(groupId || '')
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

  const [session, setSession] = useState<'normale' | 'rattrapage'>('normale')
  const [rattrapageGrades, setRattrapageGrades] = useState<Record<number, { value: string; absent: boolean }>>({})
  const [viewAllGroups, setViewAllGroups] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  // Jury & Dual PV State
  const [pvType, setPvType] = useState<'semestriel' | 'annuel'>('semestriel')
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

  // Fetch consolidated PV data
  const { data: pvData, isLoading: isLoadingPV, refetch: refetchPV } = useQuery({
    queryKey: ['module-pv', moduleId, groupId, viewAllGroups],
    queryFn: () => api.get(`/modules/${moduleId}/pv`, {
      params: { group_id: viewAllGroups ? 'all' : (groupId && groupId !== 'null' ? groupId : 'all') }
    }).then(res => res.data),
    enabled: !!moduleId,
  })

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
          signature_data: dataUrl
        })
        toast.success(res.data.message)
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

  const handlePrint = () => {
    window.print()
  }

  const renderSelectorBar = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            {isRtl ? 'محاضر النقاط الرسمية' : 'Procès-Verbaux de Notes Officiels'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRtl ? 'اختر نوع المحضر والشعبة للدورة واللجنة الرسمية' : 'Sélectionnez le type de PV (Semestriel ou Annuel Global) et la filière.'}
          </p>
        </div>

        {/* PV Type Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setPvType('semestriel')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
              pvType === 'semestriel' 
                ? "bg-indigo-600 text-white shadow-md" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <Layers className="w-4 h-4" />
            PV Semestriel (7 Modules)
          </button>
          <button
            type="button"
            onClick={() => setPvType('annuel')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
              pvType === 'annuel' 
                ? "bg-indigo-600 text-white shadow-md" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            PV Annuel Global (14 Modules)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            {isRtl ? 'الشعبة' : 'Filière'}
          </label>
          <select
            value={selectedFiliere}
            onChange={(e) => setSelectedFiliere(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="">-- {isRtl ? 'اختر الشعبة' : 'Sélectionnez une filière'} --</option>
            {filieres.map((f: any) => (
              <option key={f.id} value={f.id}>{f.name || f.code}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            {isRtl ? 'الدورة' : 'Semestre'}
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="">-- {isRtl ? 'اختر الدورة' : 'Tous les semestres'} --</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
              <option key={s} value={s}>Semestre {s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            {isRtl ? 'الوحدة' : 'Module'}
          </label>
          <select
            value={moduleId || ''}
            onChange={(e) => {
              if (e.target.value) {
                navigate(`/admin/grades/pv?module_id=${e.target.value}${selectedGroup ? `&group_id=${selectedGroup}` : ''}`);
              }
            }}
            disabled={modules.length === 0}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 disabled:opacity-50"
          >
            <option value="">-- {isRtl ? 'اختر الوحدة' : 'Sélectionnez un module'} --</option>
            {modules.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name || m.code}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            {isRtl ? 'الفوج (اختياري)' : 'Groupe (Optionnel)'}
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              if (moduleId) {
                navigate(`/admin/grades/pv?module_id=${moduleId}${e.target.value ? `&group_id=${e.target.value}` : ''}`);
              }
            }}
            disabled={groupes.length === 0}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 disabled:opacity-50"
          >
            <option value="">-- {isRtl ? 'جميع الأفواج' : 'Tous les groupes'} --</option>
            {groupes.map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )

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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetchPV()}
            className="rounded-xl flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="bg-[#0f2863] text-white rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-[#1a387e] shadow-md"
          >
            {isExportingPdf ? <Spinner className="text-white" /> : <Download className="w-4 h-4" />}
            Télécharger PDF Officiel
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl flex items-center gap-2 text-xs font-bold border-slate-300"
          >
            <Printer className="w-4 h-4" /> Aperçu Web
          </Button>
            <Button
              onClick={() => {
                window.open(`/api/modules/export-bulk-pv-zip?semester=${selectedSemester}`, '_blank')
              }}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-xs font-bold"
            >
              📦 Export ZIP (Tous les PVs)
            </Button>

            {pvData.signature ? (
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" /> PV Signé & Clôturé
              </span>
            ) : (
              <Button
                onClick={() => setShowSignatureModal(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-750 rounded-xl flex items-center gap-2 text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all"
              >
                ✍️ Signer le PV
              </Button>
            )}
        </div>
      </div>

      {/* Jury Committee Status Hub */}
      {juryStatus && (
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
                  window.open(`/api/v1/deliberations/export-pv-pdf?type=${pvType}&filiere_id=${selectedFiliere || 1}&semester_number=${selectedSemester || 1}`, '_blank')
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
                ? "bg-[#0f2863] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200"
            )}
          >
            Session de Rattrapage
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
              PROCES-VERBAL DE DELIBERATION - SESSION {session === 'normale' ? 'ORDINAIRE' : 'DE RATTRAPAGE'}
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
                  
                  {/* Dynamic assessment columns */}
                  {displayAssessments.map((a: any) => (
                    <th key={a.id} className="border border-slate-300 p-3 w-20">
                      {a.type} <span className="block text-[10px] font-medium text-slate-500">({a.weight}%)</span>
                    </th>
                  ))}

                  <th className="border border-slate-300 p-3 w-24 bg-slate-100/50">Moy. Normale</th>
                  <th className="border border-slate-300 p-3 w-20 bg-slate-100/50">Dés. Normale</th>

                  {/* Rattrapage columns if in Resit view */}
                  {session === 'rattrapage' && (
                    <>
                      <th className="border border-slate-300 p-3 w-28 bg-amber-50">Note Rattrapage</th>
                      <th className="border border-slate-300 p-3 w-24 bg-blue-50/50">Moy. Finale</th>
                      <th className="border border-slate-300 p-3 w-20 bg-blue-50/50">Dés. Finale</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {pvData.data.map((student: any, idx: number) => {
                  const isEligibleForRattrapage = student.decision_normale === 'R' || student.decision_normale === 'NV';
                  const rowGrades = student.grades_detail || {};

                  return (
                    <tr key={student.student_id} className="hover:bg-slate-50 transition-colors text-center font-medium">
                      <td className="border border-slate-300 p-3 text-left font-bold text-slate-500">{student.apogee}</td>
                      <td className="border border-slate-300 p-3 text-left font-bold text-slate-800 uppercase">
                        {student.last_name} {student.first_name}
                      </td>

                      {/* CC/Exam Grades */}
                      {displayAssessments.map((a: any) => {
                        const gradeInfo = rowGrades[a.type] || rowGrades[a.id] || {};
                        return (
                          <td key={a.id} className="border border-slate-300 p-3 font-semibold">
                            {gradeInfo.is_absent ? (
                              <span className="text-red-500 font-bold uppercase">ABI</span>
                            ) : (
                              gradeInfo.value !== null ? parseFloat(gradeInfo.value).toFixed(2) : '-'
                            )}
                          </td>
                        )
                      })}

                      {/* Moyenne Normale */}
                      <td className="border border-slate-300 p-3 bg-slate-100/20 font-bold text-sm text-[#0f2863]">
                        {student.moyenne_normale !== null ? parseFloat(student.moyenne_normale).toFixed(2) : '-'}
                      </td>

                      {/* Décision Normale */}
                      <td className="border border-slate-300 p-3 bg-slate-100/20">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          student.decision_normale === 'V' && "bg-green-50 text-green-700 border border-green-200",
                          student.decision_normale === 'R' && "bg-amber-50 text-amber-700 border border-amber-200",
                          student.decision_normale === 'NV' && "bg-red-50 text-red-700 border border-red-200"
                        )}>
                          {student.decision_normale || '-'}
                        </span>
                      </td>

                      {/* Rattrapage inputs / display */}
                      {session === 'rattrapage' && (
                        <>
                          <td className="border border-slate-300 p-3 bg-amber-50/10 font-semibold">
                            {isEligibleForRattrapage ? (
                              <div className="flex items-center gap-2 justify-center print:hidden">
                                <input
                                  type="text"
                                  placeholder="Note"
                                  value={rattrapageGrades[student.student_id]?.value || ''}
                                  disabled={rattrapageGrades[student.student_id]?.absent}
                                  onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                                  className="w-16 p-1 border rounded-lg text-center font-bold text-slate-800 focus:border-blue-500 outline-none"
                                />
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={rattrapageGrades[student.student_id]?.absent || false}
                                    onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                  />
                                  <span className="text-[10px] font-bold text-red-500">ABI</span>
                                </label>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Déjà Validé</span>
                            )}
                            {/* Hidden text showing resit notes during print */}
                            <span className="hidden print:inline font-bold">
                              {student.rattrapage_absent ? 'ABI' : (student.rattrapage_note !== null ? parseFloat(student.rattrapage_note).toFixed(2) : '-')}
                            </span>
                          </td>

                          {/* Moyenne Finale after resit */}
                          <td className="border border-slate-300 p-3 bg-blue-50/10 font-bold text-sm text-[#0f2863]">
                            {student.moyenne_finale !== null ? parseFloat(student.moyenne_finale).toFixed(2) : '-'}
                          </td>

                          {/* Décision Finale after resit */}
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
                })}
              </tbody>
            </table>
          </div>

          {/* Rattrapage Saving action bar: Hidden during print */}
          {session === 'rattrapage' && (
            <div className="mt-8 flex justify-end print:hidden">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-xl flex items-center gap-2 text-xs font-bold"
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
            {pvData.signature ? (
              <div className="flex flex-col items-center my-2">
                <img src={pvData.signature.signature_data} alt="Signature" className="h-16 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-1">{pvData.signature.signed_by}</p>
                <p className="text-[7px] text-slate-400 font-mono">IP: {pvData.signature.ip_address} | {new Date(pvData.signature.signed_at).toLocaleString('fr-FR')}</p>
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
    </div>
  )
}
