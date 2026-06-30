import { useState } from 'react'
import { Award, Search, CheckCircle, Printer } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function DiplomasPage() {
  const [diplomas] = useState([
    { id: 'DIP-2026-001', student: 'Ahmed Alami', filiere: 'Gestion Financière et Comptable', year: '2025/2026', mention: 'Très Bien', status: 'ready' },
    { id: 'DIP-2026-002', student: 'Sara Tazi', filiere: 'Audit et Contrôle de Gestion', year: '2025/2026', mention: 'Bien', status: 'printed' },
    { id: 'DIP-2026-003', student: 'Omar Bennis', filiere: 'Marketing et Action Commerciale', year: '2025/2026', mention: 'Assez Bien', status: 'delivered' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-amber-600 flex items-center gap-2">
            <Award className="w-7 h-7" /> Édition des Diplômes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Génération, impression et suivi de la remise des diplômes.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium shadow-sm hover:bg-amber-600 text-sm">
          Générer la promotion 2026
        </button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex gap-4">
           <div className="relative w-full max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input type="text" placeholder="Rechercher un lauréat..." className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg" />
           </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">Référence</th>
              <th className="px-6 py-3 font-semibold">Lauréat</th>
              <th className="px-6 py-3 font-semibold">Filière</th>
              <th className="px-6 py-3 font-semibold text-center">Mention</th>
              <th className="px-6 py-3 font-semibold text-center">Statut</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {diplomas.map(d => (
              <tr key={d.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 font-mono font-bold text-xs">{d.id}</td>
                <td className="px-6 py-4 font-bold">{d.student}</td>
                <td className="px-6 py-4 text-muted-foreground">{d.filiere}</td>
                <td className="px-6 py-4 text-center font-medium">{d.mention}</td>
                <td className="px-6 py-4 text-center">
                   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border w-max mx-auto", 
                     d.status === 'ready' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                     d.status === 'printed' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                     'bg-green-50 text-green-600 border-green-200'
                   )}>
                      {d.status === 'ready' ? 'Prêt à l\'impression' : d.status === 'printed' ? 'Imprimé' : 'Remis au lauréat'}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {d.status === 'ready' && <button className="p-1.5 text-primary hover:bg-primary/10 rounded" title="Imprimer"><Printer className="w-4 h-4"/></button>}
                    {d.status === 'printed' && <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Marquer comme remis"><CheckCircle className="w-4 h-4"/></button>}
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
