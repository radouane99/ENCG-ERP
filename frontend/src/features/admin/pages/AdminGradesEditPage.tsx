import { useState, FormEvent, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Spinner } from '@shared/components/ui/Spinner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function AdminGradesEditPage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [searchParams] = useSearchParams()
  const moduleId = searchParams.get('module_id')
  const queryClient = useQueryClient()

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null)
  const [grades, setGrades] = useState<Record<number, { value: string; absent: boolean }>>({})
  const [grades2, setGrades2] = useState<Record<number, { value: string; absent: boolean }>>({})
  const [isDoubleSaisie, setIsDoubleSaisie] = useState(false)
  const currentGroupId = searchParams.get('group_id')
  const [viewAllGroups, setViewAllGroups] = useState(!currentGroupId || currentGroupId === 'null' || currentGroupId === 'all')
  const [showAuditLogsDrawer, setShowAuditLogsDrawer] = useState(false)

  const [showModalityModal, setShowModalityModal] = useState(false)
  const [modalityAssessments, setModalityAssessments] = useState<{ id: number | null; type: string; weight: number }[]>([])

  // Query audit logs
  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['module-audit-logs', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/audit-logs`).then(res => res.data),
    enabled: !!moduleId && showAuditLogsDrawer,
  })

  // Fetch assessments for the given module
  const { data: assessmentsData, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['assessments', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/assessments`).then(res => res.data.data),
    enabled: !!moduleId,
  })

  // Fetch students & grades for the selected assessment
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['grades', selectedAssessmentId, currentGroupId, viewAllGroups],
    queryFn: () => api.get(`/assessments/${selectedAssessmentId}/grades`, {
      params: { group_id: viewAllGroups ? 'all' : (currentGroupId && currentGroupId !== 'null' ? currentGroupId : 'all') }
    }).then(res => res.data.data),
    enabled: !!selectedAssessmentId,
  })

  useEffect(() => {
    if (assessmentsData) {
      setModalityAssessments(
        assessmentsData.map((a: any) => ({
          id: a.id,
          type: a.type,
          weight: a.weight
        }))
      )
    }
  }, [assessmentsData, showModalityModal])

  const addModalityRow = () => {
    setModalityAssessments(prev => [...prev, { id: null, type: 'CC', weight: 0 }])
  }

  const removeModalityRow = (index: number) => {
    setModalityAssessments(prev => prev.filter((_, i) => i !== index))
  }

  const updateModalityField = (index: number, field: 'type' | 'weight', value: any) => {
    setModalityAssessments(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const handleSaveModality = async () => {
    const sum = modalityAssessments.reduce((acc, curr) => acc + curr.weight, 0)
    if (modalityAssessments.length > 0 && Math.abs(sum - 100) > 0.01) {
      toast.error(isRtl ? 'يجب أن يكون مجموع الأوزان 100%' : 'La somme des poids doit être égale à 100%')
      return
    }

    try {
      const response = await api.post(`/modules/${moduleId}/assessments`, {
        assessments: modalityAssessments
      })
      toast.success(isRtl ? 'تم حفظ نظام التقييم بنجاح' : 'Modalités d\'évaluation enregistrées avec succès')
      queryClient.invalidateQueries({ queryKey: ['assessments', moduleId] })
      setShowModalityModal(false)
      if (response.data.data && response.data.data.length > 0) {
        setSelectedAssessmentId(response.data.data[0].id)
      } else {
        setSelectedAssessmentId(null)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la configuration')
    }
  }

  // Select the first assessment by default if available
  useEffect(() => {
    if (assessmentsData && assessmentsData.length > 0 && !selectedAssessmentId) {
      setSelectedAssessmentId(assessmentsData[0].id)
    }
  }, [assessmentsData, selectedAssessmentId])

  // Initialize local state when students are loaded
  useEffect(() => {
    if (studentsData) {
      const initialGrades: Record<number, { value: string; absent: boolean }> = {}
      const initialGrades2: Record<number, { value: string; absent: boolean }> = {}
      studentsData.forEach((student: any) => {
        const val = student.value !== null ? String(student.value) : ''
        const abs = student.is_absent || false
        initialGrades[student.student_id] = { value: val, absent: abs }
        initialGrades2[student.student_id] = { value: val, absent: abs }
      })
      setGrades(initialGrades)
      setGrades2(initialGrades2)
    }
  }, [studentsData])

  const handleInputChange = (id: number, field: 'value' | 'absent', val: string | boolean) => {
    setGrades(prev => {
      const studentData = prev[id] || { value: '', absent: false }
      if (field === 'absent') {
        return { ...prev, [id]: { ...studentData, absent: val as boolean, value: val ? '' : studentData.value } }
      } else {
        const cleanValue = (val as string).replace(',', '.')
        return { ...prev, [id]: { ...studentData, value: cleanValue } }
      }
    })
  }

  const handleInputChange2 = (id: number, field: 'value' | 'absent', val: string | boolean) => {
    setGrades2(prev => {
      const studentData = prev[id] || { value: '', absent: false }
      if (field === 'absent') {
        return { ...prev, [id]: { ...studentData, absent: val as boolean, value: val ? '' : studentData.value } }
      } else {
        const cleanValue = (val as string).replace(',', '.')
        return { ...prev, [id]: { ...studentData, value: cleanValue } }
      }
    })
  }

  // Fetch module details for dynamic filename export
  const { data: moduleDetails } = useQuery({
    queryKey: ['module-details', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}`).then(res => res.data.data || res.data),
    enabled: !!moduleId,
  })

  const handleExportExcel = async () => {
    try {
      const selectedAssessment = assessmentsData?.find((a: any) => a.id === selectedAssessmentId)
      const assessmentType = selectedAssessment ? selectedAssessment.type : 'Saisie'
      const moduleCode = moduleDetails?.code || `MOD_${moduleId}`
      const rawModuleName = moduleDetails?.name || 'Module'
      const cleanModuleName = rawModuleName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_')
      
      const fileName = `Canevas_Notes_${moduleCode}_${cleanModuleName}_${assessmentType}.xlsx`

      const response = await api.get(`/modules/${moduleId}/export-grades`, {
        params: { group_id: viewAllGroups ? 'all' : searchParams.get('group_id') },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(isRtl ? `تم تحميل كشف النقاط: ${fileName}` : `Canevas Excel (${fileName}) téléchargé avec succès !`)
    } catch (err) {
      toast.error(isRtl ? 'حدث خطأ أثناء تحميل الملف' : 'Erreur lors du téléchargement du canevas Excel.')
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const toastId = toast.loading(isRtl ? 'جاري استيراد النقاط...' : 'Importation des notes en cours...')
    try {
      const res = await api.post(`/modules/${moduleId}/import-grades`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.dismiss(toastId)
      toast.success(res.data.message || "Notes importées avec succès !")
      if (res.data.warnings && res.data.warnings.length > 0) {
        res.data.warnings.forEach((warn: string) => {
          toast.warning(warn, { duration: 6000 })
        })
      }
      queryClient.invalidateQueries({ queryKey: ['grades', selectedAssessmentId] })
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err.response?.data?.message || "Erreur lors de l'importation du fichier Excel.")
      if (err.response?.data?.details) {
        toast.error(err.response.data.details, { duration: 6000 })
      }
    }
  }

  // Mutation to save grades
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post(`/assessments/${selectedAssessmentId}/grades`, payload)
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم حفظ النقاط بنجاح' : 'Notes enregistrées avec succès')
      queryClient.invalidateQueries({ queryKey: ['grades', selectedAssessmentId] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Erreur lors de la sauvegarde'))
    }
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!selectedAssessmentId) return;

    if (isDoubleSaisie) {
      const hasDifferences = Object.keys(grades).some(studentIdStr => {
        const studentId = parseInt(studentIdStr, 10)
        const g1 = grades[studentId]
        const g2 = grades2[studentId]
        return g1?.value !== g2?.value || g1?.absent !== g2?.absent
      })

      if (hasDifferences) {
        toast.error(isRtl ? 'يرجى تصحيح الفروقات بين السطرين قبل الحفظ' : "Veuillez résoudre les écarts de Saisie 1 et Saisie 2 avant d'enregistrer.")
        return
      }
    }

    const payload = {
      grades: Object.keys(grades).map(studentIdStr => {
        const studentId = parseInt(studentIdStr, 10)
        const data = grades[studentId]
        return {
          student_id: studentId,
          value: data.value === '' ? null : parseFloat(data.value),
          absent: data.absent
        }
      })
    }
    
    saveMutation.mutate(payload)
  }

  const selectedAssessment = assessmentsData?.find((a: any) => a.id === selectedAssessmentId)

  if (!moduleId) {
    return <div className="p-8 text-center text-red-500">Erreur : module_id manquant.</div>
  }

  return (
    <div className="space-y-8 animate-in p-4 md:p-6 max-w-[1200px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{isRtl ? 'إدخال النقاط' : 'Édition des Notes'}</h1>
          <p className="text-[var(--muted-foreground)] mt-2">{isRtl ? 'الرجاء إدخال النقاط بدقة' : 'Veuillez saisir les notes avec précision'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAuditLogsDrawer(true)}
            className="rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider h-10 shadow-sm"
          >
            📋 Historique d'Audit
          </Button>
          <Link 
            to={`/admin/grades/pv?filiere_id=${searchParams.get('filiere_id') || ''}&semester=${searchParams.get('semester') || ''}&module_id=${moduleId}`}
            className="flex items-center gap-2 text-xs font-bold text-[#0f2863] hover:text-[#1a387e] bg-blue-50 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-sm h-10"
          >
            📊 {isRtl ? 'معاينة المحضر' : 'Consulter le PV'}
          </Link>
          <Link to="/admin/grades" className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--color-primary)] transition-colors bg-slate-50 px-4 py-2.5 rounded-xl uppercase tracking-wider h-10">
            <ArrowLeft className={cn("w-3.5 h-3.5", isRtl && "rotate-180")} /> 
            {isRtl ? 'العودة' : 'Retour'}
          </Link>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
              {isRtl ? 'اختر التقييم' : 'Sélectionner l\'Évaluation'}
            </label>
            {isLoadingAssessments ? (
              <Spinner />
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <select 
                  value={selectedAssessmentId || ''} 
                  onChange={e => setSelectedAssessmentId(parseInt(e.target.value, 10))}
                  className="w-full sm:w-1/3 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:border-[var(--color-primary)] outline-none text-sm font-semibold text-[var(--foreground)]"
                >
                  <option value="" disabled>-- {isRtl ? 'التقييم' : 'Choisir une évaluation'} --</option>
                  {assessmentsData?.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.type} (Poids: {a.weight}%)
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModalityModal(true)}
                  className="rounded-xl font-bold uppercase tracking-wider text-xs px-4"
                >
                  ⚙️ Configurer les modalités
                </Button>
              </div>
            )}
          </div>

          <div className="border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:ps-6 flex flex-wrap gap-6 items-center">
            <div>
              <span className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Périmètre de saisie
              </span>
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setViewAllGroups(false)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                    !viewAllGroups
                      ? "bg-[#0f2863] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Par Groupe
                </button>
                <button
                  type="button"
                  onClick={() => setViewAllGroups(true)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                    viewAllGroups
                      ? "bg-[#0f2863] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Module Complet
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Saisie Double
              </span>
              <button
                type="button"
                onClick={() => setIsDoubleSaisie(!isDoubleSaisie)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider w-fit border flex items-center justify-center gap-1.5 h-10",
                  isDoubleSaisie
                    ? "bg-red-50 text-red-700 border-red-200 shadow-sm animate-pulse"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                {isDoubleSaisie ? '🛑 Activée (Double Saisie)' : '🗂️ Mode Double Saisie'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!selectedAssessmentId ? (
        <div className="text-center text-[var(--muted-foreground)] py-8">
          Veuillez sélectionner une évaluation pour saisir les notes.
        </div>
      ) : isLoadingStudents ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden flex flex-col items-center">
          {/* Banner */}
          <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-8 text-white m-4 rounded-[1.5rem] shadow-md relative overflow-hidden w-[calc(100%-2rem)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 block">
                {isRtl ? 'تقييم' : 'Évaluation'}
              </span>
              <h2 className="text-2xl font-bold mb-1">{selectedAssessment?.type}</h2>
              <div className="flex items-center gap-3">
                <p className="text-white/90 text-sm">Poids : {selectedAssessment?.weight}%</p>
                <Badge variant="success" className="bg-white/20 text-white border-none">{isRtl ? 'دورة عادية' : 'Session Ordinaire'}</Badge>
              </div>
            </div>

            {/* Import / Export Action Buttons */}
            <div className="relative z-10 flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={handleExportExcel}
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                📥 {isRtl ? 'تحميل كشف Excel' : 'Canevas Excel'}
              </button>
              <label className="cursor-pointer bg-white text-[#0f2863] hover:bg-white/90 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                📤 {isRtl ? 'استيراد النقاط' : 'Importer Excel'}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-2xl p-4 min-w-[120px] backdrop-blur-md">
              <span className="text-3xl font-bold text-white mb-1">{studentsData?.length || 0}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest text-center">
                {isRtl ? 'الطلاب' : 'Étudiants'}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="w-full px-4 overflow-x-auto pb-4">
            <table className="w-full text-sm text-start border-collapse min-w-[800px]">
              <thead className="bg-[color-mix(in srgb, var(--muted) 5000%, transparent)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider border-y border-[var(--border)]">
                <tr>
                  <th className="px-6 py-4 text-start">{isRtl ? 'الطالب' : 'Étudiant'}</th>
                  {isDoubleSaisie ? (
                    <>
                      <th className="px-6 py-4 text-center">Note 1 (Prof)</th>
                      <th className="px-6 py-4 text-center">Absent(e) 1</th>
                      <th className="px-6 py-4 text-center">Note 2 (Vérif)</th>
                      <th className="px-6 py-4 text-center">Absent(e) 2</th>
                      <th className="px-6 py-4 text-center">Statut</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-center">Note (/20)</th>
                      <th className="px-6 py-4 text-center">Absent(e)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {studentsData?.map((student: any) => {
                  const s1 = grades[student.student_id];
                  const s2 = grades2[student.student_id];
                  const hasConflict = isDoubleSaisie && (s1?.value !== s2?.value || s1?.absent !== s2?.absent);

                  return (
                    <tr key={student.student_id} className={cn("hover:bg-[color-mix(in srgb, var(--muted) 3000%, transparent)] transition-colors group", hasConflict && "bg-red-50/70 hover:bg-red-100/70 dark:bg-red-950/20 border-l-4 border-l-red-500")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                            {student.first_name.substring(0, 1)}{student.last_name.substring(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--foreground)] text-sm">{student.first_name} {student.last_name}</div>
                            <div className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-wider">
                              {student.apogee || student.student_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      {isDoubleSaisie ? (
                        <>
                          {/* Saisie 1 */}
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              value={grades[student.student_id]?.value ?? ''}
                              disabled={grades[student.student_id]?.absent}
                              onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                              className="w-24 text-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-bold text-[var(--foreground)] focus:border-[var(--color-primary)] outline-none disabled:opacity-50"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={grades[student.student_id]?.absent ?? false}
                              onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                              className="w-5 h-5 rounded border-[var(--border)] text-[var(--color-primary)]"
                            />
                          </td>
                          {/* Saisie 2 */}
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              value={grades2[student.student_id]?.value ?? ''}
                              disabled={grades2[student.student_id]?.absent}
                              onChange={(e) => handleInputChange2(student.student_id, 'value', e.target.value)}
                              className="w-24 text-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-bold text-[var(--foreground)] focus:border-[var(--color-primary)] outline-none disabled:opacity-50"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={grades2[student.student_id]?.absent ?? false}
                              onChange={(e) => handleInputChange2(student.student_id, 'absent', e.target.checked)}
                              className="w-5 h-5 rounded border-[var(--border)] text-[var(--color-primary)]"
                            />
                          </td>
                          {/* Conflict Status */}
                          <td className="px-6 py-4 text-center font-bold">
                            {hasConflict ? (
                              <span className="text-red-600 bg-red-100/80 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 w-fit mx-auto border border-red-200">
                                ⚠️ Écart
                              </span>
                            ) : (
                              <span className="text-emerald-600 bg-emerald-100/80 px-2.5 py-1 rounded-lg text-xs w-fit mx-auto">
                                ✓ Conforme
                              </span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              value={grades[student.student_id]?.value ?? ''}
                              disabled={grades[student.student_id]?.absent}
                              onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                              className="w-24 text-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-bold text-[var(--foreground)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)/20] transition-all outline-none disabled:opacity-50"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={grades[student.student_id]?.absent ?? false}
                              onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                              className="w-5 h-5 rounded border-[var(--border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 w-full flex justify-between items-center border-t border-[var(--border)]">
            <Link 
              to={`/admin/grades/pv?filiere_id=${searchParams.get('filiere_id') || ''}&semester=${searchParams.get('semester') || ''}&module_id=${moduleId}`}
              className="flex items-center gap-2 text-xs font-bold text-[#0f2863] hover:text-[#1a387e] bg-blue-50 px-5 py-3.5 rounded-2xl transition-all uppercase tracking-wider shadow-sm"
            >
              📊 {isRtl ? 'معاينة المحضر' : 'Consulter le PV de Module'}
            </Link>
            <Button 
              type="submit" 
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)/90] text-white font-bold py-6 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-3"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Spinner className="text-white" /> : <Save className="w-5 h-5" />}
              {isRtl ? 'حفظ النقاط' : 'Enregistrer les Notes'}
            </Button>
          </div>
        </form>
      )}

      {/* Modality Settings Modal */}
      {showModalityModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
              ⚙️ {isRtl ? 'تهيئة نظام التقييم' : 'Configuration des Modalités'}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6 font-medium">
              Définissez les évaluations (CC1, CC2, Examen...) et leurs coefficients. La somme totale des poids doit être égale à 100%.
            </p>

            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2">
              {modalityAssessments.map((a, index) => (
                <div key={index} className="flex items-center gap-3 bg-[color-mix(in srgb, var(--muted) 500%, transparent)] p-3 rounded-xl border border-[var(--border)]">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold uppercase text-[var(--muted-foreground)] mb-1">Type d'évaluation</label>
                    <select
                      value={a.type}
                      onChange={(e) => updateModalityField(index, 'type', e.target.value)}
                      className="w-full p-2 text-sm font-semibold rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] outline-none"
                    >
                      <option value="CC">Contrôle Continu</option>
                      <option value="CC1">CC1</option>
                      <option value="CC2">CC2</option>
                      <option value="Exam">Examen</option>
                      <option value="TP">Travaux Pratiques</option>
                      <option value="Oral">Oral</option>
                      <option value="Projet">Projet</option>
                      <option value="Rattrapage">Rattrapage</option>
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-[9px] font-bold uppercase text-[var(--muted-foreground)] mb-1">Poids (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={a.weight}
                      onChange={(e) => updateModalityField(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 text-sm font-bold text-center rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModalityRow(index)}
                    className="self-end p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-100/50 mt-1"
                  >
                    🗑️
                  </button>
                </div>
              ))}

              {modalityAssessments.length === 0 && (
                <div className="text-center text-xs text-[var(--muted-foreground)] py-6 italic">
                  Aucune évaluation configurée. Cliquez sur ajouter pour commencer.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-t border-[var(--border)] pt-4 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={addModalityRow}
                className="rounded-xl text-xs font-bold py-3"
              >
                ➕ Ajouter
              </Button>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModalityModal(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveModality}
                  className="rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary)/90]"
                >
                  Enregistrer (100%)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Audit Logs Drawer */}
      {showAuditLogsDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end print:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setShowAuditLogsDrawer(false)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-[#0f2863] dark:text-white">📋 Historique d'Audit</h3>
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider mt-0.5">Traçabilité des opérations de notes</p>
              </div>
              <button 
                onClick={() => setShowAuditLogsDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-100 dark:bg-slate-800 p-2 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingLogs ? (
                <div className="flex justify-center p-12"><Spinner /></div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900 flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">{log.description}</p>
                      <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-600 dark:text-slate-400">✓ {log.causer_name}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  Aucun historique d'audit disponible pour ce module.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
