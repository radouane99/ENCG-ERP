import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building, ArrowLeft, Check, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AdminClubsRoomRequestsPage() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  
  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-center mb-12 relative">
        <Link to="/admin/clubs" className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-1">
            <Building className="w-6 h-6 text-[#0f2863]" />
            <h1 className="text-xl font-bold text-[#0f2863] italic">Demandes de Salles — Clubs</h1>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            APPROUVER OU REFUSER LES RÉSERVATIONS DEMANDÉES PAR LES PRÉSIDENTS DE CLUBS
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setFilter('pending')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            filter === 'pending' ? "bg-amber-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          {filter === 'pending' && <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20"><ClockIcon className="w-3 h-3" /></span>}
          En attente <span className="opacity-70">(0)</span>
        </button>
        <button 
          onClick={() => setFilter('approved')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            filter === 'approved' ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          {filter === 'approved' ? <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20"><Check className="w-3 h-3" /></span> : <Check className="w-4 h-4 text-emerald-500" />}
          Approuvées <span className="opacity-70">(0)</span>
        </button>
        <button 
          onClick={() => setFilter('rejected')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            filter === 'rejected' ? "bg-red-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          {filter === 'rejected' ? <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20"><X className="w-3 h-3" /></span> : <X className="w-4 h-4 text-red-500" />}
          Refusées <span className="opacity-70">(0)</span>
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            filter === 'all' ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <Building className="w-4 h-4 opacity-50" />
          Toutes
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <Building className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-sm font-bold text-slate-700 mb-2">Aucune demande de salle</h3>
        <p className="text-xs text-slate-400">Les présidents de clubs peuvent en soumettre depuis leur dashboard.</p>
      </div>
    </div>
  )
}

function ClockIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
