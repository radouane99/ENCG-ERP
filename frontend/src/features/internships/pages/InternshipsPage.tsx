import { useState } from 'react'
import { Search, Briefcase, MapPin, Calendar, Plus } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function InternshipsPage() {
  const [internships] = useState([
    { id: 1, student: 'Ahmed Alami', company: 'Bank of Africa', city: 'Casablanca', type: 'Stage d\'initiation', status: 'approved' },
    { id: 2, student: 'Sara Tazi', company: 'OCP Group', city: 'Khouribga', type: 'Stage technique', status: 'pending' },
    { id: 3, student: 'Omar Bennis', company: 'Deloitte', city: 'Rabat', type: 'PFE', status: 'active' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Stages</h1>
          <p className="text-muted-foreground text-sm mt-1">Suivi des conventions, affectations et évaluations de stages.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Convention
        </button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">Étudiant</th>
              <th className="px-6 py-3 font-semibold">Entreprise</th>
              <th className="px-6 py-3 font-semibold">Type de stage</th>
              <th className="px-6 py-3 font-semibold text-center">Statut</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {internships.map(i => (
              <tr key={i.id} className="hover:bg-muted/50 group">
                <td className="px-6 py-4 font-bold">{i.student}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 font-medium"><Briefcase className="w-4 h-4 text-muted-foreground"/> {i.company}</div>
                   <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1"><MapPin className="w-3.5 h-3.5"/> {i.city}</div>
                </td>
                <td className="px-6 py-4 text-muted-foreground font-medium">{i.type}</td>
                <td className="px-6 py-4 text-center">
                   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", 
                     i.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                     i.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 
                     'bg-amber-50 text-amber-600 border-amber-200')}>
                      {i.status === 'approved' ? 'Convention signée' : i.status === 'active' ? 'En cours' : 'En attente'}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/20 transition-colors">
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
