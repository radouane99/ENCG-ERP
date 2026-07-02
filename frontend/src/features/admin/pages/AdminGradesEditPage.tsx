import { useState, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, FileText, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Spinner } from '@shared/components/ui/Spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function AdminGradesEditPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('group_id')
  const moduleId = searchParams.get('module_id')
  const queryClient = useQueryClient()

  // MOCK DATA (In real app, fetch from API via useQuery using groupId and moduleId)
  const [students, setStudents] = useState([
    { id: 1, name: 'Aniss el alaoui', matricule: 'S20260001', cc1: '13.10', cc2: '11.50', examen: '7.60', final: '10.00' },
    { id: 2, name: 'Ahmed Naciri', matricule: 'S20260002', cc1: '9.70', cc2: '19.70', examen: '8.90', final: '11.22' },
    { id: 3, name: 'Ilyas Alaoui', matricule: 'S20260003', cc1: '13.70', cc2: '11.20', examen: '3.40', final: '11.62' },
    { id: 4, name: 'Youssef Chraibi', matricule: 'S20260004', cc1: '13.70', cc2: '18.60', examen: '16.10', final: '14.40' },
    { id: 5, name: 'Aya Bennis', matricule: 'S20260005', cc1: '17.80', cc2: '12.30', examen: '13.20', final: '13.94' },
  ])

  const getFinalColor = (noteStr: string) => {
    const note = parseFloat(noteStr)
    if (isNaN(note)) return 'text-[hsl(var(--foreground))]'
    return note >= 10 ? 'text-emerald-500' : 'text-[hsl(var(--color-destructive))]'
  }

  const handleInputChange = (id: number, field: string, value: string) => {
    // Allows comma to dot replacement on the fly
    const cleanValue = value.replace(',', '.')
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: cleanValue } : s))
  }

  // Mutation to save grades in batch
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/academic/grades/batch', payload)
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم حفظ النقاط بنجاح' : 'Notes enregistrées avec succès')
      queryClient.invalidateQueries({ queryKey: ['grades'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Erreur lors de la sauvegarde'))
    }
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    // Format payload for the backend API we just created
    const payload = {
      module_id: moduleId,
      academic_year_id: 1, // Static for now
      grades: students.map(s => ({
        student_id: s.id,
        value: parseFloat(s.final) || 0,
        type: 'normal'
      }))
    }
    
    saveMutation.mutate(payload)
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
          {isRtl ? 'العودة للمحدد' : 'Retour au sélecteur'}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl shadow-sm overflow-hidden flex flex-col items-center">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] p-8 text-white m-4 rounded-[1.5rem] shadow-md relative overflow-hidden w-[calc(100%-2rem)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 block">
              {isRtl ? 'مجموعة دراسية' : 'Groupe Académique'}
            </span>
            <h2 className="text-2xl font-bold mb-1">Génie Informatique - Groupe 1</h2>
            <div className="flex items-center gap-3">
              <p className="text-white/90 text-sm">GAMING (INF-107)</p>
              <Badge variant="success" className="bg-white/20 text-white border-none">{isRtl ? 'دورة عادية' : 'Session Ordinaire'}</Badge>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-2xl p-4 min-w-[120px] backdrop-blur-md">
            <span className="text-3xl font-bold text-white mb-1">{students.length}</span>
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest text-center">
              {isRtl ? 'الطلاب المسجلين' : 'Étudiants Inscrits'}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="w-full px-4 overflow-x-auto pb-4">
          <table className="w-full text-sm text-start border-collapse min-w-[800px]">
            <thead className="bg-[hsl(var(--muted)/50)] text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider border-y border-[hsl(var(--border))]">
              <tr>
                <th className="px-6 py-4">{isRtl ? 'الطالب' : 'Étudiant'}</th>
                <th className="px-6 py-4 text-center">CC 1 (20%)</th>
                <th className="px-6 py-4 text-center">CC 2 (20%)</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'الامتحان' : 'Examen'} (60%)</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'النتيجة النهائية' : 'Note Finale'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'الحالة' : 'Statut'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-[hsl(var(--muted)/30)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                        {student.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-[hsl(var(--foreground))] text-sm">{student.name}</div>
                        <div className="text-[10px] text-[hsl(var(--muted-foreground))] font-bold uppercase tracking-wider">
                          {student.matricule}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="text"
                      value={student.cc1}
                      onChange={(e) => handleInputChange(student.id, 'cc1', e.target.value)}
                      className="w-20 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-bold text-[hsl(var(--foreground))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary))/20] transition-all outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="text"
                      value={student.cc2}
                      onChange={(e) => handleInputChange(student.id, 'cc2', e.target.value)}
                      className="w-20 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-bold text-[hsl(var(--foreground))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary))/20] transition-all outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="text"
                      value={student.examen}
                      onChange={(e) => handleInputChange(student.id, 'examen', e.target.value)}
                      className="w-20 text-center rounded-xl border border-[hsl(var(--color-primary))/30] bg-[hsl(var(--color-primary))/5] px-3 py-2 text-sm font-bold text-[hsl(var(--foreground))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary))/30] transition-all outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("text-base font-black px-4 py-1.5 rounded-lg bg-[hsl(var(--muted)/50)]", getFinalColor(student.final))}>
                      {student.final}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {parseFloat(student.final) >= 10 ? (
                      <Badge variant="success" size="sm">{isRtl ? 'ناجح' : 'Validé'}</Badge>
                    ) : (
                      <Badge variant="destructive" size="sm">{isRtl ? 'استدراكية' : 'Rattrapage'}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Footer */}
        <div className="w-full bg-[hsl(var(--muted)/30)] border-t border-[hsl(var(--border))] p-6 flex items-center justify-between mt-auto">
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            {isRtl ? 'تأكد من مراجعة النقاط قبل الحفظ.' : 'Vérifiez les notes avant de sauvegarder.'}
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/grades')}>
              {isRtl ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={<Save size={16} />}
              isLoading={saveMutation.isPending}
              disabled={saveMutation.isPending}
            >
              {isRtl ? 'حفظ النقاط' : 'Enregistrer les notes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
