import { useState } from 'react'
import { Search, Plus, Ticket, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function TicketsPage() {
  const [tickets] = useState([
    { id: 'TKT-102', subject: 'Problème de connexion WiFi au Campus', category: 'Informatique', author: 'S. Alami', status: 'open', priority: 'high', date: 'Aujourd\'hui' },
    { id: 'TKT-101', subject: 'Demande de correction de note S3', category: 'Pédagogique', author: 'A. Tazi', status: 'in_progress', priority: 'medium', date: 'Hier' },
    { id: 'TKT-100', subject: 'Besoin d\'un nouveau badge', category: 'Administratif', author: 'Y. Benali', status: 'closed', priority: 'low', date: '22 Juin' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centre de Support (Tickets)</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les réclamations et requêtes des étudiants et professeurs.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
          <Plus className="w-4 h-4" /> Nouveau Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
           {/* Sidebar stats or filters */}
           <div className="bg-card border rounded-xl shadow-sm p-4 space-y-3">
             <h3 className="font-bold text-sm uppercase text-muted-foreground">Filtres</h3>
             <div className="space-y-2">
               {['Tous', 'Ouverts', 'En cours', 'Résolus'].map((f, i) => (
                 <button key={i} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors", i === 0 ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground")}>
                   {f}
                 </button>
               ))}
             </div>
           </div>
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-xl shadow-sm p-2 flex gap-2">
             <Search className="w-5 h-5 text-muted-foreground ml-2 my-auto" />
             <input type="text" placeholder="Rechercher un ticket..." className="w-full bg-transparent outline-none text-sm py-1" />
          </div>
          
          <div className="space-y-3">
            {tickets.map(t => (
              <div key={t.id} className="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded text-foreground">{t.category}</span>
                  </div>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", 
                    t.status === 'open' ? "bg-red-50 text-red-600 border-red-200" :
                    t.status === 'in_progress' ? "bg-blue-50 text-blue-600 border-blue-200" :
                    "bg-green-50 text-green-600 border-green-200"
                  )}>
                    {t.status === 'open' ? <AlertCircle className="w-3 h-3"/> : t.status === 'in_progress' ? <MessageSquare className="w-3 h-3"/> : <CheckCircle2 className="w-3 h-3"/>}
                    {t.status === 'open' ? 'Nouveau' : t.status === 'in_progress' ? 'En cours' : 'Résolu'}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{t.subject}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                   <span>Par {t.author}</span>
                   <span>•</span>
                   <span>{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
