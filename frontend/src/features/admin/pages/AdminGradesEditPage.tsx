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

  const [showModalityModal, setShowModalityModal] = useState(false)
  const [modalityAssessments, setModalityAssessments] = useState<{ id: number | null; type: string; weight: number }[]>([])

  // Fetch assessments for the given module
  const { data: assessmentsData, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['assessments', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}/assessments`).then(res => res.data.data),
    enabled: !!moduleId,
  })

  // Fetch students & grades for the selected assessment
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['grades', selectedAssessmentId],
    queryFn: () => api.get(`/assessments/${selectedAssessmentId}/grades`).then(res => res.data.data),
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
      studentsData.forEach((student: any) => {
        initialGrades[student.student_id] = {
          value: student.value !== null ? String(student.value) : '',
          absent: student.is_absent || false,
        }
      })
      setGrades(initialGrades)
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
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">{isRtl ? 'إدخال النقاط' : 'Édition des Notes'}</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">{isRtl ? 'الرجاء إدخال النقاط بدقة' : 'Veuillez saisir les notes avec précision'}</p>
        </div>
        <Link to="/admin/grades" className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--color-primary))] transition-colors uppercase tracking-wide">
          <ArrowLeft className={cn("w-4 h-4", isRtl && "rotate-180")} /> 
          {isRtl ? 'العودة' : 'Retour'}
        </Link>
      </div>

      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl shadow-sm p-6 mb-6">
        <label className="block text-sm font-bold text-[hsl(var(--foreground))] mb-2">
          {isRtl ? 'اختر التقييم' : 'Sélectionner l\'Évaluation'}
        </label>
        {isLoadingAssessments ? (
          <Spinner />
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <select 
              value={selectedAssessmentId || ''} 
              onChange={e => setSelectedAssessmentId(parseInt(e.target.value, 10))}
              className="w-full sm:w-1/3 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:border-[hsl(var(--color-primary))] outline-none text-sm font-semibold text-[hsl(var(--foreground))]"
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

      {!selectedAssessmentId ? (
        <div className="text-center text-[hsl(var(--muted-foreground))] py-8">
          Veuillez sélectionner une évaluation pour saisir les notes.
        </div>
      ) : isLoadingStudents ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl shadow-sm overflow-hidden flex flex-col items-center">
          {/* Banner */}
          <div className="bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] p-8 text-white m-4 rounded-[1.5rem] shadow-md relative overflow-hidden w-[calc(100%-2rem)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
              <thead className="bg-[hsl(var(--muted)/50)] text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider border-y border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-4 text-start">{isRtl ? 'الطالب' : 'Étudiant'}</th>
                  <th className="px-6 py-4 text-center">Note (/20)</th>
                  <th className="px-6 py-4 text-center">Absent(e)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {studentsData?.map((student: any) => (
                  <tr key={student.student_id} className="hover:bg-[hsl(var(--muted)/30)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                          {student.first_name.substring(0, 1)}{student.last_name.substring(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-[hsl(var(--foreground))] text-sm">{student.first_name} {student.last_name}</div>
                          <div className="text-[10px] text-[hsl(var(--muted-foreground))] font-bold uppercase tracking-wider">
                            {student.apogee || student.student_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number"
                        step="0.25"
                        min="0"
                        max="20"
                        value={grades[student.student_id]?.value ?? ''}
                        disabled={grades[student.student_id]?.absent}
                        onChange={(e) => handleInputChange(student.student_id, 'value', e.target.value)}
                        className="w-24 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-bold text-[hsl(var(--foreground))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary))/20] transition-all outline-none disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox"
                        checked={grades[student.student_id]?.absent ?? false}
                        onChange={(e) => handleInputChange(student.student_id, 'absent', e.target.checked)}
                        className="w-5 h-5 rounded border-[hsl(var(--border))] text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 w-full flex justify-end border-t border-[hsl(var(--border))]">
            <Button 
              type="submit" 
              className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))/90] text-white font-bold py-6 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-3"
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
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
              ⚙️ {isRtl ? 'تهيئة نظام التقييم' : 'Configuration des Modalités'}
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6 font-medium">
              Définissez les évaluations (CC1, CC2, Examen...) et leurs coefficients. La somme totale des poids doit être égale à 100%.
            </p>

            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2">
              {modalityAssessments.map((a, index) => (
                <div key={index} className="flex items-center gap-3 bg-[hsl(var(--muted)/5)] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold uppercase text-[hsl(var(--muted-foreground))] mb-1">Type d'évaluation</label>
                    <select
                      value={a.type}
                      onChange={(e) => updateModalityField(index, 'type', e.target.value)}
                      className="w-full p-2 text-sm font-semibold rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] outline-none"
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
                    <label className="block text-[9px] font-bold uppercase text-[hsl(var(--muted-foreground))] mb-1">Poids (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={a.weight}
                      onChange={(e) => updateModalityField(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 text-sm font-bold text-center rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] outline-none"
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
                <div className="text-center text-xs text-[hsl(var(--muted-foreground))] py-6 italic">
                  Aucune évaluation configurée. Cliquez sur ajouter pour commencer.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-t border-[hsl(var(--border))] pt-4 gap-4">
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
                  className="rounded-xl text-xs font-bold text-white bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))/90]"
                >
                  Enregistrer (100%)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
