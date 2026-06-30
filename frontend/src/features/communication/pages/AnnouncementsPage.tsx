import { useState } from 'react'
import { Bell, Plus, Calendar, User } from 'lucide-react'

export default function AnnouncementsPage() {
  const [announcements] = useState([
    { id: 1, title: 'Fermeture de la bibliothèque pour inventaire', date: '2026-06-28', author: 'Administration', type: 'Important' },
    { id: 2, title: 'Planning des examens S4', date: '2026-06-25', author: 'Service Scolarité', type: 'Scolarité' },
    { id: 3, title: 'Conférence sur l\'IA en finance', date: '2026-06-20', author: 'Club IT', type: 'Événement' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Annonces & Actualités</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez le panneau d'affichage numérique de l'ENCG.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Annonce
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map(a => (
          <div key={a.id} className="bg-card border rounded-xl p-5 shadow-sm hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
             <div className="flex justify-between items-start mb-3 pl-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded">{a.type}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3.5 h-3.5"/> {a.date}</span>
             </div>
             <h3 className="font-bold text-lg mb-2 pl-2">{a.title}</h3>
             <div className="flex items-center gap-1 text-sm text-muted-foreground pl-2 mt-4">
               <User className="w-4 h-4" /> Publié par {a.author}
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
