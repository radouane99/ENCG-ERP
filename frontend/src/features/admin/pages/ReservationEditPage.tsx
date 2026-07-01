import { Link } from 'react-router-dom'
import { Save } from 'lucide-react'

export default function ReservationEditPage() {
  return (
    <div className="space-y-8 animate-in p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Modifier la Réservation de Salle</h1>
        </div>
        <Link to="/admin/reservations" className="px-5 py-2.5 bg-white border border-slate-200 text-[#0f2863] font-bold rounded-full hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
          Retour à la liste
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col items-center pb-8">
        {/* Green Banner */}
        <div className="bg-emerald-600 p-8 text-white m-4 rounded-[1.5rem] shadow-md w-[calc(100%-2rem)]">
          <h2 className="text-2xl font-bold italic mb-2">Ajuster la Réservation</h2>
          <p className="text-emerald-50 text-xs font-medium">
            Modifiez le professeur, changez la salle allouée, ou déplacez le créneau horaire de la réservation.
          </p>
        </div>

        <form className="p-8 w-full max-w-3xl space-y-8">
          <h3 className="text-lg font-bold text-[#0f2863] italic mb-6">Modifier les Détails</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur Bénéficiaire</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none">
                <option>Radouane el asri (Génie Informatique)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Salle Allouée</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none">
                <option>Salle TD 01 (Capacité: 40 places)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date de la Séance</label>
              <input 
                type="date"
                defaultValue="2026-05-29"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Statut de la Réservation</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none">
                <option>Approuvé</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Heure Début</label>
              <input 
                type="time"
                defaultValue="12:30"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Heure Fin</label>
              <input 
                type="time"
                defaultValue="14:00"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Motif Académique / Pédagogique</label>
            <textarea 
              rows={3}
              defaultValue="Soutenance"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none resize-none"
            ></textarea>
          </div>

          <div className="pt-2">
            <button 
              type="button" 
              className="w-full py-4 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm tracking-wide shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Sauvegarder les Modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
