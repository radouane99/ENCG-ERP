import { useState } from 'react'
import { AlertOctagon, Scale, ShieldAlert, CheckCircle } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function DisciplinePage() {
  const [records] = useState([
    { id: 1, student: 'Ahmed Alami', type: 'Fraude à l\'examen', date: '2026-06-15', status: 'pending', severity: 'high' },
    { id: 2, student: 'Sara Tazi', type: 'Absences injustifiées', date: '2026-05-20', status: 'resolved', severity: 'low' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-red-600 flex items-center gap-2">
            <Scale className="w-6 h-6" /> Conseil de Discipline
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les dossiers disciplinaires, convocations et sanctions.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">Étudiant</th>
              <th className="px-6 py-3 font-semibold">Motif</th>
              <th className="px-6 py-3 font-semibold">Date d'incident</th>
              <th className="px-6 py-3 font-semibold text-center">Sévérité</th>
              <th className="px-6 py-3 font-semibold text-center">Statut du conseil</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 font-bold">{r.student}</td>
                <td className="px-6 py-4 text-muted-foreground font-medium">{r.type}</td>
                <td className="px-6 py-4">{r.date}</td>
                <td className="px-6 py-4 text-center">
                   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border flex items-center justify-center gap-1 w-max mx-auto", 
                     r.severity === 'high' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
                      <AlertOctagon className="w-3 h-3"/> {r.severity === 'high' ? 'Grave' : 'Mineur'}
                   </span>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", 
                     r.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                      {r.status === 'resolved' ? 'Statué' : 'En attente de conseil'}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
