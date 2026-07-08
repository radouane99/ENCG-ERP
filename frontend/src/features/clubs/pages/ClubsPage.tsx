import { useState } from 'react'
import { Search, Users, Calendar, Award } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ClubsPage() { 
  const { t } = useTranslation('modules');

  const [clubs] = useState([
    { id: 1, name: 'BDE ENCG', category: 'Bureau', members: 45, status: 'Actif' },
    { id: 2, name: 'Club Enactus', category: 'Social', members: 120, status: 'Actif' },
    { id: 3, name: 'Club Rotaract', category: 'Social', members: 85, status: 'Actif' },
    { id: 4, name: 'ENCG IT Club', category: 'Technologie', members: 60, status: 'Actif' },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('clubs.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('clubs.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {clubs.map(c => (
          <div key={c.id} className="bg-card border rounded-2xl shadow-sm p-5 hover:border-primary/40 transition-all cursor-pointer">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-lg">{c.name}</h3>
             <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.category}</span>
             
             <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 font-bold"><Users className="w-4 h-4 text-muted-foreground"/> {c.members}</div>
                <div className="text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium text-xs">{c.status}</div>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
