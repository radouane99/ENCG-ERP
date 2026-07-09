import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/Card'
import { Input } from '@shared/components/ui/Input'
import { Button } from '@shared/components/ui/Button'
import { toast } from 'sonner'
import { gradeEntrySchema } from '../../../schemas/grade.schema'
import { ZodError } from 'zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/Select'
import { Badge } from '@shared/components/ui/Badge'

// Dummy data for scaffolding
const MOCK_STUDENTS = [
  { id: 1, name: 'Amina Bennis', apogee: '19000123', is_rattrapage: false },
  { id: 2, name: 'Karim Tazi', apogee: '19000124', is_rattrapage: true },
  { id: 3, name: 'Sara Lahlou', apogee: '19000125', is_rattrapage: false },
]

export default function GradeEntryTable() {
  const [sessionType, setSessionType] = useState<'NORMALE' | 'RATTRAPAGE'>('NORMALE')
  const [grades, setGrades] = useState<Record<number, { value: number | ''; absent: boolean }>>(
    MOCK_STUDENTS.reduce((acc, student) => ({ ...acc, [student.id]: { value: '', absent: false } }), {})
  )

  const displayedStudents = MOCK_STUDENTS.filter(s => sessionType === 'NORMALE' || (sessionType === 'RATTRAPAGE' && s.is_rattrapage))

  const handleValueChange = (studentId: number, val: string) => {
    let numericVal: number | '' = val === '' ? '' : parseFloat(val)
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

  const handleSave = async () => {
    try {
      // Validate all grades
      const payload = Object.entries(grades).map(([studentId, data]) => {
        return gradeEntrySchema.parse({
          student_id: parseInt(studentId),
          value: data.value === '' ? null : data.value,
          absent: data.absent,
        })
      })

      // TODO: API Call
      console.log('Bulk Save Payload:', payload)
      toast.success('Grades saved successfully.')
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
          <CardTitle>Saisie des Notes (CC - Management)</CardTitle>
          <Select value={sessionType} onValueChange={(val: any) => setSessionType(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NORMALE">Session Normale</SelectItem>
              <SelectItem value="RATTRAPAGE">Session Rattrapage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave}>Save All Grades</Button>
      </CardHeader>
      <CardContent>
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
              {displayedStudents.map((student) => (
                <tr key={student.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-mono">{student.apogee}</td>
                  <td className="p-3 font-medium flex items-center gap-2">
                    {student.name}
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
                      value={grades[student.id].value}
                      disabled={grades[student.id].absent}
                      onChange={(e) => handleValueChange(student.id, e.target.value)}
                      className={grades[student.id].value !== '' && (grades[student.id].value as number) < 10 ? 'text-destructive font-bold' : ''}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                      checked={grades[student.id].absent}
                      onChange={(e) => handleAbsentChange(student.id, e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
