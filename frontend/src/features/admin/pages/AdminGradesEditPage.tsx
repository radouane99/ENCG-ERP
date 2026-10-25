import { useMemo, useState, FormEvent, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/Button';

import { Spinner } from '@shared/components/ui/Spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api'
import { toast } from 'sonner';

import './AdminGradesEditPage.css';

export default function AdminGradesEditPage() {
  const { i18n } = useTranslation('common');
  const isRtl = i18n.language === 'ar'
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module_id')
  const queryClient = useQueryClient()

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [grades, setGrades] = useState<Record<number, {
    value: string;
    absent: boolean;
}>>({});
  const [grades2, setGrades2] = useState<Record<number, {
    value: string;
    absent: boolean;
}>>({});
  const [isDoubleSaisie, setIsDoubleSaisie] = useState(false);
  const currentGroupId = searchParams.get('group_id')
  const [viewAllGroups, setViewAllGroups] = useState(!currentGroupId || currentGroupId === 'null' || currentGroupId === 'all');
  const [showAuditLogsDrawer, setShowAuditLogsDrawer] = useState(false);

  const [showModalityModal, setShowModalityModal] = useState(false);
  const [modalityAssessments, setModalityAssessments] = useState<{
    id: number | null;
    type: string;
    weight: number;
}[]>([]);
  const [rattrapageCap, setRattrapageCap] = useState<number>(12);

  // Query audit logs
  // Query audit logs
const { data: auditLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['module-audit-logs', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/audit-logs`).then(res => res.data?.data || (Array.isArray(res.data) ? res.data : [])),
    enabled: !!moduleId && showAuditLogsDrawer,
});

  // Fetch assessments for the given module
  // Fetch assessments for the given module
const { data: assessmentsData, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['assessments', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/assessments`).then(res => res.data.data),
    enabled: !!moduleId,
});

  // Fetch students & grades for the selected assessment
  // Fetch students & grades for the selected assessment
const { data: gradesResponse, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['grades', selectedAssessmentId, currentGroupId, viewAllGroups],
    queryFn: () => api.get(`/assessments/${selectedAssessmentId}/grades`, {
        params: { group_id: viewAllGroups ? 'all' : (currentGroupId && currentGroupId !== 'null' ? currentGroupId : 'all') }
    }).then(res => res.data),
    enabled: !!selectedAssessmentId,
});

  const studentsData = useMemo(() => (Array.isArray(gradesResponse?.data) ? gradesResponse.data : (Array.isArray(gradesResponse) ? gradesResponse : [])), [gradesResponse])
  const selectedAssessment = assessmentsData?.find((a: any) => a.id === selectedAssessmentId)
  const assessmentType = (selectedAssessment?.type || '').trim().toLowerCase()
  const isExamAssessment = assessmentType.includes('exam') || assessmentType.includes('rattrapage') || assessmentType === 'ef' || assessmentType === 'eo'

  // Important : Le verrouillage du PV d'examen ne bloque QUE la saisie de l'examen final !
  // Les contrôles continus (CC1, CC2, TP...) restent toujours ouverts et modifiables par l'enseignant.
  const isAssessmentLocked = (gradesResponse?.is_locked || false) && isExamAssessment
  const isModulePvSigned = Boolean(gradesResponse?.is_module_pv_signed || gradesResponse?.is_locked)
  void (isAssessmentLocked);
  const signatureInfo = gradesResponse?.signature

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
    // ── Exclude Rattrapage from ordinary session 100% sum check ───────────────
    // Rattrapage is a resit session (remplaces L'Examen / Cap 12/20) and is NOT part of ordinary session 100% sum.
    const ordinaryAssessments = modalityAssessments.filter(a => a.type !== 'Rattrapage')
    const sum = ordinaryAssessments.reduce((acc, curr) => acc + curr.weight, 0)

    if (ordinaryAssessments.length > 0 && Math.abs(sum - 100) > 0.01) {
      toast.error(
        isRtl
          ? 'يجب أن يكون مجموع أوزان الدورة العادية (CC + Examen) يساوي 100%'
          : 'La somme des poids de la session ordinaire (CC + Examen) doit être égale à 100%'
      )
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

  // Select the appropriate assessment by default if available
  useEffect(() => {
    if (assessmentsData && assessmentsData.length > 0 && !selectedAssessmentId) {
      const sessionParam = searchParams.get('session')
      if (sessionParam === 'rattrapage') {
        const rat = assessmentsData.find((a: any) => (a.type || '').toLowerCase().includes('rattrapage'))
        if (rat) {
          setSelectedAssessmentId(rat.id)
          return
        }
      } else {
        const nonRat = assessmentsData.find((a: any) => !(a.type || '').toLowerCase().includes('rattrapage'))
        if (nonRat) {
          setSelectedAssessmentId(nonRat.id)
          return
        }
      }
      setSelectedAssessmentId(assessmentsData[0].id)
    }
  }, [assessmentsData, selectedAssessmentId, searchParams])

  // Initialize local state when students are loaded
  useEffect(() => {
    if (studentsData) {
      const initialGrades: Record<number, { value: string; absent: boolean }> = {}
      const initialGrades2: Record<number, { value: string; absent: boolean }> = {}
      studentsData.forEach((student: any) => {
        const val = student.is_fraud ? '0' : (student.value !== null ? String(student.value) : '')
        const abs = student.is_fraud ? false : (student.is_absent || false)
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
  // Fetch module details for dynamic filename export
const { data: moduleDetails } = useQuery({
    queryKey: ['module-details', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}`).then(res => res.data.data || res.data),
    enabled: !!moduleId,
});

  const handleExportExcel = async () => {
    try {
      const selectedAssessment = assessmentsData?.find((a: any) => a.id === selectedAssessmentId)
      const assessmentType = selectedAssessment ? selectedAssessment.type : 'Saisie'
      const moduleCode = moduleDetails?.code || `MOD_${moduleId}`
      const rawModuleName = moduleDetails?.name || 'Module'
      const cleanModuleName = rawModuleName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_')
      
      const fileName = `Canevas_Notes_${moduleCode}_${cleanModuleName}_${assessmentType}.xlsx`

      const response = await api.get(`/modules/${moduleId}/export-grades`, {
        params: { 
          group_id: viewAllGroups ? 'all' : searchParams.get('group_id'),
          assessment_id: selectedAssessmentId || undefined
        },
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
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء تحميل الملف' : 'Erreur lors du téléchargement du canevas Excel.')
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    if (selectedAssessmentId) {
      formData.append('assessment_id', String(selectedAssessmentId))
    }

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
        if (res.data.warnings.length <= 3) {
          res.data.warnings.forEach((warn: string) => {
            toast.warning(warn, { duration: 5000 })
          })
        } else {
          toast.warning(isRtl ? `${res.data.warnings.length} تنبيهات أثناء الاستيراد` : `${res.data.warnings.length} avertissements lors de l'import (ex: ${res.data.warnings[0]})`, { duration: 6000 })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      queryClient.invalidateQueries({ queryKey: ['module-pv', moduleId] })
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err.response?.data?.message || "Erreur lors de l'importation du fichier Excel.")
      if (err.response?.data?.details) {
        toast.error(err.response.data.details, { duration: 6000 })
      }
    } finally {
      if (e.target) {
        e.target.value = ''
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
          version: studentsData.find((student: any) => Number(student.student_id) === studentId)?.version ?? 0,
          value: data.value === '' ? null : parseFloat(data.value),
          absent: data.absent
        }
      })
    }
    
    saveMutation.mutate(payload)
  }


  if (!moduleId) {
    return <div className="p-8 text-center text-red-500">Erreur : module_id manquant.</div>
  }

  const handleUnlockPv = async () => {
    if (!window.confirm(isRtl ? 'هل تريد فتح المحضر وإعادة تفعيل إدخال النقط؟' : 'Voulez-vous déverrouiller le PV et réautoriser la saisie des notes ?')) {
      return
    }
    try {
      const reason = window.prompt('Motif de réouverture du PV (10 caractères minimum) :')
      if (!reason || reason.trim().length < 10) { toast.error('Un motif précis est obligatoire.'); return }
      const res = await api.post(`/modules/${moduleId}/unlock-pv`, { session: 'normale', reason: reason.trim() })
      toast.success(res.data.message || 'PV déverrouillé avec succès !')
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      queryClient.invalidateQueries({ queryKey: ['module-pv', moduleId] })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du déverrouillage du PV')
    }
  }

  return (
    <div className="admin-grades-page">

      {/* Breadcrumb */}
      <nav className="agp-breadcrumb">
        <ul>
          <li><Link to="/admin">Admin</Link></li>
          <li><Link to="/admin/grades">Notes</Link></li>
          <li className="active">{isRtl ? 'تحرير' : 'Edition'}</li>
        </ul>
      </nav>

      {/* Header */}
      <div className="agp-header">
        <div>
          <h1 className="agp-title">{isRtl ? 'إدخال النقاط' : 'Edition des Notes'}</h1>
          <p className="agp-subtitle">{isRtl ? 'الرجاء إدخال النقاط بدقة' : 'Saisissez et validez les notes avec precision'}</p>
        </div>
        <div className="agp-header-actions">
          <button type="button" onClick={() => setShowAuditLogsDrawer(true)} className="agp-btn agp-btn-ghost">
            Historique Audit
          </button>
          <Link
            to={`/admin/grades/pv?filiere_id=${searchParams.get('filiere_id') || ''}&semester=${searchParams.get('semester') || ''}&module_id=${moduleId}`}
            className="agp-btn agp-btn-outline"
          >
            Consulter le PV
          </Link>
          <Link to="/admin/grades" className="agp-btn agp-btn-back">
            <ArrowLeft className={cn("w-3.5 h-3.5", isRtl && "rotate-180")} />
            {isRtl ? 'العودة' : 'Retour'}
          </Link>
        </div>
      </div>

      {/* PV Alert Banner */}
      {isModulePvSigned && (
        <div className={cn("agp-pv-alert", isExamAssessment ? "agp-pv-alert--exam" : "agp-pv-alert--cc")}>
          <div className="agp-pv-alert__icon">{isExamAssessment ? '🔒' : 'ℹ️'}</div>
          <div className="agp-pv-alert__body">
            <h3>
              {isExamAssessment
                ? "PROCES-VERBAL D'EXAMEN SCELLE & CLOTURE ELECTRONIQUEMENT"
                : "PROCES-VERBAL D'EXAMEN SCELLE — SAISIE DES CONTROLES OUVERTE"}
            </h3>
            <p>
              {isExamAssessment ? (
                <>PV signe et scelle par <strong>{signatureInfo?.signed_by || "l'Enseignant Responsable"}</strong> ({signatureInfo?.signed_at ? new Date(signatureInfo.signed_at).toLocaleDateString('fr-FR') : 'Cloture'}). La saisie des notes d'examen est definitivement verrouillee.</>
              ) : (
                <>PV d'examen final scelle. <strong>La saisie du CC ({selectedAssessment?.type || 'CC'}) reste pleinement ouverte</strong>.</>
              )}
            </p>
          </div>
          <div className="agp-pv-alert__actions">
            <span className={cn("agp-badge", isExamAssessment ? "agp-badge--amber" : "agp-badge--green")}>
              {isExamAssessment ? 'Verrouille' : 'CC Ouvert'}
            </span>
            {isModulePvSigned && (
              <button type="button" onClick={handleUnlockPv} className="agp-btn-unlock">
                🔓 {isRtl ? 'فتح' : 'Deverrouiller'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Config Panel */}
      <div className="agp-config-panel">
        <div className="agp-config-panel__left">
          <span className="agp-section-label">{isRtl ? 'اختر التقييم' : 'Evaluation'}</span>
          {isLoadingAssessments ? (
            <Spinner />
          ) : (
            <div className="agp-assessment-tabs">
              {assessmentsData?.map((a: any) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAssessmentId(a.id)}
                  className={cn("agp-assessment-tab", selectedAssessmentId === a.id && "agp-assessment-tab--active")}
                >
                  <span className="agp-assessment-tab__name">{a.type}</span>
                  <span className="agp-assessment-tab__weight">{a.weight}%</span>
                </button>
              ))}
              <button type="button" onClick={() => setShowModalityModal(true)} className="agp-assessment-tab agp-assessment-tab--config">
                ⚙️ <span className="agp-assessment-tab__name">Configurer</span>
              </button>
            </div>
          )}
        </div>

        <div className="agp-config-panel__divider" />

        <div className="agp-config-panel__right">
          <div>
            <span className="agp-section-label">Perimetre</span>
            <div className="agp-toggle-group">
              <button type="button" onClick={() => setViewAllGroups(false)} className={cn("agp-toggle-btn", !viewAllGroups && "agp-toggle-btn--active")}>Par Groupe</button>
              <button type="button" onClick={() => setViewAllGroups(true)} className={cn("agp-toggle-btn", viewAllGroups && "agp-toggle-btn--active")}>Module Complet</button>
            </div>
          </div>
          <div>
            <span className="agp-section-label">Saisie Double</span>
            <button type="button" onClick={() => setIsDoubleSaisie(!isDoubleSaisie)} className={cn("agp-double-saisie-btn", isDoubleSaisie && "agp-double-saisie-btn--active")}>
              {isDoubleSaisie ? 'Activee' : 'Mode Double'}
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      {!selectedAssessmentId ? (
        <div className="agp-empty-state">
          <div className="agp-empty-state__icon">📝</div>
          <p>Selectionnez une evaluation ci-dessus pour saisir les notes</p>
        </div>
      ) : isLoadingStudents ? (
        <div className="agp-loading"><Spinner /></div>
      ) : (
        <form onSubmit={handleSubmit} className="agp-form-card">

          {/* Evaluation Banner */}
          <div className="agp-eval-banner">
            <div className="agp-eval-banner__orb" />
            <div className="agp-eval-banner__info">
              <span className="agp-eval-banner__label">{isRtl ? 'تقييم' : 'Evaluation en cours'}</span>
              <h2>{selectedAssessment?.type}</h2>
              <div className="agp-eval-banner__meta">
                <span>Coefficient : <strong>{selectedAssessment?.weight}%</strong></span>
                <span className="agp-session-badge">Session Ordinaire</span>
              </div>
            </div>

            <div className="agp-eval-banner__actions">
              <button type="button" onClick={handleExportExcel} className="agp-banner-btn">
                📥 Canevas Excel
              </button>
              <label className={cn("agp-banner-btn agp-banner-btn--white", isAssessmentLocked && "agp-banner-btn--disabled")}>
                📤 Importer Excel
                <input type="file" accept=".xlsx,.xls" disabled={isAssessmentLocked} onChange={handleImportExcel} className="hidden" />
              </label>
            </div>

            <div className="agp-eval-banner__stat">
              <span className="agp-eval-banner__stat-value">{studentsData?.length || 0}</span>
              <span className="agp-eval-banner__stat-label">{isRtl ? 'الطلاب' : 'Etudiants'}</span>
            </div>
          </div>

          {/* Table */}
          <div className="agp-table-wrapper">
            <table className="agp-table">
              <thead>
                <tr>
                  <th className="agp-th agp-th--left">{isRtl ? 'الطالب' : 'Etudiant'}</th>
                  {isDoubleSaisie ? (
                    <>
                      <th className="agp-th">Note 1</th>
                      <th className="agp-th">Absent 1</th>
                      <th className="agp-th">Note 2</th>
                      <th className="agp-th">Absent 2</th>
                      <th className="agp-th">Statut</th>
                    </>
                  ) : (
                    <>
                      <th className="agp-th">Note (/20)</th>
                      <th className="agp-th">Absent(e)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {studentsData?.map((student: any) => {
                  const s1 = grades[student.student_id]
                  const s2 = grades2[student.student_id]
                  const isFraud = student.is_fraud || student.has_exam_fraud
                  const hasConflict = isDoubleSaisie && (s1?.value !== s2?.value || s1?.absent !== s2?.absent)

                  return (
                    <tr key={student.student_id} className={cn("agp-tr", hasConflict && "agp-tr--conflict")}>
                      <td className="agp-td">
                        <div className="agp-student">
                          <div className={cn("agp-avatar", isFraud && (isExamAssessment ? "agp-avatar--red" : "agp-avatar--amber"))}>
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div className="agp-student__info">
                            <div className="agp-student__name">{student.first_name} {student.last_name}</div>
                            <div className="agp-student__apogee">{student.apogee || student.student_number}</div>
                            {isFraud && (
                              isExamAssessment ? (
                                <div className="agp-fraud-badge agp-fraud-badge--red" title={student.fraud_reason}>
                                  <span className="agp-fraud-dot agp-fraud-dot--pulse" /> FRAUDE PV EXAMEN (00/20 BLOQUE)
                                </div>
                              ) : (
                                <div className="agp-fraud-badge agp-fraud-badge--amber">
                                  <span className="agp-fraud-dot" /> FRAUDE EXAMEN (CC LIBRE)
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </td>

                      {isDoubleSaisie ? (
                        <>
                          <td className="agp-td agp-td--center">
                            <input type="number" step="0.25" min="0" max="20"
                              value={(isExamAssessment && isFraud) ? '0' : (grades[student.student_id]?.value ?? '')}
                              disabled={isAssessmentLocked || (isExamAssessment && isFraud) || grades[student.student_id]?.absent}
                              onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                              className={cn("agp-grade-input", (isExamAssessment && isFraud) && "agp-grade-input--fraud")}
                            />
                            {(isExamAssessment && isFraud) && <div className="agp-fraud-note">00/20</div>}
                          </td>
                          <td className="agp-td agp-td--center">
                            <input type="checkbox"
                              checked={(isExamAssessment && isFraud) ? false : (grades[student.student_id]?.absent ?? false)}
                              disabled={isAssessmentLocked || (isExamAssessment && isFraud)}
                              onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                              className="agp-checkbox"
                            />
                          </td>
                          <td className="agp-td agp-td--center">
                            <input type="number" step="0.25" min="0" max="20"
                              value={(isExamAssessment && isFraud) ? '0' : (grades2[student.student_id]?.value ?? '')}
                              disabled={isAssessmentLocked || (isExamAssessment && isFraud) || grades2[student.student_id]?.absent}
                              onChange={(e) => handleInputChange2(student.student_id, 'value', e.target.value)}
                              className={cn("agp-grade-input", (isExamAssessment && isFraud) && "agp-grade-input--fraud")}
                            />
                          </td>
                          <td className="agp-td agp-td--center">
                            <input type="checkbox"
                              checked={(isExamAssessment && isFraud) ? false : (grades2[student.student_id]?.absent ?? false)}
                              disabled={isAssessmentLocked || (isExamAssessment && isFraud)}
                              onChange={(e) => handleInputChange2(student.student_id, 'absent', e.target.checked)}
                              className="agp-checkbox"
                            />
                          </td>
                          <td className="agp-td agp-td--center">
                            {hasConflict
                              ? <span className="agp-status agp-status--conflict">Ecart</span>
                              : <span className="agp-status agp-status--ok">Conforme</span>}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="agp-td agp-td--center">
                            <input type="number" step="0.25" min="0" max="20"
                              value={(isExamAssessment && isFraud) ? '0' : (grades[student.student_id]?.value ?? '')}
                              disabled={isAssessmentLocked || (isExamAssessment && isFraud) || grades[student.student_id]?.absent}
                              onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                              className={cn("agp-grade-input", (isExamAssessment && isFraud) && "agp-grade-input--fraud")}
                            />
                            {(isExamAssessment && isFraud) && <div className="agp-fraud-note">00/20</div>}
                          </td>
                          <td className="agp-td agp-td--center">
                            <input type="checkbox"
                              checked={(isExamAssessment && isFraud) ? false : (grades[student.student_id]?.absent ?? false)}
                              disabled={isAssessmentLocked || (isExamAssessment && isFraud)}
                              onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                              className="agp-checkbox"
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="agp-form-footer">
            <Link
              to={`/admin/grades/pv?filiere_id=${searchParams.get('filiere_id') || ''}&semester=${searchParams.get('semester') || ''}&module_id=${moduleId}`}
              className="agp-btn agp-btn-outline"
            >
              Consulter le PV
            </Link>
            <button
              type="submit"
              className={cn("agp-btn-save", (saveMutation.isPending || isAssessmentLocked) && "agp-btn-save--disabled")}
              disabled={saveMutation.isPending || isAssessmentLocked}
            >
              {saveMutation.isPending ? <Spinner className="text-white" /> : <Save className="w-5 h-5" />}
              {isAssessmentLocked ? 'Examen Cloture & Verrouille' : (isRtl ? 'حفظ النقاط' : 'Enregistrer les Notes')}
            </button>
          </div>
        </form>
      )}

      {/* Modality Modal */}
      {showModalityModal && (
        <div className="agp-modal-overlay">
          <div className="agp-modal">
            <h3 className="agp-modal__title">Configuration des Modalites</h3>
            <p className="agp-modal__subtitle">Definissez les evaluations et leurs coefficients. La somme doit etre egale a 100%.</p>
            <div className="agp-modal__list">
              {modalityAssessments.map((a, index) => (
                <div key={index} className="agp-modality-row">
                  <div className="agp-modality-row__field">
                    <label className="agp-field-label">Type</label>
                    <select value={a.type} onChange={(e) => updateModalityField(index, 'type', e.target.value)} className="agp-select">
                      <option value="CC">Controle Continu</option>
                      <option value="CC1">CC1</option>
                      <option value="CC2">CC2</option>
                      <option value="Exam">Examen</option>
                      <option value="TP">Travaux Pratiques</option>
                      <option value="Oral">Oral</option>
                      <option value="Projet">Projet</option>
                      <option value="Rattrapage">Rattrapage</option>
                    </select>
                  </div>
                  <div className="agp-modality-row__weight">
                    <label className="agp-field-label">Poids (%)</label>
                    <input type="number" min="0" max="100" value={a.weight}
                      onChange={(e) => updateModalityField(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="agp-input agp-input--center"
                    />
                  </div>
                  <button type="button" onClick={() => removeModalityRow(index)} className="agp-btn-remove">🗑️</button>
                </div>
              ))}
              {modalityAssessments.length === 0 && <div className="agp-empty-list">Aucune evaluation configuree.</div>}
            </div>
            <div className="agp-rattrapage-cap">
              <div>
                <h4>Plafond Rattrapage</h4>
                <p>Note maximale apres deliberation de rattrapage</p>
              </div>
              <select value={rattrapageCap} onChange={(e) => setRattrapageCap(Number(e.target.value))} className="agp-select agp-select--sm">
                <option value={10}>10.00 / 20</option>
                <option value={12}>12.00 / 20 (LMD ENCG)</option>
                <option value={14}>14.00 / 20</option>
                <option value={20}>Sans Plafond</option>
              </select>
            </div>
            <div className="agp-modal__footer">
              <Button type="button" variant="outline" onClick={addModalityRow} className="rounded-xl text-xs font-bold py-3">Ajouter</Button>
              <div className="agp-modal__footer-actions">
                <Button type="button" variant="ghost" onClick={() => setShowModalityModal(false)} className="rounded-xl text-xs font-bold">Annuler</Button>
                <Button type="button" onClick={handleSaveModality} className="rounded-xl text-xs font-bold text-white bg-[var(--color-primary)]">Enregistrer (100%)</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Drawer */}
      {showAuditLogsDrawer && (
        <div className="agp-drawer-overlay">
          <div className="agp-drawer-backdrop" onClick={() => setShowAuditLogsDrawer(false)} />
          <div className="agp-drawer">
            <div className="agp-drawer__header">
              <div>
                <h3>Historique d'Audit</h3>
                <p>Tracabilite des operations de notes</p>
              </div>
              <button onClick={() => setShowAuditLogsDrawer(false)} className="agp-drawer__close">x</button>
            </div>
            <div className="agp-drawer__body">
              {isLoadingLogs ? (
                <div className="agp-loading"><Spinner /></div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="agp-audit-list">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="agp-audit-item">
                      <p>{log.description}</p>
                      <div className="agp-audit-item__meta">
                        <span>{log.causer_name}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="agp-empty-state"><p>Aucun historique disponible.</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}