import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function ReservationCreatePage() {
  const [date, setDate] = useState('2026-07-01')
  const [startTime, setStartTime] = useState('--:--')
  const [endTime, setEndTime] = useState('--:--')
  const [room, setRoom] = useState('Amphi Ibn Khaldoun')
  
  const [hasConflict, setHasConflict] = useState(false)

  // Intelligent system mock logic
  useEffect(() => {
    if (date === '2026-07-01' && startTime === '14:30' && endTime === '16:30' && room === 'Amphi Ibn Khaldoun') {
      setHasConflict(true)
    } else {
      setHasConflict(false)
    }
  }, [date, startTime, endTime, room])

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Créer une Réservation de Salle</h1>
        </div>
        <Link to="/admin/reservations" className="px-5 py-2.5 bg-white border border-slate-200 text-[#0f2863] font-bold rounded-full hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
          Retour à la liste
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col items-center">
        {/* Blue Banner */}
        <div className="bg-[#0f2863] p-8 text-white m-4 rounded-[1.5rem] shadow-md relative overflow-hidden w-[calc(100%-2rem)] text-center">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
          <h2 className="text-2xl font-bold italic mb-2 relative z-10">Réservation Administrative</h2>
          <p className="text-blue-200 text-xs font-medium relative z-10 mx-auto">
            Planifiez une séance exceptionnelle pour un professeur dans l'une des salles disponibles de l'UPF.
          </p>
        </div>

        <form className="p-8 w-full max-w-3xl space-y-8">
          <h3 className="text-lg font-bold text-[#0f2863] italic mb-6">Détails de la Réservation</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur Bénéficiaire</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                <option>Radouane el asri (Génie Informatique)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Salle Allouée</label>
              <select 
                className="w-full rounded-2xl border border-blue-500 bg-white px-5 py-3.5 text-sm font-bold text-[#0f2863] shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              >
                <option value="Amphi Ibn Khaldoun">Amphi Ibn Khaldoun (Capacité: 200 places)</option>
                <option value="Salle TD 01">Salle TD 01 (Capacité: 40 places)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date de la Séance</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Statut de la Réservation</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                <option>Approuvé</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Heure Début</label>
              <input 
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Heure Fin</label>
              <input 
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Motif Académique / Pédagogique</label>
            <textarea 
              rows={3}
              placeholder="ex : Soutenance de Master, Séance exceptionnelle de rattrapage Flutter..."
              className={cn(
                "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none",
                hasConflict && "border-red-300 bg-red-50/30"
              )}
            ></textarea>
          </div>

          {hasConflict && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              Cette salle est déjà réservée sur ce créneau horaire.
            </div>
          )}

          <div className="pt-2">
            <button 
              type="button" 
              className="w-full py-4 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm tracking-wide shadow-md flex items-center justify-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" /> Créer la Réservation
            </button>
          </div>
        </form>

        <div className="w-full p-8 pt-0 max-w-3xl">
          <h4 className="text-sm font-bold text-[#0f2863] flex items-center gap-2 mb-4">
            <CalendarIcon className="w-4 h-4" /> Planning de la salle le mercredi 1 juillet 2026
          </h4>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
            <Sparkles className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <h5 className="font-bold text-emerald-800 mb-1">La salle est totalement libre ce jour-là !</h5>
            <p className="text-emerald-600/80 text-xs font-medium">Aucun cours ni réservation ne sont programmés.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
