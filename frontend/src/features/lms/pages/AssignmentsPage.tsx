import { useState } from 'react'
import { FileText, Calendar, UploadCloud, CheckCircle } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AssignmentsPage() {
  const [assignments] = useState([
    { id: 1, title: 'Étude de cas : Bilan comptable', course: 'Comptabilité Analytique', dueDate: '2026-06-30', status: 'pending' },
    { id: 2, title: 'Projet de recherche marketing', course: 'Marketing Stratégique', dueDate: '2026-06-15', status: 'submitted' },
    { id: 3, title: 'Synthèse du droit des sociétés', course: 'Droit des Affaires', dueDate: '2026-05-20', status: 'graded', grade: '16/20' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devoirs & Évaluations Continues</h1>
          <p className="text-muted-foreground text-sm mt-1">Consultez vos devoirs à rendre et vos notes d'évaluation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assignments.map(a => (
          <div key={a.id} className="bg-card border rounded-2xl shadow-sm p-6 hover:border-primary/40 transition-all">
             <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                   <FileText className="w-5 h-5" />
                </div>
                <span className={cn("text-xs font-bold px-2 py-1 rounded-full border", 
                  a.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  a.status === 'submitted' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  'bg-green-50 text-green-600 border-green-200'
                )}>
                  {a.status === 'pending' ? 'À rendre' : a.status === 'submitted' ? 'Soumis' : 'Noté'}
                </span>
             </div>
             
             <h3 className="font-bold text-lg leading-tight mb-1">{a.title}</h3>
             <p className="text-sm text-muted-foreground mb-4">{a.course}</p>
             
             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 p-2 rounded-lg mb-4">
                <Calendar className="w-4 h-4" /> 
                Échéance : {a.dueDate}
             </div>
             
             {a.status === 'pending' && (
               <button className="w-full bg-primary/10 text-primary hover:bg-primary/20 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                 <UploadCloud className="w-4 h-4" /> Déposer le travail
               </button>
             )}
             {a.status === 'submitted' && (
               <div className="w-full text-center text-sm font-medium text-muted-foreground py-2 flex items-center justify-center gap-2">
                 <CheckCircle className="w-4 h-4" /> En attente de correction
               </div>
             )}
             {a.status === 'graded' && (
               <div className="w-full text-center py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-lg font-black">
                 {a.grade}
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  )
}
