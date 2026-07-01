import { Link } from 'react-router-dom'

export default function CreateSchedulePage() {
  return (
    <div className="space-y-8 animate-in p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Planifier une Nouvelle Séance</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Vérification des conflits en temps réel</p>
        </div>
        <Link to="/admin/timetable/calendar" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
          Retour
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        {/* Dark Blue Banner */}
        <div className="bg-[#0f2863] p-10 text-white m-4 rounded-[1.5rem] shadow-md relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
          <h2 className="text-3xl font-bold italic mb-2 relative z-10">Nouvelle Affectation</h2>
          <p className="text-blue-200 text-sm font-medium max-w-lg relative z-10">
            Définissez le groupe, le module, le professeur et le créneau. Les conflits sont détectés automatiquement.
          </p>
        </div>

        <form className="p-10 space-y-8">
          <h3 className="text-xl font-bold text-[#0f2863] italic mb-6">Détails de la Séance</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Groupe / Promotion</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                <option>— Sélectionner —</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Module Enseigné</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                <option>— Sélectionner —</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur En Charge</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                <option>— Sélectionner —</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Salle Allouée</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                <option>— Sélectionner —</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date de la Séance</label>
              <input 
                type="date"
                defaultValue="2026-07-01"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Horaires</label>
              <div className="flex items-center gap-4">
                <input 
                  type="time"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input 
                  type="time"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="button" 
              className="w-full py-4 bg-[#0f2863] text-white font-bold rounded-2xl hover:bg-[#1a387e] transition-colors text-sm tracking-wide shadow-md"
            >
              ✓ Enregistrer la Séance
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
