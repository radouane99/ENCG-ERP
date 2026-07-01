import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Calendar, Landmark, Building } from 'lucide-react'

export default function AdminClubsPage() {
  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col items-center justify-center mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Building className="w-8 h-8 text-[#0f2863]" />
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Gestion des Clubs</h1>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">0 CLUB(S) ENREGISTRÉ(S)</p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-8">
        <Link to="/admin/clubs-room-requests" className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Building2 className="w-4 h-4 text-slate-400" />
          Demandes de Salles
        </Link>
        <Link to="/admin/clubs/calendar" className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Calendar className="w-4 h-4 text-blue-400" />
          Calendrier des Salles
        </Link>
        <Link to="/admin/club-finance" className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Landmark className="w-4 h-4 text-amber-500" />
          Demandes de Budget
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <Building className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-sm font-bold text-slate-700 mb-2">Aucun club enregistré</h3>
        <p className="text-xs text-slate-400">Les clubs créés par les étudiants apparaîtront ici.</p>
      </div>
    </div>
  )
}
