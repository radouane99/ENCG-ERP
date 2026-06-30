import { useState } from 'react'
import { Search, BookOpen, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function BorrowingsPage() {
  const [borrowings] = useState([
    { id: 'EMP-001', student: 'Ahmed Alami', book: 'Principes de Management', borrowDate: '2026-06-10', returnDate: '2026-06-25', status: 'overdue' },
    { id: 'EMP-002', student: 'Sara Tazi', book: 'Comptabilité Générale', borrowDate: '2026-06-20', returnDate: '2026-07-05', status: 'active' },
    { id: 'EMP-003', student: 'Omar Bennis', book: 'Droit des Affaires', borrowDate: '2026-05-10', returnDate: '2026-05-25', status: 'returned' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suivi des Emprunts (Bibliothèque)</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les prêts de livres, les retours et les retards.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex gap-4">
           <div className="relative w-full max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input type="text" placeholder="Rechercher par étudiant ou livre..." className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg" />
           </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">Étudiant</th>
              <th className="px-6 py-3 font-semibold">Livre</th>
              <th className="px-6 py-3 font-semibold">Date d'emprunt</th>
              <th className="px-6 py-3 font-semibold">Date limite</th>
              <th className="px-6 py-3 font-semibold text-center">Statut</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {borrowings.map(b => (
              <tr key={b.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 font-bold">{b.student}</td>
                <td className="px-6 py-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-muted-foreground"/> {b.book}</td>
                <td className="px-6 py-4 text-muted-foreground">{b.borrowDate}</td>
                <td className="px-6 py-4 font-medium">{b.returnDate}</td>
                <td className="px-6 py-4 text-center">
                   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-max mx-auto", 
                     b.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                     b.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-200' :
                     'bg-green-50 text-green-600 border-green-200'
                   )}>
                     {b.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                     {b.status === 'active' ? 'En cours' : b.status === 'overdue' ? 'En retard' : 'Retourné'}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {b.status !== 'returned' && (
                    <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/20 transition-colors">
                      Marquer retourné
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
