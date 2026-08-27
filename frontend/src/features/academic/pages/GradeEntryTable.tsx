import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/Card'
import { Input } from '@shared/components/ui/Input'
import { Button } from '@shared/components/ui/Button'
import { toast } from 'sonner'
import { gradeEntrySchema, type GradeEntry } from '../../../schemas/grade.schema'
import { ZodError } from 'zod'

import { Badge } from '@shared/components/ui/Badge'
import LmdLegend from '@shared/components/academic/LmdLegend'

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@shared/lib/api'

type GradeRow = GradeEntry

export default function GradeEntryTable() {
  const [searchParams] = useSearchParams()
  const assessmentId = Number(searchParams.get('assessment_id') || searchParams.get('assessmentId') || 0)
  const [sessionType, setSessionType] = useState<'NORMALE' | 'RATTRAPAGE'>('NORMALE')
  const [grades, setGrades] = useState<Record<number, { value: number | ''; absent: boolean }>>({})

  const { data: studentsList = [] } = useQuery({
    queryKey: ['students-for-grades', assessmentId],
    enabled: assessmentId > 0,
    queryFn: async () => {
      const res = await api.get(`/assessments/${assessmentId}/grades`)
      const payload = res.data?.data ?? res.data?.students ?? res.data ?? []
      return Array.isArray(payload) ? payload : []
    },
  })

  useEffect(() => {
    if (studentsList.length > 0) {
      const initialGrades = studentsList.reduce((acc: Record<number, { value: number | ''; absent: boolean }>, student: any) => ({
        ...acc,
        [student.id ?? student.student_id]: {
          value: student.value ?? student.grade ?? '',
          absent: Boolean(student.absent ?? student.is_absent),
        },
      }), {})
      setGrades(initialGrades)
    }
  }, [studentsList])

  const displayedStudents = studentsList.filter((s: any) => sessionType === 'NORMALE' || (sessionType === 'RATTRAPAGE' && s.is_rattrapage))

  const handleValueChange = (studentId: number, val: string) => {
    const numericVal: number | '' = val === '' ? '' : parseFloat(val)
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], value: numericVal },
    }))
  }

  const handleAbsentChange = (studentId: number, checked: boolean) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], absent: checked, value: checked ? '' : prev[studentId].value },
    }))
  }

  const saveMutation = useMutation({
    mutationFn: (payload: { grades: GradeRow[] }) =>
      api.post(`/assessments/${assessmentId}/grades`, payload),
    onSuccess: () => toast.success('Notes enregistrées.'),
    onError: () => toast.error('Échec de l’enregistrement des notes.'),
  })

  const handleSave = async () => {
    if (!assessmentId) {
      toast.error('Sélectionnez une évaluation (assessment_id) avant d’enregistrer.')
      return
    }
    try {
      const payload = Object.entries(grades).map(([studentId, data]) => {
        return gradeEntrySchema.parse({
          student_id: parseInt(studentId),
          value: data.value === '' ? null : data.value,
          absent: data.absent,
        })
      })
      saveMutation.mutate({ grades: payload })
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error('Validation failed. Ensure all grades are between 0 and 20.')
      } else {
        toast.error('An error occurred while saving.')
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle>Saisie des Notes (CC / Exam / RAT)</CardTitle>
          <LmdLegend />
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as 'NORMALE' | 'RATTRAPAGE')}
            className="w-[180px] p-2 border rounded"
          >
            <option value="NORMALE">Session Normale</option>
            <option value="RATTRAPAGE">Session Rattrapage</option>
          </select>
        </div>
        <Button onClick={handleSave} disabled={!assessmentId || saveMutation.isPending}>
          Save All Grades
        </Button>
      </CardHeader>
      <CardContent>
        {!assessmentId ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Aucune évaluation sélectionnée. Passez `assessment_id` dans l’URL ou utilisez la grille notes officielle.
          </p>
        ) : displayedStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Aucun étudiant inscrit pour cette évaluation.</p>
        ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="p-3 font-medium">N° Apogée</th>
                <th className="p-3 font-medium">Nom & Prénom</th>
                <th className="p-3 font-medium w-32">Note (/20)</th>
                <th className="p-3 font-medium w-24 text-center">Absent</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((student: any) => {
                const id = student.id ?? student.student_id
                const row = grades[id] ?? { value: '', absent: false }
                return (
                <tr key={id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-mono">{student.apogee ?? student.student_number}</td>
                  <td className="p-3 font-medium flex items-center gap-2">
                    {student.name ?? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()}
                    {sessionType === 'RATTRAPAGE' && (
                      <Badge variant="destructive" className="text-[10px]">Rattrapage</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      max="20"
                      value={row.value}
                      disabled={row.absent}
                      onChange={(e) => handleValueChange(id, e.target.value)}
                      className={row.value !== '' && (row.value as number) < 10 ? 'text-destructive font-bold' : ''}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                      checked={row.absent}
                      onChange={(e) => handleAbsentChange(id, e.target.checked)}
                    />
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
