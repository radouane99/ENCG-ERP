import { useState } from 'react'
import { Search, BookOpen, Clock, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function DocumentRequestsPage() {
  const [requests] = useState([
    { id: 'REQ-001', student: 'Ahmed Alami', type: 'Attestation de scolarité', date: '2026-06-25', status: 'pending' },
    { id: 'REQ-002', student: 'Sara Benali', type: 'Relevé de notes S3', date: '2026-06-24', status: 'approved' },
    { id: 'REQ-003', student: 'Omar Tazi', type: 'Convention de stage', date: '2026-06-22', status: 'rejected' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demandes de Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les demandes d'attestations et de relevés des étudiants.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex gap-4">
           <div className="relative w-full max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input type="text" placeholder="Rechercher une demande..." className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg" />
           </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">Référence</th>
              <th className="px-6 py-3 font-semibold">Étudiant</th>
              <th className="px-6 py-3 font-semibold">Document demandé</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold text-center">Statut</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 font-mono font-medium">{r.id}</td>
                <td className="px-6 py-4 font-medium">{r.student}</td>
                <td className="px-6 py-4 flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground"/> {r.type}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.date}</td>
                <td className="px-6 py-4 text-center">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", 
                    r.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                    r.status === 'approved' ? "bg-green-50 text-green-600 border-green-200" :
                    "bg-red-50 text-red-600 border-red-200"
                  )}>
                    {r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Prêt / Validé' : 'Refusé'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {r.status === 'pending' && <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/20 transition-colors">Traiter</button>}
                    {r.status === 'approved' && <button className="text-muted-foreground hover:text-primary p-1.5"><Download className="w-4 h-4"/></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
