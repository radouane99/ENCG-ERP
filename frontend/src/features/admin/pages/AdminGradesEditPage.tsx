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

  // Fetch assessments for the given module
  const { data: assessmentsData, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['assessments', moduleId],
    queryFn: () => api.get(`/admin/modules/${moduleId}/assessments`).then(res => res.data.data),
    enabled: !!moduleId,
  })

  // Select the first assessment by default if available
  useEffect(() => {
    if (assessmentsData && assessmentsData.length > 0 && !selectedAssessmentId) {
      setSelectedAssessmentId(assessmentsData[0].id)
    }
  }, [assessmentsData, selectedAssessmentId])

  // Fetch students & grades for the selected assessment
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['grades', selectedAssessmentId],
    queryFn: () => api.get(`/admin/assessments/${selectedAssessmentId}/grades`).then(res => res.data.data),
    enabled: !!selectedAssessmentId,
  })

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
      return api.post(`/admin/assessments/${selectedAssessmentId}/grades`, payload)
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
          <select 
            value={selectedAssessmentId || ''} 
            onChange={e => setSelectedAssessmentId(parseInt(e.target.value, 10))}
            className="w-full md:w-1/3 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:border-[hsl(var(--color-primary))] outline-none"
          >
            <option value="" disabled>-- {isRtl ? 'التقييم' : 'Choisir une évaluation'} --</option>
            {assessmentsData?.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.type} (Poids: {a.weight}%)
              </option>
            ))}
          </select>
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
    </div>
  )
}
