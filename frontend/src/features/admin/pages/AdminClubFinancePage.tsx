import { Link } from 'react-router-dom'
import { Landmark, ArrowLeft } from 'lucide-react'

export default function AdminClubFinancePage() {
  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-center mb-12 relative">
        <Link to="/admin/clubs" className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-1">
            <Landmark className="w-6 h-6 text-[#0f2863]" />
            <h1 className="text-xl font-bold text-[#0f2863] italic">Demandes de Budget — Clubs</h1>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            GESTION FINANCIÈRE DES ACTIVITÉS PARA-UNIVERSITAIRES
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <Landmark className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-sm font-bold text-slate-700 mb-2">Aucune demande de budget</h3>
        <p className="text-xs text-slate-400">Les demandes de financement pour les événements apparaîtront ici.</p>
      </div>
    </div>
  )
}
